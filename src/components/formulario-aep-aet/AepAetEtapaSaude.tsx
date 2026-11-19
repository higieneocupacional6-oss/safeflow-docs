import { Checkbox } from "@/components/ui/checkbox";
import { AepAetSimNao } from "@/components/formulario-aep-aet/AepAetSimNao";
import {
  LOCAIS_DESCONFORTO,
  type AepAetDadosSaude,
  type LocalDesconforto,
} from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  value: AepAetDadosSaude;
  onChange: (next: AepAetDadosSaude) => void;
  errors?: {
    sente_desconforto?: boolean;
    locais?: boolean;
  };
};

export function AepAetEtapaSaude({ value, onChange, errors }: Props) {
  const toggle = (local: LocalDesconforto, marcado: boolean) => {
    const set = new Set(value.locais);
    if (marcado) set.add(local);
    else set.delete(local);
    onChange({
      ...value,
      locais: LOCAIS_DESCONFORTO.filter((l) => set.has(l)),
    });
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Dados de saúde</h2>
        <p className="text-sm text-muted-foreground">
          Registro de desconforto físico relatado pelo colaborador.
        </p>
      </div>

      <AepAetSimNao
        id="saude-desc"
        label="O colaborador sente algum tipo de desconforto físico?"
        value={value.sente_desconforto}
        onChange={(sente_desconforto) =>
          onChange({
            ...value,
            sente_desconforto,
            locais: sente_desconforto === "nao" ? [] : value.locais,
          })
        }
        required
        error={!!errors?.sente_desconforto}
      />

      {value.sente_desconforto === "sim" && (
        <div
          className={cn(
            "grid gap-1 rounded-lg border p-3 sm:grid-cols-2",
            errors?.locais ? "border-destructive/60" : "border-border/70",
          )}
        >
          <p className="sm:col-span-2 mb-1 text-sm font-medium">
            Locais do desconforto <span className="text-destructive">*</span>
          </p>
          {LOCAIS_DESCONFORTO.map((local) => {
            const id = `desc-${local}`;
            return (
              <label
                key={local}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
              >
                <Checkbox
                  id={id}
                  checked={value.locais.includes(local)}
                  onCheckedChange={(c) => toggle(local, c === true)}
                />
                {local}
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
