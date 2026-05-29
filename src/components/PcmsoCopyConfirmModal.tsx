import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, FilePlus2 } from "lucide-react";

export function PcmsoCopyConfirmModal({
  open, onOpenChange, title, onYes, onNo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-heading">{title}</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          <button
            onClick={onYes}
            className="w-full text-left p-4 rounded-lg border-2 border-accent/40 hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3"
          >
            <Copy className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <div className="font-heading font-semibold text-foreground">SIM, copiar do PGR</div>
              <p className="text-xs text-muted-foreground mt-0.5">Preenche automaticamente os campos. Tudo permanece editável e independente após a cópia.</p>
            </div>
          </button>
          <button
            onClick={onNo}
            className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3"
          >
            <FilePlus2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="font-heading font-semibold text-foreground">NÃO, começar em branco</div>
              <p className="text-xs text-muted-foreground mt-0.5">Preencher manualmente.</p>
            </div>
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
