import { useState, useEffect, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Save, ChevronRight, Building2, Pencil, Grid3x3, ShieldCheck, GraduationCap, Users, FileDown, FileCheck2, Link2 } from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { renderHtmlTemplateToDocx } from "@/lib/htmlTemplate";
import { calcularMatriz, PROBABILIDADE_LABELS, SEVERIDADE_LABELS, CELL_COLOR, type Nivel } from "@/lib/pgrMatriz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { sortByGes } from "@/lib/sortGes";
import PgrCronogramaStep from "@/components/PgrCronogramaStep";

type Revisao = { revisao: string; data: string; motivo: string; responsavel: string };

type RiscoPgr = {
  id: string;
  tipo_agente: string;
  tipo_avaliacao: string;
  agente_id: string;
  agente_nome: string;
  codigo_esocial: string;
  descricao_esocial: string;
  propagacao: string;
  tipo_exposicao: string;
  fonte_geradora: string;
  danos_saude: string;
  medidas_controle: string;
  probabilidade?: Nivel | null;
  severidade?: Nivel | null;
};

type PgrSetorData = { riscos: RiscoPgr[] };
type EpiItem = { id: string; epi_id: string; nome_epi: string; ca: string; uso: string };
type EpiBloco = { id: string; funcao_ids: string[]; epis: EpiItem[] };
type TreinItem = { id: string; nome_treinamento: string };
type TreinBloco = { id: string; funcao_ids: string[]; treinamentos: TreinItem[] };
type CronogramaItem = {
  id: string;
  item: string;
  acao: string;
  responsavel: string;
  prazo_mes: string; // "01".."12"
  prazo_ano: string; // "2026"
  situacao: "Previsto" | "Realizado" | "";
};
type PgrSnapshot = {
  setores: Record<string, PgrSetorData>;
  epi_blocos?: EpiBloco[];
  treinamento_blocos?: TreinBloco[];
  cronograma_pgr?: CronogramaItem[];
};

const emptyRevisao = (): Revisao => ({ revisao: "", data: "", motivo: "", responsavel: "" });
const emptyRisco = (): RiscoPgr => ({
  id: crypto.randomUUID(),
  tipo_agente: "",
  tipo_avaliacao: "",
  agente_id: "",
  agente_nome: "",
  codigo_esocial: "",
  descricao_esocial: "",
  propagacao: "",
  tipo_exposicao: "",
  fonte_geradora: "",
  danos_saude: "",
  medidas_controle: "",
  probabilidade: null,
  severidade: null,
});

const tipoAvaliacaoFromTipo = (tipo: string) => {
  const t = (tipo || "").toLowerCase();
  if (t.includes("biológic") || t.includes("biologic")) return "Qualitativa";
  if (t.includes("ergonômic") || t.includes("ergonomic") || t.includes("acidente") || t.includes("psicoss")) return "Qualitativa";
  if (t.includes("físic") || t.includes("fisic") || t.includes("químic") || t.includes("quimic")) return "Quantitativa";
  return "Qualitativa";
};

export default function PgrWizard() {
  const { documentoId } = useParams<{ documentoId?: string }>();
  const navigate = useNavigate();

  const [docId, setDocId] = useState<string | null>(documentoId || null);
  const [step, setStep] = useState(0);
  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataElaboracao, setDataElaboracao] = useState("");
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [snapshot, setSnapshot] = useState<PgrSnapshot>({ setores: {} });
  const [activeSetor, setActiveSetor] = useState<{ id: string; nome_setor: string } | null>(null);
  const [sectorView, setSectorView] = useState<"riscos" | "matriz">("riscos");

  const [loading, setLoading] = useState(!!documentoId);
  const [saving, setSaving] = useState(false);

  const [riskOpen, setRiskOpen] = useState(false);
  const [riskForm, setRiskForm] = useState<RiscoPgr>(emptyRisco());
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [matrixRiscoId, setMatrixRiscoId] = useState<string | null>(null);

  // Step 4 — Gerar Documento
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string>("");
  const [savedFilePath, setSavedFilePath] = useState<string>("");

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-pgr"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: setores = [] } = useQuery({
    queryKey: ["setores-pgr", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("setores").select("id,nome_setor,ghe_ges,descricao_ambiente").eq("empresa_id", empresaId).order("nome_setor");
      if (error) throw error;
      return data;
    },
  });

  const { data: catRiscos = [] } = useQuery({
    queryKey: ["riscos-cadastro"],
    queryFn: async () => {
      const { data, error } = await supabase.from("riscos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: funcoesEmpresa = [] } = useQuery({
    queryKey: ["funcoes-pgr", empresaId, (setores as any[]).map(s => s.id).join(",")],
    enabled: !!empresaId && (setores as any[]).length > 0,
    queryFn: async () => {
      const setorIds = (setores as any[]).map(s => s.id);
      if (setorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("funcoes")
        .select("id,nome_funcao,setor_id,cbo_codigo,cbo_descricao,descricao_atividades,expostos")
        .in("setor_id", setorIds)
        .order("nome_funcao");
      if (error) throw error;
      return data;
    },
  });

  const { data: catEpis = [] } = useQuery({
    queryKey: ["epi-epc-cadastro"],
    queryFn: async () => {
      const { data, error } = await supabase.from("epi_epc").select("id,nome,tipo").order("nome");
      if (error) throw error;
      return data;
    },
  });
  const { data: templates = [] } = useQuery({
    queryKey: ["templates-pgr"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("id,title,file_path").order("title");
      if (error) throw error;
      return data;
    },
  });

  const tiposAgente = Array.from(new Set((catRiscos as any[]).map(r => r.tipo).filter(Boolean))).sort();

  // Carregar rascunho
  useEffect(() => {
    if (!documentoId) return;
    (async () => {
      try {
        const { data, error } = await supabase.from("documentos").select("*").eq("id", documentoId).maybeSingle();
        if (error) throw error;
        if (data) {
          setEmpresaId(data.empresa_id || "");
          setEmpresaNome(data.empresa_nome || "");
          setResponsavelTecnico(data.responsavel_tecnico || "");
          setCrea(data.crea || "");
          setCargo(data.cargo || "");
          setDataElaboracao(data.data_elaboracao || "");
          setRevisoes(Array.isArray(data.revisoes) ? (data.revisoes as any[]) : []);
          setStep(typeof (data as any).current_step === "number" ? (data as any).current_step : 0);
          const snap = (data as any).draft_snapshot;
          if (snap && typeof snap === "object" && snap.setores) {
            setSnapshot(snap as PgrSnapshot);
            const ident = (snap as any).identificacao || {};
            setVigenciaInicio(ident.vigencia_inicio || "");
            setVigenciaFim(ident.vigencia_fim || "");
          }
          if ((data as any).template_id) setSelectedTemplate((data as any).template_id);
          if ((data as any).file_path) setSavedFilePath((data as any).file_path);
        }
      } catch (e: any) {
        toast.error("Erro ao carregar rascunho: " + (e.message || ""));
      } finally {
        setLoading(false);
      }
    })();
  }, [documentoId]);

  const handleEmpresaChange = (id: string) => {
    setEmpresaId(id);
    const emp = (empresas as any[]).find(e => e.id === id);
    setEmpresaNome(emp ? (emp.razao_social || emp.nome_fantasia || "") : "");
  };

  const addRevisao = () => setRevisoes(prev => [...prev, emptyRevisao()]);
  const removeRevisao = (i: number) => setRevisoes(prev => prev.filter((_, idx) => idx !== i));
  const updateRevisao = (i: number, f: keyof Revisao, v: string) =>
    setRevisoes(prev => prev.map((r, idx) => (idx === i ? { ...r, [f]: v } : r)));

  const buildPayload = (overrides: Partial<{ step: number; snapshot: PgrSnapshot }> = {}) => {
    const baseSnap = overrides.snapshot ?? snapshot;
    const snapWithIdent: any = {
      ...baseSnap,
      identificacao: {
        ...((baseSnap as any).identificacao || {}),
        vigencia_inicio: vigenciaInicio || "",
        vigencia_fim: vigenciaFim || "",
        responsavel: responsavelTecnico || "",
      },
    };
    return {
      tipo: "PGR",
      empresa_id: empresaId || null,
      empresa_nome: empresaNome || "",
      responsavel_tecnico: responsavelTecnico || null,
      crea: crea || null,
      cargo: cargo || null,
      data_elaboracao: dataElaboracao || null,
      revisoes: revisoes as any,
      current_step: overrides.step ?? step,
      draft_snapshot: snapWithIdent,
      status: "rascunho",
    };
  };

  const persist = async (overrides?: Partial<{ step: number; snapshot: PgrSnapshot }>): Promise<string | null> => {
    setSaving(true);
    try {
      if (docId) {
        const { error } = await supabase.from("documentos").update(buildPayload(overrides)).eq("id", docId);
        if (error) throw error;
        return docId;
      }
      const { data, error } = await supabase.from("documentos").insert(buildPayload(overrides)).select("id").single();
      if (error) throw error;
      setDocId(data.id);
      return data.id;
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e.message || ""));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSalvar = async () => {
    if (!empresaId) { toast.error("Selecione a empresa"); return; }
    const id = await persist();
    if (id) {
      toast.success("Rascunho salvo");
      if (!documentoId) navigate(`/documentos/pgr/editar/${id}`, { replace: true });
    }
  };

  const handleAvancar = async () => {
    if (!empresaId) { toast.error("Selecione a empresa"); return; }
    const id = await persist({ step: 1 });
    if (id) {
      setStep(1);
      if (!documentoId) navigate(`/documentos/pgr/editar/${id}`, { replace: true });
    }
  };

  // ============ Modal Novo Risco ============
  const openNovoRisco = () => {
    setEditingRiskId(null);
    setRiskForm(emptyRisco());
    setRiskOpen(true);
  };

  const openEditRisco = (r: RiscoPgr) => {
    setEditingRiskId(r.id);
    setRiskForm({ ...r });
    setRiskOpen(true);
  };

  const onSelectAgente = (agentId: string) => {
    const agent: any = (catRiscos as any[]).find(r => r.id === agentId);
    if (!agent) {
      setRiskForm(prev => ({ ...prev, agente_id: agentId }));
      return;
    }
    const tipo = riskForm.tipo_agente || agent.tipo || "";
    setRiskForm({
      ...riskForm,
      agente_id: agentId,
      agente_nome: agent.nome || "",
      tipo_agente: tipo,
      tipo_avaliacao: riskForm.tipo_avaliacao || tipoAvaliacaoFromTipo(tipo),
      codigo_esocial: agent.codigo_esocial || "",
      descricao_esocial: agent.descricao_esocial || "",
      propagacao: Array.isArray(agent.propagacao) ? agent.propagacao.join(", ") : (agent.propagacao || ""),
      tipo_exposicao: agent.tipo_exposicao || "",
      fonte_geradora: agent.fonte_geradora || "",
      danos_saude: agent.danos_saude || "",
      medidas_controle: agent.medidas_controle || "",
    });
  };

  const onSelectTipoAgente = (tipo: string) => {
    setRiskForm(prev => ({
      ...prev,
      tipo_agente: tipo,
      tipo_avaliacao: prev.tipo_avaliacao || tipoAvaliacaoFromTipo(tipo),
    }));
  };

  const agentesFiltrados = riskForm.tipo_agente
    ? (catRiscos as any[]).filter(r => (r.tipo || "") === riskForm.tipo_agente)
    : (catRiscos as any[]);

  const handleSalvarRisco = async () => {
    if (!activeSetor) return;
    if (!riskForm.tipo_agente) { toast.error("Selecione o tipo de agente"); return; }
    if (!riskForm.agente_id) { toast.error("Selecione o agente"); return; }

    const setorId = activeSetor.id;
    const current = snapshot.setores[setorId] || { riscos: [] };
    const isNew = !editingRiskId;
    const riscoId = editingRiskId || riskForm.id;
    let novosRiscos: RiscoPgr[];
    if (editingRiskId) {
      novosRiscos = current.riscos.map(r => (r.id === editingRiskId ? { ...riskForm, id: editingRiskId } : r));
    } else {
      novosRiscos = [...current.riscos, { ...riskForm, id: riscoId }];
    }
    const novoSnap: PgrSnapshot = {
      ...snapshot,
      setores: { ...snapshot.setores, [setorId]: { riscos: novosRiscos } },
    };
    setSnapshot(novoSnap);
    const id = await persist({ snapshot: novoSnap });
    if (id) {
      toast.success(editingRiskId ? "Risco atualizado" : "Risco salvo");
      setRiskOpen(false);
      if (isNew) setMatrixRiscoId(riscoId);
    }
  };

  const handleRemoverRisco = async (riscoId: string) => {
    if (!activeSetor) return;
    const setorId = activeSetor.id;
    const current = snapshot.setores[setorId] || { riscos: [] };
    const novoSnap: PgrSnapshot = {
      ...snapshot,
      setores: { ...snapshot.setores, [setorId]: { riscos: current.riscos.filter(r => r.id !== riscoId) } },
    };
    setSnapshot(novoSnap);
    await persist({ snapshot: novoSnap });
    toast.success("Risco removido");
  };

  const updateRiscoMatriz = async (riscoId: string, patch: Partial<Pick<RiscoPgr, "probabilidade" | "severidade">>) => {
    if (!activeSetor) return;
    const setorId = activeSetor.id;
    const current = snapshot.setores[setorId] || { riscos: [] };
    const novosRiscos = current.riscos.map(r => (r.id === riscoId ? { ...r, ...patch } : r));
    const novoSnap: PgrSnapshot = {
      ...snapshot,
      setores: { ...snapshot.setores, [setorId]: { riscos: novosRiscos } },
    };
    setSnapshot(novoSnap);
    await persist({ snapshot: novoSnap });
  };

  // ============ EPI / Treinamentos helpers ============
  const epiBlocos: EpiBloco[] = snapshot.epi_blocos || [];
  const treinBlocos: TreinBloco[] = snapshot.treinamento_blocos || [];

  const updateSnapAndPersist = async (novoSnap: PgrSnapshot, silent = false) => {
    setSnapshot(novoSnap);
    const id = await persist({ snapshot: novoSnap });
    if (id && !silent) toast.success("Salvo");
  };

  const addEpiBloco = () =>
    updateSnapAndPersist({
      ...snapshot,
      epi_blocos: [...epiBlocos, { id: crypto.randomUUID(), funcao_ids: [], epis: [] }],
    }, true);

  const removeEpiBloco = (id: string) =>
    updateSnapAndPersist({ ...snapshot, epi_blocos: epiBlocos.filter(b => b.id !== id) });

  const updateEpiBloco = (id: string, patch: Partial<EpiBloco>) =>
    setSnapshot(s => ({ ...s, epi_blocos: (s.epi_blocos || []).map(b => b.id === id ? { ...b, ...patch } : b) }));

  const addEpiItem = (blocoId: string) =>
    setSnapshot(s => ({
      ...s,
      epi_blocos: (s.epi_blocos || []).map(b => b.id === blocoId
        ? { ...b, epis: [...b.epis, { id: crypto.randomUUID(), epi_id: "", nome_epi: "", ca: "", uso: "Contínuo" }] }
        : b),
    }));

  const updateEpiItem = (blocoId: string, itemId: string, patch: Partial<EpiItem>) =>
    setSnapshot(s => ({
      ...s,
      epi_blocos: (s.epi_blocos || []).map(b => b.id === blocoId
        ? { ...b, epis: b.epis.map(i => i.id === itemId ? { ...i, ...patch } : i) }
        : b),
    }));

  const removeEpiItem = (blocoId: string, itemId: string) =>
    setSnapshot(s => ({
      ...s,
      epi_blocos: (s.epi_blocos || []).map(b => b.id === blocoId
        ? { ...b, epis: b.epis.filter(i => i.id !== itemId) }
        : b),
    }));

  const addTreinBloco = () =>
    updateSnapAndPersist({
      ...snapshot,
      treinamento_blocos: [...treinBlocos, { id: crypto.randomUUID(), funcao_ids: [], treinamentos: [] }],
    }, true);

  const removeTreinBloco = (id: string) =>
    updateSnapAndPersist({ ...snapshot, treinamento_blocos: treinBlocos.filter(b => b.id !== id) });

  const updateTreinBloco = (id: string, patch: Partial<TreinBloco>) =>
    setSnapshot(s => ({ ...s, treinamento_blocos: (s.treinamento_blocos || []).map(b => b.id === id ? { ...b, ...patch } : b) }));

  const addTreinItem = (blocoId: string) =>
    setSnapshot(s => ({
      ...s,
      treinamento_blocos: (s.treinamento_blocos || []).map(b => b.id === blocoId
        ? { ...b, treinamentos: [...b.treinamentos, { id: crypto.randomUUID(), nome_treinamento: "" }] }
        : b),
    }));

  const updateTreinItem = (blocoId: string, itemId: string, patch: Partial<TreinItem>) =>
    setSnapshot(s => ({
      ...s,
      treinamento_blocos: (s.treinamento_blocos || []).map(b => b.id === blocoId
        ? { ...b, treinamentos: b.treinamentos.map(i => i.id === itemId ? { ...i, ...patch } : i) }
        : b),
    }));

  const removeTreinItem = (blocoId: string, itemId: string) =>
    setSnapshot(s => ({
      ...s,
      treinamento_blocos: (s.treinamento_blocos || []).map(b => b.id === blocoId
        ? { ...b, treinamentos: b.treinamentos.filter(i => i.id !== itemId) }
        : b),
    }));

  // ============ Cronograma do PGR helpers ============
  const cronograma: CronogramaItem[] = snapshot.cronograma_pgr || [];

  const emptyCronoItem = (): CronogramaItem => ({
    id: crypto.randomUUID(), item: "", acao: "", responsavel: "",
    prazo_mes: "", prazo_ano: String(new Date().getFullYear()), situacao: "Previsto",
  });

  const addCronoItem = () =>
    setSnapshot(s => ({ ...s, cronograma_pgr: [...(s.cronograma_pgr || []), emptyCronoItem()] }));

  const updateCronoItem = (id: string, patch: Partial<CronogramaItem>) =>
    setSnapshot(s => ({
      ...s,
      cronograma_pgr: (s.cronograma_pgr || []).map(c => c.id === id ? { ...c, ...patch } : c),
    }));

  const removeCronoItem = (id: string) =>
    setSnapshot(s => ({ ...s, cronograma_pgr: (s.cronograma_pgr || []).filter(c => c.id !== id) }));

  const replaceCronograma = (items: CronogramaItem[]) =>
    setSnapshot(s => ({ ...s, cronograma_pgr: items.map(i => ({ ...i, id: crypto.randomUUID() })) }));

  const appendCronograma = (items: CronogramaItem[]) =>
    setSnapshot(s => ({ ...s, cronograma_pgr: [...(s.cronograma_pgr || []), ...items.map(i => ({ ...i, id: crypto.randomUUID() }))] }));


  const goToStep = async (n: number) => {
    const id = await persist({ step: n, snapshot });
    if (id) {
      setStep(n);
      setActiveSetor(null);
      if (!documentoId) navigate(`/documentos/pgr/editar/${id}`, { replace: true });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  // ============ STEP 0 — Identificação ============
  if (step === 0) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documentos")}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">PGR — Identificação</h1>
            <p className="text-sm text-muted-foreground">Programa de Gerenciamento de Riscos</p>
          </div>
        </div>

        <Card className="p-6 space-y-5">
          <div>
            <Label className="text-xs font-bold uppercase">Empresa *</Label>
            <Select value={empresaId} onValueChange={handleEmpresaChange}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {(empresas as any[]).map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase">Responsável Técnico</Label>
              <Input className="mt-1" value={responsavelTecnico} onChange={e => setResponsavelTecnico(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">CREA</Label>
              <Input className="mt-1" value={crea} onChange={e => setCrea(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Cargo</Label>
              <Input className="mt-1" value={cargo} onChange={e => setCargo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold uppercase">Vigência — Início</Label>
                <Input className="mt-1" type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Vigência — Fim</Label>
                <Input className="mt-1" type="date" value={vigenciaFim} onChange={e => setVigenciaFim(e.target.value)} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-semibold">Revisões</h2>
              <p className="text-xs text-muted-foreground">Histórico de revisões do documento</p>
            </div>
            <Button variant="outline" size="sm" onClick={addRevisao}><Plus className="w-4 h-4 mr-1" /> Adicionar revisão</Button>
          </div>
          {revisoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma revisão cadastrada</p>
          ) : (
            <div className="space-y-3">
              {revisoes.map((r, i) => (
                <div key={i} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div><Label className="text-xs">Revisão</Label><Input className="mt-1" value={r.revisao} onChange={e => updateRevisao(i, "revisao", e.target.value)} /></div>
                  <div><Label className="text-xs">Data</Label><Input className="mt-1" type="date" value={r.data} onChange={e => updateRevisao(i, "data", e.target.value)} /></div>
                  <div><Label className="text-xs">Motivo</Label><Input className="mt-1" value={r.motivo} onChange={e => updateRevisao(i, "motivo", e.target.value)} /></div>
                  <div className="flex gap-2">
                    <div className="flex-1"><Label className="text-xs">Responsável</Label><Input className="mt-1" value={r.responsavel} onChange={e => updateRevisao(i, "responsavel", e.target.value)} /></div>
                    <Button variant="ghost" size="icon" className="self-end text-destructive" onClick={() => removeRevisao(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleSalvar} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar
          </Button>
          <Button onClick={handleAvancar} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Avançar
          </Button>
        </div>
      </div>
    );
  }

  // ============ STEP 1 — Reconhecimento ============
  // Subview: setor selecionado
  if (activeSetor) {
    const riscosSetor = snapshot.setores[activeSetor.id]?.riscos || [];

    // === Subview: Matriz 3x3 ===
    if (sectorView === "matriz") {
      return (
        <div className="max-w-6xl mx-auto pb-12">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setSectorView("riscos")}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
                <Grid3x3 className="w-6 h-6 text-primary" /> Matriz de Risco 3x3
              </h1>
              <p className="text-sm text-muted-foreground">{activeSetor.nome_setor} — selecione probabilidade e severidade para cada risco</p>
            </div>
          </div>

          {riscosSetor.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum risco cadastrado para avaliar.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {riscosSetor.map(r => {
                const p = (r.probabilidade ?? null) as Nivel | null;
                const s = (r.severidade ?? null) as Nivel | null;
                const calc = p && s ? calcularMatriz(p, s) : null;
                return (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{r.tipo_agente}</Badge>
                        </div>
                        <h3 className="font-semibold">{r.agente_nome}</h3>
                      </div>
                      {calc && (
                        <Badge variant="outline" className={`text-sm py-1.5 px-3 ${calc.corBadge}`}>
                          Nível: {calc.nivel} ({calc.resultado})
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Seleções */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-bold uppercase">Probabilidade</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {([1, 2, 3] as Nivel[]).map(n => (
                              <Button
                                key={n}
                                type="button"
                                variant={p === n ? "default" : "outline"}
                                onClick={() => updateRiscoMatriz(r.id, { probabilidade: n })}
                              >
                                {n} — {PROBABILIDADE_LABELS[n]}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-bold uppercase">Severidade</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {([1, 2, 3] as Nivel[]).map(n => (
                              <Button
                                key={n}
                                type="button"
                                variant={s === n ? "default" : "outline"}
                                onClick={() => updateRiscoMatriz(r.id, { severidade: n })}
                              >
                                {n} — {SEVERIDADE_LABELS[n]}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {calc && (
                          <div className="rounded-lg border p-4 bg-muted/30 space-y-1.5 text-sm">
                            <div><span className="font-semibold">Resultado:</span> {calc.resultado}</div>
                            <div><span className="font-semibold">Nível do risco:</span> {calc.nivel}</div>
                            <div><span className="font-semibold">Classificação:</span> {calc.classificacao}</div>
                          </div>
                        )}
                      </div>

                      {/* Tabela 3x3 */}
                      <div>
                        <Label className="text-xs font-bold uppercase mb-2 block">Tabela 3x3 (Severidade × Probabilidade)</Label>
                        <div className="inline-block">
                          <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-xs">
                            <div></div>
                            {([1, 2, 3] as Nivel[]).map(pp => (
                              <div key={`h-${pp}`} className="text-center font-semibold py-1 text-muted-foreground">
                                P{pp}
                              </div>
                            ))}
                            {([3, 2, 1] as Nivel[]).map(ss => (
                              <Fragment key={`row-${ss}`}>
                                <div className="text-right font-semibold pr-2 self-center text-muted-foreground">S{ss}</div>
                                {([1, 2, 3] as Nivel[]).map(pp => {
                                  const val = pp * ss;
                                  const isSel = p === pp && s === ss;
                                  return (
                                    <button
                                      type="button"
                                      key={`c-${ss}-${pp}`}
                                      onClick={() => updateRiscoMatriz(r.id, { probabilidade: pp, severidade: ss })}
                                      className={`${CELL_COLOR[val]} h-14 w-14 rounded-md text-white font-bold flex items-center justify-center transition-all ${isSel ? "ring-4 ring-foreground ring-offset-2 ring-offset-background scale-105" : "hover:scale-105"}`}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                              </Fragment>
                            ))}
                          </div>
                          <div className="flex gap-3 mt-3 text-xs">
                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/80" /> Baixo (1-2)</div>
                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/80" /> Médio (3-4)</div>
                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/80" /> Alto (6-9)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setSectorView("riscos")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button variant="outline" onClick={async () => { await persist(); toast.success("Matriz salva"); }} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setActiveSetor(null)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold">{activeSetor.nome_setor}</h1>
            <p className="text-sm text-muted-foreground">Riscos identificados no setor</p>
          </div>
          <Button variant="outline" onClick={() => setSectorView("matriz")} disabled={riscosSetor.length === 0}>
            <Grid3x3 className="w-4 h-4 mr-1" /> Matriz 3x3
          </Button>
          <Button onClick={openNovoRisco}><Plus className="w-4 h-4 mr-1" /> Novo Risco</Button>
        </div>

        {riscosSetor.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum risco cadastrado neste setor.</p>
            <Button className="mt-4" onClick={openNovoRisco}><Plus className="w-4 h-4 mr-1" /> Adicionar primeiro risco</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {riscosSetor.map(r => {
              const p = (r.probabilidade ?? null) as Nivel | null;
              const s = (r.severidade ?? null) as Nivel | null;
              const calc = p && s ? calcularMatriz(p, s) : null;
              const matrixColor = calc
                ? (calc.nivel === "Baixo" ? "text-emerald-600 hover:text-emerald-700"
                  : calc.nivel === "Médio" ? "text-amber-600 hover:text-amber-700"
                  : "text-red-600 hover:text-red-700")
                : "text-muted-foreground";
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{r.tipo_agente}</Badge>
                        <Badge variant="outline">{r.tipo_avaliacao}</Badge>
                        {calc && (
                          <Badge variant="outline" className={calc.corBadge}>
                            {calc.nivel} ({calc.resultado})
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{r.agente_nome}</h3>
                      {r.codigo_esocial && <p className="text-xs text-muted-foreground mt-1">eSocial: {r.codigo_esocial} — {r.descricao_esocial}</p>}
                      {r.fonte_geradora && <p className="text-sm mt-2"><span className="font-medium">Fonte:</span> {r.fonte_geradora}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className={matrixColor} title="Matriz 3x3" onClick={() => setMatrixRiscoId(r.id)}>
                        <Grid3x3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditRisco(r)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoverRisco(r.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal Novo Risco */}
        <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRiskId ? "Editar Risco" : "Novo Risco"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase">Tipo de Agente *</Label>
                  <Select value={riskForm.tipo_agente} onValueChange={onSelectTipoAgente}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {tiposAgente.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Tipo de Avaliação</Label>
                  <Input className="mt-1" value={riskForm.tipo_avaliacao} onChange={e => setRiskForm({ ...riskForm, tipo_avaliacao: e.target.value })} placeholder="Auto-preenchido" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase">Agente *</Label>
                <Select value={riskForm.agente_id} onValueChange={onSelectAgente}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o agente" /></SelectTrigger>
                  <SelectContent>
                    {agentesFiltrados.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase">Código eSocial</Label>
                  <Input className="mt-1" value={riskForm.codigo_esocial} onChange={e => setRiskForm({ ...riskForm, codigo_esocial: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Descrição eSocial</Label>
                  <Input className="mt-1" value={riskForm.descricao_esocial} onChange={e => setRiskForm({ ...riskForm, descricao_esocial: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Propagação</Label>
                  <Input className="mt-1" value={riskForm.propagacao} onChange={e => setRiskForm({ ...riskForm, propagacao: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Tipo de Exposição</Label>
                  <Input className="mt-1" value={riskForm.tipo_exposicao} onChange={e => setRiskForm({ ...riskForm, tipo_exposicao: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase">Fonte Geradora</Label>
                <Textarea className="mt-1" rows={2} value={riskForm.fonte_geradora} onChange={e => setRiskForm({ ...riskForm, fonte_geradora: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Danos à Saúde</Label>
                <Textarea className="mt-1" rows={2} value={riskForm.danos_saude} onChange={e => setRiskForm({ ...riskForm, danos_saude: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Medidas de Controle Existentes</Label>
                <Textarea className="mt-1" rows={2} value={riskForm.medidas_controle} onChange={e => setRiskForm({ ...riskForm, medidas_controle: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRiskOpen(false)}>Cancelar</Button>
              <Button onClick={handleSalvarRisco} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Matriz 3x3 por risco */}
        <Dialog open={!!matrixRiscoId} onOpenChange={(o) => !o && setMatrixRiscoId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-primary" /> Matriz de Risco 3x3
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const r = riscosSetor.find(x => x.id === matrixRiscoId);
              if (!r) return null;
              const p = (r.probabilidade ?? null) as Nivel | null;
              const s = (r.severidade ?? null) as Nivel | null;
              const calc = p && s ? calcularMatriz(p, s) : null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant="secondary">{r.tipo_agente}</Badge>
                      <h3 className="font-semibold mt-1">{r.agente_nome}</h3>
                    </div>
                    {calc && (
                      <Badge variant="outline" className={`text-sm py-1.5 px-3 ${calc.corBadge}`}>
                        Nível: {calc.nivel} ({calc.resultado})
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-bold uppercase">Probabilidade</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {([1, 2, 3] as Nivel[]).map(n => (
                            <Button key={n} type="button" variant={p === n ? "default" : "outline"} onClick={() => updateRiscoMatriz(r.id, { probabilidade: n })}>
                              {n} — {PROBABILIDADE_LABELS[n]}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase">Severidade</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {([1, 2, 3] as Nivel[]).map(n => (
                            <Button key={n} type="button" variant={s === n ? "default" : "outline"} onClick={() => updateRiscoMatriz(r.id, { severidade: n })}>
                              {n} — {SEVERIDADE_LABELS[n]}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {calc && (
                        <div className="rounded-lg border p-4 bg-muted/30 space-y-1.5 text-sm">
                          <div><span className="font-semibold">Resultado:</span> {calc.resultado}</div>
                          <div><span className="font-semibold">Nível do risco:</span> {calc.nivel}</div>
                          <div><span className="font-semibold">Classificação:</span> {calc.classificacao}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase mb-2 block">Tabela 3x3</Label>
                      <div className="inline-block">
                        <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-xs">
                          <div></div>
                          {([1, 2, 3] as Nivel[]).map(pp => (
                            <div key={`h-${pp}`} className="text-center font-semibold py-1 text-muted-foreground">P{pp}</div>
                          ))}
                          {([3, 2, 1] as Nivel[]).map(ss => (
                            <Fragment key={`row-${ss}`}>
                              <div className="text-right font-semibold pr-2 self-center text-muted-foreground">S{ss}</div>
                              {([1, 2, 3] as Nivel[]).map(pp => {
                                const val = pp * ss;
                                const isSel = p === pp && s === ss;
                                return (
                                  <button type="button" key={`c-${ss}-${pp}`} onClick={() => updateRiscoMatriz(r.id, { probabilidade: pp, severidade: ss })}
                                    className={`${CELL_COLOR[val]} h-12 w-12 rounded-md text-white font-bold flex items-center justify-center transition-all ${isSel ? "ring-4 ring-foreground ring-offset-2 ring-offset-background scale-105" : "hover:scale-105"}`}>
                                    {val}
                                  </button>
                                );
                              })}
                            </Fragment>
                          ))}
                        </div>
                        <div className="flex gap-3 mt-3 text-xs">
                          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/80" /> Baixo</div>
                          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/80" /> Médio</div>
                          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/80" /> Alto</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button onClick={() => setMatrixRiscoId(null)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar e voltar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ STEP 1 — Lista de setores (Reconhecimento) ============
  if (step === 1) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setStep(0)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold">Reconhecimento</h1>
            <p className="text-sm text-muted-foreground">Selecione um setor para cadastrar os riscos</p>
          </div>
        </div>

        {(setores as any[]).length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum setor cadastrado para esta empresa.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/setores-funcoes")}>Ir para Setores e Funções</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(setores as any[]).map(s => {
              const qtd = snapshot.setores[s.id]?.riscos?.length || 0;
              return (
                <Card key={s.id} className="p-5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveSetor({ id: s.id, nome_setor: s.nome_setor })}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold">{s.nome_setor}</h3>
                        {s.ghe_ges && <p className="text-xs text-muted-foreground">GHE/GES: {s.ghe_ges}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={qtd > 0 ? "default" : "secondary"}>{qtd} risco{qtd !== 1 ? "s" : ""}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          <Button onClick={() => goToStep(2)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Avançar
          </Button>
        </div>
      </div>
    );
  }

  // ============ Multi-select de funções (componente local) ============
  const FuncoesMultiSelect = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
    const todas = funcoesEmpresa as any[];
    const sel = todas.filter(f => value.includes(f.id));
    const label = sel.length === 0 ? "Selecionar funções" : `${sel.length} função(ões) selecionada(s)`;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">{label}</span>
            <Users className="w-4 h-4 ml-2 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-72 overflow-y-auto p-2">
          {todas.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">Nenhuma função cadastrada</p>
          ) : todas.map(f => {
            const checked = value.includes(f.id);
            return (
              <label key={f.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={(c) => {
                  onChange(c ? [...value, f.id] : value.filter(id => id !== f.id));
                }} />
                <span className="text-sm">{f.nome_funcao}</span>
              </label>
            );
          })}
        </PopoverContent>
      </Popover>
    );
  };

  const funcoesNomes = (ids: string[]) =>
    (funcoesEmpresa as any[]).filter(f => ids.includes(f.id)).map(f => f.nome_funcao).join(", ");

  // ============ STEP 2 — EPI ============
  if (step === 2) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => goToStep(1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> EPI</h1>
            <p className="text-sm text-muted-foreground">Vincule EPIs às funções da empresa</p>
          </div>
        </div>

        {epiBlocos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum bloco de funções cadastrado.</p>
            <Button className="mt-4" onClick={addEpiBloco}><Plus className="w-4 h-4 mr-1" /> Adicionar bloco de funções</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {epiBlocos.map(b => (
              <Card key={b.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-bold uppercase">Funções *</Label>
                    <div className="mt-1">
                      <FuncoesMultiSelect value={b.funcao_ids} onChange={(v) => updateEpiBloco(b.id, { funcao_ids: v })} />
                    </div>
                    {b.funcao_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">{funcoesNomes(b.funcao_ids)}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeEpiBloco(b.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">EPIs vinculados</h4>
                    <Button variant="outline" size="sm" onClick={() => addEpiItem(b.id)}><Plus className="w-4 h-4 mr-1" /> EPI</Button>
                  </div>
                  {b.epis.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Nenhum EPI adicionado.</p>
                  ) : (
                    <div className="space-y-2">
                      {b.epis.map(item => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_auto] gap-2 items-end border rounded-lg p-3">
                          <div>
                            <Label className="text-xs">Nome do EPI</Label>
                            <Select
                              value={item.epi_id}
                              onValueChange={(v) => {
                                const epi: any = (catEpis as any[]).find(e => e.id === v);
                                updateEpiItem(b.id, item.id, { epi_id: v, nome_epi: epi?.nome || "" });
                              }}
                            >
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {(catEpis as any[]).map(e => <SelectItem key={e.id} value={e.id}>{e.nome}{e.tipo ? ` (${e.tipo})` : ""}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">CA</Label>
                            <Input className="mt-1" value={item.ca} onChange={e => updateEpiItem(b.id, item.id, { ca: e.target.value })} />
                          </div>
                          <div>
                            <Label className="text-xs">Uso</Label>
                            <Select value={item.uso} onValueChange={(v) => updateEpiItem(b.id, item.id, { uso: v })}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Contínuo">Contínuo</SelectItem>
                                <SelectItem value="Eventual">Eventual</SelectItem>
                                <SelectItem value="Não aplicado">Não aplicado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeEpiItem(b.id, item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={addEpiBloco}><Plus className="w-4 h-4 mr-1" /> Funções</Button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => goToStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => { const id = await persist(); if (id) toast.success("Salvo"); }} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar
            </Button>
            <Button onClick={() => goToStep(3)} disabled={saving}>Avançar</Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 3 — Treinamentos ============
  if (step === 3) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => goToStep(2)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> Treinamentos</h1>
            <p className="text-sm text-muted-foreground">Vincule treinamentos às funções da empresa</p>
          </div>
        </div>

        {treinBlocos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum bloco de funções cadastrado.</p>
            <Button className="mt-4" onClick={addTreinBloco}><Plus className="w-4 h-4 mr-1" /> Adicionar bloco de funções</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {treinBlocos.map(b => (
              <Card key={b.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-bold uppercase">Funções *</Label>
                    <div className="mt-1">
                      <FuncoesMultiSelect value={b.funcao_ids} onChange={(v) => updateTreinBloco(b.id, { funcao_ids: v })} />
                    </div>
                    {b.funcao_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">{funcoesNomes(b.funcao_ids)}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeTreinBloco(b.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Treinamentos</h4>
                    <Button variant="outline" size="sm" onClick={() => addTreinItem(b.id)}><Plus className="w-4 h-4 mr-1" /> Treinamento</Button>
                  </div>
                  {b.treinamentos.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Nenhum treinamento adicionado.</p>
                  ) : (
                    <div className="space-y-2">
                      {b.treinamentos.map(item => (
                        <div key={item.id} className="flex items-end gap-2 border rounded-lg p-3">
                          <div className="flex-1">
                            <Label className="text-xs">Nome do treinamento</Label>
                            <Input className="mt-1" value={item.nome_treinamento} onChange={e => updateTreinItem(b.id, item.id, { nome_treinamento: e.target.value })} />
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeTreinItem(b.id, item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={addTreinBloco}><Plus className="w-4 h-4 mr-1" /> Funções</Button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => goToStep(2)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => { const id = await persist(); if (id) toast.success("Salvo"); }} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar
            </Button>
            <Button onClick={() => goToStep(4)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Avançar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 4 — Cronograma do PGR ============
  if (step === 4) {
    return <PgrCronogramaStep
      goToStep={goToStep}
      saving={saving}
      empresaId={empresaId}
      empresaNome={empresaNome}
      cronograma={cronograma}
      addCronoItem={addCronoItem}
      updateCronoItem={updateCronoItem}
      removeCronoItem={removeCronoItem}
      replaceCronograma={replaceCronograma}
      appendCronograma={appendCronograma}
      persist={persist}
    />;
  }

  // ============ STEP 5 — Gerar Documento ============
  if (step === 5) {
    const buildTemplateData = () => {
      const emp: any = (empresas as any[]).find(e => e.id === empresaId) || {};
      const setoresOrdenados = sortByGes(setores as any[]);
      const setoresArr = setoresOrdenados.map(s => {
        const data = snapshot.setores[s.id] || { riscos: [] };
        const funcoes_ghe = (funcoesEmpresa as any[])
          .filter(f => f.setor_id === s.id)
          .map(f => ({
            nome_funcao: f.nome_funcao || "",
            cbo_codigo: f.cbo_codigo || "",
            cbo_descricao: f.cbo_descricao || "",
            descricao_atividades: f.descricao_atividades || "",
          }));
        const riscos_ghe = (data.riscos || []).map(r => {
          const m = r.probabilidade && r.severidade
            ? calcularMatriz(r.probabilidade as Nivel, r.severidade as Nivel)
            : null;
          return {
            agente: r.agente_nome || "",
            agente_nome: r.agente_nome || "",
            tipo_agente: r.tipo_agente || "",
            tipo_avaliacao: r.tipo_avaliacao || "",
            codigo_esocial: r.codigo_esocial || "",
            descricao_esocial: r.descricao_esocial || "",
            propagacao: Array.isArray(r.propagacao) ? r.propagacao.join(", ") : (r.propagacao || ""),
            tipo_exposicao: r.tipo_exposicao || "",
            fonte_geradora: r.fonte_geradora || "",
            danos_saude: r.danos_saude || "",
            medidas_controle: r.medidas_controle || "",
            probabilidade: r.probabilidade ? PROBABILIDADE_LABELS[r.probabilidade as Nivel] : "",
            severidade: r.severidade ? SEVERIDADE_LABELS[r.severidade as Nivel] : "",
            nivel_risco: m?.nivel || "",
            classificacao_risco: m?.classificacao || "",
            resultado_matriz_risco: m?.resultado ?? "",
          };
        });
        return {
          ghe_ges: s.ghe_ges || "",
          nome_setor: s.nome_setor || "",
          descricao_ambiente: s.descricao_ambiente || "",
          funcoes_ghe,
          riscos_ghe,
          // legado / compat com loop {{#riscos}}
          riscos: riscos_ghe,
        };
      });
      const epis: any[] = [];
      (snapshot.epi_blocos || []).forEach(b => {
        const funcs = (funcoesEmpresa as any[]).filter(f => b.funcao_ids.includes(f.id));
        funcs.forEach(f => b.epis.forEach(e => epis.push({
          funcao: f.nome_funcao, nome_epi: e.nome_epi, ca: e.ca, uso: e.uso,
        })));
      });
      const treinamentos: any[] = [];
      (snapshot.treinamento_blocos || []).forEach(b => {
        const funcs = (funcoesEmpresa as any[]).filter(f => b.funcao_ids.includes(f.id));
        funcs.forEach(f => b.treinamentos.forEach(t => treinamentos.push({
          funcao: f.nome_funcao, nome_treinamento: t.nome_treinamento,
        })));
      });
      const MESES_PT = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const cronograma_pgr = (snapshot.cronograma_pgr || []).map(c => {
        const mesNum = parseInt(c.prazo_mes || "0", 10);
        const mesLabel = mesNum >= 1 && mesNum <= 12 ? MESES_PT[mesNum] : "";
        const prazo = mesLabel && c.prazo_ano ? `${mesLabel}/${c.prazo_ano}` : (c.prazo_ano || "");
        return {
          item_cronograma: c.item || "",
          acao_cronograma: c.acao || "",
          responsavel_cronograma: c.responsavel || "",
          prazo_cronograma: prazo,
          situacao_cronograma: c.situacao || "",
        };
      });
      return {
        empresa: empresaNome,
        razao_social: emp.razao_social || empresaNome,
        nome_fantasia: emp.nome_fantasia || "",
        cnpj: emp.cnpj || "",
        responsavel_tecnico: responsavelTecnico,
        crea, cargo,
        data_elaboracao: dataElaboracao,
        revisoes,
        ghe_setores: setoresArr,
        // legado
        setores: setoresArr,
        epis,
        treinamentos,
        cronograma_pgr,
      };
    };

    const loadTemplateDoc = async () => {
      const tpl: any = (templates as any[]).find(t => t.id === selectedTemplate);
      if (!tpl) throw new Error("Template não encontrado");
      const { data: fileData, error } = await supabase.storage.from("templates").download(tpl.file_path);
      if (error) throw error;
      const path = String(tpl.file_path || "").toLowerCase();
      if (path.endsWith(".html") || path.endsWith(".htm")) {
        const htmlSource = await fileData.text();
        let lastData: any = null;
        return {
          kind: "html",
          render(data: any) { lastData = data; },
          async toBlob() { return await renderHtmlTemplateToDocx(htmlSource, lastData ?? {}); },
        } as any;
      }
      const ab = await fileData.arrayBuffer();
      const zip = new PizZip(ab);
      return new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "{{", end: "}}" } });
    };

    const handleVincular = async () => {
      if (!selectedTemplate) { toast.error("Selecione um template"); return; }
      setValidating(true);
      setValidated(false);
      setGeneratedBlob(null);
      try {
        const doc = await loadTemplateDoc();
        const data = buildTemplateData();
        doc.render(data);
        const output: Blob = (doc as any).kind === "html"
          ? await (doc as any).toBlob()
          : (doc as any).getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const fileName = `PGR_${(empresaNome || "documento").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getFullYear()}.docx`;
        setGeneratedBlob(output);
        setGeneratedFileName(fileName);
        setValidated(true);
        toast.success("✅ Documento vinculado com sucesso");
      } catch (e: any) {
        toast.error("Erro ao vincular: " + (e.message || ""));
      } finally {
        setValidating(false);
      }
    };

    const handleSalvarDocumento = async () => {
      if (!docId) { toast.error("Salve o rascunho antes"); return; }
      setGenerating(true);
      try {
        let filePath = savedFilePath;
        if (generatedBlob) {
          const storagePath = `documentos/${Date.now()}_${generatedFileName}`;
          const { error: upErr } = await supabase.storage.from("templates").upload(storagePath, generatedBlob);
          if (upErr) throw upErr;
          filePath = storagePath;
          setSavedFilePath(storagePath);
        }
        const { error } = await supabase.from("documentos").update({
          ...buildPayload({ step: 5 }),
          template_id: selectedTemplate || null,
          file_path: filePath || null,
          status: generatedBlob ? "concluido" : "rascunho",
        }).eq("id", docId);
        if (error) throw error;
        toast.success("Documento salvo");
      } catch (e: any) {
        toast.error("Erro ao salvar: " + (e.message || ""));
      } finally {
        setGenerating(false);
      }
    };

    const handleBaixar = () => {
      if (!generatedBlob) return;
      saveAs(generatedBlob, generatedFileName);
    };

    return (
      <div className="max-w-3xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => goToStep(4)}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">Gerar Documento PGR</h1>
            <p className="text-sm text-muted-foreground">{empresaNome}</p>
          </div>
        </div>

        <Card className="p-8">
          <div className="text-center mb-6">
            <FileDown className="w-12 h-12 mx-auto text-accent mb-3" />
            <h2 className="font-heading text-xl font-bold mb-2">Selecione o template PGR</h2>
            <p className="text-muted-foreground text-sm">Vincule os dados ao template e baixe o documento final</p>
          </div>

          <Label className="text-xs font-bold uppercase">Template *</Label>
          <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setValidated(false); setGeneratedBlob(null); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Escolher template" /></SelectTrigger>
            <SelectContent>
              {(templates as any[]).length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum template cadastrado</div>}
              {(templates as any[]).map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Button variant="outline" onClick={handleSalvarDocumento} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Documento
            </Button>
            <Button variant="outline" onClick={handleVincular} disabled={validating || !selectedTemplate}>
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Vincular
            </Button>
            <Button onClick={handleBaixar} disabled={!validated || !generatedBlob} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <FileDown className="w-4 h-4" /> Baixar Documento
            </Button>
          </div>

          {validated && (
            <p className="text-center text-xs text-success mt-4">
              <FileCheck2 className="w-3 h-3 inline mr-1" /> Variáveis preenchidas — pronto para baixar
            </p>
          )}
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => goToStep(4)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
        </div>
      </div>
    );
  }

  return null;
}
