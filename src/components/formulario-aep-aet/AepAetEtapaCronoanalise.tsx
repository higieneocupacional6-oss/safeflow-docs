import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AepAetMicrofoneDitado } from "@/components/formulario-aep-aet/AepAetMicrofoneDitado";
import {
  novaLinhaCronoanalise,
  type AepAetCronoanalise,
  type AepAetCronoLinha,
} from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  value: AepAetCronoanalise;
  onChange: (next: AepAetCronoanalise) => void;
  errors?: { linhas?: boolean; linhaIds?: Record<string, { tarefa?: boolean; tempo?: boolean; frequencia?: boolean }> };
};

export function AepAetEtapaCronoanalise({ value, onChange, errors }: Props) {
  const atualizarLinha = (id: string, patch: Partial<AepAetCronoLinha>) => {
    onChange({
      ...value,
      linhas: value.linhas.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const remover = (id: string) => {
    const next = value.linhas.filter((l) => l.id !== id);
    onChange({ linhas: next.length ? next : [novaLinhaCronoanalise()] });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Cronoanálise</h2>
          <p className="text-sm text-muted-foreground">
            Liste as tarefas com tempo e frequência. Use o microfone para ditar a descrição.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ linhas: [...value.linhas, novaLinhaCronoanalise()] })}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Adicionar linha
        </Button>
      </div>

      <div className={cn("space-y-3", errors?.linhas && "rounded-lg ring-1 ring-destructive/50")}>
        {value.linhas.map((linha, idx) => {
          const err = errors?.linhaIds?.[linha.id];
          return (
            <div
              key={linha.id}
              className="space-y-3 rounded-xl border border-border/70 bg-card p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Linha {idx + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={`Remover linha ${idx + 1}`}
                  onClick={() => remover(linha.id)}
                  disabled={value.linhas.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`crono-tarefa-${linha.id}`}>
                  Tarefa <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`crono-tarefa-${linha.id}`}
                    value={linha.tarefa}
                    onChange={(e) => atualizarLinha(linha.id, { tarefa: e.target.value })}
                    placeholder="Descrição da tarefa"
                    aria-invalid={!!err?.tarefa}
                    className={cn("flex-1", err?.tarefa && "border-destructive")}
                  />
                  <AepAetMicrofoneDitado
                    value={linha.tarefa}
                    onChange={(tarefa) => atualizarLinha(linha.id, { tarefa })}
                    label="Ditar tarefa"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`crono-tempo-${linha.id}`}>
                    Tempo da tarefa (minutos) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`crono-tempo-${linha.id}`}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={linha.tempo_minutos}
                    onChange={(e) => atualizarLinha(linha.id, { tempo_minutos: e.target.value })}
                    aria-invalid={!!err?.tempo}
                    className={err?.tempo ? "border-destructive" : undefined}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`crono-freq-${linha.id}`}>
                    Frequência <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`crono-freq-${linha.id}`}
                    value={linha.frequencia}
                    onChange={(e) => atualizarLinha(linha.id, { frequencia: e.target.value })}
                    placeholder="Ex.: 10x/turno"
                    aria-invalid={!!err?.frequencia}
                    className={err?.frequencia ? "border-destructive" : undefined}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
