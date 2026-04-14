import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, FileDown, Loader2, FileText } from "lucide-react";
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
  resultados_detalhados?: {
    id: string;
    colaborador: string;
    funcao_id: string;
    funcao_nome: string;
    resultado: string;
    unidade_resultado_id: string;
    limite_tolerancia: string;
    unidade_limite_id: string;
  }[];
  resultados_componentes?: {
    id: string;
    colaborador: string;
    funcao_id: string;
    funcao_nome: string;
    componentes: {
      id: string;
      componente: string;
      resultado: string;
      unidade_resultado_id: string;
      limite_tolerancia: string;
      unidade_limite_id: string;
    }[];
  }[];
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
  const [generating, setGenerating] = useState(false);

  // Step 1
  const [empresaId, setEmpresaId] = useState("");
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
  });


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

  const openRiskModal = (setor: any) => {
    setCurrentRiskSetor(setor);
    setRiskForm({
      ...riskForm,
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
    });
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

  const handleSaveRisk = async (inlineResults?: any[], inlineComponentes?: any[]) => {
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

    if (isComponentes) {
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

    const newRisk: RiscoEntry = {
      id: Date.now().toString(),
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
    };

    try {
      setRiscos((prev) => [...prev, newRisk]);
      toast.success("Risco avaliado com sucesso!");
      setRiskDialogOpen(false);
      setResultsModalOpen(false);
      setComponentesModalOpen(false);
      setStep(2); 
    } catch (err) {
      toast.error("Erro ao salvar avaliação");
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

      // Build template data from wizard state
      const templateData: Record<string, string> = {
        empresa: empresa?.razao_social || empresa?.nome_fantasia || "",
        cnpj: empresa?.cnpj || "",
        endereco: empresa?.endereco || "",
        cnae: empresa?.cnae || "",
        responsavel,
        crea,
        cargo,
        data: dataElab ? new Date(dataElab).toLocaleDateString("pt-BR") : "",
        setor: funcoes.length > 0 ? funcoes[0].nome_setor || "Vários Setores" : "", // Temporary fallback
        funcao: funcoes.map((f: any) => f.nome_funcao).join(", ") || "",
      };

      // Add first risk data as simple variables
      if (riscos.length > 0) {
        const r = riscos[0];
        templateData.agente_nome = r.agente_nome || "";
        templateData.tipo_agente = r.tipo_agente || "";
        templateData.tipo_avaliacao = r.tipo_avaliacao || "";
        templateData.descricao_tecnica = r.descricao_tecnica || "";
        templateData.resultado = r.resultado || "";
        templateData.unidade = r.unidade_resultado_id || "";
        templateData.limite_tolerancia = r.limite_tolerancia || "";
      }

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

      {/* Step 3: Listagem */}
      {step === 2 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setor</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riscos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum risco cadastrado</TableCell>
                </TableRow>
              ) : (
                riscos.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.setor_nome}</TableCell>
                    <TableCell>
                      {r.items.map((item, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-semibold">{item.funcao_nome}</span> ({item.colaborador})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="font-medium">{r.agente_nome}</TableCell>
                    <TableCell><Badge variant="outline">{r.tipo_agente}</Badge></TableCell>
                    <TableCell className="font-mono text-sm leading-tight">
                      {r.resultados_componentes && r.resultados_componentes.length > 0 ? (
                        r.resultados_componentes.map((row: any, ri: number) => (
                          <div key={ri} className="mb-2">
                            <div className="font-bold text-foreground text-xs uppercase tracking-wide">{row.funcao_nome || "Função"}</div>
                            {row.componentes?.map((c: any, ci: number) => (
                              <div key={ci} className="text-xs text-muted-foreground ml-2">• {c.componente}: {c.resultado} {unidades.find(u => u.id === c.unidade_resultado_id)?.simbolo} {c.limite_tolerancia && `(LT: ${c.limite_tolerancia} ${unidades.find(u => u.id === c.unidade_limite_id)?.simbolo})`}</div>
                            ))}
                          </div>
                        ))
                      ) : r.resultados_detalhados && r.resultados_detalhados.length > 0 ? (
                        r.resultados_detalhados.map((res: any, idx: number) => (
                          <div key={idx} className="mb-0.5 whitespace-nowrap">
                            {res.resultado} {unidades.find(u => u.id === res.unidade_resultado_id)?.simbolo} 
                            {res.limite_tolerancia && ` (LT: ${res.limite_tolerancia} ${unidades.find(u => u.id === res.unidade_limite_id)?.simbolo})`}
                          </div>
                        ))
                      ) : r.descricao_tecnica ? (
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]" title={r.descricao_tecnica}>
                          {r.descricao_tecnica}
                        </div>
                      ) : (
                        <>{r.resultado} {unidades.find(u => u.id === r.unidade_resultado_id)?.simbolo}</>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setRiscos((prev) => prev.filter((x) => x.id !== r.id))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">AVALIAÇÃO DE RISCO POR SETOR</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            {/* SEÇÃO 1: IDENTIFICAÇÃO */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 1: IDENTIFICAÇÃO</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Setor Avaliado</Label>
                  <Input value={currentRiskSetor?.nome_setor || ""} readOnly className="mt-1 bg-muted/30" />
                </div>
                
                <div className="space-y-3">
                  <Label>Colaborador e Função</Label>
                  {riskForm.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end group animate-in fade-in slide-in-from-top-1">
                      <div className="flex-1">
                        <Input 
                          placeholder="Nome do Colaborador" 
                          value={item.colaborador} 
                          onChange={(e) => updateItemBlock(index, "colaborador", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Select value={item.funcao_id} onValueChange={(v) => updateItemBlock(index, "funcao_id", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione a Função" /></SelectTrigger>
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
                          className="text-destructive h-10 w-10 shrink-0" 
                          onClick={() => {
                            const newItems = riskForm.items.filter((_, i) => i !== index);
                            setRiskForm({ ...riskForm, items: newItems });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addItemBlock} className="mt-1 text-accent border-accent/20 hover:bg-accent/5">
                    <Plus className="w-4 h-4 mr-2" />Adicionar Colaborador/Função
                  </Button>
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: CLASSIFICAÇÃO */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 2: CLASSIFICAÇÃO DA AVALIAÇÃO</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Avaliação</Label>
                  <Select value={riskForm.tipo_avaliacao} onValueChange={(v) => setRiskForm({ ...riskForm, tipo_avaliacao: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualitativa">Qualitativa</SelectItem>
                      <SelectItem value="quantitativa">Quantitativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Agente</Label>
                  <Input value={riskForm.tipo_agente} readOnly className="mt-1 bg-muted/30" placeholder="Auto-preenchido" />
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

            {/* SEÇÃO 5: RESULTADOS */}
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
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 5: RESULTADOS</h3>
                  </div>

                  {/* AGENTE COMPONENTES: Poeira, Fumos, Sílica, Vapores... */}
                  {isCompAgent && (
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="text-accent border-accent/20 hover:bg-accent/5 gap-2"
                        onClick={openComponentesModal}
                      >
                        <Plus className="w-4 h-4" /> + Resultado
                      </Button>
                      {riskForm.resultados_componentes && riskForm.resultados_componentes.length > 0 && (
                        <div className="space-y-2">
                          {riskForm.resultados_componentes.map((row: any, ri: number) => (
                            <div key={ri} className="p-3 border rounded-lg bg-muted/20">
                              <div className="font-bold text-sm">{row.funcao_nome || "Função"} — {row.colaborador}</div>
                              {row.componentes?.map((c: any, ci: number) => (
                                <div key={ci} className="text-xs text-muted-foreground ml-2">• {c.componente}: {c.resultado} {unidades.find(u => u.id === c.unidade_resultado_id)?.simbolo}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AGENTE FÍSICO padrão */}
                  {!isCompAgent && !isFisico && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resultado</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="0.01" value={riskForm.resultado} onChange={e => setRiskForm({...riskForm, resultado: e.target.value})} />
                          <Select value={riskForm.unidade_resultado_id} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_resultado_id: v })}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Unid." /></SelectTrigger>
                            <SelectContent>
                              {unidades.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Limite de Tolerância</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="0.01" value={riskForm.limite_tolerancia} onChange={e => setRiskForm({...riskForm, limite_tolerancia: e.target.value})} />
                          <Select value={riskForm.unidade_limite_id} onValueChange={(v) => setRiskForm({ ...riskForm, unidade_limite_id: v })}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Unid." /></SelectTrigger>
                            <SelectContent>
                              {unidades.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.simbolo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AGENTE FÍSICO com medições múltiplas */}
                  {!isCompAgent && isFisico && (
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="text-accent border-accent/20 hover:bg-accent/5 gap-2" 
                        onClick={() => {
                          setTempResultados(riskForm.resultados_detalhados?.length ? riskForm.resultados_detalhados : [{ id: crypto.randomUUID(), colaborador: "", funcao_id: "", funcao_nome: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }]);
                          setResultsModalOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4" /> + Resultados
                      </Button>
                      {riskForm.resultados_detalhados && riskForm.resultados_detalhados.length > 0 && (
                        <div className="text-sm text-foreground p-3 border rounded-lg bg-muted/20">
                          <strong>{riskForm.resultados_detalhados.length}</strong> resultado(s) cadastrado(s). Clique no botão acima para editar.
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
    </div>
  );
}
