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
    // remove numeração de início ("1.", "1)", "01 -", "•", "*", "-", "–")
    .replace(/^\s*(?:\(?\d{1,3}[\.\)\-–:]|[•\-*·])\s*/g, " ")
    // remove pontuação
    .replace(/[^\w\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  const STOP = new Set([
    "a","o","as","os","de","do","da","dos","das","e","ou","em","no","na","nos","nas",
    "para","por","com","sem","que","se","um","uma","uns","umas","ao","aos","à","às",
    "seu","sua","seus","suas","voce","vc","é","ser","tem","the","of","muito","muita",
    "sempre","nunca","raramente","frequentemente","vezes","as","às","tao","tão",
  ]);
  return normalize(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t));
}

function trigrams(s: string): Set<string> {
  const n = normalize(s).replace(/\s+/g, "_");
  const out = new Set<string>();
  const t = `__${n}__`;
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}

function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((x) => { if (b.has(x)) inter++; });
  return (2 * inter) / (a.size + b.size);
}

function jaccardTokens(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => { if (B.has(t)) inter++; });
  const union = A.size + B.size - inter;
  return inter / union;
}

/** Score combinado (Jaccard + Dice de trigramas) — robusto a variações. */
function similarity(a: string, b: string): number {
  const j = jaccardTokens(a, b);
  const d = dice(trigrams(a), trigrams(b));
  return j * 0.6 + d * 0.4;
}

/** Detecta resposta em uma linha (após normalização). Retorna null se não for resposta. */
function detectResposta(linhaOriginal: string): number | null {
  const t = normalize(linhaOriginal);
  if (!t) return null;
  // Palavras — checar isoladamente (linha inteira sendo a resposta)
  const RESP: { re: RegExp; v: number }[] = [
    { re: /^\s*(?:r[:\-]?\s*)?nunca\s*$/, v: 0 },
    { re: /^\s*(?:r[:\-]?\s*)?jamais\s*$/, v: 0 },
    { re: /^\s*(?:r[:\-]?\s*)?raramente\s*$/, v: 25 },
    { re: /^\s*(?:r[:\-]?\s*)?quase\s*nunca\s*$/, v: 25 },
    { re: /^\s*(?:r[:\-]?\s*)?pouc[oa]s?\s*vezes\s*$/, v: 25 },
    { re: /^\s*(?:r[:\-]?\s*)?as\s*vezes\s*$/, v: 50 },
    { re: /^\s*(?:r[:\-]?\s*)?algumas\s*vezes\s*$/, v: 50 },
    { re: /^\s*(?:r[:\-]?\s*)?eventualmente\s*$/, v: 50 },
    { re: /^\s*(?:r[:\-]?\s*)?moderadamente\s*$/, v: 50 },
    { re: /^\s*(?:r[:\-]?\s*)?frequentemente\s*$/, v: 75 },
    { re: /^\s*(?:r[:\-]?\s*)?com\s*frequencia\s*$/, v: 75 },
    { re: /^\s*(?:r[:\-]?\s*)?muit[oa]s?\s*vezes\s*$/, v: 75 },
    { re: /^\s*(?:r[:\-]?\s*)?quase\s*sempre\s*$/, v: 75 },
    { re: /^\s*(?:r[:\-]?\s*)?sempre\s*$/, v: 100 },
    { re: /^\s*(?:r[:\-]?\s*)?totalmente\s*$/, v: 100 },
    { re: /^\s*(?:r[:\-]?\s*)?plenamente\s*$/, v: 100 },
  ];
  for (const { re, v } of RESP) if (re.test(t)) return v;

  // Também aceita padrão inline "resposta: nunca"
  const mInline = t.match(/(?:^|\s)(?:resposta|r)\s*[:\-]\s*(nunca|jamais|raramente|quase\s*nunca|pouc[oa]s?\s*vezes|as\s*vezes|algumas\s*vezes|eventualmente|moderadamente|frequentemente|com\s*frequencia|muit[oa]s?\s*vezes|quase\s*sempre|sempre|totalmente|plenamente)\b/);
  if (mInline) return detectResposta(mInline[1]);

  // Números isolados
  const mNum = t.match(/^\s*(\d{1,3})\s*$/);
  if (mNum) {
    const n = parseInt(mNum[1], 10);
    if (n >= 0 && n <= 4) return n * 25;
    if (n >= 0 && n <= 100) return Math.round(n / 25) * 25;
  }
  return null;
}

/** Extrai resposta escrita ao final de uma pergunta (ex.: "…muito rápido? Frequentemente"). */
function detectRespostaInline(linhaOriginal: string): number | null {
  const t = normalize(linhaOriginal);
  const m = t.match(/\b(nunca|jamais|raramente|quase\s*nunca|pouc[oa]s?\s*vezes|as\s*vezes|algumas\s*vezes|eventualmente|moderadamente|frequentemente|com\s*frequencia|muit[oa]s?\s*vezes|quase\s*sempre|sempre|totalmente|plenamente)\s*$/);
  if (m) return detectResposta(m[1]);
  return null;
}

/** Detecta linha do tipo "Função: X" / "Cargo - X" / "Setor / Função ..." */
function detectFuncao(linha: string): string | null {
  const m = linha.match(/^\s*(?:funcao|função|cargo|posto|colaborador\s*funcao|colaborador)\s*[:\-–=]\s*(.+)$/i);
  if (m) return m[1].trim().replace(/[.;]+$/, "");
  return null;
}

/* ─────────── Motor de parsing ─────────── */

type PerguntaCopsoq = { blocoKey: string; perguntaIdx: number; texto: string; trigs: Set<string> };

const TODAS_PERGUNTAS: PerguntaCopsoq[] = BLOCOS_COPSOQ.flatMap((b) =>
  b.perguntas.map((p, i) => ({
    blocoKey: b.key,
    perguntaIdx: i,
    texto: p,
    trigs: trigrams(p),
  })),
);

/** Melhor pergunta COPSOQ para uma linha (candidata) — retorna null se score muito baixo. */
function melhorPergunta(linha: string): { p: PerguntaCopsoq; score: number } | null {
  const linhaTri = trigrams(linha);
  let best: { p: PerguntaCopsoq; score: number } | null = null;
  for (const p of TODAS_PERGUNTAS) {
    const j = jaccardTokens(linha, p.texto);
    const d = dice(linhaTri, p.trigs);
    const s = j * 0.6 + d * 0.4;
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

/**
 * Parser tolerante:
 *  1. Normaliza tudo (case, acentos, tabs, pontuação, marcadores).
 *  2. Detecta blocos por "Função:" (opcional).
 *  3. Junta linhas contíguas de pergunta (não-vazias, sem resposta detectada)
 *     até formar uma pergunta reconhecível pelo COPSOQ.
 *  4. Para cada pergunta reconhecida, procura a próxima resposta válida
 *     (mesma linha ao final, próxima linha, ou próximas ignorando vazias),
 *     interrompendo se encontrar nova pergunta reconhecível.
 */
function parseTexto(texto: string, funcaoPadrao?: string): ParseResult {
  // Limpeza inicial: remove tabs, normaliza CRLF, remove BOM
  const bruto = String(texto || "").replace(/\uFEFF/g, "").replace(/\t+/g, " ");
  const linhasBrutas = bruto.split(/\r?\n/).map((l) => l.replace(/\s+$/g, ""));

  // Agrupa por função
  type Grupo = { funcao: string; linhas: string[] };
  const grupos: Grupo[] = [];
  let atual: Grupo | null = null;
  for (const l of linhasBrutas) {
    const trimmed = l.trim();
    const f = detectFuncao(trimmed);
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

  const SCORE_MIN = 0.22;         // limiar fuzzy p/ aceitar como pergunta COPSOQ
  const SCORE_MIN_FORTE = 0.4;    // se ≥ este limiar, aceita imediatamente (encerra concatenação)

  for (const g of grupos) {
    const av = emptyPsicossocial();
    av.funcao = g.funcao;
    av.data_avaliacao = new Date().toISOString().slice(0, 10);

    const linhas = g.linhas;
    let i = 0;
    let bufferPergunta = "";
    let bufferPeek: { p: PerguntaCopsoq; score: number } | null = null;

    const flushComResposta = (valor: number) => {
      if (!bufferPeek) return;
      const arr = [...(av.respostas[bufferPeek.p.blocoKey] || [])];
      arr[bufferPeek.p.perguntaIdx] = valor;
      av.respostas[bufferPeek.p.blocoKey] = arr;
      mapeadas++;
      bufferPergunta = "";
      bufferPeek = null;
    };
    const descartarBuffer = (motivo: string) => {
      if (bufferPeek) {
        ignoradas++;
        avisos.push(`Sem resposta detectada para: "${bufferPeek.p.texto}" (função ${g.funcao}) — ${motivo}.`);
      }
      bufferPergunta = "";
      bufferPeek = null;
    };

    while (i < linhas.length) {
      const linha = linhas[i];
      const trimmed = linha.trim();

      if (!trimmed) { i++; continue; }

      // Se a linha é apenas uma resposta e temos pergunta em buffer, associa.
      const respIsolada = detectResposta(trimmed);
      if (respIsolada != null && bufferPeek) {
        flushComResposta(respIsolada);
        i++;
        continue;
      }
      if (respIsolada != null && !bufferPeek) {
        // resposta órfã — ignora silenciosamente
        i++;
        continue;
      }

      // Tenta resposta inline no final da própria linha ("...trabalho? Frequentemente")
      const inline = detectRespostaInline(trimmed);

      // Concatena ao buffer de pergunta corrente
      const candidato = (bufferPergunta ? bufferPergunta + " " : "") + trimmed
        .replace(/\?\s*(nunca|jamais|raramente|quase\s*nunca|pouc[oa]s?\s*vezes|as\s*vezes|algumas\s*vezes|eventualmente|moderadamente|frequentemente|com\s*frequencia|muit[oa]s?\s*vezes|quase\s*sempre|sempre|totalmente|plenamente)\s*$/i, "?");

      const best = melhorPergunta(candidato);

      // Se buffer já casava com pergunta forte e a nova linha piora — assume nova pergunta.
      if (bufferPeek && best && best.score < bufferPeek.score * 0.85 && bufferPeek.score >= SCORE_MIN) {
        // A linha atual parece novo bloco. Descarta buffer antigo sem resposta.
        descartarBuffer("nova pergunta iniciou antes da resposta");
        // Reprocessa a linha atual como novo início
        bufferPergunta = trimmed;
        const b2 = melhorPergunta(trimmed);
        bufferPeek = b2 && b2.score >= SCORE_MIN ? b2 : null;
        if (inline != null && bufferPeek) flushComResposta(inline);
        i++;
        continue;
      }

      bufferPergunta = candidato;
      bufferPeek = best && best.score >= SCORE_MIN ? best : null;

      if (inline != null && bufferPeek) {
        flushComResposta(inline);
        i++;
        continue;
      }

      // Se o casamento é forte, procura a resposta nas próximas linhas não-vazias.
      if (bufferPeek && bufferPeek.score >= SCORE_MIN_FORTE) {
        let j = i + 1;
        let achou = false;
        while (j < linhas.length) {
          const t2 = linhas[j].trim();
          if (!t2) { j++; continue; }
          const r = detectResposta(t2);
          if (r != null) {
            flushComResposta(r);
            i = j + 1;
            achou = true;
            break;
          }
          // Se próxima linha também casa forte com outra pergunta, encerra sem resposta.
          const bb = melhorPergunta(t2);
          if (bb && bb.score >= SCORE_MIN_FORTE) {
            descartarBuffer("resposta ausente entre duas perguntas");
            break; // deixa o while externo reprocessar linha j
          }
          // Senão, pode ser continuação da pergunta seguinte ou lixo — para busca.
          break;
        }
        if (achou) continue;
      }

      i++;
    }
    // Buffer residual sem resposta
    descartarBuffer("fim do bloco alcançado");

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

      const incompletas = res.avaliacoes.filter((a) =>
        Object.values(a.respostas).some((arr) => arr.some((v) => v < 0)),
      ).length;

      if (incompletas > 0) {
        toast.warning(
          `${res.avaliacoes.length} avaliação(ões) vinculada(s). ${incompletas} contém respostas pendentes — complete-as na tela de edição antes de gerar o relatório consolidado.`,
        );
      } else {
        toast.success(
          `${res.avaliacoes.length} avaliação(ões) vinculada(s) — ${res.totalPerguntasMapeadas} respostas mapeadas. Gere o relatório consolidado na tela principal.`,
        );
      }
      onOpenChange(false);

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
