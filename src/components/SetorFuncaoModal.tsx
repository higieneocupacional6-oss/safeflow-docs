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
  empresaId: string;
  onSaved: () => void;
}

export function SetorFuncaoModal({ open, onOpenChange, empresaId, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [gheGes, setGheGes] = useState("");
  const [nomeSetor, setNomeSetor] = useState("");
  const [descAmbiente, setDescAmbiente] = useState("");
  const [nomeFuncao, setNomeFuncao] = useState("");
  const [cboCodigo, setCboCodigo] = useState("");
  const [cboDescricao, setCboDescricao] = useState("");
  const [descAtividades, setDescAtividades] = useState("");
  const [expostos, setExpostos] = useState("");

  const reset = () => {
    setGheGes(""); setNomeSetor(""); setDescAmbiente("");
    setNomeFuncao(""); setCboCodigo(""); setCboDescricao(""); setDescAtividades(""); setExpostos("");
  };

  const handleSave = async () => {
    if (!nomeSetor.trim()) { toast.error("Informe o nome do setor"); return; }
    if (!nomeFuncao.trim()) { toast.error("Informe o nome da função"); return; }

    setSaving(true);
    try {
      const { data: setor, error: sErr } = await supabase
        .from("setores")
        .insert({ empresa_id: empresaId, ghe_ges: gheGes || null, nome_setor: nomeSetor.trim(), descricao_ambiente: descAmbiente || null })
        .select("id")
        .single();
      if (sErr) throw sErr;

      const { error: fErr } = await supabase
        .from("funcoes")
        .insert({
          setor_id: setor.id,
          nome_funcao: nomeFuncao.trim(),
          cbo_codigo: cboCodigo || null,
          cbo_descricao: cboDescricao || null,
          descricao_atividades: descAtividades || null,
          expostos: expostos || null,
        } as any);
      if (fErr) throw fErr;

      toast.success("Setor e função cadastrados com sucesso!");
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Setor e Função</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Seção 1 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados do Setor</h4>
            <div className="space-y-3">
              <div>
                <Label>GHE/GES</Label>
                <Input className="mt-1" placeholder="Ex: GHE 01" value={gheGes} onChange={e => setGheGes(e.target.value)} />
              </div>
              <div>
                <Label>Nome do Setor *</Label>
                <Input className="mt-1" placeholder="Ex: Produção" value={nomeSetor} onChange={e => setNomeSetor(e.target.value)} />
              </div>
              <div>
                <Label>Descrição do Ambiente</Label>
                <Textarea className="mt-1" placeholder="Descreva as características do ambiente de trabalho" value={descAmbiente} onChange={e => setDescAmbiente(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Seção 2 */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados da Função</h4>
            <div className="space-y-3">
              <div>
                <Label>Nome da Função *</Label>
                <Input className="mt-1" placeholder="Ex: Operador de Máquina" value={nomeFuncao} onChange={e => setNomeFuncao(e.target.value)} />
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
                <Textarea className="mt-1" placeholder="Descreva as atividades exercidas na função" value={descAtividades} onChange={e => setDescAtividades(e.target.value)} />
              </div>
              <div>
                <Label>Expostos</Label>
                <Input className="mt-1" type="number" min="0" placeholder="Quantidade de trabalhadores expostos" value={expostos} onChange={e => setExpostos(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Cadastro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
