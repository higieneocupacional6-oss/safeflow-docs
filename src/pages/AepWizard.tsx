import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Loader2, Save, FileText, CheckCircle2,
  FileDown, Sparkles, PenLine, ImagePlus, Link2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSetoresFuncoesSync } from "@/hooks/useSetoresFuncoesSync";
import { AepTemplateHelper } from "@/components/AepTemplateHelper";
import { sortByGes } from "@/lib/sortGes";
import {
  TIPOS_AGENTE_ERGONOMICO, PROBABILIDADES, SEVERIDADES,
  calcularNivelRiscoAep, emptyRiscoErgonomico, CORES_NIVEL_RISCO,
  type RiscoErgonomico,
} from "@/lib/aepRisco";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { renderHtmlTemplateToDocx } from "@/lib/htmlTemplate";
import {
  createAepParser, extractDocxText, validateAepBinding, type AepBindingResult,
} from "@/lib/aepTemplate";


// ───────────── Tipos ─────────────
type Revisao = { data_revisao: string; descricao_revisao: string };
type Colaborador = { nome_colaborador: string; funcao: string; data_avaliacao: string };
type PlanoAcao = { o_que: string; como: string; responsavel: string; prazo: string };
type ChecklistItem = { quantidade_inadequados: string; condicao: string; observacao: string };

type SetorAep = {
  setor_id: string;
  setor_nome: string;
  ges: string;
  descricao_ambiente: string;
  funcoes_selecionadas: { id: string; nome: string }[];
  funcao_ges: string;
  numero_funcionarios: string;
  colaboradores: Colaborador[];
  descricao_atividade: string;
  turno: string;
  postura_predominante: string;
  postura_observacao: string;
  checklist: Record<string, ChecklistItem>;
  riscos_ergonomicos: string;
  riscos_lista: RiscoErgonomico[];
  parecer_ambiente: string;
  parecer_ergonomia: string;
  conduta: string;
  conduta_1: string;
  parecer_conduta_1: string;
  conduta_2: string;
  parecer_conduta_2: string;
  plano_acao: PlanoAcao[];
  _salvo?: boolean;
};

export const CHECKLIST_LINHAS: { key: string; label: string }[] = [
  { key: "organizacao_trabalho", label: "Organização do trabalho" },
  { key: "levantamento_transporte_cargas", label: "Levantamento e transporte de cargas" },
  { key: "mobiliario", label: "Mobiliário dos postos de trabalho" },
  { key: "maquinas_equipamentos_ferramentas", label: "Máquinas, equipamentos e ferramentas manuais" },
  { key: "conforto_ambiente", label: "Condições de conforto no ambiente de trabalho" },
];

const CONDICOES = ["Adequado", "Parcialmente adequado", "Inadequado", "Não aplicado", "Não aplicável"];

const POSTURAS = [
  "Sentado", "Em pé", "Alternado sentado/em pé", "Agachado",
  "Ajoelhado", "Caminhando", "Posturas variadas", "Outra",
];

const emptyChecklist = (): Record<string, ChecklistItem> =>
  Object.fromEntries(
    CHECKLIST_LINHAS.map((l) => [l.key, { quantidade_inadequados: "", condicao: "", observacao: "" }]),
  );

const emptyColab = (): Colaborador => ({ nome_colaborador: "", funcao: "", data_avaliacao: "" });
const emptyPlano = (): PlanoAcao => ({ o_que: "", como: "", responsavel: "", prazo: "" });
const emptyRev = (): Revisao => ({ data_revisao: "", descricao_revisao: "" });

const newSetor = (s: any): SetorAep => ({
  setor_id: s.id,
  setor_nome: s.nome_setor || "",
  ges: s.ghe_ges || "",
  descricao_ambiente: s.descricao_ambiente || "",
  funcoes_selecionadas: [],
  funcao_ges: "",
  numero_funcionarios: "",
  colaboradores: [],
  descricao_atividade: "",
  turno: "",
  postura_predominante: "",
  postura_observacao: "",
  checklist: emptyChecklist(),
  riscos_ergonomicos: "",
  riscos_lista: [],
  parecer_ambiente: "",
  parecer_ergonomia: "",
  conduta: "",
  conduta_1: "",
  parecer_conduta_1: "",
  conduta_2: "",
  parecer_conduta_2: "",
  plano_acao: [],
  _salvo: false,
});

const formatDate = (v?: string | null) => (v ? new Date(v + "T00:00:00").toLocaleDateString("pt-BR") : "");

export default function AepWizard() {
  const { documentoId } = useParams();
  const navigate = useNavigate();

  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElaboracao, setDataElaboracao] = useState("");
  const [alteracoes, setAlteracoes] = useState("");
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [setoresAep, setSetoresAep] = useState<SetorAep[]>([]);

  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingSetorIdx, setEditingSetorIdx] = useState<number | null>(null);

  const [aepId, setAepId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(documentoId || null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!documentoId);

  const [showGerar, setShowGerar] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [binding, setBinding] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);
  const [vinculado, setVinculado] = useState(false);
  const [bindResult, setBindResult] = useState<AepBindingResult | null>(null);


  const [iaOpen, setIaOpen] = useState(false);
  const [iaObs, setIaObs] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaFotos, setIaFotos] = useState<{ name: string; mime: string; data: string; url: string }[]>([]);
  const [iaSubstituir, setIaSubstituir] = useState(false);
  const [iaConfirmOpen, setIaConfirmOpen] = useState(false);
  const [iaInstrOpen, setIaInstrOpen] = useState(false);
  const [iaInstrucoes, setIaInstrucoes] = useState(
    () => localStorage.getItem("aep_ia_instrucoes") || ""
  );


  useSetoresFuncoesSync();

  // ───────────── Queries ─────────────
  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-aep"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("razao_social");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contratosEmpresa = [] } = useQuery({
    queryKey: ["contratos-aep", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  const { data: setoresEmpresa = [] } = useQuery({
    queryKey: ["setores-empresa-aep", empresaId, contratoId],
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

  const { data: funcoesAll = [] } = useQuery({
    queryKey: ["funcoes-aep", setoresAep.map((s) => s.setor_id).join(",")],
    queryFn: async () => {
      const ids = setoresAep.map((s) => s.setor_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("funcoes")
        .select("id,nome_funcao,setor_id,descricao_atividades")
        .in("setor_id", ids);
      if (error) throw error;
      return data || [];
    },
    enabled: setoresAep.length > 0,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates-aep"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id,title,file_path")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const templatesAep = (templates as any[]).filter((t) => /aep|ergon/i.test(t.title || ""));
  const templatesToShow = templatesAep.length > 0 ? templatesAep : (templates as any[]);

  const empresa: any = (empresas as any[]).find((e) => e.id === empresaId) || {};
  const contrato: any = (contratosEmpresa as any[]).find((c) => c.id === contratoId) || {};
  const empresaNome = empresa.razao_social || empresa.nome_fantasia || "";
  const allSetoresSalvos = setoresAep.length > 0 && setoresAep.every((s) => s._salvo);

  // ───────────── Carregar existente ─────────────
  useEffect(() => {
    if (!documentoId) return;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("aep_documentos")
          .select("*")
          .eq("documento_id", documentoId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setAepId(data.id);
          setEmpresaId(data.empresa_id || "");
          setContratoId(data.contrato_id || "");
          setResponsavelTecnico(data.responsavel_tecnico || "");
          setCrea(data.crea || "");
          setCargo(data.cargo || "");
          setDataElaboracao(data.data_elaboracao || "");
          setAlteracoes(data.alteracoes_documento || "");
          setRevisoes(data.revisoes || []);
          setSetoresAep(((data.setores as any[]) || []).map((s: any) => ({
            ...newSetor({ id: s.setor_id, nome_setor: s.setor_nome, ghe_ges: s.ges, descricao_ambiente: s.descricao_ambiente }),
            ...s,
            funcoes_selecionadas: s.funcoes_selecionadas || [],
            colaboradores: s.colaboradores || [],
            plano_acao: s.plano_acao || [],
            riscos_lista: s.riscos_lista || [],
            checklist: { ...emptyChecklist(), ...(s.checklist || {}) },
            funcao_ges: s.funcao_ges ?? s.funcao_avaliada ?? "",
          })));
        }
      } catch (e: any) {
        toast.error("Erro ao carregar AEP: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentoId]);

  // Mantém nomes/GES sincronizados com o cadastro
  useEffect(() => {
    if (!empresaId || (setoresEmpresa as any[]).length === 0) return;
    const map = new Map((setoresEmpresa as any[]).map((s: any) => [s.id, s]));
    setSetoresAep((prev) => {
      const next = prev
        .filter((s) => !s.setor_id || map.has(s.setor_id))
        .map((s) => {
          const db: any = map.get(s.setor_id);
          if (!db) return s;
          if (s.setor_nome === (db.nome_setor || "") && s.ges === (db.ghe_ges || "")) return s;
          return { ...s, setor_nome: db.nome_setor || "", ges: db.ghe_ges || "" };
        });
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [setoresEmpresa, empresaId]);

  // ───────────── Setores ─────────────
  const handleConfirmSetores = () => {
    const novos = (setoresEmpresa as any[])
      .filter((s: any) => selectedIds.has(s.id))
      .map((s: any) => newSetor(s));
    setSetoresAep([...setoresAep, ...novos]);
    setSelectedIds(new Set());
    setSelectModalOpen(false);
  };

  const addAvaliacaoSetor = (setorId: string) => {
    const base = (setoresEmpresa as any[]).find((s: any) => s.id === setorId);
    const ref = setoresAep.find((s) => s.setor_id === setorId);
    const novo = newSetor(base || { id: setorId, nome_setor: ref?.setor_nome, ghe_ges: ref?.ges, descricao_ambiente: ref?.descricao_ambiente });
    setSetoresAep([...setoresAep, novo]);
    setEditingSetorIdx(setoresAep.length);
  };

  const removeSetor = (idx: number) => setSetoresAep(setoresAep.filter((_, i) => i !== idx));
  const removeSetorGroup = (setorId: string) => setSetoresAep(setoresAep.filter((s) => s.setor_id !== setorId));

  const updateSetor = (idx: number, patch: Partial<SetorAep>) => {
    setSetoresAep((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  // ───────────── Persistência ─────────────
  const persist = async (status: "rascunho" | "concluido", silent = false): Promise<string | null> => {
    if (!empresaId) {
      if (!silent) toast.error("Selecione a empresa");
      return null;
    }
    if (status === "concluido" && (!responsavelTecnico.trim() || !dataElaboracao)) {
      toast.error("Preencha responsável técnico e data de elaboração");
      return null;
    }
    setSaving(true);
    try {
      let docIdLocal = docId;
      if (!docIdLocal) {
        const { data: doc, error: docErr } = await supabase
          .from("documentos")
          .insert({ tipo: "AEP", empresa_id: empresaId, empresa_nome: empresaNome, contrato_id: contratoId || null, status })
          .select()
          .single();
        if (docErr) throw docErr;
        docIdLocal = doc.id;
        setDocId(docIdLocal);
      } else {
        await supabase
          .from("documentos")
          .update({ empresa_id: empresaId, empresa_nome: empresaNome, contrato_id: contratoId || null, status })
          .eq("id", docIdLocal);
      }

      const payload: any = {
        documento_id: docIdLocal,
        empresa_id: empresaId,
        contrato_id: contratoId || null,
        responsavel_tecnico: responsavelTecnico,
        crea,
        cargo,
        data_elaboracao: dataElaboracao || null,
        alteracoes_documento: alteracoes,
        revisoes,
        setores: setoresAep,
        status,
      };

      if (aepId) {
        const { error } = await (supabase as any).from("aep_documentos").update(payload).eq("id", aepId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from("aep_documentos").insert(payload).select().single();
        if (error) throw error;
        setAepId(data.id);
      }

      if (!silent) toast.success(status === "concluido" ? "AEP finalizada!" : "Rascunho salvo");
      return docIdLocal;
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarSetor = async () => {
    if (editingSetorIdx === null) return;
    const setor = setoresAep[editingSetorIdx];
    if (setor.funcoes_selecionadas.length === 0) {
      toast.error("Selecione ao menos uma função avaliada");
      return;
    }
    if (!setor.descricao_atividade.trim()) {
      toast.error("Descreva a atividade realizada");
      return;
    }
    setSetoresAep((prev) => prev.map((s, i) => (i === editingSetorIdx ? { ...s, _salvo: true } : s)));
    setEditingSetorIdx(null);
    toast.success(`Setor "${setor.setor_nome}" salvo`);
    setTimeout(() => persist("rascunho", true), 100);
  };

  // ───────────── IA ─────────────
  const addFotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const novos: { name: string; mime: string; data: string; url: string }[] = [];
    for (const f of Array.from(files).slice(0, 10)) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: apenas imagens.`); continue; }
      const buf = await f.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      novos.push({ name: f.name, mime: f.type, data: btoa(bin), url: URL.createObjectURL(f) });
    }
    setIaFotos((prev) => [...prev, ...novos].slice(0, 10));
  };

  const setorTemConteudo = (s?: SetorAep) =>
    !!s && (s.riscos_lista.length > 0 || !!s.parecer_ambiente?.trim() || !!s.parecer_ergonomia?.trim() ||
      !!s.parecer_conduta_1?.trim() || !!s.parecer_conduta_2?.trim() || s.plano_acao.length > 0);

  const solicitarGeracao = () => {
    const s = editingSetorIdx !== null ? setoresAep[editingSetorIdx] : undefined;
    if (iaSubstituir && setorTemConteudo(s)) { setIaConfirmOpen(true); return; }
    gerarComIA();
  };

  const gerarComIA = async (opts?: { condutaForcada?: { conduta_1: string; conduta_2: string } }) => {
    setIaConfirmOpen(false);
    if (editingSetorIdx === null) {
      toast.error("Abra o registro de um setor para gerar com IA");
      return;
    }

    const forcar = !!opts?.condutaForcada;
    const setor = { ...setoresAep[editingSetorIdx], ...(opts?.condutaForcada ?? {}) };
    setIaLoading(true);
    try {
      // Cadastro Empresa → Setores → Funções (Etapa 4)
      const funcoesCadastroSetor = (funcoesAll as any[])
        .filter((f) => f.setor_id === setor.setor_id)
        .map((f) => ({ nome: f.nome_funcao, descricao_atividades: f.descricao_atividades || "" }));

      const aep_context = {
        tipo_documento: "AEP — Análise Ergonômica Preliminar",
        // Cada setor/GES/função é uma AVALIAÇÃO INDEPENDENTE
        avaliacao_id: setor.setor_id || `setor-${editingSetorIdx}`,
        avaliacao_indice: editingSetorIdx + 1,
        total_avaliacoes_no_documento: setoresAep.length,
        outras_avaliacoes_do_documento: setoresAep
          .filter((_, i) => i !== editingSetorIdx)
          .map((s) => ({ setor: s.setor_nome, ges: s.ges })),
        modo: forcar
          ? "REANALISE_CONDUTA — o responsável técnico definiu MANUALMENTE as respostas da conduta. Essas respostas PREVALECEM e não podem ser alteradas. Reanalisar e reescrever riscos, medidas, pareceres, pareceres da conduta e plano de ação para que TODO o documento fique coerente com as respostas escolhidas, sem textos contraditórios."
          : iaSubstituir
          ? "SUBSTITUIR — reanalisar tudo e refazer checklist, riscos, pareceres, condutas e plano de ação"
          : "COMPLEMENTAR — preservar o conteúdo já preenchido e apenas completar o que estiver vazio",

        conduta_definida_pelo_usuario: forcar
          ? { conduta_1: setor.conduta_1, conduta_2: setor.conduta_2 }
          : null,


        // ETAPA 1 — entrada do usuário
        user_input: {
          informacoes_complementares: iaObs || "",
          instrucao_personalizada: iaInstrucoes || "",
        },

        // ETAPA 2 — empresa e contrato
        empresa: {
          razao_social: empresa.razao_social || "",
          nome_fantasia: empresa.nome_fantasia || "",
          cnpj: empresa.cnpj || "",
          cnae: empresa.cnae_principal || "",
          grau_risco: empresa.grau_risco || "",
          endereco: empresa.endereco || "",
          total_funcionarios: empresa.total_funcionarios ?? "",
          jornada_trabalho: empresa.jornada_trabalho || "",
          contrato: {
            numero_contrato: contrato.numero_contrato || "",
            nome_contratante: contrato.nome_contratante || "",
            cnpj_contratante: contrato.cnpj_contratante || "",
            local_trabalho: contrato.local_trabalho || "",
          },
        },

        // ETAPA 3 — a avaliação em análise (ÚNICA fonte de setor/GES/função)
        avaliacao: {
          ges: setor.ges,
          setor: setor.setor_nome,
          descricao_ambiente: setor.descricao_ambiente,
          funcoes_avaliadas: setor.funcoes_selecionadas.map((f) => f.nome),
          funcao_ges: setor.funcao_ges,
          numero_funcionarios: setor.numero_funcionarios,
          colaboradores: setor.colaboradores,
          descricao_atividade: setor.descricao_atividade,
          turno: setor.turno,
          postura_predominante: setor.postura_predominante,
          postura_observacao: setor.postura_observacao,
        },

        // ETAPA 4 — cadastro Empresa → Setores → Funções
        cadastro_empresa: {
          setores: (setoresEmpresa as any[]).map((s) => ({ setor: s.nome_setor, ges: s.ghe_ges || "" })),
          funcoes_do_setor: funcoesCadastroSetor,
        },

        // ETAPA 6 — fotografias (metadados; imagens seguem como anexos multimodais)
        fotografias: iaFotos.map((f, i) => ({ indice: i + 1, nome: f.name, mime: f.mime })),

        // Conteúdo já existente desta avaliação (nunca de outra)
        dados_existentes: {
          checklist: CHECKLIST_LINHAS.reduce((acc, l) => {
            acc[l.key] = { variavel: l.label, ...setor.checklist[l.key] };
            return acc;
          }, {} as Record<string, any>),
          riscos: setor.riscos_lista,
          parecer_ambiente: setor.parecer_ambiente,
          parecer_ergonomia: setor.parecer_ergonomia,
          conduta: {
            conduta_1: setor.conduta_1,
            parecer_conduta_1: setor.parecer_conduta_1,
            conduta_2: setor.conduta_2,
            parecer_conduta_2: setor.parecer_conduta_2,
          },
          plano_acao: setor.plano_acao,
        },
      };

      const { data, error } = await supabase.functions.invoke("aep-generate", {
        body: {
          descricao: iaObs,
          aep_context,
          contexto: aep_context,
          instrucoes_usuario: iaInstrucoes,
          anexos: iaFotos.map((f) => ({ name: f.name, mime: f.mime, kind: "image", data: f.data })),
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const r: any = (data as any)?.output || data || {};
      const riscos: RiscoErgonomico[] = Array.isArray(r.riscos_ergonomicos)
        ? r.riscos_ergonomicos.map((x: any) => {
            const probabilidade = x.probabilidade || "";
            const severidade = x.severidade || "";
            return {
              ...emptyRiscoErgonomico(),
              tipo_agente: x.tipo_agente || "",
              fator_risco: x.fator_risco || "",
              fonte_geradora: x.fonte_geradora || "",
              possiveis_danos: x.possiveis_danos || "",
              controle_existente: x.controle_existente || "",
              probabilidade,
              severidade,
              nivel_risco: calcularNivelRiscoAep(probabilidade, severidade),
              medidas: x.medidas || "",
            };
          })
        : [];

      const planoIa = Array.isArray(r.plano_acao)
        ? r.plano_acao.map((p: any) => ({
            o_que: p.acao || p.o_que || "",
            como: p.como || p.justificativa || "",
            responsavel: p.responsavel || "",
            prazo: p.prazo || "",
          }))
        : [];
      // Substituir/Reanálise = sobrescreve; Complementar = mantém o que já existe
      const sobrescrever = iaSubstituir || forcar;
      const pick = (novo: string, atual: string) =>
        sobrescrever ? (novo || atual) : (atual?.trim() ? atual : novo || "");

      // Checklist AEP sugerido pela IA
      const checklistIa: Record<string, ChecklistItem> = { ...setor.checklist };
      if (Array.isArray(r.checklist)) {
        for (const item of r.checklist) {
          const key = CHECKLIST_LINHAS.find(
            (l) => l.key === item?.chave || l.label === item?.variavel,
          )?.key;
          if (!key) continue;
          const atual = setor.checklist[key] || { quantidade_inadequados: "", condicao: "", observacao: "" };
          checklistIa[key] = {
            quantidade_inadequados: pick(String(item.quantidade_inadequados ?? ""), atual.quantidade_inadequados),
            condicao: pick(item.condicao || "", atual.condicao),
            observacao: pick(item.observacao || "", atual.observacao),
          };
        }
      }

      updateSetor(editingSetorIdx, {
        checklist: checklistIa,
        descricao_atividade: pick(r.descricao_atividade, setor.descricao_atividade),
        turno: pick(r.turno, setor.turno),
        riscos_lista: sobrescrever
          ? (riscos.length > 0 ? riscos : setor.riscos_lista)
          : (setor.riscos_lista.length > 0 ? setor.riscos_lista : riscos),
        parecer_ambiente: pick(r.parecer_ambiente, setor.parecer_ambiente),
        parecer_ergonomia: pick(r.parecer_ergonomia, setor.parecer_ergonomia),
        // A resposta escolhida manualmente pelo usuário sempre prevalece
        conduta_1: forcar ? setor.conduta_1 : pick(r.conduta_1, setor.conduta_1),
        parecer_conduta_1: pick(r.parecer_conduta_1, setor.parecer_conduta_1),
        conduta_2: forcar ? setor.conduta_2 : pick(r.conduta_2, setor.conduta_2),
        parecer_conduta_2: pick(r.parecer_conduta_2, setor.parecer_conduta_2),
        plano_acao: sobrescrever
          ? (planoIa.length > 0 ? planoIa : setor.plano_acao)
          : (setor.plano_acao.length > 0 ? setor.plano_acao : planoIa),
      });


      setIaOpen(false);
      toast.success(forcar ? "AEP reanalisada com base na conduta escolhida" : "Análise gerada com IA");
    } catch (e: any) {
      toast.error("Erro na geração com IA: " + (e.message || ""));
    } finally {
      setIaLoading(false);
    }
  };

  // Alteração manual da conduta → aciona reanálise automática da IA
  const alterarConduta = (campo: "conduta_1" | "conduta_2", valor: string) => {
    if (editingSetorIdx === null) return;
    const atual = setoresAep[editingSetorIdx];
    const conduta_1 = campo === "conduta_1" ? valor : atual.conduta_1;
    const conduta_2 = campo === "conduta_2" ? valor : atual.conduta_2;
    updateSetor(editingSetorIdx, { [campo]: valor } as any);
    if (!valor) return;
    gerarComIA({ condutaForcada: { conduta_1, conduta_2 } });
  };


  // ───────────── Template (estrutura exclusiva da AEP) ─────────────
  const CHECKLIST_VAR_KEYS: Record<string, string> = {
    organizacao_trabalho: "organizacao_trabalho",
    levantamento_transporte_cargas: "levantamento_cargas",
    mobiliario: "mobiliario",
    maquinas_equipamentos_ferramentas: "maquinas_equipamentos",
    conforto_ambiente: "conforto_ambiente",
  };

  const buildSetorData = (s: SetorAep) => {
    const checklist: Record<string, any> = {};
    for (const l of CHECKLIST_LINHAS) {
      const item = s.checklist[l.key] || { quantidade_inadequados: "", condicao: "", observacao: "" };
      checklist[CHECKLIST_VAR_KEYS[l.key] || l.key] = {
        variavel: l.label,
        qtd_inadequados: item.quantidade_inadequados || "",
        condicao: item.condicao || "",
        observacao: item.observacao || "",
      };
    }

    return {
      ges: s.ges || "",
      setor: s.setor_nome || "",
      descricao_ambiente: s.descricao_ambiente || "",
      funcoes_avaliadas: s.funcoes_selecionadas.map((f) => f.nome).filter(Boolean).join("\n"),
      funcao_ges: s.funcao_ges || "",
      numero_funcionarios: s.numero_funcionarios || "",
      colaboradores: s.colaboradores
        .filter((c) => c.nome_colaborador || c.funcao || c.data_avaliacao)
        .map((c) => ({
          nome: c.nome_colaborador || "",
          funcao: c.funcao || "",
          data: formatDate(c.data_avaliacao),
          colaborador: {
            nome: c.nome_colaborador || "",
            funcao: c.funcao || "",
            data: formatDate(c.data_avaliacao),
          },
        })),
      descricao_atividade: s.descricao_atividade || "",
      turno: s.turno || "",
      postura_predominante: s.postura_predominante || "",
      observacao_complementar: s.postura_observacao || "",
      checklist,
      riscos_ergonomicos: s.riscos_lista.map((r) => ({
        tipo_agente: r.tipo_agente || "",
        fator_risco: r.fator_risco || "",
        fonte_geradora: r.fonte_geradora || "",
        possiveis_danos: r.possiveis_danos || "",
        controle_existente: r.controle_existente || "",
        probabilidade: r.probabilidade || "",
        severidade: r.severidade || "",
        nivel_risco: r.nivel_risco || "",
        medidas: r.medidas || "",
      })),
      parecer_ambiente_trabalho: s.parecer_ambiente || "",
      parecer_ergonomia: s.parecer_ergonomia || "",
      conduta: {
        condicao_inadequada: s.conduta_1 || "",
        solucao_rapida: s.conduta_2 || "",
        parecer_condicao_inadequada: s.parecer_conduta_1 || "",
        parecer_solucao_rapida: s.parecer_conduta_2 || "",
      },
      plano_acao: s.plano_acao
        .filter((p) => p.o_que || p.como || p.responsavel || p.prazo)
        .map((p) => ({
          o_que: p.o_que || "",
          como: p.como || "",
          responsavel: p.responsavel || "",
          prazo: p.prazo || "",
        })),
    };
  };

  const buildTemplateData = () => {
    const setores = setoresAep.map((s) => buildSetorData(s));
    const aep = {
      responsavel_tecnico: responsavelTecnico || "",
      crea: crea || "",
      cargo: cargo || "",
      data_elaboracao: formatDate(dataElaboracao),
      data: new Date().toLocaleDateString("pt-BR"),
      descricao: alteracoes || "",
      empresa: {
        razao_social: empresaNome,
        nome_fantasia: empresa.nome_fantasia || "",
        cnpj: empresa.cnpj || "",
        cnae_principal: empresa.cnae_principal || "",
        grau_risco: empresa.grau_risco || "",
        endereco: empresa.endereco || "",
        total_funcionarios: empresa.total_funcionarios ?? "",
        jornada_trabalho: empresa.jornada_trabalho || "",
      },
      contrato: {
        numero: contrato.numero_contrato || "",
        contratante: contrato.nome_contratante || "",
        cnpj_contratante: contrato.cnpj_contratante || "",
        vigencia_inicio: formatDate(contrato.vigencia_inicio),
        vigencia_fim: formatDate(contrato.vigencia_fim),
        local_trabalho: contrato.local_trabalho || "",
      },
      revisoes,
      setores,
    };
    return { aep, setores, empresa: empresaNome };
  };


  const loadTemplateDoc = async (data: any) => {
    const template: any = (templates as any[]).find((t) => t.id === selectedTemplate);
    if (!template) throw new Error("Template não encontrado");
    const { data: fileData, error } = await supabase.storage.from("templates").download(template.file_path);
    if (error) throw error;

    const path = String(template.file_path || "").toLowerCase();
    if (path.endsWith(".html") || path.endsWith(".htm")) {
      const htmlSource = await fileData.text();
      let lastData: any = null;
      return {
        text: htmlSource,
        doc: {
          kind: "html",
          render(d: any) { lastData = d; },
          async toBlob() { return await renderHtmlTemplateToDocx(htmlSource, lastData ?? {}); },
        } as any,
      };
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      nullGetter: () => "",
      parser: createAepParser(data),
    });
    return { text: extractDocxText(zip), doc };
  };

  const handleVincular = async () => {
    setBinding(true);
    try {
      const data = buildTemplateData();
      const { text } = await loadTemplateDoc(data);
      const result = validateAepBinding(text, data);
      setBindResult(result);
      setBindOpen(true);
      if (!result.issues.some((i) => i.tipo === "erro")) setVinculado(true);
    } catch (e: any) {
      toast.error("Erro ao vincular documento: " + (e.message || ""));
    } finally {
      setBinding(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = buildTemplateData();
      const { doc } = await loadTemplateDoc(data);
      doc.render(data);
      const output: Blob = doc.kind === "html"
        ? await doc.toBlob()
        : doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

      const fileName = `AEP_${empresaNome.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getFullYear()}.docx`;
      const storagePath = `documentos/${Date.now()}_${fileName}`;
      const { error: upErr } = await supabase.storage.from("templates").upload(storagePath, output);
      if (docId) {
        await supabase.from("documentos").update({
          file_path: storagePath, template_id: selectedTemplate, status: upErr ? "erro" : "concluido",
        }).eq("id", docId);
      }
      saveAs(output, fileName);
      toast.success("Documento AEP gerado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar documento: " + (e.message || ""));
    } finally {
      setGenerating(false);
    }
  };


  const handleEmitir = async () => {
    const id = await persist("rascunho", true);
    if (id) setShowGerar(true);
  };

  // ───────────── Render ─────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showGerar) {
    return (
      <div className="max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setShowGerar(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">Gerar Documento AEP</h1>
            <p className="text-xs text-muted-foreground">{empresaNome}</p>
          </div>
        </div>

        <Card className="p-8 text-center">
          <FileDown className="w-12 h-12 mx-auto text-accent mb-4" />
          <h2 className="font-heading text-xl font-bold mb-2">Selecione o template AEP</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Escolha o template e gere o documento final
          </p>

          <Select
            value={selectedTemplate}
            onValueChange={(v) => { setSelectedTemplate(v); setVinculado(false); setBindResult(null); }}
          >
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
            <Button variant="outline" onClick={handleVincular} disabled={binding || !selectedTemplate}>
              {binding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              Vincular Documento
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedTemplate || !vinculado}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
              Gerar Documento
            </Button>

          </div>

          {bindResult && (
            <p className="text-xs text-muted-foreground mt-4">
              {bindResult.vinculadas}/{bindResult.totalTags} variáveis vinculadas
              {bindResult.loops.length > 0 && ` · loops: ${bindResult.loops.map((l) => `${l.nome} (${l.itens})`).join(", ")}`}
            </p>
          )}
        </Card>

        <Dialog open={bindOpen} onOpenChange={setBindOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {bindResult && bindResult.issues.some((i) => i.tipo === "erro")
                  ? "Erros encontrados na vinculação"
                  : "Vinculação concluída com sucesso."}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {bindResult?.vinculadas ?? 0} de {bindResult?.totalTags ?? 0} variáveis do template foram
                vinculadas ao JSON da AEP.
                {bindResult?.loops.length
                  ? ` Loops processados: ${bindResult.loops.map((l) => `${l.nome} → ${l.itens} registro(s)`).join(", ")}.`
                  : ""}
              </p>

              {bindResult?.issues.length === 0 && (
                <p className="text-success">Nenhum problema encontrado. Você já pode gerar o documento.</p>
              )}

              {bindResult?.issues.map((iss, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${iss.tipo === "erro" ? "border-destructive/40 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}`}
                >
                  <p className="font-semibold">{iss.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Onde: {iss.onde}</p>
                  <p className="text-xs mt-1">Como corrigir: {iss.correcao}</p>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                onClick={() => { setVinculado(true); setBindOpen(false); }}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Entendi — continuar mesmo assim
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

    );
  }

  // ───── EDITOR DE SETOR ─────
  if (editingSetorIdx !== null) {
    const setor = setoresAep[editingSetorIdx];
    const funcoesSetor = (funcoesAll as any[]).filter((f) => f.setor_id === setor.setor_id);

    return (
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setEditingSetorIdx(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold">{setor.setor_nome}</h1>
            <p className="text-xs text-muted-foreground">Avaliação ergonômica preliminar deste setor</p>
          </div>
          <Button variant="outline" onClick={() => setIaOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" />Gerar com IA
          </Button>
          <AepTemplateHelper />
          <Button onClick={handleSalvarSetor} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="w-4 h-4 mr-2" />Salvar setor
          </Button>
        </div>

        {/* Identificação do setor */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Identificação do setor</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>GES</Label>
              <Input value={setor.ges} onChange={(e) => updateSetor(editingSetorIdx, { ges: e.target.value })} />
            </div>
            <div>
              <Label>Setor</Label>
              <Input value={setor.setor_nome} onChange={(e) => updateSetor(editingSetorIdx, { setor_nome: e.target.value })} />
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
              <div className="grid sm:grid-cols-2 gap-1 mt-1 max-h-52 overflow-y-auto border border-border rounded-lg p-2">
                {funcoesSetor.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">Nenhuma função cadastrada neste setor.</p>
                )}
                {funcoesSetor.map((f: any) => {
                  const checked = setor.funcoes_selecionadas.some((x) => x.id === f.id);
                  return (
                    <label key={f.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const sel = v
                            ? [...setor.funcoes_selecionadas, { id: f.id, nome: f.nome_funcao }]
                            : setor.funcoes_selecionadas.filter((x) => x.id !== f.id);
                          updateSetor(editingSetorIdx, { funcoes_selecionadas: sel });
                        }}
                      />
                      <span className="text-sm">{f.nome_funcao}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Função do GES</Label>
              <Input
                placeholder="Função do GES avaliada neste setor"
                value={setor.funcao_ges}
                onChange={(e) => updateSetor(editingSetorIdx, { funcao_ges: e.target.value })}
              />
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

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Colaboradores avaliados</Label>
              <Button size="sm" variant="outline" onClick={() =>
                updateSetor(editingSetorIdx, { colaboradores: [...setor.colaboradores, emptyColab()] })
              }>
                <Plus className="w-4 h-4 mr-1" />Colaborador
              </Button>
            </div>
            <div className="space-y-2">
              {setor.colaboradores.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Nome</Label>
                    <Input value={c.nome_colaborador} onChange={(e) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], nome_colaborador: e.target.value };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }} />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">Função</Label>
                    <Select value={c.funcao || undefined} onValueChange={(v) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], funcao: v };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {setor.funcoes_selecionadas.map((f) => (
                          <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Data</Label>
                    <Input type="date" value={c.data_avaliacao} onChange={(e) => {
                      const arr = [...setor.colaboradores];
                      arr[i] = { ...arr[i], data_avaliacao: e.target.value };
                      updateSetor(editingSetorIdx, { colaboradores: arr });
                    }} />
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                    updateSetor(editingSetorIdx, { colaboradores: setor.colaboradores.filter((_, k) => k !== i) })
                  }>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Descrição da atividade */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Descrição da atividade</h2>
          <Textarea
            className="min-h-[160px]"
            placeholder="Descreva detalhadamente as atividades realizadas pelo trabalhador (método, sequência, ferramentas, cargas, ciclos)…"
            value={setor.descricao_atividade}
            onChange={(e) => updateSetor(editingSetorIdx, { descricao_atividade: e.target.value })}
          />
        </Card>

        {/* Turno e postura */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Turno e postura</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Turno de trabalho</Label>
              <Textarea
                placeholder="Horário, jornada, escala, intervalos e pausas…"
                value={setor.turno}
                onChange={(e) => updateSetor(editingSetorIdx, { turno: e.target.value })}
              />
            </div>
            <div>
              <Label>Postura predominante</Label>
              <Select
                value={setor.postura_predominante || undefined}
                onValueChange={(v) => updateSetor(editingSetorIdx, { postura_predominante: v })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {POSTURAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observação complementar</Label>
              <Input
                value={setor.postura_observacao}
                onChange={(e) => updateSetor(editingSetorIdx, { postura_observacao: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Checklist */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Resultado do checklist AEP</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Variáveis observadas</th>
                  <th className="p-2 w-40">Qtd. de itens inadequados</th>
                  <th className="p-2 w-52">Condição</th>
                  <th className="p-2">Observação</th>
                </tr>
              </thead>
              <tbody>
                {CHECKLIST_LINHAS.map((l) => {
                  const item = setor.checklist[l.key] || { quantidade_inadequados: "", condicao: "", observacao: "" };
                  const patch = (p: Partial<ChecklistItem>) =>
                    updateSetor(editingSetorIdx, { checklist: { ...setor.checklist, [l.key]: { ...item, ...p } } });
                  return (
                    <tr key={l.key} className="border-t border-border">
                      <td className="p-2 font-medium">{l.label}</td>
                      <td className="p-2">
                        <Input type="number" min={0} value={item.quantidade_inadequados}
                          onChange={(e) => patch({ quantidade_inadequados: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <Select value={item.condicao || undefined} onValueChange={(v) => patch({ condicao: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {CONDICOES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input value={item.observacao} onChange={(e) => patch({ observacao: e.target.value })} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Riscos ergonômicos */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Riscos ergonômicos</h2>
            <Button size="sm" variant="outline" onClick={() =>
              updateSetor(editingSetorIdx, { riscos_lista: [...setor.riscos_lista, emptyRiscoErgonomico()] })
            }>
              <Plus className="w-4 h-4 mr-1" />Risco
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2 w-48">Tipo de agente</th>
                  <th className="p-2 w-52">Fator de risco</th>
                  <th className="p-2 w-52">Fonte geradora</th>
                  <th className="p-2 w-52">Possíveis danos</th>
                  <th className="p-2 w-52">Controle existente</th>
                  <th className="p-2 w-32">Probabilidade</th>
                  <th className="p-2 w-32">Severidade</th>
                  <th className="p-2 w-32">Nível de risco</th>
                  <th className="p-2 w-56">Medidas</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {setor.riscos_lista.map((r, i) => {
                  const patch = (p: Partial<RiscoErgonomico>) => {
                    const arr = [...setor.riscos_lista];
                    const next = { ...arr[i], ...p };
                    next.nivel_risco = calcularNivelRiscoAep(next.probabilidade, next.severidade);
                    arr[i] = next;
                    updateSetor(editingSetorIdx, { riscos_lista: arr });
                  };
                  return (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="p-2">
                        <Select value={r.tipo_agente || undefined} onValueChange={(v) => patch({ tipo_agente: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_AGENTE_ERGONOMICO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Textarea className="min-h-[64px]" value={r.fator_risco}
                          onChange={(e) => patch({ fator_risco: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <Textarea className="min-h-[64px]" value={r.fonte_geradora}
                          onChange={(e) => patch({ fonte_geradora: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <Textarea className="min-h-[64px]" value={r.possiveis_danos}
                          onChange={(e) => patch({ possiveis_danos: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <Textarea className="min-h-[64px]" value={r.controle_existente}
                          onChange={(e) => patch({ controle_existente: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <Select value={r.probabilidade || undefined} onValueChange={(v) => patch({ probabilidade: v })}>
                          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {PROBABILIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select value={r.severidade || undefined} onValueChange={(v) => patch({ severidade: v })}>
                          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {SEVERIDADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        {r.nivel_risco ? (
                          <span className={`inline-block px-2 py-1 rounded-md border text-xs font-semibold ${CORES_NIVEL_RISCO[r.nivel_risco]}`}>
                            {r.nivel_risco}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Textarea className="min-h-[64px]" value={r.medidas}
                          onChange={(e) => patch({ medidas: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() =>
                          updateSetor(editingSetorIdx, { riscos_lista: setor.riscos_lista.filter((_, k) => k !== i) })
                        }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {setor.riscos_lista.length === 0 && (
                  <tr><td colSpan={10} className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum risco cadastrado. Adicione manualmente ou gere com IA.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            O nível de risco é calculado automaticamente pela matriz do sistema (Probabilidade × Severidade).
          </p>
        </Card>

        {/* Pareceres */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Parecer do ambiente de trabalho</h2>
          <Textarea className="min-h-[160px]" value={setor.parecer_ambiente}
            onChange={(e) => updateSetor(editingSetorIdx, { parecer_ambiente: e.target.value })} />
        </Card>

        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Parecer de ergonomia</h2>
          <Textarea className="min-h-[160px]" value={setor.parecer_ergonomia}
            onChange={(e) => updateSetor(editingSetorIdx, { parecer_ergonomia: e.target.value })} />
        </Card>

        {/* Conduta */}
        <Card className="p-5 mb-4">
          <h2 className="font-heading font-semibold mb-3">Conduta</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Ao alterar manualmente qualquer resposta abaixo, a IA reanalisa automaticamente a AEP e
            ajusta riscos, medidas, pareceres, condutas e plano de ação para manter a coerência.
          </p>
          <div className="space-y-5">
            <div>
              <Label>Há condição inadequada que necessita de soluções?</Label>
              <div className="flex gap-4 mt-2">
                {["SIM", "NÃO"].map((op) => (
                  <label key={op} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={setor.conduta_1 === op} disabled={iaLoading}
                      onCheckedChange={(c) => alterarConduta("conduta_1", c ? op : "")} />
                    {op}
                  </label>
                ))}
              </div>
              <Label className="mt-3 block">Parecer da conduta</Label>
              <Textarea className="min-h-[100px]" value={setor.parecer_conduta_1}
                onChange={(e) => updateSetor(editingSetorIdx, { parecer_conduta_1: e.target.value })} />
            </div>
            <div>
              <Label>Foi encontrada solução rápida de baixo investimento e complexidade?</Label>
              <div className="flex gap-4 mt-2">
                {["SIM", "NÃO"].map((op) => (
                  <label key={op} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={setor.conduta_2 === op} disabled={iaLoading}
                      onCheckedChange={(c) => alterarConduta("conduta_2", c ? op : "")} />
                    {op}
                  </label>

                ))}
              </div>
              <Label className="mt-3 block">Parecer da conduta</Label>
              <Textarea className="min-h-[100px]" value={setor.parecer_conduta_2}
                onChange={(e) => updateSetor(editingSetorIdx, { parecer_conduta_2: e.target.value })} />
            </div>
            <div>
              <Label>Observações complementares da conduta</Label>
              <Textarea value={setor.conduta}
                onChange={(e) => updateSetor(editingSetorIdx, { conduta: e.target.value })} />
            </div>
          </div>
        </Card>

        {/* Plano de ação */}
        <Card className="p-5 mb-4">
          <div className="mt-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading font-semibold">Plano de ação</h2>
              <Button size="sm" variant="outline" onClick={() =>
                updateSetor(editingSetorIdx, { plano_acao: [...setor.plano_acao, emptyPlano()] })
              }>
                <Plus className="w-4 h-4 mr-1" />Ação
              </Button>
            </div>
            <div className="space-y-2">
              {setor.plano_acao.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">O que</Label>
                    <Input value={p.o_que} onChange={(e) => {
                      const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], o_que: e.target.value };
                      updateSetor(editingSetorIdx, { plano_acao: arr });
                    }} />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Como</Label>
                    <Input value={p.como} onChange={(e) => {
                      const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], como: e.target.value };
                      updateSetor(editingSetorIdx, { plano_acao: arr });
                    }} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Responsável</Label>
                    <Input value={p.responsavel} onChange={(e) => {
                      const arr = [...setor.plano_acao]; arr[i] = { ...arr[i], responsavel: e.target.value };
                      updateSetor(editingSetorIdx, { plano_acao: arr });
                    }} />
                  </div>
                  <div className="col-span-2">
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
            </div>
          </div>
        </Card>

        {/* Modal IA */}
        <Dialog open={iaOpen} onOpenChange={setIaOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 pr-6">
                <DialogTitle>Gerar AEP automaticamente</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Instrução personalizada para a IA"
                  onClick={() => setIaInstrOpen((v) => !v)}
                >
                  <PenLine className={`w-4 h-4 ${iaInstrucoes.trim() ? "text-primary" : ""}`} />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label>1. Informações complementares</Label>
              <Textarea
                className="min-h-[130px]"
                placeholder="Informe informações complementares sobre a função, atividade ou condições observadas…"
                value={iaObs}
                onChange={(e) => setIaObs(e.target.value)}
              />
            </div>

            {iaInstrOpen && (
              <div className="space-y-1.5 rounded-md border border-border p-3">
                <Label>Instrução personalizada para a IA</Label>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Informe como deseja que a IA conduza esta avaliação…"
                  value={iaInstrucoes}
                  onChange={(e) => {
                    setIaInstrucoes(e.target.value);
                    localStorage.setItem("aep_ia_instrucoes", e.target.value);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Orienta estilo, foco e profundidade. Não substitui os critérios técnicos e regras do sistema.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>2. Anexar fotografias</Label>
              <input
                id="aep-ia-fotos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { addFotos(e.target.files); e.currentTarget.value = ""; }}
              />
              <Button variant="outline" onClick={() => document.getElementById("aep-ia-fotos")?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" />Adicionar fotos
              </Button>
              {iaFotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {iaFotos.map((f, i) => (
                    <div key={i} className="relative group">
                      <img src={f.url} alt={f.name} className="w-full h-20 object-cover rounded-md border border-border" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setIaFotos((prev) => prev.filter((_, k) => k !== i))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                As fotos são analisadas pela IA (postura, mobiliário, organização, posto de trabalho). Ela não
                afirmará o que não for possível identificar com segurança pela imagem.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={iaSubstituir} onCheckedChange={(v) => setIaSubstituir(!!v)} />
              Substituir conteúdo atual
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIaOpen(false)}>Cancelar</Button>
              <Button onClick={solicitarGeracao} disabled={iaLoading}>
                {iaLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Gerar
              </Button>

            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmação de substituição */}
        <Dialog open={iaConfirmOpen} onOpenChange={setIaConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Substituir conteúdo atual?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Ao continuar, os conteúdos gerados anteriormente poderão ser substituídos. Deseja continuar?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIaConfirmOpen(false)}>Cancelar</Button>
              <Button onClick={() => gerarComIA()} disabled={iaLoading}>Continuar</Button>
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
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">Análise Ergonômica Preliminar (AEP)</h1>
          <p className="text-xs text-muted-foreground">Cadastro completo do documento</p>
        </div>
        <Button variant="outline" onClick={() => {
          if (setoresAep.length === 0) { toast.error("Adicione um setor e clique em Registrar"); return; }
          setEditingSetorIdx(0); setIaOpen(true);
        }}>
          <Sparkles className="w-4 h-4 mr-2" />Gerar com IA
        </Button>
        <AepTemplateHelper />
      </div>

      {/* Identificação */}
      <Card className="p-5 mb-4">
        <h2 className="font-heading font-semibold mb-3">1. Identificação da empresa</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Empresa *</Label>
            <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setContratoId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(empresas as any[]).map((e) => (
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
                {(contratosEmpresa as any[]).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.numero_contrato || "Contrato"} {c.nome_contratante ? `· ${c.nome_contratante}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label>Características da empresa</Label>
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
                    const arr = [...revisoes]; arr[i] = { ...arr[i], data_revisao: e.target.value }; setRevisoes(arr);
                  }} />
                </div>
                <div className="col-span-8">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={r.descricao_revisao} onChange={(e) => {
                    const arr = [...revisoes]; arr[i] = { ...arr[i], descricao_revisao: e.target.value }; setRevisoes(arr);
                  }} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive"
                  onClick={() => setRevisoes(revisoes.filter((_, k) => k !== i))}>
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
        {setoresAep.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {empresaId ? "Nenhum setor adicionado" : "Selecione uma empresa primeiro"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from(
              setoresAep.reduce((map, s, idx) => {
                const g = map.get(s.setor_id) || { setor_id: s.setor_id, setor_nome: s.setor_nome, ges: s.ges, items: [] as { idx: number; data: SetorAep }[] };
                g.items.push({ idx, data: s });
                map.set(s.setor_id, g);
                return map;
              }, new Map<string, { setor_id: string; setor_nome: string; ges: string; items: { idx: number; data: SetorAep }[] }>()).values()
            ).map((g) => (
              <div key={g.setor_id} className="border rounded-lg p-4 border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{g.setor_nome}</h3>
                    {g.ges && <p className="text-xs text-muted-foreground">GES: {g.ges}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {g.items.length} avaliação{g.items.length !== 1 ? "ões" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-accent hover:text-accent"
                      title="Adicionar avaliação" onClick={() => addAvaliacaoSetor(g.setor_id)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive h-7 w-7"
                      onClick={() => removeSetorGroup(g.setor_id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  {g.items.map((it, n) => (
                    <div key={it.idx}
                      className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded border text-sm ${
                        it.data._salvo ? "border-emerald-500/40 bg-emerald-50/40" : "border-border"
                      }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {it.data._salvo && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span className="truncate">Avaliação {n + 1}</span>
                        {!it.data._salvo && <span className="text-xs text-muted-foreground">(pendente)</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant={it.data._salvo ? "outline" : "default"} className="h-7"
                          onClick={() => setEditingSetorIdx(it.idx)}>
                          {it.data._salvo ? "Editar" : "Registrar"}
                        </Button>
                        {g.items.length > 1 && (
                          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7"
                            onClick={() => removeSetor(it.idx)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => addAvaliacaoSetor(g.setor_id)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar avaliação
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-xl border border-border">
        <Button variant="outline" onClick={() => persist("rascunho")} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar rascunho
        </Button>
        {allSetoresSalvos && (
          <Button onClick={handleEmitir} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <FileDown className="w-4 h-4 mr-2" />Emitir documento
          </Button>
        )}
      </div>

      {/* Modal seleção de setores */}
      <Dialog open={selectModalOpen} onOpenChange={setSelectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar setores</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {(setoresEmpresa as any[]).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Esta empresa não possui setores cadastrados.
              </p>
            )}
            {(setoresEmpresa as any[]).map((s) => {
              const already = setoresAep.some((x) => x.setor_id === s.id);
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
