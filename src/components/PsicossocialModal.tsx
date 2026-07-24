import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, FileDown, Trash2, AlertTriangle, AlertOctagon, Lightbulb, FileSpreadsheet, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { PsicossocialImportModal } from "@/components/PsicossocialImportModal";
import { PsicossocialTextInputModal } from "@/components/PsicossocialTextInputModal";

// ─── Escala fixa COPSOQ ───
export const ESCALA_COPSOQ = [
  { label: "Nunca", value: 0 },
  { label: "Raramente", value: 25 },
  { label: "Às vezes", value: 50 },
  { label: "Frequentemente", value: 75 },
  { label: "Sempre", value: 100 },
] as const;

// ─── Blocos e perguntas ───
// Reexportado de módulo-folha para evitar dependência circular
// (PsicossocialModal → PsicossocialImportModal → psicoImport → PsicossocialModal).
export { BLOCOS_COPSOQ } from "@/lib/copsoqBlocos";
import { BLOCOS_COPSOQ, valorRiscoPergunta, polaridadePergunta, avaliacaoCompleta, perguntasPendentes } from "@/lib/copsoqBlocos";

export type BlocoResultado = { media: number; classificacao: string };
export type AvaliacaoPsicossocial = {
  colaborador_nome: string;
  /** Função do respondente — usada para agrupamento em relatórios. */
  funcao?: string;
  data_avaliacao: string;
  respostas: Record<string, number[]>; // bloco_key → array de respostas
  blocos: Record<string, BlocoResultado>;
  alertas: {
    alerta_amarelo: boolean;
    alerta_vermelho: boolean;
    recomendacao_imediata: boolean;
  };
  resultado_psicossocial: string;
  riscos_psicossociais: string;
  total_positivas?: number;
  total_negativas?: number;
  copsoq_resultado_resumido?: string;
  copsoq_riscos_identificados?: string;
  /** Fatores de proteção identificados (blocos com risco Baixo/Moderado favorável). */
  fatores_protecao?: string[];
};

function valorRisco(valor: number, blocoKey: string, perguntaIdx: number): number {
  return valorRiscoPergunta(valor, blocoKey, perguntaIdx);
}

export const emptyPsicossocial = (): AvaliacaoPsicossocial => ({
  colaborador_nome: "",
  data_avaliacao: "",
  respostas: Object.fromEntries(
    BLOCOS_COPSOQ.map((b) => [b.key, new Array(b.perguntas.length).fill(-1)]),
  ),
  blocos: {},
  alertas: { alerta_amarelo: false, alerta_vermelho: false, recomendacao_imediata: false },
  resultado_psicossocial: "",
  riscos_psicossociais: "",
  total_positivas: 0,
  total_negativas: 0,
  copsoq_resultado_resumido: "",
  copsoq_riscos_identificados: "",
});

function classificar(media: number): string {
  if (media <= 25) return "Baixo";
  if (media <= 50) return "Moderado";
  if (media <= 75) return "Alto";
  return "Crítico";
}

function classBadgeColor(classif: string) {
  switch (classif) {
    case "Baixo": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Moderado": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Alto": return "bg-orange-100 text-orange-800 border-orange-300";
    case "Crítico": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}

// ─── Análise inteligente (contextual, considera fatores compensatórios e agravantes) ───
const TITULO_RISCO_MAP: Record<string, string> = {
  exigencias: "exigências elevadas / sobrecarga mental",
  controle: "baixa autonomia decisória",
  apoio: "falta de apoio de colegas e liderança",
  reconhecimento: "falta de reconhecimento e feedback",
  seguranca: "insegurança e insatisfação no trabalho",
  conflitos: "conflitos interpessoais, interferência trabalho-vida e risco de assédio",
  sintomas: "sinais de estresse, fadiga e burnout",
  lideranca: "fragilidade na qualidade da liderança",
};

const RISCO_TECNICO_MAP: Record<string, string> = {
  exigencias: "Sobrecarga mental e cognitiva",
  controle: "Baixa autonomia / falta de controle sobre o trabalho",
  apoio: "Baixo suporte social",
  reconhecimento: "Desvalorização profissional",
  seguranca: "Insegurança ocupacional",
  conflitos: "Conflitos interpessoais e risco de assédio moral",
  sintomas: "Estresse ocupacional e risco de burnout",
  lideranca: "Liderança injusta ou ausente",
};

function gerarAnalise(blocos: Record<string, BlocoResultado>) {
  const altos = Object.entries(blocos).filter(([, v]) => v.classificacao === "Alto");
  const criticos = Object.entries(blocos).filter(([, v]) => v.classificacao === "Crítico");
  const moderados = Object.entries(blocos).filter(([, v]) => v.classificacao === "Moderado");
  const baixos = Object.entries(blocos).filter(([, v]) => v.classificacao === "Baixo");

  const sintomas = blocos["sintomas"];
  const mediaSintomas = sintomas?.media ?? 0;

  const alerta_amarelo = altos.length >= 2 || moderados.length >= 4;
  const alerta_vermelho = criticos.length >= 1 || (altos.length >= 3 && mediaSintomas > 60);
  const recomendacao_imediata =
    mediaSintomas > 70 ||
    (blocos["conflitos"]?.classificacao === "Crítico") ||
    (blocos["lideranca"]?.classificacao === "Crítico");

  const destaques = [...criticos, ...altos]
    .map(([k]) => TITULO_RISCO_MAP[k] || k)
    .slice(0, 4);

  let nivel = "baixo";
  if (alerta_vermelho) nivel = "crítico";
  else if (alerta_amarelo) nivel = "alto";
  else if (moderados.length > 0) nivel = "moderado";

  // Fatores compensatórios (proteção)
  const protecoes: string[] = [];
  if ((blocos["apoio"]?.media ?? 100) <= 40) protecoes.push("bom nível de apoio social");
  if ((blocos["lideranca"]?.media ?? 100) <= 40) protecoes.push("liderança percebida como justa e presente");
  if ((blocos["controle"]?.media ?? 100) <= 40) protecoes.push("autonomia decisória preservada");
  if ((blocos["reconhecimento"]?.media ?? 100) <= 40) protecoes.push("reconhecimento e feedback adequados");
  if ((blocos["seguranca"]?.media ?? 100) <= 40) protecoes.push("estabilidade percebida no emprego");

  // Fatores agravantes (combinação clássica: alta demanda + baixo controle + baixo apoio)
  const agravantes: string[] = [];
  const exig = blocos["exigencias"]?.media ?? 0;
  const ctrl = blocos["controle"]?.media ?? 0;
  const apoio = blocos["apoio"]?.media ?? 0;
  const rec = blocos["reconhecimento"]?.media ?? 0;
  const lider = blocos["lideranca"]?.media ?? 0;
  const conf = blocos["conflitos"]?.media ?? 0;

  if (exig >= 67 && ctrl >= 67) agravantes.push("modelo demanda-controle desequilibrado (alta exigência + baixa autonomia)");
  if (exig >= 67 && apoio >= 67) agravantes.push("alta demanda combinada a baixo suporte social (modelo Karasek-Johnson isolado)");
  if (exig >= 67 && rec >= 67) agravantes.push("desequilíbrio esforço-recompensa (Siegrist)");
  if (lider >= 67 && conf >= 67) agravantes.push("liderança frágil associada a conflitos frequentes");
  if (mediaSintomas >= 67 && (apoio >= 67 || lider >= 67)) agravantes.push("sintomas de esgotamento sem redes de apoio suficientes");

  // Composição textual
  let resultado = `Com base na consolidação das respostas ao questionário COPSOQ, a função avaliada apresenta risco psicossocial ${nivel}`;
  if (destaques.length > 0) resultado += `, com destaque para ${destaques.join("; ")}`;
  resultado += ".";
  if (protecoes.length && (nivel === "baixo" || nivel === "moderado")) {
    resultado += ` Foram identificados fatores de proteção relevantes: ${protecoes.join(", ")}, que atenuam a percepção de risco.`;
  }
  if (agravantes.length) {
    resultado += ` Observam-se combinações agravantes: ${agravantes.join("; ")}, associadas na literatura ao aumento de estresse ocupacional e adoecimento mental.`;
  }
  if (recomendacao_imediata) {
    resultado += " Recomenda-se acompanhamento médico e psicológico imediato dos trabalhadores expostos, além de intervenção organizacional prioritária.";
  }
  // Justificativa técnica do nível
  const numRelevantes = altos.length + criticos.length;
  resultado += ` Classificação técnica fundamentada em ${numRelevantes} dimensão(ões) com risco Alto/Crítico, ${moderados.length} moderada(s) e ${baixos.length} de baixa criticidade, conforme critérios de tercis do COPSOQ III e diretrizes da NR-01 (GRO).`;

  const riscos = [...criticos, ...altos].map(([k]) => RISCO_TECNICO_MAP[k] || k);
  const riscos_psicossociais = riscos.length
    ? Array.from(new Set(riscos)).join(", ")
    : "Nenhum risco psicossocial significativo identificado";

  return {
    alertas: { alerta_amarelo, alerta_vermelho, recomendacao_imediata },
    resultado_psicossocial: resultado,
    riscos_psicossociais,
    fatores_protecao: protecoes,
  };
}

function classificarResposta(valor: number, blocoKey: string, perguntaIdx: number): "positiva" | "negativa" {
  // Positiva = resposta indica ausência de risco (risco calculado < 50).
  const risco = valorRisco(valor, blocoKey, perguntaIdx);
  return risco < 50 ? "positiva" : "negativa";
}

function gerarResumoCopsoq(
  total_positivas: number,
  total_negativas: number,
  blocos: Record<string, BlocoResultado>,
): { copsoq_resultado_resumido: string; copsoq_riscos_identificados: string } {
  const total = total_positivas + total_negativas;
  if (!total) return { copsoq_resultado_resumido: "", copsoq_riscos_identificados: "" };
  const pctPos = (total_positivas / total) * 100;

  let copsoq_resultado_resumido: string;
  if (pctPos >= 60) {
    copsoq_resultado_resumido =
      "Predominância de fatores positivos no ambiente de trabalho: bom nível de apoio social, autonomia, reconhecimento e liderança percebida como justa. Cenário organizacional favorável à saúde mental.";
  } else if (pctPos >= 40) {
    copsoq_resultado_resumido =
      "Cenário misto: parte relevante dos fatores psicossociais é favorável, porém coexistem sinais de sobrecarga, baixo apoio ou fragilidades de liderança que exigem monitoramento sistemático.";
  } else {
    copsoq_resultado_resumido =
      "Predominância de fatores de risco psicossocial: baixa autonomia, apoio insuficiente, sinais de insegurança organizacional e potenciais indicadores de sofrimento mental. Requer intervenção prioritária.";
  }

  const riscos: string[] = [];
  if (pctPos < 50) riscos.push("Estresse ocupacional", "Baixo apoio organizacional", "Insegurança no trabalho", "Sobrecarga mental");
  if (blocos["sintomas"]?.classificacao === "Crítico") riscos.push("Risco elevado de burnout");
  if (["Crítico", "Alto"].includes(blocos["conflitos"]?.classificacao)) riscos.push("Conflitos interpessoais / risco de assédio moral");
  if (["Crítico", "Alto"].includes(blocos["lideranca"]?.classificacao)) riscos.push("Liderança injusta ou pouco presente");

  return {
    copsoq_resultado_resumido,
    copsoq_riscos_identificados: riscos.length ? Array.from(new Set(riscos)).join(", ") : "Nenhum risco psicossocial significativo identificado",
  };
}

export function calcularPsicossocial(av: AvaliacaoPsicossocial): AvaliacaoPsicossocial {
  const blocos: Record<string, BlocoResultado> = {};
  let total_positivas = 0;
  let total_negativas = 0;
  for (const b of BLOCOS_COPSOQ) {
    const respostas = av.respostas[b.key] || [];
    const validas: { valor: number; idx: number }[] = [];
    respostas.forEach((r, i) => { if (typeof r === "number" && r >= 0) validas.push({ valor: r, idx: i }); });
    const riscos = validas.map((v) => valorRisco(v.valor, b.key, v.idx));
    const media = riscos.length ? riscos.reduce((a, c) => a + c, 0) / riscos.length : 0;
    blocos[b.key] = { media: Math.round(media * 10) / 10, classificacao: classificar(media) };
    for (const v of validas) {
      if (classificarResposta(v.valor, b.key, v.idx) === "positiva") total_positivas++;
      else total_negativas++;
    }
  }
  const analise = gerarAnalise(blocos);
  const resumo = gerarResumoCopsoq(total_positivas, total_negativas, blocos);
  return { ...av, blocos, ...analise, total_positivas, total_negativas, ...resumo };
}

// ─── MODAL ───
export function PsicossocialModal({
  open,
  onOpenChange,
  avaliacoes,
  onChange,
  relatorioContext,
  funcoesSetor,
  asPage = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  avaliacoes: AvaliacaoPsicossocial[];
  onChange: (a: AvaliacaoPsicossocial[]) => void;
  /** Contexto opcional para geração do Relatório Psicossocial Geral em PDF. */
  relatorioContext?: import("@/lib/copsoqRelatorio").RelatorioContext;
  /** Funções selecionadas no setor da AET, usadas para validar PDFs importados. */
  funcoesSetor?: { id?: string; nome: string }[];
  /** Renderiza o conteúdo como página (sem Dialog) — usado pela rota dedicada. */
  asPage?: boolean;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<AvaliacaoPsicossocial>(emptyPsicossocial());
  const [importOpen, setImportOpen] = useState(false);
  const [textInputOpen, setTextInputOpen] = useState(false);


  useEffect(() => {
    if (editingIdx !== null && avaliacoes[editingIdx]) {
      setDraft(avaliacoes[editingIdx]);
    }
  }, [editingIdx, avaliacoes]);

  // Ao receber avaliações importadas incompletas, abre automaticamente a primeira
  // pendente para complementação manual.
  useEffect(() => {
    if (!open) return;
    if (editingIdx !== null) return;
    const idxIncompleto = avaliacoes.findIndex((a) => !avaliacaoCompleta(a.respostas));
    if (idxIncompleto >= 0) {
      setEditingIdx(idxIncompleto);
      toast.warning("Avaliação importada com respostas pendentes — complete os campos destacados.");
    }
  }, [avaliacoes, open, editingIdx]);

  const computed = useMemo(() => calcularPsicossocial(draft), [draft]);
  const pendentesDraft = useMemo(() => {
    const set = new Set<string>();
    for (const p of perguntasPendentes(draft.respostas)) set.add(`${p.blocoKey}-${p.perguntaIdx}`);
    return set;
  }, [draft.respostas]);

  const setResposta = (blocoKey: string, perguntaIdx: number, value: number) => {
    setDraft((prev) => {
      const arr = [...(prev.respostas[blocoKey] || [])];
      arr[perguntaIdx] = value;
      return { ...prev, respostas: { ...prev.respostas, [blocoKey]: arr } };
    });
  };

  const allAnswered = avaliacaoCompleta(draft.respostas);

  const handleSave = () => {
    if (!draft.funcao?.trim()) {
      toast.error("Informe a função avaliada");
      return;
    }
    if (!allAnswered) {
      toast.error("Responda todas as perguntas antes de salvar");
      return;
    }
    const final = calcularPsicossocial(draft);
    if (editingIdx !== null) {
      onChange(avaliacoes.map((a, i) => (i === editingIdx ? final : a)));
    } else {
      onChange([...avaliacoes, final]);
    }
    setEditingIdx(null);
    setDraft(emptyPsicossocial());
    toast.success("Avaliação psicossocial salva");
  };

  const handleNew = () => {
    setEditingIdx(null);
    setDraft(emptyPsicossocial());
  };

  const handleDelete = (idx: number) => {
    onChange(avaliacoes.filter((_, i) => i !== idx));
    toast.success("Avaliação removida");
  };

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
  };

  const handleRelatorio = async () => {
    try {
      if (avaliacoes.length === 0) {
        toast.error("Não há avaliações salvas para gerar o relatório consolidado.");
        return;
      }
      const incompletas = avaliacoes
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => !avaliacaoCompleta(a.respostas));
      if (incompletas.length > 0) {
        toast.error(
          `Existem ${incompletas.length} avaliação(ões) psicossocial(is) com respostas incompletas. Finalize o preenchimento antes de gerar o relatório consolidado.`,
        );
        setEditingIdx(incompletas[0].i);
        return;
      }
      const lista = avaliacoes.map((a) => calcularPsicossocial(a));
      const { gerarRelatorioCopsoqPDF } = await import("@/lib/copsoqRelatorio");
      gerarRelatorioCopsoqPDF(lista, relatorioContext || {});
      toast.success(
        `Relatório Psicossocial consolidado gerado a partir de ${lista.length} avaliação(ões).`,
      );
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar relatório: " + (e?.message || ""));
    }
  };


  const header = (
    <div className="font-heading flex items-center justify-between gap-2 flex-wrap">
      <span className="text-lg font-semibold">Avaliação Psicossocial (COPSOQ)</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
          <FileSpreadsheet className="w-4 h-4" />
          Gerar Automaticamente por Arquivo
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setTextInputOpen(true)}>
          <PencilLine className="w-4 h-4" />
          Escrever Questionário
        </Button>
      </div>
    </div>
  );

  const body = (
    <>



        <PsicossocialTextInputModal
          open={textInputOpen}
          onOpenChange={setTextInputOpen}
          relatorioContext={relatorioContext}
          onImportado={(avs) => onChange([...avaliacoes, ...avs])}
        />

        {/* Modal de importação automática (planilha/PDF) */}
        <PsicossocialImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          relatorioContext={relatorioContext}
          funcoesSetor={funcoesSetor || relatorioContext?.funcoes?.map((nome) => ({ nome })) || []}
          onImportado={(avs) => {
            // Anexa as avaliações anonimizadas ao setor, sem sobrescrever as existentes.
            onChange([...avaliacoes, ...avs]);
          }}
        />


        {/* Lista de avaliações já salvas */}
        {avaliacoes.length > 0 && editingIdx === null && (
          <div className="space-y-2 border-b border-border pb-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Avaliações salvas</p>
            {avaliacoes.map((a, i) => {
              const incompleta = !avaliacaoCompleta(a.respostas);
              const pendCount = perguntasPendentes(a.respostas).length;
              return (
              <Card key={i} className={`p-3 flex items-center justify-between ${incompleta ? "border-amber-400 bg-amber-50/40" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{a.funcao || "Função não informada"}</p>
                  <p className="text-xs text-muted-foreground truncate">{incompleta ? "Avaliação incompleta — pendente de complementação manual." : a.resultado_psicossocial}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {incompleta && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {pendCount} pergunta(s) pendente(s)
                      </Badge>
                    )}
                    {!incompleta && a.alertas?.alerta_vermelho && (
                      <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">
                        <AlertOctagon className="w-3 h-3 mr-1" />Vermelho
                      </Badge>
                    )}
                    {!incompleta && a.alertas?.alerta_amarelo && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1" />Amarelo
                      </Badge>
                    )}
                    {!incompleta && a.alertas?.recomendacao_imediata && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">
                        <Lightbulb className="w-3 h-3 mr-1" />Acompanhamento
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant={incompleta ? "default" : "outline"} onClick={() => handleEdit(i)}>
                    {incompleta ? "Complementar" : "Editar"}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleDelete(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
              );
            })}

            <Button variant="outline" size="sm" onClick={handleNew}>+ Nova avaliação</Button>
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Função *</Label>
              <Input
                value={draft.funcao || ""}
                onChange={(e) => setDraft({ ...draft, funcao: e.target.value, colaborador_nome: "" })}
              />
            </div>
            <div>
              <Label>Data avaliação</Label>
              <Input
                type="date"
                value={draft.data_avaliacao}
                onChange={(e) => setDraft({ ...draft, data_avaliacao: e.target.value })}
              />
            </div>
          </div>

          {editingIdx !== null && pendentesDraft.size > 0 && (
            <Card className="p-3 border-amber-400 bg-amber-50/60">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-semibold">Avaliação incompleta importada</p>
                  <p>
                    {pendentesDraft.size} pergunta(s) não foram identificadas automaticamente e estão destacadas em amarelo abaixo.
                    Complete-as manualmente para que esta avaliação seja considerada na consolidação do relatório psicossocial.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {BLOCOS_COPSOQ.map((bloco) => {
            const bres = computed.blocos[bloco.key];
            const blocoTemPend = bloco.perguntas.some((_, pi) => pendentesDraft.has(`${bloco.key}-${pi}`));
            return (
              <Card key={bloco.key} className={`p-4 ${blocoTemPend ? "border-amber-400" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-sm">{bloco.titulo}</h3>
                  {bres && (
                    <Badge variant="outline" className={`${classBadgeColor(bres.classificacao)} text-[11px]`}>
                      Média {bres.media} • {bres.classificacao}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {bloco.perguntas.map((p, pi) => {
                    const pend = pendentesDraft.has(`${bloco.key}-${pi}`);
                    return (
                    <div
                      key={pi}
                      className={pend ? "rounded-md border border-amber-400 bg-amber-50/60 p-2" : ""}
                    >
                      <p className="text-sm mb-1.5 flex items-center gap-1.5">
                        {pend && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{p}</span>
                        {pend && <span className="text-[10px] font-semibold text-amber-700 uppercase">Pendente</span>}
                      </p>
                      <RadioGroup
                        value={String(draft.respostas[bloco.key]?.[pi] ?? -1)}
                        onValueChange={(v) => setResposta(bloco.key, pi, Number(v))}
                        className="flex flex-wrap gap-3"
                      >
                        {ESCALA_COPSOQ.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                            <RadioGroupItem value={String(opt.value)} id={`${bloco.key}-${pi}-${opt.value}`} />
                            <span className="text-xs">{opt.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}


          {/* Inteligência */}
          <Card className="p-4 bg-muted/30">
            <h3 className="font-heading font-semibold text-sm mb-2">Análise automática</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {computed.alertas.alerta_amarelo && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />Alerta amarelo
                </Badge>
              )}
              {computed.alertas.alerta_vermelho && (
                <Badge className="bg-red-100 text-red-800 border-red-300">
                  <AlertOctagon className="w-3 h-3 mr-1" />Alerta vermelho
                </Badge>
              )}
              {computed.alertas.recomendacao_imediata && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                  <Lightbulb className="w-3 h-3 mr-1" />Acompanhamento imediato
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Resultado psicossocial</Label>
                <Textarea
                  rows={3}
                  value={computed.resultado_psicossocial}
                  onChange={(e) => setDraft({ ...draft, resultado_psicossocial: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Riscos psicossociais identificados</Label>
                <Textarea
                  rows={2}
                  value={computed.riscos_psicossociais}
                  onChange={(e) => setDraft({ ...draft, riscos_psicossociais: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

      {asPage ? (
        <div className="flex gap-2 flex-wrap items-center pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur py-3 z-10">
          {footerContent}
        </div>
      ) : (
        <DialogFooter className="gap-2 flex-wrap items-center">{footerContent}</DialogFooter>
      )}
    </>
  );

  const footerContent = (
    <>
      {avaliacoes.some((a) => !avaliacaoCompleta(a.respostas)) && (
        <p className="text-xs text-amber-700 flex items-center gap-1 mr-auto">
          <AlertTriangle className="w-3.5 h-3.5" />
          Existem avaliações incompletas — finalize-as para liberar a geração do relatório consolidado.
        </p>
      )}
      <Button
        variant="outline"
        onClick={handleRelatorio}
        disabled={
          avaliacoes.length === 0 ||
          avaliacoes.some((a) => !avaliacaoCompleta(a.respostas))
        }
      >
        <FileDown className="w-4 h-4 mr-2" />Gerar Relatório Psicossocial Consolidado
      </Button>
      <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Save className="w-4 h-4 mr-2" />Salvar
      </Button>
    </>
  );

  if (asPage) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Card className="p-4">{header}</Card>
        {body}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle asChild>{header}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}


