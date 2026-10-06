import { useState } from "react";
import { CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AepContextoIa } from "@/lib/aepContexto";

export function AepIntegracaoBadge({ contexto }: { contexto: AepContextoIa | null }) {
  const [open, setOpen] = useState(false);
  if (!contexto?.disponivel || !contexto.setor) return null;
  const setor = contexto.setor as any;
  return (
    <>
      <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1">AEP correspondente considerada na análise</span>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen(true)}>
          <Eye className="mr-1 h-3.5 w-3.5" /> Ver dados
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">AEP considerada</DialogTitle>
            <DialogDescription>{contexto.observacao}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-xs">
            <p className="font-semibold">{setor.setor || "Setor"}{setor.ghe ? ` — GHE/GES ${setor.ghe}` : ""}</p>
            {setor.funcoes?.length > 0 && <p><span className="font-medium">Funções:</span> {setor.funcoes.join(", ")}</p>}
            {setor.atividade && <p><span className="font-medium">Atividade:</span> {setor.atividade}</p>}
            {setor.parecer_ergonomia && <p><span className="font-medium">Parecer:</span> {setor.parecer_ergonomia}</p>}
            {contexto.aprofundamento && <p><span className="font-medium">Encaminhamento:</span> {contexto.aprofundamento.indicacao_aet === "recomendada" ? "AET recomendada" : contexto.aprofundamento.indicacao_aet === "solucao_preliminar_indicada" ? "Solução preliminar / plano de ação indicado" : "Não informado"}</p>}
            {contexto.aprofundamento?.motivo_registrado && <p><span className="font-medium">Motivo registrado:</span> {contexto.aprofundamento.motivo_registrado}</p>}
            <p className="text-muted-foreground">Os dados são somente consultados para aprofundar a AET. A AEP não é alterada.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}