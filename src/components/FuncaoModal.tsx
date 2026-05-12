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


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  setorId: string;
  onSaved: () => void;
}

export function FuncaoModal({ open, onOpenChange, setorId, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [nomeFuncao, setNomeFuncao] = useState("");
  const [cbo, setCbo] = useState("");
  const [descAtividades, setDescAtividades] = useState("");
  const [expostos, setExpostos] = useState("");

  const reset = () => {
    setNomeFuncao(""); setCbo(""); setDescAtividades(""); setExpostos("");
  };

  const handleSave = async () => {
    if (!nomeFuncao.trim()) { toast.error("Informe o nome da função"); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from("funcoes").insert({
        setor_id: setorId,
        nome_funcao: nomeFuncao.trim(),
        cbo_codigo: cbo || null,
        cbo_descricao: null,
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
            <Input
              className="mt-1"
              placeholder="Ex: 5143-25 ou Técnico de Segurança"
              value={cbo}
              onChange={e => setCbo(e.target.value)}
            />
          </div>
          <div>
            <Label>Descrição das Atividades</Label>
            <Textarea className="mt-1" placeholder="Descreva as atividades exercidas" value={descAtividades} onChange={e => setDescAtividades(e.target.value)} />
          </div>
          <div>
            <Label>Expostos</Label>
            <Input className="mt-1" type="number" min="0" placeholder="Quantidade de trabalhadores expostos" value={expostos} onChange={e => setExpostos(e.target.value)} />
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
