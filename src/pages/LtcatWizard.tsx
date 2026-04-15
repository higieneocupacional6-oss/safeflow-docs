import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, FileDown, Loader2, FileText, Settings, Copy } from "lucide-react";
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
  const [step, setStep] = useState(0);
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

  // Parecer Técnico Modal State
  const [parecerModalOpen, setParecerModalOpen] = useState(false);
  const [currentParecerTarget, setCurrentParecerTarget] = useState<{
    riskId: string;
    resultId?: string;
    colaborador: string;
    funcao_nome: string;
    agente_nome: string;
    results_display: React.ReactNode;
  } | null>(null);
  const [tempParecer, setTempParecer] = useState("");
  const [tempAposentadoria, setTempAposentadoria] = useState("");

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
  const [responsavel, setResponsavel] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElab, setDataElab] = useState("");

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
    };

    try {
      if (editingRiskId) {
        setRiscos(prev => prev.map(r => r.id === editingRiskId ? newRisk : r));
      } else {
        setRiscos((prev) => [...prev, newRisk]);
      }
      toast.success("Risco avaliado com sucesso!");
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

  const openParecerModal = (risk: RiscoEntry, result: any, display: React.ReactNode) => {
    setCurrentParecerTarget({
      riskId: risk.id,
      resultId: result?.id,
      colaborador: result?.colaborador || "Geral",
      funcao_nome: result?.funcao_nome || risk.setor_nome,
      agente_nome: risk.agente_nome,
      results_display: display
    });
    setTempParecer(result?.parecer_tecnico || risk.parecer_tecnico || "");
    setTempAposentadoria(result?.aposentadoria_especial || risk.aposentadoria_especial || "");
    setParecerModalOpen(true);
  };

  const handleSaveParecer = async () => {
    if (!currentParecerTarget) return;

    const { riskId, resultId } = currentParecerTarget;
    const riskObj = riscos.find(r => r.id === riskId);
    if (!riskObj) return;

    // Resolve the actual Funcao UUID. 
    // If it's a specific result, try to find it there, otherwise fallback to the item itself.
    let resolvedFuncaoId = "";
    if (resultId) {
       const row = riskObj.resultados_calor?.find(x => x.id === resultId) || 
                   riskObj.resultados_vibracao?.find(x => x.id === resultId) ||
                   riskObj.resultados_componentes?.find(x => x.id === resultId) ||
                   riskObj.resultados_detalhados?.find(x => x.id === resultId);
       
       resolvedFuncaoId = row?.funcao_id || riskObj.items.find(i => i.id === resultId)?.funcao_id || "";
    } else {
       // Global fallback (unlikely in the current vertical line UI)
       resolvedFuncaoId = riskObj.items[0]?.funcao_id || "";
    }

    if (!resolvedFuncaoId) {
      toast.error("Erro: Função não identificada para este parecer.");
      return;
    }

    // Local Update
    setRiscos(prev => prev.map(r => {
      if (r.id === riskId) {
        if (!resultId) {
          return { ...r, parecer_tecnico: tempParecer, aposentadoria_especial: tempAposentadoria };
        }
        const updatedRisk = { ...r };
        const updateRow = (row: any) => row.id === resultId ? { ...row, parecer_tecnico: tempParecer, aposentadoria_especial: tempAposentadoria } : row;
        
        if (updatedRisk.resultados_calor) updatedRisk.resultados_calor = updatedRisk.resultados_calor.map(updateRow);
        if (updatedRisk.resultados_vibracao) updatedRisk.resultados_vibracao = updatedRisk.resultados_vibracao.map(updateRow);
        if (updatedRisk.resultados_componentes) updatedRisk.resultados_componentes = updatedRisk.resultados_componentes.map(updateRow);
        if (updatedRisk.resultados_detalhados) updatedRisk.resultados_detalhados = updatedRisk.resultados_detalhados.map(updateRow);
        
        return updatedRisk;
      }
      return r;
    }));

    // DB Upsert
    try {
      const { error } = await supabase
        .from("ltcat_pareceres")
        .upsert({
          empresa_id: empresaId,
          setor_id: riskObj.setor_id,
          funcao_id: resolvedFuncaoId,
          agente_id: riskObj.agente_id,
          colaborador_nome: currentParecerTarget.colaborador,
          parecer_tecnico: tempParecer,
          aposentadoria_especial: tempAposentadoria
        }, { 
          onConflict: 'empresa_id,setor_id,funcao_id,agente_id,colaborador_nome' 
        });
      
      if (error) throw error;

      toast.success("Parecer Técnico registrado com sucesso!");
      setParecerModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao persistir parecer no banco de dados.");
    }
  };

  const handleReplicateParecer = async () => {
    if (!currentParecerTarget || !tempParecer) return;
    
    const { riskId } = currentParecerTarget;
    const riskObj = riscos.find(r => r.id === riskId);
    if (!riskObj) return;

    toast.loading("Replicando parecer para todos os colaboradores...");

    // Update locally
    setRiscos(prev => prev.map(r => {
      if (r.id === riskId) {
        const updateAll = (row: any) => ({ ...row, parecer_tecnico: tempParecer, aposentadoria_especial: tempAposentadoria });
        return {
          ...r,
          parecer_tecnico: tempParecer,
          aposentadoria_especial: tempAposentadoria,
          resultados_calor: r.resultados_calor?.map(updateAll),
          resultados_vibracao: r.resultados_vibracao?.map(updateAll),
          resultados_componentes: r.resultados_componentes?.map(updateAll),
          resultados_detalhados: r.resultados_detalhados?.map(updateAll),
        };
      }
      return r;
    }));

    // Persist all to DB
    try {
      const entriesForAgent = riscos.filter(r => r.agente_id === riskObj.agente_id && r.setor_id === riskObj.setor_id);
      
      for (const entry of entriesForAgent) {
        for (const item of entry.items) {
          await supabase.from("ltcat_pareceres").upsert({
            empresa_id: empresaId,
            setor_id: entry.setor_id,
            funcao_id: item.funcao_id,
            agente_id: entry.agente_id,
            colaborador_nome: item.colaborador,
            parecer_tecnico: tempParecer,
            aposentadoria_especial: tempAposentadoria
          }, { 
            onConflict: 'empresa_id,setor_id,funcao_id,agente_id,colaborador_nome' 
          });
        }
      }
      
      toast.dismiss();
      toast.success("Parecer replicado com sucesso!");
      setParecerModalOpen(false);
    } catch (err) {
      toast.dismiss();
      toast.error("Erro ao replicar pareceres.");
    }
  };


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
      : [{ id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", equipamento_avaliado: "", aren_resultado: "", aren_unidade_id: "", aren_limite: "", aren_limite_unidade_id: "", vdvr_resultado: "", vdvr_unidade_id: "", vdvr_limite: "", vdvr_limite_unidade_id: "" }];
    setTempVibracaoRows(initial);
    setVibracaoModalOpen(true);
  };

  const openCalorModal = () => {
    const initial = riskForm.resultados_calor?.length
      ? riskForm.resultados_calor
      : [{ id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", local_avaliado: "", atividade_avaliada: "", taxa_metabolica: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }];
    setTempCalorRows(initial);
    setCalorModalOpen(true);
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }

    setGenerating(true);
    try {
      const template = templates.find((t: any) => t.id === selectedTemplate);
      if (!template) throw new Error("Template não encontrado");

      // Download template file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("templates")
        .download(template.file_path);
      if (downloadError) throw downloadError;

      const arrayBuffer = await fileData.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
      });

      // 1. Group by Sector
      const activeSectors = Array.from(new Set(riscos.map(r => r.setor_id)));
      const empresa = empresas.find((e: any) => e.id === empresaId);

      const setoresData = activeSectors.map(sId => {
        const sectorRisks = riscos.filter(r => r.setor_id === sId);
        const sector = setores.find(s => s.id === sId);
        
        // 2. Group by Agent within Sector
        const uniqueAgents = Array.from(new Set(sectorRisks.map(r => r.agente_id)));
        
        const riscosLoop = uniqueAgents.map(aId => {
          const agentEntries = sectorRisks.filter(r => r.agente_id === aId);
          const first = agentEntries[0];
          
          // 3. Evaluations (avaliacoes)
          const avaliacoes = agentEntries.flatMap(r => {
             const base = {
               agente: r.agente_nome,
               tipo: r.tipo_agente
             };
             
             if (r.resultados_calor?.length) {
               return r.resultados_calor.map(rc => ({ 
                 ...base, 
                 colaborador: rc.colaborador, 
                 funcao: rc.funcao_nome, 
                 resultado: rc.resultado, 
                 unidade: unidades.find(u => u.id === rc.unidade_resultado_id)?.simbolo,
                 limite: rc.limite_tolerancia,
                 unidade_limite: unidades.find(u => u.id === rc.unidade_limite_id)?.simbolo,
                 parecer_tecnico: rc.parecer_tecnico, 
                 aposentadoria_especial: rc.aposentadoria_especial 
               }));
             } 
             if (r.resultados_vibracao?.length) {
               return r.resultados_vibracao.map(rv => ({ 
                 ...base, 
                 colaborador: rv.colaborador, 
                 funcao: rv.funcao_nome, 
                 resultado: rv.aren_resultado, 
                 unidade: unidades.find(u => u.id === rv.aren_unidade_id)?.simbolo,
                 limite: rv.aren_limite,
                 unidade_limite: unidades.find(u => u.id === rv.aren_limite_unidade_id)?.simbolo,
                 parecer_tecnico: rv.parecer_tecnico, 
                 aposentadoria_especial: rv.aposentadoria_especial 
               }));
             } 
             if (r.resultados_componentes?.length) {
               return r.resultados_componentes.map(rc => ({ 
                 ...base, 
                 colaborador: rc.colaborador, 
                 funcao: rc.funcao_nome, 
                 resultado: "Amostra Comp.", 
                 unidade: "",
                 limite: "",
                 unidade_limite: "",
                 parecer_tecnico: rc.parecer_tecnico, 
                 aposentadoria_especial: rc.aposentadoria_especial 
               }));
             } 
             if (r.resultados_detalhados?.length) {
               return r.resultados_detalhados.map(rd => ({ 
                 ...base, 
                 colaborador: rd.colaborador, 
                 funcao: rd.funcao_nome, 
                 resultado: rd.resultado, 
                 unidade: unidades.find(u => u.id === rd.unidade_resultado_id)?.simbolo,
                 limite: rd.limite_tolerancia,
                 unidade_limite: unidades.find(u => u.id === rd.unidade_limite_id)?.simbolo,
                 parecer_tecnico: rd.parecer_tecnico, 
                 aposentadoria_especial: rd.aposentadoria_especial 
               }));
             } 
             
             // Fallback to basic items if no quantitative results
             return r.items.map(item => ({ 
               ...base, 
               colaborador: item.colaborador, 
               funcao: item.funcao_nome, 
               resultado: r.resultado, 
               unidade: unidades.find(u => u.id === r.unidade_resultado_id)?.simbolo,
               limite: r.limite_tolerancia,
               unidade_limite: unidades.find(u => u.id === r.unidade_limite_id)?.simbolo,
               parecer_tecnico: r.parecer_tecnico, 
               aposentadoria_especial: r.aposentadoria_especial 
             }));
          });

          // 4. EPIs and EPCs (collect unique ones)
          const episIds = Array.from(new Set(agentEntries.map(r => r.epi_id).filter(Boolean)));
          const epis = episIds.map(id => {
            const e = epiEpcCatalog.find(item => item.id === id);
            const entryWithDetails = agentEntries.find(r => r.epi_id === id);
            return {
              nome: e?.nome || "EPI",
              ca: entryWithDetails?.epi_ca || "",
              atenuacao: entryWithDetails?.epi_atenuacao || "",
              eficaz: entryWithDetails?.epi_eficaz || ""
            };
          });

          const epcsIds = Array.from(new Set(agentEntries.map(r => r.epc_id).filter(Boolean)));
          const epcs = epcsIds.map(id => {
            const e = epiEpcCatalog.find(item => item.id === id);
            const entryWithDetails = agentEntries.find(r => r.epc_id === id);
            return {
              nome: e?.nome || "EPC",
              eficaz: entryWithDetails?.epc_eficaz || ""
            };
          });

          return {
            agente_nome: first.agente_nome,
            tipo_agente: first.tipo_agente,
            tipo_avaliacao: first.tipo_avaliacao,
            descricao_tecnica: first.descricao_tecnica,
            propagacao: first.propagacao,
            tipo_exposicao: first.tipo_exposicao,
            fonte_geradora: first.fonte_geradora,
            danos_saude: first.danos_saude,
            medidas_controle: first.medidas_controle,
            tecnica: tecnicas.find(t => t.id === first.tecnica_id)?.nome || "",
            equipamento: equipamentos.find(e => e.id === first.equipamento_id)?.nome || "",
            esocial_codigo: first.codigo_esocial,
            esocial_desc: first.descricao_esocial,
            avaliacoes,
            epis,
            epcs
          };
        });

        return {
          nome_setor: sector?.nome_setor || "Setor",
          ghe_ges: sector?.ghe_ges || "",
          riscos: riscosLoop
        };
      });

      const templateData = {
        empresa: empresa?.razao_social || empresa?.nome_fantasia || "",
        cnpj: empresa?.cnpj || "",
        endereco: empresa?.endereco || "",
        cnae: empresa?.cnae_principal || "",
        responsavel,
        crea,
        cargo,
        data: dataElab ? new Date(dataElab).toLocaleDateString("pt-BR") : "",
        setores: setoresData
      };


      doc.render(templateData);

      const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const year = new Date().getFullYear();
      saveAs(output, `LTCAT_${year}.docx`);
      toast.success("Documento gerado com sucesso!");
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i < step ? "bg-success text-success-foreground" : i === step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
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
                                          size="sm" variant="outline" className={`h-8 gap-2 text-[10px] font-black uppercase tracking-widest px-4 transition-all rounded-xl ${itemParecer ? "border-success/40 bg-success/5 text-success hover:bg-success hover:text-white" : "border-accent/40 bg-accent/5 text-accent hover:bg-accent hover:text-white"}`}
                                          onClick={() => {
                                             const entry = res?.entry || firstEntry;
                                             const data = res?.data || null;
                                             const display = (
                                                <div className="text-[10px] font-mono bg-muted/40 p-4 rounded-xl border border-border/50 space-y-2">
                                                   <div className="border-b border-border/50 pb-1 flex justify-between items-center">
                                                      <p className="text-accent font-bold opacity-60">CONTEXTO DE CAMPO</p>
                                                      <Badge variant="outline" className="text-[8px] border-accent/20 text-accent uppercase">{entry.agente_nome}</Badge>
                                                   </div>
                                                   <p className="text-foreground font-black uppercase text-xs">{item.funcao_nome}</p>
                                                   <p className="text-muted-foreground uppercase opacity-80">COLABORADOR: {item.colaborador}</p>
                                                   
                                                   {/* Quantitative Results Preview */}
                                                   {res && (
                                                      <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                                                         {res.type === 'calor' && (
                                                            <>
                                                               <p className="text-accent font-bold">IBUTG: {res.data.resultado} {unidades.find(u => u.id === res.data.unidade_resultado_id)?.simbolo}</p>
                                                               <p className="opacity-60 italic">Metabolismo: {res.data.taxa_metabolica || 'N/A'}</p>
                                                            </>
                                                         )}
                                                         {res.type === 'vibracao' && (
                                                            <>
                                                               <p className="text-accent font-bold">AREN: {res.data.aren_resultado} {unidades.find(u => u.id === res.data.aren_unidade_id)?.simbolo}</p>
                                                               {res.data.vdvr_resultado && <p className="text-accent font-bold">VDVR: {res.data.vdvr_resultado} {unidades.find(u => u.id === res.data.vdvr_unidade_id)?.simbolo}</p>}
                                                            </>
                                                         )}
                                                         {res.type === 'detalhado' && (
                                                            <>
                                                               <p className="text-accent font-bold">RESULTADO: {res.data.resultado} {unidades.find(u => u.id === res.data.unidade_resultado_id)?.simbolo}</p>
                                                               <p className="opacity-60 italic">Limite (LT): {res.data.limite_tolerancia || 'N/A'}</p>
                                                            </>
                                                         )}
                                                      </div>
                                                   )}
                                                </div>
                                             );
                                             openParecerModal(entry as RiscoEntry, data, display);
                                          }}
                                         >
                                           <FileText className="w-3.5 h-3.5" /> Parecer Técnico
                                         </Button>
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
        <div className="glass-card rounded-xl p-8 max-w-2xl text-center">
          <FileDown className="w-12 h-12 mx-auto text-accent mb-4" />
          <h2 className="font-heading text-xl font-bold mb-2">Gerar Documento LTCAT</h2>
          <p className="text-muted-foreground mb-6">Selecione o template e gere o documento final</p>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="max-w-xs mx-auto mb-4"><SelectValue placeholder="Selecione um template" /></SelectTrigger>
            <SelectContent>
              {templates.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleGenerateDocument}
            disabled={generating || !selectedTemplate}
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Gerar Documento
          </Button>
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
                  <div><Label>Código eSocial</Label><Input value={riskForm.codigo_esocial} onChange={e => setRiskForm({...riskForm, codigo_esocial: e.target.value})} className="mt-1" /></div>
                  <div><Label>Descrição eSocial</Label><Input value={riskForm.descricao_esocial} onChange={e => setRiskForm({...riskForm, descricao_esocial: e.target.value})} className="mt-1" /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Propagação</Label><Input value={riskForm.propagacao} onChange={e => setRiskForm({...riskForm, propagacao: e.target.value})} className="mt-1" /></div>
                  <div><Label>Tipo de Exposição</Label><Input value={riskForm.tipo_exposicao} onChange={e => setRiskForm({...riskForm, tipo_exposicao: e.target.value})} className="mt-1" /></div>
                </div>

                <div><Label>Fonte Geradora</Label><Input value={riskForm.fonte_geradora} onChange={e => setRiskForm({...riskForm, fonte_geradora: e.target.value})} className="mt-1" /></div>
                <div><Label>Danos à Saúde</Label><Input value={riskForm.danos_saude} onChange={e => setRiskForm({...riskForm, danos_saude: e.target.value})} className="mt-1" /></div>
                <div><Label>Medidas de Controle Existentes</Label><Input value={riskForm.medidas_controle} onChange={e => setRiskForm({...riskForm, medidas_controle: e.target.value})} className="mt-1" /></div>
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

                  {/* FÍSICO PADRÃO */}
                  {!isCompAgent && !isFisico && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resultado</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="0.01" value={riskForm.resultado} onChange={e => setRiskForm({...riskForm, resultado: e.target.value})} />
                          <Select value={riskForm.unidade_resultado_id} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_resultado_id: v })}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Unid." /></SelectTrigger>
                            <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Limite (LT)</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="0.01" value={riskForm.limite_tolerancia} onChange={e => setRiskForm({...riskForm, limite_tolerancia: e.target.value})} />
                          <Select value={riskForm.unidade_limite_id} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_limite_id: v })}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Unid." /></SelectTrigger>
                            <SelectContent>{unidades.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FÍSICO COM MÚLTIPLAS MEDIÇÕES */}
                  {!isCompAgent && isFisico && (
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

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setRiskDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSaveRisk()}>Salvar Risco</Button>
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
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
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
                  <div className="flex-1">
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
                      setTempComponentes(row.componentes?.length ? row.componentes : [{ id: crypto.randomUUID(), componente: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }]);
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
              onClick={() => setTempFuncaoRows([...tempFuncaoRows, { id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", componentes: [] }])}
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
                handleSaveRisk(undefined, tempFuncaoRows);
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
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-accent border-accent/20 hover:bg-accent/5 mt-2"
              onClick={() => setTempComponentes([...tempComponentes, { id: crypto.randomUUID(), componente: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }])}
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
            <div className="min-w-[800px] space-y-4">
              {tempResultados.map((res, index) => (
                 <div key={res.id} className="flex gap-3 items-end group animate-in fade-in slide-in-from-top-1 bg-muted/10 p-3 rounded-lg border">
                    <div className="flex-1">
                       <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Colaborador</Label>
                       <Input placeholder="Nome do colaborador" value={res.colaborador} onChange={e => {
                         const updated = [...tempResultados];
                         updated[index].colaborador = e.target.value;
                         setTempResultados(updated);
                       }} />
                    </div>
                    <div className="flex-1 max-w-[220px]">
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
                    <div className="w-[110px]">
                       <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Resultado</Label>
                       <Input type="number" placeholder="0.00" step="0.01" value={res.resultado} onChange={e => {
                         const updated = [...tempResultados];
                         updated[index].resultado = e.target.value;
                         setTempResultados(updated);
                       }} />
                    </div>
                    <div className="w-[100px]">
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
                    <div className="w-[110px]">
                       <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Limite (LT)</Label>
                       <Input type="number" placeholder="0.00" step="0.01" value={res.limite_tolerancia} onChange={e => {
                         const updated = [...tempResultados];
                         updated[index].limite_tolerancia = e.target.value;
                         setTempResultados(updated);
                       }} />
                    </div>
                    <div className="w-[100px]">
                       <Label className="text-xs mb-1.5 block text-muted-foreground uppercase tracking-wider font-semibold">Unidade</Label>
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
                    <div>
                       <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                         setTempResultados(tempResultados.filter((_, i) => i !== index));
                       }}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
              ))}
            </div>
            
            <Button variant="outline" size="sm" onClick={() => {
              setTempResultados([...tempResultados, { id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }]);
            }} className="mt-2 text-accent border-accent/20 hover:bg-accent/5">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Linha
            </Button>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
             <Button variant="outline" onClick={() => setResultsModalOpen(false)}>Cancelar</Button>
             <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => {
                handleSaveRisk(tempResultados);
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
              onClick={() => setTempVibracaoRows([...tempVibracaoRows, { id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", equipamento_avaliado: "", aren_resultado: "", aren_unidade_id: "", aren_limite: "", aren_limite_unidade_id: "", vdvr_resultado: "", vdvr_unidade_id: "", vdvr_limite: "", vdvr_limite_unidade_id: "" }])}
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
                handleSaveRisk(undefined, undefined, tempVibracaoRows);
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
            {tempCalorRows.map((row, ri) => (
              <div key={row.id} className="bg-muted/10 p-3 rounded-lg border border-border space-y-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-[2]">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Colaborador</Label>
                    <Input 
                      className="mt-1 h-8 text-sm" placeholder="Nome" value={row.colaborador}
                      onChange={e => {
                        const updated = [...tempCalorRows];
                        updated[ri].colaborador = e.target.value;
                        setTempCalorRows(updated);
                      }}
                    />
                  </div>
                  <div className="flex-[2]">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Função Avaliada</Label>
                    <Select
                      value={row.funcao_id}
                      onValueChange={v => {
                        const updated = [...tempCalorRows];
                        updated[ri].funcao_id = v;
                        const fn = funcoes.find((f: any) => f.id === v);
                        updated[ri].funcao_nome = fn?.nome_funcao || "";
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-accent border-accent/20 hover:bg-accent/5 shrink-0 h-8"
                    onClick={() => {
                      setCurrentCalorIndex(ri);
                      setTempCalorAmostra({ ...row });
                      setCalorAmostraModalOpen(true);
                    }}
                  >
                    <FileText className="w-4 h-4" /> Amostra
                  </Button>
                  {ri > 0 && (
                    <Button
                      variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8"
                      onClick={() => setTempCalorRows(tempCalorRows.filter((_, i) => i !== ri))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Preview Calor */}
                {(row.resultado) && (
                  <div className="pl-3 border-l-2 border-accent/30 space-y-0.5">
                    <p className="text-2xl font-bold uppercase tracking-wider text-foreground mb-1">{currentRiskSetor?.nome_setor}</p>
                    <p className="text-base font-bold uppercase tracking-wider text-muted-foreground mb-1">{row.funcao_nome || "Função"}</p>
                    
                    <div className="text-sm mt-1">
                      <span className="font-medium">Res:</span>{" "}
                      <span className="font-mono">{row.resultado} {unidades.find((u: any) => u.id === row.unidade_resultado_id)?.simbolo}</span>
                    </div>
                    {row.limite_tolerancia && (
                      <div className="text-sm">
                        <span className="font-medium">LT:</span>{" "}
                        <span className="font-mono">{row.limite_tolerancia} {unidades.find((u: any) => u.id === row.unidade_limite_id)?.simbolo}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <Button
              variant="outline" size="sm" className="gap-2 text-accent border-accent/20 hover:bg-accent/5"
              onClick={() => setTempCalorRows([...tempCalorRows, { id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", local_avaliado: "", atividade_avaliada: "", taxa_metabolica: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }])}
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
                handleSaveRisk(undefined, undefined, undefined, tempCalorRows);
              }}
            >
              Salvar Resultados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL: PARECER TÉCNICO E APOSENTADORIA ESPECIAL              */}
      {/* ============================================================ */}
      <Dialog open={parecerModalOpen} onOpenChange={setParecerModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none bg-transparent shadow-2xl">
          <div className="glass-card !bg-background w-full rounded-2xl overflow-hidden flex flex-col border border-border/50">
            <DialogHeader className="p-6 bg-accent/[0.03] border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-xl font-black uppercase tracking-tight">Parecer Técnico</DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Conclusão Técnica das Condições Ambientais</p>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-8 space-y-8">
              {/* SEÇÃO 1: VISUALIZAÇÃO DOS DADOS */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Dados de Diagnóstico
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <Label className="text-[9px] font-black uppercase tracking-wider opacity-50 block mb-1">Colaborador Avaliado</Label>
                      <p className="text-sm font-bold text-foreground truncate uppercase">{currentParecerTarget?.colaborador}</p>
                   </div>
                   <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <Label className="text-[9px] font-black uppercase tracking-wider opacity-50 block mb-1">Função / Setor</Label>
                      <p className="text-sm font-bold text-foreground truncate uppercase">{currentParecerTarget?.funcao_nome}</p>
                   </div>
                </div>
                {currentParecerTarget?.results_display}
              </div>

              {/* SEÇÃO 2: DESCRIÇÃO DO PARECER TÉCNICO */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      Parecer do Engenheiro
                    </h4>
                    <div className="flex gap-2">
                       <Button 
                         variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/10"
                         onClick={() => {
                           const currentRiskObj = riscos.find(r => r.id === currentParecerTarget?.riskId);
                           if (!currentRiskObj) return;
                           
                           // Compare using the Agente (Risk Categorization) UUID, not the entry ID
                           const similar = cachedPareceres.find(p => p.agente_id === currentRiskObj.agente_id && p.parecer_tecnico);
                           if (similar) {
                             setTempParecer(similar.parecer_tecnico || "");
                             setTempAposentadoria(similar.aposentadoria_especial || "");
                             toast.success("Parecer histórico recuperado!");
                           } else {
                             toast.info("Nenhum parecer técnico prévio encontrado para este agente.");
                           }
                         }}
                       >
                         <Copy className="w-3 h-3" /> Histórico
                       </Button>
                       <Button 
                         variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success hover:bg-success/10"
                         onClick={handleReplicateParecer}
                       >
                         <Check className="w-3 h-3" /> Replicar para todos
                       </Button>
                    </div>
                 </div>
                 <div className="relative group">
                   <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                   <Textarea 
                      placeholder="Descreva aqui sua conclusão técnica detalhada sobre a exposição..."
                      className="min-h-[160px] relative bg-background/50 border-border/50 focus:border-accent/40 rounded-2xl p-5 text-sm leading-relaxed"
                      value={tempParecer}
                      onChange={(e) => setTempParecer(e.target.value)}
                   />
                 </div>
              </div>

              {/* SEÇÃO 3: APOSENTADORIA ESPECIAL */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Conclusão Previdenciária
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                   <Label className="text-sm font-bold text-foreground">Ensejador de Aposentadoria Especial?</Label>
                   <Select value={tempAposentadoria} onValueChange={setTempAposentadoria}>
                      <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-11 font-medium">
                        <SelectValue placeholder="Selecione a conclusão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim, Caracterizado" className="font-medium text-destructive">Sim, Caracterizado</SelectItem>
                        <SelectItem value="Não Caracterizado" className="font-medium text-success">Não Caracterizado</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-accent/[0.03] border-t border-border/50">
               <Button variant="ghost" onClick={() => setParecerModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Descartar</Button>
               <Button 
                onClick={handleSaveParecer}
                className="bg-accent text-accent-foreground hover:bg-black rounded-xl px-10 font-black uppercase tracking-widest text-[10px] h-11 shadow-lg shadow-accent/20"
               >
                 Salvar Parecer
               </Button>
            </DialogFooter>
          </div>
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
    </div>
  );
}
