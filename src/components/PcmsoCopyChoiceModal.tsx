import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, FilePlus2 } from "lucide-react";

export function PcmsoCopyChoiceModal({
  open, onOpenChange, title, description, onChoose,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onChoose: (copy: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-2 py-2">
          <button onClick={() => onChoose(true)} className="w-full text-left p-4 rounded-lg border-2 border-accent/40 hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3">
            <Copy className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <div className="font-heading font-semibold text-foreground">SIM, copiar do PGR</div>
              <p className="text-xs text-muted-foreground mt-0.5">Preenche automaticamente a partir do PGR mais recente da empresa. Tudo permanece editável.</p>
            </div>
          </button>
          <button onClick={() => onChoose(false)} className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors flex items-start gap-3">
            <FilePlus2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="font-heading font-semibold text-foreground">NÃO, deixar em branco</div>
              <p className="text-xs text-muted-foreground mt-0.5">Inicia esta etapa em branco para preenchimento manual.</p>
            </div>
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
