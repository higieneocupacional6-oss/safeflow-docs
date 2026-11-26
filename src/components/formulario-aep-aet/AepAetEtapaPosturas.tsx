import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import {
  POSTURAS_TRABALHO,
  type AepAetPosturas,
  type PosturaTrabalho,
} from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  value: AepAetPosturas;
  onChange: (next: AepAetPosturas) => void;
  errors?: {
    posturas?: boolean;
    outros_descricao?: boolean;
    fotos?: boolean;
  };
};

export function AepAetEtapaPosturas({ value, onChange, errors }: Props) {
  const toggle = (p: PosturaTrabalho, marcado: boolean) => {
    const set = new Set(value.posturas);
    if (marcado) set.add(p);
    else set.delete(p);
    const posturas = POSTURAS_TRABALHO.filter((x) => set.has(x));
    onChange({
      ...value,
      posturas,
      outros_descricao: posturas.includes("Outros") ? value.outros_descricao : "",
    });
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Posturas de trabalho</h2>
        <p className="text-sm text-muted-foreground">
          Selecione todas as posturas observadas. Inclua ao menos uma fotografia.
        </p>
      </div>

      <div
        className={cn(
          "grid gap-2 rounded-lg border p-3 sm:grid-cols-2",
          errors?.posturas ? "border-destructive/60" : "border-border/70",
        )}
      >
        {POSTURAS_TRABALHO.map((p) => {
          const id = `postura-${p}`;
          const checked = value.posturas.includes(p);
          return (
            <label
              key={p}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(c) => toggle(p, c === true)}
              />
              {p}
            </label>
          );
        })}
      </div>

      {value.posturas.includes("Outros") && (
        <div className="space-y-1.5">
          <Label htmlFor="postura-outros">
            Descrição de “Outros” <span className="text-destructive">*</span>
          </Label>
          <Input
            id="postura-outros"
            value={value.outros_descricao}
            onChange={(e) => onChange({ ...value, outros_descricao: e.target.value })}
            placeholder="Descreva a postura"
            aria-invalid={!!errors?.outros_descricao}
            className={errors?.outros_descricao ? "border-destructive" : undefined}
          />
        </div>
      )}

      {value.posturas.length > 0 && (
        <AepAetFotosCampo
          label="Fotografias das posturas"
          fotos={value.fotos}
          onChange={(fotos) => onChange({ ...value, fotos })}
          required
          minFotos={1}
          maxFotos={8}
          error={!!errors?.fotos}
        />
      )}
    </section>
  );
}
