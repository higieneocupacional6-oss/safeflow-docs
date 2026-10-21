import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET_FORM_AEP_BASE } from "@/lib/formularioAepBase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type AprParaExcluir = { id: string; nome: string };
export function AprErgoExcluirModal({ registros, empresaId, contratoId, onClose, onDeleted }: {
  registros: AprParaExcluir[]; empresaId: string; contratoId: string; onClose: () => void; onDeleted?: (id: string) => void;
}) {
  const [selecionado, setSelecionado] = useState(registros.length === 1 ? registros[0].id : "");
  const [excluindo, setExcluindo] = useState(false);
  const busy = useRef(false);
  const qc = useQueryClient();
  const excluir = async () => {
    if (busy.current || !registros.some((r) => r.id === selecionado) || !empresaId || !contratoId) return;
    busy.current = true; setExcluindo(true);
    try {
      const prefixo = `${empresaId}/${contratoId}/${selecionado}/apr-base`;
      const bucket = supabase.storage.from(BUCKET_FORM_AEP_BASE);
      const { data: arquivos, error: erroLista } = await bucket.list(prefixo, { limit: 1000 });
      if (erroLista) throw erroLista;
      const { data: removidos, error } = await supabase.from("documentos").delete().eq("id", selecionado).eq("tipo", "APR-ERGO").eq("empresa_id", empresaId).eq("contrato_id", contratoId).select("id");
      if (error || removidos?.length !== 1) throw new Error("APR indisponível para exclusão.");
      const caminhos = (arquivos || []).filter((f) => f.id).map((f) => `${prefixo}/${f.name}`);
      const limpeza = caminhos.length ? await bucket.remove(caminhos) : { error: null };
      await Promise.all(["apr-ergo-registros", "apr-ergo-registro", "apr-ergo-documentos", "apr-ergo-documento", "documentos"].map((key) => qc.invalidateQueries({ queryKey: [key] })));
      if (limpeza.error) toast.warning("APR excluída, mas não foi possível remover seus arquivos da Base.");
      else toast.success("APR-ERGO excluída");
      onDeleted?.(selecionado); onClose();
    } catch { toast.error("Não foi possível excluir a APR. Tente novamente."); }
    finally { busy.current = false; setExcluindo(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy.current) onClose(); }}><DialogContent><DialogHeader>
    <DialogTitle>Excluir APR-ERGO?</DialogTitle>
    <DialogDescription>Esta ação é definitiva e remove somente a APR selecionada, sua planilha, fotos e arquivos da Base. As demais APRs serão preservadas.</DialogDescription>
  </DialogHeader>
    {registros.length === 1 ? <p className="text-sm font-medium break-words">{registros[0].nome}</p> : <div className="max-h-72 overflow-y-auto space-y-2" role="radiogroup">{registros.map((r) => <label key={r.id} className="flex items-center gap-3 border border-border rounded-md p-3"><input type="radio" name="apr-excluir" value={r.id} disabled={excluindo} checked={selecionado === r.id} onChange={() => setSelecionado(r.id)} /><span className="text-sm break-words">{r.nome}</span></label>)}</div>}
    <DialogFooter><Button variant="outline" disabled={excluindo} onClick={onClose}>Cancelar</Button><Button variant="destructive" disabled={!selecionado || excluindo} onClick={() => void excluir()}>{excluindo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Excluir APR</Button></DialogFooter>
  </DialogContent></Dialog>;
}