import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Save, ChevronRight, Building2, Stethoscope, ShieldCheck, GraduationCap, CalendarDays, FileDown, Bookmark, Link2, FileCheck2 } from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import PgrCronogramaStep, { type CronogramaItem } from "@/components/PgrCronogramaStep";
import { PcmsoTemplateHelper } from "@/components/PcmsoTemplateHelper";

type ExameLinha = {
  id: string;
  setor_id: string;
  exame_id: string;
  exame_nome?: string;
  esocial_id: string;
  esocial_codigo?: string;
  esocial_descricao?: string;
  admissional: boolean;
  periodico: boolean;
  retorno_trabalho: boolean;
  mudanca_risco: boolean;
  demissional: boolean;
  periodo: string;
  observacoes: string;
};

type EpiItem = { id: string; funcao_ids: string[]; nome: string; ca: string; uso: string };
type TreinItem = { id: string; funcao_ids: string[]; nome: string; carga_horaria: string };
type Revisao = { revisao: string; data: string; motivo: string; responsavel: string };

type Snapshot = {
  exames: ExameLinha[];
  epis: EpiItem[];
  treinamentos: TreinItem[];
  cronograma: CronogramaItem[];
};

const emptySnapshot = (): Snapshot => ({ exames: [], epis: [], treinamentos: [], cronograma: [] });
const emptyRevisao = (): Revisao => ({ revisao: "", data: "", motivo: "", responsavel: "" });

const RISK_BUCKETS = [
  { key: "fisicos", label: "Físico", aliases: ["físico", "fisico", "físicos", "fisicos"] },
  { key: "quimicos", label: "Químico", aliases: ["químico", "quimico", "químicos", "quimicos"] },
  { key: "biologicos", label: "Biológico", aliases: ["biológico", "biologico", "biológicos", "biologicos"] },
  { key: "acidentes", label: "Acidentes", aliases: ["acidente", "acidentes"] },
  { key: "ergonomicos", label: "Ergonômico", aliases: ["ergonômico", "ergonomico", "ergonômicos", "ergonomicos"] },
  { key: "psicossociais", label: "Psicossociais", aliases: ["psicossocial", "psicossociais"] },
] as const;

const safeText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const markIfTrue = (value: unknown, mark = "X") => value ? mark : "";

const splitObservacoes = (value: unknown) =>
  safeText(value)
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const getRiskBucketKey = (tipo: unknown) => {
  const normalized = safeText(tipo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return RISK_BUCKETS.find((bucket) => bucket.aliases.some((alias) => normalized.startsWith(alias)))?.key || null;
};

const groupRisksByCategory = (riscos: any[]) => {
  const grouped = Object.fromEntries(
    RISK_BUCKETS.map((bucket) => [bucket.key, new Set<string>()]),
  ) as Record<(typeof RISK_BUCKETS)[number]["key"], Set<string>>;

  (riscos || []).forEach((risco: any) => {
    const bucketKey = getRiskBucketKey(risco?.tipo_agente || risco?.tipo);
    const nome = safeText(risco?.agente_nome || risco?.nome);
    if (!bucketKey || !nome) return;
    grouped[bucketKey].add(nome);
  });

  return Object.fromEntries(
    RISK_BUCKETS.map((bucket) => [bucket.key, Array.from(grouped[bucket.key]).sort((a, b) => a.localeCompare(b, "pt-BR"))]),
  ) as Record<(typeof RISK_BUCKETS)[number]["key"], string[]>;
};


const STEPS = [
  { id: 0, label: "Identificação", icon: Building2 },
  { id: 1, label: "Mapeamento de Exames", icon: Stethoscope },
  { id: 2, label: "EPI", icon: ShieldCheck },
  { id: 3, label: "Treinamentos", icon: GraduationCap },
  { id: 4, label: "Cronograma", icon: CalendarDays },
  { id: 5, label: "Geração", icon: FileDown },
];

export default function PcmsoWizard() {
  const { documentoId } = useParams<{ documentoId?: string }>();
  const navigate = useNavigate();
  const [docId, setDocId] = useState<string | null>(documentoId || null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Identificação
  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [contratoId, setContratoId] = useState<string>("");
  const [dataElab, setDataElab] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);

  // Snapshot (working data)
  const [snap, setSnap] = useState<Snapshot>(emptySnapshot());


  // Modal "copiar PGR"
  const [copyPgrOpen, setCopyPgrOpen] = useState(!documentoId);
  const [pgrSelectOpen, setPgrSelectOpen] = useState(false);
  const [selectedPgrEmpresaId, setSelectedPgrEmpresaId] = useState("");

  // Modal "copiar EPI/Treinamento do PGR"
  const [askCopyEpi, setAskCopyEpi] = useState(false);
  const [askedEpi, setAskedEpi] = useState(false);
  const [askCopyTrein, setAskCopyTrein] = useState(false);
  const [askedTrein, setAskedTrein] = useState(false);

  // Queries
  const { data: empresas = [] } = useQuery({
    queryKey: ["pcmso-empresas"],
    queryFn: async () => (await supabase.from("empresas").select("id, razao_social, nome_fantasia, cnpj")).data || [],
  });

  const { data: pgrEmpresas = [] } = useQuery({
    queryKey: ["pcmso-pgr-empresas"],
    queryFn: async () => {
      const { data } = await supabase.from("documentos").select("empresa_id, empresa_nome").eq("tipo", "PGR");
      const map = new Map<string, string>();
      (data || []).forEach((d: any) => d.empresa_id && map.set(d.empresa_id, d.empresa_nome));
      return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
    },
  });

  const { data: setoresEmpresa = [] } = useQuery({
    queryKey: ["pcmso-setores", empresaId],
    enabled: !!empresaId,
    queryFn: async () => (await supabase.from("setores").select("id, nome_setor, ghe_ges, descricao_ambiente").eq("empresa_id", empresaId).order("nome_setor")).data || [],
  });

  const { data: funcoesAll = [] } = useQuery({
    queryKey: ["pcmso-funcoes", setoresEmpresa.map((s: any) => s.id).join(",")],
    enabled: setoresEmpresa.length > 0,
    queryFn: async () => {
      const ids = setoresEmpresa.map((s: any) => s.id);
      return (await supabase.from("funcoes").select("id, setor_id, nome_funcao, cbo_codigo, cbo_descricao, descricao_atividades").in("setor_id", ids)).data || [];
    },
  });

  const { data: catalogoExames = [] } = useQuery({
    queryKey: ["exames_catalogo"],
    queryFn: async () => (await supabase.from("exames_catalogo").select("*").eq("ativo", true).order("nome")).data || [],
  });
  const { data: esocialList = [] } = useQuery({
    queryKey: ["esocial_exames"],
    queryFn: async () => (await supabase.from("esocial_exames").select("*").eq("ativo", true).order("codigo")).data || [],
  });
  const { data: obsPadrao = [] } = useQuery({
    queryKey: ["pcmso_observacoes_padrao"],
    queryFn: async () => (await supabase.from("pcmso_observacoes_padrao").select("*").order("created_at", { ascending: false })).data || [],
  });

  // PGR risks for the selected empresa, grouped BY SETOR (read-only context for Mapeamento)
  const { data: pgrRiscosPorSetor = {} as Record<string, Record<string, string[]>> } = useQuery({
    queryKey: ["pcmso-pgr-riscos-setor", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await supabase
        .from("documentos")
        .select("draft_snapshot")
        .eq("tipo", "PGR")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const setores = (data?.draft_snapshot as any)?.setores || {};
      const out: Record<string, Record<string, string[]>> = {};
      Object.entries(setores).forEach(([setorId, s]: [string, any]) => {
        out[setorId] = groupRisksByCategory((s?.riscos || []) as any[]);
      });
      return out;
    },
  });



  // Load existing doc
  useEffect(() => {
    if (!docId) return;
    (async () => {
      const { data } = await supabase.from("pcmso_documentos").select("*").eq("id", docId).maybeSingle();
      if (!data) return;
      setEmpresaId(data.empresa_id || "");
      setContratoId(data.contrato_id || "");
      setDataElab(data.data_elaboracao || "");
      setResponsavel(data.responsavel_tecnico || "");
      setCrea(data.crea || "");
      setCargo(data.cargo || "");
      setStep(data.current_step || 0);
      setRevisoes(Array.isArray(data.revisoes) ? (data.revisoes as any[]) : []);
      if (data.draft_snapshot) setSnap({ ...emptySnapshot(), ...(data.draft_snapshot as any) });

      if (data.empresa_id) {
        const { data: e } = await supabase.from("empresas").select("razao_social, nome_fantasia").eq("id", data.empresa_id).maybeSingle();
        setEmpresaNome(e?.razao_social || e?.nome_fantasia || "");
      }
    })();
  }, [docId]);

  const persist = async (overrideStep?: number): Promise<string | null> => {
    if (!empresaId) {
      toast.error("Selecione a empresa");
      return null;
    }
    setSaving(true);
    try {
      const payload: any = {
        empresa_id: empresaId,
        contrato_id: contratoId || null,
        data_elaboracao: dataElab || null,
        responsavel_tecnico: responsavel,
        crea,
        cargo,
        current_step: overrideStep ?? step,
        status: "rascunho",
        draft_snapshot: snap as any,
        revisoes: revisoes as any,
      };


      if (docId) {
        const { error } = await supabase.from("pcmso_documentos").update(payload).eq("id", docId);
        if (error) throw error;
        return docId;
      } else {
        const { data, error } = await supabase.from("pcmso_documentos").insert(payload).select("id").single();
        if (error) throw error;
        setDocId(data.id);
        return data.id;
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const goToStep = async (n: number) => {
    const id = await persist(n);
    if (id) setStep(n);
  };

  // Copy from PGR (identification + setores)
  const handleCopyFromPgr = async () => {
    if (!selectedPgrEmpresaId) return toast.error("Selecione a empresa");
    const { data: pgr } = await supabase
      .from("documentos")
      .select("*")
      .eq("tipo", "PGR")
      .eq("empresa_id", selectedPgrEmpresaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: emp } = await supabase.from("empresas").select("*").eq("id", selectedPgrEmpresaId).maybeSingle();
    setEmpresaId(selectedPgrEmpresaId);
    setEmpresaNome(emp?.razao_social || emp?.nome_fantasia || "");
    if (pgr) {
      setContratoId(pgr.contrato_id || "");
      setDataElab(pgr.data_elaboracao || "");
      setResponsavel(pgr.responsavel_tecnico || "");
      setCrea(pgr.crea || "");
      setCargo(pgr.cargo || "");
      if (Array.isArray(pgr.revisoes)) setRevisoes(pgr.revisoes as any);
    }

    setPgrSelectOpen(false);
    setCopyPgrOpen(false);
    toast.success("Dados copiados do PGR");
  };

  const copyEpiFromPgr = async () => {
    const { data } = await supabase
      .from("documentos")
      .select("draft_snapshot")
      .eq("tipo", "PGR")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const blocos: any[] = (data?.draft_snapshot as any)?.epi_blocos || [];
    const novos: EpiItem[] = blocos.flatMap((b: any) =>
      (b.epis || []).map((e: any) => ({
        id: crypto.randomUUID(),
        funcao_ids: b.funcao_ids || [],
        nome: e.nome_epi || "",
        ca: e.ca || "",
        uso: e.uso || "",
      }))
    );
    setSnap((s) => ({ ...s, epis: novos }));
    toast.success(`${novos.length} EPIs importados do PGR`);
    setAskCopyEpi(false);
  };

  const copyTreinFromPgr = async () => {
    const { data } = await supabase
      .from("documentos")
      .select("draft_snapshot")
      .eq("tipo", "PGR")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const blocos: any[] = (data?.draft_snapshot as any)?.treinamento_blocos || [];
    const novos: TreinItem[] = blocos.flatMap((b: any) =>
      (b.treinamentos || []).map((t: any) => ({
        id: crypto.randomUUID(),
        funcao_ids: b.funcao_ids || [],
        nome: t.nome_treinamento || "",
        carga_horaria: t.carga_horaria || "",
      }))
    );
    setSnap((s) => ({ ...s, treinamentos: novos }));
    toast.success(`${novos.length} treinamentos importados do PGR`);
    setAskCopyTrein(false);
  };

  // Revisões helpers
  const addRevisao = () => setRevisoes((r) => [...r, emptyRevisao()]);
  const updateRevisao = (i: number, k: keyof Revisao, v: string) =>
    setRevisoes((r) => r.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const removeRevisao = (i: number) => setRevisoes((r) => r.filter((_, idx) => idx !== i));


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate("/documentos")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Documentos
        </Button>
        <div className="flex items-center gap-2">
          <PcmsoTemplateHelper />
          <Button variant="outline" onClick={() => persist()} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Salvar
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {STEPS.map((s, i) => {
            const Active = step === s.id;
            const Done = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => goToStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    Active ? "bg-accent text-accent-foreground" : Done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />{s.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 0 - Identificação */}
      {step === 0 && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={(v) => {
                setEmpresaId(v);
                const e = empresas.find((x: any) => x.id === v);
                setEmpresaNome(e?.razao_social || e?.nome_fantasia || "");
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de elaboração</Label>
              <Input type="date" value={dataElab} onChange={(e) => setDataElab(e.target.value)} />
            </div>
            <div>
              <Label>Responsável técnico</Label>
              <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            </div>
            <div>
              <Label>CREA / Registro</Label>
              <Input value={crea} onChange={(e) => setCrea(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Cargo / Profissão</Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </div>
          </div>

          {/* Revisões */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-heading font-semibold">Revisões</h3>
                <p className="text-xs text-muted-foreground">Histórico de revisões deste PCMSO</p>
              </div>
              <Button variant="outline" size="sm" onClick={addRevisao} className="gap-1"><Plus className="w-4 h-4" />Adicionar revisão</Button>
            </div>
            {revisoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma revisão cadastrada</p>
            ) : (
              <div className="space-y-2">
                {revisoes.map((r, i) => (
                  <div key={i} className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div><Label className="text-xs">Revisão</Label><Input className="mt-1" value={r.revisao} onChange={(e) => updateRevisao(i, "revisao", e.target.value)} /></div>
                    <div><Label className="text-xs">Data</Label><Input className="mt-1" type="date" value={r.data} onChange={(e) => updateRevisao(i, "data", e.target.value)} /></div>
                    <div><Label className="text-xs">Motivo</Label><Input className="mt-1" value={r.motivo} onChange={(e) => updateRevisao(i, "motivo", e.target.value)} /></div>
                    <div className="flex gap-2">
                      <div className="flex-1"><Label className="text-xs">Responsável</Label><Input className="mt-1" value={r.responsavel} onChange={(e) => updateRevisao(i, "responsavel", e.target.value)} /></div>
                      <Button variant="ghost" size="icon" className="self-end text-destructive" onClick={() => removeRevisao(i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => goToStep(1)} disabled={!empresaId || saving} className="gap-2">
              Próximo: Mapeamento de Exames<ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}



      {/* STEP 1 - Mapeamento de Exames */}
      {step === 1 && (
        <MapeamentoExames
          setores={setoresEmpresa}
          funcoes={funcoesAll}
          catalogoExames={catalogoExames}
          esocialList={esocialList}
          obsPadrao={obsPadrao}
          pgrRiscosPorSetor={pgrRiscosPorSetor}

          snap={snap}
          setSnap={setSnap}
          goToStep={goToStep}
          saving={saving}
        />
      )}

      {/* STEP 2 - EPI */}
      {step === 2 && (
        <EpiStep
          snap={snap}
          setSnap={setSnap}
          funcoes={funcoesAll}
          setores={setoresEmpresa}
          goToStep={goToStep}
          saving={saving}
          askOpen={!askedEpi && empresaId !== "" && snap.epis.length === 0}
          onAskAnswered={(yes) => {
            setAskedEpi(true);
            if (yes) copyEpiFromPgr();
          }}
        />
      )}

      {/* STEP 3 - Treinamentos */}
      {step === 3 && (
        <TreinStep
          snap={snap}
          setSnap={setSnap}
          funcoes={funcoesAll}
          setores={setoresEmpresa}
          goToStep={goToStep}
          saving={saving}
          askOpen={!askedTrein && empresaId !== "" && snap.treinamentos.length === 0}
          onAskAnswered={(yes) => {
            setAskedTrein(true);
            if (yes) copyTreinFromPgr();
          }}
        />
      )}

      {/* STEP 4 - Cronograma (reuse PGR component) */}
      {step === 4 && (
        <PgrCronogramaStep
          goToStep={goToStep}
          saving={saving}
          empresaId={empresaId}
          empresaNome={empresaNome}
          cronograma={snap.cronograma}
          addCronoItem={() => setSnap((s) => ({ ...s, cronograma: [...s.cronograma, { id: crypto.randomUUID(), item: "", acao: "", responsavel: "", prazo_mes: "", prazo_ano: "", situacao: "" }] }))}
          updateCronoItem={(id, patch) => setSnap((s) => ({ ...s, cronograma: s.cronograma.map((c) => c.id === id ? { ...c, ...patch } : c) }))}
          removeCronoItem={(id) => setSnap((s) => ({ ...s, cronograma: s.cronograma.filter((c) => c.id !== id) }))}
          replaceCronograma={(items) => setSnap((s) => ({ ...s, cronograma: items }))}
          appendCronograma={(items) => setSnap((s) => ({ ...s, cronograma: [...s.cronograma, ...items] }))}
          persist={async () => persist()}
        />
      )}

      {/* STEP 5 - Geração */}
      {step === 5 && (
        <GerarStep
          empresaId={empresaId}
          contratoId={contratoId}
          empresaNome={empresaNome}
          dataElab={dataElab}
          responsavel={responsavel}
          crea={crea}
          cargo={cargo}
          revisoes={revisoes}
          snap={snap}
          setores={setoresEmpresa}
          funcoes={funcoesAll}
          goToStep={goToStep}
          persist={persist}
          navigate={navigate}
        />
      )}

      {/* Modal Copy from PGR */}
      <Dialog open={copyPgrOpen} onOpenChange={setCopyPgrOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copiar informações de um PGR?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja copiar as informações de identificação de um PGR já criado para esta empresa? Todos os campos continuarão editáveis.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyPgrOpen(false)}>Não, começar em branco</Button>
            <Button onClick={() => { setCopyPgrOpen(false); setPgrSelectOpen(true); }}>Sim, copiar do PGR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pgrSelectOpen} onOpenChange={setPgrSelectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecione a empresa</DialogTitle></DialogHeader>
          <Select value={selectedPgrEmpresaId} onValueChange={setSelectedPgrEmpresaId}>
            <SelectTrigger><SelectValue placeholder="Empresas com PGR" /></SelectTrigger>
            <SelectContent>
              {pgrEmpresas.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.nome || e.id}</SelectItem>)}
              {!pgrEmpresas.length && <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum PGR encontrado</div>}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPgrSelectOpen(false)}>Cancelar</Button>
            <Button onClick={handleCopyFromPgr}>Copiar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------- STEP 1: Mapeamento de Exames ------------------- */

function MapeamentoExames({
  setores, funcoes, catalogoExames, esocialList, obsPadrao, pgrRiscosPorSetor, snap, setSnap, goToStep, saving,


}: any) {
  const [setorAtual, setSetorAtual] = useState<string>(setores[0]?.id || "");
  useEffect(() => { if (!setorAtual && setores[0]) setSetorAtual(setores[0].id); }, [setores, setorAtual]);

  const funcoesDoSetor = useMemo(() => funcoes.filter((f: any) => f.setor_id === setorAtual), [funcoes, setorAtual]);
  const exames = useMemo(() => snap.exames.filter((e: ExameLinha) => e.setor_id === setorAtual), [snap.exames, setorAtual]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExameLinha | null>(null);
  const [form, setForm] = useState<ExameLinha>(emptyExame(setorAtual));
  const [obsLibOpen, setObsLibOpen] = useState(false);

  function emptyExame(setor_id: string): ExameLinha {
    return {
      id: crypto.randomUUID(), setor_id, exame_id: "", esocial_id: "",
      admissional: false, periodico: false, retorno_trabalho: false, mudanca_risco: false, demissional: false,
      periodo: "", observacoes: "",
    };
  }

  const openNew = () => { setEditing(null); setForm(emptyExame(setorAtual)); setModalOpen(true); };
  const openEdit = (e: ExameLinha) => { setEditing(e); setForm({ ...e }); setModalOpen(true); };

  const save = () => {
    if (!form.exame_id) return toast.error("Selecione o tipo de exame");
    const exameNome = catalogoExames.find((c: any) => c.id === form.exame_id)?.nome;
    const es = esocialList.find((c: any) => c.id === form.esocial_id);
    const payload: ExameLinha = {
      ...form,
      exame_nome: exameNome,
      esocial_codigo: es?.codigo,
      esocial_descricao: es?.descricao,
    };
    setSnap((s: Snapshot) => ({
      ...s,
      exames: editing ? s.exames.map((x) => x.id === editing.id ? payload : x) : [...s.exames, payload],
    }));
    setModalOpen(false);
  };

  const removeExame = (id: string) => setSnap((s: Snapshot) => ({ ...s, exames: s.exames.filter((x) => x.id !== id) }));
  return (
    <Card className="p-6 space-y-4">
      {/* Riscos do PGR — vinculados ao setor selecionado */}
      {(() => {
        const setorNome = setores.find((s: any) => s.id === setorAtual)?.nome_setor || "";
        const riscosSetor: Record<string, string[]> = pgrRiscosPorSetor?.[setorAtual] || {};
        return (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-semibold">
                Riscos Ocupacionais (do PGR){setorNome ? ` — ${setorNome}` : ""}
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">somente visualização</span>
            </div>
            {!setorAtual && (
              <div className="text-xs text-muted-foreground italic">Selecione um setor abaixo para visualizar os riscos.</div>
            )}
            {setorAtual && RISK_BUCKETS.map((bucket) => {
              const lista: string[] = riscosSetor?.[bucket.key] || [];
              return (
                <div key={bucket.key} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold w-32 shrink-0">Riscos {bucket.label}:</span>
                  {lista.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">nenhum cadastrado</span>
                  ) : (
                    lista.map((n) => <Badge key={n} variant="outline" className="text-[11px]">{n}</Badge>)
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}


      <div className="flex items-center justify-between">

        <div className="flex-1 max-w-sm">
          <Label>Selecionar setor</Label>
          <Select value={setorAtual} onValueChange={setSetorAtual}>
            <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              {setores.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome_setor}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} disabled={!setorAtual} className="gap-2"><Plus className="w-4 h-4" />Adicionar exame</Button>
      </div>

      {setorAtual && (
        <div className="rounded-lg bg-muted/40 border border-border p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funções do setor</div>
          <div className="flex flex-wrap gap-1.5">
            {funcoesDoSetor.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma função cadastrada</span>}
            {funcoesDoSetor.map((f: any) => (
              <Badge key={f.id} variant="outline" className="text-xs">{f.nome_funcao}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {exames.length === 0 && <div className="text-sm text-muted-foreground italic">Nenhum exame mapeado para este setor</div>}
        {exames.map((e: ExameLinha) => (
          <div key={e.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
            <Stethoscope className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{e.exame_nome || "Exame"}</div>
              {e.esocial_codigo && <div className="text-xs text-muted-foreground font-mono">{e.esocial_codigo} — {e.esocial_descricao}</div>}
              <div className="flex flex-wrap gap-1 mt-1">
                {e.admissional && <Badge variant="secondary" className="text-[10px]">Admissional</Badge>}
                {e.periodico && <Badge variant="secondary" className="text-[10px]">Periódico {e.periodo && `(${e.periodo})`}</Badge>}
                {e.retorno_trabalho && <Badge variant="secondary" className="text-[10px]">Retorno</Badge>}
                {e.mudanca_risco && <Badge variant="secondary" className="text-[10px]">Mudança de risco</Badge>}
                {e.demissional && <Badge variant="secondary" className="text-[10px]">Demissional</Badge>}
              </div>
              {e.observacoes && <div className="text-xs text-muted-foreground mt-1">{e.observacoes}</div>}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(e)}>✎</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeExame(e.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => goToStep(0)}>Voltar</Button>
        <Button onClick={() => goToStep(2)} disabled={saving} className="gap-2">Próximo: EPI<ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Exame modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar exame" : "Adicionar exame"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo de exame</Label>
              <Select value={form.exame_id} onValueChange={(v) => setForm({ ...form, exame_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {catalogoExames.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Código / Descrição eSocial</Label>
              <Select value={form.esocial_id} onValueChange={(v) => setForm({ ...form, esocial_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {esocialList.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Tipo de exame ocupacional</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["admissional", "Admissional"],
                  ["periodico", "Periódico"],
                  ["retorno_trabalho", "Retorno ao Trabalho"],
                  ["mudanca_risco", "Mudança de Riscos"],
                  ["demissional", "Demissional"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={(form as any)[k]} onCheckedChange={(v) => setForm({ ...form, [k]: !!v })} />{label}
                  </label>
                ))}
              </div>
            </div>
            {form.periodico && (
              <div>
                <Label>Período</Label>
                <Input value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} placeholder="Ex.: 6 meses, anual, semestral" />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Observações</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setObsLibOpen(true)} className="gap-1 h-7 text-xs"><Bookmark className="w-3 h-3" />Biblioteca</Button>
              </div>
              <Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar exame</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Biblioteca de observações */}
      <Dialog open={obsLibOpen} onOpenChange={setObsLibOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Biblioteca de observações</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {obsPadrao.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada. Cadastre em Cadastros PCMSO → Observações.</p>}
            {obsPadrao.map((o: any) => (
              <button key={o.id} type="button" className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/10" onClick={() => {
                setForm((f) => ({ ...f, observacoes: f.observacoes ? `${f.observacoes}\n${o.texto}` : o.texto }));
                setObsLibOpen(false);
              }}>{o.texto}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ------------------- STEP 2 / 3: EPI / Treinamento ------------------- */

function EpiStep({ snap, setSnap, funcoes, setores, goToStep, saving, askOpen, onAskAnswered }: any) {
  const [open, setOpen] = useState(askOpen);
  useEffect(() => { setOpen(askOpen); }, [askOpen]);

  const add = () => setSnap((s: Snapshot) => ({ ...s, epis: [...s.epis, { id: crypto.randomUUID(), funcao_ids: [], nome: "", ca: "", uso: "" }] }));
  const upd = (id: string, patch: Partial<EpiItem>) => setSnap((s: Snapshot) => ({ ...s, epis: s.epis.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const del = (id: string) => setSnap((s: Snapshot) => ({ ...s, epis: s.epis.filter((e) => e.id !== id) }));

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">EPIs por função</h2>
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" />Novo EPI</Button>
      </div>

      <div className="space-y-2">
        {snap.epis.length === 0 && <div className="text-sm text-muted-foreground italic">Nenhum EPI cadastrado</div>}
        {snap.epis.map((e: EpiItem) => (
          <div key={e.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Nome do EPI" value={e.nome} onChange={(ev) => upd(e.id, { nome: ev.target.value })} />
              <Input placeholder="N° do CA" value={e.ca} onChange={(ev) => upd(e.id, { ca: ev.target.value })} />
              <Input placeholder="Uso (ex.: contínuo)" value={e.uso} onChange={(ev) => upd(e.id, { uso: ev.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Funções vinculadas</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {funcoes.map((f: any) => {
                  const checked = e.funcao_ids.includes(f.id);
                  return (
                    <label key={f.id} className={`text-xs px-2 py-1 rounded border cursor-pointer ${checked ? "bg-accent/20 border-accent" : "bg-card border-border"}`}>
                      <input type="checkbox" className="mr-1" checked={checked} onChange={() => {
                        upd(e.id, { funcao_ids: checked ? e.funcao_ids.filter((x) => x !== f.id) : [...e.funcao_ids, f.id] });
                      }} />
                      {f.nome_funcao}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(e.id)}><Trash2 className="w-4 h-4" /></Button></div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep(1)}>Voltar</Button>
        <Button onClick={() => goToStep(3)} disabled={saving} className="gap-2">Próximo: Treinamentos<ChevronRight className="w-4 h-4" /></Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) onAskAnswered(false); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copiar EPIs do PGR?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Deseja copiar os EPIs cadastrados no PGR desta empresa?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); onAskAnswered(false); }}>Não</Button>
            <Button onClick={() => { setOpen(false); onAskAnswered(true); }}>Sim, copiar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TreinStep({ snap, setSnap, funcoes, goToStep, saving, askOpen, onAskAnswered }: any) {
  const [open, setOpen] = useState(askOpen);
  useEffect(() => { setOpen(askOpen); }, [askOpen]);

  const add = () => setSnap((s: Snapshot) => ({ ...s, treinamentos: [...s.treinamentos, { id: crypto.randomUUID(), funcao_ids: [], nome: "", carga_horaria: "" }] }));
  const upd = (id: string, patch: Partial<TreinItem>) => setSnap((s: Snapshot) => ({ ...s, treinamentos: s.treinamentos.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const del = (id: string) => setSnap((s: Snapshot) => ({ ...s, treinamentos: s.treinamentos.filter((e) => e.id !== id) }));

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Treinamentos por função</h2>
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" />Novo treinamento</Button>
      </div>

      <div className="space-y-2">
        {snap.treinamentos.length === 0 && <div className="text-sm text-muted-foreground italic">Nenhum treinamento cadastrado</div>}
        {snap.treinamentos.map((t: TreinItem) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nome do treinamento" value={t.nome} onChange={(ev) => upd(t.id, { nome: ev.target.value })} />
              <Input placeholder="Carga horária" value={t.carga_horaria} onChange={(ev) => upd(t.id, { carga_horaria: ev.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Funções vinculadas</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {funcoes.map((f: any) => {
                  const checked = t.funcao_ids.includes(f.id);
                  return (
                    <label key={f.id} className={`text-xs px-2 py-1 rounded border cursor-pointer ${checked ? "bg-accent/20 border-accent" : "bg-card border-border"}`}>
                      <input type="checkbox" className="mr-1" checked={checked} onChange={() => {
                        upd(t.id, { funcao_ids: checked ? t.funcao_ids.filter((x) => x !== f.id) : [...t.funcao_ids, f.id] });
                      }} />
                      {f.nome_funcao}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(t.id)}><Trash2 className="w-4 h-4" /></Button></div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep(2)}>Voltar</Button>
        <Button onClick={() => goToStep(4)} disabled={saving} className="gap-2">Próximo: Cronograma<ChevronRight className="w-4 h-4" /></Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) onAskAnswered(false); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copiar treinamentos do PGR?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Deseja copiar os treinamentos cadastrados no PGR desta empresa?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); onAskAnswered(false); }}>Não</Button>
            <Button onClick={() => { setOpen(false); onAskAnswered(true); }}>Sim, copiar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ------------------- STEP 5: Geração do PCMSO ------------------- */

function GerarStep({ empresaId, contratoId, empresaNome, dataElab, responsavel, crea, cargo, revisoes, snap, setores, funcoes, goToStep, persist, navigate }: any) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string>("");
  const [finishing, setFinishing] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates-pcmso"],
    queryFn: async () => {
      const { data } = await supabase.from("templates").select("id,title,file_path").order("title");
      return data || [];
    },
  });

  const buildTemplateData = async () => {
    const [empresaRes, contratoRes, setoresRes, funcoesRes, pgrRes] = await Promise.all([
      supabase.from("empresas").select("*").eq("id", empresaId).maybeSingle(),
      contratoId ? supabase.from("contratos").select("*").eq("id", contratoId).maybeSingle() : Promise.resolve({ data: null, error: null } as any),
      supabase.from("setores").select("id, nome_setor, ghe_ges, descricao_ambiente").eq("empresa_id", empresaId).order("nome_setor"),
      supabase
        .from("funcoes")
        .select("id, setor_id, nome_funcao, cbo_codigo, cbo_descricao, descricao_atividades, expostos")
        .in("setor_id", (setores as any[]).map((s) => s.id).length ? (setores as any[]).map((s) => s.id) : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("documentos")
        .select("id, draft_snapshot")
        .eq("tipo", "PGR")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const empresa: any = empresaRes.data || {};
    const contrato: any = contratoRes?.data || {};
    const setoresDb: any[] = (setoresRes.data as any[]) || (setores as any[]) || [];
    const setorIdsDb = setoresDb.map((s) => s.id).filter(Boolean);

    const funcoesSource: any[] = setorIdsDb.length
      ? ((funcoesRes.data as any[]) || [])
      : ((funcoes as any[]) || []);

    const pgrSnap: any = pgrRes.data?.draft_snapshot || {};
    const pgrSetoresMap: Record<string, any> = pgrSnap.setores || {};

    const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "";

    // Build setores grouped (compatible with PGR's {{#ghe_setores}}{{#setores}}{{#funcoes_ghe}} and PCMSO {{#setores}}{{#setor.exames}})
    const setorIds = Array.from(new Set([
      ...setoresDb.map((s) => s.id),
      ...Object.keys(pgrSetoresMap || {}),
      ...(snap.exames || []).map((e: ExameLinha) => e.setor_id).filter(Boolean),
    ]));

    const setoresArr = setorIds.map((setorId) => {
      const s = setoresDb.find((item) => item.id === setorId) || {};
      const fns = (funcoes as any[]).filter((f) => f.setor_id === s.id);
      const funcoes_ghe = fns.map((f) => ({
        nome: safeText(f.nome_funcao),
        nome_funcao: safeText(f.nome_funcao),
        cbo: safeText(f.cbo_codigo),
        cbo_codigo: safeText(f.cbo_codigo),
        cbo_descricao: safeText(f.cbo_descricao),
        descricao: safeText(f.descricao_atividades),
        descricao_atividades: safeText(f.descricao_atividades),
        expostos: safeText(f.expostos),
        funcao: {
          nome: safeText(f.nome_funcao),
          cbo: safeText(f.cbo_codigo),
          descricao: safeText(f.descricao_atividades),
        },
      }));

      const riscosPgr = (pgrSetoresMap[setorId]?.riscos || []) as any[];
      const groupedRiskArrays = groupRisksByCategory(riscosPgr);
      const groupedRiskText = Object.fromEntries(
        RISK_BUCKETS.map((bucket) => [bucket.key, groupedRiskArrays[bucket.key].join(", ")]),
      ) as Record<(typeof RISK_BUCKETS)[number]["key"], string>;

      const exames = (snap.exames as any[])
        .filter((e) => e.setor_id === setorId)
        .map((e) => ({
          exame: {
            nome: safeText(e.exame_nome),
            esocial: { codigo: safeText(e.esocial_codigo), descricao: safeText(e.esocial_descricao) },
            admissional: markIfTrue(e.admissional),
            periodico: e.periodico ? safeText(e.periodo) || "X" : "",
            periodo: safeText(e.periodo),
            retorno: markIfTrue(e.retorno_trabalho),
            retorno_trabalho: markIfTrue(e.retorno_trabalho),
            mudanca_risco: markIfTrue(e.mudanca_risco),
            demissional: markIfTrue(e.demissional),
            observacao: splitObservacoes(e.observacoes),
          },
          nome: safeText(e.exame_nome),
          exame_nome: safeText(e.exame_nome),
          esocial: { codigo: safeText(e.esocial_codigo), descricao: safeText(e.esocial_descricao) },
          codigo_esocial: safeText(e.esocial_codigo),
          descricao_esocial: safeText(e.esocial_descricao),
          admissional: markIfTrue(e.admissional),
          periodico: e.periodico ? safeText(e.periodo) || "X" : "",
          periodo: safeText(e.periodo),
          retorno: markIfTrue(e.retorno_trabalho),
          retorno_trabalho: markIfTrue(e.retorno_trabalho),
          mudanca_risco: markIfTrue(e.mudanca_risco),
          demissional: markIfTrue(e.demissional),
          observacao: splitObservacoes(e.observacoes),
          observacoes: splitObservacoes(e.observacoes),
        }));

      const episSetor = (snap.epis as any[])
        .filter((epi) => (epi.funcao_ids || []).some((fid: string) => fns.some((f) => f.id === fid)))
        .map((epi) => {
          const funcao = fns.find((f) => (epi.funcao_ids || []).includes(f.id));
          return {
            epi: {
              nome: safeText(epi.nome),
              ca: safeText(epi.ca),
              uso: safeText(epi.uso),
            },
            nome_epi: safeText(epi.nome),
            ca: safeText(epi.ca),
            uso: safeText(epi.uso),
            nome_funcao: safeText(funcao?.nome_funcao),
            funcao: { nome: safeText(funcao?.nome_funcao) },
          };
        });

      const treinamentosSetor = (snap.treinamentos as any[])
        .filter((trein) => (trein.funcao_ids || []).some((fid: string) => fns.some((f) => f.id === fid)))
        .map((trein) => {
          const funcao = fns.find((f) => (trein.funcao_ids || []).includes(f.id));
          return {
            treinamento: {
              nome: safeText(trein.nome),
              carga_horaria: safeText(trein.carga_horaria),
            },
            nome_treinamento: safeText(trein.nome),
            carga_horaria: safeText(trein.carga_horaria),
            nome_funcao: safeText(funcao?.nome_funcao),
            funcao: { nome: safeText(funcao?.nome_funcao) },
          };
        });

      const setorObj = {
        id: setorId,
        nome: safeText(s.nome_setor),
        nome_setor: safeText(s.nome_setor),
        ghe_ges: safeText(s.ghe_ges),
        descricao: safeText(s.descricao_ambiente),
        descricao_ambiente: safeText(s.descricao_ambiente),
        funcoes_ghe,
        funcoes: funcoes_ghe,
        exames,
        epis: episSetor,
        treinamentos: treinamentosSetor,
        riscos: {
          fisicos: groupedRiskText.fisicos,
          fisicos_lista: groupedRiskArrays.fisicos.map((nome) => ({ nome })),
          quimicos: groupedRiskText.quimicos,
          quimicos_lista: groupedRiskArrays.quimicos.map((nome) => ({ nome })),
          biologicos: groupedRiskText.biologicos,
          biologicos_lista: groupedRiskArrays.biologicos.map((nome) => ({ nome })),
          acidentes: groupedRiskText.acidentes,
          acidentes_lista: groupedRiskArrays.acidentes.map((nome) => ({ nome })),
          ergonomicos: groupedRiskText.ergonomicos,
          ergonomicos_lista: groupedRiskArrays.ergonomicos.map((nome) => ({ nome })),
          psicossociais: groupedRiskText.psicossociais,
          psicossociais_lista: groupedRiskArrays.psicossociais.map((nome) => ({ nome })),
          listas: groupedRiskArrays,
        },
      };
      // Mustache supports both {{setor.nome}} (when item is `setor`) and direct fields
      return { ...setorObj, setor: setorObj };
    });

    // EPIs (agrupado por função, igual ao PGR)
    const funcMap = new Map<string, any>((funcoes as any[]).map((f) => [f.id, f]));
    const epiPorFuncao = new Map<string, { nome_funcao: string; itens: any[] }>();
    (snap.epis as any[]).forEach((e) => {
      (e.funcao_ids || []).forEach((fid: string) => {
        const f = funcMap.get(fid); if (!f) return;
        if (!epiPorFuncao.has(fid)) epiPorFuncao.set(fid, { nome_funcao: f.nome_funcao || "", itens: [] });
        epiPorFuncao.get(fid)!.itens.push({ nome: e.nome, ca: e.ca, uso: e.uso });
      });
    });
    const epis: any[] = [];
    epiPorFuncao.forEach((g) => {
      const total = g.itens.length || 1;
      (g.itens.length ? g.itens : [{ nome: "", ca: "", uso: "" }]).forEach((it: any, idx: number) => {
        epis.push({
          funcao_label: idx === 0 ? g.nome_funcao : "",
          nome_funcao: g.nome_funcao || "",
          funcao: { nome: g.nome_funcao || "" },
          rowspan: total,
          is_first: idx === 0,
          epi: { nome: it.nome || "", ca: it.ca || "", uso: it.uso || "" },
          nome_epi: it.nome || "",
          ca: it.ca || "",
          uso: it.uso || "",
        });
      });
    });

    // Treinamentos (agrupado por função)
    const treinPorFuncao = new Map<string, { nome_funcao: string; itens: any[] }>();
    (snap.treinamentos as any[]).forEach((t) => {
      (t.funcao_ids || []).forEach((fid: string) => {
        const f = funcMap.get(fid); if (!f) return;
        if (!treinPorFuncao.has(fid)) treinPorFuncao.set(fid, { nome_funcao: f.nome_funcao || "", itens: [] });
        treinPorFuncao.get(fid)!.itens.push({ nome: t.nome, carga_horaria: t.carga_horaria });
      });
    });
    const treinamentos: any[] = [];
    treinPorFuncao.forEach((g) => {
      const total = g.itens.length || 1;
      (g.itens.length ? g.itens : [{ nome: "", carga_horaria: "" }]).forEach((it: any, idx: number) => {
        treinamentos.push({
          funcao_label: idx === 0 ? g.nome_funcao : "",
          nome_funcao: g.nome_funcao || "",
          funcao: { nome: g.nome_funcao || "" },
          rowspan: total,
          is_first: idx === 0,
          treinamento: { nome: it.nome || "", carga_horaria: it.carga_horaria || "" },
          nome_treinamento: it.nome || "",
          carga_horaria: it.carga_horaria || "",
        });
      });
    });

    const MESES_PT = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const cronograma = (snap.cronograma || []).map((c: any) => {
      const mes = parseInt(c.prazo_mes || "0", 10);
      const mesLabel = mes >= 1 && mes <= 12 ? MESES_PT[mes] : "";
      const prazo = [mesLabel, c.prazo_ano || ""].filter(Boolean).join("/");
      const flat = {
        item: c.item || "",
        acao: c.acao || "",
        responsavel: c.responsavel || "",
        prazo_mes: mesLabel,
        prazo_ano: c.prazo_ano || "",
        prazo,
        situacao: c.situacao || "",
      };
      return { ...flat, cronograma: flat };
    });

    const revisoesArr = (revisoes as any[]).map((r) => ({
      revisao: r.revisao || "",
      data: fmtDate(r.data),
      motivo: r.motivo || "",
      responsavel: r.responsavel || "",
    }));

    const totalExpostos = funcoesSource.reduce((acc, f) => acc + (parseInt(safeText(f?.expostos), 10) || 0), 0);

    return {
      // Empresa
      empresa_nome: safeText(empresaNome || empresa.razao_social),
      empresa: safeText(empresaNome || empresa.razao_social),
      razao_social: safeText(empresa.razao_social),
      nome_fantasia: safeText(empresa.nome_fantasia),
      cnpj: safeText(empresa.cnpj),
      cnae_principal: safeText(empresa.cnae_principal),
      grau_risco: safeText(empresa.grau_risco),
      endereco: safeText(empresa.endereco),
      total_funcionarios: safeText(empresa.total_funcionarios),
      numero_funcionarios_masc: safeText(empresa.numero_funcionarios_masc),
      numero_funcionarios_fem: safeText(empresa.numero_funcionarios_fem),
      jornada_trabalho: safeText(empresa.jornada_trabalho),
      local_trabalho: safeText(empresa.local_trabalho),
      // Contrato
      numero_contrato: safeText(contrato.numero_contrato || empresa.numero_contrato),
      nome_contratante: safeText(contrato.nome_contratante || empresa.nome_contratante),
      cnpj_contratante: safeText(contrato.cnpj_contratante || empresa.cnpj_contratante),
      escopo_contrato: safeText(contrato.escopo_contrato || empresa.escopo_contrato),
      vigencia_inicio: fmtDate(contrato.vigencia_inicio || empresa.vigencia_inicio),
      vigencia_fim: fmtDate(contrato.vigencia_fim || empresa.vigencia_fim),
      local_trabalho: safeText(contrato.local_trabalho || empresa.local_trabalho),
      // Responsáveis
      responsavel: safeText(responsavel),
      responsavel_tecnico: safeText(responsavel),
      crea: safeText(crea),
      cargo: safeText(cargo),
      data_elaboracao: fmtDate(dataElab),
      gestor_nome: safeText(empresa.gestor_nome),
      gestor_email: safeText(empresa.gestor_email),
      gestor_telefone: safeText(empresa.gestor_telefone),
      fiscal_nome: safeText(empresa.fiscal_nome),
      fiscal_email: safeText(empresa.fiscal_email),
      fiscal_telefone: safeText(empresa.fiscal_telefone),
      preposto_nome: safeText(empresa.preposto_nome),
      preposto_email: safeText(empresa.preposto_email),
      preposto_telefone: safeText(empresa.preposto_telefone),
      // Estrutura PGR-compatível
      ghe_setores: setoresArr,
      setores: setoresArr,
      setor: setoresArr,
      expostos: safeText(totalExpostos),
      epis,
      treinamentos,
      cronograma,
      cronograma_pcmso: cronograma,
      cronograma_pgr: cronograma,
      revisoes: revisoesArr,
      _debug: {
        empresa_id: empresaId,
        contrato_id: contratoId || "",
        pgr_encontrado: Boolean(pgrRes.data?.id),
        total_setores: setoresArr.length,
        total_funcoes: funcoesSource.length,
        total_exames: (snap.exames || []).length,
        total_epis: epis.length,
        total_treinamentos: treinamentos.length,
        total_cronograma: cronograma.length,
      },
    };
  };

  const handleVincular = async () => {
    if (!selectedTemplate) { toast.error("Selecione um template"); return; }
    setValidating(true);
    setValidated(false);
    setGeneratedBlob(null);
    try {
      const tpl: any = (templates as any[]).find((t) => t.id === selectedTemplate);
      if (!tpl) throw new Error("Template não encontrado");
      const { data: fileData, error } = await supabase.storage.from("templates").download(tpl.file_path);
      if (error) throw error;
      const ab = await fileData.arrayBuffer();
      const zip = new PizZip(ab);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "{{", end: "}}" }, nullGetter: () => "" });
      const data = await buildTemplateData();
      doc.render(data);
      const blob: Blob = (doc.getZip() as any).generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const fileName = `PCMSO_${(empresaNome || "documento").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getFullYear()}.docx`;
      setGeneratedBlob(blob);
      setGeneratedFileName(fileName);
      setValidated(true);
      toast.success("✅ Documento vinculado com sucesso");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao vincular: " + (e?.message || ""));
    } finally {
      setValidating(false);
    }
  };

  const handleBaixar = () => {
    if (!generatedBlob) return;
    saveAs(generatedBlob, generatedFileName);
  };

  const handleConcluir = async () => {
    setFinishing(true);
    try {
      await persist();
      toast.success("PCMSO salvo");
      navigate("/documentos");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="text-center">
        <FileDown className="w-12 h-12 mx-auto text-accent mb-3" />
        <h2 className="font-heading text-xl font-bold mb-1">Geração do PCMSO</h2>
        <p className="text-sm text-muted-foreground">
          Selecione um template (.docx). O sistema preenche dados do PCMSO e integra automaticamente as variáveis do PGR vinculado à empresa.
        </p>
      </div>

      <div>
        <Label className="text-xs font-bold uppercase">Template *</Label>
        <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setValidated(false); setGeneratedBlob(null); }}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Escolher template PCMSO" /></SelectTrigger>
          <SelectContent>
            {(templates as any[]).length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum template cadastrado</div>}
            {(templates as any[]).map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={handleVincular} disabled={validating || !selectedTemplate}>
          {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Vincular e gerar
        </Button>
        <Button onClick={handleBaixar} disabled={!validated || !generatedBlob} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <FileDown className="w-4 h-4" /> Baixar Documento
        </Button>
      </div>

      {validated && (
        <p className="text-center text-xs text-success">
          <FileCheck2 className="w-3 h-3 inline mr-1" /> Variáveis preenchidas — pronto para baixar
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => goToStep(4)}>Voltar</Button>
        <Button onClick={handleConcluir} disabled={finishing}>
          {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Concluir
        </Button>
      </div>
    </Card>
  );
}
