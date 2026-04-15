import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EsocialAutocomplete } from "@/components/EsocialAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingId?: string;
}

const propagacaoOptions = ["Aérea", "Contato", "Dérmica"];

export function RiscoModal({ open, onOpenChange, onSaved, editingId }: Props) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [codigoEsocial, setCodigoEsocial] = useState("");
  const [descricaoEsocial, setDescricaoEsocial] = useState("");
  const [propagacao, setPropagacao] = useState<string[]>([]);
  const [tipoExposicao, setTipoExposicao] = useState("");
  const [fonteGeradora, setFonteGeradora] = useState("");
  const [danosSaude, setDanosSaude] = useState("");
  const [medidasControle, setMedidasControle] = useState("");
  const [tipoEpi, setTipoEpi] = useState("");
  const [epiEficaz, setEpiEficaz] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId && open) {
      const loadData = async () => {
        const { data, error } = await supabase.from("riscos").select("*").eq("id", editingId).single();
        if (data && !error) {
          setNome(data.nome || "");
          setTipo(data.tipo || "");
          setCodigoEsocial(data.codigo_esocial || "");
          setDescricaoEsocial(data.descricao_esocial || "");
          setPropagacao(data.propagacao || []);
          setTipoExposicao(data.tipo_exposicao || "");
          setFonteGeradora(data.fonte_geradora || "");
          setDanosSaude(data.danos_saude || "");
          setMedidasControle(data.medidas_controle || "");
          setTipoEpi(data.tipo_epi || "");
          setEpiEficaz(data.epi_eficaz || "");
        }
      };
      loadData();
    } else if (!editingId && open) {
      reset();
    }
  }, [editingId, open]);

  const reset = () => {
    setNome(""); setTipo(""); setCodigoEsocial(""); setDescricaoEsocial("");
    setPropagacao([]); setTipoExposicao(""); setFonteGeradora("");
    setDanosSaude(""); setMedidasControle(""); setTipoEpi(""); setEpiEficaz("");
  };

  const handleSave = async () => {
    if (!nome.trim() || !tipo) {
      toast.error("Preencha o nome do agente e o tipo.");
      return;
    }
    setSaving(true);
    const payload = {
      nome: nome.trim(),
      tipo,
      codigo_esocial: codigoEsocial || null,
      descricao_esocial: descricaoEsocial || null,
      propagacao: propagacao.length > 0 ? propagacao : null,
      tipo_exposicao: tipoExposicao || null,
      fonte_geradora: fonteGeradora || null,
      danos_saude: danosSaude || null,
      medidas_controle: medidasControle || null,
      tipo_epi: tipoEpi || null,
      epi_eficaz: epiEficaz || null,
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from("riscos").update(payload).eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from("riscos").insert(payload);
      error = err;
    }
    setSaving(false);
    if (error) { toast.error("Erro ao salvar risco."); return; }
    toast.success(editingId ? "Risco atualizado com sucesso!" : "Risco cadastrado com sucesso!");
    reset();
    onOpenChange(false);
    onSaved();
  };

  const togglePropagacao = (val: string) => {
    setPropagacao((prev) => prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{editingId ? "Editar Risco / Agente" : "Novo Risco / Agente"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* SEÇÃO 1 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identificação do Agente</h4>
            <div className="space-y-3">
              <div>
                <Label>Nome do Agente *</Label>
                <Input className="mt-1" placeholder="Ex: Ruído Contínuo" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <Label>Tipo de Agente *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Físico">Físico</SelectItem>
                    <SelectItem value="Químico">Químico</SelectItem>
                    <SelectItem value="Biológico">Biológico</SelectItem>
                    <SelectItem value="Ergonômico">Ergonômico</SelectItem>
                    <SelectItem value="Acidente">Acidente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 2 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Integração eSocial (Tabela 24)</h4>
            <div>
              <Label>Tabela eSocial</Label>
              <div className="mt-1">
                <EsocialAutocomplete
                  value={codigoEsocial ? `${codigoEsocial} - ${descricaoEsocial}` : ""}
                  onSelect={(a) => { setCodigoEsocial(a.codigo); setDescricaoEsocial(a.descricao); }}
                />
              </div>
            </div>
            {codigoEsocial && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Código</Label>
                  <Input value={codigoEsocial} readOnly className="mt-1 bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <Input value={descricaoEsocial} readOnly className="mt-1 bg-muted/50" />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* SEÇÃO 3 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Caracterização da Exposição</h4>
            <div className="space-y-3">
              <div>
                <Label>Propagação</Label>
                <div className="flex gap-4 mt-2">
                  {propagacaoOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={propagacao.includes(opt)}
                        onCheckedChange={() => togglePropagacao(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Tipo de Exposição</Label>
                <Select value={tipoExposicao} onValueChange={setTipoExposicao}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eventual">Eventual</SelectItem>
                    <SelectItem value="Intermitente">Intermitente</SelectItem>
                    <SelectItem value="Habitual">Habitual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 4 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detalhamento Técnico</h4>
            <div className="space-y-3">
              <div>
                <Label>Fonte Geradora</Label>
                <Textarea className="mt-1" placeholder="Descreva a fonte geradora do risco" value={fonteGeradora} onChange={(e) => setFonteGeradora(e.target.value)} />
              </div>
              <div>
                <Label>Danos à Saúde</Label>
                <Textarea className="mt-1" placeholder="Descreva os possíveis danos à saúde" value={danosSaude} onChange={(e) => setDanosSaude(e.target.value)} />
              </div>
              <div>
                <Label>Medidas de Controle Existentes</Label>
                <Textarea className="mt-1" placeholder="Descreva as medidas de controle" value={medidasControle} onChange={(e) => setMedidasControle(e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEÇÃO 5 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">EPI</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de EPI</Label>
                <Input className="mt-1" placeholder="Ex: Protetor auricular" value={tipoEpi} onChange={(e) => setTipoEpi(e.target.value)} />
              </div>
              <div>
                <Label>EPI é eficaz?</Label>
                <Select value={epiEficaz} onValueChange={setEpiEficaz}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Risco"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
