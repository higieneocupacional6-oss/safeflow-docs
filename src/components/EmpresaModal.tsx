import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getGrauRiscoByCnae } from "@/lib/cnaeGrauRisco";

interface Contato {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
}

interface EmpresaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  empresa?: any;
}

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const emptyForm = {
  cnpj: "",
  razao_social: "",
  nome_fantasia: "",
  cnae_principal: "",
  grau_risco: "",
  endereco: "",
  numero_funcionarios_fem: "",
  numero_funcionarios_masc: "",
  total_funcionarios: "",
  jornada_trabalho: "",
  numero_contrato: "",
  cnpj_contratante: "",
  nome_contratante: "",
  vigencia_inicio: "",
  vigencia_fim: "",
  local_trabalho: "",
  escopo_contrato: "",
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

const emptyContato = (): Contato => ({ nome: "", email: "", telefone: "" });

export function EmpresaModal({ open, onOpenChange, onSaved, empresa }: EmpresaModalProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingContratante, setLoadingContratante] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [fiscais, setFiscais] = useState<Contato[]>([emptyContato()]);
  const [gestores, setGestores] = useState<Contato[]>([emptyContato()]);
  const [prepostos, setPrepostos] = useState<Contato[]>([emptyContato()]);

  const isEdit = !!empresa;

  useEffect(() => {
    if (open && empresa) {
      setForm({
        cnpj: empresa.cnpj || "",
        razao_social: empresa.razao_social || "",
        nome_fantasia: empresa.nome_fantasia || "",
        cnae_principal: empresa.cnae_principal || "",
        grau_risco: empresa.grau_risco || "",
        endereco: empresa.endereco || "",
        numero_funcionarios_fem: empresa.numero_funcionarios_fem?.toString() || "",
        numero_funcionarios_masc: empresa.numero_funcionarios_masc?.toString() || "",
        total_funcionarios: empresa.total_funcionarios?.toString() || "",
        jornada_trabalho: empresa.jornada_trabalho || "",
        numero_contrato: empresa.numero_contrato || "",
        cnpj_contratante: empresa.cnpj_contratante || "",
        nome_contratante: empresa.nome_contratante || "",
        vigencia_inicio: empresa.vigencia_inicio || "",
        vigencia_fim: empresa.vigencia_fim || "",
        local_trabalho: empresa.local_trabalho || "",
        escopo_contrato: empresa.escopo_contrato || "",
        gestor_nome: empresa.gestor_nome || "",
        gestor_email: empresa.gestor_email || "",
        gestor_telefone: empresa.gestor_telefone || "",
        fiscal_nome: empresa.fiscal_nome || "",
        fiscal_email: empresa.fiscal_email || "",
        fiscal_telefone: empresa.fiscal_telefone || "",
        preposto_nome: empresa.preposto_nome || "",
        preposto_email: empresa.preposto_email || "",
        preposto_telefone: empresa.preposto_telefone || "",
      });
      // Load contatos
      loadContatos(empresa.id);
    } else if (open && !empresa) {
      setForm({ ...emptyForm });
      setFiscais([emptyContato()]);
      setGestores([emptyContato()]);
      setPrepostos([emptyContato()]);
    }
  }, [open, empresa]);

  const loadContatos = async (empresaId: string) => {
    const { data } = await supabase
      .from("empresa_contatos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at");
    if (data && data.length > 0) {
      const f = data
        .filter((c: any) => c.tipo === "fiscal")
        .map((c: any) => ({ id: c.id, nome: c.nome, email: c.email, telefone: c.telefone }));
      const g = data
        .filter((c: any) => c.tipo === "gestor")
        .map((c: any) => ({ id: c.id, nome: c.nome, email: c.email, telefone: c.telefone }));
      const p = data
        .filter((c: any) => c.tipo === "preposto")
        .map((c: any) => ({ id: c.id, nome: c.nome, email: c.email, telefone: c.telefone }));
      setFiscais(f.length > 0 ? f : [emptyContato()]);
      setGestores(g.length > 0 ? g : [emptyContato()]);
      setPrepostos(p.length > 0 ? p : [emptyContato()]);
    } else {
      // Migrate existing single fields to contatos list
      const f: Contato[] = empresa.fiscal_nome
        ? [{ nome: empresa.fiscal_nome, email: empresa.fiscal_email || "", telefone: empresa.fiscal_telefone || "" }]
        : [emptyContato()];
      const g: Contato[] = empresa.gestor_nome
        ? [{ nome: empresa.gestor_nome, email: empresa.gestor_email || "", telefone: empresa.gestor_telefone || "" }]
        : [emptyContato()];
      const p: Contato[] = empresa.preposto_nome
        ? [
            {
              nome: empresa.preposto_nome,
              email: empresa.preposto_email || "",
              telefone: empresa.preposto_telefone || "",
            },
          ]
        : [emptyContato()];
      setFiscais(f);
      setGestores(g);
      setPrepostos(p);
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCnpjLookup = async () => {
    const clean = form.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`//https://brasilapi.com.br/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      const cnae = `${d.cnae_fiscal || ""} - ${d.cnae_fiscal_descricao || ""}`;
      const grau = getGrauRiscoByCnae(String(d.cnae_fiscal || ""));
      setForm((prev) => ({
        ...prev,
        razao_social: d.razao_social || "",
        nome_fantasia: d.nome_fantasia || "",
        cnae_principal: cnae,
        grau_risco: grau,
        endereco: `${d.logradouro || ""}, ${d.numero || ""} - ${d.bairro || ""} - ${d.municipio || ""}/${d.uf || ""} - CEP ${d.cep || ""}`,
      }));
      toast.success("Dados carregados!");
    } catch {
      toast.error("Erro ao buscar CNPJ");
    } finally {
      setLoading(false);
    }
  };

  const handleContratanteLookup = async () => {
    const clean = form.cnpj_contratante.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast.error("CNPJ da contratante deve ter 14 dígitos");
      return;
    }
    setLoadingContratante(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      update("nome_contratante", d.razao_social || d.nome_fantasia || "");
      toast.success("Contratante encontrada!");
    } catch {
      toast.error("Erro ao buscar CNPJ da contratante");
    } finally {
      setLoadingContratante(false);
    }
  };

  const updateContato = (
    list: Contato[],
    setList: (v: Contato[]) => void,
    index: number,
    field: keyof Contato,
    value: string,
  ) => {
    const newList = [...list];
    newList[index] = { ...newList[index], [field]: value };
    setList(newList);
  };

  const addContato = (list: Contato[], setList: (v: Contato[]) => void) => {
    setList([...list, emptyContato()]);
  };

  const removeContato = (list: Contato[], setList: (v: Contato[]) => void, index: number) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== index));
  };

  const saveContatos = async (empresaId: string) => {
    // Delete existing
    await supabase.from("empresa_contatos").delete().eq("empresa_id", empresaId);
    // Insert all
    const rows: any[] = [];
    fiscais
      .filter((c) => c.nome.trim())
      .forEach((c) =>
        rows.push({ empresa_id: empresaId, tipo: "fiscal", nome: c.nome, email: c.email, telefone: c.telefone }),
      );
    gestores
      .filter((c) => c.nome.trim())
      .forEach((c) =>
        rows.push({ empresa_id: empresaId, tipo: "gestor", nome: c.nome, email: c.email, telefone: c.telefone }),
      );
    prepostos
      .filter((c) => c.nome.trim())
      .forEach((c) =>
        rows.push({ empresa_id: empresaId, tipo: "preposto", nome: c.nome, email: c.email, telefone: c.telefone }),
      );
    if (rows.length > 0) {
      await supabase.from("empresa_contatos").insert(rows);
    }
  };

  const handleSave = async () => {
    if (!form.cnpj || form.cnpj.replace(/\D/g, "").length !== 14) {
      toast.error("Informe um CNPJ válido");
      return;
    }
    if (!form.razao_social.trim()) {
      toast.error("Preencha a Razão Social");
      return;
    }
    setSaving(true);
    try {
      const payload = {
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
        gestor_nome: gestores[0]?.nome || form.gestor_nome || null,
        gestor_email: gestores[0]?.email || form.gestor_email || null,
        gestor_telefone: gestores[0]?.telefone || form.gestor_telefone || null,
        fiscal_nome: fiscais[0]?.nome || form.fiscal_nome || null,
        fiscal_email: fiscais[0]?.email || form.fiscal_email || null,
        fiscal_telefone: fiscais[0]?.telefone || form.fiscal_telefone || null,
        preposto_nome: prepostos[0]?.nome || form.preposto_nome || null,
        preposto_email: prepostos[0]?.email || form.preposto_email || null,
        preposto_telefone: prepostos[0]?.telefone || form.preposto_telefone || null,
      };

      let empresaId: string;
      if (isEdit) {
        const { error } = await supabase.from("empresas").update(payload).eq("id", empresa.id);
        if (error) throw error;
        empresaId = empresa.id;
      } else {
        const { data, error } = await supabase.from("empresas").insert(payload).select("id").single();
        if (error) throw error;
        empresaId = data.id;
      }

      await saveContatos(empresaId);

      toast.success(isEdit ? "Empresa atualizada!" : "Empresa cadastrada!");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const renderContatoSection = (titulo: string, list: Contato[], setList: (v: Contato[]) => void) => (
    <div className="p-3 rounded-lg border border-border space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => addContato(list, setList)}>
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>
      {list.map((contato, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                className="mt-1 h-9 text-sm"
                value={contato.nome}
                onChange={(e) => updateContato(list, setList, idx, "nome", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                className="mt-1 h-9 text-sm"
                type="email"
                value={contato.email}
                onChange={(e) => updateContato(list, setList, idx, "email", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input
                className="mt-1 h-9 text-sm"
                value={contato.telefone}
                onChange={(e) => updateContato(list, setList, idx, "telefone", e.target.value)}
              />
            </div>
          </div>
          {list.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 mt-5 text-destructive shrink-0"
              onClick={() => removeContato(list, setList, idx)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{isEdit ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* SEÇÃO 1: Dados da Empresa */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Dados da Empresa
            </h3>
            <div className="space-y-3">
              <div>
                <Label>CNPJ *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => update("cnpj", formatCnpj(e.target.value))}
                  />
                  <Button onClick={handleCnpjLookup} disabled={loading} variant="outline" className="shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Razão Social *</Label>
                  <Input
                    className="mt-1"
                    value={form.razao_social}
                    onChange={(e) => update("razao_social", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input
                    className="mt-1"
                    value={form.nome_fantasia}
                    onChange={(e) => update("nome_fantasia", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>CNAE Principal</Label>
                  <Input
                    className="mt-1"
                    value={form.cnae_principal}
                    onChange={(e) => update("cnae_principal", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Grau de Risco (NR-04)</Label>
                  <Input
                    value={form.grau_risco}
                    onChange={(e) => update("grau_risco", e.target.value)}
                    readOnly
                    className="mt-1 bg-muted/50"
                  />
                </div>
              </div>
              <div>
                <Label>Endereço Completo</Label>
                <Input className="mt-1" value={form.endereco} onChange={(e) => update("endereco", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Func. (Fem)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={form.numero_funcionarios_fem}
                    onChange={(e) => update("numero_funcionarios_fem", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Func. (Masc)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={form.numero_funcionarios_masc}
                    onChange={(e) => update("numero_funcionarios_masc", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Total Func.</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={form.total_funcionarios}
                    onChange={(e) => update("total_funcionarios", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Jornada de Trabalho</Label>
                <Input
                  className="mt-1"
                  value={form.jornada_trabalho}
                  onChange={(e) => update("jornada_trabalho", e.target.value)}
                  placeholder="Ex: 8h diárias, 44h semanais"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 2: Informações do Contrato */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Informações do Contrato (Opcional)
            </h3>
            <div className="space-y-3">
              <div>
                <Label>Número do Contrato</Label>
                <Input
                  className="mt-1"
                  value={form.numero_contrato}
                  onChange={(e) => update("numero_contrato", e.target.value)}
                />
              </div>
              <div>
                <Label>CNPJ da Contratante</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj_contratante}
                    onChange={(e) => update("cnpj_contratante", formatCnpj(e.target.value))}
                  />
                  <Button
                    onClick={handleContratanteLookup}
                    disabled={loadingContratante}
                    variant="outline"
                    className="shrink-0"
                  >
                    {loadingContratante ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Nome da Contratante</Label>
                <Input
                  value={form.nome_contratante}
                  onChange={(e) => update("nome_contratante", e.target.value)}
                  readOnly
                  className="mt-1 bg-muted/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vigência Início</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={form.vigencia_inicio}
                    onChange={(e) => update("vigencia_inicio", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Vigência Fim</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={form.vigencia_fim}
                    onChange={(e) => update("vigencia_fim", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Local de Trabalho</Label>
                <Input
                  className="mt-1"
                  value={form.local_trabalho}
                  onChange={(e) => update("local_trabalho", e.target.value)}
                />
              </div>
              <div>
                <Label>Escopo do Contrato</Label>
                <Textarea
                  className="mt-1"
                  value={form.escopo_contrato}
                  onChange={(e) => update("escopo_contrato", e.target.value)}
                  placeholder="Descrição dos serviços contratados"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Responsáveis - Multiple */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Responsáveis do Contrato
            </h3>
            <div className="space-y-4">
              {renderContatoSection("Gestor do Contrato", gestores, setGestores)}
              {renderContatoSection("Fiscal do Contrato", fiscais, setFiscais)}
              {renderContatoSection("Preposto da Empresa", prepostos, setPrepostos)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Atualizar Empresa" : "Salvar Empresa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
