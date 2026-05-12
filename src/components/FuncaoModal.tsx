import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CboAutocomplete } from "@/components/CboAutocomplete";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  setorId: string;
  onSaved: () => void;
}

export function FuncaoModal({ open, onOpenChange, setorId, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [nomeFuncao, setNomeFuncao] = useState("");
  const [cboCodigo, setCboCodigo] = useState("");
  const [cboDescricao, setCboDescricao] = useState("");
  const [descAtividades, setDescAtividades] = useState("");
  const [expostos, setExpostos] = useState("");

  const reset = () => {
    setNomeFuncao(""); setCboCodigo(""); setCboDescricao(""); setDescAtividades(""); setExpostos("");
  };

  const handleSave = async () => {
    if (!nomeFuncao.trim()) { toast.error("Informe o nome da função"); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from("funcoes").insert({
        setor_id: setorId,
        nome_funcao: nomeFuncao.trim(),
        cbo_codigo: cboCodigo || null,
        cbo_descricao: cboDescricao || null,
        descricao_atividades: descAtividades || null,
        expostos: expostos || null,
      } as any);
      if (error) throw error;

      toast.success("Função cadastrada com sucesso!");
      onSaved();
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Adicionar Função</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label>Nome da Função *</Label>
            <Input className="mt-1" placeholder="Ex: Auxiliar de Produção" value={nomeFuncao} onChange={e => setNomeFuncao(e.target.value)} />
          </div>
          <div>
            <Label>CBO</Label>
            <CboAutocomplete
              value={cboCodigo}
              onSelect={(codigo, descricao) => { setCboCodigo(codigo); setCboDescricao(descricao); }}
            />
          </div>
          {cboDescricao && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">CBO: {cboCodigo} — {cboDescricao}</p>
          )}
          <div>
            <Label>Descrição das Atividades</Label>
            <Textarea className="mt-1" placeholder="Descreva as atividades exercidas" value={descAtividades} onChange={e => setDescAtividades(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Função
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
