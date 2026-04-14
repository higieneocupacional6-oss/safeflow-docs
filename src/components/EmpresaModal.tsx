import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getGrauRiscoByCnae } from "@/lib/cnaeGrauRisco";

interface EmpresaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export function EmpresaModal({ open, onOpenChange, onSaved }: EmpresaModalProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingContratante, setLoadingContratante] = useState(false);
  const [form, setForm] = useState({
    cnpj: "", razao_social: "", nome_fantasia: "", cnae_principal: "", grau_risco: "", endereco: "",
    numero_funcionarios_fem: "", numero_funcionarios_masc: "", total_funcionarios: "", jornada_trabalho: "",
    numero_contrato: "", cnpj_contratante: "", nome_contratante: "",
    vigencia_inicio: "", vigencia_fim: "", local_trabalho: "", escopo_contrato: "",
    gestor_nome: "", gestor_email: "", gestor_telefone: "",
    fiscal_nome: "", fiscal_email: "", fiscal_telefone: "",
    preposto_nome: "", preposto_email: "", preposto_telefone: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCnpjLookup = async () => {
    const clean = form.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) { toast.error("CNPJ deve ter 14 dígitos"); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      const cnae = `${d.cnae_fiscal || ""} - ${d.cnae_fiscal_descricao || ""}`;
      const grau = getGrauRiscoByCnae(String(d.cnae_fiscal || ""));
      setForm(prev => ({
        ...prev,
        razao_social: d.razao_social || "",
        nome_fantasia: d.nome_fantasia || "",
        cnae_principal: cnae,
        grau_risco: grau,
        endereco: `${d.logradouro || ""}, ${d.numero || ""} - ${d.bairro || ""} - ${d.municipio || ""}/${d.uf || ""} - CEP ${d.cep || ""}`,
      }));
      toast.success("Dados carregados!");
    } catch { toast.error("Erro ao buscar CNPJ"); }
    finally { setLoading(false); }
  };

  const handleContratanteLookup = async () => {
    const clean = form.cnpj_contratante.replace(/\D/g, "");
    if (clean.length !== 14) { toast.error("CNPJ da contratante deve ter 14 dígitos"); return; }
    setLoadingContratante(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      update("nome_contratante", d.razao_social || d.nome_fantasia || "");
      toast.success("Contratante encontrada!");
    } catch { toast.error("Erro ao buscar CNPJ da contratante"); }
    finally { setLoadingContratante(false); }
  };

  const handleSave = async () => {
    if (!form.cnpj || form.cnpj.replace(/\D/g, "").length !== 14) {
      toast.error("Informe um CNPJ válido"); return;
    }
    if (!form.razao_social.trim()) {
      toast.error("Preencha a Razão Social"); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("empresas").insert({
        cnpj: form.cnpj,
        razao_social: form.razao_social,
        nome_fantasia: form.nome_fantasia || null,
        cnae_principal: form.cnae_principal || null,
        grau_risco: form.grau_risco || null,
        endereco: form.endereco || null,
        numero_funcionarios_fem: form.numero_funcionarios_fem ? parseInt(form.numero_funcionarios_fem) : 0,
        numero_funcionarios_masc: form.numero_funcionarios_masc ? parseInt(form.numero_funcionarios_masc) : 0,
        total_funcionarios: form.total_funcionarios ? parseInt(form.total_funcionarios) : 0,
        jornada_trabalho: form.jornada_trabalho || null,
        numero_contrato: form.numero_contrato || null,
        cnpj_contratante: form.cnpj_contratante || null,
        nome_contratante: form.nome_contratante || null,
        vigencia_inicio: form.vigencia_inicio || null,
        vigencia_fim: form.vigencia_fim || null,
        local_trabalho: form.local_trabalho || null,
        escopo_contrato: form.escopo_contrato || null,
        gestor_nome: form.gestor_nome || null,
        gestor_email: form.gestor_email || null,
        gestor_telefone: form.gestor_telefone || null,
        fiscal_nome: form.fiscal_nome || null,
        fiscal_email: form.fiscal_email || null,
        fiscal_telefone: form.fiscal_telefone || null,
        preposto_nome: form.preposto_nome || null,
        preposto_email: form.preposto_email || null,
        preposto_telefone: form.preposto_telefone || null,
      });
      if (error) throw error;
      toast.success("Empresa cadastrada com sucesso!");
      onSaved();
      onOpenChange(false);
      // Reset
      setForm({
        cnpj: "", razao_social: "", nome_fantasia: "", cnae_principal: "", grau_risco: "", endereco: "",
        numero_funcionarios_fem: "", numero_funcionarios_masc: "", total_funcionarios: "", jornada_trabalho: "",
        numero_contrato: "", cnpj_contratante: "", nome_contratante: "",
        vigencia_inicio: "", vigencia_fim: "", local_trabalho: "", escopo_contrato: "",
        gestor_nome: "", gestor_email: "", gestor_telefone: "",
        fiscal_nome: "", fiscal_email: "", fiscal_telefone: "",
        preposto_nome: "", preposto_email: "", preposto_telefone: "",
      });
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Nova Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* SEÇÃO 1: Dados da Empresa */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Dados da Empresa</h3>
            <div className="space-y-3">
              <div>
                <Label>CNPJ *</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => update("cnpj", formatCnpj(e.target.value))} />
                  <Button onClick={handleCnpjLookup} disabled={loading} variant="outline" className="shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Razão Social *</Label><Input className="mt-1" value={form.razao_social} onChange={e => update("razao_social", e.target.value)} /></div>
                <div><Label>Nome Fantasia</Label><Input className="mt-1" value={form.nome_fantasia} onChange={e => update("nome_fantasia", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>CNAE Principal</Label><Input className="mt-1" value={form.cnae_principal} onChange={e => update("cnae_principal", e.target.value)} /></div>
                <div><Label>Grau de Risco (NR-04)</Label><Input className="mt-1" value={form.grau_risco} onChange={e => update("grau_risco", e.target.value)} readOnly className="mt-1 bg-muted/50" /></div>
              </div>
              <div><Label>Endereço Completo</Label><Input className="mt-1" value={form.endereco} onChange={e => update("endereco", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Func. (Fem)</Label><Input type="number" className="mt-1" value={form.numero_funcionarios_fem} onChange={e => update("numero_funcionarios_fem", e.target.value)} /></div>
                <div><Label>Func. (Masc)</Label><Input type="number" className="mt-1" value={form.numero_funcionarios_masc} onChange={e => update("numero_funcionarios_masc", e.target.value)} /></div>
                <div><Label>Total Func.</Label><Input type="number" className="mt-1" value={form.total_funcionarios} onChange={e => update("total_funcionarios", e.target.value)} /></div>
              </div>
              <div><Label>Jornada de Trabalho</Label><Input className="mt-1" value={form.jornada_trabalho} onChange={e => update("jornada_trabalho", e.target.value)} placeholder="Ex: 8h diárias, 44h semanais" /></div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 2: Informações do Contrato */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Informações do Contrato (Opcional)</h3>
            <div className="space-y-3">
              <div><Label>Número do Contrato</Label><Input className="mt-1" value={form.numero_contrato} onChange={e => update("numero_contrato", e.target.value)} /></div>
              <div>
                <Label>CNPJ da Contratante</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="00.000.000/0000-00" value={form.cnpj_contratante} onChange={e => update("cnpj_contratante", formatCnpj(e.target.value))} />
                  <Button onClick={handleContratanteLookup} disabled={loadingContratante} variant="outline" className="shrink-0">
                    {loadingContratante ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
              </div>
              <div><Label>Nome da Contratante</Label><Input className="mt-1" value={form.nome_contratante} onChange={e => update("nome_contratante", e.target.value)} readOnly className="mt-1 bg-muted/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Vigência Início</Label><Input type="date" className="mt-1" value={form.vigencia_inicio} onChange={e => update("vigencia_inicio", e.target.value)} /></div>
                <div><Label>Vigência Fim</Label><Input type="date" className="mt-1" value={form.vigencia_fim} onChange={e => update("vigencia_fim", e.target.value)} /></div>
              </div>
              <div><Label>Local de Trabalho</Label><Input className="mt-1" value={form.local_trabalho} onChange={e => update("local_trabalho", e.target.value)} /></div>
              <div><Label>Escopo do Contrato</Label><Textarea className="mt-1" value={form.escopo_contrato} onChange={e => update("escopo_contrato", e.target.value)} placeholder="Descrição dos serviços contratados" /></div>
            </div>
          </div>

          <Separator />

          {/* Responsáveis */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Responsáveis do Contrato</h3>
            <div className="space-y-4">
              {/* Gestor */}
              <div className="p-3 rounded-lg border border-border space-y-2">
                <p className="text-sm font-semibold text-foreground">Gestor do Contrato</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div><Label className="text-xs">Nome</Label><Input className="mt-1 h-9 text-sm" value={form.gestor_nome} onChange={e => update("gestor_nome", e.target.value)} /></div>
                  <div><Label className="text-xs">Email</Label><Input className="mt-1 h-9 text-sm" type="email" value={form.gestor_email} onChange={e => update("gestor_email", e.target.value)} /></div>
                  <div><Label className="text-xs">Telefone</Label><Input className="mt-1 h-9 text-sm" value={form.gestor_telefone} onChange={e => update("gestor_telefone", e.target.value)} /></div>
                </div>
              </div>
              {/* Fiscal */}
              <div className="p-3 rounded-lg border border-border space-y-2">
                <p className="text-sm font-semibold text-foreground">Fiscal do Contrato</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div><Label className="text-xs">Nome</Label><Input className="mt-1 h-9 text-sm" value={form.fiscal_nome} onChange={e => update("fiscal_nome", e.target.value)} /></div>
                  <div><Label className="text-xs">Email</Label><Input className="mt-1 h-9 text-sm" type="email" value={form.fiscal_email} onChange={e => update("fiscal_email", e.target.value)} /></div>
                  <div><Label className="text-xs">Telefone</Label><Input className="mt-1 h-9 text-sm" value={form.fiscal_telefone} onChange={e => update("fiscal_telefone", e.target.value)} /></div>
                </div>
              </div>
              {/* Preposto */}
              <div className="p-3 rounded-lg border border-border space-y-2">
                <p className="text-sm font-semibold text-foreground">Preposto da Empresa</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div><Label className="text-xs">Nome</Label><Input className="mt-1 h-9 text-sm" value={form.preposto_nome} onChange={e => update("preposto_nome", e.target.value)} /></div>
                  <div><Label className="text-xs">Email</Label><Input className="mt-1 h-9 text-sm" type="email" value={form.preposto_email} onChange={e => update("preposto_email", e.target.value)} /></div>
                  <div><Label className="text-xs">Telefone</Label><Input className="mt-1 h-9 text-sm" value={form.preposto_telefone} onChange={e => update("preposto_telefone", e.target.value)} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
