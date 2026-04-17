import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, FileDown, Loader2, FileText, Settings, Copy, AlertTriangle, Search, X, Save, ShieldCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

const steps = ["Identificação", "Riscos", "Listagem", "Gerar Documento"];

interface RiscoEntry {
  id: string;
  setor_id: string;
  setor_nome: string;
  funcoes_ges?: string;
  data_avaliacao?: string;
  items: {
    id: string;
    colaborador: string;
    funcao_id: string;
    funcao_nome: string;
  }[];
  tipo_avaliacao: string;
  tipo_agente: string;
  agente_id: string;
  agente_nome: string;
  codigo_esocial: string;
  descricao_esocial: string;
  propagacao: string;
  tipo_exposicao: string;
  fonte_geradora: string;
  danos_saude: string;
  medidas_controle: string;
  descricao_tecnica: string;
  tecnica_id: string;
  equipamento_id: string;
  resultado: string;
  unidade_resultado_id: string;
  limite_tolerancia: string;
  unidade_limite_id: string;
  parecer_tecnico?: string;
  aposentadoria_especial?: string;
  resultados_detalhados?: any[];
  resultados_componentes?: any[];
  resultados_vibracao?: any[];
  resultados_calor?: any[];
  epi_id?: string;
  epi_ca?: string;
  epi_atenuacao?: string;
  epi_eficaz?: string;
  epc_id?: string;
  epc_eficaz?: string;
  equipamentos_avaliacao?: any[];
}

interface Revision {
  revisao: string;
  data_revisao: string;
  motivo: string;
  responsavel: string;
}

interface ResultadoBase {
  id: string;
  resultado: string;
  unidade_resultado_id: string;
  limite_tolerancia: string;
  unidade_limite_id: string;
  componente?: string;
  parecer_tecnico?: string;
  aposentadoria_especial?: string;
}

// Agentes que usam o fluxo de componentes por amostra (Nível 1 + Nível 2)
const AGENTES_COMPONENTES = [
  "poeira respirável", "poeira respiravel",
  "sílica", "silica",
  "fumos metálicos", "fumos metalicos",
  "poeira metálica", "poeira metalica",
  "vapores orgânicos", "vapores organicos",
  "varredura de metais",
  "químicos quantitativos", "quimicos quantitativos",
  "névoas e gases", "nevoas e gases",
  "poeira total",
];

const isAgentComponentes = (agentNome: string) => {
  const n = agentNome.toLowerCase();
  return AGENTES_COMPONENTES.some(k => n.includes(k));
};

// Vibração helpers
const isAgentVCI = (agentNome: string) => {
  const n = agentNome.toLowerCase();
  return n.includes("corpo inteiro") || n.includes("vci");
};

const isAgentVMB = (agentNome: string) => {
  const n = agentNome.toLowerCase();
  return (n.includes("vibra") && (n.includes("mãos") || n.includes("braços") || n.includes("maos") || n.includes("bracos") || n.includes("vmb")));
};

const isAgentVibracao = (agentNome: string) => isAgentVCI(agentNome) || isAgentVMB(agentNome);

// Calor helpers
const isAgentCalor = (agentNome: string) => {
  return agentNome.toLowerCase() === "calor" || agentNome.toLowerCase().includes("calor");
};

export default function LtcatWizard() {
  const navigate = useNavigate();
  const { documentoId } = useParams<{ documentoId?: string }>();
  const isEditMode = !!documentoId;
  const [step, setStep] = useState(0);
  const [docLoaded, setDocLoaded] = useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [tempResultados, setTempResultados] = useState<any[]>([]);

  // Componentes flow (Nivel 1 + Nivel 2)
  const [componentesModalOpen, setComponentesModalOpen] = useState(false);
  const [tempFuncaoRows, setTempFuncaoRows] = useState<any[]>([]); // Nivel 1
  const [amostraModalOpen, setAmostraModalOpen] = useState(false);
  const [currentAmostraIndex, setCurrentAmostraIndex] = useState<number>(-1);
  const [tempComponentes, setTempComponentes] = useState<any[]>([]); // Nivel 2

  // Vibração flow VCI/VMB (Nivel 1 + Nivel 2)
  const [vibracaoModalOpen, setVibracaoModalOpen] = useState(false);
  const [tempVibracaoRows, setTempVibracaoRows] = useState<any[]>([]);
  const [vibracaoAmostraModalOpen, setVibracaoAmostraModalOpen] = useState(false);
  const [currentVibracaoIndex, setCurrentVibracaoIndex] = useState<number>(-1);
  const [tempVibAmostra, setTempVibAmostra] = useState<any>({});

  // Calor flow (Nivel 1 + Nivel 2)
  const [calorModalOpen, setCalorModalOpen] = useState(false);
  const [tempCalorRows, setTempCalorRows] = useState<any[]>([]);
  const [calorAmostraModalOpen, setCalorAmostraModalOpen] = useState(false);
  const [currentCalorIndex, setCurrentCalorIndex] = useState<number>(-1);
  const [tempCalorAmostra, setTempCalorAmostra] = useState<any>({});
  const [generating, setGenerating] = useState(false);

  // EPI/EPC form state inside risk dialog
  const [epiEpcRiskForm, setEpiEpcRiskForm] = useState({
    epi_id: "",
    epi_ca: "",
    epi_atenuacao: "",
    epi_eficaz: "",
    epc_id: "",
    epc_eficaz: "",
  });

  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [deleteItemsModalOpen, setDeleteItemsModalOpen] = useState(false);
  const [riskToDeleteItems, setRiskToDeleteItems] = useState<RiscoEntry | null>(null);
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState<string[]>([]);

  // (Parecer Técnico agora é preenchido exclusivamente na Seção 7 do modal de risco)

  // Step 1
  const [empresaId, setEmpresaId] = useState("");

  const { data: cachedPareceres = [] } = useQuery({
    queryKey: ["ltcat_pareceres", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("ltcat_pareceres")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const { data: dbEvaluations = [] } = useQuery({
    queryKey: ["ltcat_avaliacoes", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("ltcat_avaliacoes")
        .select("*")
        .eq("empresa_id", empresaId);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
  const [responsavel, setResponsavel] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElab, setDataElab] = useState("");
  const [revisoes, setRevisoes] = useState<Revision[]>([]);

  // Step 2
  const [currentRiskSetor, setCurrentRiskSetor] = useState<any>(null);

  // Risk Management
  const [riscos, setRiscos] = useState<RiscoEntry[]>([]);
  const [riskForm, setRiskForm] = useState({
    items: [{ id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "" }],
    tipo_avaliacao: "qualitativa",
    tipo_agente: "",
    agente_id: "",
    agente_nome: "",
    codigo_esocial: "",
    descricao_esocial: "",
    propagacao: "",
    tipo_exposicao: "",
    fonte_geradora: "",
    danos_saude: "",
    medidas_controle: "",
    descricao_tecnica: "",
    tecnica_id: "",
    equipamento_id: "",
    resultado: "",
    unidade_resultado_id: "",
    limite_tolerancia: "",
    unidade_limite_id: "",
    resultados_detalhados: [] as any[],
    resultados_componentes: [] as any[],
    resultados_vibracao: [] as any[],
    resultados_calor: [] as any[],
    funcoes_ges: "",
    data_avaliacao: "",
    equipamentos_avaliacao: [] as any[],
    tempo_coleta: "",
    unidade_tempo_coleta: "",
    parecer_tecnico: "",
    aposentadoria_especial: "",
  });

  const { data: epiEpcCatalog = [] } = useQuery({
    queryKey: ["epi_epc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_epc")
        .select("*, epi_epc_riscos(risco_id)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Filter EPIs/EPCs by the current risco being evaluated
  const episFiltrados = epiEpcCatalog.filter(
    (item: any) =>
      item.tipo === "EPI" &&
      (item.epi_epc_riscos?.some((r: any) => r.risco_id === riskForm.agente_id) ||
        item.epi_epc_riscos?.length === 0)
  );
  const epcsFiltrados = epiEpcCatalog.filter(
    (item: any) =>
      item.tipo === "EPC" &&
      (item.epi_epc_riscos?.some((r: any) => r.risco_id === riskForm.agente_id) ||
        item.epi_epc_riscos?.length === 0)
  );


  // Step 4
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateErrors, setTemplateErrors] = useState<any[]>([]);
  const [templateErrorsOpen, setTemplateErrorsOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentValidated, setDocumentValidated] = useState(false);
  const [smartErrorModalOpen, setSmartErrorModalOpen] = useState(false);
  const [smartErrors, setSmartErrors] = useState<{ tipo: string; mensagem: string; explicacao: string; correcao: string; severidade: "erro" | "aviso" }[]>([]);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: setores = [], isLoading: loadingSetores } = useQuery({
    queryKey: ["setores", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from("setores").select("*").eq("empresa_id", empresaId).order("nome_setor");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const { data: funcoes = [], isLoading: loadingFuncoes } = useQuery({
    queryKey: ["funcoes", empresaId],
    queryFn: async () => {
      if (!empresaId || setores.length === 0) return [];
      const setorIds = setores.map((s: any) => s.id);
      const { data, error } = await supabase.from("funcoes").select("*").in("setor_id", setorIds).order("nome_funcao");
      if (error) throw error;
      return data;
    },
    enabled: setores.length > 0,
  });

  const { data: catRiscos = [] } = useQuery({
    queryKey: ["riscos-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("riscos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: tecnicas = [] } = useQuery({
    queryKey: ["tecnicas_amostragem"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tecnicas_amostragem").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: equipamentos = [] } = useQuery({
    queryKey: ["equipamentos_ho"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipamentos_ho").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("simbolo");
      if (error) throw error;
      return data;
    },
  });

  // Load existing document data in edit mode (HIDRATAÇÃO COMPLETA)
  useEffect(() => {
    if (!isEditMode || docLoaded) return;
    const loadDocument = async () => {
      try {
        const { data: doc, error: docErr } = await supabase
          .from("documentos").select("*").eq("id", documentoId).single();
        if (docErr || !doc) {
          console.error("📋 [LTCAT EDIT] Documento não encontrado:", docErr);
          toast.error("Documento não encontrado");
          return;
        }
        if (doc.empresa_id) setEmpresaId(doc.empresa_id);
        if (doc.template_id) setSelectedTemplate(doc.template_id);

        // Buscar avaliações vinculadas a ESTE documento (preferencial),
        // com fallback para todas da empresa (compatibilidade com docs antigos)
        let avaliacoes: any[] = [];
        const { data: avDoc } = await supabase
          .from("ltcat_avaliacoes").select("*").eq("documento_id", documentoId);
        if (avDoc && avDoc.length > 0) {
          avaliacoes = avDoc;
        } else if (doc.empresa_id) {
          const { data: avEmp } = await supabase
            .from("ltcat_avaliacoes").select("*").eq("empresa_id", doc.empresa_id);
          avaliacoes = avEmp || [];
        }

        if (avaliacoes.length === 0) {
          console.log("📋 [LTCAT EDIT] Documento sem avaliações:", doc);
          setDocLoaded(true);
          return;
        }

        const avIds = avaliacoes.map(a => a.id);

        // Carregar todos os subdados em paralelo
        const [
          { data: componentes = [] },
          { data: calor = [] },
          { data: vibracao = [] },
          { data: resultados = [] },
          { data: equipamentos = [] },
          { data: epiEpc = [] },
        ] = await Promise.all([
          supabase.from("ltcat_av_componentes").select("*").in("avaliacao_id", avIds),
          supabase.from("ltcat_av_calor").select("*").in("avaliacao_id", avIds),
          supabase.from("ltcat_av_vibracao").select("*").in("avaliacao_id", avIds),
          supabase.from("ltcat_av_resultados").select("*").in("avaliacao_id", avIds),
          supabase.from("ltcat_av_equipamentos").select("*").in("avaliacao_id", avIds),
          supabase.from("ltcat_av_epi_epc").select("*").in("avaliacao_id", avIds),
        ]);

        const byAv = (rows: any[] | null) => {
          const m: Record<string, any[]> = {};
          (rows || []).forEach(r => { (m[r.avaliacao_id] ||= []).push(r); });
          return m;
        };
        const compByAv = byAv(componentes);
        const calorByAv = byAv(calor);
        const vibByAv  = byAv(vibracao);
        const resByAv  = byAv(resultados);
        const eqByAv   = byAv(equipamentos);
        const epiByAv: Record<string, any> = {};
        (epiEpc || []).forEach((r: any) => { epiByAv[r.avaliacao_id] = r; });

        const loadedRiscos: RiscoEntry[] = avaliacoes.map((av: any) => {
          const epi = epiByAv[av.id] || {};
          return {
            id: av.id,
            setor_id: av.setor_id || "",
            setor_nome: "",
            funcoes_ges: av.funcoes_ges || "",
            data_avaliacao: av.data_avaliacao || "",
            items: [{
              id: crypto.randomUUID(),
              colaborador: av.colaborador || "",
              funcao_id: av.funcao_id || "",
              funcao_nome: "",
            }],
            tipo_avaliacao: av.tipo_avaliacao || "qualitativa",
            tipo_agente: av.tipo_agente || "",
            agente_id: av.agente_id || "",
            agente_nome: "",
            codigo_esocial: av.codigo_esocial || "",
            descricao_esocial: av.descricao_esocial || "",
            propagacao: av.propagacao || "",
            tipo_exposicao: av.tipo_exposicao || "",
            fonte_geradora: av.fonte_geradora || "",
            danos_saude: av.danos_saude || "",
            medidas_controle: av.medidas_controle || "",
            descricao_tecnica: "",
            tecnica_id: av.tecnica_id || "",
            equipamento_id: av.equipamento_id || "",
            resultado: av.resultado?.toString() || "",
            unidade_resultado_id: av.unidade_resultado_id || "",
            limite_tolerancia: av.limite_tolerancia?.toString() || "",
            unidade_limite_id: av.unidade_limite_id || "",
            tempo_coleta: av.tempo_coleta || "",
            unidade_tempo_coleta: av.unidade_tempo_coleta || "",
            parecer_tecnico: av.parecer_tecnico || "",
            aposentadoria_especial: av.aposentadoria_especial || "",
            resultados_detalhados: (resByAv[av.id] || []).map(r => ({ ...r, id: r.id })),
            resultados_componentes: (compByAv[av.id] || []).map(r => ({ ...r, id: r.id })),
            resultados_vibracao: (vibByAv[av.id] || []).map(r => ({ ...r, id: r.id })),
            resultados_calor: (calorByAv[av.id] || []).map(r => ({ ...r, id: r.id })),
            equipamentos_avaliacao: (eqByAv[av.id] || []).map(r => ({ ...r, id: r.id })),
            epi_id: epi.epi_id || "",
            epi_ca: epi.epi_ca || "",
            epi_atenuacao: epi.epi_atenuacao || "",
            epi_eficaz: epi.epi_eficaz || "",
            epc_id: epi.epc_id || "",
            epc_eficaz: epi.epc_eficaz || "",
          } as RiscoEntry;
        });

        console.log("📋 [LTCAT EDIT DATA]", { doc, avaliacoes: avaliacoes.length, loadedRiscos });
        setRiscos(loadedRiscos);
        setDocLoaded(true);
        toast.success(`${loadedRiscos.length} avaliação(ões) carregada(s) para edição`);
      } catch (err) {
        console.error("📋 [LTCAT EDIT] Erro ao carregar:", err);
        toast.error("Erro ao carregar documento para edição");
      }
    };
    loadDocument();
  }, [isEditMode, documentoId, docLoaded]);

  const funcoesBySetor = (setorId: string) => funcoes.filter((f: any) => f.setor_id === setorId);

  const openRiskModal = (setor: any, editRisk?: RiscoEntry) => {
    setCurrentRiskSetor(setor);
    if (editRisk) {
      setEditingRiskId(editRisk.id);
      setRiskForm({
        items: editRisk.items.map(i => ({ id: i.id as `${string}-${string}-${string}-${string}-${string}`, colaborador: i.colaborador, funcao_id: i.funcao_id, funcao_nome: i.funcao_nome })),
        tipo_avaliacao: editRisk.tipo_avaliacao,
        tipo_agente: editRisk.tipo_agente,
        agente_id: editRisk.agente_id,
        agente_nome: editRisk.agente_nome,
        codigo_esocial: editRisk.codigo_esocial,
        descricao_esocial: editRisk.descricao_esocial,
        propagacao: editRisk.propagacao,
        tipo_exposicao: editRisk.tipo_exposicao,
        fonte_geradora: editRisk.fonte_geradora,
        danos_saude: editRisk.danos_saude,
        medidas_controle: editRisk.medidas_controle,
        descricao_tecnica: editRisk.descricao_tecnica,
        tecnica_id: editRisk.tecnica_id,
        equipamento_id: editRisk.equipamento_id,
        resultado: editRisk.resultado,
        unidade_resultado_id: editRisk.unidade_resultado_id,
        limite_tolerancia: editRisk.limite_tolerancia,
        unidade_limite_id: editRisk.unidade_limite_id,
        resultados_detalhados: editRisk.resultados_detalhados || [],
        resultados_componentes: editRisk.resultados_componentes || [],
        resultados_vibracao: editRisk.resultados_vibracao || [],
        resultados_calor: editRisk.resultados_calor || [],
        funcoes_ges: editRisk.funcoes_ges || "",
        data_avaliacao: editRisk.data_avaliacao || "",
        equipamentos_avaliacao: editRisk.equipamentos_avaliacao || [],
        tempo_coleta: (editRisk as any).tempo_coleta || "",
        unidade_tempo_coleta: (editRisk as any).unidade_tempo_coleta || "",
        parecer_tecnico: editRisk.parecer_tecnico || "",
        aposentadoria_especial: editRisk.aposentadoria_especial || "",
      });
      setEpiEpcRiskForm({
        epi_id: editRisk.epi_id || "",
        epi_ca: editRisk.epi_ca || "",
        epi_atenuacao: editRisk.epi_atenuacao || "",
        epi_eficaz: editRisk.epi_eficaz || "",
        epc_id: editRisk.epc_id || "",
        epc_eficaz: editRisk.epc_eficaz || "",
      });
      setTempCalorRows(editRisk.resultados_calor || []);
      setTempVibracaoRows(editRisk.resultados_vibracao || []);
      setTempFuncaoRows(editRisk.resultados_componentes || []);
    } else {
      setEditingRiskId(null);
      // PERSISTÊNCIA: pré-preencher Funções do GES com o valor já salvo no setor
      const setorIdAtual = setor?.id;
      const existingGes = riscos.find(r => r.setor_id === setorIdAtual && r.funcoes_ges)?.funcoes_ges || "";
      setRiskForm({
        items: [{ id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "" }],
        tipo_avaliacao: "qualitativa",
        tipo_agente: "",
        agente_id: "",
        agente_nome: "",
        codigo_esocial: "",
        descricao_esocial: "",
        propagacao: "",
        tipo_exposicao: "",
        fonte_geradora: "",
        danos_saude: "",
        medidas_controle: "",
        descricao_tecnica: "",
        tecnica_id: "",
        equipamento_id: "",
        resultado: "",
        unidade_resultado_id: "",
        limite_tolerancia: "",
        unidade_limite_id: "",
        resultados_detalhados: [],
        resultados_componentes: [],
        resultados_vibracao: [],
        resultados_calor: [],
        funcoes_ges: existingGes,
        data_avaliacao: "",
        equipamentos_avaliacao: [],
        tempo_coleta: "",
        unidade_tempo_coleta: "",
        parecer_tecnico: "",
        aposentadoria_especial: "",
      });
      setEpiEpcRiskForm({
        epi_id: "",
        epi_ca: "",
        epi_atenuacao: "",
        epi_eficaz: "",
        epc_id: "",
        epc_eficaz: "",
      });
      setTempCalorRows([]);
      setTempVibracaoRows([]);
      setTempFuncaoRows([]);
    }
    setRiskDialogOpen(true);
  };

  const handleAgentSelect = (agentId: string) => {
    const agent = catRiscos.find((r: any) => r.id === agentId);
    if (agent) {
      setRiskForm({
        ...riskForm,
        agente_id: agentId,
        tipo_agente: agent.tipo || "",
        agente_nome: agent.nome || "",
        codigo_esocial: agent.codigo_esocial || "",
        descricao_esocial: agent.descricao_esocial || "",
        propagacao: agent.propagacao?.join(", ") || "",
        tipo_exposicao: agent.tipo_exposicao || "",
        fonte_geradora: agent.fonte_geradora || "",
        danos_saude: agent.danos_saude || "",
        medidas_controle: agent.medidas_controle || "",
      });
    }
  };

  const addItemBlock = () => {
    setRiskForm({
      ...riskForm,
      items: [...riskForm.items, { id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "" }]
    });
  };

  const updateItemBlock = (index: number, field: string, value: string) => {
    const newItems = [...riskForm.items];
    if (field === "funcao_id") {
      const fn = funcoes.find((f: any) => f.id === value);
      newItems[index] = { ...newItems[index], [field]: value, funcao_nome: fn?.nome_funcao || "" };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setRiskForm({ ...riskForm, items: newItems });
  };

  const handleSaveRisk = async (inlineResults?: any[], inlineComponentes?: any[], inlineVibracao?: any[], inlineCalor?: any[]) => {
    if (!riskForm.agente_id) {
      toast.error("Selecione um agente");
      return;
    }

    const agent = catRiscos.find((r: any) => r.id === riskForm.agente_id);
    const tipoAgenteStr = (riskForm.tipo_agente || "").toLowerCase();
    const isFisico = tipoAgenteStr.includes("físi") || tipoAgenteStr.includes("fisi");
    const isComponentes = isAgentComponentes(riskForm.agente_nome || "");

    const isQualitative = !isComponentes && (riskForm.tipo_avaliacao === "qualitativa" ||
      tipoAgenteStr.includes("biológic") || tipoAgenteStr.includes("biologic") ||
      tipoAgenteStr.includes("químicos - qualitat") || tipoAgenteStr.includes("quimicos - qualitat") ||
      tipoAgenteStr.includes("radiação não ionizante") || tipoAgenteStr.includes("radiacao nao ionizante") ||
      tipoAgenteStr.includes("frio"));

    let finalItems = riskForm.items;
    let finalResultados = riskForm.resultados_detalhados;
    let finalComponentes = riskForm.resultados_componentes || [];
    let finalVibracao = riskForm.resultados_vibracao || [];
    let finalCalor = riskForm.resultados_calor || [];

    const isVib = isAgentVibracao(riskForm.agente_nome || "");
    const isCalor = isAgentCalor(riskForm.agente_nome || "");

    if (isCalor) {
      if (inlineCalor) finalCalor = inlineCalor;
      if (!finalCalor || finalCalor.length === 0) {
        toast.error("Adicione ao menos um resultado de calor");
        return;
      }
      if (finalCalor.some(r => !r.colaborador || !r.funcao_id)) {
        toast.error("Preencha colaborador e função em todos os registros");
        return;
      }
      finalItems = finalCalor.map(r => ({
        id: crypto.randomUUID(),
        colaborador: r.colaborador,
        funcao_id: r.funcao_id,
        funcao_nome: r.funcao_nome,
      }));
    } else if (isVib) {
      if (inlineVibracao) finalVibracao = inlineVibracao;

      if (!finalVibracao || finalVibracao.length === 0) {
        toast.error("Adicione ao menos um resultado de vibração");
        return;
      }
      if (finalVibracao.some(r => !r.colaborador || !r.funcao_id)) {
        toast.error("Preencha colaborador e função em todos os registros");
        return;
      }
      finalItems = finalVibracao.map(r => ({
        id: crypto.randomUUID(),
        colaborador: r.colaborador,
        funcao_id: r.funcao_id,
        funcao_nome: r.funcao_nome,
      }));
    } else if (isComponentes) {
      if (inlineComponentes) finalComponentes = inlineComponentes;
      if (!finalComponentes || finalComponentes.length === 0) {
        toast.error("Adicione ao menos uma função com componentes avaliados");
        return;
      }
      if (finalComponentes.some(r => !r.colaborador || !r.funcao_id || !r.componentes?.length)) {
        toast.error("Preencha colaborador, função e ao menos um componente em cada linha");
        return;
      }
      finalItems = finalComponentes.map(r => ({
        id: crypto.randomUUID(),
        colaborador: r.colaborador,
        funcao_id: r.funcao_id,
        funcao_nome: r.funcao_nome,
      }));
    } else if (isQualitative) {
      if (!riskForm.descricao_tecnica?.trim()) {
        toast.error("Preencha a Descrição da Avaliação Técnica");
        return;
      }
      if (riskForm.items.some(item => !item.colaborador || !item.funcao_id)) {
        toast.error("Preencha todos os colaboradores e funções na Seção 1");
        return;
      }
      finalResultados = [];
    } else {
      if (isFisico) {
        if (inlineResults) {
          finalResultados = inlineResults;
        }
        if (!finalResultados || finalResultados.length === 0) {
          toast.error("Adicione ao menos um resultado");
          return;
        }
        if (finalResultados.some(r => !r.colaborador || !r.funcao_id || !r.resultado || !r.unidade_resultado_id)) {
          toast.error("Preencha todos os campos obrigatórios nos resultados");
          return;
        }
        finalItems = finalResultados.map(r => ({
          id: crypto.randomUUID(),
          colaborador: r.colaborador,
          funcao_id: r.funcao_id,
          funcao_nome: r.funcao_nome
        }));
      } else {
        if (riskForm.items.some(item => !item.colaborador || !item.funcao_id)) {
          toast.error("Preencha todos os colaboradores e funções na Seção 1");
          return;
        }
      }
    }

    // ------------------------------------------------------------
    // SEÇÃO 7 OBRIGATÓRIA: Parecer Técnico + Aposentadoria Especial
    // ------------------------------------------------------------
    if (!riskForm.parecer_tecnico?.trim()) {
      toast.error("Preencha o parecer técnico antes de finalizar este risco.");
      document.getElementById("secao-7-parecer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!riskForm.aposentadoria_especial) {
      toast.error("Selecione a conclusão sobre aposentadoria especial.");
      document.getElementById("secao-7-parecer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // ------------------------------------------------------------
    // REGRA DE DUPLICIDADE: Mesma Função + Mesmo Colaborador + Mesmo Risco
    // ------------------------------------------------------------
    const hasDuplicate = finalItems.some((newItem, idx) => {
      // Check for same function+colab within the currently being saved items
      const duplicatedInBatch = finalItems.some((otherItem, otherIdx) =>
        idx !== otherIdx &&
        otherItem.funcao_id === newItem.funcao_id &&
        otherItem.colaborador === newItem.colaborador
      );
      if (duplicatedInBatch) return true;

      // Check against existing database for this sector/risk
      const existingInStore = riscos.find(r =>
        r.id !== editingRiskId && // Important when editing
        r.setor_id === currentRiskSetor.id &&
        r.agente_id === riskForm.agente_id
      );

      if (existingInStore) {
        return existingInStore.items.some(ei =>
          ei.funcao_id === newItem.funcao_id &&
          ei.colaborador === newItem.colaborador
        );
      }
      return false;
    });

    if (hasDuplicate) {
      toast.error("MESMO COLABORADOR JÁ CADASTRADO PARA ESTA FUNÇÃO NESTE RISCO");
      return;
    }

    const newRisk: RiscoEntry = {
      id: editingRiskId || Date.now().toString(),
      setor_id: currentRiskSetor.id,
      setor_nome: currentRiskSetor.nome_setor,
      items: finalItems,
      tipo_avaliacao: riskForm.tipo_avaliacao,
      tipo_agente: riskForm.tipo_agente,
      agente_id: riskForm.agente_id,
      agente_nome: agent?.nome || "",
      codigo_esocial: riskForm.codigo_esocial,
      descricao_esocial: riskForm.descricao_esocial,
      propagacao: riskForm.propagacao,
      tipo_exposicao: riskForm.tipo_exposicao,
      fonte_geradora: riskForm.fonte_geradora,
      danos_saude: riskForm.danos_saude,
      medidas_controle: riskForm.medidas_controle,
      descricao_tecnica: riskForm.descricao_tecnica,
      tecnica_id: riskForm.tecnica_id,
      equipamento_id: riskForm.equipamento_id,
      resultado: riskForm.resultado,
      unidade_resultado_id: riskForm.unidade_resultado_id,
      limite_tolerancia: riskForm.limite_tolerancia,
      unidade_limite_id: riskForm.unidade_limite_id,
      resultados_detalhados: finalResultados,
      resultados_componentes: finalComponentes,
      resultados_vibracao: finalVibracao,
      resultados_calor: finalCalor,
      epi_id: epiEpcRiskForm.epi_id,
      epi_ca: epiEpcRiskForm.epi_ca,
      epi_atenuacao: epiEpcRiskForm.epi_atenuacao,
      epi_eficaz: epiEpcRiskForm.epi_eficaz,
      epc_id: epiEpcRiskForm.epc_id,
      epc_eficaz: epiEpcRiskForm.epc_eficaz,
      funcoes_ges: riskForm.funcoes_ges,
      data_avaliacao: riskForm.data_avaliacao,
      equipamentos_avaliacao: riskForm.equipamentos_avaliacao,
      tempo_coleta: riskForm.tempo_coleta,
      unidade_tempo_coleta: riskForm.unidade_tempo_coleta,
      parecer_tecnico: riskForm.parecer_tecnico,
      aposentadoria_especial: riskForm.aposentadoria_especial,
    } as RiscoEntry;

    // Persistir parecer técnico vinculado ao risco (todas as funções/colaboradores deste risco)
    try {
      if (empresaId && finalItems.length > 0) {
        const pareceresPayload = finalItems.map(it => ({
          empresa_id: empresaId,
          setor_id: currentRiskSetor.id,
          funcao_id: it.funcao_id,
          agente_id: riskForm.agente_id,
          colaborador_nome: it.colaborador,
          parecer_tecnico: riskForm.parecer_tecnico,
          aposentadoria_especial: riskForm.aposentadoria_especial,
        }));
        await supabase.from("ltcat_pareceres").upsert(pareceresPayload, {
          onConflict: "empresa_id,setor_id,funcao_id,agente_id,colaborador_nome",
        });
      }
    } catch (e) {
      console.warn("[LTCAT] Falha ao persistir parecer no DB:", e);
    }

    try {
      const novoGes = (riskForm.funcoes_ges || "").trim();
      if (editingRiskId) {
        setRiscos(prev => prev.map(r => {
          if (r.id === editingRiskId) return newRisk;
          // Propaga funcoes_ges atualizado para todos os riscos do mesmo setor
          if (novoGes && r.setor_id === currentRiskSetor.id) {
            return { ...r, funcoes_ges: novoGes };
          }
          return r;
        }));
      } else {
        setRiscos((prev) => {
          const propagated = novoGes
            ? prev.map(r => r.setor_id === currentRiskSetor.id ? { ...r, funcoes_ges: novoGes } : r)
            : prev;
          return [...propagated, newRisk];
        });
      }
      toast.success("Risco finalizado com sucesso!");
      setRiskDialogOpen(false);
      setResultsModalOpen(false);
      setComponentesModalOpen(false);
      setVibracaoModalOpen(false);
      setCalorModalOpen(false);
      setStep(2);
    } catch (err) {
      toast.error("Erro ao salvar avaliação");
    }
  };

  const openDeleteSelectiveModal = (risk: RiscoEntry) => {
    setRiskToDeleteItems(risk);
    setSelectedItemsToDelete([]);
    setDeleteItemsModalOpen(true);
  };

  const handleConfirmSelectiveDelete = () => {
    if (!riskToDeleteItems || selectedItemsToDelete.length === 0) return;

    setRiscos(prev => prev.map(r => {
      if (r.id === riskToDeleteItems.id) {
        const remainingItems = r.items.filter(i => !selectedItemsToDelete.includes(i.id));

        // Also clean up detailed results if they exist for these items
        const filterSubResults = (arr?: any[]) => arr?.filter(sub => !selectedItemsToDelete.includes(sub.id)) || [];

        return {
          ...r,
          items: remainingItems,
          resultados_calor: filterSubResults(r.resultados_calor),
          resultados_vibracao: filterSubResults(r.resultados_vibracao),
          resultados_componentes: filterSubResults(r.resultados_componentes),
          resultados_detalhados: filterSubResults(r.resultados_detalhados),
        };
      }
      return r;
    }).filter(r => r.items.length > 0)); // Remove risk entry if no items left

    setDeleteItemsModalOpen(false);
    toast.success("Itens removidos com sucesso");
  };

  // Parecer técnico/aposentadoria especial agora são preenchidos exclusivamente
  // na Seção 7 do modal "Avaliação de Risco por Setor" e persistidos via handleSaveRisk.


  const canAdvance = () => {
    if (step === 0) return !!empresaId;
    return true;
  };

  const openComponentesModal = () => {
    const initial = riskForm.resultados_componentes?.length
      ? riskForm.resultados_componentes
      : [{ id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", componentes: [] }];
    setTempFuncaoRows(initial);
    setComponentesModalOpen(true);
  };

  const openVibracaoModal = () => {
    const initial = riskForm.resultados_vibracao?.length
      ? riskForm.resultados_vibracao
      : [{ id: crypto.randomUUID(), data_avaliacao: "", colaborador: "", funcao_id: "", funcao_nome: "", equipamento_avaliado: "", tempo_coleta: "", metodologia_utilizada: "", cod_gfip: "", aren_resultado: "", aren_unidade_id: "", aren_limite: "", aren_limite_unidade_id: "", vdvr_resultado: "", vdvr_unidade_id: "", vdvr_limite: "", vdvr_limite_unidade_id: "" }];
    setTempVibracaoRows(initial);
    setVibracaoModalOpen(true);
  };

  const openCalorModal = () => {
    const blank = {
      id: crypto.randomUUID(),
      colaborador: "",
      funcao_id: "",
      funcao_nome: "",
      data_avaliacao: "",
      tipo_atividade: "",
      taxa_metabolica: "",
      exposicao: "",
      unidade_exposicao_id: "",
      limite_tolerancia: "",
      unidade_limite_id: "",
      cod_gfip: "",
    };
    const initial = riskForm.resultados_calor?.length ? riskForm.resultados_calor : [blank];
    setTempCalorRows(initial);
    setCalorModalOpen(true);
  };

  const buildTemplateData = () => {
    const activeSectors = Array.from(new Set(riscos.map(r => r.setor_id)));
    const empresa = empresas.find((e: any) => e.id === empresaId);

    const findDBParecer = (colab: string, funcId: string, setorId: string, agenteId: string) => {
      return cachedPareceres.find(p =>
        p.setor_id === setorId &&
        p.agente_id === agenteId &&
        p.funcao_id === funcId &&
        (p.colaborador_nome === colab || !colab)
      );
    };

    const getEpiEpcNames = (epiId: string, epcId: string) => {
      const epi = epiEpcCatalog.find(e => e.id === epiId)?.nome || "";
      const epc = epiEpcCatalog.find(e => e.id === epcId)?.nome || "";
      return { epi_nome: epi, epc_nome: epc };
    };

    const setoresData = activeSectors.map(sId => {
      const sectorRisks = riscos.filter(r => r.setor_id === sId);
      const sector = setores.find(s => s.id === sId);

      const uniqueAgents = Array.from(new Set(sectorRisks.map(r => r.agente_id)));

      const riscosLoop = uniqueAgents.map(aId => {
        const agentEntries = sectorRisks.filter(r => r.agente_id === aId);
        const first = agentEntries[0];

        // Parecer técnico no nível do RISCO (para {{#setores}}{{#riscos}}{{parecer_tecnico}})
        const dbParecerRisco = cachedPareceres.find((p: any) =>
          p.agente_id === aId && p.setor_id === sId
        ) || cachedPareceres.find((p: any) => p.agente_id === aId);
        const allResultsRisco = agentEntries.flatMap((r: any) => [
          ...(r.resultados_detalhados || []),
          ...(r.resultados_componentes || []),
          ...(r.resultados_vibracao || []),
          ...(r.resultados_calor || []),
        ]);
        const riscoParecerTecnico =
          first.parecer_tecnico ||
          allResultsRisco.find((x: any) => x?.parecer_tecnico)?.parecer_tecnico ||
          dbParecerRisco?.parecer_tecnico ||
          "";
        const riscoAposentadoria =
          first.aposentadoria_especial ||
          allResultsRisco.find((x: any) => x?.aposentadoria_especial)?.aposentadoria_especial ||
          dbParecerRisco?.aposentadoria_especial ||
          "";

        // Equipamentos da avaliação (mapeados uma vez por risco/agente)
        const equipamentosAvaliacaoLoop = (r => (r.equipamentos_avaliacao || []).map((eq: any) => ({
          agente_nome: eq.agente_nome || r.agente_nome || "",
          nome_equipamento: eq.nome_equipamento || "",
          modelo_equipamento: eq.modelo_equipamento || "",
          serie_equipamento: eq.serie_equipamento || "",
          data_avaliacao: eq.data_avaliacao ? new Date(eq.data_avaliacao).toLocaleDateString("pt-BR") : "",
          data_calibracao: eq.data_calibracao ? new Date(eq.data_calibracao).toLocaleDateString("pt-BR") : "",
        })))(first);
        if (equipamentosAvaliacaoLoop.length > 0) {
          console.log(`🔧 [LTCAT] EQUIPAMENTOS (${first.agente_nome}):`, equipamentosAvaliacaoLoop);
        }

        // Helper para enriquecer avaliacao com dados da função (CBO, descrição) e equipamentos
        const enrichWithFuncao = (av: any, funcaoId: string) => {
          const f = funcoes.find((x: any) => x.id === funcaoId);
          return {
            ...av,
            cbo_codigo: f?.cbo_codigo || "",
            cbo_descricao: f?.cbo_descricao || "",
            descricao_atividades: f?.descricao_atividades || "",
            descricao_atividade: f?.descricao_atividades || "", // alias
            equipamentos_avaliacao: equipamentosAvaliacaoLoop,
          };
        };

        const avaliacoes: any[] = agentEntries.flatMap((r: any) => {
          const base = {
            setor: sector?.nome_setor || "",
            agente_nome: r.agente_nome || "",
            tipo: r.tipo_agente || "",
            tipo_agente: r.tipo_agente || "",
          };

          const { epi_nome, epc_nome } = getEpiEpcNames(r.epi_id, r.epc_id);

          const mapResult = (res: any) => {
            const dbParecer = findDBParecer(res.colaborador, res.funcao_id, sId, aId);
            const resNum = parseFloat(res.resultado || res.exposicao);
            const ltNum = parseFloat(res.limite_tolerancia || res.aren_limite);
            const hasBoth = !isNaN(resNum) && !isNaN(ltNum) && ltNum > 0;
            // Vibração: regra automática (NOCIVO se AREN OU VDVR ultrapassar)
            const arenN = parseFloat(res.aren_resultado);
            const arenLt = parseFloat(res.aren_limite);
            const vdvrN = parseFloat(res.vdvr_resultado);
            const vdvrLt = parseFloat(res.vdvr_limite);
            const arenExc = !isNaN(arenN) && !isNaN(arenLt) && arenLt > 0 && arenN > arenLt;
            const vdvrExc = !isNaN(vdvrN) && !isNaN(vdvrLt) && vdvrLt > 0 && vdvrN > vdvrLt;
            const hasVibData = !isNaN(arenN) || !isNaN(vdvrN);
            const situacaoVib = hasVibData ? ((arenExc || vdvrExc) ? "Nocivo" : "Seguro") : "";
            const situacao = res.situacao || situacaoVib || (hasBoth ? (resNum <= ltNum ? "Segura" : "Nocivo") : "");
            const f = funcoes.find((x: any) => x.id === res.funcao_id);
            return {
              ...base,
              colaborador: res.colaborador || "",
              funcao: res.funcao_nome || f?.nome_funcao || "",
              nome_funcao: res.funcao_nome || f?.nome_funcao || "",
              cbo_codigo: f?.cbo_codigo || "",
              cbo_descricao: f?.cbo_descricao || "",
              descricao_atividades: f?.descricao_atividades || "",
              descricao_atividade: f?.descricao_atividades || "", // alias para template
              equipamentos_avaliacao: equipamentosAvaliacaoLoop,
              data_avaliacao: res.data_avaliacao ? new Date(res.data_avaliacao).toLocaleDateString("pt-BR") : "",
              componente_avaliado: res.componente_avaliado || res.componente || res.nome_componente || "",
              dose_percentual: res.dose_percentual || "",
              resultado: res.resultado || res.aren_resultado || "",
              unidade_resultado: unidades.find(u => u.id === (res.unidade_resultado_id || res.aren_unidade_id))?.simbolo || "",
              unidade: unidades.find(u => u.id === (res.unidade_resultado_id || res.aren_unidade_id))?.simbolo || "",
              limite_tolerancia: res.limite_tolerancia || res.aren_limite || "",
              unidade_limite: unidades.find(u => u.id === (res.unidade_limite_id || res.aren_limite_unidade_id))?.simbolo || "",
              situacao,
              cod_gfip: res.cod_gfip || "",
              tempo_coleta: res.tempo_coleta || (r as any).tempo_coleta || "",
              unidade_tempo_coleta: res.unidade_tempo_coleta || (r as any).unidade_tempo_coleta || "",
              metodologia_utilizada: res.metodologia_utilizada || tecnicas.find((t: any) => t.id === r.tecnica_id)?.nome || "",
              metodologia: res.metodologia_utilizada || tecnicas.find((t: any) => t.id === r.tecnica_id)?.nome || "", // alias curto
              descricao_avaliacao: res.descricao_avaliacao || res.descricao_tecnica || (r as any).descricao_tecnica || "",
              parecer_tecnico: res.parecer_tecnico || dbParecer?.parecer_tecnico || "",
              aposentadoria_especial: res.aposentadoria_especial || dbParecer?.aposentadoria_especial || "",
              epi_nome,
              epc_nome,
              // Vibração fields
              equipamento_avaliado: res.equipamento_avaliado || "",
              aren_resultado: res.aren_resultado || "",
              aren_unidade: unidades.find(u => u.id === res.aren_unidade_id)?.simbolo || "",
              aren_limite: res.aren_limite || "",
              aren_limite_unidade: unidades.find(u => u.id === res.aren_limite_unidade_id)?.simbolo || "",
              vdvr_resultado: res.vdvr_resultado || "",
              vdvr_unidade: unidades.find(u => u.id === res.vdvr_unidade_id)?.simbolo || "",
              vdvr_limite: res.vdvr_limite || "",
              vdvr_limite_unidade: unidades.find(u => u.id === res.vdvr_limite_unidade_id)?.simbolo || "",
              // Vibração — aliases conforme spec do template
              resultado_aren: res.aren_resultado || "",
              unidade_aren: unidades.find(u => u.id === res.aren_unidade_id)?.simbolo || "",
              limite_aren: res.aren_limite || "",
              unidade_limite_aren: unidades.find(u => u.id === res.aren_limite_unidade_id)?.simbolo || "",
              resultado_vdvr: res.vdvr_resultado || "",
              unidade_vdvr: unidades.find(u => u.id === res.vdvr_unidade_id)?.simbolo || "",
              limite_vdvr: res.vdvr_limite || "",
              unidade_limite_vdvr: unidades.find(u => u.id === res.vdvr_limite_unidade_id)?.simbolo || "",
              // Calor fields (modal específico)
              tipo_atividade: res.tipo_atividade || res.atividade_avaliada || "",
              local_avaliado: res.local_avaliado || "",
              atividade_avaliada: res.atividade_avaliada || res.tipo_atividade || "",
              taxa_metabolica: res.taxa_metabolica || "",
              exposicao: res.exposicao || res.resultado || "",
              unidade_exposicao: unidades.find(u => u.id === (res.unidade_exposicao_id || res.unidade_resultado_id))?.simbolo || "",
              resultado_calor: res.resultado_calor || res.exposicao || res.resultado || "",
              unidade_resultado_calor: unidades.find(u => u.id === (res.unidade_resultado_calor_id || res.unidade_exposicao_id || res.unidade_resultado_id))?.simbolo || "",
              limite_tolerancia_calor: res.limite_tolerancia_calor || res.limite_tolerancia || "",
              unidade_limite_calor: unidades.find(u => u.id === (res.unidade_limite_calor_id || res.unidade_limite_id))?.simbolo || "",
            };
          };

          if (r.resultados_calor?.length) return r.resultados_calor.map(mapResult);
          if (r.resultados_vibracao?.length) return r.resultados_vibracao.map(mapResult);
          if (r.resultados_componentes?.length) {
            // Explode componentes em avaliacoes individuais (1 linha por componente)
            const rows: any[] = [];
            r.resultados_componentes.forEach((rc: any) => {
              const dbParecer = findDBParecer(rc.colaborador, rc.funcao_id, sId, aId);
              const f = funcoes.find((x: any) => x.id === rc.funcao_id);
              const dataAv = rc.data_avaliacao ? new Date(rc.data_avaliacao).toLocaleDateString("pt-BR") : "";
              const baseRow = {
                ...base,
                colaborador: rc.colaborador || "",
                funcao: rc.funcao_nome || f?.nome_funcao || "",
                nome_funcao: rc.funcao_nome || f?.nome_funcao || "",
                cbo_codigo: f?.cbo_codigo || "",
                cbo_descricao: f?.cbo_descricao || "",
                descricao_atividades: f?.descricao_atividades || "",
                descricao_atividade: f?.descricao_atividades || "",
                equipamentos_avaliacao: equipamentosAvaliacaoLoop,
                data_avaliacao: dataAv,
                descricao_avaliacao: rc.descricao_avaliacao || rc.descricao_tecnica || (r as any).descricao_tecnica || "",
                dose_percentual: "",
                parecer_tecnico: rc.parecer_tecnico || dbParecer?.parecer_tecnico || "",
                aposentadoria_especial: rc.aposentadoria_especial || dbParecer?.aposentadoria_especial || "",
                epi_nome,
                epc_nome,
                equipamento_avaliado: "",
                aren_resultado: "", aren_unidade: "", aren_limite: "", aren_limite_unidade: "",
                vdvr_resultado: "", vdvr_unidade: "", vdvr_limite: "", vdvr_limite_unidade: "",
                local_avaliado: "", atividade_avaliada: "", taxa_metabolica: "",
                resultado_calor: "", unidade_resultado_calor: "", limite_tolerancia_calor: "", unidade_limite_calor: "",
              };
              const comps = rc.componentes || [];
              if (!comps.length) {
                rows.push({
                  ...baseRow,
                  componente_avaliado: rc.componente || rc.nome_componente || rc.componente_avaliado || "",
                  resultado: "",
                  unidade_resultado: "",
                  unidade: "",
                  limite_tolerancia: "",
                  unidade_limite: "",
                  situacao: "",
                  cod_gfip: "",
                });
                return;
              }
              comps.forEach((c: any) => {
                const uRes = unidades.find((u: any) => u.id === c.unidade_resultado_id)?.simbolo || "";
                const uLim = unidades.find((u: any) => u.id === c.unidade_limite_id)?.simbolo || "";
                const resN = parseFloat(String(c.resultado).replace(",", "."));
                const ltN = parseFloat(String(c.limite_tolerancia).replace(",", "."));
                let situacao = c.situacao || "";
                if (!situacao && !isNaN(resN) && !isNaN(ltN) && ltN > 0) {
                  situacao = resN > ltN ? "Nocivo" : "Seguro";
                }
                rows.push({
                  ...baseRow,
                  componente_avaliado: c.componente || c.nome_componente || "",
                  resultado: c.resultado != null ? String(c.resultado) : "",
                  unidade_resultado: uRes,
                  unidade: uRes,
                  limite_tolerancia: c.limite_tolerancia != null ? String(c.limite_tolerancia) : "",
                  unidade_limite: uLim,
                  situacao,
                  cod_gfip: c.cod_gfip || rc.cod_gfip || "",
                });
              });
            });
            return rows;
          }
          if (r.resultados_detalhados?.length) return r.resultados_detalhados.map(mapResult);

          return r.items.map(item => {
            const dbParecer = findDBParecer(item.colaborador, item.funcao_id, sId, aId);
            const f = funcoes.find((x: any) => x.id === item.funcao_id);
            return {
              ...base,
              colaborador: item.colaborador || "",
              funcao: item.funcao_nome || f?.nome_funcao || "",
              nome_funcao: item.funcao_nome || f?.nome_funcao || "",
              cbo_codigo: f?.cbo_codigo || "",
              cbo_descricao: f?.cbo_descricao || "",
              descricao_atividades: f?.descricao_atividades || "",
              descricao_atividade: f?.descricao_atividades || "",
              equipamentos_avaliacao: equipamentosAvaliacaoLoop,
              data_avaliacao: "",
              componente_avaliado: item.componente_avaliado || "",
              descricao_avaliacao: (item as any).descricao_avaliacao || (r as any).descricao_tecnica || "",
              dose_percentual: "",
              resultado: r.resultado || "",
              unidade_resultado: unidades.find(u => u.id === r.unidade_resultado_id)?.simbolo || "",
              unidade: unidades.find(u => u.id === r.unidade_resultado_id)?.simbolo || "",
              limite_tolerancia: r.limite_tolerancia || "",
              unidade_limite: unidades.find(u => u.id === r.unidade_limite_id)?.simbolo || "",
              situacao: "",
              cod_gfip: "",
              parecer_tecnico: r.parecer_tecnico || dbParecer?.parecer_tecnico || "",
              aposentadoria_especial: r.aposentadoria_especial || dbParecer?.aposentadoria_especial || "",
              epi_nome,
              epc_nome,
              equipamento_avaliado: "",
              aren_resultado: "", aren_unidade: "", aren_limite: "", aren_limite_unidade: "",
              vdvr_resultado: "", vdvr_unidade: "", vdvr_limite: "", vdvr_limite_unidade: "",
              local_avaliado: "", atividade_avaliada: "", taxa_metabolica: "",
              resultado_calor: "", unidade_resultado_calor: "", limite_tolerancia_calor: "", unidade_limite_calor: "",
            };
          });
        });

        // EPIs and EPCs
        const episIds = Array.from(new Set(agentEntries.map(r => r.epi_id).filter(Boolean)));
        const epis = episIds.map(id => {
          const e = epiEpcCatalog.find(item => item.id === id);
          const entryWithDetails = agentEntries.find(r => r.epi_id === id);
          return {
            nome: e?.nome || "EPI",
            epi_nome: e?.nome || "EPI",
            ca: entryWithDetails?.epi_ca || "",
            epi_ca: entryWithDetails?.epi_ca || "",
            atenuacao: entryWithDetails?.epi_atenuacao || "",
            epi_atenuacao: entryWithDetails?.epi_atenuacao || "",
            eficaz: entryWithDetails?.epi_eficaz || "",
            epi_eficaz: entryWithDetails?.epi_eficaz || "",
          };
        });

        const epcsIds = Array.from(new Set(agentEntries.map(r => r.epc_id).filter(Boolean)));
        const epcs = epcsIds.map(id => {
          const e = epiEpcCatalog.find(item => item.id === id);
          const entryWithDetails = agentEntries.find(r => r.epc_id === id);
          return {
            nome: e?.nome || "EPC",
            epc_nome: e?.nome || "EPC",
            eficaz: entryWithDetails?.epc_eficaz || "",
            epc_eficaz: entryWithDetails?.epc_eficaz || "",
          };
        });

        // Flags de tipo de agente para uso condicional no template
        const tipoAgenteUpper = (first.tipo_agente || "").toUpperCase();
        const agenteNomeLower = (first.agente_nome || "").toLowerCase().trim();
        const normalized_agente_nome = (first.agente_nome || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        const RUIDO_NAMES = ["ruído contínuo", "ruido continuo", "ruído intermitente", "ruido intermitente", "ruído contínuo e intermitente", "ruido continuo e intermitente"];
        const FISICOS_NOMES = ["ruido", "calor", "vibracao", "radiacao nao ionizante", "frio", "umidade", "pressao"];
        const QUIMICOS_NOMES = ["poeira", "vapor", "fumo", "nevoa", "neblina", "gas", "gases", "solvente", "silica", "benzeno"];
        const is_quimico = tipoAgenteUpper.includes("QUIMI") || tipoAgenteUpper.includes("QUÍMI");
        const is_fisico = tipoAgenteUpper.includes("FISI") || tipoAgenteUpper.includes("FÍSI");
        const is_biologico = tipoAgenteUpper.includes("BIOLOG") || tipoAgenteUpper.includes("BIOLÓG");
        // Flags por NOME do agente (para coloração condicional no template DOCX)
        const is_agente_fisico = is_fisico || FISICOS_NOMES.some(n => normalized_agente_nome.includes(n));
        const is_agente_quimico = is_quimico || QUIMICOS_NOMES.some(n => normalized_agente_nome.includes(n));
        const is_agente_biologico = is_biologico || normalized_agente_nome.includes("biolog") || normalized_agente_nome.includes("virus") || normalized_agente_nome.includes("bacter") || normalized_agente_nome.includes("fung");
        const is_ruido = RUIDO_NAMES.some(n => agenteNomeLower.includes(n));
        const is_calor = agenteNomeLower.includes("calor");
        const is_vibracao = agenteNomeLower.includes("vibra");
        const is_vibracao_corpo_inteiro = isAgentVCI(first.agente_nome || "");
        const is_vibracao_maos_bracos = isAgentVMB(first.agente_nome || "");
        const tipoAvalLower = String(first.tipo_avaliacao || "").toLowerCase();
        const is_qualitativo = tipoAvalLower.includes("qualitativ");
        const is_quantitativo = tipoAvalLower.includes("quantitativ");
        console.log("🎨 [LTCAT] AGENTE NORMALIZADO:", normalized_agente_nome, { is_agente_fisico, is_agente_quimico, is_agente_biologico });

        // Enriquecer cada avaliação com is_nocivo/is_seguro para coloração condicional no template
        const avaliacoesEnriched = (avaliacoes || []).map((a: any) => {
          const sit = String(a.situacao || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          return {
            ...a,
            situacao: a.situacao || "",
            is_nocivo: sit === "nocivo",
            is_seguro: sit === "seguro" || sit === "segura",
          };
        });
        console.log("🟥🟩 [LTCAT] SITUAÇÕES:", avaliacoesEnriched.map((a: any) => ({ colab: a.colaborador, situacao: a.situacao, is_nocivo: a.is_nocivo, is_seguro: a.is_seguro })));

        return {
          agente_nome: first.agente_nome || "",
          tipo_agente: first.tipo_agente || "",
          is_quimico,
          is_fisico,
          is_biologico,
          is_agente_fisico,
          is_agente_quimico,
          is_agente_biologico,
          normalized_agente_nome,
          is_ruido,
          is_calor,
          is_vibracao,
          is_vibracao_corpo_inteiro,
          is_vibracao_maos_bracos,
          is_qualitativo,
          is_quantitativo,
          tipo_avaliacao: first.tipo_avaliacao || "qualitativa",
          descricao_tecnica: first.descricao_tecnica || "",
          propagacao: first.propagacao || "",
          tipo_exposicao: first.tipo_exposicao || "",
          fonte_geradora: first.fonte_geradora || "",
          danos_saude: first.danos_saude || "",
          medidas_controle: first.medidas_controle || "",
          tecnica: tecnicas.find(t => t.id === first.tecnica_id)?.nome || "",
          tecnica_amostragem: tecnicas.find(t => t.id === first.tecnica_id)?.nome || "",
          equipamento: equipamentos.find(e => e.id === first.equipamento_id)?.nome || "",
          nome_equipamento: equipamentos.find(e => e.id === first.equipamento_id)?.nome || "",
          serie_equipamento: (equipamentos.find(e => e.id === first.equipamento_id) as any)?.serie_equipamento || "",
          data_calibracao: (equipamentos.find(e => e.id === first.equipamento_id) as any)?.data_calibracao ? new Date((equipamentos.find(e => e.id === first.equipamento_id) as any)?.data_calibracao).toLocaleDateString("pt-BR") : "",
          codigo_esocial: first.codigo_esocial || "",
          descricao_esocial: first.descricao_esocial || "",
          // Keep old names as aliases for backwards compat
          esocial_codigo: first.codigo_esocial || "",
          esocial_desc: first.descricao_esocial || "",
          data_avaliacao: first.data_avaliacao ? new Date(first.data_avaliacao).toLocaleDateString("pt-BR") : "",
          funcoes_ges: first.funcoes_ges || "",
          tempo_coleta: (first as any).tempo_coleta || "",
          unidade_tempo_coleta: (first as any).unidade_tempo_coleta || "",
          parecer_tecnico: riscoParecerTecnico,
          aposentadoria_especial: riscoAposentadoria,
          avaliacoes: avaliacoesEnriched,
          epis,
          epcs,
          equipamentos_avaliacao: (first.equipamentos_avaliacao || []).length > 0
            ? first.equipamentos_avaliacao.map((eq: any) => ({
                agente_nome: eq.agente_nome || "",
                nome_equipamento: eq.nome_equipamento || "",
                modelo_equipamento: eq.modelo_equipamento || "",
                serie_equipamento: eq.serie_equipamento || "",
                data_avaliacao: eq.data_avaliacao ? new Date(eq.data_avaliacao).toLocaleDateString("pt-BR") : "",
                data_calibracao: eq.data_calibracao ? new Date(eq.data_calibracao).toLocaleDateString("pt-BR") : "",
              }))
            : [],
        };
      });

      // Funções deste setor (vindas do cadastro de funções)
      const sectorFuncoes = funcoes
        .filter((f: any) => f.setor_id === sId)
        .map((f: any) => ({
          funcao: f.nome_funcao || "",
          nome_funcao: f.nome_funcao || "",
          cbo_codigo: f.cbo_codigo || "",
          cbo_descricao: f.cbo_descricao || "",
          descricao_atividades: f.descricao_atividades || "",
        }));

      // funcoes_ges agregado a partir dos riscos do setor (fallback "")
      const funcoesGesSetor = Array.from(
        new Set(sectorRisks.map(r => r.funcoes_ges).filter(Boolean))
      ).join(", ") || "";

      return {
        setor: sector?.nome_setor || "Setor",
        nome_setor: sector?.nome_setor || "Setor",
        ghe_ges: sector?.ghe_ges || "",
        descricao_ambiente: sector?.descricao_ambiente || "",
        local_trabalho: empresa?.local_trabalho || "",
        jornada_trabalho: empresa?.jornada_trabalho || "",
        funcoes_ges: funcoesGesSetor,
        funcoes: sectorFuncoes,
        riscos: riscosLoop
      };
    });

    // Loop de riscos consolidado (parecer por risco)
    // Busca parecer/aposentadoria em qualquer fonte: nível raiz, resultados ou cache do BD
    const riscosConsolidados = riscos.map(r => {
      const allResults = [
        ...(r.resultados_detalhados || []),
        ...(r.resultados_componentes || []),
        ...(r.resultados_vibracao || []),
        ...(r.resultados_calor || []),
      ];
      const resultadoComParecer = allResults.find((x: any) => x?.parecer_tecnico);
      const resultadoComAposent = allResults.find((x: any) => x?.aposentadoria_especial);
      const dbParecer = cachedPareceres.find((p: any) => p.agente_id === r.agente_id);

      const parecer_tecnico =
        r.parecer_tecnico ||
        resultadoComParecer?.parecer_tecnico ||
        dbParecer?.parecer_tecnico ||
        "";
      const aposentadoria_especial =
        r.aposentadoria_especial ||
        resultadoComAposent?.aposentadoria_especial ||
        dbParecer?.aposentadoria_especial ||
        "";

      const tipoAgenteUpper = (r.tipo_agente || "").toUpperCase();
      const agenteNomeLower = (r.agente_nome || "").toLowerCase().trim();
      const normalized_agente_nome = (r.agente_nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const RUIDO_NAMES = ["ruído contínuo", "ruido continuo", "ruído intermitente", "ruido intermitente", "ruído contínuo e intermitente", "ruido continuo e intermitente"];
      const FISICOS_NOMES = ["ruido", "calor", "vibracao", "radiacao nao ionizante", "frio", "umidade", "pressao"];
      const QUIMICOS_NOMES = ["poeira", "vapor", "fumo", "nevoa", "neblina", "gas", "gases", "solvente", "silica", "benzeno"];
      const _isQ = tipoAgenteUpper.includes("QUIMI") || tipoAgenteUpper.includes("QUÍMI");
      const _isF = tipoAgenteUpper.includes("FISI") || tipoAgenteUpper.includes("FÍSI");
      const _isB = tipoAgenteUpper.includes("BIOLOG") || tipoAgenteUpper.includes("BIOLÓG");
      return {
        agente_nome: r.agente_nome || "",
        tipo_agente: r.tipo_agente || "",
        normalized_agente_nome,
        is_quimico: _isQ,
        is_fisico: _isF,
        is_biologico: _isB,
        is_agente_fisico: _isF || FISICOS_NOMES.some(n => normalized_agente_nome.includes(n)),
        is_agente_quimico: _isQ || QUIMICOS_NOMES.some(n => normalized_agente_nome.includes(n)),
        is_agente_biologico: _isB || normalized_agente_nome.includes("biolog") || normalized_agente_nome.includes("virus") || normalized_agente_nome.includes("bacter") || normalized_agente_nome.includes("fung"),
        is_ruido: RUIDO_NAMES.some(n => agenteNomeLower.includes(n)),
        is_calor: agenteNomeLower.includes("calor"),
        is_vibracao: agenteNomeLower.includes("vibra"),
        is_vibracao_corpo_inteiro: isAgentVCI(r.agente_nome || ""),
        is_vibracao_maos_bracos: isAgentVMB(r.agente_nome || ""),
        is_qualitativo: String(r.tipo_avaliacao || "").toLowerCase().includes("qualitativ"),
        is_quantitativo: String(r.tipo_avaliacao || "").toLowerCase().includes("quantitativ"),
        tipo_avaliacao: r.tipo_avaliacao || "",
        setor: setores.find(s => s.id === r.setor_id)?.nome_setor || "",
        parecer_tecnico,
        aposentadoria_especial,
      };
    });

    const templateData = {
      // Empresa
      empresa: empresa?.razao_social || empresa?.nome_fantasia || "",
      razao_social: empresa?.razao_social || "",
      nome_fantasia: empresa?.nome_fantasia || "",
      cnpj: empresa?.cnpj || "",
      cnae_principal: empresa?.cnae_principal || "",
      cnae: empresa?.cnae_principal || "",
      grau_risco: empresa?.grau_risco || "",
      endereco: empresa?.endereco || "",
      numero_funcionarios_fem: empresa?.numero_funcionarios_fem?.toString() || "0",
      numero_funcionarios_masc: empresa?.numero_funcionarios_masc?.toString() || "0",
      total_funcionarios: empresa?.total_funcionarios?.toString() || "0",
      jornada_trabalho: empresa?.jornada_trabalho || "",
      local_trabalho: empresa?.local_trabalho || "",

      // Contrato
      numero_contrato: empresa?.numero_contrato || "",
      cnpj_contratante: empresa?.cnpj_contratante || "",
      nome_contratante: empresa?.nome_contratante || "",
      vigencia_inicio: empresa?.vigencia_inicio ? new Date(empresa.vigencia_inicio).toLocaleDateString("pt-BR") : "",
      vigencia_fim: empresa?.vigencia_fim ? new Date(empresa.vigencia_fim).toLocaleDateString("pt-BR") : "",
      escopo_contrato: empresa?.escopo_contrato || "",

      // Responsáveis (campos simples da empresa)
      gestor_nome: empresa?.gestor_nome || "",
      gestor_email: empresa?.gestor_email || "",
      gestor_telefone: empresa?.gestor_telefone || "",
      fiscal_nome: empresa?.fiscal_nome || "",
      fiscal_email: empresa?.fiscal_email || "",
      fiscal_telefone: empresa?.fiscal_telefone || "",
      preposto_nome: empresa?.preposto_nome || "",
      preposto_email: empresa?.preposto_email || "",
      preposto_telefone: empresa?.preposto_telefone || "",

      // Documento
      responsavel,
      crea,
      cargo,
      data: dataElab ? new Date(dataElab).toLocaleDateString("pt-BR") : "",

      // Revisões
      revisoes: revisoes.map(r => ({
        revisao: r.revisao || "",
        data_revisao: r.data_revisao ? new Date(r.data_revisao).toLocaleDateString("pt-BR") : "",
        motivo: r.motivo || "",
        responsavel: r.responsavel || ""
      })),

      // Setores com funções e riscos
      setores: setoresData,

      // Loop de riscos consolidado (parecer por risco)
      riscos: riscosConsolidados,
    };

    console.log("📋 [LTCAT] JSON enviado ao template:", JSON.stringify(templateData, null, 2));
    console.log("🧪 [LTCAT] RISCOS COM PARECER:", templateData.setores.flatMap((s: any) => s.riscos).map((r: any) => ({
      agente: r.agente_nome,
      parecer_tecnico: r.parecer_tecnico,
      aposentadoria_especial: r.aposentadoria_especial,
    })));
    console.log("🏷️ [LTCAT] RISCOS COM FLAGS:", templateData.setores.flatMap((s: any) => s.riscos).map((r: any) => ({
      agente: r.agente_nome, tipo: r.tipo_agente,
      is_ruido: r.is_ruido, is_calor: r.is_calor, is_vibracao: r.is_vibracao,
      is_vibracao_corpo_inteiro: r.is_vibracao_corpo_inteiro, is_vibracao_maos_bracos: r.is_vibracao_maos_bracos,
      is_quimico: r.is_quimico, is_biologico: r.is_biologico, is_fisico: r.is_fisico,
    })));
    const qualitativosFlat = templateData.setores.flatMap((s: any) => s.riscos).filter((r: any) => r.is_qualitativo);
    console.log("📝 [LTCAT] QUALITATIVOS JSON:", qualitativosFlat);
    console.log("📝 [LTCAT] QUALITATIVOS AVALIACOES:", qualitativosFlat.flatMap((r: any) => (r.avaliacoes || []).map((a: any) => ({
      agente: r.agente_nome,
      data_avaliacao: a.data_avaliacao,
      colaborador: a.colaborador,
      funcao: a.funcao,
      descricao_avaliacao: a.descricao_avaliacao,
    }))));
    const quimicosFlat = templateData.setores.flatMap((s: any) => s.riscos).filter((r: any) => r.is_quimico);
    console.log("🧪 [LTCAT] QUIMICOS JSON:", quimicosFlat);
    console.log("🧪 [LTCAT] QUIMICOS AVALIACOES:", quimicosFlat.flatMap((r: any) => (r.avaliacoes || []).map((a: any) => ({
      agente: r.agente_nome,
      data_avaliacao: a.data_avaliacao,
      colaborador: a.colaborador,
      funcao: a.funcao,
      componente_avaliado: a.componente_avaliado,
      resultado: a.resultado,
      unidade_resultado: a.unidade_resultado,
      limite_tolerancia: a.limite_tolerancia,
      unidade_limite: a.unidade_limite,
      situacao: a.situacao,
      cod_gfip: a.cod_gfip,
    }))));
    // Validação: químicos sem componente/resultado/limite
    const quimicosIncompletos = quimicosFlat.flatMap((r: any) =>
      (r.avaliacoes || [])
        .filter((a: any) => !a.componente_avaliado || !a.resultado || !a.limite_tolerancia)
        .map((a: any) => ({ agente: r.agente_nome, colaborador: a.colaborador, faltando: ["componente_avaliado", "resultado", "limite_tolerancia"].filter(k => !a[k]) }))
    );
    if (quimicosIncompletos.length) {
      console.warn("⚠️ [LTCAT] QUIMICOS incompletos:", quimicosIncompletos);
      toast.warning(`Dados de componentes químicos incompletos em ${quimicosIncompletos.length} avaliação(ões). Verifique o console.`);
    }
    console.log("🔥 [LTCAT] AVALIACOES CALOR:", templateData.setores.flatMap((s: any) => s.riscos).filter((r: any) => r.is_calor).flatMap((r: any) => r.avaliacoes || []));
    console.log("📳 [LTCAT] VIBRACAO VCI:", templateData.setores.flatMap((s: any) => s.riscos).filter((r: any) => r.is_vibracao_corpo_inteiro));
    console.log("🤚 [LTCAT] VIBRACAO VMB:", templateData.setores.flatMap((s: any) => s.riscos).filter((r: any) => r.is_vibracao_maos_bracos));

    // 🔍 Diagnóstico: lista campos vazios por avaliação para detectar mapeamento ausente
    const allAvals = templateData.setores.flatMap((s: any) =>
      s.riscos.flatMap((r: any) => (r.avaliacoes || []).map((a: any) => ({ agente: r.agente_nome, ...a })))
    );
    const checkFields = ["data_avaliacao", "colaborador", "funcao", "resultado", "limite_tolerancia", "situacao", "cod_gfip"];
    const empty = allAvals.map(a => {
      const missing = checkFields.filter(k => !a[k] || a[k] === "");
      return missing.length ? { agente: a.agente, colaborador: a.colaborador, missing } : null;
    }).filter(Boolean);
    if (empty.length) console.warn("⚠️ [LTCAT] AVALIACOES com campos vazios:", empty);

    const riscosSemParecer = templateData.setores
      .flatMap((s: any) => s.riscos)
      .filter((r: any) => !r.parecer_tecnico || !r.aposentadoria_especial);
    if (riscosSemParecer.length > 0) {
      const nomes = riscosSemParecer.map((r: any) => r.agente_nome || "—").join(", ");
      console.warn("⚠️ [LTCAT] Riscos sem parecer:", nomes);
      (templateData as any).__pareceres_incompletos = nomes;
    }

    return templateData;
  };

  const parseDocxErrors = (err: any): any[] => {
    if (err?.properties?.errors) {
      return err.properties.errors.map((e: any) => {
        const id = e.properties?.id || "unknown";
        const explanation = e.properties?.explanation || e.message || "Erro desconhecido";
        const xtag = e.properties?.xtag || "";
        const file = e.properties?.file || "document.xml";

        let tipo = "Desconhecido";
        let correcao = "";

        if (id === "unopened_tag" || id === "unopened_loop") {
          tipo = "Loop fechado sem abertura";
          correcao = `Adicione {{#${xtag}}} antes de {{/${xtag}}} no template`;
        } else if (id === "unclosed_tag" || id === "unclosed_loop") {
          tipo = "Loop aberto sem fechamento";
          correcao = `Adicione {{/${xtag}}} após {{#${xtag}}} no template`;
        } else if (id === "closing_tag_does_not_match_opening_tag") {
          tipo = "Tag de fechamento não corresponde à abertura";
          correcao = `Verifique se {{#tag}} e {{/tag}} usam o mesmo nome`;
        } else if (id === "undefined_tag" || id === "scopeparser_execution_failed") {
          tipo = "Variável inexistente nos dados";
          // Sugestão "Você quis dizer..."
          const knownVars = [
            "descricao_atividades", "cbo_codigo", "cbo_descricao", "nome_funcao", "funcao",
            "agente_nome", "parecer_tecnico", "aposentadoria_especial",
            "nome_equipamento", "modelo_equipamento", "serie_equipamento", "data_avaliacao", "data_calibracao",
            "razao_social", "cnpj", "cnae_principal", "grau_risco", "endereco",
            "setor", "ghe_ges", "descricao_ambiente", "local_trabalho", "jornada_trabalho",
            "codigo_esocial", "descricao_esocial", "fonte_geradora", "danos_saude", "medidas_controle",
            "tipo_exposicao", "propagacao", "tipo_avaliacao", "tipo_agente",
            "resultado", "unidade_resultado", "limite_tolerancia", "unidade_limite",
            "epi_nome", "epi_ca", "epi_atenuacao", "epi_eficaz", "epc_nome", "epc_eficaz",
          ];
          const suggestion = knownVars.find(k => k.toLowerCase().startsWith(xtag.toLowerCase().slice(0, 5)) || k.includes(xtag.replace(/s$/, "")));
          correcao = suggestion
            ? `A variável {{${xtag}}} não existe. Você quis dizer {{${suggestion}}}?`
            : `A variável {{${xtag}}} não existe nos dados enviados. Verifique o nome ou remova do template`;
        } else if (id === "multi_error") {
          tipo = "Múltiplos erros";
        } else if (id === "raw_xml_tag_not_in_paragraph") {
          tipo = "Tag XML fora de parágrafo";
          correcao = "Mova a tag para dentro de um parágrafo no .docx";
        } else {
          correcao = explanation;
        }

        return { id, tipo, variavel: xtag, explicacao: explanation, arquivo: file, correcao };
      });
    }
    return [{ id: "generic", tipo: "Erro genérico", variavel: "", explicacao: err.message || String(err), arquivo: "", correcao: "Verifique o template .docx" }];
  };

  // Smart data validation - checks if all required data exists
  const validateDataCompleteness = (templateData: any): { tipo: string; mensagem: string; explicacao: string; correcao: string; severidade: "erro" | "aviso" }[] => {
    const issues: { tipo: string; mensagem: string; explicacao: string; correcao: string; severidade: "erro" | "aviso" }[] = [];

    if (!templateData.empresa) issues.push({ tipo: "Dados", mensagem: "Empresa não selecionada", explicacao: "O campo empresa está vazio nos dados do documento.", correcao: "Volte ao passo 1 e selecione uma empresa.", severidade: "erro" });
    if (!templateData.cnpj) issues.push({ tipo: "Dados", mensagem: "CNPJ não preenchido", explicacao: "O CNPJ da empresa não foi encontrado no cadastro.", correcao: "Edite a empresa e preencha o CNPJ.", severidade: "aviso" });
    if (!templateData.setores || templateData.setores.length === 0) issues.push({ tipo: "Dados", mensagem: "Nenhum setor com risco cadastrado", explicacao: "Não há setores com avaliações de risco.", correcao: "Volte ao passo 2 e adicione riscos por setor.", severidade: "erro" });

    if (templateData.setores) {
      templateData.setores.forEach((s: any, si: number) => {
        if (!s.riscos || s.riscos.length === 0) {
          issues.push({ tipo: "Dados", mensagem: `Setor "${s.setor}" sem riscos`, explicacao: "O setor não possui agentes de risco cadastrados.", correcao: `Adicione riscos ao setor ${s.setor}.`, severidade: "aviso" });
        }
        s.riscos?.forEach((r: any) => {
          if (!r.avaliacoes || r.avaliacoes.length === 0) {
            issues.push({ tipo: "Dados", mensagem: `Agente "${r.agente_nome}" em "${s.setor}" sem avaliações`, explicacao: "Nenhuma avaliação registrada para este agente.", correcao: "Adicione resultados de avaliação para o agente.", severidade: "aviso" });
          }
          r.avaliacoes?.forEach((av: any) => {
            if (!av.colaborador) issues.push({ tipo: "Dados", mensagem: `Avaliação sem colaborador em "${r.agente_nome}"`, explicacao: "O campo colaborador está vazio.", correcao: "Preencha o nome do colaborador na avaliação.", severidade: "aviso" });
            if (!av.parecer_tecnico) issues.push({ tipo: "Dados", mensagem: `Sem parecer técnico para "${r.agente_nome}" - "${av.colaborador || 'N/A'}"`, explicacao: "O parecer técnico não foi preenchido.", correcao: "Edite o risco e preencha a Seção 7 — Parecer Técnico.", severidade: "aviso" });
          });
        });
      });
    }

    return issues;
  };

  // Helper: load template and create docxtemplater instance
  const loadTemplateDoc = async () => {
    const template = templates.find((t: any) => t.id === selectedTemplate);
    if (!template) throw new Error("Template não encontrado");

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("templates")
      .download(template.file_path);
    if (downloadError) throw downloadError;

    const arrayBuffer = await fileData.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    return doc;
  };

  // SALVAR DOCUMENTO - Smart validation + save
  const handleSaveDocument = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }

    setSaving(true);
    setDocumentValidated(false);
    const allErrors: typeof smartErrors = [];

    try {
      // ETAPA 1: Load and compile template
      let doc: any;
      try {
        doc = await loadTemplateDoc();
      } catch (compileErr: any) {
        const errors = parseDocxErrors(compileErr);
        errors.forEach(e => {
          allErrors.push({
            tipo: "Template",
            mensagem: `${e.tipo}: ${e.variavel || ""}`,
            explicacao: e.explicacao,
            correcao: e.correcao,
            severidade: "erro",
          });
        });
        setSmartErrors(allErrors);
        setSmartErrorModalOpen(true);
        return;
      }

      // ETAPA 2: Build template data from DB
      const templateData = buildTemplateData();

      // ETAPA 3: Validate data completeness
      const dataIssues = validateDataCompleteness(templateData);
      allErrors.push(...dataIssues);

      // ETAPA 4: Try rendering to catch template errors
      try {
        doc.render(templateData);
      } catch (renderErr: any) {
        const errors = parseDocxErrors(renderErr);
        errors.forEach(e => {
          allErrors.push({
            tipo: "Template",
            mensagem: `${e.tipo}: ${e.variavel || ""}`,
            explicacao: e.explicacao,
            correcao: e.correcao,
            severidade: "erro",
          });
        });
      }

      // Check for any blocking errors
      const blockingErrors = allErrors.filter(e => e.severidade === "erro");

      if (blockingErrors.length > 0) {
        setSmartErrors(allErrors);
        setSmartErrorModalOpen(true);
        toast.error(`${blockingErrors.length} erro(s) impedem a geração do documento`);
        return;
      }

  // Persiste TODAS as avaliações + subdados (componentes/calor/vibração/resultados/equipamentos/EPI-EPC)
  // vinculadas ao documento. Apaga e recria para garantir consistência na edição.
  const persistAvaliacoes = async (docId: string) => {
    if (!docId || !empresaId) return;
    try {
      // 1) Limpar avaliações existentes deste documento (cascade limpa subtables via FK)
      const { data: existentes } = await supabase
        .from("ltcat_avaliacoes").select("id").eq("documento_id", docId);
      if (existentes && existentes.length > 0) {
        await supabase.from("ltcat_avaliacoes")
          .delete().in("id", existentes.map(e => e.id));
      }

      // 2) Para cada risco -> 1 avaliação por item (colaborador/função)
      for (const r of riscos) {
        for (const it of r.items) {
          const { data: avRow, error: avErr } = await supabase
            .from("ltcat_avaliacoes")
            .insert({
              documento_id: docId,
              empresa_id: empresaId,
              setor_id: r.setor_id || null,
              funcao_id: it.funcao_id || null,
              colaborador: it.colaborador || null,
              tipo_avaliacao: r.tipo_avaliacao || null,
              tipo_agente: r.tipo_agente || null,
              agente_id: r.agente_id || null,
              tecnica_id: r.tecnica_id || null,
              equipamento_id: r.equipamento_id || null,
              resultado: r.resultado ? Number(r.resultado) : null,
              unidade_resultado_id: r.unidade_resultado_id || null,
              limite_tolerancia: r.limite_tolerancia ? Number(r.limite_tolerancia) : null,
              unidade_limite_id: r.unidade_limite_id || null,
              codigo_esocial: r.codigo_esocial || null,
              descricao_esocial: r.descricao_esocial || null,
              propagacao: r.propagacao || null,
              tipo_exposicao: r.tipo_exposicao || null,
              fonte_geradora: r.fonte_geradora || null,
              danos_saude: r.danos_saude || null,
              medidas_controle: r.medidas_controle || null,
              parecer_tecnico: r.parecer_tecnico || null,
              aposentadoria_especial: r.aposentadoria_especial || null,
              data_avaliacao: r.data_avaliacao || null,
              funcoes_ges: r.funcoes_ges || null,
              tempo_coleta: (r as any).tempo_coleta || null,
              unidade_tempo_coleta: (r as any).unidade_tempo_coleta || null,
            }).select("id").single();
          if (avErr || !avRow) { console.warn("[persistAvaliacoes] insert avaliação:", avErr); continue; }
          const avId = avRow.id;

          const mkRows = (arr: any[] | undefined, extra: (x: any, i: number) => any) =>
            (arr || []).map((x, i) => ({ avaliacao_id: avId, ordem: i, ...extra(x, i) }));

          const compRows = mkRows(r.resultados_componentes, (x) => ({
            componente: x.componente_avaliado || x.componente || null,
            cas: x.cas || null,
            resultado: x.resultado ? Number(x.resultado) : null,
            unidade_resultado_id: x.unidade_resultado_id || null,
            limite_tolerancia: x.limite_tolerancia ? Number(x.limite_tolerancia) : null,
            unidade_limite_id: x.unidade_limite_id || null,
            tempo_coleta: x.tempo_coleta || null,
            unidade_tempo_coleta: x.unidade_tempo_coleta || null,
            dose_percentual: x.dose_percentual ? Number(x.dose_percentual) : null,
            situacao: x.situacao || null,
            cod_gfip: x.cod_gfip || null,
            colaborador: x.colaborador || null,
            funcao_id: x.funcao_id || null,
            data_avaliacao: x.data_avaliacao || null,
            descricao_avaliacao: x.descricao_avaliacao || x.descricao_tecnica || null,
            parecer_tecnico: x.parecer_tecnico || null,
            aposentadoria_especial: x.aposentadoria_especial || null,
          }));
          const calorRows = mkRows(r.resultados_calor, (x) => ({
            colaborador: x.colaborador || null, funcao_id: x.funcao_id || null,
            data_avaliacao: x.data_avaliacao || null,
            ibutg_medido: x.ibutg_medido ? Number(x.ibutg_medido) : null,
            ibutg_limite: x.ibutg_limite ? Number(x.ibutg_limite) : null,
            m_kcal_h: x.m_kcal_h ? Number(x.m_kcal_h) : null,
            tipo_atividade: x.tipo_atividade || null,
            taxa_metabolica: x.taxa_metabolica || null,
            descricao_atividade: x.descricao_atividade || null,
            situacao: x.situacao || null, cod_gfip: x.cod_gfip || null,
            parecer_tecnico: x.parecer_tecnico || null,
            aposentadoria_especial: x.aposentadoria_especial || null,
          }));
          const vibRows = mkRows(r.resultados_vibracao, (x) => ({
            tipo: x.tipo || null,
            colaborador: x.colaborador || null, funcao_id: x.funcao_id || null,
            data_avaliacao: x.data_avaliacao || null,
            aren: x.aren_resultado ? Number(x.aren_resultado) : (x.aren ? Number(x.aren) : null),
            vdvr: x.vdvr_resultado ? Number(x.vdvr_resultado) : (x.vdvr ? Number(x.vdvr) : null),
            aren_limite: x.aren_limite ? Number(x.aren_limite) : null,
            vdvr_limite: x.vdvr_limite ? Number(x.vdvr_limite) : null,
            tempo_exposicao: x.tempo_exposicao || x.tempo_coleta || null,
            situacao: x.situacao || null, cod_gfip: x.cod_gfip || null,
            parecer_tecnico: x.parecer_tecnico || null,
            aposentadoria_especial: x.aposentadoria_especial || null,
          }));
          const resRows = mkRows(r.resultados_detalhados, (x) => ({
            colaborador: x.colaborador || null, funcao_id: x.funcao_id || null,
            data_avaliacao: x.data_avaliacao || null,
            resultado: x.resultado ? Number(x.resultado) : null,
            unidade_resultado_id: x.unidade_resultado_id || null,
            limite_tolerancia: x.limite_tolerancia ? Number(x.limite_tolerancia) : null,
            unidade_limite_id: x.unidade_limite_id || null,
            tempo_coleta: x.tempo_coleta || null,
            unidade_tempo_coleta: x.unidade_tempo_coleta || null,
            dose_percentual: x.dose_percentual ? Number(x.dose_percentual) : null,
            situacao: x.situacao || null, cod_gfip: x.cod_gfip || null,
            descricao_avaliacao: x.descricao_avaliacao || null,
            parecer_tecnico: x.parecer_tecnico || null,
            aposentadoria_especial: x.aposentadoria_especial || null,
          }));
          const eqRows = mkRows((r as any).equipamentos_avaliacao, (x) => ({
            nome_equipamento: x.nome_equipamento || null,
            modelo_equipamento: x.modelo_equipamento || null,
            serie_equipamento: x.serie_equipamento || null,
            data_calibracao: x.data_calibracao || null,
            data_avaliacao: x.data_avaliacao || null,
            agente_nome: x.agente_nome || null,
          }));

          const inserts: Promise<any>[] = [];
          if (compRows.length)  inserts.push(supabase.from("ltcat_av_componentes").insert(compRows));
          if (calorRows.length) inserts.push(supabase.from("ltcat_av_calor").insert(calorRows));
          if (vibRows.length)   inserts.push(supabase.from("ltcat_av_vibracao").insert(vibRows));
          if (resRows.length)   inserts.push(supabase.from("ltcat_av_resultados").insert(resRows));
          if (eqRows.length)    inserts.push(supabase.from("ltcat_av_equipamentos").insert(eqRows));
          if (r.epi_id || r.epc_id || r.epi_eficaz || r.epc_eficaz) {
            inserts.push(supabase.from("ltcat_av_epi_epc").insert({
              avaliacao_id: avId,
              epi_id: r.epi_id || null, epi_ca: r.epi_ca || null,
              epi_atenuacao: r.epi_atenuacao || null, epi_eficaz: r.epi_eficaz || null,
              epc_id: r.epc_id || null, epc_eficaz: r.epc_eficaz || null,
            }));
          }
          await Promise.all(inserts);
        }
      }
      console.log("💾 [LTCAT] Avaliações persistidas para documento:", docId);
    } catch (e) {
      console.error("[persistAvaliacoes] erro:", e);
      throw e;
    }
  };

      const selectedEmpObj = empresas.find((e: any) => e.id === empresaId);
      const empresaNome = selectedEmpObj?.razao_social || selectedEmpObj?.nome_fantasia || "Empresa";

      let docId: string | undefined;
      if (isEditMode && documentoId) {
        await supabase.from("documentos").update({
          empresa_id: empresaId || null,
          empresa_nome: empresaNome,
          template_id: selectedTemplate,
          status: "rascunho",
        }).eq("id", documentoId);
        docId = documentoId;
      } else {
        const { data: inserted } = await supabase.from("documentos").insert({
          tipo: "LTCAT",
          empresa_id: empresaId || null,
          empresa_nome: empresaNome,
          template_id: selectedTemplate,
          file_path: null,
          status: "rascunho",
        }).select("id").single();
        docId = inserted?.id;
      }
      if (docId) await persistAvaliacoes(docId);

      if (allErrors.length > 0) {
        setSmartErrors(allErrors);
        setSmartErrorModalOpen(true);
        toast.info("Documento salvo com avisos. Revise antes de validar.");
      } else {
        toast.success("✅ Documento salvo! Pronto para validação.");
      }
    } catch (err: any) {
      toast.error("Erro ao salvar documento: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // VALIDAR DOCUMENTO - Final validation
  const handleValidateTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }

    setValidating(true);
    setDocumentValidated(false);
    try {
      let doc: any;
      try {
        doc = await loadTemplateDoc();
      } catch (compileErr: any) {
        const errors = parseDocxErrors(compileErr);
        setTemplateErrors(errors);
        setSmartErrors(errors.map(e => ({ tipo: "Template", mensagem: `${e.tipo}: ${e.variavel || ""}`, explicacao: e.explicacao, correcao: e.correcao, severidade: "erro" as const })));
        setSmartErrorModalOpen(true);
        toast.error(`${errors.length} erro(s) de estrutura no template`);
        return;
      }

      const templateData = buildTemplateData();
      const dataIssues = validateDataCompleteness(templateData);
      const blockingData = dataIssues.filter(d => d.severidade === "erro");

      if (blockingData.length > 0) {
        setSmartErrors(dataIssues);
        setSmartErrorModalOpen(true);
        toast.error("Dados incompletos impedem a validação");
        return;
      }

      try {
        doc.render(templateData);
        setTemplateErrors([]);
        setDocumentValidated(true);

        // Update status in documentos table
        const selectedEmpObj = empresas.find((e: any) => e.id === empresaId);
        const empresaNome = selectedEmpObj?.razao_social || selectedEmpObj?.nome_fantasia || "Empresa";

        let docId: string | undefined;
        if (isEditMode && documentoId) {
          await supabase.from("documentos").update({ status: "concluido" }).eq("id", documentoId);
          docId = documentoId;
        } else {
          // Try to update existing rascunho, or insert new
          const { data: existing } = await supabase
            .from("documentos")
            .select("id")
            .eq("empresa_id", empresaId)
            .eq("tipo", "LTCAT")
            .eq("status", "rascunho")
            .order("created_at", { ascending: false })
            .limit(1);

          if (existing && existing.length > 0) {
            await supabase.from("documentos").update({ status: "concluido" }).eq("id", existing[0].id);
            docId = existing[0].id;
          } else {
            const { data: inserted } = await supabase.from("documentos").insert({
              tipo: "LTCAT",
              empresa_id: empresaId || null,
              empresa_nome: empresaNome,
              template_id: selectedTemplate,
              status: "concluido",
            }).select("id").single();
            docId = inserted?.id;
          }
        }
        if (docId) await persistAvaliacoes(docId);

        toast.success("✅ Documento VALIDADO! Pode gerar o documento final.");
      } catch (renderErr: any) {
        const errors = parseDocxErrors(renderErr);
        setTemplateErrors(errors);
        setSmartErrors(errors.map(e => ({ tipo: "Template", mensagem: `${e.tipo}: ${e.variavel || ""}`, explicacao: e.explicacao, correcao: e.correcao, severidade: "erro" as const })));
        setSmartErrorModalOpen(true);
        toast.error(`${errors.length} erro(s) encontrado(s) no template`);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar template: " + (err.message || ""));
    } finally {
      setValidating(false);
    }
  };

  // GERAR DOCUMENTO - Only after validation
  const handleGenerateDocument = async () => {
    if (!documentValidated) {
      toast.error("🚫 Valide o documento antes de gerar!");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }

    setGenerating(true);
    try {
      const doc = await loadTemplateDoc();
      const templateData = buildTemplateData();

      if ((templateData as any).__pareceres_incompletos) {
        toast.error(`🚫 Parecer técnico não encontrado para: ${(templateData as any).__pareceres_incompletos}`);
        return;
      }

      try {
        doc.render(templateData);
      } catch (renderErr: any) {
        const errors = parseDocxErrors(renderErr);
        setSmartErrors(errors.map(e => ({ tipo: "Template", mensagem: `${e.tipo}: ${e.variavel || ""}`, explicacao: e.explicacao, correcao: e.correcao, severidade: "erro" as const })));
        setSmartErrorModalOpen(true);
        toast.error("Erro ao gerar. Valide novamente.");
        setDocumentValidated(false);
        return;
      }

      const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const selectedEmpObj = empresas.find((e: any) => e.id === empresaId);
      const empresaNome = selectedEmpObj?.razao_social || selectedEmpObj?.nome_fantasia || "Empresa";
      const year = new Date().getFullYear();
      const fileName = `LTCAT_${empresaNome.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.docx`;

      // Upload to storage
      const storagePath = `documentos/${Date.now()}_${fileName}`;
      const { error: uploadErr } = await supabase.storage
        .from("templates")
        .upload(storagePath, output);

      // Update existing document record or insert
      const { data: existing } = await supabase
        .from("documentos")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("tipo", "LTCAT")
        .eq("status", "concluido")
        .is("file_path", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from("documentos").update({
          file_path: storagePath,
          status: uploadErr ? "erro" : "concluido",
        }).eq("id", existing[0].id);
      } else {
        await supabase.from("documentos").insert({
          tipo: "LTCAT",
          empresa_id: empresaId || null,
          empresa_nome: empresaNome,
          template_id: selectedTemplate,
          file_path: storagePath,
          status: uploadErr ? "erro" : "concluido",
        });
      }

      saveAs(output, fileName);
      toast.success("📄 Documento gerado e salvo com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar documento: " + (err.message || "Tente novamente"));
    } finally {
      setGenerating(false);
    }
  };

      return (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/documentos")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-heading font-bold">Novo LTCAT</h1>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>

          {/* Step 1: Identificação */}
          {step === 0 && (
            <div className="glass-card rounded-xl p-6 max-w-2xl space-y-4">
              <div>
                <Label>Empresa <span className="text-destructive">*</span></Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                  <SelectContent>
                    {empresas.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.razao_social || e.nome_fantasia} {e.cnpj ? `(${e.cnpj})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Responsável Técnico</Label><Input className="mt-1" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome completo" /></div>
                <div><Label>CREA</Label><Input className="mt-1" value={crea} onChange={(e) => setCrea(e.target.value)} placeholder="00000/D-SP" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Cargo</Label><Input className="mt-1" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Engenheiro de Segurança" /></div>
                <div><Label>Data de Elaboração</Label><Input className="mt-1" type="date" value={dataElab} onChange={(e) => setDataElab(e.target.value)} /></div>
              </div>

              {/* Subseção: Alterações do Documento */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-bold uppercase tracking-tight">Alterações do Documento</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-accent border-accent/20"
                    onClick={() => setRevisoes([...revisoes, { revisao: "", data_revisao: "", motivo: "", responsavel: "" }])}
                  >
                    <Plus className="w-4 h-4" /> Adicionar Revisão
                  </Button>
                </div>

                {revisoes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhuma revisão registrada.</p>
                ) : (
                  <div className="space-y-4">
                    {revisoes.map((rev, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-xl relative group">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => setRevisoes(revisoes.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <div>
                          <Label className="text-[10px] font-bold uppercase">Revisão</Label>
                          <Input 
                            className="mt-1 h-8 text-xs" 
                            value={rev.revisao} 
                            onChange={(e) => {
                              const newRevs = [...revisoes];
                              newRevs[index].revisao = e.target.value;
                              setRevisoes(newRevs);
                            }} 
                            placeholder="00" 
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase">Data</Label>
                          <Input 
                            className="mt-1 h-8 text-xs" 
                            type="date" 
                            value={rev.data_revisao} 
                            onChange={(e) => {
                              const newRevs = [...revisoes];
                              newRevs[index].data_revisao = e.target.value;
                              setRevisoes(newRevs);
                            }} 
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase">Motivo</Label>
                          <Input 
                            className="mt-1 h-8 text-xs" 
                            value={rev.motivo} 
                            onChange={(e) => {
                              const newRevs = [...revisoes];
                              newRevs[index].motivo = e.target.value;
                              setRevisoes(newRevs);
                            }} 
                            placeholder="Emissão Inicial" 
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase">Responsável</Label>
                          <Input 
                            className="mt-1 h-8 text-xs" 
                            value={rev.responsavel} 
                            onChange={(e) => {
                              const newRevs = [...revisoes];
                              newRevs[index].responsavel = e.target.value;
                              setRevisoes(newRevs);
                            }} 
                            placeholder="Nome" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Riscos (Nova Estrutura) */}
          {step === 1 && empresaId && (
            <div className="space-y-4 max-w-4xl">
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-heading font-bold mb-2">Avaliação de Riscos</h2>
                <p className="text-muted-foreground mb-6">Mapeie os setores da empresa e informe os riscos. Clique em um setor para avaliar.</p>

                {loadingSetores || loadingFuncoes ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : setores.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Nenhum setor cadastrado para esta empresa.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {setores.map((setor: any) => (
                      <div
                        key={setor.id}
                        className="glass-card rounded-xl p-5 border border-border hover:border-accent hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => openRiskModal(setor)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-accent transition-colors uppercase leading-tight">
                              {setor.nome_setor}
                            </h3>
                            {setor.ghe_ges && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-accent/10 text-accent-foreground border-accent/20">
                                GHE/GES: {setor.ghe_ges}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">FUNÇÕES:</Label>
                          {funcoesBySetor(setor.id).length === 0 ? (
                            <p className="text-xs text-muted-foreground/60 italic">Nenhuma função vinculada</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {funcoesBySetor(setor.id).map((f: any) => (
                                <Badge key={f.id} variant="outline" className="text-[10px] font-normal leading-tight px-1.5 py-0 min-h-0 bg-background/50">
                                  {f.nome_funcao}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Clique para avaliar rescos</span>
                          <ArrowRight className="w-3 h-3 text-accent" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {riscos.length > 0 && (
                <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm font-medium">{riscos.length} risco(s) cadastrado(s)</span>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Ver Listagem</Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Listagem Refatorada */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {(() => {
                const sectorsWithRisks = Array.from(new Set(riscos.map(r => r.setor_id)));

                if (riscos.length === 0) {
                  return (
                    <div className="glass-card rounded-xl p-16 text-center text-muted-foreground border-dashed border-2 flex flex-col items-center">
                      <FileText className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-xl font-heading font-medium">Nenhum risco com avaliação finalizada.</p>
                      <p className="text-sm max-w-xs mx-auto mb-6">Mapeie os riscos nos setores da empresa na etapa anterior para visualizá-los aqui.</p>
                      <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Voltar para Avaliação
                      </Button>
                    </div>
                  );
                }

                return sectorsWithRisks.map(setorId => {
                  const setorRiscos = riscos.filter(r => r.setor_id === setorId);
                  const setorNome = setorRiscos[0]?.setor_nome || "Setor Não Identificado";

                  return (
                    <div key={setorId} className="space-y-6">
                      <div className="flex items-end gap-4 border-b-2 border-accent/20 pb-2 mb-2">
                        <h2 className="text-4xl font-heading font-black text-foreground uppercase tracking-tighter leading-none">
                          {setorNome}
                        </h2>
                        <Badge className="mb-1 bg-accent/10 text-accent hover:bg-accent/10 border-accent/20">
                          {setorRiscos.length} RISCO(S)
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {(() => {
                          // Grouping: In this Sector, find all unique Agents
                          const uniqueAgents = Array.from(new Set(setorRiscos.map(r => r.agente_id)));

                          return uniqueAgents.map(agenteId => {
                            // Find all entries for this specific agent in this sector
                            const entriesForAgent = setorRiscos.filter(r => r.agente_id === agenteId);
                            const firstEntry = entriesForAgent[0];

                            // Consolidate all items from all entries (avoiding UI duplicates if they exist in state)
                            // We use the ID to ensure we don't list the exact same sub-entry twice if the groupings overlap
                            const allItems = entriesForAgent.flatMap(e => e.items);

                            return (
                              <div key={agenteId} className="glass-card rounded-2xl overflow-hidden border border-border/50 bg-background/60 shadow-sm hover:shadow-md transition-all">
                                {/* Risk Header */}
                                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-accent/[0.02]">
                                  <div className="space-y-1">
                                    <h3 className="text-2xl font-heading font-black text-foreground uppercase tracking-tight">
                                      {firstEntry.agente_nome}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0 border-accent/30 text-accent/70">
                                        {firstEntry.tipo_agente}
                                      </Badge>
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 tracking-tighter italic">
                                        Avaliação Global: {firstEntry.tipo_avaliacao}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase transition-all hover:bg-accent/10"
                                      onClick={() => openRiskModal(setores.find(s => s.id === firstEntry.setor_id), firstEntry)}
                                    >
                                      <Settings className="w-3.5 h-3.5" /> Editar Risco
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        const idsToRemove = entriesForAgent.map(e => e.id);
                                        setRiscos(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                        toast.success("Agente removido do setor");
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Excluir Card
                                    </Button>
                                  </div>
                                </div>

                                {/* Functions List - One below the other as requested */}
                                <div className="divide-y divide-border/30 bg-background/40">
                                  {allItems.map((item) => {
                                    // Look for result data in all entries
                                    const findRes = () => {
                                      for (const e of entriesForAgent) {
                                        const rc = e.resultados_calor?.find(r => r.id === item.id || (r.funcao_id === item.funcao_id && r.colaborador === item.colaborador));
                                        if (rc) return { type: 'calor', data: rc, entry: e };
                                        const rv = e.resultados_vibracao?.find(r => r.id === item.id || (r.funcao_id === item.funcao_id && r.colaborador === item.colaborador));
                                        if (rv) return { type: 'vibracao', data: rv, entry: e };
                                        const rcp = e.resultados_componentes?.find(r => r.id === item.id || (r.funcao_id === item.funcao_id && r.colaborador === item.colaborador));
                                        if (rcp) return { type: 'componentes', data: rcp, entry: e };
                                        const rd = e.resultados_detalhados?.find(r => r.id === item.id || (r.funcao_id === item.funcao_id && r.colaborador === item.colaborador));
                                        if (rd) return { type: 'detalhado', data: rd, entry: e };
                                      }
                                      return null;
                                    };
                                    const res = findRes();
                                    const itemParecer = res?.data?.parecer_tecnico || firstEntry.parecer_tecnico;

                                    return (
                                      <div key={item.id} className="group/line flex items-center justify-between p-4 hover:bg-accent/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${itemParecer ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground border border-border/50"}`}>
                                            {itemParecer ? <Check className="w-4 h-4" /> : "!"}
                                          </div>
                                          <div className="space-y-0.5">
                                            <p className="text-sm font-black uppercase text-foreground leading-none">{item.funcao_nome}</p>
                                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">COLABORADOR: {item.colaborador}</p>
                                            {res && (
                                              <div className="flex gap-3 text-[9px] font-mono font-bold text-accent uppercase tracking-widest mt-1">
                                                {res.type === 'calor' && <span>CALOR: {res.data.resultado}</span>}
                                                {res.type === 'vibracao' && <span>AREN: {res.data.aren_resultado}</span>}
                                                {res.type === 'detalhado' && <span>RES: {res.data.resultado}</span>}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover/line:opacity-100 transition-all hover:bg-destructive/10 rounded-lg"
                                            onClick={() => {
                                              setRiscos(prev => prev.map(r => {
                                                if (r.agente_id === agenteId && r.setor_id === setorId) {
                                                  return {
                                                    ...r,
                                                    items: r.items.filter(i => i.id !== item.id),
                                                    resultados_calor: r.resultados_calor?.filter(x => x.id !== item.id),
                                                    resultados_vibracao: r.resultados_vibracao?.filter(x => x.id !== item.id),
                                                    resultados_componentes: r.resultados_componentes?.filter(x => x.id !== item.id),
                                                    resultados_detalhados: r.resultados_detalhados?.filter(x => x.id !== item.id),
                                                  };
                                                }
                                                return r;
                                              }).filter(r => r.items.length > 0));
                                            }}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}


          {/* Step 4: Generate */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl">
              <div className="glass-card rounded-xl p-8 text-center">
                <FileDown className="w-12 h-12 mx-auto text-accent mb-4" />
                <h2 className="font-heading text-xl font-bold mb-2">Gerar Documento LTCAT</h2>
                <p className="text-muted-foreground mb-6">Selecione o template, salve, valide e gere o documento final</p>
                <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setTemplateErrors([]); setDocumentValidated(false); }}>
                  <SelectTrigger className="max-w-xs mx-auto mb-4"><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-bold">1</span>
                    Salvar
                  </div>
                  <div className="w-6 h-px bg-border" />
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${documentValidated ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>2</span>
                    Validar
                  </div>
                  <div className="w-6 h-px bg-border" />
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${documentValidated ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>3</span>
                    Gerar
                  </div>
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    onClick={handleSaveDocument}
                    disabled={saving || !selectedTemplate}
                    className="gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Documento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleValidateTemplate}
                    disabled={validating || !selectedTemplate}
                    className={`gap-2 ${documentValidated ? "border-emerald-500 text-emerald-600" : ""}`}
                  >
                    {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : documentValidated ? <ShieldCheck className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                    {documentValidated ? "Validado ✓" : "Validar Documento"}
                  </Button>
                  <Button
                    className={`gap-2 ${documentValidated ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                    onClick={handleGenerateDocument}
                    disabled={generating || !selectedTemplate || !documentValidated}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    Gerar Documento
                  </Button>
                </div>

                {!documentValidated && selectedTemplate && (
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    🔒 Salve e valide o documento antes de gerar o arquivo final
                  </p>
                )}
              </div>

              {/* Template Errors Display (inline) */}
              {templateErrors.length > 0 && (
                <div className="glass-card rounded-xl p-6 border-destructive/30 border">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <h3 className="font-heading font-bold text-destructive">
                      {templateErrors.length} erro(s) encontrado(s) no template
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Corrija esses erros no arquivo .docx e faça upload novamente em Templates.
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {templateErrors.map((err, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-4 border border-border text-left">
                        <div className="flex items-start gap-2">
                          <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded px-2 py-0.5 shrink-0">
                            ERRO {i + 1}
                          </span>
                          <div className="space-y-1 text-sm min-w-0">
                            <p><span className="font-semibold">Tipo:</span> {err.tipo}</p>
                            {err.variavel && (
                              <p><span className="font-semibold">Variável/Tag:</span> <code className="bg-muted px-1 rounded">{err.variavel}</code></p>
                            )}
                            <p><span className="font-semibold">Detalhe:</span> {err.explicacao}</p>
                            {err.correcao && (
                              <p className="text-accent font-medium">
                                <span className="font-semibold">✏️ Correção:</span> {err.correcao}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 max-w-2xl">
            <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/documentos")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />{step === 0 ? "Voltar" : "Anterior"}
            </Button>
            {step < steps.length - 1 && (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                Avançar<ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Risk Dialog */}
          <Dialog open={riskDialogOpen} onOpenChange={setRiskDialogOpen}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="font-heading text-2xl font-bold text-accent uppercase tracking-tight">Avaliação de Risco por Setor (LTCAT)</DialogTitle>
              </DialogHeader>

              <div className="p-8 pt-4 space-y-10">
                {/* SEÇÃO 1: CLASSIFICAÇÃO DA AVALIAÇÃO */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-accent/10 pb-3">
                    <div className="bg-accent/10 p-2 rounded-lg text-accent"><Settings className="w-5 h-5" /></div>
                    <h3 className="font-heading font-bold text-base uppercase tracking-wider text-foreground">SEÇÃO 1: CLASSIFICAÇÃO DA AVALIAÇÃO</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/5 p-6 rounded-xl border border-muted-foreground/10">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Avaliação *</Label>
                      <Select value={riskForm.tipo_avaliacao} onValueChange={(v) => setRiskForm({ ...riskForm, tipo_avaliacao: v })}>
                        <SelectTrigger className="mt-1 h-12 text-base border-muted-foreground/20 hover:border-accent/50 transition-colors"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qualitativa">Qualitativa</SelectItem>
                          <SelectItem value="quantitativa">Quantitativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Agente</Label>
                      <Input value={riskForm.tipo_agente} readOnly className="mt-1 h-12 bg-muted/30 border-muted-foreground/20 font-medium" placeholder="Auto-preenchido" />
                    </div>
                  </div>
                </section>

                {/* SEÇÃO 2: IDENTIFICAÇÃO */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-accent/10 pb-3">
                    <div className="bg-accent/10 p-2 rounded-lg text-accent"><Check className="w-5 h-5" /></div>
                    <h3 className="font-heading font-bold text-base uppercase tracking-wider text-foreground">SEÇÃO 2: IDENTIFICAÇÃO</h3>
                  </div>
                  <div className="space-y-6 bg-muted/5 p-6 rounded-xl border border-muted-foreground/10">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Setor Avaliado</Label>
                        <Input value={currentRiskSetor?.nome_setor || ""} readOnly className="mt-1 h-12 bg-muted/30 border-muted-foreground/20 font-medium" />
                      </div>

                      {/* Campo: Funções do GES */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Funções do GES</Label>
                        <Input
                          className="mt-1 h-12 border-muted-foreground/20 focus-visible:ring-accent"
                          placeholder="Descreva as funções do GES"
                          value={riskForm.funcoes_ges}
                          onChange={(e) => setRiskForm({ ...riskForm, funcoes_ges: e.target.value })}
                        />
                      </div>

                      {riskForm.tipo_avaliacao === "qualitativa" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Label className="text-xs font-bold uppercase text-muted-foreground">Colaboradores e Funções Avaliadas</Label>
                          <div className="space-y-4">
                            {riskForm.items.map((item, index) => (
                              <div key={index} className="flex gap-4 items-end group animate-in fade-in slide-in-from-top-1">
                                <div className="flex-[1.5] space-y-1.5">
                                  <Input
                                    className="h-11 border-muted-foreground/20 focus-visible:ring-accent"
                                    placeholder="Nome do Colaborador"
                                    value={item.colaborador}
                                    onChange={(e) => updateItemBlock(index, "colaborador", e.target.value)}
                                   />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <Select value={item.funcao_id} onValueChange={(v) => updateItemBlock(index, "funcao_id", v)}>
                                    <SelectTrigger className="h-11 border-muted-foreground/20 focus-visible:ring-accent"><SelectValue placeholder="Selecione a Função" /></SelectTrigger>
                                    <SelectContent>
                                      {funcoesBySetor(currentRiskSetor?.id).map((f: any) => (
                                        <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                                      ))}
                                    </SelectContent>
                                   </Select>
                                 </div>
                                 <div className="flex-[0.8] space-y-1.5">
                                   <Input
                                     type="date"
                                     className="h-11 border-muted-foreground/20 focus-visible:ring-accent"
                                     value={riskForm.data_avaliacao}
                                     onChange={(e) => setRiskForm({ ...riskForm, data_avaliacao: e.target.value })}
                                   />
                                 </div>
                                {index > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive h-11 w-11 shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={() => {
                                      const newItems = riskForm.items.filter((_, i) => i !== index);
                                      setRiskForm({ ...riskForm, items: newItems });
                                    }}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={addItemBlock}
                            className="mt-2 text-accent border-accent/20 hover:bg-accent/5 gap-2 font-semibold h-11"
                          >
                            <Plus className="w-5 h-5" />Adicionar Colaborador/Função
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SEÇÃO 3: AGENTE */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 3: AGENTE</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Agente</Label>
                      <Select value={riskForm.agente_id} onValueChange={handleAgentSelect}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o Agente" /></SelectTrigger>
                        <SelectContent>
                          {catRiscos.map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Código eSocial</Label><Input value={riskForm.codigo_esocial} onChange={e => setRiskForm({ ...riskForm, codigo_esocial: e.target.value })} className="mt-1" /></div>
                      <div><Label>Descrição eSocial</Label><Input value={riskForm.descricao_esocial} onChange={e => setRiskForm({ ...riskForm, descricao_esocial: e.target.value })} className="mt-1" /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Propagação</Label><Input value={riskForm.propagacao} onChange={e => setRiskForm({ ...riskForm, propagacao: e.target.value })} className="mt-1" /></div>
                      <div><Label>Tipo de Exposição</Label><Input value={riskForm.tipo_exposicao} onChange={e => setRiskForm({ ...riskForm, tipo_exposicao: e.target.value })} className="mt-1" /></div>
                    </div>

                    <div><Label>Fonte Geradora</Label><Input value={riskForm.fonte_geradora} onChange={e => setRiskForm({ ...riskForm, fonte_geradora: e.target.value })} className="mt-1" /></div>
                    <div><Label>Danos à Saúde</Label><Input value={riskForm.danos_saude} onChange={e => setRiskForm({ ...riskForm, danos_saude: e.target.value })} className="mt-1" /></div>
                    <div><Label>Medidas de Controle Existentes</Label><Input value={riskForm.medidas_controle} onChange={e => setRiskForm({ ...riskForm, medidas_controle: e.target.value })} className="mt-1" /></div>
                  </div>
                </section>

                {/* SEÇÃO 4: AVALIAÇÃO TÉCNICA */}
                {(() => {
                  const tipoAgenteStr = (riskForm.tipo_agente || "").toLowerCase();
                  const isQualitative = riskForm.tipo_avaliacao === "qualitativa" ||
                    tipoAgenteStr.includes("biológic") || tipoAgenteStr.includes("biologic") ||
                    tipoAgenteStr.includes("químicos - qualitat") || tipoAgenteStr.includes("quimicos - qualitat") ||
                    tipoAgenteStr.includes("radiação não ionizante") || tipoAgenteStr.includes("radiacao nao ionizante") ||
                    tipoAgenteStr.includes("frio");

                  return (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                        <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 4: AVALIAÇÃO TÉCNICA</h3>
                      </div>
                      {isQualitative ? (
                        <div>
                          <Label>Descrição da Avaliação Técnica <span className="text-destructive">*</span></Label>
                          <Textarea
                            className="mt-1"
                            placeholder="Descreva tecnicamente a avaliação qualitativa do agente..."
                            value={riskForm.descricao_tecnica}
                            onChange={(e) => setRiskForm({ ...riskForm, descricao_tecnica: e.target.value })}
                          />
                        </div>
                      ) : (
                        <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Técnica de Amostragem</Label>
                            <Select value={riskForm.tecnica_id} onValueChange={(v) => setRiskForm({ ...riskForm, tecnica_id: v })}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {tecnicas.map((t: any) => (
                                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Equipamento</Label>
                            <Select value={riskForm.equipamento_id} onValueChange={(v) => setRiskForm({ ...riskForm, equipamento_id: v })}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {equipamentos.map((e: any) => (
                                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(() => {
                          const ta = (riskForm.tipo_agente || "").toLowerCase();
                          const showTempo = (ta.includes("físi") || ta.includes("fisi") || ta.includes("quími") || ta.includes("quimi"));
                          if (!showTempo) return null;
                          return (
                            <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-1">
                              <div>
                                <Label>Tempo de Coleta</Label>
                                <Input
                                  className="mt-1"
                                  placeholder="Ex: 480"
                                  value={riskForm.tempo_coleta}
                                  onChange={(e) => setRiskForm({ ...riskForm, tempo_coleta: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Unidade do Tempo</Label>
                                <Select value={riskForm.unidade_tempo_coleta} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_tempo_coleta: v })}>
                                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Min">Min</SelectItem>
                                    <SelectItem value="Horas">Horas</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })()}
                        </>
                      )}
                    </section>
                  );
                })()}

                {/* SEÇÃO 5: EPI / EPC — Always here, either as the last section (qualitative) or before results (quantitative) */}
                {(() => {
                  const isRuido = (riskForm.agente_nome || "").toLowerCase().includes("ruído") ||
                    (riskForm.agente_nome || "").toLowerCase().includes("ruido");

                  return (
                    <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                        <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 5: EPI / EPC</h3>
                      </div>

                      {/* EPI block */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">EPI — Equipamento de Proteção Individual</p>

                        <div>
                          <Label>EPI</Label>
                          <Select value={epiEpcRiskForm.epi_id} onValueChange={(v) => setEpiEpcRiskForm({ ...epiEpcRiskForm, epi_id: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
                            <SelectContent>
                              {episFiltrados.length === 0 ? (
                                <SelectItem value="__none" disabled>Nenhum EPI vinculado a este agente</SelectItem>
                              ) : (
                                episFiltrados.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>CA (Certificado de Aprovação)</Label>
                          <Input className="mt-1" placeholder="Ex: CA 12345" value={epiEpcRiskForm.epi_ca} onChange={e => setEpiEpcRiskForm({ ...epiEpcRiskForm, epi_ca: e.target.value })} />
                        </div>

                        {isRuido && (
                          <div className="animate-in fade-in slide-in-from-top-1">
                            <Label>Atenuação</Label>
                            <Input className="mt-1" placeholder="Ex: 20 dB(A)" value={epiEpcRiskForm.epi_atenuacao} onChange={e => setEpiEpcRiskForm({ ...epiEpcRiskForm, epi_atenuacao: e.target.value })} />
                          </div>
                        )}

                        <div>
                          <Label>É eficaz?</Label>
                          <Select value={epiEpcRiskForm.epi_eficaz} onValueChange={(v) => setEpiEpcRiskForm({ ...epiEpcRiskForm, epi_eficaz: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* EPC block */}
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">EPC — Equipamento de Proteção Coletiva</p>

                        <div>
                          <Label>EPC</Label>
                          <Select value={epiEpcRiskForm.epc_id} onValueChange={(v) => setEpiEpcRiskForm({ ...epiEpcRiskForm, epc_id: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o EPC" /></SelectTrigger>
                            <SelectContent>
                              {epcsFiltrados.length === 0 ? (
                                <SelectItem value="__none" disabled>Nenhum EPC vinculado a este agente</SelectItem>
                              ) : (
                                epcsFiltrados.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>É eficaz?</Label>
                          <Select value={epiEpcRiskForm.epc_eficaz} onValueChange={(v) => setEpiEpcRiskForm({ ...epiEpcRiskForm, epc_eficaz: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* SEÇÃO 6: RESULTADOS — Only for quantitative evaluations */}
                {(() => {
                  const tipoAgenteStr = (riskForm.tipo_agente || "").toLowerCase();
                  const isFisico = tipoAgenteStr.includes("físi") || tipoAgenteStr.includes("fisi");
                  const isCompAgent = isAgentComponentes(riskForm.agente_nome || "");
                  const isQualitative = !isCompAgent && (riskForm.tipo_avaliacao === "qualitativa" ||
                    tipoAgenteStr.includes("biológic") || tipoAgenteStr.includes("biologic") ||
                    tipoAgenteStr.includes("químicos - qualitat") || tipoAgenteStr.includes("quimicos - qualitat") ||
                    tipoAgenteStr.includes("radiação não ionizante") || tipoAgenteStr.includes("radiacao nao ionizante") ||
                    tipoAgenteStr.includes("frio"));

                  if (isQualitative) return null;

                  return (
                    <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                         <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 6: RESULTADOS</h3>
                      </div>

                      {/* Data da Avaliação moved to Results modal */}

                      {/* Equipamentos da Avaliação */}
                      {(isFisico || tipoAgenteStr.includes("quími") || tipoAgenteStr.includes("quimi")) && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Equipamentos Utilizados na Avaliação</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-accent border-accent/20 hover:bg-accent/5"
                              onClick={() => {
                                setRiskForm(prev => ({
                                  ...prev,
                                  equipamentos_avaliacao: [
                                    ...prev.equipamentos_avaliacao,
                                    { id: crypto.randomUUID(), agente_nome: prev.agente_nome, nome_equipamento: "", modelo_equipamento: "", serie_equipamento: "", data_avaliacao: prev.data_avaliacao, data_calibracao: "" }
                                  ]
                                }));
                              }}
                            >
                              <Plus className="w-3 h-3" /> Equipamento
                            </Button>
                          </div>
                          {riskForm.equipamentos_avaliacao.map((eq: any, eqi: number) => (
                            <div key={eq.id} className="grid grid-cols-6 gap-2 items-end bg-muted/10 p-3 rounded-lg border">
                              <div>
                                <Label className="text-[10px] font-bold uppercase">Equipamento</Label>
                                <Input className="mt-1 h-8 text-xs" placeholder="Nome" value={eq.nome_equipamento} onChange={e => {
                                  const updated = [...riskForm.equipamentos_avaliacao];
                                  updated[eqi] = { ...updated[eqi], nome_equipamento: e.target.value };
                                  setRiskForm(prev => ({ ...prev, equipamentos_avaliacao: updated }));
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase">Modelo</Label>
                                <Input className="mt-1 h-8 text-xs" placeholder="Modelo" value={eq.modelo_equipamento} onChange={e => {
                                  const updated = [...riskForm.equipamentos_avaliacao];
                                  updated[eqi] = { ...updated[eqi], modelo_equipamento: e.target.value };
                                  setRiskForm(prev => ({ ...prev, equipamentos_avaliacao: updated }));
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase">Série</Label>
                                <Input className="mt-1 h-8 text-xs" placeholder="Nº série" value={eq.serie_equipamento} onChange={e => {
                                  const updated = [...riskForm.equipamentos_avaliacao];
                                  updated[eqi] = { ...updated[eqi], serie_equipamento: e.target.value };
                                  setRiskForm(prev => ({ ...prev, equipamentos_avaliacao: updated }));
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase">Data Aval.</Label>
                                <Input type="date" className="mt-1 h-8 text-xs" value={eq.data_avaliacao} onChange={e => {
                                  const updated = [...riskForm.equipamentos_avaliacao];
                                  updated[eqi] = { ...updated[eqi], data_avaliacao: e.target.value };
                                  setRiskForm(prev => ({ ...prev, equipamentos_avaliacao: updated }));
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase">Data Calib.</Label>
                                <Input type="date" className="mt-1 h-8 text-xs" value={eq.data_calibracao} onChange={e => {
                                  const updated = [...riskForm.equipamentos_avaliacao];
                                  updated[eqi] = { ...updated[eqi], data_calibracao: e.target.value };
                                  setRiskForm(prev => ({ ...prev, equipamentos_avaliacao: updated }));
                                }} />
                              </div>
                              <div className="flex justify-end">
                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => {
                                  setRiskForm(prev => ({ ...prev, equipamentos_avaliacao: prev.equipamentos_avaliacao.filter((_: any, i: number) => i !== eqi) }));
                                }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* VIBRAÇÃO */}
                      {isAgentVibracao(riskForm.agente_nome || "") && (
                        <div className="space-y-4">
                          <Button variant="outline" className="text-accent border-accent/20 hover:bg-accent/5 gap-2" onClick={openVibracaoModal}>
                            <Plus className="w-4 h-4" /> + Resultado
                          </Button>
                          {riskForm.resultados_vibracao && riskForm.resultados_vibracao.length > 0 && (
                            <div className="space-y-2">
                              {riskForm.resultados_vibracao.map((row: any, ri: number) => (
                                <div key={ri} className="p-3 border rounded-lg bg-muted/20">
                                  <div className="font-bold text-sm">{row.funcao_nome} — {row.colaborador}</div>
                                  {row.aren_resultado && <div className="text-xs ml-2">AREN: {row.aren_resultado} {unidades.find((u: any) => u.id === row.aren_unidade_id)?.simbolo}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CALOR */}
                      {isAgentCalor(riskForm.agente_nome || "") && (
                        <div className="space-y-4">
                          <Button variant="outline" className="text-accent border-accent/20 hover:bg-accent/5 gap-2" onClick={openCalorModal}>
                            <Plus className="w-4 h-4" /> + Resultado
                          </Button>
                          {riskForm.resultados_calor && riskForm.resultados_calor.length > 0 && (
                            <div className="space-y-2">
                              {riskForm.resultados_calor.map((row: any, ri: number) => (
                                <div key={ri} className="p-3 border rounded-lg bg-muted/20">
                                  <div className="font-bold text-sm">{row.funcao_nome} — {row.colaborador}</div>
                                  {row.resultado && <div className="text-xs ml-2">Res: {row.resultado} {unidades.find((u: any) => u.id === row.unidade_resultado_id)?.simbolo}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* COMPONENTES QUÍMICOS */}
                      {isCompAgent && (
                        <div className="space-y-4">
                          <Button variant="outline" className="text-accent border-accent/20 hover:bg-accent/5 gap-2" onClick={openComponentesModal}>
                            <Plus className="w-4 h-4" /> + Resultado
                          </Button>
                          {riskForm.resultados_componentes && riskForm.resultados_componentes.length > 0 && (
                            <div className="space-y-2">
                              {riskForm.resultados_componentes.map((row: any, ri: number) => (
                                <div key={ri} className="p-3 border rounded-lg bg-muted/20">
                                  <div className="font-bold text-sm">{row.funcao_nome} — {row.colaborador}</div>
                                  {row.componentes?.map((c: any, ci: number) => (
                                    <div key={ci} className="text-xs text-muted-foreground ml-2">• {c.componente}: {c.resultado}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* FÍSICO PADRÃO (apenas não-ruído/vibração/calor) */}
                      {!isCompAgent && !isFisico && !isAgentVibracao(riskForm.agente_nome || "") && !isAgentCalor(riskForm.agente_nome || "") && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Resultado</Label>
                            <div className="flex gap-2">
                              <Input type="number" step="0.01" value={riskForm.resultado} onChange={e => setRiskForm({ ...riskForm, resultado: e.target.value })} />
                              <Select value={riskForm.unidade_resultado_id} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_resultado_id: v })}>
                                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Unid." /></SelectTrigger>
                                <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Limite (LT)</Label>
                            <div className="flex gap-2">
                              <Input type="number" step="0.01" value={riskForm.limite_tolerancia} onChange={e => setRiskForm({ ...riskForm, limite_tolerancia: e.target.value })} />
                              <Select value={riskForm.unidade_limite_id} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_limite_id: v })}>
                                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Unid." /></SelectTrigger>
                                <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* RUÍDO — múltiplas medições (botão exclusivo) */}
                      {!isCompAgent && isFisico && !isAgentVibracao(riskForm.agente_nome || "") && !isAgentCalor(riskForm.agente_nome || "") && (
                        <div className="space-y-4">
                          <Button variant="outline" className="text-accent border-accent/20 hover:bg-accent/5 gap-2" onClick={() => setResultsModalOpen(true)}>
                            <Plus className="w-4 h-4" /> + Resultados
                          </Button>
                          {riskForm.resultados_detalhados && riskForm.resultados_detalhados.length > 0 && (
                            <div className="text-sm text-foreground p-3 border rounded-lg bg-muted/20">
                              <strong>{riskForm.resultados_detalhados.length}</strong> resultado(s) cadastrado(s).
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })()}
              </div>

              {/* SEÇÃO 7: PARECER TÉCNICO (obrigatória) */}
              <section
                id="secao-7-parecer"
                className="space-y-4 mx-8 mb-6 p-6 rounded-xl border-2 border-accent/30 bg-accent/5 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2 border-b border-accent/20 pb-2">
                  <div className="bg-accent/20 p-1.5 rounded text-accent"><FileText className="w-4 h-4" /></div>
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-accent">SEÇÃO 7: PARECER TÉCNICO *</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Conclusão Técnica / Parecer do Engenheiro *</Label>
                    <Textarea
                      className="mt-1 min-h-[120px]"
                      placeholder="Descreva a conclusão técnica do engenheiro/responsável sobre a exposição avaliada..."
                      value={riskForm.parecer_tecnico || ""}
                      onChange={(e) => setRiskForm({ ...riskForm, parecer_tecnico: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Ensejador de aposentadoria especial? *</Label>
                    <Select
                      value={riskForm.aposentadoria_especial || ""}
                      onValueChange={(v) => setRiskForm({ ...riskForm, aposentadoria_especial: v })}
                    >
                      <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Selecione a conclusão previdenciária" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM, CARACTERIZADO">SIM, CARACTERIZADO</SelectItem>
                        <SelectItem value="NÃO CARACTERIZADO">NÃO CARACTERIZADO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4 px-8 pb-6">
                <Button variant="outline" onClick={() => setRiskDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wide" onClick={() => handleSaveRisk()}>FINALIZAR</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL NÍVEL 1: RESULTADOS POR FUNÇÃO (Componentes)           */}
          {/* ============================================================ */}
          <Dialog open={componentesModalOpen} onOpenChange={setComponentesModalOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl uppercase">RESULTADOS — {riskForm.agente_nome}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {tempFuncaoRows.map((row, ri) => (
                  <div key={row.id} className="border rounded-xl p-4 bg-muted/10 space-y-3">
                    {/* Cabeçalho da linha */}
                    <div className="flex gap-3 items-end flex-wrap">
                      <div className="w-40">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Avaliação</Label>
                        <Input
                          type="date"
                          className="mt-1"
                          value={row.data_avaliacao || ""}
                          onChange={e => {
                            const updated = [...tempFuncaoRows];
                            updated[ri] = { ...updated[ri], data_avaliacao: e.target.value };
                            setTempFuncaoRows(updated);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colaborador</Label>
                        <Input
                          className="mt-1"
                          placeholder="Nome do colaborador"
                          value={row.colaborador}
                          onChange={e => {
                            const updated = [...tempFuncaoRows];
                            updated[ri] = { ...updated[ri], colaborador: e.target.value };
                            setTempFuncaoRows(updated);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Função Avaliada</Label>
                        <Select
                          value={row.funcao_id}
                          onValueChange={v => {
                            const fn = funcoes.find((f: any) => f.id === v);
                            const updated = [...tempFuncaoRows];
                            updated[ri] = { ...updated[ri], funcao_id: v, funcao_nome: fn?.nome_funcao || "" };
                            setTempFuncaoRows(updated);
                          }}
                        >
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                          <SelectContent>
                            {funcoesBySetor(currentRiskSetor?.id).map((f: any) => (
                              <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-accent border-accent/20 hover:bg-accent/5 shrink-0"
                        onClick={() => {
                          setCurrentAmostraIndex(ri);
                          setTempComponentes(row.componentes?.length ? row.componentes : [{ id: crypto.randomUUID(), componente: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "", situacao: "", cod_gfip: "" }]);
                          setAmostraModalOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4" /> Amostra
                      </Button>
                      {ri > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive shrink-0"
                          onClick={() => setTempFuncaoRows(tempFuncaoRows.filter((_, i) => i !== ri))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Preview dos componentes cadastrados para esta função */}
                    {row.componentes && row.componentes.length > 0 && (
                      <div className="pl-3 border-l-2 border-accent/30 space-y-0.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{row.funcao_nome || "Função"}</p>
                        {row.componentes.map((c: any, ci: number) => (
                          <div key={ci} className="text-sm">
                            <span className="font-medium">{c.componente}</span>:{" "}
                            <span className="font-mono">{c.resultado} {unidades.find((u: any) => u.id === c.unidade_resultado_id)?.simbolo}</span>
                            {c.limite_tolerancia && (
                              <span className="text-muted-foreground text-xs ml-2">(LT: {c.limite_tolerancia} {unidades.find((u: any) => u.id === c.unidade_limite_id)?.simbolo})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-accent border-accent/20 hover:bg-accent/5"
                  onClick={() => setTempFuncaoRows([...tempFuncaoRows, { id: crypto.randomUUID(), data_avaliacao: "", colaborador: "", funcao_id: "", funcao_nome: "", componentes: [] }])}
                >
                  <Plus className="w-4 h-4" /> Adicionar Função
                </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setComponentesModalOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    setRiskForm(prev => ({ ...prev, resultados_componentes: tempFuncaoRows }));
                    setComponentesModalOpen(false);
                    toast.success(`${tempFuncaoRows.length} resultado(s) salvo(s). Preencha o Parecer Técnico (Seção 7) para finalizar.`);
                    setTimeout(() => {
                      const el = document.getElementById("secao-7-parecer");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("ring-4", "ring-accent/60");
                        setTimeout(() => el.classList.remove("ring-4", "ring-accent/60"), 2000);
                      }
                    }, 200);
                  }}
                >
                  Salvar Resultados
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL NÍVEL 2: CADASTRO DE COMPONENTES DA AMOSTRA           */}
          {/* ============================================================ */}
          <Dialog open={amostraModalOpen} onOpenChange={setAmostraModalOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg uppercase">Cadastro de Componentes — Amostra</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {tempComponentes.map((comp, ci) => (
                  <div key={comp.id} className="grid grid-cols-12 gap-2 items-end bg-muted/10 p-3 rounded-lg border">
                    <div className="col-span-4">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Componente Avaliado</Label>
                      <Input
                        className="mt-1"
                        placeholder="Ex: Sílica Livre, Poeira Respirável"
                        value={comp.componente}
                        onChange={e => {
                          const updated = [...tempComponentes];
                          updated[ci] = { ...updated[ci], componente: e.target.value };
                          setTempComponentes(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        value={comp.resultado}
                        onChange={e => {
                          const updated = [...tempComponentes];
                          updated[ci] = { ...updated[ci], resultado: e.target.value };
                          setTempComponentes(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</Label>
                      <Select
                        value={comp.unidade_resultado_id}
                        onValueChange={v => {
                          const updated = [...tempComponentes];
                          updated[ci] = { ...updated[ci], unidade_resultado_id: v };
                          setTempComponentes(updated);
                        }}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Unid." /></SelectTrigger>
                        <SelectContent>
                          {unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limite (LT)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        value={comp.limite_tolerancia}
                        onChange={e => {
                          const updated = [...tempComponentes];
                          updated[ci] = { ...updated[ci], limite_tolerancia: e.target.value };
                          setTempComponentes(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</Label>
                      <Select
                        value={comp.unidade_limite_id}
                        onValueChange={v => {
                          const updated = [...tempComponentes];
                          updated[ci] = { ...updated[ci], unidade_limite_id: v };
                          setTempComponentes(updated);
                        }}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="U." /></SelectTrigger>
                        <SelectContent>
                          {unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive mt-5"
                        onClick={() => setTempComponentes(tempComponentes.filter((_, i) => i !== ci))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Linha 2: Situação automática + GFIP */}
                    <div className="col-span-6">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Situação (automática)</Label>
                      {(() => {
                        const r = parseFloat(String(comp.resultado).replace(",", "."));
                        const lt = parseFloat(String(comp.limite_tolerancia).replace(",", "."));
                        const sit = (!isNaN(r) && !isNaN(lt) && lt > 0) ? (r > lt ? "Nocivo" : "Seguro") : "—";
                        const cls = sit === "Nocivo" ? "text-destructive" : sit === "Seguro" ? "text-success" : "text-muted-foreground";
                        return <div className={`mt-1 h-10 px-3 py-2 text-sm rounded-md border bg-muted/20 font-semibold ${cls}`}>{sit}</div>;
                      })()}
                    </div>
                    <div className="col-span-6">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cód. GFIP</Label>
                      <Select
                        value={comp.cod_gfip || ""}
                        onValueChange={v => {
                          const updated = [...tempComponentes];
                          updated[ci] = { ...updated[ci], cod_gfip: v };
                          setTempComponentes(updated);
                        }}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">01</SelectItem>
                          <SelectItem value="02">02</SelectItem>
                          <SelectItem value="03">03</SelectItem>
                          <SelectItem value="04">04</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-accent border-accent/20 hover:bg-accent/5 mt-2"
                  onClick={() => setTempComponentes([...tempComponentes, { id: crypto.randomUUID(), componente: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "", situacao: "", cod_gfip: "" }])}
                >
                  <Plus className="w-4 h-4" /> Adicionar Componente
                </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setAmostraModalOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    if (currentAmostraIndex >= 0) {
                      const updated = [...tempFuncaoRows];
                      updated[currentAmostraIndex] = { ...updated[currentAmostraIndex], componentes: tempComponentes };
                      setTempFuncaoRows(updated);
                    }
                    setAmostraModalOpen(false);
                  }}
                >
                  OK — Salvar Componentes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Nested Results Dialog */}
          <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl uppercase">CADASTRO DE RESULTADOS</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4 overflow-x-auto">
                <div className="min-w-[900px] space-y-4">
                  {tempResultados.map((res, index) => {
                    const resNum = parseFloat(res.resultado);
                    const ltNum = parseFloat(res.limite_tolerancia);
                    const hasBoth = !isNaN(resNum) && !isNaN(ltNum) && ltNum > 0;
                    const situacao = hasBoth ? (resNum <= ltNum ? "Segura" : "Nocivo") : "";
                    
                    return (
                    <div key={res.id} className="group animate-in fade-in slide-in-from-top-1 bg-muted/10 p-4 rounded-lg border space-y-3">
                      {/* LINHA 1: Data, Colaborador, Função, Dose */}
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Data da Avaliação</Label>
                          <Input type="date" value={res.data_avaliacao || ""} onChange={e => {
                            const updated = [...tempResultados];
                            updated[index].data_avaliacao = e.target.value;
                            setTempResultados(updated);
                          }} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Colaborador</Label>
                          <Input placeholder="Nome" value={res.colaborador} onChange={e => {
                            const updated = [...tempResultados];
                            updated[index].colaborador = e.target.value;
                            setTempResultados(updated);
                          }} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Função Avaliada</Label>
                          <Select value={res.funcao_id} onValueChange={v => {
                            const updated = [...tempResultados];
                            updated[index].funcao_id = v;
                            const fn = funcoes.find((f: any) => f.id === v);
                            updated[index].funcao_nome = fn?.nome_funcao || "";
                            setTempResultados(updated);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {funcoesBySetor(currentRiskSetor?.id).map((f: any) => (
                                <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Dose %</Label>
                          <Input type="number" step="0.01" placeholder="Ex: 50" value={res.dose_percentual || ""} onChange={e => {
                            const updated = [...tempResultados];
                            updated[index].dose_percentual = e.target.value;
                            setTempResultados(updated);
                          }} />
                        </div>
                      </div>
                      {/* COMPONENTE AVALIADO — apenas para QUÍMICO */}
                      {(riskForm.tipo_agente || "").toUpperCase().includes("QUIMI") && (
                        <div className="grid grid-cols-1 gap-3 items-end">
                          <div>
                            <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">
                              Componente Avaliado <span className="text-accent">(Químico)</span>
                            </Label>
                            <Input
                              placeholder="Ex: Benzeno, Sílica Livre, Poeira Respirável"
                              value={res.componente_avaliado || ""}
                              onChange={e => {
                                const updated = [...tempResultados];
                                updated[index].componente_avaliado = e.target.value;
                                setTempResultados(updated);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* LINHA 2: Resultado, Unidade, Limite, Unidade Limite */}
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Resultado</Label>
                          <Input type="number" placeholder="0.00" step="0.01" value={res.resultado} onChange={e => {
                            const updated = [...tempResultados];
                            updated[index].resultado = e.target.value;
                            setTempResultados(updated);
                          }} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Unidade</Label>
                          <Select value={res.unidade_resultado_id} onValueChange={v => {
                            const updated = [...tempResultados];
                            updated[index].unidade_resultado_id = v;
                            setTempResultados(updated);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Unid." /></SelectTrigger>
                            <SelectContent>
                              {unidades.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Limite (LT)</Label>
                          <Input type="number" placeholder="0.00" step="0.01" value={res.limite_tolerancia} onChange={e => {
                            const updated = [...tempResultados];
                            updated[index].limite_tolerancia = e.target.value;
                            setTempResultados(updated);
                          }} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Unid. Limite</Label>
                          <Select value={res.unidade_limite_id} onValueChange={v => {
                            const updated = [...tempResultados];
                            updated[index].unidade_limite_id = v;
                            setTempResultados(updated);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Unid." /></SelectTrigger>
                            <SelectContent>
                              {unidades.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* LINHA 3: Situação (auto) + Cod. GFIP + Delete */}
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Situação</Label>
                          <div className={`h-10 flex items-center px-3 rounded-md border text-sm font-bold ${
                            situacao === "Segura" ? "bg-[#00ff5f]/10 text-[#00ff5f] border-[#00ff5f]/30" :
                            situacao === "Nocivo" ? "bg-[#ff3b1f]/10 text-[#ff3b1f] border-[#ff3b1f]/30" :
                            "bg-muted/30 text-muted-foreground border-muted-foreground/20"
                          }`}>
                            {situacao || "—"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Cod. GFIP</Label>
                          <Select value={res.cod_gfip || ""} onValueChange={v => {
                            const updated = [...tempResultados];
                            updated[index].cod_gfip = v;
                            setTempResultados(updated);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="01">01</SelectItem>
                              <SelectItem value="02">02</SelectItem>
                              <SelectItem value="03">03</SelectItem>
                              <SelectItem value="04">04</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                            setTempResultados(tempResultados.filter((_, i) => i !== index));
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <Button variant="outline" size="sm" onClick={() => {
                  setTempResultados([...tempResultados, { id: crypto.randomUUID(), data_avaliacao: "", colaborador: "", funcao_id: "", funcao_nome: "", componente_avaliado: "", dose_percentual: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "", cod_gfip: "" }]);
                }} className="mt-2 text-accent border-accent/20 hover:bg-accent/5">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Linha
                </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setResultsModalOpen(false)}>Cancelar</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => {
                  // Persistir resultados no riskForm e voltar ao modal principal
                  setRiskForm(prev => ({ ...prev, resultados_detalhados: tempResultados }));
                  setResultsModalOpen(false);
                  toast.success(`${tempResultados.length} resultado(s) salvo(s). Preencha o Parecer Técnico (Seção 7) para finalizar.`);
                  // Scroll automático até Seção 7 com destaque
                  setTimeout(() => {
                    const el = document.getElementById("secao-7-parecer");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      el.classList.add("ring-4", "ring-accent/60");
                      setTimeout(() => el.classList.remove("ring-4", "ring-accent/60"), 2000);
                    }
                  }, 200);
                }}>
                  Salvar Resultados
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL NÍVEL 1: RESULTADO DE VIBRAÇÃO (VCI / VMB)             */}
          {/* ============================================================ */}
          <Dialog open={vibracaoModalOpen} onOpenChange={setVibracaoModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl uppercase">Cadastro de Resultados — {isAgentVCI(riskForm.agente_nome || "") ? "Vibração de Corpo Inteiro (VCI)" : "Vibração de Mãos e Braços (VMB)"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {tempVibracaoRows.map((row, ri) => (
                  <div key={row.id} className="bg-muted/10 p-3 rounded-lg border border-border space-y-3">
                    {/* LINHA 0: Data, Tempo Coleta, Metodologia, Cod GFIP */}
                    <div className="grid grid-cols-4 gap-3 items-end">
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data da Avaliação</Label>
                        <Input
                          type="date" className="mt-1 h-8 text-sm" value={row.data_avaliacao || ""}
                          onChange={e => {
                            const updated = [...tempVibracaoRows];
                            updated[ri].data_avaliacao = e.target.value;
                            setTempVibracaoRows(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tempo Coleta</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex: 480 min" value={row.tempo_coleta || ""}
                          onChange={e => {
                            const updated = [...tempVibracaoRows];
                            updated[ri].tempo_coleta = e.target.value;
                            setTempVibracaoRows(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Metodologia</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex: NHO-09 / NHO-10" value={row.metodologia_utilizada || ""}
                          onChange={e => {
                            const updated = [...tempVibracaoRows];
                            updated[ri].metodologia_utilizada = e.target.value;
                            setTempVibracaoRows(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cod. GFIP</Label>
                        <Select value={row.cod_gfip || ""} onValueChange={v => {
                          const updated = [...tempVibracaoRows];
                          updated[ri].cod_gfip = v;
                          setTempVibracaoRows(updated);
                        }}>
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Sel." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="01">01</SelectItem>
                            <SelectItem value="02">02</SelectItem>
                            <SelectItem value="03">03</SelectItem>
                            <SelectItem value="04">04</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-[2]">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Colaborador</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Nome" value={row.colaborador}
                          onChange={e => {
                            const updated = [...tempVibracaoRows];
                            updated[ri].colaborador = e.target.value;
                            setTempVibracaoRows(updated);
                          }}
                        />
                      </div>
                      <div className="flex-[2]">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Função Avaliada</Label>
                        <Select
                          value={row.funcao_id}
                          onValueChange={v => {
                            const updated = [...tempVibracaoRows];
                            updated[ri].funcao_id = v;
                            const fn = funcoes.find((f: any) => f.id === v);
                            updated[ri].funcao_nome = fn?.nome_funcao || "";
                            setTempVibracaoRows(updated);
                          }}
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {funcoesBySetor(currentRiskSetor?.id).map((f: any) => (
                              <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-[2]">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Equipamento Avaliado</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex: Empilhadeira" value={row.equipamento_avaliado}
                          onChange={e => {
                            const updated = [...tempVibracaoRows];
                            updated[ri].equipamento_avaliado = e.target.value;
                            setTempVibracaoRows(updated);
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-accent border-accent/20 hover:bg-accent/5 shrink-0 h-8"
                        onClick={() => {
                          setCurrentVibracaoIndex(ri);
                          setTempVibAmostra({ ...row });
                          setVibracaoAmostraModalOpen(true);
                        }}
                      >
                        {isAgentVCI(riskForm.agente_nome || "") ? (
                          <><FileText className="w-4 h-4" /> Amostra VCI</>
                        ) : (
                          <><Settings className="w-4 h-4" /> Amostra VMB</>
                        )}
                      </Button>
                      {ri > 0 && (
                        <Button
                          variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8"
                          onClick={() => setTempVibracaoRows(tempVibracaoRows.filter((_, i) => i !== ri))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Preview VCI / VMB */}
                    {(row.aren_resultado || row.vdvr_resultado) && (
                      <div className="pl-3 border-l-2 border-accent/30 space-y-0.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{row.funcao_nome || "Função"}</p>
                        {row.aren_resultado && (
                          <div className="text-sm">
                            <span className="font-medium">AREN</span>:{" "}
                            <span className="font-mono">{row.aren_resultado} {unidades.find((u: any) => u.id === row.aren_unidade_id)?.simbolo}</span>
                            {row.aren_limite && (
                              <span className="text-muted-foreground text-xs ml-2">(LT: {row.aren_limite} {unidades.find((u: any) => u.id === row.aren_limite_unidade_id)?.simbolo})</span>
                            )}
                          </div>
                        )}
                        {row.vdvr_resultado && (
                          <div className="text-sm">
                            <span className="font-medium">VDVR</span>:{" "}
                            <span className="font-mono">{row.vdvr_resultado} {unidades.find((u: any) => u.id === row.vdvr_unidade_id)?.simbolo}</span>
                            {row.vdvr_limite && (
                              <span className="text-muted-foreground text-xs ml-2">(LT: {row.vdvr_limite} {unidades.find((u: any) => u.id === row.vdvr_limite_unidade_id)?.simbolo})</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline" size="sm" className="gap-2 text-accent border-accent/20 hover:bg-accent/5"
                  onClick={() => setTempVibracaoRows([...tempVibracaoRows, { id: crypto.randomUUID(), data_avaliacao: "", colaborador: "", funcao_id: "", funcao_nome: "", equipamento_avaliado: "", tempo_coleta: "", metodologia_utilizada: "", cod_gfip: "", aren_resultado: "", aren_unidade_id: "", aren_limite: "", aren_limite_unidade_id: "", vdvr_resultado: "", vdvr_unidade_id: "", vdvr_limite: "", vdvr_limite_unidade_id: "" }])}
                >
                  <Plus className="w-4 h-4" /> Adicionar Função
                </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setVibracaoModalOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    setRiskForm(prev => ({ ...prev, resultados_vibracao: tempVibracaoRows }));
                    setVibracaoModalOpen(false);
                    toast.success(`${tempVibracaoRows.length} resultado(s) salvo(s). Preencha o Parecer Técnico (Seção 7) para finalizar.`);
                    setTimeout(() => {
                      const el = document.getElementById("secao-7-parecer");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("ring-4", "ring-accent/60");
                        setTimeout(() => el.classList.remove("ring-4", "ring-accent/60"), 2000);
                      }
                    }, 200);
                  }}
                >
                  Salvar Resultados
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL NÍVEL 2: DADOS DA AMOSTRA DE VIBRAÇÃO                  */}
          {/* ============================================================ */}
          <Dialog open={vibracaoAmostraModalOpen} onOpenChange={setVibracaoAmostraModalOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg uppercase">
                  Dados da Amostra — {isAgentVCI(riskForm.agente_nome || "") ? "VCI" : "VMB"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* AREN */}
                <div className="space-y-3">
                  <h4 className="font-bold border-b pb-1">Medição: AREN</h4>
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado AREN</Label>
                      <Input type="number" step="0.01" className="mt-1" value={tempVibAmostra.aren_resultado || ""} onChange={e => setTempVibAmostra({ ...tempVibAmostra, aren_resultado: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</Label>
                      <Select value={tempVibAmostra.aren_unidade_id || ""} onValueChange={v => setTempVibAmostra({ ...tempVibAmostra, aren_unidade_id: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Unid." /></SelectTrigger>
                        <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limite (LT)</Label>
                      <Input type="number" step="0.01" className="mt-1" value={tempVibAmostra.aren_limite || ""} onChange={e => setTempVibAmostra({ ...tempVibAmostra, aren_limite: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unid. LT</Label>
                      <Select value={tempVibAmostra.aren_limite_unidade_id || ""} onValueChange={v => setTempVibAmostra({ ...tempVibAmostra, aren_limite_unidade_id: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Unid." /></SelectTrigger>
                        <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* VDVR (Apenas VCI) */}
                {isAgentVCI(riskForm.agente_nome || "") && (
                  <div className="space-y-3">
                    <h4 className="font-bold border-b pb-1">Medição: VDVR</h4>
                    <div className="grid grid-cols-4 gap-3 items-end">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado VDVR</Label>
                        <Input type="number" step="0.01" className="mt-1" value={tempVibAmostra.vdvr_resultado || ""} onChange={e => setTempVibAmostra({ ...tempVibAmostra, vdvr_resultado: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</Label>
                        <Select value={tempVibAmostra.vdvr_unidade_id || ""} onValueChange={v => setTempVibAmostra({ ...tempVibAmostra, vdvr_unidade_id: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Unid." /></SelectTrigger>
                          <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limite (LT)</Label>
                        <Input type="number" step="0.01" className="mt-1" value={tempVibAmostra.vdvr_limite || ""} onChange={e => setTempVibAmostra({ ...tempVibAmostra, vdvr_limite: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unid. LT</Label>
                        <Select value={tempVibAmostra.vdvr_limite_unidade_id || ""} onValueChange={v => setTempVibAmostra({ ...tempVibAmostra, vdvr_limite_unidade_id: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Unid." /></SelectTrigger>
                          <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setVibracaoAmostraModalOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    if (currentVibracaoIndex >= 0) {
                      const updated = [...tempVibracaoRows];
                      updated[currentVibracaoIndex] = { ...tempVibAmostra };
                      setTempVibracaoRows(updated);
                    }
                    setVibracaoAmostraModalOpen(false);
                  }}
                >
                  OK — Salvar Amostra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL NÍVEL 1: RESULTADO DE CALOR                            */}
          {/* ============================================================ */}
          <Dialog open={calorModalOpen} onOpenChange={setCalorModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl uppercase">Cadastro de Resultados — Calor</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {tempCalorRows.map((row, ri) => {
                  const expoNum = parseFloat(row.exposicao);
                  const ltNum = parseFloat(row.limite_tolerancia);
                  const hasBoth = !isNaN(expoNum) && !isNaN(ltNum) && ltNum > 0;
                  const situacao = hasBoth ? (expoNum > ltNum ? "Nocivo" : "Seguro") : "";
                  const updateField = (field: string, value: any) => {
                    const updated = [...tempCalorRows];
                    updated[ri] = { ...updated[ri], [field]: value };
                    // recalcula situação automaticamente
                    const e = parseFloat(updated[ri].exposicao);
                    const l = parseFloat(updated[ri].limite_tolerancia);
                    if (!isNaN(e) && !isNaN(l) && l > 0) {
                      updated[ri].situacao = e > l ? "Nocivo" : "Seguro";
                    } else {
                      updated[ri].situacao = "";
                    }
                    setTempCalorRows(updated);
                  };
                  return (
                  <div key={row.id} className="bg-muted/10 p-3 rounded-lg border border-border space-y-3">
                    {/* Linha 1: Data + Colaborador + Função + remover */}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data Avaliação</Label>
                        <Input
                          type="date" className="mt-1 h-8 text-sm"
                          value={row.data_avaliacao || ""}
                          onChange={e => updateField("data_avaliacao", e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Colaborador</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Nome" value={row.colaborador}
                          onChange={e => updateField("colaborador", e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Função Avaliada</Label>
                        <Select
                          value={row.funcao_id}
                          onValueChange={v => {
                            const fn = funcoes.find((f: any) => f.id === v);
                            const updated = [...tempCalorRows];
                            updated[ri] = { ...updated[ri], funcao_id: v, funcao_nome: fn?.nome_funcao || "" };
                            setTempCalorRows(updated);
                          }}
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {funcoesBySetor(currentRiskSetor?.id).map((f: any) => (
                              <SelectItem key={f.id} value={f.id}>{f.nome_funcao}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {ri > 0 && (
                          <Button
                            variant="ghost" size="icon" className="text-destructive h-8 w-8"
                            onClick={() => setTempCalorRows(tempCalorRows.filter((_, i) => i !== ri))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Linha 2: Tipo de atividade + Taxa metabólica */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tipo de Atividade</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex.: Trabalho moderado em pé"
                          value={row.tipo_atividade || ""}
                          onChange={e => updateField("tipo_atividade", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Metabólica</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex.: 220 W"
                          value={row.taxa_metabolica || ""}
                          onChange={e => updateField("taxa_metabolica", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Linha 3: Exposição + Unidade + LT + Unidade */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exposição</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex.: 28.5"
                          value={row.exposicao || ""}
                          onChange={e => updateField("exposicao", e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Un. Exposição</Label>
                        <Select
                          value={row.unidade_exposicao_id || ""}
                          onValueChange={v => updateField("unidade_exposicao_id", v)}
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Un." /></SelectTrigger>
                          <SelectContent>
                            {unidades.map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Limite Tolerância</Label>
                        <Input
                          className="mt-1 h-8 text-sm" placeholder="Ex.: 26.7"
                          value={row.limite_tolerancia || ""}
                          onChange={e => updateField("limite_tolerancia", e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Un. Limite</Label>
                        <Select
                          value={row.unidade_limite_id || ""}
                          onValueChange={v => updateField("unidade_limite_id", v)}
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Un." /></SelectTrigger>
                          <SelectContent>
                            {unidades.map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Linha 4: Situação (auto) + Cód GFIP */}
                    <div className="grid grid-cols-2 gap-2 items-end">
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Situação (automática)</Label>
                        <div
                          className={`mt-1 h-8 rounded-md border px-3 text-sm flex items-center font-semibold ${
                            situacao === "Nocivo"
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : situacao === "Seguro"
                              ? "bg-success/10 border-success/30 text-success"
                              : "bg-muted/30 border-border text-muted-foreground"
                          }`}
                        >
                          {situacao || "—"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cód. GFIP</Label>
                        <Select
                          value={row.cod_gfip || ""}
                          onValueChange={v => updateField("cod_gfip", v)}
                        >
                          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="01">01</SelectItem>
                            <SelectItem value="02">02</SelectItem>
                            <SelectItem value="03">03</SelectItem>
                            <SelectItem value="04">04</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Botão Amostra (equipamentos) */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-accent border-accent/20 hover:bg-accent/5 h-8"
                        onClick={() => {
                          setCurrentCalorIndex(ri);
                          setTempCalorAmostra({ ...row });
                          setCalorAmostraModalOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4" /> Amostra / Equipamentos
                      </Button>
                    </div>
                  </div>
                  );
                })}

                <Button
                  variant="outline" size="sm" className="gap-2 text-accent border-accent/20 hover:bg-accent/5"
                  onClick={() => setTempCalorRows([...tempCalorRows, {
                    id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "",
                    data_avaliacao: "", tipo_atividade: "", taxa_metabolica: "",
                    exposicao: "", unidade_exposicao_id: "",
                    limite_tolerancia: "", unidade_limite_id: "",
                    situacao: "", cod_gfip: "",
                  }])}
                >
                  <Plus className="w-4 h-4" /> Adicionar Função
                </Button>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setCalorModalOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    setRiskForm(prev => ({ ...prev, resultados_calor: tempCalorRows }));
                    setCalorModalOpen(false);
                    toast.success(`${tempCalorRows.length} resultado(s) salvo(s). Preencha o Parecer Técnico (Seção 7) para finalizar.`);
                    setTimeout(() => {
                      const el = document.getElementById("secao-7-parecer");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("ring-4", "ring-accent/60");
                        setTimeout(() => el.classList.remove("ring-4", "ring-accent/60"), 2000);
                      }
                    }, 200);
                  }}
                >
                  Salvar Resultados
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL: EXCLUSÃO SELETIVA DE ITENS (FUNÇÃO/COLAB)             */}
          {/* ============================================================ */}
          <Dialog open={deleteItemsModalOpen} onOpenChange={setDeleteItemsModalOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-background flex flex-col">
                <div className="p-6 border-b bg-destructive/5">
                  <DialogTitle className="text-xl font-heading font-black uppercase text-destructive tracking-tight">Exclusão Seletiva</DialogTitle>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Selecione quais funções/colaboradores remover do risco {riskToDeleteItems?.agente_nome}</p>
                </div>

                <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                  {riskToDeleteItems?.items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${selectedItemsToDelete.includes(item.id) ? "border-destructive bg-destructive/5 shadow-inner" : "border-border hover:border-accent/40"}`}
                      onClick={() => {
                        setSelectedItemsToDelete(prev =>
                          prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        )
                      }}
                    >
                      <div>
                        <p className="font-bold uppercase text-foreground text-sm">{item.funcao_nome}</p>
                        <p className="text-xs text-muted-foreground">{item.colaborador}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedItemsToDelete.includes(item.id) ? "border-destructive bg-destructive text-white" : "border-muted"}`}>
                        {selectedItemsToDelete.includes(item.id) && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-muted/20 border-t flex gap-3">
                  <Button variant="ghost" onClick={() => setDeleteItemsModalOpen(false)} className="flex-1 font-bold uppercase tracking-widest text-[10px]">Cancelar</Button>
                  <Button
                    onClick={handleConfirmSelectiveDelete}
                    disabled={selectedItemsToDelete.length === 0}
                    className="flex-2 bg-destructive text-destructive-foreground hover:bg-black font-black uppercase tracking-widest text-[10px] px-8"
                  >
                    Confirmar Exclusão ({selectedItemsToDelete.length})
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ============================================================ */}
          {/* MODAL: ERRO INTELIGENTE DE DOCUMENTO                         */}
          {/* ============================================================ */}
          <Dialog open={smartErrorModalOpen} onOpenChange={setSmartErrorModalOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl font-bold text-destructive flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Erro ao preparar documento
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Foram encontrados problemas que precisam ser corrigidos antes de gerar o documento.
              </p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
                {smartErrors.map((err, i) => (
                  <div key={i} className={`rounded-lg p-4 border text-left ${err.severidade === "erro" ? "bg-destructive/5 border-destructive/30" : "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold rounded px-2 py-0.5 shrink-0 ${err.severidade === "erro" ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-white"}`}>
                        {err.severidade === "erro" ? "❌ ERRO" : "⚠️ AVISO"}
                      </span>
                      <div className="space-y-1.5 text-sm min-w-0">
                        <p className="font-semibold text-foreground">{err.mensagem}</p>
                        <p className="text-muted-foreground">{err.explicacao}</p>
                        <p className="text-accent font-medium">✏️ <span className="font-semibold">Solução:</span> {err.correcao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSmartErrorModalOpen(false)}
                  className="gap-2"
                >
                  Entendi, corrigir template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
