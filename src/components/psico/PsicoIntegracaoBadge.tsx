import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, Eye } from "lucide-react";
import type { PsicoContextoIa, PsicoResumoEscopo } from "@/lib/psicoContexto";

function Resumo({ r }: { r: PsicoResumoEscopo }) {
  return (
    <div className="rounded-md border p-3 space-y-2 text-xs">
      <p className="font-semibold">
        {r.escopo === "setor"
          ? `Setor avaliado${r.setor ? `: ${r.setor}` : ""}${r.ghe ? ` — GHE/GES ${r.ghe}` : ""}`
          : "Dados gerais da empresa"}
        {" "}· {r.respostas} avaliação(ões)
      </p>
      {r.funcoes.length > 0 && (
        <p className="text-muted-foreground">Funções: {r.funcoes.join(", ")}</p>
      )}
      {r.fatores.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-x-4">
          {r.fatores.map((f) => (
            <li key={f.bloco} className="flex justify-between gap-2">
              <span className="truncate">{f.titulo}</span>
              <span className="font-medium shrink-0">{f.classificacao}{f.media != null ? ` (${f.media})` : ""}</span>
            </li>
          ))}
        </ul>
      )}
      {r.riscos.length > 0 && (
        <p><span className="font-medium">Riscos identificados:</span> {r.riscos.join(", ")}</p>
      )}
      {r.resumos.length > 0 && (
        <div className="space-y-1">
          {r.resumos.map((t, i) => (
            <p key={i} className="text-muted-foreground">{t}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function PsicoIntegracaoBadge({ contexto }: { contexto: PsicoContextoIa | null }) {
  const [open, setOpen] = useState(false);
  if (!contexto?.disponivel) return null;

  return (
    <>
      <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1">
          Dados psicossociais considerados na análise
          {contexto.origem === "empresa" ? " (informação geral da empresa)" : " (setor/GHE correspondente)"}
        </span>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen(true)}>
          <Eye className="w-3.5 h-3.5 mr-1" /> Ver dados
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Dados psicossociais considerados</DialogTitle>
            <DialogDescription>{contexto.observacao}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {contexto.setor_resumo && <Resumo r={contexto.setor_resumo} />}
            {!contexto.setor_resumo && contexto.empresa_resumo && <Resumo r={contexto.empresa_resumo} />}
            {contexto.avaliacoes.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Avaliações psicossociais da empresa:{" "}
                {contexto.avaliacoes.map((a) => `${a.titulo || "Avaliação"}${a.data ? ` (${a.data})` : ""}`).join(" · ")}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Estes dados são apenas consultados pela IA para correlação técnica. O módulo Psicossocial
              não é alterado.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
