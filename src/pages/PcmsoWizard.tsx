import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Plus, Save, Trash2, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PcmsoTemplateHelper } from "@/components/PcmsoTemplateHelper";
import { PcmsoObservacoesPadraoModal } from "@/components/PcmsoObservacoesPadraoModal";
import {
  PcmsoSetor,
  PcmsoExame,
  PcmsoRevisao,
  emptyExame,
} from "@/lib/copyPgrToPcmso";

type AgentKey =
  | "agentes_fisicos"
  | "agentes_quimicos"
  | "agentes_biologicos"
  | "agentes_ergonomicos"
  | "agentes_acidentes"
  | "agentes_psicossociais";

const AGENT_FIELDS: { key: AgentKey; label: string }[] = [
  { key: "agentes_fisicos", label: "Agentes Físicos" },
  { key: "agentes_quimicos", label: "Agentes Químicos" },
  { key: "agentes_biologicos", label: "Agentes Biológicos" },
  { key: "agentes_ergonomicos", label: "Agentes Ergonômicos" },
  { key: "agentes_acidentes", label: "Agentes de Acidentes" },
  { key: "agentes_psicossociais", label: "Agentes Psicossociais" },
];

export default function PcmsoWizard() {
  const navigate = useNavigate();
  const { documentoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [activeSetorIdx, setActiveSetorIdx] = useState<number | null>(null);

  // Identification
  const [empresaNome, setEmpresaNome] = useState("");
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [crea, setCrea] = useState("");
  const [cargo, setCargo] = useState("");
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [revisoes, setRevisoes] = useState<PcmsoRevisao[]>([]);
  const [setores, setSetores] = useState<PcmsoSetor[]>([]);

  useEffect(() => {
    (async () => {
      if (!documentoId) { navigate("/documentos"); return; }
      const { data, error } = await supabase
        .from("pcmso_documentos").select("*").eq("id", documentoId).maybeSingle();
      if (error || !data) { toast.error("PCMSO não encontrado"); navigate("/documentos"); return; }
      setResponsavelTecnico(data.responsavel_tecnico || "");
      setCrea(data.crea || "");
      setCargo(data.cargo || "");
      setVigenciaInicio(data.vigencia_inicio || "");
      setVigenciaFim(data.vigencia_fim || "");
      setRevisoes((data.revisoes as any) || []);
      setSetores((data.setores_snapshot as any) || []);
      setStep(data.current_step || 0);
      if (data.empresa_id) {
        const { data: emp } = await supabase.from("empresas").select("razao_social,nome_fantasia").eq("id", data.empresa_id).maybeSingle();
        setEmpresaNome(emp?.razao_social || emp?.nome_fantasia || "");
      }
      setLoading(false);
    })();
  }, [documentoId, navigate]);

  const save = async (opts?: { silent?: boolean; newStep?: number }) => {
    if (!documentoId) return;
    setSaving(true);
    const payload: any = {
      responsavel_tecnico: responsavelTecnico,
      crea, cargo,
      vigencia_inicio: vigenciaInicio || null,
      vigencia_fim: vigenciaFim || null,
      revisoes: revisoes as any,
      setores_snapshot: setores as any,
      current_step: opts?.newStep ?? step,
    };
    const { error } = await supabase.from("pcmso_documentos").update(payload).eq("id", documentoId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    if (!opts?.silent) toast.success("Salvo");
  };

  const finalize = async () => {
    await save({ silent: true });
    await supabase.from("documentos").update({ status: "concluido" }).eq("id", documentoId);
    toast.success("PCMSO finalizado");
    navigate("/documentos");
  };

  // Revisoes handlers
  const addRevisao = () => setRevisoes((r) => [...r, { revisao: String(r.length + 1), data: "", motivo: "", responsavel: "" }]);
  const updateRevisao = (i: number, patch: Partial<PcmsoRevisao>) =>
    setRevisoes((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeRevisao = (i: number) => setRevisoes((r) => r.filter((_, idx) => idx !== i));

  // Setor handlers
  const updateSetor = (i: number, patch: Partial<PcmsoSetor>) =>
    setSetores((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const activeSetor = activeSetorIdx !== null ? setores[activeSetorIdx] : null;

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  );

  // ============ STEP 2 — Detalhe do setor ============
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
        title="Novo PCMSO"
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

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {["Identificação", "Dimensionamento de Exames"].map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${step === i ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border text-muted-foreground"}`}>
            Etapa {i + 1} — {label}
          </button>
        ))}
      </div>

      {/* ============ STEP 1 — Identificação ============ */}
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
            <Button onClick={async () => { await save({ silent: true, newStep: 1 }); setStep(1); }}>
              Próxima etapa<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ============ STEP 2 — Lista de setores ============ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold">Setores da empresa</h3>
            <p className="text-xs text-muted-foreground">Clique em um setor para dimensionar funções, agentes e exames</p>
          </div>
          {setores.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-muted-foreground">Nenhum setor cadastrado para esta empresa.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/setores-funcoes")}>Ir para Setores e Funções</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {setores.map((s, i) => (
                <button key={i} onClick={() => setActiveSetorIdx(i)} className="text-left p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading font-semibold text-foreground">{s.nome_setor}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{s.exames.length} exames</Badge>
                        {AGENT_FIELDS.some((a) => (s[a.key] as string[]).length > 0) && (
                          <Badge variant="outline" className="text-xs">
                            {AGENT_FIELDS.reduce((sum, a) => sum + (s[a.key] as string[]).length, 0)} agentes
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-1" />Etapa anterior</Button>
            <Button onClick={finalize}>Finalizar PCMSO</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Subcomponente: Detalhe do setor ============
function SetorDetail({
  setor, onBack, onChange,
}: {
  setor: PcmsoSetor;
  onBack: () => void;
  onChange: (patch: Partial<PcmsoSetor>) => void;
}) {
  const updateAgents = (key: AgentKey, value: string) => {
    const arr = value.split("\n").map((x) => x.trim()).filter(Boolean);
    onChange({ [key]: arr } as any);
  };

  const updateExame = (i: number, patch: Partial<PcmsoExame>) => {
    const exames = setor.exames.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    onChange({ exames });
  };
  const removeExame = (i: number) => onChange({ exames: setor.exames.filter((_, idx) => idx !== i) });
  const addExame = () => onChange({ exames: [...setor.exames, emptyExame()] });

  return (
    <div>
      <PageHeader
        title={setor.nome_setor}
        description="Dimensionamento de exames do setor"
        actions={<Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" />Voltar aos setores</Button>}
      />

      <Card className="mb-4"><CardContent className="pt-6 space-y-4">
        <h3 className="font-heading font-semibold">Funções</h3>
        <Textarea value={setor.funcoes} onChange={(e) => onChange({ funcoes: e.target.value })} rows={2}
          placeholder="Funções deste setor (separadas por vírgula)" />
      </CardContent></Card>

      <Card className="mb-4"><CardContent className="pt-6 space-y-4">
        <h3 className="font-heading font-semibold">Agentes (puxados do PGR — editáveis)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENT_FIELDS.map((af) => (
            <div key={af.key}>
              <Label className="text-xs font-bold uppercase">{af.label}</Label>
              <Textarea
                value={(setor[af.key] as string[]).join("\n")}
                onChange={(e) => updateAgents(af.key, e.target.value)}
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
              <ExameCard key={i} exame={ex} onChange={(p) => updateExame(i, p)} onRemove={() => removeExame(i)} index={i} />
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

function ExameCard({
  exame, index, onChange, onRemove,
}: {
  exame: PcmsoExame; index: number;
  onChange: (p: Partial<PcmsoExame>) => void; onRemove: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-border space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-muted-foreground">Exame {index + 1}</span>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={onRemove}><Trash2 className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><Label className="text-xs">Tipo de Exame</Label><Input value={exame.tipo_exame} onChange={(e) => onChange({ tipo_exame: e.target.value })} /></div>
        <div><Label className="text-xs">Código eSocial</Label><Input value={exame.cod_esocial} onChange={(e) => onChange({ cod_esocial: e.target.value })} /></div>
        <div><Label className="text-xs">Descrição eSocial</Label><Input value={exame.descricao_esocial} onChange={(e) => onChange({ descricao_esocial: e.target.value })} /></div>
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
