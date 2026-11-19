import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import {
  ESFORCO_SEM_ATIVIDADE,
  ESFORCOS_FISICOS,
  aplicarSelecaoEsforco,
  type AepAetEsforcoFisico,
} from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  value: AepAetEsforcoFisico;
  onChange: (next: AepAetEsforcoFisico) => void;
  errors?: {
    opcoes?: boolean;
    peso_estimado?: boolean;
    unidade?: boolean;
    caracteristicas_carga?: boolean;
    frequencia?: boolean;
    descricao_atividade?: boolean;
    fotos?: boolean;
  };
};

export function AepAetEtapaEsforco({ value, onChange, errors }: Props) {
  const exigeDetalhes = !value.sem_esforco && value.opcoes.length > 0;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Esforço físico</h2>
        <p className="text-sm text-muted-foreground">
          Selecione as atividades de esforço. Se não houver, marque a última opção.
        </p>
      </div>

      <div
        className={cn(
          "space-y-1 rounded-lg border p-3",
          errors?.opcoes ? "border-destructive/60" : "border-border/70",
        )}
      >
        {ESFORCOS_FISICOS.map((op) => {
          const id = `esforco-${op}`;
          return (
            <label
              key={op}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
            >
              <Checkbox
                id={id}
                checked={value.opcoes.includes(op)}
                onCheckedChange={(c) =>
                  onChange(aplicarSelecaoEsforco(value, op, c === true))
                }
              />
              {op}
            </label>
          );
        })}
        <label
          htmlFor="esforco-sem"
          className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border-t border-border/60 px-2 py-2 text-sm hover:bg-muted/40"
        >
          <Checkbox
            id="esforco-sem"
            checked={value.sem_esforco}
            onCheckedChange={(c) =>
              onChange(aplicarSelecaoEsforco(value, ESFORCO_SEM_ATIVIDADE, c === true))
            }
          />
          {ESFORCO_SEM_ATIVIDADE}
        </label>
      </div>

      {exigeDetalhes && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="esf-peso">
                Peso estimado <span className="text-destructive">*</span>
              </Label>
              <Input
                id="esf-peso"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={value.peso_estimado}
                onChange={(e) => onChange({ ...value, peso_estimado: e.target.value })}
                placeholder="Ex.: 15"
                aria-invalid={!!errors?.peso_estimado}
                className={errors?.peso_estimado ? "border-destructive" : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Unidade <span className="text-destructive">*</span>
              </Label>
              <Select
                value={value.unidade || undefined}
                onValueChange={(v) =>
                  onChange({ ...value, unidade: v === "kg" || v === "g" ? v : "" })
                }
              >
                <SelectTrigger
                  aria-invalid={!!errors?.unidade}
                  className={errors?.unidade ? "border-destructive" : undefined}
                >
                  <SelectValue placeholder="kg ou g" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="esf-carac">
              Características da carga <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="esf-carac"
              rows={2}
              value={value.caracteristicas_carga}
              onChange={(e) => onChange({ ...value, caracteristicas_carga: e.target.value })}
              placeholder="Formato, volume, pegada, condições…"
              aria-invalid={!!errors?.caracteristicas_carga}
              className={errors?.caracteristicas_carga ? "border-destructive" : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="esf-freq">
              Frequência <span className="text-destructive">*</span>
            </Label>
            <Input
              id="esf-freq"
              value={value.frequencia}
              onChange={(e) => onChange({ ...value, frequencia: e.target.value })}
              placeholder="Ex.: 10 vezes por turno"
              aria-invalid={!!errors?.frequencia}
              className={errors?.frequencia ? "border-destructive" : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="esf-desc">
              Descrição da atividade <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="esf-desc"
              rows={3}
              value={value.descricao_atividade}
              onChange={(e) => onChange({ ...value, descricao_atividade: e.target.value })}
              placeholder="Descreva como o esforço é realizado"
              aria-invalid={!!errors?.descricao_atividade}
              className={errors?.descricao_atividade ? "border-destructive" : undefined}
            />
          </div>

          <AepAetFotosCampo
            label="Fotografia do esforço físico"
            fotos={value.fotos}
            onChange={(fotos) => onChange({ ...value, fotos })}
            required
            error={!!errors?.fotos}
          />
        </div>
      )}
    </section>
  );
}
