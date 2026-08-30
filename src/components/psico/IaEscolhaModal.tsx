import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, PenLine } from "lucide-react";

export function IaEscolhaModal({
  open, onOpenChange, onEscolher,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEscolher: (usarIa: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Deseja utilizar IA para gerar o relatório?</DialogTitle>
          <DialogDescription>
            Com a IA ativada, os textos técnicos são elaborados a partir dos dados reais da empresa,
            contrato, setores, GHE/GES, funções, atividades, avaliações, respostas e indicadores,
            somados aos PDFs cadastrados na base técnica. Todo o conteúdo permanece editável antes da
            emissão.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => { onOpenChange(false); onEscolher(false); }}>
            <PenLine className="w-4 h-4 mr-1.5" /> Não, gerar manualmente
          </Button>
          <Button onClick={() => { onOpenChange(false); onEscolher(true); }}>
            <Sparkles className="w-4 h-4 mr-1.5" /> Sim, utilizar IA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
