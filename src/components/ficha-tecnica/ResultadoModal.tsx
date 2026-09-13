import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { agenteMatchesTipo, FichaTipo, fichaTipoLabel, isFichaQuimica } from "@/lib/fichaTecnica";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  contratoId: string;
  tipo: FichaTipo;
  setores: any[];
  funcoes: any[];
  agentes: any[];
  registro?: any;
  onSaved: () => void;
};

const emptyForm = {
  setor_id: "", funcao_id: "", agente_id: "", data_avaliacao: new Date().toISOString().slice(0, 10),
  nen: "", lavg: "", aren: "", vdvr: "", concentracao: "", taxa_metabolica: "",
  componentes: "", amostrador: "", exposicao: "", limite_tolerancia: "",
};

const numberOrNull = (value: string) => value === "" ? null : Number(value.replace(",", "."));

export function ResultadoModal({ open, onOpenChange, empresaId, contratoId, tipo, setores, funcoes, agentes, registro, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const agentesDisponiveis = useMemo(() => agentes.filter((item) => agenteMatchesTipo(tipo, item.nome)), [agentes, tipo]);
  const funcoesDisponiveis = useMemo(() => funcoes.filter((item) => item.setor_id === form.setor_id), [funcoes, form.setor_id]);

  useEffect(() => {
    if (!open) return;
    const defaults: any = { ...emptyForm };
    if (tipo === "ruido") defaults.limite_tolerancia = "85";
    if (tipo === "vibracao_vmb") defaults.limite_tolerancia = "5";
    if (tipo === "vibracao_vci") defaults.limite_tolerancia = "1.1";
    const source = registro || defaults;
    setForm(Object.fromEntries(Object.keys(emptyForm).map((key) => [key, source[key] == null ? defaults[key] || "" : String(source[key])]))) as any;
  }, [open, registro, tipo]);

  useEffect(() => {
    if (!registro && agentesDisponiveis.length === 1) set("agente_id", agentesDisponiveis[0].id);
  }, [agentesDisponiveis, registro]);

  const save = async () => {
    if (!form.setor_id || !form.funcao_id || !form.agente_id || !form.limite_tolerancia) {
      toast.error("Preencha setor, função, agente e limite de tolerância.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        empresa_id: empresaId, contrato_id: contratoId, tipo,
        setor_id: form.setor_id, funcao_id: form.funcao_id, agente_id: form.agente_id,
        data_avaliacao: form.data_avaliacao,
        nen: numberOrNull(form.nen), lavg: numberOrNull(form.lavg), aren: numberOrNull(form.aren),
        vdvr: numberOrNull(form.vdvr), concentracao: numberOrNull(form.concentracao),
        taxa_metabolica: form.taxa_metabolica || null, componentes: form.componentes || null,
        amostrador: form.amostrador || null, exposicao: numberOrNull(form.exposicao),
        limite_tolerancia: numberOrNull(form.limite_tolerancia),
      };
      const query = registro
        ? (supabase as any).from("ficha_tecnica_resultados").update(payload).eq("id", registro.id).eq("empresa_id", empresaId).eq("contrato_id", contratoId)
        : (supabase as any).from("ficha_tecnica_resultados").insert(payload);
      const { error } = await query;
      if (error) throw error;
      toast.success(registro ? "Resultado atualizado." : "Resultado cadastrado.");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível salvar o resultado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{registro ? "Editar" : "Novo resultado"} — {fichaTipoLabel(tipo)}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 py-2">
          <Field label="Setor"><Select value={form.setor_id} onValueChange={(value) => setForm((current) => ({ ...current, setor_id: value, funcao_id: "" }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{setores.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Função"><Select value={form.funcao_id} onValueChange={(value) => set("funcao_id", value)} disabled={!form.setor_id}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{funcoesDisponiveis.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome_funcao}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Agente"><Select value={form.agente_id} onValueChange={(value) => set("agente_id", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{agentesDisponiveis.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Data da avaliação"><Input type="date" value={form.data_avaliacao} onChange={(e) => set("data_avaliacao", e.target.value)} /></Field>
          {tipo === "ruido" && <><NumberField label="NEN (dB)" value={form.nen} onChange={(v) => set("nen", v)} /><NumberField label="LAVG (dB)" value={form.lavg} onChange={(v) => set("lavg", v)} /></>}
          {(tipo === "vibracao_vci" || tipo === "vibracao_vmb") && <NumberField label="AREN (m/s²)" value={form.aren} onChange={(v) => set("aren", v)} />}
          {tipo === "vibracao_vci" && <NumberField label="VDVR (m/s¹·⁷)" value={form.vdvr} onChange={(v) => set("vdvr", v)} />}
          {tipo === "calor" && <><NumberField label="Concentração / IBUTG" value={form.concentracao} onChange={(v) => set("concentracao", v)} /><Field label="Taxa Metabólica"><Input value={form.taxa_metabolica} onChange={(e) => set("taxa_metabolica", e.target.value)} placeholder="Ex.: 300 W" /></Field></>}
          {isFichaQuimica(tipo) && <><Field label="Componentes"><Input value={form.componentes} onChange={(e) => set("componentes", e.target.value)} /></Field><Field label="Amostrador"><Input value={form.amostrador} onChange={(e) => set("amostrador", e.target.value)} /></Field><NumberField label="Exposição" value={form.exposicao} onChange={(v) => set("exposicao", v)} /></>}
          <NumberField label={tipo === "vibracao_vci" ? "LT AREN (m/s²) — VDVR: 21,0 m/s¹·⁷" : "Limite de Tolerância"} value={form.limite_tolerancia} onChange={(v) => set("limite_tolerancia", v)} disabled={["ruido", "vibracao_vci", "vibracao_vmb"].includes(tipo)} />
        </div>
        {agentesDisponiveis.length === 0 && <p className="text-sm text-destructive">Cadastre o agente correspondente em Cadastros gerais antes de salvar.</p>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save} disabled={saving || agentesDisponiveis.length === 0}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function NumberField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <Field label={label}><Input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} /></Field>;
}