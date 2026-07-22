import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Loader2, Save, FileText, CheckCircle2,
  Wrench, FileDown, FileCheck2, ExternalLink, Brain, Sparkles,
} from "lucide-react";
import { PsicossocialModal, AvaliacaoPsicossocial, calcularPsicossocial } from "@/components/PsicossocialModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { renderHtmlTemplateToDocx } from "@/lib/htmlTemplate";
import { parseDocxErrors } from "@/lib/templateValidator";
import { sortByGes } from "@/lib/sortGes";

type Revisao = { data_revisao: string; descricao_revisao: string };
type Colaborador = { nome_colaborador: string; data_avaliacao: string; funcao: string };
type Cronoanalise = { tarefa: string; tempo: string; risco: string };
type DimensaoItem = { medida: string; avaliacao: string };
type AvaliacoesDimensionais = {
  altura_mesa: DimensaoItem;
  altura_assento: DimensaoItem;
  profundidade_assento: DimensaoItem;
  monitor: DimensaoItem;
  distancia_olho_monitor: DimensaoItem;
  espaco_pernas: DimensaoItem;
};
type AvalQuant = {
  especificacao_setor: string;
  ruido_valor: string; ruido_unidade: string;
  limite_ruido: string; unidade_limite_ruido: string;
  iluminancia_valor: string; iluminancia_unidade: string;
  limite_iluminancia: string; unidade_limite_iluminancia: string;
  temperatura_valor: string; temperatura_unidade: string;
  limite_temperatura: string;
};
type PlanoAcao = { o_que: string; como: string; responsavel: string; prazo: string };
type Ferramenta = { tipo: string; dados_avaliacao: string; resultado: string };

type SetorAet = {
  setor_id: string;
  setor_nome: string;
  ges: string;
  descricao_ambiente: string;
  funcao_id: string;
  funcao_nome: string;
  funcoes_selecionadas: { id: string; nome: string }[];
  numero_funcionarios: string;
  colaboradores: Colaborador[];
  posto_trabalho: string;
  descricao_atividade: string;
  analise_organizacional: string;
  tarefas: string;
  riscos_observados: string;
  cronoanalise: Cronoanalise[];
  avaliacoes_dimensionais: AvaliacoesDimensionais;
  ritmo_complexidade: string;
  jornada_aspectos: string;
  caracterizacao_biomecanica: string;
  avaliacoes_quantitativas: AvalQuant[];
  diagnostico_ergonomico: string;
  conclusao: string;
  plano_acao: PlanoAcao[];
  ferramentas: Ferramenta[];
  descricao_imagens_ambiente: string;
  descricao_imagens_funcao: string;
  avaliacoes_psicossociais: AvaliacaoPsicossocial[];
  resultado_psicossocial_texto: string;
  _salvo?: boolean;
};

const FERRAMENTAS_CATEGORIAS: { categoria: string; itens: string[] }[] = [
  { categoria: "Membros superiores", itens: ["RULA", "REBA", "OCRA"] },
  { categoria: "Movimentação de carga", itens: ["NIOSH"] },
  { categoria: "Postural", itens: ["OWAS", "Moore-Garg"] },
];

const DIMENSOES_LABELS: { key: keyof AvaliacoesDimensionais; label: string }[] = [
  { key: "altura_mesa", label: "Altura da mesa" },
  { key: "altura_assento", label: "Altura do assento" },
  { key: "profundidade_assento", label: "Profundidade do assento" },
  { key: "monitor", label: "Monitor" },
  { key: "distancia_olho_monitor", label: "Distância olho-monitor" },
  { key: "espaco_pernas", label: "Espaço para pernas" },
];

const emptyDimensoes = (): AvaliacoesDimensionais => ({
  altura_mesa: { medida: "", avaliacao: "" },
  altura_assento: { medida: "", avaliacao: "" },
  profundidade_assento: { medida: "", avaliacao: "" },
  monitor: { medida: "", avaliacao: "" },
  distancia_olho_monitor: { medida: "", avaliacao: "" },
  espaco_pernas: { medida: "", avaliacao: "" },
});

const emptyColab = (): Colaborador => ({ nome_colaborador: "", data_avaliacao: "", funcao: "" });
const emptyCrono = (): Cronoanalise => ({ tarefa: "", tempo: "", risco: "" });
const emptyAval = (): AvalQuant => ({
  especificacao_setor: "",
  ruido_valor: "", ruido_unidade: "dB(A)",
  limite_ruido: "65 dB(A)", unidade_limite_ruido: "dB(A)",
  iluminancia_valor: "", iluminancia_unidade: "lux",
  limite_iluminancia: "", unidade_limite_iluminancia: "lux",
  temperatura_valor: "", temperatura_unidade: "°C",
  limite_temperatura: "18°C a 25°C",
});
const emptyPlano = (): PlanoAcao => ({ o_que: "", como: "", responsavel: "", prazo: "" });
const emptyRev = (): Revisao => ({ data_revisao: "", descricao_revisao: "" });
const emptyFerr = (tipo: string): Ferramenta => ({ tipo, dados_avaliacao: "", resultado: "" });


const PSICO_BLOCK_KEYS = ["exigencias", "controle", "apoio", "reconhecimento", "seguranca", "conflitos", "sintomas"] as const;

const formatDate = (value?: string | null) => (
  value ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR") : ""
);

const createEmptyPsicoBlocos = () => Object.fromEntries(
  PSICO_BLOCK_KEYS.map((key) => [key, { media: "", classificacao: "" }]),
) as Record<(typeof PSICO_BLOCK_KEYS)[number], { media: string | number; classificacao: string }>;

const normalizePsicoBlocos = (blocos?: Record<string, { media?: unknown; classificacao?: unknown }>) => {
  const vazios = createEmptyPsicoBlocos();
  for (const key of PSICO_BLOCK_KEYS) {
    const media = blocos?.[key]?.media;
    const classificacao = blocos?.[key]?.classificacao;
    vazios[key] = {
      media: media === undefined || media === null || media === "" ? "" : Number(media) || 0,
      classificacao: String(classificacao || ""),
    };
  }
  return vazios;
};

const hasMissingPsicossocial = (data: {
  setores?: Array<{ setor_nome?: string; blocos?: Record<string, { media?: unknown; classificacao?: unknown }> }>;
}) => {
  return (data.setores || []).some((setor) =>
    PSICO_BLOCK_KEYS.some((key) => {
      const bloco = setor.blocos?.[key];
      return bloco?.media === "" || !String(bloco?.classificacao || "").trim();
    }),
  );
};

const newSetor = (s: any): SetorAet => ({
  setor_id: s.id,
  setor_nome: s.nome_setor || "",
  ges: s.ghe_ges || "",
  descricao_ambiente: s.descricao_ambiente || "",
  funcao_id: "",
  funcao_nome: "",
  funcoes_selecionadas: [],
  numero_funcionarios: "",
  colaboradores: [],
  posto_trabalho: "",
  descricao_atividade: "",
  analise_organizacional: "",
  tarefas: "",
  riscos_observados: "",
  cronoanalise: [],
  avaliacoes_dimensionais: emptyDimensoes(),
  resultado_psicossocial_texto: "",
  ritmo_complexidade: "",
  jornada_aspectos: "",
  caracterizacao_biomecanica: "",
  avaliacoes_quantitativas: [],
  diagnostico_ergonomico: "",
  conclusao: "",
  plano_acao: [],
  ferramentas: [],
  descricao_imagens_ambiente: "",
  descricao_imagens_funcao: "",
  avaliacoes_psicossociais: [],
  _salvo: false,
});

// ─────────── FERRAMENTAS MODAL ───────────
function FerramentasModal({
  open, onOpenChange, ferramentas, onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ferramentas: Ferramenta[];
  onChange: (f: Ferramenta[]) => void;
}) {
  const add = (tipo: string) => onChange([...ferramentas, emptyFerr(tipo)]);
  const update = (i: number, patch: Partial<Ferramenta>) =>
    onChange(ferramentas.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const remove = (i: number) => onChange(ferramentas.filter((_, k) => k !== i));

  const handleClose = () => {
    const invalid = ferramentas.find((f) => !f.resultado.trim());
    if (invalid) {
      toast.error(`Preencha o resultado para ${invalid.tipo}`);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Ferramentas Ergonômicas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {FERRAMENTAS_CATEGORIAS.map((c) => (
              <div key={c.categoria}>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1.5">{c.categoria}</p>
                <div className="flex flex-wrap gap-2">
                  {c.itens.map((it) => (
                    <Button key={it} size="sm" variant="outline" onClick={() => add(it)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />{it}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {ferramentas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma ferramenta adicionada. Clique em uma das categorias acima.
              </p>
            )}
            {ferramentas.map((f, i) => (
              <Card key={i} className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono">{f.tipo}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => remove(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Dados da avaliação</Label>
                  <Textarea
                    rows={2}
                    value={f.dados_avaliacao}
                    onChange={(e) => update(i, { dados_avaliacao: e.target.value })}
                    placeholder="Descreva os parâmetros observados, scores parciais, etc."
                  />
                </div>
                <div>
                  <Label className="text-xs">Resultado *</Label>
                  <Input
                    value={f.resultado}
                    onChange={(e) => update(i, { resultado: e.target.value })}
                    placeholder="Ex: Risco moderado / Score 5"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// (ImageUploader removido — agora usamos descrição em texto)

export default function AetWizard() {
  const { documentoId } = useParams();
  const navigate = useNavigate();

  // Identificação
  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState<string>("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElaboracao, setDataElaboracao] = useState("");
  const [alteracoes, setAlteracoes] = useState("");
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);

  // Setores
  const [setoresAet, setSetoresAet] = useState<SetorAet[]>([]);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingSetorIdx, setEditingSetorIdx] = useState<number | null>(null);
  const [ferramentasOpen, setFerramentasOpen] = useState(false);
  const [psicoOpen, setPsicoOpen] = useState(false);
  const [iaOpen, setIaOpen] = useState(false);
  const [iaObs, setIaObs] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaFiles, setIaFiles] = useState<File[]>([]);
  const [iaMode, setIaMode] = useState<"substituir" | "complementar" | "manter">("substituir");

  // Generation step
  const [showGerar, setShowGerar] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorsModalOpen, setErrorsModalOpen] = useState(false);
  const [errorList, setErrorList] = useState<{ tipo: string; explicacao: string; correcao: string }[]>([]);

  const [aetId, setAetId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(documentoId || null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!documentoId);

  // Empresas
  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-aet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id,razao_social,nome_fantasia,cnpj,cnae_principal,grau_risco,endereco,preposto_telefone,preposto_email,preposto_nome,total_funcionarios,numero_funcionarios_masc,numero_funcionarios_fem,jornada_trabalho,nome_contratante,cnpj_contratante,numero_contrato,vigencia_inicio,vigencia_fim,escopo_contrato,gestor_nome,gestor_email,gestor_telefone,fiscal_nome,fiscal_email,fiscal_telefone,local_trabalho")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  // Contratos da empresa
  const { data: contratosEmpresa = [] } = useQuery({
    queryKey: ["contratos-aet", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("contratos")
        .select("id,numero_contrato,nome_contratante")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Setores do contrato (fallback empresa quando ainda não há contrato selecionado)
  const { data: setoresEmpresa = [] } = useQuery({
    queryKey: ["setores-empresa-aet", empresaId, contratoId],
    queryFn: async () => {
      if (!empresaId) return [];
      let q = (supabase as any).from("setores").select("id,nome_setor,ghe_ges,descricao_ambiente");
      if (contratoId) q = q.eq("contrato_id", contratoId);
      else q = q.eq("empresa_id", empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return sortByGes(data || []);
    },
    enabled: !!empresaId,
  });

  // Funções dos setores selecionados
  const { data: funcoesAll = [] } = useQuery({
    queryKey: ["funcoes-aet", setoresAet.map((s) => s.setor_id).join(",")],
    queryFn: async () => {
      const ids = setoresAet.map((s) => s.setor_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("funcoes").select("id,nome_funcao,setor_id,descricao_atividades").in("setor_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: setoresAet.length > 0,
  });

  // Templates AET
  const { data: templates = [] } = useQuery({
    queryKey: ["templates-aet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id,title,file_path")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const templatesAet = templates.filter((t: any) =>
    /aet|ergon/i.test(t.title || "")
  );
  const templatesToShow = templatesAet.length > 0 ? templatesAet : templates;

  // Carregar AET existente
  useEffect(() => {
    if (!documentoId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("aet_documentos")
          .select("*")
          .eq("documento_id", documentoId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setAetId(data.id);
          setEmpresaId(data.empresa_id || "");
          setContratoId((data as any).contrato_id || "");
          setResponsavelTecnico(data.responsavel_tecnico || "");
          setCrea(data.crea || "");
          setCargo(data.cargo || "");
          setDataElaboracao(data.data_elaboracao || "");
          setAlteracoes(data.alteracoes_documento || "");
          setRevisoes((data.revisoes as any) || []);
          const loadedSetores = ((data.setores as any) || []).map((s: any) => ({
            ...s,
            funcoes_selecionadas: Array.isArray(s.funcoes_selecionadas) && s.funcoes_selecionadas.length > 0
              ? s.funcoes_selecionadas
              : (s.funcao_id ? [{ id: s.funcao_id, nome: s.funcao_nome || "" }] : []),
            colaboradores: (s.colaboradores || []).map((c: any) => ({
              nome_colaborador: c.nome_colaborador || "",
              data_avaliacao: c.data_avaliacao || "",
              funcao: c.funcao || s.funcao_nome || "",
            })),
            cronoanalise: Array.isArray(s.cronoanalise) ? s.cronoanalise : [],
            avaliacoes_dimensionais: { ...emptyDimensoes(), ...(s.avaliacoes_dimensionais || {}) },
            resultado_psicossocial_texto: s.resultado_psicossocial_texto || "",
            avaliacoes_quantitativas: s.avaliacoes_quantitativas || [],
            ferramentas: s.ferramentas || [],
            plano_acao: s.plano_acao || [],
            avaliacoes_psicossociais: s.avaliacoes_psicossociais || [],
          }));
          // Merge automático de respostas psicossociais vinculadas (módulo Templates público)
          try {
            const funcaoIds: string[] = Array.from(new Set(
              loadedSetores.flatMap((s: any) =>
                (s.funcoes_selecionadas || []).map((f: any) => f.id).filter(Boolean) as string[]
              )
            ));
            if (funcaoIds.length > 0) {
              const { data: vinc } = await supabase
                .from("psico_respostas")
                .select("*")
                .in("funcao_id", funcaoIds);
              if (vinc && vinc.length > 0) {
                loadedSetores.forEach((s: any) => {
                  const fids = (s.funcoes_selecionadas || []).map((f: any) => f.id);
                  const novas = (vinc as any[])
                    .filter((r) => fids.includes(r.funcao_id))
                    .map((r) => ({
                      colaborador_nome: r.colaborador_nome || "Anônimo",
                      data_avaliacao: r.data_avaliacao || "",
                      respostas: r.respostas || {},
                      blocos: r.blocos || {},
                      alertas: r.alertas || { alerta_amarelo: false, alerta_vermelho: false, recomendacao_imediata: false },
                      resultado_psicossocial: r.resultado_psicossocial || "",
                      riscos_psicossociais: r.riscos_psicossociais || "",
                      total_positivas: r.total_positivas || 0,
                      total_negativas: r.total_negativas || 0,
                      copsoq_resultado_resumido: r.copsoq_resultado_resumido || "",
                      copsoq_riscos_identificados: r.copsoq_riscos_identificados || "",
                    }));
                  const existentes = s.avaliacoes_psicossociais || [];
                  const chaves = new Set(existentes.map((a: any) => `${a.colaborador_nome}|${a.data_avaliacao}`));
                  const adicionar = novas.filter((n: any) => !chaves.has(`${n.colaborador_nome}|${n.data_avaliacao}`));
                  s.avaliacoes_psicossociais = [...existentes, ...adicionar];
                });
              }
            }
          } catch (mergeErr) {
            console.warn("[AET] merge psico vinculadas:", mergeErr);
          }
          // Auto-preencher texto psicossocial a partir das avaliações vinculadas (editável)
          loadedSetores.forEach((s: any) => {
            if (!s.resultado_psicossocial_texto && (s.avaliacoes_psicossociais || []).length > 0) {
              const partes = s.avaliacoes_psicossociais
                .map((p: any) => {
                  const calc = calcularPsicossocial(p);
                  const nome = calc.colaborador_nome || "Colaborador";
                  const resumo = calc.copsoq_resultado_resumido || calc.resultado_psicossocial || "";
                  const riscos = calc.copsoq_riscos_identificados || calc.riscos_psicossociais || "";
                  return `${nome}: ${resumo}${riscos ? `\nRiscos identificados: ${riscos}` : ""}`;
                })
                .filter(Boolean);
              s.resultado_psicossocial_texto = partes.join("\n\n");
            }
          });
          setSetoresAet(loadedSetores);
        }
      } catch (e: any) {
        toast.error("Erro ao carregar AET: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentoId]);

  const empresaSelecionada = empresas.find((e: any) => e.id === empresaId);
  const empresaNome = empresaSelecionada?.razao_social || "";
  const allSetoresSalvos = setoresAet.length > 0 && setoresAet.every((s) => s._salvo);

  // Autosave silencioso a cada 3 minutos
  useEffect(() => {
    if (!empresaId) return;
    const interval = setInterval(() => {
      persist("rascunho", true);
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, contratoId, responsavelTecnico, crea, cargo, dataElaboracao, alteracoes, revisoes, setoresAet, aetId, docId]);

  // Autosave ao trocar de tela (editor de setor / gerar)
  useEffect(() => {
    if (!empresaId || !aetId) return;
    persist("rascunho", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSetorIdx, showGerar]);

  const handleConfirmSetores = () => {
    const novos = setoresEmpresa
      .filter((s: any) => selectedIds.has(s.id))
      .filter((s: any) => !setoresAet.some((x) => x.setor_id === s.id))
      .map(newSetor);
    setSetoresAet([...setoresAet, ...novos]);
    setSelectedIds(new Set());
    setSelectModalOpen(false);
  };

  const removeSetor = (idx: number) => {
    setSetoresAet(setoresAet.filter((_, i) => i !== idx));
  };

  const removeSetorGroup = (setorId: string) => {
    setSetoresAet(setoresAet.filter((s) => s.setor_id !== setorId));
  };

  const addAvaliacaoSetor = (setorId: string) => {
    const base = setoresAet.find((s) => s.setor_id === setorId);
    if (!base) return;
    const nova = newSetor({
      id: base.setor_id,
      nome_setor: base.setor_nome,
      ghe_ges: base.ges,
      descricao_ambiente: base.descricao_ambiente,
    });
    const next = [...setoresAet, nova];
    setSetoresAet(next);
    setEditingSetorIdx(next.length - 1);
  };

  const updateSetor = (idx: number, patch: Partial<SetorAet>) => {
    setSetoresAet(setoresAet.map((s, i) => (i === idx ? { ...s, ...patch, _salvo: patch._salvo ?? false } : s)));
  };

  // Persistência
  const persist = async (status: "rascunho" | "concluido", silent = false): Promise<string | null> => {
    if (!empresaId) {
      toast.error("Selecione a empresa");
      return null;
    }
    if (!contratoId && status === "concluido") {
      toast.error("Selecione o contrato");
      return null;
    }
    if (status === "concluido") {
      if (!responsavelTecnico.trim() || !dataElaboracao) {
        toast.error("Preencha responsável técnico e data de elaboração");
        return null;
      }
      if (setoresAet.length === 0) {
        toast.error("Adicione ao menos um setor");
        return null;
      }
    }
    setSaving(true);
    try {
      let docIdLocal = docId;
      if (!docIdLocal) {
        const { data: doc, error: docErr } = await supabase
          .from("documentos")
          .insert({
            tipo: "AET",
            empresa_id: empresaId,
            empresa_nome: empresaNome,
            status,
          })
          .select()
          .single();
        if (docErr) throw docErr;
        docIdLocal = doc.id;
        setDocId(docIdLocal);
      } else {
        await supabase
          .from("documentos")
          .update({ empresa_id: empresaId, empresa_nome: empresaNome, status })
          .eq("id", docIdLocal);
      }

      const payload = {
        documento_id: docIdLocal,
        empresa_id: empresaId,
        contrato_id: contratoId || null,
        responsavel_tecnico: responsavelTecnico,
        crea,
        cargo,
        data_elaboracao: dataElaboracao || null,
        alteracoes_documento: alteracoes,
        revisoes: revisoes as any,
        setores: setoresAet as any,
        status,
      };

      if (aetId) {
        const { error } = await supabase.from("aet_documentos").update(payload).eq("id", aetId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("aet_documentos").insert(payload).select().single();
        if (error) throw error;
        setAetId(data.id);
      }

      if (!silent) toast.success(status === "concluido" ? "AET finalizada!" : "Rascunho salvo");
      return docIdLocal;
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Salvar setor (marca como concluído visualmente)
  const handleSalvarSetor = async () => {
    if (editingSetorIdx === null) return;
    const setor = setoresAet[editingSetorIdx];
    if (!setor.funcoes_selecionadas || setor.funcoes_selecionadas.length === 0) {
      toast.error("Selecione ao menos uma função");
      return;
    }
    if (setor.colaboradores.some((c) => c.nome_colaborador.trim() && !c.funcao)) {
      toast.error("Defina a função de cada colaborador avaliado");
      return;
    }
    if (!setor.descricao_atividade.trim()) {
      toast.error("Descreva a atividade");
      return;
    }
    const newSetores = setoresAet.map((s, i) =>
      i === editingSetorIdx ? { ...s, _salvo: true } : s
    );
    setSetoresAet(newSetores);
    // Persist with the updated array (state will update async)
    setEditingSetorIdx(null);
    toast.success(`Setor "${setor.setor_nome}" salvo`);
    // Trigger save in background
    setTimeout(() => persist("rascunho", true), 100);
  };

  // ─── BUILD TEMPLATE DATA ───
  // Padrão LTCAT: variáveis de empresa e contrato na RAIZ do JSON (sem objetos aninhados)
  const buildTemplateData = () => {
    const emp = empresaSelecionada || ({} as any);

    const data = {
      // ─── EMPRESA (raiz, padrão LTCAT) ───
      empresa: emp?.razao_social || emp?.nome_fantasia || empresaNome || "",
      empresa_nome: empresaNome || emp?.razao_social || "",
      razao_social: emp?.razao_social || empresaNome || "",
      nome_fantasia: emp?.nome_fantasia || "",
      cnpj: emp?.cnpj || "",
      cnae_principal: emp?.cnae_principal || "",
      cnae: emp?.cnae_principal || "",
      grau_risco: emp?.grau_risco || "",
      endereco: emp?.endereco || "",
      preposto_nome: emp?.preposto_nome || "",
      preposto_email: emp?.preposto_email || "",
      preposto_telefone: emp?.preposto_telefone || "",
      total_funcionarios: emp?.total_funcionarios?.toString() || "",
      numero_funcionarios_masc: emp?.numero_funcionarios_masc?.toString() || "",
      numero_funcionarios_fem: emp?.numero_funcionarios_fem?.toString() || "",
      jornada_trabalho: emp?.jornada_trabalho || "",

      // ─── CONTRATO (preferir tabela contratos quando vinculado, senão legado da empresa) ───
      ...(() => {
        const c: any = contratosEmpresa.find((x: any) => x.id === contratoId) || {};
        const pick = (a: any, b: any) => (a !== undefined && a !== null && a !== "" ? a : (b ?? ""));
        return {
          nome_contratante: pick(c.nome_contratante, emp?.nome_contratante),
          cnpj_contratante: pick(c.cnpj_contratante, emp?.cnpj_contratante),
          numero_contrato: pick(c.numero_contrato, emp?.numero_contrato),
          vigencia_inicio: formatDate(c.vigencia_inicio || emp?.vigencia_inicio),
          vigencia_fim: formatDate(c.vigencia_fim || emp?.vigencia_fim),
          escopo_contrato: pick(c.escopo_contrato, emp?.escopo_contrato),
          gestor_nome: pick(c.gestor_nome, emp?.gestor_nome),
          gestor_email: pick(c.gestor_email, emp?.gestor_email),
          gestor_telefone: pick(c.gestor_telefone, emp?.gestor_telefone),
          fiscal_nome: pick(c.fiscal_nome, emp?.fiscal_nome),
          fiscal_email: pick(c.fiscal_email, emp?.fiscal_email),
          fiscal_telefone: pick(c.fiscal_telefone, emp?.fiscal_telefone),
          preposto_nome_contrato: pick(c.preposto_nome, emp?.preposto_nome),
          preposto_email_contrato: pick(c.preposto_email, emp?.preposto_email),
          preposto_telefone_contrato: pick(c.preposto_telefone, emp?.preposto_telefone),
          local_trabalho: pick(c.local_trabalho, emp?.local_trabalho),
          jornada_trabalho_contrato: pick(c.jornada_trabalho, emp?.jornada_trabalho),
          total_funcionarios_contrato: (c.total_funcionarios ?? emp?.total_funcionarios ?? "").toString(),
        };
      })(),

      responsavel_tecnico: responsavelTecnico || "",
      crea: crea || "",
      cargo: cargo || "",
      data_elaboracao: formatDate(dataElaboracao),
      alteracoes_documento: alteracoes || "",
      revisoes: revisoes.map((r) => ({
        data_revisao: formatDate(r.data_revisao),
        descricao_revisao: r.descricao_revisao || "",
      })),
      setores: setoresAet.map((s) => {
        const funcoesSel = (s.funcoes_selecionadas && s.funcoes_selecionadas.length > 0)
          ? s.funcoes_selecionadas
          : (s.funcao_nome ? [{ id: s.funcao_id, nome: s.funcao_nome }] : []);
        const funcoesNomes = funcoesSel.map((f) => f.nome).filter(Boolean);
        return {
          setor_nome: s.setor_nome || "",
          ges: s.ges || "",
          descricao_ambiente: s.descricao_ambiente || "",
          funcao_nome: funcoesNomes.join(", ") || s.funcao_nome || "",
          funcoes_selecionadas: funcoesNomes.map((nome) => ({ nome })),
          funcoes_lista: funcoesNomes.join(", "),
          numero_funcionarios: s.numero_funcionarios || "",
          posto_trabalho: s.posto_trabalho || "",
          descricao_atividade: s.descricao_atividade || "",
          analise_organizacional: s.analise_organizacional || "",
          tarefas: s.tarefas || "",
          riscos_observados: s.riscos_observados || "",
          cronoanalise: (s.cronoanalise || []).map((t) => ({
            tarefa: t.tarefa || "",
            tempo: t.tempo || "",
            risco: t.risco || "",
          })),
          avaliacoes_dimensionais: DIMENSOES_LABELS.map(({ key, label }) => {
            const it = s.avaliacoes_dimensionais?.[key] || { medida: "", avaliacao: "" };
            return { item: label, medida: it.medida || "", avaliacao: it.avaliacao || "" };
          }),
          dimensoes: (() => {
            const out: Record<string, { medida: string; avaliacao: string }> = {};
            DIMENSOES_LABELS.forEach(({ key }) => {
              const it = s.avaliacoes_dimensionais?.[key] || { medida: "", avaliacao: "" };
              out[key] = { medida: it.medida || "", avaliacao: it.avaliacao || "" };
            });
            return out;
          })(),
          resultado_psicossocial_texto: s.resultado_psicossocial_texto || "",
          ritmo_complexidade: s.ritmo_complexidade || "",
          jornada_aspectos: s.jornada_aspectos || "",
          caracterizacao_biomecanica: s.caracterizacao_biomecanica || "",
          diagnostico_ergonomico: s.diagnostico_ergonomico || "",
          conclusao: s.conclusao || "",
          colaboradores: (s.colaboradores || []).map((c) => ({
            nome_colaborador: c.nome_colaborador || "",
            nome: c.nome_colaborador || "",
            funcao: c.funcao || "",
            data_avaliacao: formatDate(c.data_avaliacao),
          })),
          colaboradores_avaliados: (s.colaboradores || []).map((c) => ({
            nome: c.nome_colaborador || "",
            funcao: c.funcao || "",
            data_avaliacao: formatDate(c.data_avaliacao),
          })),
        avaliacoes_quantitativas: (s.avaliacoes_quantitativas || []).map((a) => ({
          especificacao_setor: a.especificacao_setor || "",
          ruido_valor: a.ruido_valor || "",
          ruido_unidade: a.ruido_unidade || "",
          limite_ruido: a.limite_ruido || "",
          unidade_limite_ruido: a.unidade_limite_ruido || "",
          iluminancia_valor: a.iluminancia_valor || "",
          iluminancia_unidade: a.iluminancia_unidade || "",
          limite_iluminancia: a.limite_iluminancia || "",
          unidade_limite_iluminancia: a.unidade_limite_iluminancia || "",
          temperatura_valor: a.temperatura_valor || "",
          temperatura_unidade: a.temperatura_unidade || "",
          limite_temperatura: a.limite_temperatura || "",
        })),
        plano_acao: (s.plano_acao || []).map((p) => ({
          o_que: p.o_que || "",
          como: p.como || "",
          responsavel: p.responsavel || "",
          prazo: p.prazo || "",
        })),
        ferramentas: (s.ferramentas || []).map((f) => ({
          tipo: f.tipo || "",
          dados_avaliacao: f.dados_avaliacao || "",
          resultado: f.resultado || "",
        })),
        descricao_imagens_ambiente: s.descricao_imagens_ambiente || "",
        descricao_imagens_funcao: s.descricao_imagens_funcao || "",
        ...(() => {
          const blocosVazios = createEmptyPsicoBlocos();
          const lista = (s.avaliacoes_psicossociais || []).map((p) => {
            const calc = calcularPsicossocial(p);
            const blocosNorm = normalizePsicoBlocos(calc.blocos);
            return {
              colaborador_nome: calc.colaborador_nome || "",
              data_avaliacao: formatDate(calc.data_avaliacao),
              resultado_psicossocial: calc.resultado_psicossocial || "",
              riscos_psicossociais: calc.riscos_psicossociais || "",
              copsoq_resultado_resumido: calc.copsoq_resultado_resumido || "",
              copsoq_riscos_identificados: calc.copsoq_riscos_identificados || "",
              total_positivas: calc.total_positivas ?? 0,
              total_negativas: calc.total_negativas ?? 0,
              blocos: blocosNorm,
              alertas: {
                alerta_amarelo: calc.alertas?.alerta_amarelo ? "SIM" : "Não",
                alerta_vermelho: calc.alertas?.alerta_vermelho ? "SIM" : "Não",
                recomendacao_imediata: calc.alertas?.recomendacao_imediata ? "SIM" : "Não",
              },
            };
          });
          const primeira = lista[0];
          const avaliacao_psicossocial = primeira || {
            colaborador_nome: "",
            data_avaliacao: "",
            resultado_psicossocial: "",
            riscos_psicossociais: "",
            copsoq_resultado_resumido: "",
            copsoq_riscos_identificados: "",
            total_positivas: 0,
            total_negativas: 0,
            blocos: blocosVazios,
            alertas: { alerta_amarelo: "Não", alerta_vermelho: "Não", recomendacao_imediata: "Não" },
          };
          return {
            avaliacoes_psicossociais: lista,
            avaliacao_psicossocial,
            blocos: normalizePsicoBlocos(avaliacao_psicossocial.blocos),
            resultado_psicossocial: s.resultado_psicossocial_texto || avaliacao_psicossocial.resultado_psicossocial || "",
            resultado_psicossocial_auto: avaliacao_psicossocial.resultado_psicossocial || "",
            riscos_psicossociais: avaliacao_psicossocial.riscos_psicossociais || "",
            copsoq_resultado_resumido: avaliacao_psicossocial.copsoq_resultado_resumido || "",
            copsoq_riscos_identificados: avaliacao_psicossocial.copsoq_riscos_identificados || "",
          };
        })(),
        };
      }),
    };
    console.log("JSON AET FINAL:", data);
    console.log("EMPRESA AET:", {
      razao_social: data.razao_social,
      cnpj: data.cnpj,
      endereco: data.endereco,
    });
    console.log("CONTRATO AET:", {
      numero_contrato: data.numero_contrato,
      gestor_nome: data.gestor_nome,
      fiscal_nome: data.fiscal_nome,
    });
    console.log("BLOCOS PSICOSSOCIAIS:", data.setores.map((s) => s.blocos));
    return data;
  };

  const loadTemplateDoc = async () => {
    const template = templates.find((t: any) => t.id === selectedTemplate);
    if (!template) throw new Error("Template não encontrado");

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("templates")
      .download(template.file_path);
    if (downloadError) throw downloadError;

    const path: string = String(template.file_path || "").toLowerCase();
    const isHtml = path.endsWith(".html") || path.endsWith(".htm");

    if (isHtml) {
      const htmlSource = await fileData.text();
      let lastData: any = null;
      const wrapper: any = {
        kind: "html",
        render(data: any) { lastData = data; },
        async toBlob() { return await renderHtmlTemplateToDocx(htmlSource, lastData ?? {}); },
        getZip() {
          return { generate: async () => await renderHtmlTemplateToDocx(htmlSource, lastData ?? {}) };
        },
      };
      return wrapper;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    return new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });
  };

  const handleValidate = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }
    setValidating(true);
    setValidated(false);
    try {
      const doc = await loadTemplateDoc();
      const data = buildTemplateData();
      if (hasMissingPsicossocial(data)) {
        toast.error("Avaliação psicossocial não preenchida");
        return;
      }
      try {
        doc.render(data);
        setValidated(true);
        setErrorList([]);
        toast.success("✅ Documento pronto para geração");
      } catch (renderErr: any) {
        const errs = parseDocxErrors(renderErr).map((e) => ({
          tipo: e.tipo,
          explicacao: e.mensagem + " — " + e.explicacao,
          correcao: e.correcao,
        }));
        setErrorList(errs);
        setErrorsModalOpen(true);
        toast.error(`${errs.length} erro(s) no template`);
      }
    } catch (e: any) {
      toast.error("Erro ao validar: " + e.message);
    } finally {
      setValidating(false);
    }
  };

  const handleGenerate = async () => {
    if (!validated) {
      toast.error("🚫 Valide o documento antes de gerar");
      return;
    }
    setGenerating(true);
    try {
      const doc = await loadTemplateDoc();
      const data = buildTemplateData();
      if (hasMissingPsicossocial(data)) {
        toast.error("Avaliação psicossocial não preenchida");
        return;
      }
      doc.render(data);

      const output: Blob = (doc as any).kind === "html"
        ? await (doc as any).toBlob()
        : (doc as any).getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

      const fileName = `AET_${empresaNome.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getFullYear()}.docx`;
      const storagePath = `documentos/${Date.now()}_${fileName}`;
      const { error: upErr } = await supabase.storage.from("templates").upload(storagePath, output);

      if (docId) {
        await supabase.from("documentos").update({
          file_path: storagePath,
          template_id: selectedTemplate,
          status: upErr ? "erro" : "concluido",
        }).eq("id", docId);
      }

      saveAs(output, fileName);
      toast.success("📄 Documento gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar documento: " + (err.message || ""));
    } finally {
      setGenerating(false);
    }
  };

  // ─── EMITIR DOCUMENTO ───
  const handleEmitir = async () => {
    const id = await persist("rascunho", true);
    if (id) setShowGerar(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ───── TELA: GERAR DOCUMENTO ─────
  if (showGerar) {
    return (
      <div className="max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => { setShowGerar(false); setValidated(false); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">Gerar Documento AET</h1>
            <p className="text-xs text-muted-foreground">{empresaNome}</p>
          </div>
        </div>

        <Card className="p-8 text-center">
          <FileDown className="w-12 h-12 mx-auto text-accent mb-4" />
          <h2 className="font-heading text-xl font-bold mb-2">Selecione o template AET</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Escolha o template, valide as variáveis e gere o documento final
          </p>

          <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setValidated(false); }}>
            <SelectTrigger className="max-w-md mx-auto"><SelectValue placeholder="Escolher template" /></SelectTrigger>
            <SelectContent>
              {templatesToShow.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">Nenhum template cadastrado</div>
              )}
              {templatesToShow.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={validating || !selectedTemplate}
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
              Validar Documento
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !validated}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Gerar Documento
            </Button>
          </div>

          {validated && (
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />Documento pronto para geração
            </div>
          )}
        </Card>

        {/* Errors modal */}
        <Dialog open={errorsModalOpen} onOpenChange={setErrorsModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Erros encontrados no template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {errorList.map((e, i) => (
                <Card key={i} className="p-3 border-destructive/30">
                  <p className="text-sm font-semibold text-destructive">{e.tipo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{e.explicacao}</p>
                  <p className="text-xs mt-2"><strong>Correção:</strong> {e.correcao}</p>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setErrorsModalOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ───── EDITOR DE SETOR ─────
  if (editingSetorIdx !== null) {
    const setor = setoresAet[editingSetorIdx];
    const funcoesSetor = funcoesAll.filter((f: any) => f.setor_id === setor.setor_id);

    return (
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setEditingSetorIdx(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold">{setor.setor_nome}</h1>
            <p className="text-xs text-muted-foreground">Edição da AET deste setor</p>
          </div>
          <Button
            onClick={() => {
              const faltantes: string[] = [];
              if (!setor.funcoes_selecionadas || setor.funcoes_selecionadas.length === 0) faltantes.push("Funções Avaliadas");
              if (!setor.ferramentas || setor.ferramentas.length === 0) faltantes.push("Ferramentas Ergonômicas");
              const temPsico = (setor.avaliacoes_psicossociais && setor.avaliacoes_psicossociais.length > 0)
                || !!setor.resultado_psicossocial_texto?.trim();
              if (!temPsico) faltantes.push("Avaliação Psicossocial");
              const temDim = Object.values(setor.avaliacoes_dimensionais || {}).some(
                (d: any) => (d?.medida && String(d.medida).trim()) || (d?.avaliacao && String(d.avaliacao).trim()),
              );
              if (!temDim) faltantes.push("Avaliações Antropométricas / Dimensionais");
              const temQuant = (setor.avaliacoes_quantitativas || []).some((a: any) =>
                a.ruido_valor || a.iluminancia_valor || a.temperatura_valor || a.especificacao_setor,
              );
              if (!temQuant) faltantes.push("Avaliações Quantitativas");
              if (faltantes.length > 0) {
                toast.error("Preencha antes de gerar: " + faltantes.join(", "));
                return;
              }
              setIaObs("");
              setIaFiles([]);
              setIaMode("substituir");
              setIaOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
          >
            <Sparkles className="w-4 h-4 mr-2" />Gerar Automaticamente
          </Button>
        </div>

        {/* Identificação */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Identificação do setor</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>GES</Label>
              <Input value={setor.ges} onChange={(e) => updateSetor(editingSetorIdx, { ges: e.target.value })} />
            </div>
            <div>
              <Label>Setor</Label>
              <Input value={setor.setor_nome} disabled />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição do ambiente</Label>
              <Textarea
                value={setor.descricao_ambiente}
                onChange={(e) => updateSetor(editingSetorIdx, { descricao_ambiente: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Funções avaliadas *</Label>
              <div className="border rounded-lg p-3 bg-card max-h-44 overflow-y-auto space-y-1.5">
                {funcoesSetor.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma função cadastrada para este setor.</p>
                )}
                {funcoesSetor.map((f: any) => {
                  const checked = setor.funcoes_selecionadas.some((x) => x.id === f.id);
                  return (
                    <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          let next = [...setor.funcoes_selecionadas];
                          if (v) {
                            if (!checked) next.push({ id: f.id, nome: f.nome_funcao });
                          } else {
                            next = next.filter((x) => x.id !== f.id);
                          }
                          // Limpa colaboradores que apontavam para função removida
                          const nomesValidos = new Set(next.map((x) => x.nome));
                          const colabsAjustados = setor.colaboradores.map((c) =>
                            c.funcao && !nomesValidos.has(c.funcao) ? { ...c, funcao: "" } : c
                          );
                          const removidos = setor.colaboradores.some(
                            (c) => c.funcao && !nomesValidos.has(c.funcao)
                          );
                          if (removidos) {
                            toast.warning("Função removida — revise os colaboradores afetados");
                          }
                          updateSetor(editingSetorIdx, {
                            funcoes_selecionadas: next,
                            funcao_id: next[0]?.id || "",
                            funcao_nome: next.map((x) => x.nome).join(", "),
                            colaboradores: colabsAjustados,
                          });
                        }}
                      />
                      {f.nome_funcao}
                    </label>
                  );
                })}
              </div>
              {setor.funcoes_selecionadas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {setor.funcoes_selecionadas.map((f) => (
                    <Badge key={f.id} variant="secondary" className="text-xs">{f.nome}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Nº de funcionários</Label>
              <Input
                type="number"
                value={setor.numero_funcionarios}
                onChange={(e) => updateSetor(editingSetorIdx, { numero_funcionarios: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Colaboradores */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Colaboradores avaliados</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { colaboradores: [...setor.colaboradores, emptyColab()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {setor.colaboradores.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Função</Label>
                  <Select
                    value={c.funcao || ""}
                    onValueChange={(v) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], funcao: v };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        setor.funcoes_selecionadas.length === 0 ? "Selecione função no topo" : "Selecione"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {setor.funcoes_selecionadas.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={c.nome_colaborador}
                    onChange={(e) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], nome_colaborador: e.target.value };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }}
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Data avaliação</Label>
                  <Input
                    type="date"
                    value={c.data_avaliacao}
                    onChange={(e) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], data_avaliacao: e.target.value };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }}
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                  updateSetor(editingSetorIdx, { colaboradores: setor.colaboradores.filter((_, k) => k !== i) })
                }>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {setor.colaboradores.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum colaborador adicionado.</p>
            )}
          </div>
        </Card>

        {/* Campos descritivos */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Descrição da atividade e ambiente</h2>
          <div className="space-y-3">
            {([
              ["posto_trabalho", "Posto de trabalho"],
              ["descricao_atividade", "Descrição da atividade *"],
              ["analise_organizacional", "Análise organizacional"],
              ["ritmo_complexidade", "Ritmo e complexidade"],
              ["jornada_aspectos", "Jornada e aspectos temporais"],
              ["caracterizacao_biomecanica", "Caracterização biomecânica"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Textarea
                  rows={3}
                  value={(setor as any)[key]}
                  onChange={(e) => updateSetor(editingSetorIdx, { [key]: e.target.value } as any)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Cronoanálise de Tarefas */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-semibold">Cronoanálise de Tarefas</h2>
              <p className="text-xs text-muted-foreground">Descrição da tarefa, tempo médio e risco associado</p>
            </div>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { cronoanalise: [...setor.cronoanalise, emptyCrono()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar tarefa
            </Button>
          </div>
          <div className="space-y-2">
            {setor.cronoanalise.map((t, i) => {
              const updateT = (patch: Partial<Cronoanalise>) => {
                const arr = [...setor.cronoanalise];
                arr[i] = { ...arr[i], ...patch };
                updateSetor(editingSetorIdx, { cronoanalise: arr });
              };
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-start border border-border rounded-lg p-2">
                  <div className="col-span-5">
                    <Label className="text-xs">Tarefa</Label>
                    <Textarea rows={2} value={t.tarefa} onChange={(e) => updateT({ tarefa: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Tempo médio</Label>
                    <Input placeholder="ex: 15 min" value={t.tempo} onChange={(e) => updateT({ tempo: e.target.value })} />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">Risco associado</Label>
                    <Input value={t.risco} onChange={(e) => updateT({ risco: e.target.value })} />
                  </div>
                  <div className="col-span-1 flex justify-end pt-5">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                      updateSetor(editingSetorIdx, { cronoanalise: setor.cronoanalise.filter((_, k) => k !== i) })
                    }>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {setor.cronoanalise.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma tarefa adicionada.</p>
            )}
          </div>
        </Card>

        {/* Avaliações Antropométricas / Dimensionais */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-1">Avaliações Antropométricas / Dimensionais</h2>
          <p className="text-xs text-muted-foreground mb-3">Registre a medida real e a avaliação (Adequado / Inadequado / Observações)</p>
          <div className="space-y-2">
            {DIMENSOES_LABELS.map(({ key, label }) => {
              const item = setor.avaliacoes_dimensionais[key];
              const updateD = (patch: Partial<DimensaoItem>) => {
                updateSetor(editingSetorIdx, {
                  avaliacoes_dimensionais: {
                    ...setor.avaliacoes_dimensionais,
                    [key]: { ...item, ...patch },
                  },
                });
              };
              return (
                <div key={key} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 text-sm">{label}</div>
                  <div className="col-span-3">
                    <Input placeholder="Medida" value={item.medida} onChange={(e) => updateD({ medida: e.target.value })} />
                  </div>
                  <div className="col-span-5">
                    <Input placeholder="Avaliação" value={item.avaliacao} onChange={(e) => updateD({ avaliacao: e.target.value })} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Avaliação Psicossocial (COPSOQ) */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" />Avaliação Psicossocial
              </h2>
              <p className="text-xs text-muted-foreground">Aplicação do questionário COPSOQ por colaborador</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPsicoOpen(true)}>
              {setor.avaliacoes_psicossociais.length > 0
                ? `Editar (${setor.avaliacoes_psicossociais.length})`
                : "Registrar Avaliação"}
            </Button>
          </div>
          {setor.avaliacoes_psicossociais.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {setor.avaliacoes_psicossociais.map((p, i) => (
                <div key={i} className="text-xs border border-border rounded-lg p-2">
                  <p className="font-semibold">{p.colaborador_nome || "Sem nome"}</p>
                  <p className="text-muted-foreground line-clamp-2">{p.resultado_psicossocial}</p>
                </div>
              ))}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Resultados e Análises (editável)</Label>
              {setor.avaliacoes_psicossociais.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => {
                  const partes = setor.avaliacoes_psicossociais.map((p) => {
                    const calc = calcularPsicossocial(p);
                    const nome = calc.colaborador_nome || "Colaborador";
                    const resumo = calc.copsoq_resultado_resumido || calc.resultado_psicossocial || "";
                    const riscos = calc.copsoq_riscos_identificados || calc.riscos_psicossociais || "";
                    return `${nome}: ${resumo}${riscos ? `\nRiscos identificados: ${riscos}` : ""}`;
                  }).filter(Boolean);
                  updateSetor(editingSetorIdx, { resultado_psicossocial_texto: partes.join("\n\n") });
                }}>
                  Recarregar do COPSOQ
                </Button>
              )}
            </div>
            <Textarea
              rows={5}
              placeholder="Preenchido automaticamente a partir das avaliações vinculadas. Ajustes manuais são preservados."
              value={setor.resultado_psicossocial_texto}
              onChange={(e) => updateSetor(editingSetorIdx, { resultado_psicossocial_texto: e.target.value })}
            />
          </div>
        </Card>


        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" />Ferramentas Ergonômicas
              </h2>
              <p className="text-xs text-muted-foreground">RULA, REBA, OCRA, NIOSH, OWAS, Moore-Garg</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFerramentasOpen(true)}>
              {setor.ferramentas.length > 0 ? `Editar (${setor.ferramentas.length})` : "Adicionar"}
            </Button>
          </div>
          {setor.ferramentas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {setor.ferramentas.map((f, i) => (
                <Badge key={i} variant="secondary" className="font-mono text-xs">
                  {f.tipo}: {f.resultado || "—"}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Avaliações quantitativas */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Avaliações quantitativas</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { avaliacoes_quantitativas: [...setor.avaliacoes_quantitativas, emptyAval()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {setor.avaliacoes_quantitativas.map((a, i) => {
              const updateA = (patch: Partial<AvalQuant>) => {
                const arr = [...setor.avaliacoes_quantitativas];
                arr[i] = { ...arr[i], ...patch };
                updateSetor(editingSetorIdx, { avaliacoes_quantitativas: arr });
              };
              const RUIDO_NORMA = "https://www2.uesb.br/biblioteca/wp-content/uploads/2022/03/ABNT-NBR10152-AC%C3%9ASTICA-N%C3%8DVEIS-DE-PRESS%C3%83O-SONORA-EM-AMBIENTES-INTERNOS-E-EDIFICA%C3%87%C3%95ES.pdf";
              const ILUM_NORMA = "https://drb-assessoria.com.br/drbr/nbrisocie8995.pdf";
              return (
                <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Especificação do setor/posto</Label>
                      <Input
                        value={a.especificacao_setor}
                        onChange={(e) => updateA({ especificacao_setor: e.target.value })}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                      updateSetor(editingSetorIdx, { avaliacoes_quantitativas: setor.avaliacoes_quantitativas.filter((_, k) => k !== i) })
                    }>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* RUÍDO */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <Label className="text-xs flex items-center gap-1">
                        Ruído
                        <a href={RUIDO_NORMA} target="_blank" rel="noopener noreferrer" title="ABNT NBR 10152" className="text-accent hover:text-accent/80">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Label>
                    </div>
                    <div className="col-span-2"><Input placeholder="valor" value={a.ruido_valor} onChange={(e) => updateA({ ruido_valor: e.target.value })} /></div>
                    <div className="col-span-2">
                      <Select value={a.ruido_unidade} onValueChange={(v) => updateA({ ruido_unidade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["dB(A)", "dB(C)", "dB"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3"><Input placeholder="limite" value={a.limite_ruido} onChange={(e) => updateA({ limite_ruido: e.target.value })} /></div>
                    <div className="col-span-3">
                      <Select value={a.unidade_limite_ruido} onValueChange={(v) => updateA({ unidade_limite_ruido: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["dB(A)", "dB(C)", "dB"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ILUMINÂNCIA */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <Label className="text-xs flex items-center gap-1">
                        Iluminância
                        <a href={ILUM_NORMA} target="_blank" rel="noopener noreferrer" title="NBR ISO/CIE 8995" className="text-accent hover:text-accent/80">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Label>
                    </div>
                    <div className="col-span-2"><Input placeholder="valor" value={a.iluminancia_valor} onChange={(e) => updateA({ iluminancia_valor: e.target.value })} /></div>
                    <div className="col-span-2">
                      <Select value={a.iluminancia_unidade} onValueChange={(v) => updateA({ iluminancia_unidade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["lux", "fc"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3"><Input placeholder="limite" value={a.limite_iluminancia} onChange={(e) => updateA({ limite_iluminancia: e.target.value })} /></div>
                    <div className="col-span-3">
                      <Select value={a.unidade_limite_iluminancia} onValueChange={(v) => updateA({ unidade_limite_iluminancia: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["lux", "fc"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* TEMPERATURA */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2"><Label className="text-xs">Temperatura</Label></div>
                    <div className="col-span-2"><Input placeholder="valor" value={a.temperatura_valor} onChange={(e) => updateA({ temperatura_valor: e.target.value })} /></div>
                    <div className="col-span-2"><Input placeholder="un" value={a.temperatura_unidade} onChange={(e) => updateA({ temperatura_unidade: e.target.value })} /></div>
                    <div className="col-span-6"><Input placeholder="limite" value={a.limite_temperatura} onChange={(e) => updateA({ limite_temperatura: e.target.value })} /></div>
                  </div>
                </div>
              );
            })}
            {setor.avaliacoes_quantitativas.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma avaliação adicionada.</p>
            )}
          </div>
        </Card>

        {/* Conclusão */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Diagnóstico e conclusão</h2>
          <div className="space-y-3">
            <div>
              <Label>Diagnóstico ergonômico</Label>
              <Textarea
                rows={3}
                value={setor.diagnostico_ergonomico}
                onChange={(e) => updateSetor(editingSetorIdx, { diagnostico_ergonomico: e.target.value })}
              />
            </div>
            <div>
              <Label>Conclusão</Label>
              <Textarea
                rows={3}
                value={setor.conclusao}
                onChange={(e) => updateSetor(editingSetorIdx, { conclusao: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Plano de ação */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Plano de ação</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { plano_acao: [...setor.plano_acao, emptyPlano()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {setor.plano_acao.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">O quê</Label>
                  <Input value={p.o_que} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], o_que: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Como</Label>
                  <Input value={p.como} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], como: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Responsável</Label>
                  <Input value={p.responsavel} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], responsavel: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Prazo</Label>
                  <Input value={p.prazo} onChange={(e) => {
                    const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], prazo: e.target.value };
                    updateSetor(editingSetorIdx, { plano_acao: arr });
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                  updateSetor(editingSetorIdx, { plano_acao: setor.plano_acao.filter((_, k) => k !== i) })
                }>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {setor.plano_acao.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma ação adicionada.</p>
            )}
          </div>
        </Card>

        {/* Descrição das imagens */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Descrição das imagens</h2>
          <div className="space-y-3">
            <div>
              <Label>Descrição das Imagens do Ambiente</Label>
              <Textarea
                rows={3}
                value={setor.descricao_imagens_ambiente}
                onChange={(e) => updateSetor(editingSetorIdx, { descricao_imagens_ambiente: e.target.value })}
                placeholder="Descreva o que as imagens do ambiente retratam (layout, condições, equipamentos visíveis, etc.)"
              />
            </div>
            <div>
              <Label>Descrição das Imagens da Função</Label>
              <Textarea
                rows={3}
                value={setor.descricao_imagens_funcao}
                onChange={(e) => updateSetor(editingSetorIdx, { descricao_imagens_funcao: e.target.value })}
                placeholder="Descreva o que as imagens da função retratam (postura, movimentos, ferramentas utilizadas, etc.)"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-xl border border-border">
          <Button variant="outline" onClick={() => setEditingSetorIdx(null)}>
            Voltar sem salvar
          </Button>
          <Button onClick={handleSalvarSetor} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        <FerramentasModal
          open={ferramentasOpen}
          onOpenChange={setFerramentasOpen}
          ferramentas={setor.ferramentas}
          onChange={(f) => updateSetor(editingSetorIdx, { ferramentas: f })}
        />
        <PsicossocialModal
          open={psicoOpen}
          onOpenChange={setPsicoOpen}
          avaliacoes={setor.avaliacoes_psicossociais}
          onChange={(a) => updateSetor(editingSetorIdx, { avaliacoes_psicossociais: a })}
          relatorioContext={{
            empresa_nome: empresaSelecionada?.razao_social || empresaNome,
            cnpj: empresaSelecionada?.cnpj,
            contrato_numero: (contratosEmpresa.find((c: any) => c.id === contratoId) as any)?.numero_contrato,
            setor_nome: setor.setor_nome,
            ges: setor.ges,
            descricao_ambiente: setor.descricao_ambiente,
            funcoes: (setor.funcoes_selecionadas || []).map((f) => f.nome).filter(Boolean),
            jornada_trabalho: (empresaSelecionada as any)?.jornada_trabalho,
            atividades: setor.descricao_atividade || setor.tarefas,
            supervisao: setor.analise_organizacional,
            atividades_funcoes: (setor.funcoes_selecionadas || [])
              .map((fs: any) => {
                const f: any = (funcoesAll as any[]).find((x) => x.id === fs.id);
                return f?.descricao_atividades || "";
              })
              .filter(Boolean),
            responsavel: responsavelTecnico,
            cargo_responsavel: cargo,
            crea,
            data_elaboracao: dataElaboracao
              ? new Date(dataElaboracao + "T00:00:00").toLocaleDateString("pt-BR")
              : "",
          }}
        />

        {/* Modal — Gerar AET com IA */}
        <Dialog open={iaOpen} onOpenChange={(v) => { if (!iaLoading) setIaOpen(v); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Gerar AET Automaticamente com IA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Descreva livremente o que foi observado in loco (posto, mobiliário, postura, ritmo, jornada, ambiente,
                queixas dos colaboradores, imagens observadas etc). A IA irá consolidar essa descrição com o contexto
                cadastrado (empresa, contrato, setor, funções, ferramentas ergonômicas, avaliação psicossocial,
                avaliações quantitativas e dimensionais) e preencher automaticamente os campos técnicos da AET,
                fundamentando-se em Ergonomia e na NR-17.
              </p>
              <Textarea
                rows={10}
                placeholder="Ex.: Colaborador trabalha sentado 8h/dia em cadeira sem regulagem, monitor abaixo da linha dos olhos, mesa fixa. Ritmo intenso, metas semanais, pouca pausa. Queixas de dor lombar e cervical..."
                value={iaObs}
                onChange={(e) => setIaObs(e.target.value)}
                disabled={iaLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Campos gerados: posto de trabalho, atividade, organização, ritmo/jornada, biomecânica, cronoanálise,
                avaliação dimensional, diagnóstico, conclusão e plano de ação.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIaOpen(false)} disabled={iaLoading}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (iaObs.trim().length < 20) {
                    toast.error("Descreva com mais detalhes (mínimo 20 caracteres).");
                    return;
                  }
                  setIaLoading(true);
                  try {
                    const emp: any = empresaSelecionada || {};
                    const contrato: any = (contratosEmpresa as any[]).find((c: any) => c.id === contratoId) || {};
                    const funcoesDetalhes = (setor.funcoes_selecionadas || []).map((fs: any) => {
                      const f: any = (funcoesAll as any[]).find((x: any) => x.id === fs.id);
                      return { nome: fs.nome, descricao_atividades: f?.descricao_atividades || "" };
                    });
                    const psicoResumo = (setor.avaliacoes_psicossociais || []).map((p: any) => {
                      const calc = calcularPsicossocial(p);
                      return {
                        colaborador: calc.colaborador_nome,
                        resultado: calc.copsoq_resultado_resumido || calc.resultado_psicossocial,
                        riscos: calc.copsoq_riscos_identificados || calc.riscos_psicossociais,
                        alertas: calc.alertas,
                      };
                    });
                    const contexto = {
                      empresa: {
                        razao_social: emp.razao_social,
                        cnpj: emp.cnpj,
                        cnae: emp.cnae_principal,
                        grau_risco: emp.grau_risco,
                        endereco: emp.endereco,
                        jornada_trabalho: emp.jornada_trabalho,
                      },
                      contrato: {
                        numero: contrato.numero_contrato,
                        contratante: contrato.nome_contratante,
                      },
                      setor: {
                        nome: setor.setor_nome,
                        ges: setor.ges,
                        descricao_ambiente: setor.descricao_ambiente,
                        numero_funcionarios: setor.numero_funcionarios,
                      },
                      funcoes: funcoesDetalhes,
                      ferramentas_ergonomicas: setor.ferramentas,
                      avaliacao_psicossocial: {
                        resumo_editavel: setor.resultado_psicossocial_texto,
                        avaliacoes: psicoResumo,
                      },
                      avaliacoes_quantitativas: setor.avaliacoes_quantitativas,
                      avaliacoes_dimensionais: setor.avaliacoes_dimensionais,
                      cronoanalise_previa: setor.cronoanalise,
                    };
                    const { data, error } = await supabase.functions.invoke("aet-generate", {
                      body: { descricao: iaObs, contexto },
                    });
                    if (error) throw error;
                    if ((data as any)?.error) throw new Error((data as any).error);
                    const out: any = (data as any)?.output || {};
                    const patch: Partial<SetorAet> = {};
                    if (out.posto_trabalho) patch.posto_trabalho = out.posto_trabalho;
                    if (out.descricao_atividade) patch.descricao_atividade = out.descricao_atividade;
                    if (out.analise_organizacional) patch.analise_organizacional = out.analise_organizacional;
                    if (out.ritmo_complexidade) patch.ritmo_complexidade = out.ritmo_complexidade;
                    if (out.jornada_aspectos) patch.jornada_aspectos = out.jornada_aspectos;
                    if (out.caracterizacao_biomecanica) patch.caracterizacao_biomecanica = out.caracterizacao_biomecanica;
                    if (out.diagnostico_ergonomico) patch.diagnostico_ergonomico = out.diagnostico_ergonomico;
                    if (out.conclusao) patch.conclusao = out.conclusao;
                    if (Array.isArray(out.cronoanalise) && out.cronoanalise.length > 0) {
                      patch.cronoanalise = out.cronoanalise.map((c: any) => ({
                        tarefa: String(c.tarefa || ""),
                        tempo: String(c.tempo || ""),
                        risco: String(c.risco || ""),
                      }));
                    }
                    if (Array.isArray(out.plano_acao) && out.plano_acao.length > 0) {
                      patch.plano_acao = out.plano_acao.map((p: any) => ({
                        o_que: String(p.o_que || ""),
                        como: String(p.como || ""),
                        responsavel: String(p.responsavel || ""),
                        prazo: String(p.prazo || ""),
                      }));
                    }
                    if (out.avaliacoes_dimensionais && typeof out.avaliacoes_dimensionais === "object") {
                      const dims = { ...setor.avaliacoes_dimensionais };
                      for (const k of Object.keys(dims) as (keyof AvaliacoesDimensionais)[]) {
                        const v = out.avaliacoes_dimensionais[k];
                        if (v && typeof v === "string") {
                          dims[k] = { ...dims[k], avaliacao: v };
                        }
                      }
                      patch.avaliacoes_dimensionais = dims;
                    }
                    updateSetor(editingSetorIdx, patch);
                    toast.success("AET gerada automaticamente. Revise os campos antes de salvar.");
                    setIaOpen(false);
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e?.message || "Erro ao gerar AET com IA");
                  } finally {
                    setIaLoading(false);
                  }
                }}
                disabled={iaLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              >
                {iaLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {iaLoading ? "Gerando..." : "Gerar AET"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ───── TELA PRINCIPAL ─────
  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/documentos")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Análise Ergonômica do Trabalho (AET)</h1>
          <p className="text-xs text-muted-foreground">Cadastro completo do documento</p>
        </div>
      </div>

      {/* Identificação */}
      <Card className="p-5 mb-4">
        <h2 className="font-heading font-semibold mb-3">1. Identificação</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setContratoId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {empresas.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Contrato</Label>
            <Select value={contratoId || "__none__"} onValueChange={(v) => setContratoId(v === "__none__" ? "" : v)} disabled={!empresaId}>
              <SelectTrigger>
                <SelectValue placeholder={empresaId ? "Selecione um contrato" : "Selecione a empresa primeiro"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sem contrato —</SelectItem>
                {contratosEmpresa.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.numero_contrato || "Contrato"} {c.nome_contratante ? `· ${c.nome_contratante}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {empresaId && contratosEmpresa.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Nenhum contrato cadastrado. Cadastre em Empresas & Contratos.
              </p>
            )}
          </div>
          <div>
            <Label>Responsável técnico *</Label>
            <Input value={responsavelTecnico} onChange={(e) => setResponsavelTecnico(e.target.value)} />
          </div>
          <div>
            <Label>CREA</Label>
            <Input value={crea} onChange={(e) => setCrea(e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
          <div>
            <Label>Data de elaboração *</Label>
            <Input type="date" value={dataElaboracao} onChange={(e) => setDataElaboracao(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Alterações do documento</Label>
            <Textarea value={alteracoes} onChange={(e) => setAlteracoes(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Revisões</Label>
            <Button size="sm" variant="outline" onClick={() => setRevisoes([...revisoes, emptyRev()])}>
              <Plus className="w-4 h-4 mr-1" />Revisão
            </Button>
          </div>
          <div className="space-y-2">
            {revisoes.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={r.data_revisao} onChange={(e) => {
                    const arr = [...revisoes]; arr[i] = { ...arr[i], data_revisao: e.target.value };
                    setRevisoes(arr);
                  }} />
                </div>
                <div className="col-span-8">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={r.descricao_revisao} onChange={(e) => {
                    const arr = [...revisoes]; arr[i] = { ...arr[i], descricao_revisao: e.target.value };
                    setRevisoes(arr);
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                  setRevisoes(revisoes.filter((_, k) => k !== i))
                }>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Setores */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold">2. Setores avaliados</h2>
          <Button size="sm" variant="outline" disabled={!empresaId} onClick={() => setSelectModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />Selecionar setores
          </Button>
        </div>
        {setoresAet.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {empresaId ? "Nenhum setor adicionado" : "Selecione uma empresa primeiro"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from(
              setoresAet.reduce((map, s, idx) => {
                const g = map.get(s.setor_id) || { setor_id: s.setor_id, setor_nome: s.setor_nome, ges: s.ges, items: [] as { idx: number; data: SetorAet }[] };
                g.items.push({ idx, data: s });
                map.set(s.setor_id, g);
                return map;
              }, new Map<string, { setor_id: string; setor_nome: string; ges: string; items: { idx: number; data: SetorAet }[] }>()).values()
            ).map((g) => {
              const algumSalvo = g.items.some((it) => it.data._salvo);
              return (
                <div key={g.setor_id} className="border rounded-lg p-4 border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{g.setor_nome}</h3>
                      {g.ges && <p className="text-xs text-muted-foreground">GES: {g.ges}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.items.length} avaliação{g.items.length !== 1 ? "ões" : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => removeSetorGroup(g.setor_id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {g.items.map((it, n) => (
                      <div
                        key={it.idx}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded border text-sm ${
                          it.data._salvo ? "border-emerald-500/40 bg-emerald-50/40" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {it.data._salvo && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          <span className="truncate">Avaliação {n + 1}</span>
                          {!it.data._salvo && <span className="text-xs text-muted-foreground">(pendente)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant={it.data._salvo ? "outline" : "default"} className="h-7" onClick={() => setEditingSetorIdx(it.idx)}>
                            {it.data._salvo ? "Editar" : "Registrar"}
                          </Button>
                          {g.items.length > 1 && (
                            <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => removeSetor(it.idx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {algumSalvo && (
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => addAvaliacaoSetor(g.setor_id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar mais
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-xl border border-border">
        <Button variant="outline" onClick={() => persist("rascunho")} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar rascunho
        </Button>
        {allSetoresSalvos && (
          <Button
            onClick={handleEmitir}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <FileDown className="w-4 h-4 mr-2" />Emitir Documento
          </Button>
        )}
      </div>

      {/* Modal de seleção de setores */}
      <Dialog open={selectModalOpen} onOpenChange={setSelectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar setores</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {setoresEmpresa.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Esta empresa não possui setores cadastrados.
              </p>
            )}
            {setoresEmpresa.map((s: any) => {
              const already = setoresAet.some((x) => x.setor_id === s.id);
              return (
                <label key={s.id} className={`flex items-center gap-2 p-2 rounded hover:bg-muted ${already ? "opacity-50" : "cursor-pointer"}`}>
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    disabled={already}
                    onCheckedChange={(v) => {
                      const next = new Set(selectedIds);
                      if (v) next.add(s.id); else next.delete(s.id);
                      setSelectedIds(next);
                    }}
                  />
                  <span className="text-sm">{s.nome_setor}</span>
                  {already && <span className="text-xs text-muted-foreground ml-auto">já adicionado</span>}
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmSetores} disabled={selectedIds.size === 0}>
              Adicionar ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
