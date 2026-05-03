import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ContratoModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  empresaId: string;
  empresaNome?: string;
  contrato?: any | null;
}

const formatCnpj = (v: string) =>
  v.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");

const empty = {
  numero_contrato: "",
  cnpj_contratante: "",
  nome_contratante: "",
  vigencia_inicio: "",
  vigencia_fim: "",
  local_trabalho: "",
  escopo_contrato: "",
  jornada_trabalho: "",
  numero_funcionarios_fem: "",
  numero_funcionarios_masc: "",
  total_funcionarios: "",
  gestor_nome: "",
  gestor_email: "",
  gestor_telefone: "",
  fiscal_nome: "",
  fiscal_email: "",
  fiscal_telefone: "",
  preposto_nome: "",
  preposto_email: "",
  preposto_telefone: "",
};

export function ContratoModal({ open, onOpenChange, onSaved, empresaId, empresaNome, contrato }: ContratoModalProps) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const isEdit = !!contrato?.id;

  useEffect(() => {
    if (open) {
      if (contrato) {
        setForm({
          numero_contrato: contrato.numero_contrato || "",
          cnpj_contratante: contrato.cnpj_contratante || "",
          nome_contratante: contrato.nome_contratante || "",
          vigencia_inicio: contrato.vigencia_inicio || "",
          vigencia_fim: contrato.vigencia_fim || "",
          local_trabalho: contrato.local_trabalho || "",
          escopo_contrato: contrato.escopo_contrato || "",
          jornada_trabalho: contrato.jornada_trabalho || "",
          numero_funcionarios_fem: contrato.numero_funcionarios_fem?.toString() || "",
          numero_funcionarios_masc: contrato.numero_funcionarios_masc?.toString() || "",
          total_funcionarios: contrato.total_funcionarios?.toString() || "",
          gestor_nome: contrato.gestor_nome || "",
          gestor_email: contrato.gestor_email || "",
          gestor_telefone: contrato.gestor_telefone || "",
          fiscal_nome: contrato.fiscal_nome || "",
          fiscal_email: contrato.fiscal_email || "",
          fiscal_telefone: contrato.fiscal_telefone || "",
          preposto_nome: contrato.preposto_nome || "",
          preposto_email: contrato.preposto_email || "",
          preposto_telefone: contrato.preposto_telefone || "",
        });
      } else {
        setForm({ ...empty });
      }
    }
  }, [open, contrato]);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleContratanteLookup = async () => {
    const clean = form.cnpj_contratante.replace(/\D/g, "");
    if (clean.length !== 14) return toast.error("CNPJ deve ter 14 dígitos");
    setLookingUp(true);
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      update("nome_contratante", d.razao_social || d.nome_fantasia || "");
      toast.success("Contratante encontrada!");
    } catch {
      toast.error("Erro ao buscar CNPJ");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!empresaId) return toast.error("Empresa não definida");
    setSaving(true);
    try {
      const payload: any = {
        empresa_id: empresaId,
        numero_contrato: form.numero_contrato || null,
        cnpj_contratante: form.cnpj_contratante || null,
        nome_contratante: form.nome_contratante || null,
        vigencia_inicio: form.vigencia_inicio || null,
        vigencia_fim: form.vigencia_fim || null,
        local_trabalho: form.local_trabalho || null,
        escopo_contrato: form.escopo_contrato || null,
        jornada_trabalho: form.jornada_trabalho || null,
        numero_funcionarios_fem: form.numero_funcionarios_fem ? parseInt(form.numero_funcionarios_fem) : 0,
        numero_funcionarios_masc: form.numero_funcionarios_masc ? parseInt(form.numero_funcionarios_masc) : 0,
        total_funcionarios: form.total_funcionarios ? parseInt(form.total_funcionarios) : 0,
        gestor_nome: form.gestor_nome || null,
        gestor_email: form.gestor_email || null,
        gestor_telefone: form.gestor_telefone || null,
        fiscal_nome: form.fiscal_nome || null,
        fiscal_email: form.fiscal_email || null,
        fiscal_telefone: form.fiscal_telefone || null,
        preposto_nome: form.preposto_nome || null,
        preposto_email: form.preposto_email || null,
        preposto_telefone: form.preposto_telefone || null,
      };

      if (isEdit) {
        const { error } = await supabase.from("contratos").update(payload).eq("id", contrato.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contratos").insert(payload);
        if (error) throw error;
      }
      toast.success(isEdit ? "Contrato atualizado!" : "Contrato cadastrado!");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar contrato: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {isEdit ? "Editar Contrato" : "Novo Contrato"}
            {empresaNome && <p className="text-xs text-muted-foreground font-normal mt-0.5">Empresa: {empresaNome}</p>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Número do Contrato</Label>
            <Input className="mt-1" value={form.numero_contrato} onChange={(e) => update("numero_contrato", e.target.value)} />
          </div>
          <div>
            <Label>CNPJ da Contratante</Label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="00.000.000/0000-00" value={form.cnpj_contratante} onChange={(e) => update("cnpj_contratante", formatCnpj(e.target.value))} />
              <Button onClick={handleContratanteLookup} disabled={lookingUp} variant="outline" className="shrink-0">
                {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
          </div>
          <div>
            <Label>Nome da Contratante</Label>
            <Input className="mt-1" value={form.nome_contratante} onChange={(e) => update("nome_contratante", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vigência Início</Label>
              <Input type="date" className="mt-1" value={form.vigencia_inicio} onChange={(e) => update("vigencia_inicio", e.target.value)} />
            </div>
            <div>
              <Label>Vigência Fim</Label>
              <Input type="date" className="mt-1" value={form.vigencia_fim} onChange={(e) => update("vigencia_fim", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Local de Trabalho</Label>
            <Input className="mt-1" value={form.local_trabalho} onChange={(e) => update("local_trabalho", e.target.value)} />
          </div>
          <div>
            <Label>Escopo do Contrato</Label>
            <Textarea className="mt-1" value={form.escopo_contrato} onChange={(e) => update("escopo_contrato", e.target.value)} />
          </div>
          <div>
            <Label>Jornada de Trabalho</Label>
            <Input className="mt-1" value={form.jornada_trabalho} onChange={(e) => update("jornada_trabalho", e.target.value)} placeholder="Ex: 8h diárias, 44h semanais" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Func. (Fem)</Label>
              <Input type="number" className="mt-1" value={form.numero_funcionarios_fem} onChange={(e) => update("numero_funcionarios_fem", e.target.value)} />
            </div>
            <div>
              <Label>Func. (Masc)</Label>
              <Input type="number" className="mt-1" value={form.numero_funcionarios_masc} onChange={(e) => update("numero_funcionarios_masc", e.target.value)} />
            </div>
            <div>
              <Label>Total Func.</Label>
              <Input type="number" className="mt-1" value={form.total_funcionarios} onChange={(e) => update("total_funcionarios", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Gestor</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input placeholder="Nome" value={form.gestor_nome} onChange={(e) => update("gestor_nome", e.target.value)} />
              <Input placeholder="Email" value={form.gestor_email} onChange={(e) => update("gestor_email", e.target.value)} />
              <Input placeholder="Telefone" value={form.gestor_telefone} onChange={(e) => update("gestor_telefone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Fiscal</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input placeholder="Nome" value={form.fiscal_nome} onChange={(e) => update("fiscal_nome", e.target.value)} />
              <Input placeholder="Email" value={form.fiscal_email} onChange={(e) => update("fiscal_email", e.target.value)} />
              <Input placeholder="Telefone" value={form.fiscal_telefone} onChange={(e) => update("fiscal_telefone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Preposto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input placeholder="Nome" value={form.preposto_nome} onChange={(e) => update("preposto_nome", e.target.value)} />
              <Input placeholder="Email" value={form.preposto_email} onChange={(e) => update("preposto_email", e.target.value)} />
              <Input placeholder="Telefone" value={form.preposto_telefone} onChange={(e) => update("preposto_telefone", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Atualizar" : "Salvar Contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
