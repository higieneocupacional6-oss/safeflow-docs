import { ArrowLeft, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { montarListagemLtcat, tituloSetorListagem, type SetorGheLtcat } from "@/lib/ltcatListagem";

type Props = {
  riscos: any[];
  setores?: SetorGheLtcat[];
  unidades: { id: string; simbolo?: string | null; nome?: string | null }[];
  saving: boolean;
  onEdit: (entryId: string) => void;
  onDelete: (agenteId: string, setorId: string, itemId: string) => void;
  onBack: () => void;
};

export function LtcatListagemSetores({ riscos, setores: setoresCadastro = [], unidades, saving, onEdit, onDelete, onBack }: Props) {
  const setores = montarListagemLtcat(riscos, unidades, setoresCadastro);
  if (!setores.length) {
    return (
      <div className="glass-card rounded-xl p-16 text-center text-muted-foreground border-dashed border-2 flex flex-col items-center">
        <FileText className="w-16 h-16 mb-4 opacity-10" />
        <p className="text-xl font-heading font-medium">Nenhum risco com avaliação finalizada.</p>
        <p className="text-sm max-w-xs mx-auto mb-6">Mapeie os riscos nos setores da empresa na etapa anterior para visualizá-los aqui.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {setores.map((setor) => (
        <section key={setor.setorId} className="glass-card rounded-2xl border border-border/60 bg-background/60 overflow-hidden">
          <header className="px-6 py-4 border-b border-accent/20 bg-accent/[0.04]">
            <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-foreground">{tituloSetorListagem(setor.gheGes, setor.setorNome)}</h2>
          </header>
          <div className="divide-y divide-border/40">
            {setor.funcoes.map((funcao) => (
              <div key={funcao.funcaoId} className="px-6 py-4 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-accent">{funcao.funcaoNome}</h3>
                <ul className="space-y-2">
                  {funcao.riscos.map((risco) => (
                    <li key={`${risco.itemId}:${risco.agenteId}`} className="rounded-xl border border-border/50 bg-background px-4 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold text-foreground">{risco.agenteNome}</p>
                        {risco.medidas.length > 0 ? risco.medidas.map((medida, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {[
                              medida.colaborador,
                              [medida.resultado, medida.unidade].filter(Boolean).join(" "),
                              medida.conclusao,
                            ].filter(Boolean).join(" · ")}
                          </p>
                        )) : (
                          <p className="text-sm text-muted-foreground">Sem resultado cadastrado</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editar este risco" onClick={() => onEdit(risco.entryId)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Excluir este risco" disabled={saving} onClick={() => onDelete(risco.agenteId, risco.setorId, risco.itemId)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
