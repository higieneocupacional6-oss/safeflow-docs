import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { BLOCOS_COPSOQ, valorRiscoPergunta } from "@/lib/copsoqBlocos";
import {
  calcularPsicossocial,
  emptyPsicossocial,
  ESCALA_COPSOQ,
  type AvaliacaoPsicossocial,
} from "@/components/PsicossocialModal";
import type { RelatorioContext } from "@/lib/copsoqRelatorio";

/* ─────────── Utilidades de normalização / fuzzy ─────────── */

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  const STOP = new Set([
    "a","o","as","os","de","do","da","dos","das","e","ou","em","no","na","nos","nas",
    "para","por","com","sem","que","se","um","uma","uns","umas","ao","aos","à","às",
    "seu","sua","seus","suas","voce","vc","é","ser","tem","the","of",
  ]);
  return normalize(s).split(" ").filter((t) => t && !STOP.has(t));
}

function similarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => { if (B.has(t)) inter++; });
  const union = A.size + B.size - inter;
  return inter / union;
}

/** Mapa: label da escala → valor (0/25/50/75/100). Também suporta sinônimos. */
const ESCALA_MAP: { pattern: RegExp; value: number }[] = [
  { pattern: /\bnunca\b|\bjamais\b/i, value: 0 },
  { pattern: /\braramente\b|\bpouc[oa]s?\s*vezes\b|\bquase\s*nunca\b/i, value: 25 },
  { pattern: /\b(as|às)\s*vezes\b|\balgumas\s*vezes\b|\beventualmente\b|\bmoderadamente\b/i, value: 50 },
  { pattern: /\bfrequentemente\b|\bcom\s*frequencia\b|\bmuit[oa]s?\s*vezes\b|\bquase\s*sempre\b/i, value: 75 },
  { pattern: /\bsempre\b|\btotalmente\b|\bplenamente\b/i, value: 100 },
];

function detectResposta(linha: string): number | null {
  for (const { pattern, value } of ESCALA_MAP) {
    if (pattern.test(linha)) return value;
  }
  // números diretos: 0–100 ou 0–4
  const m = linha.match(/\b(\d{1,3})\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= 4) return n * 25;
    if (n >= 0 && n <= 100) return Math.round(n / 25) * 25;
  }
  return null;
}

/** Detecta linha do tipo "Função: X" / "Cargo - X" / "Setor / Função ..." */
function detectFuncao(linha: string): string | null {
  const m = linha.match(/^\s*(?:funcao|função|cargo|posto|colaborador\s*funcao)\s*[:\-–]\s*(.+)$/i);
  if (m) return m[1].trim().replace(/[.;]+$/, "");
  return null;
}

/* ─────────── Motor de parsing ─────────── */

type PerguntaCopsoq = { blocoKey: string; perguntaIdx: number; texto: string };

const TODAS_PERGUNTAS: PerguntaCopsoq[] = BLOCOS_COPSOQ.flatMap((b) =>
  b.perguntas.map((p, i) => ({ blocoKey: b.key, perguntaIdx: i, texto: p })),
);

function melhorPergunta(linha: string): { p: PerguntaCopsoq; score: number } | null {
  let best: { p: PerguntaCopsoq; score: number } | null = null;
  for (const p of TODAS_PERGUNTAS) {
    const s = similarity(linha, p.texto);
    if (!best || s > best.score) best = { p, score: s };
  }
  return best;
}

export type ParseResult = {
  avaliacoes: AvaliacaoPsicossocial[];
  totalPerguntasMapeadas: number;
  totalPerguntasIgnoradas: number;
  avisos: string[];
};

function parseTexto(texto: string, funcaoPadrao?: string): ParseResult {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const grupos: { funcao: string; linhas: string[] }[] = [];
  let atual: { funcao: string; linhas: string[] } | null = null;

  for (const l of linhas) {
    const f = detectFuncao(l);
    if (f) {
      atual = { funcao: f, linhas: [] };
      grupos.push(atual);
      continue;
    }
    if (!atual) {
      atual = { funcao: funcaoPadrao?.trim() || "Não informada", linhas: [] };
      grupos.push(atual);
    }
    atual.linhas.push(l);
  }

  const avaliacoes: AvaliacaoPsicossocial[] = [];
  const avisos: string[] = [];
  let mapeadas = 0;
  let ignoradas = 0;

  for (const g of grupos) {
    const av = emptyPsicossocial();
    av.funcao = g.funcao;
    av.data_avaliacao = new Date().toISOString().slice(0, 10);

    // Percorre linhas do grupo. Modelo: pergunta na linha N, resposta na linha N (após "?" ou ":") ou N+1.
    for (let i = 0; i < g.linhas.length; i++) {
      const linha = g.linhas[i];

      // Tenta separar "Pergunta? Resposta" na mesma linha
      let perguntaTxt = linha;
      let respostaTxt = "";
      const splitInline = linha.match(/^(.*?[?:\-–])\s*(.+)$/);
      if (splitInline) {
        perguntaTxt = splitInline[1];
        respostaTxt = splitInline[2];
      }

      const best = melhorPergunta(perguntaTxt);
      if (!best || best.score < 0.25) continue;

      // Resposta: 1) inline; 2) próxima linha; 3) linha seguinte que contenha escala
      let valor: number | null = respostaTxt ? detectResposta(respostaTxt) : null;
      if (valor == null && i + 1 < g.linhas.length) {
        valor = detectResposta(g.linhas[i + 1]);
        if (valor != null) i++; // consome próxima linha
      }
      if (valor == null) {
        ignoradas++;
        avisos.push(`Sem resposta detectada para: "${best.p.texto}" (função ${g.funcao}).`);
        continue;
      }

      const arr = [...(av.respostas[best.p.blocoKey] || [])];
      arr[best.p.perguntaIdx] = valor;
      av.respostas[best.p.blocoKey] = arr;
      mapeadas++;
    }

    // Só considera a avaliação se tiver pelo menos 1 resposta mapeada
    const totalRespondidas = Object.values(av.respostas).reduce(
      (acc, arr) => acc + arr.filter((v) => v >= 0).length,
      0,
    );
    if (totalRespondidas > 0) {
      avaliacoes.push(calcularPsicossocial(av));
    } else {
      avisos.push(`Nenhuma pergunta reconhecida para a função "${g.funcao}".`);
    }
  }

  return { avaliacoes, totalPerguntasMapeadas: mapeadas, totalPerguntasIgnoradas: ignoradas, avisos };
}

/* ─────────── Componente ─────────── */

export function PsicossocialTextInputModal({
  open,
  onOpenChange,
  relatorioContext,
  onImportado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  relatorioContext?: RelatorioContext;
  onImportado?: (avaliacoes: AvaliacaoPsicossocial[]) => void;
}) {
  const [funcao, setFuncao] = useState("");
  const [texto, setTexto] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [processando, setProcessando] = useState(false);

  const reset = () => {
    setFuncao("");
    setTexto("");
    setPreview(null);
    setProcessando(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const previa = useMemo(() => {
    if (!texto.trim()) return null;
    try {
      return parseTexto(texto, funcao);
    } catch {
      return null;
    }
  }, [texto, funcao]);

  const vincular = async () => {
    if (!texto.trim()) {
      toast.error("Cole o conteúdo do questionário.");
      return;
    }
    setProcessando(true);
    try {
      const res = parseTexto(texto, funcao);
      if (!res.avaliacoes.length) {
        toast.error("Nenhuma resposta pôde ser vinculada. Verifique o texto colado.");
        setPreview(res);
        return;
      }
      setPreview(res);
      onImportado?.(res.avaliacoes);

      // Gera relatório PDF por função automaticamente
      try {
        const { gerarRelatorioCopsoqPDF } = await import("@/lib/copsoqRelatorio");
        for (const av of res.avaliacoes) {
          gerarRelatorioCopsoqPDF([{ ...av, colaborador_nome: "" }], {
            ...(relatorioContext || {}),
            funcoes: [av.funcao || "Não informada"],
          });
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (e) {
        console.error("Falha ao gerar PDF automático:", e);
      }

      toast.success(
        `${res.avaliacoes.length} avaliação(ões) vinculada(s) — ${res.totalPerguntasMapeadas} respostas mapeadas.`,
      );
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao processar: " + (e?.message || ""));
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Escrever Questionário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cole o conteúdo recebido do colaborador. Pode conter <strong>várias funções</strong> —
            o sistema identifica cada bloco por linhas como <code>Função: Eletricista</code> e associa
            automaticamente cada pergunta ao COPSOQ, mesmo com pequenas diferenças de escrita.
          </p>

          <div className="grid gap-1.5">
            <Label htmlFor="psico-funcao">Função (opcional — usada se o texto não indicar)</Label>
            <Input
              id="psico-funcao"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              placeholder="Ex.: Eletricista"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="psico-texto">Questionário</Label>
            <Textarea
              id="psico-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={`Função: Eletricista

Seu trabalho exige que você trabalhe muito rápido?
Frequentemente

Seu trabalho exige prazos muito curtos?
Às vezes

...

Função: Mecânico

Seu trabalho exige que você trabalhe muito rápido?
Sempre
...`}
              className="min-h-[280px] font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Escalas aceitas: <em>Nunca, Raramente, Às vezes, Frequentemente, Sempre</em> — ou
              números 0–4 / 0–100.
            </p>
          </div>

          {/* Prévia */}
          {previa && previa.avaliacoes.length > 0 && (
            <Card className="p-3 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold">Prévia do reconhecimento</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previa.avaliacoes.map((a, i) => {
                  const respondidas = Object.values(a.respostas).reduce(
                    (acc, arr) => acc + arr.filter((v) => v >= 0).length,
                    0,
                  );
                  return (
                    <Badge key={i} variant="outline" className="text-[11px]">
                      {a.funcao} — {respondidas}/{TODAS_PERGUNTAS.length}
                    </Badge>
                  );
                })}
              </div>
              {previa.totalPerguntasIgnoradas > 0 && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {previa.totalPerguntasIgnoradas} pergunta(s) sem resposta detectada.
                </p>
              )}
            </Card>
          )}

          {preview && preview.avisos.length > 0 && (
            <ul className="text-[11px] text-amber-700 list-disc pl-4 space-y-0.5">
              {preview.avisos.slice(0, 6).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
              {preview.avisos.length > 6 && <li>… e mais {preview.avisos.length - 6} avisos.</li>}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Fechar</Button>
          <Button onClick={vincular} disabled={processando || !texto.trim()} className="gap-1.5">
            {processando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Vinculando…
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" /> Vincular
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
