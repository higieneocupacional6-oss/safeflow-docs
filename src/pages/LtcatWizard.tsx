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

const steps = ["Identificação", "Setores e Funções", "Riscos", "Listagem", "Gerar Documento"];

const mockEmpresas = [
  { id: "1", nome: "Alpha Construções", cnpj: "12.345.678/0001-90", endereco: "Rua das Palmeiras, 500 - São Paulo/SP", cnae: "41.20-4-00", setores: [
    { id: "s1", nome: "Produção", funcoes: [{ id: "f1", nome: "Operador de Máquinas" }, { id: "f2", nome: "Soldador" }] },
    { id: "s2", nome: "Administrativo", funcoes: [{ id: "f3", nome: "Auxiliar Administrativo" }] },
  ]},
  { id: "2", nome: "Beta Industrial", cnpj: "98.765.432/0001-10", endereco: "Av. Industrial, 1200 - Guarulhos/SP", cnae: "25.11-0-00", setores: [
    { id: "s3", nome: "Fundição", funcoes: [{ id: "f4", nome: "Fundidor" }, { id: "f5", nome: "Moldador" }] },
    { id: "s4", nome: "Manutenção", funcoes: [{ id: "f6", nome: "Mecânico" }] },
  ]},
];

interface RiscoEntry {
  id: string;
  setor: string;
  funcao: string;
  tipoAvaliacao: string;
  tipoAgente: string;
  agente: string;
  exposicao: string;
  resultado: string;
  unidade: string;
  lt: string;
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
  const [selectedSetor, setSelectedSetor] = useState("");
  const [selectedFuncoes, setSelectedFuncoes] = useState<string[]>([]);

  // Step 3
  const [riscos, setRiscos] = useState<RiscoEntry[]>([]);
  const [riskForm, setRiskForm] = useState({
    tipoAvaliacao: "", tipoAgente: "", agente: "", viaAbsorcao: "", exposicao: "",
    tecnica: "", equipamento: "", resultado: "", unidade: "", lt: "", ltUnidade: "",
  });

  // Step 5
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const empresa = mockEmpresas.find((e) => e.id === empresaId);
  const setor = empresa?.setores.find((s) => s.id === selectedSetor);

  const toggleFuncao = (fId: string) => {
    setSelectedFuncoes((prev) => prev.includes(fId) ? prev.filter((f) => f !== fId) : [...prev, fId]);
  };

  const handleSaveRisk = () => {
    if (!riskForm.agente || !riskForm.resultado) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const setorNome = setor?.nome || "";
    const funcaoNomes = setor?.funcoes.filter((f) => selectedFuncoes.includes(f.id)).map((f) => f.nome) || [];

    funcaoNomes.forEach((fn) => {
      setRiscos((prev) => [
        ...prev,
        {
          id: Date.now().toString() + fn,
          setor: setorNome, funcao: fn,
          tipoAvaliacao: riskForm.tipoAvaliacao, tipoAgente: riskForm.tipoAgente,
          agente: riskForm.agente, exposicao: riskForm.exposicao,
          resultado: riskForm.resultado, unidade: riskForm.unidade, lt: riskForm.lt,
        },
      ]);
    });

    setRiskDialogOpen(false);
    setRiskForm({ tipoAvaliacao: "", tipoAgente: "", agente: "", viaAbsorcao: "", exposicao: "", tecnica: "", equipamento: "", resultado: "", unidade: "", lt: "", ltUnidade: "" });
    toast.success("Risco cadastrado!");
  };

  const canAdvance = () => {
    if (step === 0) return !!empresaId && !!responsavel;
    if (step === 1) return !!selectedSetor && selectedFuncoes.length > 0;
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
        empresa: empresa?.nome || "",
        cnpj: empresa?.cnpj || "",
        endereco: empresa?.endereco || "",
        cnae: empresa?.cnae || "",
        responsavel,
        crea,
        cargo,
        data: dataElab ? new Date(dataElab).toLocaleDateString("pt-BR") : "",
        setor: setor?.nome || "",
        funcao: setor?.funcoes.filter((f) => selectedFuncoes.includes(f.id)).map((f) => f.nome).join(", ") || "",
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
            <Label>Empresa</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {mockEmpresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
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

      {/* Step 2: Setores e Funções */}
      {step === 1 && empresa && (
        <div className="glass-card rounded-xl p-6 max-w-2xl space-y-4">
          <div>
            <Label>Setor</Label>
            <Select value={selectedSetor} onValueChange={(v) => { setSelectedSetor(v); setSelectedFuncoes([]); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
              <SelectContent>
                {empresa.setores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {setor && (
            <div>
              <Label className="mb-2 block">Funções</Label>
              <div className="space-y-2">
                {setor.funcoes.map((f) => (
                  <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFuncoes.includes(f.id) ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"
                  }`}>
                    <input type="checkbox" checked={selectedFuncoes.includes(f.id)} onChange={() => toggleFuncao(f.id)} className="accent-[hsl(35,95%,55%)]" />
                    <span className="font-medium text-sm">{f.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2 → open risk dialog */}
      {step === 2 && (
        <div className="glass-card rounded-xl p-6 max-w-2xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Cadastre os riscos para as funções selecionadas</p>
            <Button onClick={() => setRiskDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />Adicionar Risco
            </Button>
          </div>
          {riscos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">{riscos.length} risco(s) cadastrado(s)</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Listagem */}
      {step === 3 && (
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
                    <TableCell>{r.setor}</TableCell>
                    <TableCell>{r.funcao}</TableCell>
                    <TableCell className="font-medium">{r.agente}</TableCell>
                    <TableCell><Badge variant="outline">{r.tipoAgente}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{r.resultado} {r.unidade}</TableCell>
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
      {step === 4 && (
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
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Cadastro de Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Avaliação</Label>
                <Select value={riskForm.tipoAvaliacao} onValueChange={(v) => setRiskForm({ ...riskForm, tipoAvaliacao: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualitativa">Qualitativa</SelectItem>
                    <SelectItem value="quantitativa">Quantitativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Agente</Label>
                <Select value={riskForm.tipoAgente} onValueChange={(v) => setRiskForm({ ...riskForm, tipoAgente: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Físico">Físico</SelectItem>
                    <SelectItem value="Químico">Químico</SelectItem>
                    <SelectItem value="Biológico">Biológico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Agente</Label>
              <Input className="mt-1" value={riskForm.agente} onChange={(e) => setRiskForm({ ...riskForm, agente: e.target.value })} placeholder="Ex: Ruído Contínuo, Poeira de Sílica..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Via de Absorção</Label>
                <Select value={riskForm.viaAbsorcao} onValueChange={(v) => setRiskForm({ ...riskForm, viaAbsorcao: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aerea">Aérea</SelectItem>
                    <SelectItem value="contato">Contato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Exposição</Label>
                <Select value={riskForm.exposicao} onValueChange={(v) => setRiskForm({ ...riskForm, exposicao: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habitual">Habitual</SelectItem>
                    <SelectItem value="intermitente">Intermitente</SelectItem>
                    <SelectItem value="eventual">Eventual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Técnica de Amostragem</Label>
                <Select value={riskForm.tecnica} onValueChange={(v) => setRiskForm({ ...riskForm, tecnica: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dosimetria">Dosimetria de Ruído</SelectItem>
                    <SelectItem value="gravimetria">Gravimetria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipamento</Label>
                <Select value={riskForm.equipamento} onValueChange={(v) => setRiskForm({ ...riskForm, equipamento: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dosimetro">Dosímetro DOS-500</SelectItem>
                    <SelectItem value="bomba">Bomba Gravimétrica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic fields */}
            {(() => {
              const fieldType = getAgentFields();
              if (fieldType === "vibracao_corpo") return (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>A(ren)</Label><Input className="mt-1" value={riskForm.resultado} onChange={(e) => setRiskForm({ ...riskForm, resultado: e.target.value })} /></div>
                  <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.unidade} onChange={(e) => setRiskForm({ ...riskForm, unidade: e.target.value })} placeholder="m/s²" /></div>
                  <div><Label>VDVR</Label><Input className="mt-1" value={riskForm.lt} onChange={(e) => setRiskForm({ ...riskForm, lt: e.target.value })} /></div>
                  <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.ltUnidade} onChange={(e) => setRiskForm({ ...riskForm, ltUnidade: e.target.value })} placeholder="m/s^1.75" /></div>
                </div>
              );
              if (fieldType === "vibracao_maos") return (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>A(ren)</Label><Input className="mt-1" value={riskForm.resultado} onChange={(e) => setRiskForm({ ...riskForm, resultado: e.target.value })} /></div>
                  <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.unidade} onChange={(e) => setRiskForm({ ...riskForm, unidade: e.target.value })} placeholder="m/s²" /></div>
                </div>
              );
              if (fieldType === "calor") return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Resultado</Label><Input className="mt-1" value={riskForm.resultado} onChange={(e) => setRiskForm({ ...riskForm, resultado: e.target.value })} /></div>
                    <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.unidade} onChange={(e) => setRiskForm({ ...riskForm, unidade: e.target.value })} placeholder="°C" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Limite de Tolerância</Label><Input className="mt-1" value={riskForm.lt} onChange={(e) => setRiskForm({ ...riskForm, lt: e.target.value })} /></div>
                    <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.ltUnidade} onChange={(e) => setRiskForm({ ...riskForm, ltUnidade: e.target.value })} placeholder="°C" /></div>
                  </div>
                  <div><Label>Taxa Metabólica</Label><Input className="mt-1" placeholder="kcal/h" /></div>
                </div>
              );
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Resultado</Label><Input className="mt-1" value={riskForm.resultado} onChange={(e) => setRiskForm({ ...riskForm, resultado: e.target.value })} /></div>
                  <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.unidade} onChange={(e) => setRiskForm({ ...riskForm, unidade: e.target.value })} placeholder="dB(A)" /></div>
                  <div><Label>Limite de Tolerância</Label><Input className="mt-1" value={riskForm.lt} onChange={(e) => setRiskForm({ ...riskForm, lt: e.target.value })} /></div>
                  <div><Label>Unidade</Label><Input className="mt-1" value={riskForm.ltUnidade} onChange={(e) => setRiskForm({ ...riskForm, ltUnidade: e.target.value })} /></div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRiskDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSaveRisk}>Salvar Risco</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
