import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, FileDown, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  tecnica_id: string;
  equipamento_id: string;
  resultado: string;
  unidade_resultado_id: string;
  limite_tolerancia: string;
  unidade_limite_id: string;
  resultados_detalhados?: {
    id: string;
    item_id: string;
    resultado: string;
    unidade_resultado_id: string;
    limite_tolerancia: string;
    unidade_limite_id: string;
  }[];
}

export default function LtcatWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
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

  const handleSaveRisk = async () => {
    if (!riskForm.agente_id) {
      toast.error("Selecione um agente");
      return;
    }
    
    if (riskForm.items.some(item => !item.colaborador || !item.funcao_id)) {
      toast.error("Preencha todos os colaboradores e funções");
      return;
    }

    const agent = catRiscos.find((r: any) => r.id === riskForm.agente_id);
    const isFisico = riskForm.tipo_agente?.toLowerCase() === "físico";
    const isRuido = agent?.nome?.toLowerCase().includes("ruído");
    const showCompleta = isFisico && isRuido;

    if (showCompleta) {
      if (riskForm.resultados_detalhados.length === 0) {
        toast.error("Adicione ao menos um resultado");
        return;
      }
      if (riskForm.resultados_detalhados.some(r => !r.item_id || !r.resultado || !r.unidade_resultado_id)) {
        toast.error("Preencha todos os campos obrigatórios nos resultados");
        return;
      }
    }
    const newRisk: RiscoEntry = {
      id: Date.now().toString(),
      setor_id: currentRiskSetor.id,
      setor_nome: currentRiskSetor.nome_setor,
      items: riskForm.items,
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
      tecnica_id: riskForm.tecnica_id,
      equipamento_id: riskForm.equipamento_id,
      resultado: riskForm.resultado,
      unidade_resultado_id: riskForm.unidade_resultado_id,
      limite_tolerancia: riskForm.limite_tolerancia,
      unidade_limite_id: riskForm.unidade_limite_id,
      resultados_detalhados: riskForm.resultados_detalhados,
    };

    // Persistence attempt (optional since user has to run SQL, but good to have)
    try {
      // In a real scenario, we would insert into public.ltcat_avaliacoes here
      // For now, we update local state for the listing
      setRiscos((prev) => [...prev, newRisk]);
      toast.success("Risco avaliado com sucesso!");
      setRiskDialogOpen(false);
      setStep(2); // Go to Listagem directly upon saving as requested ("PÓS-SALVAMENTO: Exibir a pagina da etapa 3 - Listagem")
    } catch (err) {
      toast.error("Erro ao salvar avaliação");
    }
  };


  const canAdvance = () => {
    if (step === 0) return !!empresaId;
    return true;
  };

  const getAgentFields = () => {
    const agent = riskForm.agente.toLowerCase();
    if (agent.includes("vibração") && agent.includes("corpo")) return "vibracao_corpo";
    if (agent.includes("vibração") && (agent.includes("mão") || agent.includes("braço"))) return "vibracao_maos";
    if (agent.includes("calor")) return "calor";
    if (agent.includes("poeira") || agent.includes("fumo") || agent.includes("vapor")) return "componentes";
    return "padrao";
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
        templateData.agente = r.agente;
        templateData.resultado = r.resultado;
        templateData.unidade = r.unidade;
        templateData.limite_tolerancia = r.lt;
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
                    <TableCell className="font-mono text-sm">
                      {r.resultado} {unidades.find(u => u.id === r.unidade_resultado_id)?.simbolo}
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
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 4: AVALIAÇÃO TÉCNICA</h3>
              </div>
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
            </section>

            {/* SEÇÃO 5: RESULTADOS */}
            {(() => {
              const isFisico = riskForm.tipo_agente?.toLowerCase() === "físico";
              const isRuido = riskForm.agente_nome?.toLowerCase().includes("ruído");
              const showCompleta = isFisico && isRuido;
              const showSimplificada = !showCompleta && riskForm.tipo_avaliacao === "quantitativa";

              if (!showCompleta && !showSimplificada) return null;

              return (
                <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <div className="bg-accent/10 p-1.5 rounded text-accent"><Check className="w-4 h-4" /></div>
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wider">SEÇÃO 5: RESULTADOS</h3>
                  </div>

                  {showSimplificada && (
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

                  {showCompleta && (
                    <div className="space-y-4">
                      {riskForm.resultados_detalhados.map((res, index) => (
                        <div key={res.id} className="p-4 border rounded-xl bg-muted/10 relative space-y-4 group">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label>Colaborador <span className="text-destructive">*</span></Label>
                              <Select value={res.item_id} onValueChange={(v) => {
                                const newRes = [...riskForm.resultados_detalhados];
                                newRes[index] = { ...newRes[index], item_id: v };
                                setRiskForm({ ...riskForm, resultados_detalhados: newRes });
                              }}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                                <SelectContent>
                                  {riskForm.items.map((it: any) => (
                                    <SelectItem key={it.id} value={it.id}>
                                      {it.colaborador ? `${it.colaborador} - ${it.funcao_nome}` : 'Colaborador não preenchido'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Resultado <span className="text-destructive">*</span></Label>
                                <div className="flex gap-2">
                                  <Input type="number" step="0.01" value={res.resultado} onChange={e => {
                                    const newRes = [...riskForm.resultados_detalhados];
                                    newRes[index] = { ...newRes[index], resultado: e.target.value };
                                    setRiskForm({ ...riskForm, resultados_detalhados: newRes });
                                  }} />
                                  <Select value={res.unidade_resultado_id} onValueChange={(v) => {
                                    const newRes = [...riskForm.resultados_detalhados];
                                    newRes[index] = { ...newRes[index], unidade_resultado_id: v };
                                    setRiskForm({ ...riskForm, resultados_detalhados: newRes });
                                  }}>
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
                                  <Input type="number" step="0.01" value={res.limite_tolerancia} onChange={e => {
                                    const newRes = [...riskForm.resultados_detalhados];
                                    newRes[index] = { ...newRes[index], limite_tolerancia: e.target.value };
                                    setRiskForm({ ...riskForm, resultados_detalhados: newRes });
                                  }} />
                                  <Select value={res.unidade_limite_id} onValueChange={(v) => {
                                     const newRes = [...riskForm.resultados_detalhados];
                                     newRes[index] = { ...newRes[index], unidade_limite_id: v };
                                     setRiskForm({ ...riskForm, resultados_detalhados: newRes });
                                  }}>
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
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => {
                              const newRes = riskForm.resultados_detalhados.filter((_, i) => i !== index);
                              setRiskForm({ ...riskForm, resultados_detalhados: newRes });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                         setRiskForm({
                            ...riskForm,
                            resultados_detalhados: [
                               ...riskForm.resultados_detalhados,
                               { id: crypto.randomUUID(), item_id: "", resultado: "", unidade_resultado_id: "", limite_tolerancia: "", unidade_limite_id: "" }
                            ]
                         })
                      }} className="text-accent border-accent/20 hover:bg-accent/5">
                        <Plus className="w-4 h-4 mr-2" />Adicionar Resultado para Colaborador
                      </Button>
                    </div>
                  )}
                </section>
              );
            })()}
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setRiskDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSaveRisk}>Salvar Risco</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
