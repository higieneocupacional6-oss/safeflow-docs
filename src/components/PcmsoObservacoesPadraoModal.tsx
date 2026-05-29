import { useState } from "react";
import { Loader2, Plus, BookmarkPlus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PcmsoObservacoesPadraoModal({
  currentText,
  onApply,
}: {
  currentText: string;
  onApply: (newText: string) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTexto, setNovoTexto] = useState("");
  const [criando, setCriando] = useState(false);

  const { data: padroes = [], isLoading } = useQuery({
    queryKey: ["pcmso-obs-padrao"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pcmso_observacoes_padrao").select("*").order("titulo");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const aplicar = () => {
    const textos = (padroes as any[]).filter((p) => selected.includes(p.id)).map((p) => p.texto);
    const final = [currentText.trim(), ...textos].filter(Boolean).join("\n\n");
    onApply(final);
    setOpen(false);
    setSelected([]);
  };

  const salvarPadrao = async () => {
    if (!novoTitulo.trim() || !novoTexto.trim()) { toast.error("Preencha título e texto"); return; }
    setCriando(true);
    const { error } = await supabase.from("pcmso_observacoes_padrao").insert({ titulo: novoTitulo, texto: novoTexto });
    setCriando(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Texto padrão salvo");
    setNovoTitulo(""); setNovoTexto("");
    qc.invalidateQueries({ queryKey: ["pcmso-obs-padrao"] });
  };

  const salvarAtualComoPadrao = async () => {
    if (!currentText.trim()) { toast.error("Observação vazia"); return; }
    const titulo = prompt("Título para este texto padrão:")?.trim();
    if (!titulo) return;
    const { error } = await supabase.from("pcmso_observacoes_padrao").insert({ titulo, texto: currentText });
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Salvo como texto padrão");
    qc.invalidateQueries({ queryKey: ["pcmso-obs-padrao"] });
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from("pcmso_observacoes_padrao").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    qc.invalidateQueries({ queryKey: ["pcmso-obs-padrao"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><BookmarkPlus className="w-4 h-4" />Textos Padrões</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">Textos padrões de observação</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={salvarAtualComoPadrao} disabled={!currentText.trim()}>
              <BookmarkPlus className="w-4 h-4 mr-1" />Salvar observação atual como padrão
            </Button>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase">Selecione textos para inserir</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" />Carregando...</div>
            ) : (padroes as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhum texto padrão cadastrado ainda.</p>
            ) : (
              <div className="space-y-1 mt-2">
                {(padroes as any[]).map((p) => (
                  <div key={p.id} className="flex items-start gap-2 p-2 rounded-md border border-border hover:bg-muted/40">
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{p.titulo}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.texto}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => excluir(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <Label className="text-xs font-bold uppercase">Criar novo texto padrão</Label>
            <Input placeholder="Título" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} />
            <Textarea placeholder="Texto da observação" value={novoTexto} onChange={(e) => setNovoTexto(e.target.value)} rows={3} />
            <Button size="sm" onClick={salvarPadrao} disabled={criando}>
              {criando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Salvar padrão
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={aplicar} disabled={selected.length === 0}>Inserir selecionados ({selected.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
