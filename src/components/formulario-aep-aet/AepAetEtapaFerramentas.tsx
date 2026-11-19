import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import {
  MOBILIARIO_OPERACIONAL_SUGESTOES,
  type AepAetFerramentasMobiliario,
  type MobiliarioOperacionalSugestao,
} from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  value: AepAetFerramentasMobiliario;
  onChange: (next: AepAetFerramentasMobiliario) => void;
  errors?: {
    sugestoes?: boolean;
    descricao?: boolean;
    fotos?: boolean;
  };
};

export function AepAetEtapaFerramentas({ value, onChange, errors }: Props) {
  const toggle = (item: MobiliarioOperacionalSugestao, marcado: boolean) => {
    const set = new Set(value.sugestoes);
    if (marcado) set.add(item);
    else set.delete(item);
    onChange({
      ...value,
      sugestoes: MOBILIARIO_OPERACIONAL_SUGESTOES.filter((s) => set.has(s)),
    });
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">
          Ferramentas e mobiliário operacional
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecione sugestões, descreva o que for necessário e registre 3 fotografias.
        </p>
      </div>

      <div
        className={cn(
          "grid gap-1 rounded-lg border p-3 sm:grid-cols-2",
          errors?.sugestoes ? "border-destructive/60" : "border-border/70",
        )}
      >
        {MOBILIARIO_OPERACIONAL_SUGESTOES.map((item) => {
          const id = `mob-op-${item}`;
          return (
            <label
              key={item}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
            >
              <Checkbox
                id={id}
                checked={value.sugestoes.includes(item)}
                onCheckedChange={(c) => toggle(item, c === true)}
              />
              {item}
            </label>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ferr-desc">
          Descrição livre
          {(value.sugestoes.includes("Outros") || (!value.sugestoes.length && errors?.descricao)) && (
            <span className="text-destructive"> *</span>
          )}
        </Label>
        <Textarea
          id="ferr-desc"
          rows={4}
          value={value.descricao}
          onChange={(e) => onChange({ ...value, descricao: e.target.value })}
          placeholder="Ferramentas utilizadas, mobiliário operacional e observações"
          aria-invalid={!!errors?.descricao}
          className={errors?.descricao ? "border-destructive" : undefined}
        />
      </div>

      <AepAetFotosCampo
        label="Fotografias"
        fotos={value.fotos}
        onChange={(fotos) => onChange({ ...value, fotos })}
        required
        minFotos={3}
        maxFotos={3}
        error={!!errors?.fotos}
      />
    </section>
  );
}
