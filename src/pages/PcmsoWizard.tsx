import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import {
  ArrowLeft, ArrowRight, Loader2, Plus, Save, Trash2, ChevronRight,
  ShieldCheck, GraduationCap, Users, Calendar as CalendarIcon, FileDown, Link2, FileCheck2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PcmsoTemplateHelper } from "@/components/PcmsoTemplateHelper";
import { PcmsoObservacoesPadraoModal } from "@/components/PcmsoObservacoesPadraoModal";
import { PcmsoCopyConfirmModal } from "@/components/PcmsoCopyConfirmModal";
import { renderHtmlTemplateToDocx } from "@/lib/htmlTemplate";
import {
  PcmsoSetor, PcmsoExame, PcmsoRevisao,
  PcmsoEpiBloco, PcmsoTreinBloco, PcmsoCronoItem,
  emptyExame, emptyEpiBloco, emptyEpiItem,
  emptyTreinBloco, emptyTreinItem, emptyCronoItem,
  copyPgrEpiBlocos, copyPgrTreinBlocos,
  copyPgrSnapshotIntoSetores, buildSetoresFromEmpresa,
} from "@/lib/copyPgrToPcmso";
import { gesOrder } from "@/lib/sortGes";

type AgentKey =
  | "agentes_fisicos" | "agentes_quimicos" | "agentes_biologicos"
  | "agentes_ergonomicos" | "agentes_acidentes" | "agentes_psicossociais";

const AGENT_FIELDS: { key: AgentKey; label: string }[] = [
  { key: "agentes_fisicos", label: "Agentes Físicos" },
  { key: "agentes_quimicos", label: "Agentes Químicos" },
  { key: "agentes_biologicos", label: "Agentes Biológicos" },
  { key: "agentes_ergonomicos", label: "Agentes Ergonômicos" },
  { key: "agentes_acidentes", label: "Agentes de Acidentes" },
  { key: "agentes_psicossociais", label: "Agentes Psicossociais" },
];

const STEP_LABELS = [
  "Identificação", "Exames", "EPI", "Treinamentos", "Cronograma", "Gerar Documento",
];

export default function PcmsoWizard() {
  const navigate = useNavigate();
  const { documentoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [activeSetorIdx, setActiveSetorIdx] = useState<number | null>(null);

  // Identification
  const [empresaId, setEmpresaId] = useState<string>("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaData, setEmpresaData] = useState<any>({});
  const [contratoData, setContratoData] = useState<any>({});
  const [contratoId, setContratoId] = useState<string>("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [revisoes, setRevisoes] = useState<PcmsoRevisao[]>([]);
  const [setores, setSetores] = useState<PcmsoSetor[]>([]);
  const [epiBlocos, setEpiBlocos] = useState<PcmsoEpiBloco[]>([]);
  const [treinBlocos, setTreinBlocos] = useState<PcmsoTreinBloco[]>([]);
  const [cronograma, setCronograma] = useState<PcmsoCronoItem[]>([]);

  // Modals
  const [askEpi, setAskEpi] = useState(false);
  const [askTrein, setAskTrein] = useState(false);
  const [vincularExamesIdx, setVincularExamesIdx] = useState<number | null>(null);
  const [vincularOrigemIdx, setVincularOrigemIdx] = useState<string>("");

  // Gerar Documento
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string>("");
  const [savedFilePath, setSavedFilePath] = useState<string>("");

  const { data: templates = [] } = useQuery({
    queryKey: ["templates-pcmso"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("id,title,file_path").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: setoresEmpresa = [] } = useQuery({
    queryKey: ["setores-empresa-pcmso", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await supabase.from("setores")
        .select("id,nome_setor,descricao_ambiente,ghe_ges")
        .eq("empresa_id", empresaId)
        .order("nome_setor");
      return data || [];
    },
  });

  const { data: funcoesEmpresa = [] } = useQuery({
    queryKey: ["funcoes-pcmso", empresaId, (setoresEmpresa as any[]).map((s) => s.id).join(",")],
    enabled: !!empresaId,
    queryFn: async () => {
      const ids = (setoresEmpresa as any[]).map((s: any) => s.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("funcoes")
        .select("id,nome_funcao,setor_id,cbo_codigo,cbo_descricao,descricao_atividades,expostos")
        .in("setor_id", ids)
        .order("nome_funcao");
      return data || [];
    },
  });

  const { data: catTreinamentos = [] } = useQuery({
    queryKey: ["treinamentos_cadastro"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("treinamentos_cadastro").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    (async () => {
      if (!documentoId) { navigate("/documentos"); return; }
      const { data, error } = await supabase
        .from("pcmso_documentos").select("*").eq("id", documentoId).maybeSingle();
      if (error || !data) { toast.error("PCMSO não encontrado"); navigate("/documentos"); return; }
      setEmpresaId(data.empresa_id || "");
      setResponsavelTecnico(data.responsavel_tecnico || "");
      setCrea(data.crea || "");
      setCargo(data.cargo || "");
      setVigenciaInicio(data.vigencia_inicio || "");
      setVigenciaFim(data.vigencia_fim || "");
      setRevisoes((data.revisoes as any) || []);
      setSetores((data.setores_snapshot as any) || []);
      setEpiBlocos((data.epi_blocos as any) || []);
      setTreinBlocos((data.treinamento_blocos as any) || []);
      setCronograma((data.cronograma as any) || []);
      setSelectedTemplate(data.template_id || "");
      setSavedFilePath(data.file_path || "");
      setStep(data.current_step || 0);
      setContratoId(data.contrato_id || "");
      if (data.empresa_id) {
        const { data: emp } = await supabase.from("empresas").select("*").eq("id", data.empresa_id).maybeSingle();
        if (emp) {
          setEmpresaData(emp);
          setEmpresaNome(emp.razao_social || emp.nome_fantasia || "");
        }
      }
      if (data.contrato_id) {
        const { data: ctr } = await (supabase as any).from("contratos").select("*").eq("id", data.contrato_id).maybeSingle();
        if (ctr) setContratoData(ctr);
      }
      setLoading(false);
    })();
  }, [documentoId, navigate]);

  // ============ Auto-sync agentes do PGR ao entrar na Etapa 2 (Exames) ============
  const [pgrSynced, setPgrSynced] = useState<string>(""); // marca empresa já sincronizada nesta sessão
  useEffect(() => {
    if (loading) return;
    if (step !== 1) return;
    if (!empresaId) return;
    if (pgrSynced === empresaId) return;
    (async () => {
      let base = setores;
      if (base.length === 0) {
        base = await buildSetoresFromEmpresa(empresaId);
      }
      const merged = await copyPgrSnapshotIntoSetores(empresaId, base);
      setSetores(merged);
      setPgrSynced(empresaId);
    })();
  }, [step, empresaId, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (opts?: { silent?: boolean; newStep?: number; extra?: any }) => {
    if (!documentoId) return;
    setSaving(true);
    const payload: any = {
      responsavel_tecnico: responsavelTecnico,
      crea, cargo,
      vigencia_inicio: vigenciaInicio || null,
      vigencia_fim: vigenciaFim || null,
      revisoes: revisoes as any,
      setores_snapshot: setores as any,
      epi_blocos: epiBlocos as any,
      treinamento_blocos: treinBlocos as any,
      cronograma: cronograma as any,
      current_step: opts?.newStep ?? step,
      ...(opts?.extra || {}),
    };
    const { error } = await supabase.from("pcmso_documentos").update(payload).eq("id", documentoId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    if (!opts?.silent) toast.success("Salvo");
  };

  const goToStep = async (n: number) => {
    await save({ silent: true, newStep: n });
    setStep(n);
    setActiveSetorIdx(null);
  };

  // ============ Step transitions with copy modals ============
  const tryGoToEpi = async () => {
    if (epiBlocos.length === 0) { setAskEpi(true); return; }
    await goToStep(2);
  };
  const tryGoToTrein = async () => {
    if (treinBlocos.length === 0) { setAskTrein(true); return; }
    await goToStep(3);
  };

  const confirmEpiCopy = async (yes: boolean) => {
    setAskEpi(false);
    if (yes && empresaId) {
      const copied = await copyPgrEpiBlocos(empresaId);
      setEpiBlocos(copied.length ? copied : [emptyEpiBloco()]);
    } else {
      setEpiBlocos([emptyEpiBloco()]);
    }
    await goToStep(2);
  };
  const confirmTreinCopy = async (yes: boolean) => {
    setAskTrein(false);
    if (yes && empresaId) {
      const copied = await copyPgrTreinBlocos(empresaId);
      setTreinBlocos(copied.length ? copied : [emptyTreinBloco()]);
    } else {
      setTreinBlocos([emptyTreinBloco()]);
    }
    await goToStep(3);
  };

  // ============ Revisões ============
  const addRevisao = () => setRevisoes((r) => [...r, { revisao: String(r.length + 1), data: "", motivo: "", responsavel: "" }]);
  const updateRevisao = (i: number, patch: Partial<PcmsoRevisao>) =>
    setRevisoes((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeRevisao = (i: number) => setRevisoes((r) => r.filter((_, idx) => idx !== i));

  // ============ Setor ============
  const updateSetor = (i: number, patch: Partial<PcmsoSetor>) =>
    setSetores((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  // ============ Funções multi-select ============
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

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  );

  const activeSetor = activeSetorIdx !== null ? setores[activeSetorIdx] : null;

  // ============ STEP 1.5 — Detalhe do setor ============
  if (step === 1 && activeSetor && activeSetorIdx !== null) {
    return (
      <SetorDetail
        setor={activeSetor}
        onBack={() => setActiveSetorIdx(null)}
        onChange={(patch) => updateSetor(activeSetorIdx, patch)}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="PCMSO"
        description={empresaNome}
        actions={
          <div className="flex items-center gap-2">
            <PcmsoTemplateHelper />
            <Button variant="outline" onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STEP_LABELS.map((label, i) => (
          <button key={i} onClick={() => goToStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${step === i ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border text-muted-foreground"}`}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* ====== STEP 0 — Identificação ====== */}
      {step === 0 && (
        <div className="space-y-6">
          <Card><CardContent className="pt-6 space-y-4">
            <h3 className="font-heading font-semibold">Dados de identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa</Label><Input value={empresaNome} disabled className="mt-1" /></div>
              <div><Label>Responsável Técnico</Label><Input value={responsavelTecnico} onChange={(e) => setResponsavelTecnico(e.target.value)} className="mt-1" /></div>
              <div><Label>CREA</Label><Input value={crea} onChange={(e) => setCrea(e.target.value)} className="mt-1" /></div>
              <div><Label>Cargo</Label><Input value={cargo} onChange={(e) => setCargo(e.target.value)} className="mt-1" /></div>
              <div><Label>Vigência Início</Label><Input type="date" value={vigenciaInicio} onChange={(e) => setVigenciaInicio(e.target.value)} className="mt-1" /></div>
              <div><Label>Vigência Fim</Label><Input type="date" value={vigenciaFim} onChange={(e) => setVigenciaFim(e.target.value)} className="mt-1" /></div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">Revisões</h3>
              <Button size="sm" variant="outline" onClick={addRevisao}><Plus className="w-4 h-4 mr-1" />Adicionar Revisão</Button>
            </div>
            {revisoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma revisão adicionada.</p>
            ) : (
              <div className="space-y-3">
                {revisoes.map((r, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 rounded-md border border-border">
                    <div className="md:col-span-2"><Label className="text-xs">Revisão</Label><Input value={r.revisao} onChange={(e) => updateRevisao(i, { revisao: e.target.value })} /></div>
                    <div className="md:col-span-2"><Label className="text-xs">Data</Label><Input type="date" value={r.data} onChange={(e) => updateRevisao(i, { data: e.target.value })} /></div>
                    <div className="md:col-span-4"><Label className="text-xs">Motivo</Label><Input value={r.motivo} onChange={(e) => updateRevisao(i, { motivo: e.target.value })} /></div>
                    <div className="md:col-span-3"><Label className="text-xs">Responsável</Label><Input value={r.responsavel} onChange={(e) => updateRevisao(i, { responsavel: e.target.value })} /></div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeRevisao(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => navigate("/documentos")}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
            <Button onClick={() => goToStep(1)}>Próxima etapa<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ====== STEP 1 — Exames (lista de setores) ====== */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold">Setores da empresa</h3>
            <p className="text-xs text-muted-foreground">Clique em um setor para dimensionar agentes e exames</p>
          </div>
          {setores.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-muted-foreground">Nenhum setor cadastrado para esta empresa.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/setores-funcoes")}>Ir para Setores e Funções</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(() => {
                const gheMap: Record<string, string> = {};
                (setoresEmpresa as any[]).forEach((x: any) => { gheMap[x.id] = x.ghe_ges || ""; });
                const ordered = setores
                  .map((s, i) => ({ s, i, ghe: (s.setor_id && gheMap[s.setor_id]) || "" }))
                  .sort((a, b) => gesOrder(a.ghe) - gesOrder(b.ghe));
                return ordered.map(({ s, i, ghe }) => (
                <div key={i} className="text-left p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => setActiveSetorIdx(i)} className="flex-1 text-left">
                      <div className="font-heading font-semibold text-foreground">
                        {ghe ? `${ghe} — ` : ""}{s.nome_setor}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{s.exames.length} exames</Badge>
                        <Badge variant="outline" className="text-xs">
                          {AGENT_FIELDS.reduce((sum, a) => sum + (s[a.key] as string[]).length, 0)} agentes
                        </Badge>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="Vincular Exames de outro setor"
                        onClick={(e) => { e.stopPropagation(); setVincularExamesIdx(i); }}>
                        <Link2 className="w-4 h-4 text-accent" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                ));
              })()}
            </div>
          )}
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => goToStep(0)}><ArrowLeft className="w-4 h-4 mr-1" />Etapa anterior</Button>
            <Button onClick={tryGoToEpi}>Próxima etapa<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ====== STEP 2 — EPI ====== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-heading font-semibold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> EPI</h3>
            <p className="text-xs text-muted-foreground">Vincule EPIs às funções da empresa</p>
          </div>

          {epiBlocos.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum bloco de funções cadastrado.</p>
              <Button className="mt-4" onClick={() => setEpiBlocos([emptyEpiBloco()])}><Plus className="w-4 h-4 mr-1" /> Adicionar bloco</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {epiBlocos.map((b, bi) => (
                <Card key={b.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Label className="text-xs font-bold uppercase">Funções *</Label>
                      <div className="mt-1">
                        <FuncoesMultiSelect
                          value={b.funcao_ids}
                          onChange={(v) => setEpiBlocos((arr) => arr.map((x, i) => i === bi ? { ...x, funcao_ids: v } : x))}
                        />
                      </div>
                      {b.funcao_ids.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">{funcoesNomes(b.funcao_ids)}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive"
                      onClick={() => setEpiBlocos((arr) => arr.filter((_, i) => i !== bi))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">EPIs vinculados</h4>
                      <Button variant="outline" size="sm"
                        onClick={() => setEpiBlocos((arr) => arr.map((x, i) => i === bi ? { ...x, epis: [...x.epis, emptyEpiItem()] } : x))}>
                        <Plus className="w-4 h-4 mr-1" /> EPI
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {b.epis.map((it, ii) => (
                        <div key={it.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_auto] gap-2 items-end border rounded-lg p-3">
                          <div>
                            <Label className="text-xs">Nome do EPI</Label>
                            <Input className="mt-1" value={it.nome_epi}
                              onChange={(e) => setEpiBlocos((arr) => arr.map((x, i) => i === bi ? { ...x, epis: x.epis.map((y, j) => j === ii ? { ...y, nome_epi: e.target.value } : y) } : x))} />
                          </div>
                          <div>
                            <Label className="text-xs">Número CA</Label>
                            <Input className="mt-1" value={it.ca}
                              onChange={(e) => setEpiBlocos((arr) => arr.map((x, i) => i === bi ? { ...x, epis: x.epis.map((y, j) => j === ii ? { ...y, ca: e.target.value } : y) } : x))} />
                          </div>
                          <div>
                            <Label className="text-xs">Classificação do uso</Label>
                            <Select value={it.uso}
                              onValueChange={(v) => setEpiBlocos((arr) => arr.map((x, i) => i === bi ? { ...x, epis: x.epis.map((y, j) => j === ii ? { ...y, uso: v } : y) } : x))}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Contínuo">Contínuo</SelectItem>
                                <SelectItem value="Eventual">Eventual</SelectItem>
                                <SelectItem value="Não aplicado">Não aplicado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive"
                            onClick={() => setEpiBlocos((arr) => arr.map((x, i) => i === bi ? { ...x, epis: x.epis.filter((_, j) => j !== ii) } : x))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="outline" onClick={() => setEpiBlocos((arr) => [...arr, emptyEpiBloco()])}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar bloco
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => goToStep(1)}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
            <Button onClick={tryGoToTrein}>Próxima etapa<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ====== STEP 3 — Treinamentos ====== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-heading font-semibold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-accent" /> Treinamentos</h3>
            <p className="text-xs text-muted-foreground">Vincule treinamentos às funções</p>
          </div>

          {treinBlocos.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum treinamento adicionado.</p>
              <Button className="mt-4" onClick={() => setTreinBlocos([emptyTreinBloco()])}><Plus className="w-4 h-4 mr-1" /> Treinamento</Button>
              {(catTreinamentos as any[]).length === 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Cadastre treinamentos em <strong>Cadastros &gt; Treinamentos</strong> para selecioná-los aqui.
                </p>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {treinBlocos.map((b, bi) => {
                const tSel = (catTreinamentos as any[]).find(t => t.id === b.treinamento_id);
                return (
                  <Card key={b.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-bold uppercase">Treinamento *</Label>
                          <Select value={b.treinamento_id || ""} onValueChange={(v) => setTreinBlocos(arr => arr.map((x, i) => i === bi ? { ...x, treinamento_id: v } : x))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={(catTreinamentos as any[]).length === 0 ? "Nenhum treinamento cadastrado" : "Selecione um treinamento"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(catTreinamentos as any[]).map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {tSel && (
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              {[tSel.carga_horaria && `CH: ${tSel.carga_horaria}`, tSel.periodicidade].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-bold uppercase">Funções Vinculadas *</Label>
                          <div className="mt-1">
                            <FuncoesMultiSelect value={b.funcao_ids} onChange={(v) => setTreinBlocos(arr => arr.map((x, i) => i === bi ? { ...x, funcao_ids: v } : x))} />
                          </div>
                          {b.funcao_ids.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1.5">{funcoesNomes(b.funcao_ids)}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive"
                        onClick={() => setTreinBlocos((arr) => arr.filter((_, i) => i !== bi))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
              <Button variant="outline" onClick={() => setTreinBlocos((arr) => [...arr, emptyTreinBloco()])}>
                <Plus className="w-4 h-4 mr-1" /> Treinamento
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => goToStep(2)}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
            <Button onClick={() => goToStep(4)}>Próxima etapa<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ====== STEP 4 — Cronograma PCMSO ====== */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-heading font-semibold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-accent" /> Cronograma PCMSO</h3>
            <p className="text-xs text-muted-foreground">Ações, responsáveis e prazos do PCMSO (independente do PGR)</p>
          </div>

          <Card className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="p-2 w-[10%]">Item</th>
                    <th className="p-2">Ação</th>
                    <th className="p-2 w-[16%]">Responsável</th>
                    <th className="p-2 w-[14%]">Prazo</th>
                    <th className="p-2 w-[12%]">Situação</th>
                    <th className="p-2">Observações</th>
                    <th className="p-2 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {cronograma.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma ação. Clique em "Adicionar ação" abaixo.</td></tr>
                  )}
                  {cronograma.map((c, ci) => (
                    <tr key={c.id} className="border-b align-top">
                      <td className="p-2"><Input value={c.item} onChange={(e) => setCronograma(arr => arr.map((x, i) => i === ci ? { ...x, item: e.target.value } : x))} placeholder="01" /></td>
                      <td className="p-2"><Textarea rows={2} value={c.acao} onChange={(e) => setCronograma(arr => arr.map((x, i) => i === ci ? { ...x, acao: e.target.value } : x))} /></td>
                      <td className="p-2"><Input value={c.responsavel} onChange={(e) => setCronograma(arr => arr.map((x, i) => i === ci ? { ...x, responsavel: e.target.value } : x))} /></td>
                      <td className="p-2"><Input value={c.prazo} placeholder="Ex: Mar/2026" onChange={(e) => setCronograma(arr => arr.map((x, i) => i === ci ? { ...x, prazo: e.target.value } : x))} /></td>
                      <td className="p-2">
                        <Select value={c.situacao} onValueChange={(v) => setCronograma(arr => arr.map((x, i) => i === ci ? { ...x, situacao: v } : x))}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Previsto">Previsto</SelectItem>
                            <SelectItem value="Realizado">Realizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2"><Textarea rows={2} value={c.observacao} onChange={(e) => setCronograma(arr => arr.map((x, i) => i === ci ? { ...x, observacao: e.target.value } : x))} /></td>
                      <td className="p-2 text-center">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCronograma(arr => arr.filter((_, i) => i !== ci))}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setCronograma(arr => [...arr, emptyCronoItem()])}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar ação
              </Button>
            </div>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => goToStep(3)}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
            <Button onClick={() => goToStep(5)}>Próxima etapa<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ====== STEP 5 — Gerar Documento ====== */}
      {step === 5 && (
        <GerarDocumentoStep
          docId={documentoId!}
          empresaNome={empresaNome}
          templates={templates as any[]}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          validating={validating} setValidating={setValidating}
          validated={validated} setValidated={setValidated}
          generating={generating} setGenerating={setGenerating}
          generatedBlob={generatedBlob} setGeneratedBlob={setGeneratedBlob}
          generatedFileName={generatedFileName} setGeneratedFileName={setGeneratedFileName}
          savedFilePath={savedFilePath} setSavedFilePath={setSavedFilePath}
          buildData={() => buildTemplateData({
            empresaNome, responsavelTecnico, crea, cargo,
            vigenciaInicio, vigenciaFim, revisoes,
            setores, epiBlocos, treinBlocos, cronograma,
            funcoesEmpresa: funcoesEmpresa as any[],
            setoresEmpresa: setoresEmpresa as any[],
            catTreinamentos: catTreinamentos as any[],
            empresaData, contratoData,
          })}
          onSave={save}
          onBack={() => goToStep(4)}
        />
      )}

      <PcmsoCopyConfirmModal open={askEpi} onOpenChange={setAskEpi}
        title="Deseja copiar os EPIs cadastrados no PGR?"
        onYes={() => confirmEpiCopy(true)} onNo={() => confirmEpiCopy(false)} />
      <PcmsoCopyConfirmModal open={askTrein} onOpenChange={setAskTrein}
        title="Deseja copiar os treinamentos cadastrados no PGR?"
        onYes={() => confirmTreinCopy(true)} onNo={() => confirmTreinCopy(false)} />

      <Dialog open={vincularExamesIdx !== null} onOpenChange={(o) => { if (!o) { setVincularExamesIdx(null); setVincularOrigemIdx(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar exames de outro setor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Setor Destino</Label>
              <Input value={vincularExamesIdx !== null ? (setores[vincularExamesIdx]?.nome_setor || "") : ""} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Setor Origem *</Label>
              <Select value={vincularOrigemIdx} onValueChange={setVincularOrigemIdx}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o setor origem" /></SelectTrigger>
                <SelectContent>
                  {setores.map((s, i) => (
                    i !== vincularExamesIdx && (
                      <SelectItem key={i} value={String(i)}>{s.nome_setor} ({s.exames.length} exames)</SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setVincularExamesIdx(null); setVincularOrigemIdx(""); }}>Cancelar</Button>
              <Button onClick={() => {
                if (vincularExamesIdx === null || !vincularOrigemIdx) return;
                const origemIdx = Number(vincularOrigemIdx);
                const destinoIdx = vincularExamesIdx;
                const origem = setores[origemIdx];
                const destino = setores[destinoIdx];
                if (!origem || !destino) return;
                const existentes = new Set((destino.exames || []).map(e => (e.tipo_exame || "").trim().toLowerCase()).filter(Boolean));
                const novos = (origem.exames || []).filter(e => {
                  const k = (e.tipo_exame || "").trim().toLowerCase();
                  return k && !existentes.has(k);
                }).map(e => ({ ...e }));
                if (novos.length === 0) {
                  toast.info("Nenhum exame novo para copiar (todos já existem).");
                } else {
                  setSetores(arr => arr.map((s, i) => i === destinoIdx ? { ...s, exames: [...s.exames, ...novos] } : s));
                  toast.success(`Exames copiados com sucesso. (${novos.length} novo${novos.length > 1 ? "s" : ""})`);
                }
                setVincularExamesIdx(null);
                setVincularOrigemIdx("");
              }} disabled={!vincularOrigemIdx}>Copiar Exames</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================================================================================
// ============ Sub: Detalhe do Setor (exames) ============
// =================================================================================
function SetorDetail({
  setor, onBack, onChange,
}: { setor: PcmsoSetor; onBack: () => void; onChange: (patch: Partial<PcmsoSetor>) => void; }) {
  const updateAgents = (key: AgentKey, value: string) => {
    const arr = value.split("\n").map((x) => x.trim()).filter(Boolean);
    onChange({ [key]: arr } as any);
  };
  const updateExame = (i: number, patch: Partial<PcmsoExame>) =>
    onChange({ exames: setor.exames.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const removeExame = (i: number) => onChange({ exames: setor.exames.filter((_, idx) => idx !== i) });
  const addExame = () => onChange({ exames: [...setor.exames, emptyExame()] });

  return (
    <div>
      <PageHeader title={setor.nome_setor} description="Dimensionamento de exames do setor"
        actions={<Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" />Voltar aos setores</Button>} />

      <Card className="mb-4"><CardContent className="pt-6 space-y-4">
        <h3 className="font-heading font-semibold">Funções</h3>
        <Textarea value={setor.funcoes} onChange={(e) => onChange({ funcoes: e.target.value })} rows={2}
          placeholder="Funções deste setor (separadas por vírgula)" />
      </CardContent></Card>

      <Card className="mb-4"><CardContent className="pt-6 space-y-4">
        <h3 className="font-heading font-semibold">Agentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENT_FIELDS.map((af) => (
            <div key={af.key}>
              <Label className="text-xs font-bold uppercase">{af.label}</Label>
              <Textarea value={(setor[af.key] as string[]).join("\n")} onChange={(e) => updateAgents(af.key, e.target.value)}
                rows={4} placeholder="Um agente por linha" className="mt-1 font-mono text-sm" />
            </div>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Exames</h3>
          <Button size="sm" variant="outline" onClick={addExame}><Plus className="w-4 h-4 mr-1" />Adicionar Exame</Button>
        </div>
        {setor.exames.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum exame adicionado.</p>
        ) : (
          <div className="space-y-4">
            {setor.exames.map((ex, i) => (
              <ExameCard key={i} exame={ex} index={i}
                onChange={(p) => updateExame(i, p)}
                onRemove={() => removeExame(i)} />
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

function ExameCard({
  exame, index, onChange, onRemove,
}: { exame: PcmsoExame; index: number; onChange: (p: Partial<PcmsoExame>) => void; onRemove: () => void; }) {
  const { data: examesCad = [] } = useQuery({
    queryKey: ["exames_cadastro"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("exames_cadastro").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const handleSelectExame = (nome: string) => {
    const found = (examesCad as any[]).find((e) => e.nome === nome);
    if (found) {
      onChange({
        tipo_exame: found.nome,
        cod_esocial: found.codigo_esocial || "",
        descricao_esocial: found.descricao_esocial || "",
      });
    } else {
      onChange({ tipo_exame: nome });
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-muted-foreground">Exame {index + 1}</span>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={onRemove}><Trash2 className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Tipo de Exame</Label>
          <Select value={exame.tipo_exame || ""} onValueChange={handleSelectExame}>
            <SelectTrigger><SelectValue placeholder="Selecione um exame" /></SelectTrigger>
            <SelectContent>
              {(examesCad as any[]).length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground">Nenhum exame cadastrado. Cadastre em Cadastros → Exames.</div>
              ) : (
                (examesCad as any[]).map((e: any) => (
                  <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Código eSocial</Label><Input value={exame.cod_esocial} readOnly className="bg-muted/40" /></div>
        <div><Label className="text-xs">Descrição eSocial</Label><Input value={exame.descricao_esocial} readOnly className="bg-muted/40" /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
        <SwitchField label="Admissional" checked={exame.admissional} onChange={(v) => onChange({ admissional: v })} />
        <SwitchField label="Periódico" checked={exame.periodico} onChange={(v) => onChange({ periodico: v })} />
        <SwitchField label="Retorno ao Trabalho" checked={exame.retorno_trabalho} onChange={(v) => onChange({ retorno_trabalho: v })} />
        <SwitchField label="Mudança de Função" checked={exame.mudanca_funcao} onChange={(v) => onChange({ mudanca_funcao: v })} />
        <SwitchField label="Demissional" checked={exame.demissional} onChange={(v) => onChange({ demissional: v })} />
      </div>
      {exame.periodico && (
        <div><Label className="text-xs">Período</Label><Input value={exame.periodo} onChange={(e) => onChange({ periodo: e.target.value })} placeholder="Ex.: 12 meses" /></div>
      )}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Observações</Label>
          <PcmsoObservacoesPadraoModal currentText={exame.observacao} onApply={(t) => onChange({ observacao: t })} />
        </div>
        <Textarea value={exame.observacao} onChange={(e) => onChange({ observacao: e.target.value })} rows={3} />
      </div>
    </div>
  );
}

function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md border border-border">
      <span className="text-xs">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// =================================================================================
// ============ Build template data ============
// =================================================================================
function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString("pt-BR") : ""; }
function bool(b: boolean) { return b ? "Sim" : "Não"; }

function buildTemplateData(args: {
  empresaNome: string; responsavelTecnico: string; crea: string; cargo: string;
  vigenciaInicio: string; vigenciaFim: string; revisoes: PcmsoRevisao[];
  setores: PcmsoSetor[]; epiBlocos: PcmsoEpiBloco[]; treinBlocos: PcmsoTreinBloco[];
  cronograma: PcmsoCronoItem[]; funcoesEmpresa: any[]; setoresEmpresa: any[];
  catTreinamentos: any[];
  empresaData?: any; contratoData?: any;
}) {
  const {
    empresaNome, responsavelTecnico, crea, cargo, vigenciaInicio, vigenciaFim,
    revisoes, setores, epiBlocos, treinBlocos, cronograma, funcoesEmpresa, setoresEmpresa,
    catTreinamentos, empresaData = {}, contratoData = {},
  } = args;

  const setorDbMap: Record<string, any> = {};
  (setoresEmpresa || []).forEach((s: any) => { setorDbMap[s.id] = s; });

  const funcoesPorSetor: Record<string, any[]> = {};
  (funcoesEmpresa || []).forEach((f: any) => {
    if (!f.setor_id) return;
    (funcoesPorSetor[f.setor_id] ||= []).push({
      nome_funcao: f.nome_funcao || "",
      cbo: f.cbo_codigo || f.cbo_descricao || "",
      descricao_atividades: f.descricao_atividades || "",
      expostos: f.expostos || "",
    });
  });

  // Map função -> setor name
  const funcaoSetorMap: Record<string, string> = {};
  (funcoesEmpresa || []).forEach((f: any) => {
    const setor = (setoresEmpresa || []).find((s: any) => s.id === f.setor_id);
    funcaoSetorMap[f.id] = setor?.nome_setor || "";
  });

  const setoresArr = (setores || []).map((s) => {
    const db = (s.setor_id && setorDbMap[s.setor_id]) || {};
    const funcoesArr = (s.setor_id && funcoesPorSetor[s.setor_id]) || [];
    return {
      nome_setor: s.nome_setor || "",
      descricao_ambiente: db.descricao_ambiente || "",
      ghe_ges: db.ghe_ges || "",
      ghe: db.ghe_ges || "",
      ges: db.ghe_ges || "",
      funcoes: funcoesArr,
      funcoes_lista: funcoesArr.map((f) => f.nome_funcao).join(", ") || (s.funcoes || ""),
      agentes_fisicos: (s.agentes_fisicos || []).join(", "),
      agentes_quimicos: (s.agentes_quimicos || []).join(", "),
      agentes_biologicos: (s.agentes_biologicos || []).join(", "),
      agentes_ergonomicos: (s.agentes_ergonomicos || []).join(", "),
      agentes_acidentes: (s.agentes_acidentes || []).join(", "),
      agentes_psicossociais: (s.agentes_psicossociais || []).join(", "),
      exames: (s.exames || []).map((e) => ({
        tipo_exame: e.tipo_exame || "",
        cod_esocial: e.cod_esocial || "",
        descricao_esocial: e.descricao_esocial || "",
        admissional: bool(e.admissional),
        periodico: bool(e.periodico),
        periodo: e.periodo || "",
        retorno_trabalho: bool(e.retorno_trabalho),
        mudanca_funcao: bool(e.mudanca_funcao),
        demissional: bool(e.demissional),
        observacao: e.observacao || "",
      })),
    };
  });
  // Ordenar setores por número do GHE/GES (crescente)
  setoresArr.sort((a: any, b: any) => gesOrder(a.ghe_ges) - gesOrder(b.ghe_ges));

  // EPIs — 1 bloco = 1 grupo (funcoes em lista vertical + tabela de EPIs)
  const epis: any[] = [];
  const episFlat: any[] = [];
  const epiListaLines: string[] = [];
  (epiBlocos || []).forEach((b) => {
    const funcs = (funcoesEmpresa || []).filter((f) => (b.funcao_ids || []).includes(f.id));
    const funcNomes = funcs.map((f) => f.nome_funcao || "").filter(Boolean);
    const setoresNomes = Array.from(new Set(funcs.map((f) => funcaoSetorMap[f.id] || "").filter(Boolean)));
    const itens = (b.epis || []).map((e) => ({
      epi_nome: e.nome_epi || "",
      epi_ca: e.ca || "",
      epi_classificacao_uso: e.uso || "",
      epi_situacao: "Ativo",
      // aliases (compat)
      nome_epi: e.nome_epi || "",
      ca: e.ca || "",
      uso: e.uso || "",
      situacao: "Ativo",
      epi: { nome: e.nome_epi || "", ca: e.ca || "", uso: e.uso || "" },
    }));
    epis.push({
      epi_funcoes: funcNomes.join("\n"),
      epi_funcoes_lista: funcNomes.join("\n"),
      epi_funcoes_inline: funcNomes.join(", "),
      epi_setores: setoresNomes.join("\n"),
      funcoes: funcNomes.map((n) => ({ nome_funcao: n })),
      itens_epi: itens,
      epis_itens: itens,
    });
    funcs.forEach((f) => {
      const setorNome = funcaoSetorMap[f.id] || "";
      (b.epis || []).forEach((e) => {
        episFlat.push({
          epi_nome: e.nome_epi || "",
          epi_ca: e.ca || "",
          epi_classificacao_uso: e.uso || "",
          epi_situacao: "Ativo",
          epi_setor: setorNome,
          epi_funcao: f.nome_funcao || "",
          epi_finalidade: e.uso || "",
          epi_periodicidade: "",
          epi_descricao: "",
          funcao: { nome: f.nome_funcao || "" },
          epi: { nome: e.nome_epi || "", ca: e.ca || "", uso: e.uso || "" },
        });
        epiListaLines.push(`${e.nome_epi || ""}${e.ca ? ` (CA ${e.ca})` : ""} — ${f.nome_funcao || ""}`);
      });
    });
  });
  const epi_lista = epiListaLines.join("\n");

  // Treinamentos — 1 bloco = 1 entrada (sem duplicação por função)
  const treinamentos: any[] = [];
  const treinListaLines: string[] = [];
  (treinBlocos || []).forEach((b) => {
    const tCad = (catTreinamentos || []).find((t: any) => t.id === b.treinamento_id);
    const funcs = (funcoesEmpresa || []).filter((f) => (b.funcao_ids || []).includes(f.id));
    const funcNomes = funcs.map(f => f.nome_funcao || "").filter(Boolean);
    const setoresNomes = Array.from(new Set(funcs.map(f => funcaoSetorMap[f.id] || "").filter(Boolean)));
    const nome = tCad?.nome || "";
    const ch = tCad?.carga_horaria || "";
    const per = tCad?.periodicidade || "";
    const obs = tCad?.observacoes || "";
    const row = {
      funcao: { nome: funcNomes.join(", ") },
      treinamento: { nome, carga_horaria: ch, periodicidade: per, observacao: obs },
      treinamento_nome: nome,
      treinamento_carga_horaria: ch,
      treinamento_periodicidade: per,
      treinamento_validade: per,
      treinamento_data_realizacao: "",
      treinamento_data_vencimento: "",
      treinamento_instrutor: "",
      treinamento_responsavel: "",
      treinamento_funcao: funcNomes.join(", "),
      treinamento_setor: setoresNomes.join(", "),
      treinamento_observacao: obs,
      // funções em lista vertical (uma por linha)
      treinamento_funcoes: funcNomes.join("\n"),
      treinamento_funcoes_lista: funcNomes.join("\n"),
      treinamento_funcoes_inline: funcNomes.join(", "),
      funcoes: funcNomes.map((n) => ({ nome_funcao: n })),
      itens_funcoes: funcNomes.map((n) => ({ nome_funcao: n })),
    };
    treinamentos.push(row);
    treinListaLines.push(`${nome}${ch ? ` — ${ch}` : ""}${per ? ` — ${per}` : ""} — ${funcNomes.join(", ")}`);
  });
  const treinamento_lista = treinListaLines.join("\n");

  const cronograma_pcmso = (cronograma || []).map((c) => ({
    item: c.item || "",
    acao: c.acao || "",
    responsavel: c.responsavel || "",
    prazo: c.prazo || "",
    situacao: c.situacao || "",
    observacao: c.observacao || "",
  }));

  // Empresa + Contrato (preferir dados do contrato quando existirem)
  const emp = empresaData || {};
  const ctr = contratoData || {};
  const pick = (a: any, b: any) => (a !== undefined && a !== null && a !== "" ? a : (b ?? ""));
  const descricaoAmbienteAgg = (setoresArr.map((s: any) => s.descricao_ambiente).filter(Boolean).join("\n"));

  return {
    empresa: empresaNome || emp.razao_social || emp.nome_fantasia || "",
    responsavel_tecnico: responsavelTecnico || "",
    crea: crea || "",
    cargo: cargo || "",
    vigencia_inicio: fmtDate(pick(ctr.vigencia_inicio, vigenciaInicio)),
    vigencia_fim: fmtDate(pick(ctr.vigencia_fim, vigenciaFim)),
    // Dados da Empresa
    cnpj: emp.cnpj || "",
    cnpj_empresa: emp.cnpj || "",
    razao_social: emp.razao_social || empresaNome || "",
    nome_fantasia: emp.nome_fantasia || "",
    cnae_principal: emp.cnae_principal || "",
    grau_risco: emp.grau_risco || "",
    grau_risco_nr04: emp.grau_risco || "",
    endereco: emp.endereco || "",
    endereco_completo: emp.endereco || "",
    numero_funcionarios_fem: String(pick(ctr.numero_funcionarios_fem, emp.numero_funcionarios_fem ?? "")),
    numero_funcionarios_masc: String(pick(ctr.numero_funcionarios_masc, emp.numero_funcionarios_masc ?? "")),
    funcionarios_feminino: String(pick(ctr.numero_funcionarios_fem, emp.numero_funcionarios_fem ?? "")),
    funcionarios_masculino: String(pick(ctr.numero_funcionarios_masc, emp.numero_funcionarios_masc ?? "")),
    total_funcionarios: String(pick(ctr.total_funcionarios, emp.total_funcionarios ?? "")),
    jornada_trabalho: pick(ctr.jornada_trabalho, emp.jornada_trabalho),
    // Dados do Contrato
    numero_contrato: pick(ctr.numero_contrato, emp.numero_contrato),
    cnpj_contratante: pick(ctr.cnpj_contratante, emp.cnpj_contratante),
    nome_contratante: pick(ctr.nome_contratante, emp.nome_contratante),
    local_trabalho: pick(ctr.local_trabalho, emp.local_trabalho),
    escopo_contrato: pick(ctr.escopo_contrato, emp.escopo_contrato),
    gestor_nome: pick(ctr.gestor_nome, emp.gestor_nome),
    gestor_email: pick(ctr.gestor_email, emp.gestor_email),
    gestor_telefone: pick(ctr.gestor_telefone, emp.gestor_telefone),
    gestor_contrato: pick(ctr.gestor_nome, emp.gestor_nome),
    fiscal_nome: pick(ctr.fiscal_nome, emp.fiscal_nome),
    fiscal_email: pick(ctr.fiscal_email, emp.fiscal_email),
    fiscal_telefone: pick(ctr.fiscal_telefone, emp.fiscal_telefone),
    fiscal_contrato: pick(ctr.fiscal_nome, emp.fiscal_nome),
    preposto_nome: pick(ctr.preposto_nome, emp.preposto_nome),
    preposto_email: pick(ctr.preposto_email, emp.preposto_email),
    preposto_telefone: pick(ctr.preposto_telefone, emp.preposto_telefone),
    preposto_empresa: pick(ctr.preposto_nome, emp.preposto_nome),
    // Ambiente (agregado de todos os setores)
    descricao_ambiente: descricaoAmbienteAgg,
    revisoes: (revisoes || []).map((r) => ({
      revisao: r.revisao || "",
      data: fmtDate(r.data),
      motivo: r.motivo || "",
      responsavel: r.responsavel || "",
    })),
    setores: setoresArr,
    ghe_setores_funcoes: (() => {
      const arr = (setoresEmpresa || []).map((s: any) => {
        const funcs = (funcoesEmpresa || [])
          .filter((f: any) => f.setor_id === s.id)
          .map((f: any) => f.nome_funcao || "")
          .filter(Boolean);
        return {
          ghe_numero: s.ghe_ges || "",
          ghe_nome: s.ghe_ges || "",
          setor_nome: s.nome_setor || "",
          funcoes: funcs.join(", "),
        };
      });
      arr.sort((a: any, b: any) => gesOrder(a.ghe_numero) - gesOrder(b.ghe_numero));
      return arr;
    })(),
    epis,
    epis_flat: episFlat,
    epi_lista,
    treinamentos,
    treinamento_lista,
    cronograma_pcmso,
  };
}

// =================================================================================
// ============ Step 5: Gerar Documento ============
// =================================================================================
function GerarDocumentoStep(props: {
  docId: string; empresaNome: string; templates: any[];
  selectedTemplate: string; setSelectedTemplate: (v: string) => void;
  validating: boolean; setValidating: (v: boolean) => void;
  validated: boolean; setValidated: (v: boolean) => void;
  generating: boolean; setGenerating: (v: boolean) => void;
  generatedBlob: Blob | null; setGeneratedBlob: (b: Blob | null) => void;
  generatedFileName: string; setGeneratedFileName: (s: string) => void;
  savedFilePath: string; setSavedFilePath: (s: string) => void;
  buildData: () => any;
  onSave: (opts?: { silent?: boolean; newStep?: number; extra?: any }) => Promise<void>;
  onBack: () => void;
}) {
  const {
    docId, empresaNome, templates,
    selectedTemplate, setSelectedTemplate,
    validating, setValidating, validated, setValidated,
    generating, setGenerating,
    generatedBlob, setGeneratedBlob,
    generatedFileName, setGeneratedFileName,
    savedFilePath, setSavedFilePath,
    buildData, onSave, onBack,
  } = props;

  const [salvando, setSalvando] = useState(false);

  const handleSalvarDocumento = async () => {
    setSalvando(true);
    try {
      await onSave({ silent: true, extra: { template_id: selectedTemplate || null } });
      toast.success("Documento salvo");
    } finally {
      setSalvando(false);
    }
  };

  const loadTemplateDoc = async () => {
    const tpl: any = templates.find((t) => t.id === selectedTemplate);
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
    return new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      nullGetter: () => "",
    });
  };

  const handleVincular = async () => {
    if (!selectedTemplate) { toast.error("Selecione um template"); return; }
    setValidating(true); setValidated(false); setGeneratedBlob(null);
    try {
      const doc = await loadTemplateDoc();
      const data = buildData();
      doc.render(data);
      const output: Blob = (doc as any).kind === "html"
        ? await (doc as any).toBlob()
        : (doc as any).getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const fileName = `PCMSO_${(empresaNome || "documento").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getFullYear()}.docx`;
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

  const handleGerar = async () => {
    if (!generatedBlob) { toast.error("Vincule o documento antes"); return; }
    setGenerating(true);
    try {
      const storagePath = `documentos/${Date.now()}_${generatedFileName}`;
      const { error: upErr } = await supabase.storage.from("templates").upload(storagePath, generatedBlob);
      if (upErr) throw upErr;
      setSavedFilePath(storagePath);
      await onSave({
        silent: true,
        extra: { template_id: selectedTemplate || null, file_path: storagePath, status: "concluido" },
      });
      // marca documentos como concluido
      await supabase.from("documentos").update({
        status: "concluido", file_path: storagePath, template_id: selectedTemplate || null,
      }).eq("id", docId);
      saveAs(generatedBlob, generatedFileName);
      toast.success("Documento gerado e baixado");
    } catch (e: any) {
      toast.error("Erro ao gerar: " + (e.message || ""));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Card className="p-8">
        <div className="text-center mb-6">
          <FileDown className="w-12 h-12 mx-auto text-accent mb-3" />
          <h2 className="font-heading text-xl font-bold mb-2">Selecione o template PCMSO</h2>
          <p className="text-muted-foreground text-sm">Salve, vincule os dados e gere o documento Word</p>
        </div>

        <Label className="text-xs font-bold uppercase">Template *</Label>
        <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setValidated(false); setGeneratedBlob(null); }}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Escolher template" /></SelectTrigger>
          <SelectContent>
            {templates.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum template cadastrado</div>}
            {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Button variant="outline" onClick={handleSalvarDocumento} disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Documento
          </Button>
          <Button variant="outline" onClick={handleVincular} disabled={validating || !selectedTemplate}>
            {validating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            Vincular Documento
          </Button>
          <Button onClick={handleGerar} disabled={!validated || !generatedBlob || generating} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Gerar Documento
          </Button>
        </div>

        {validated && (
          <p className="text-center text-xs text-success mt-4">
            <FileCheck2 className="w-3 h-3 inline mr-1" /> Variáveis preenchidas — pronto para gerar
          </p>
        )}
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
      </div>
    </div>
  );
}
