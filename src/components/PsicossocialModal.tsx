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
import { Save, FileDown, Trash2, AlertTriangle, AlertOctagon, Lightbulb } from "lucide-react";
import { toast } from "sonner";

// ─── Escala fixa COPSOQ ───
export const ESCALA_COPSOQ = [
  { label: "Nunca", value: 0 },
  { label: "Raramente", value: 25 },
  { label: "Às vezes", value: 50 },
  { label: "Frequentemente", value: 75 },
  { label: "Sempre", value: 100 },
] as const;

// ─── Blocos e perguntas ───
export const BLOCOS_COPSOQ: { key: string; titulo: string; perguntas: string[] }[] = [
  {
    key: "exigencias",
    titulo: "Exigências",
    perguntas: [
      "O ritmo de trabalho é elevado?",
      "Há acúmulo de tarefas?",
      "Você precisa trabalhar muito rápido?",
      "Há sobrecarga emocional na função?",
    ],
  },
  {
    key: "controle",
    titulo: "Controle",
    perguntas: [
      "Você tem autonomia sobre o ritmo de trabalho?",
      "Pode decidir como executar suas tarefas?",
      "Pode fazer pausas quando precisa?",
    ],
  },
  {
    key: "apoio",
    titulo: "Apoio",
    perguntas: [
      "Recebe apoio dos colegas quando precisa?",
      "Recebe apoio da liderança?",
      "Sente-se parte da equipe?",
    ],
  },
  {
    key: "reconhecimento",
    titulo: "Reconhecimento",
    perguntas: [
      "Seu trabalho é reconhecido pela liderança?",
      "Recebe feedback construtivo?",
      "Sua remuneração é compatível com a função?",
    ],
  },
  {
    key: "seguranca",
    titulo: "Segurança",
    perguntas: [
      "Sente-se seguro quanto à manutenção do emprego?",
      "Há clareza sobre as mudanças na empresa?",
      "Há previsibilidade na rotina de trabalho?",
    ],
  },
  {
    key: "conflitos",
    titulo: "Conflitos",
    perguntas: [
      "Existem conflitos interpessoais frequentes?",
      "Já sofreu ou presenciou assédio moral?",
      "Sente conflito entre vida pessoal e trabalho?",
    ],
  },
  {
    key: "sintomas",
    titulo: "Sintomas",
    perguntas: [
      "Sente cansaço excessivo após o trabalho?",
      "Tem dificuldade para dormir por causa do trabalho?",
      "Sente irritabilidade ou ansiedade frequente?",
      "Tem dores de cabeça relacionadas à rotina?",
    ],
  },
];

export type BlocoResultado = { media: number; classificacao: string };
export type AvaliacaoPsicossocial = {
  colaborador_nome: string;
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
  /** Total de respostas classificadas como positivas (somando todos os blocos). */
  total_positivas?: number;
  /** Total de respostas classificadas como negativas. */
  total_negativas?: number;
  /** Resumo automático em linguagem natural — variável {{copsoq_resultado_resumido}}. */
  copsoq_resultado_resumido?: string;
  /** Riscos derivados da predominância de respostas negativas — {{copsoq_riscos_identificados}}. */
  copsoq_riscos_identificados?: string;
};

/** Blocos cujas respostas altas (Sempre/Frequentemente) representam ASPECTO NEGATIVO.
 *  Para os demais blocos, respostas altas representam aspecto POSITIVO. */
const BLOCOS_INVERTIDOS = new Set(["exigencias", "conflitos", "sintomas"]);

/** Blocos POSITIVOS — quanto mais o colaborador responde "Sempre/Frequentemente",
 *  MENOR é o risco. Para esses blocos invertemos o valor antes de calcular a média
 *  de risco (100→0, 75→25, 50→50, 25→75, 0→100). */
const BLOCOS_POSITIVOS = new Set(["controle", "apoio", "reconhecimento", "seguranca"]);

function valorRisco(valor: number, blocoKey: string): number {
  // Se o bloco é positivo, inverte: alta frequência = baixo risco
  if (BLOCOS_POSITIVOS.has(blocoKey)) {
    return 100 - valor;
  }
  return valor;
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

// ─── Análise inteligente ───
function gerarAnalise(blocos: Record<string, BlocoResultado>, respostasSintomas: number[]) {
  const altos = Object.entries(blocos).filter(([, v]) => v.classificacao === "Alto");
  const criticos = Object.entries(blocos).filter(([, v]) => v.classificacao === "Crítico");
  const sintomas = blocos["sintomas"];
  const mediaSintomas = sintomas?.media ?? 0;

  const alerta_amarelo = altos.length >= 2;
  const alerta_vermelho = criticos.length >= 1;
  const recomendacao_imediata = mediaSintomas > 70;

  const tituloMap: Record<string, string> = {
    exigencias: "exigências elevadas",
    controle: "baixa autonomia",
    apoio: "falta de apoio",
    reconhecimento: "falta de reconhecimento",
    seguranca: "insegurança no trabalho",
    conflitos: "conflitos interpessoais",
    sintomas: "sintomas de estresse",
  };

  const destaques = [...criticos, ...altos]
    .map(([k]) => tituloMap[k] || k)
    .slice(0, 3);

  let nivel = "baixo";
  if (alerta_vermelho) nivel = "crítico";
  else if (alerta_amarelo) nivel = "alto";
  else if (Object.values(blocos).some((b) => b.classificacao === "Moderado")) nivel = "moderado";

  let resultado = `O colaborador apresenta risco psicossocial ${nivel}`;
  if (destaques.length > 0) resultado += `, com destaque para ${destaques.join(", ")}`;
  resultado += ".";
  if (recomendacao_imediata) {
    resultado += " Recomenda-se acompanhamento médico/psicológico imediato dada a presença significativa de sintomas.";
  }

  // Riscos identificados
  const riscosMap: Record<string, string> = {
    exigencias: "Sobrecarga mental",
    controle: "Baixa autonomia",
    apoio: "Isolamento social no trabalho",
    reconhecimento: "Desvalorização profissional",
    seguranca: "Insegurança ocupacional",
    conflitos: "Assédio/conflitos interpessoais",
    sintomas: "Estresse ocupacional",
  };
  const riscos = [...criticos, ...altos].map(([k]) => riscosMap[k] || k);
  const riscos_psicossociais = riscos.length > 0 ? riscos.join(", ") : "Nenhum risco psicossocial significativo identificado";

  return {
    alertas: { alerta_amarelo, alerta_vermelho, recomendacao_imediata },
    resultado_psicossocial: resultado,
    riscos_psicossociais,
  };
}

/**
 * Classifica uma resposta como POSITIVA ou NEGATIVA conforme a regra:
 *   - Sempre / Frequentemente / Às vezes (≥ 50) → POSITIVA
 *   - Raramente / Nunca (< 50) → NEGATIVA
 * Em blocos invertidos (sintomas, exigências, conflitos) a lógica é trocada,
 * pois "sempre sentir cansaço" é um aspecto negativo.
 */
function classificarResposta(valor: number, blocoKey: string): "positiva" | "negativa" {
  const alta = valor >= 50;
  const invertido = BLOCOS_INVERTIDOS.has(blocoKey);
  return alta !== invertido ? "positiva" : "negativa";
}

function gerarResumoCopsoq(
  total_positivas: number,
  total_negativas: number,
  blocos: Record<string, BlocoResultado>,
): { copsoq_resultado_resumido: string; copsoq_riscos_identificados: string } {
  const total = total_positivas + total_negativas;
  if (!total) {
    return { copsoq_resultado_resumido: "", copsoq_riscos_identificados: "" };
  }
  const pctPos = (total_positivas / total) * 100;

  let copsoq_resultado_resumido: string;
  if (pctPos >= 60) {
    copsoq_resultado_resumido =
      "Predominância de fatores positivos no ambiente de trabalho, com bom nível de apoio, autonomia e reconhecimento.";
  } else if (pctPos >= 40) {
    copsoq_resultado_resumido =
      "Cenário misto: parte dos fatores psicossociais é favorável, porém há sinais relevantes de sobrecarga e/ou baixo apoio que merecem acompanhamento.";
  } else {
    copsoq_resultado_resumido =
      "Identificada presença de fatores de risco psicossocial, com baixa autonomia, baixo apoio e sinais de insegurança organizacional.";
  }

  // Riscos automáticos quando negativas predominam
  const riscos: string[] = [];
  if (pctPos < 50) {
    riscos.push(
      "Estresse ocupacional",
      "Baixo apoio organizacional",
      "Insegurança no trabalho",
      "Sobrecarga mental",
    );
  }
  // Adiciona riscos específicos de blocos críticos
  if (blocos["sintomas"]?.classificacao === "Crítico" && !riscos.includes("Estresse ocupacional")) {
    riscos.push("Estresse ocupacional");
  }
  if (blocos["conflitos"]?.classificacao === "Crítico" || blocos["conflitos"]?.classificacao === "Alto") {
    riscos.push("Conflitos interpessoais / risco de assédio");
  }

  return {
    copsoq_resultado_resumido,
    copsoq_riscos_identificados: riscos.length
      ? Array.from(new Set(riscos)).join(", ")
      : "Nenhum risco psicossocial significativo identificado",
  };
}

export function calcularPsicossocial(av: AvaliacaoPsicossocial): AvaliacaoPsicossocial {
  const blocos: Record<string, BlocoResultado> = {};
  let total_positivas = 0;
  let total_negativas = 0;
  for (const b of BLOCOS_COPSOQ) {
    const respostas = (av.respostas[b.key] || []).filter((r) => r >= 0);
    // Para blocos positivos (controle, apoio, reconhecimento, segurança),
    // invertemos o valor: "Sempre" tem autonomia → risco baixo.
    const respostasRisco = respostas.map((r) => valorRisco(r, b.key));
    const media = respostasRisco.length > 0 ? respostasRisco.reduce((a, c) => a + c, 0) / respostasRisco.length : 0;
    blocos[b.key] = { media: Math.round(media * 10) / 10, classificacao: classificar(media) };
    for (const r of respostas) {
      if (classificarResposta(r, b.key) === "positiva") total_positivas++;
      else total_negativas++;
    }
  }
  const analise = gerarAnalise(blocos, av.respostas["sintomas"] || []);
  const resumo = gerarResumoCopsoq(total_positivas, total_negativas, blocos);
  return { ...av, blocos, ...analise, total_positivas, total_negativas, ...resumo };
}

// ─── MODAL ───
export function PsicossocialModal({
  open,
  onOpenChange,
  avaliacoes,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  avaliacoes: AvaliacaoPsicossocial[];
  onChange: (a: AvaliacaoPsicossocial[]) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<AvaliacaoPsicossocial>(emptyPsicossocial());

  useEffect(() => {
    if (editingIdx !== null && avaliacoes[editingIdx]) {
      setDraft(avaliacoes[editingIdx]);
    }
  }, [editingIdx, avaliacoes]);

  const computed = useMemo(() => calcularPsicossocial(draft), [draft]);

  const setResposta = (blocoKey: string, perguntaIdx: number, value: number) => {
    setDraft((prev) => {
      const arr = [...(prev.respostas[blocoKey] || [])];
      arr[perguntaIdx] = value;
      return { ...prev, respostas: { ...prev.respostas, [blocoKey]: arr } };
    });
  };

  const allAnswered = BLOCOS_COPSOQ.every((b) =>
    (draft.respostas[b.key] || []).every((r) => r >= 0),
  );

  const handleSave = () => {
    if (!draft.colaborador_nome.trim()) {
      toast.error("Informe o nome do colaborador");
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

  const handleRelatorio = () => {
    const txt = [
      `RELATÓRIO PSICOSSOCIAL — ${computed.colaborador_nome || "Colaborador"}`,
      `Data: ${computed.data_avaliacao || "—"}`,
      ``,
      `RESULTADO:`,
      computed.resultado_psicossocial,
      ``,
      `RISCOS IDENTIFICADOS:`,
      computed.riscos_psicossociais,
      ``,
      `BLOCOS:`,
      ...BLOCOS_COPSOQ.map((b) => {
        const r = computed.blocos[b.key];
        return `- ${b.titulo}: média ${r?.media ?? 0} (${r?.classificacao ?? "—"})`;
      }),
      ``,
      `ALERTAS:`,
      `- Alerta amarelo: ${computed.alertas.alerta_amarelo ? "SIM" : "Não"}`,
      `- Alerta vermelho: ${computed.alertas.alerta_vermelho ? "SIM" : "Não"}`,
      `- Recomendação imediata: ${computed.alertas.recomendacao_imediata ? "SIM" : "Não"}`,
    ].join("\n");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `psicossocial_${(computed.colaborador_nome || "colab").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Avaliação Psicossocial (COPSOQ)</DialogTitle>
        </DialogHeader>

        {/* Lista de avaliações já salvas */}
        {avaliacoes.length > 0 && editingIdx === null && (
          <div className="space-y-2 border-b border-border pb-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Avaliações salvas</p>
            {avaliacoes.map((a, i) => (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{a.colaborador_nome || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.resultado_psicossocial}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {a.alertas?.alerta_vermelho && (
                      <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">
                        <AlertOctagon className="w-3 h-3 mr-1" />Vermelho
                      </Badge>
                    )}
                    {a.alertas?.alerta_amarelo && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1" />Amarelo
                      </Badge>
                    )}
                    {a.alertas?.recomendacao_imediata && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">
                        <Lightbulb className="w-3 h-3 mr-1" />Acompanhamento
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(i)}>Editar</Button>
                  <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleDelete(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={handleNew}>+ Nova avaliação</Button>
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Colaborador *</Label>
              <Input
                value={draft.colaborador_nome}
                onChange={(e) => setDraft({ ...draft, colaborador_nome: e.target.value })}
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

          {BLOCOS_COPSOQ.map((bloco) => {
            const bres = computed.blocos[bloco.key];
            return (
              <Card key={bloco.key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-sm">{bloco.titulo}</h3>
                  {bres && (
                    <Badge variant="outline" className={`${classBadgeColor(bres.classificacao)} text-[11px]`}>
                      Média {bres.media} • {bres.classificacao}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {bloco.perguntas.map((p, pi) => (
                    <div key={pi}>
                      <p className="text-sm mb-1.5">{p}</p>
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
                  ))}
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

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={handleRelatorio} disabled={!allAnswered}>
            <FileDown className="w-4 h-4 mr-2" />Gerar Relatório
          </Button>
          <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="w-4 h-4 mr-2" />Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
