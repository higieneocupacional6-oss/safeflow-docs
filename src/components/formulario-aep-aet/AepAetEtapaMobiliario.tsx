import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import type { AepAetMobiliarioEquipamentos } from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type FieldErr = Partial<Record<string, boolean>>;

type Props = {
  value: AepAetMobiliarioEquipamentos;
  onChange: (next: AepAetMobiliarioEquipamentos) => void;
  errors?: {
    mesa?: FieldErr;
    cadeira?: FieldErr;
    monitor?: FieldErr;
  };
};

function CampoNum({
  id,
  label,
  value,
  onChange,
  error,
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn(error && "border-destructive", suffix && "pr-12")}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function AepAetEtapaMobiliario({ value, onChange, errors }: Props) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-base font-semibold">Mobiliário e equipamentos</h2>
        <p className="text-sm text-muted-foreground">
          Dimensões e registros fotográficos de mesa, cadeira e monitor/periféricos.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 p-4">
        <h3 className="font-heading text-sm font-semibold">Mesa</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum
            id="mesa-alt"
            label="Altura"
            suffix="cm"
            value={value.mesa.altura_cm}
            onChange={(altura_cm) => onChange({ ...value, mesa: { ...value.mesa, altura_cm } })}
            error={!!errors?.mesa?.altura_cm}
          />
          <CampoNum
            id="mesa-comp"
            label="Comprimento"
            suffix="cm"
            value={value.mesa.comprimento_cm}
            onChange={(comprimento_cm) =>
              onChange({ ...value, mesa: { ...value.mesa, comprimento_cm } })
            }
            error={!!errors?.mesa?.comprimento_cm}
          />
          <CampoNum
            id="mesa-larg"
            label="Largura"
            suffix="cm"
            value={value.mesa.largura_cm}
            onChange={(largura_cm) => onChange({ ...value, mesa: { ...value.mesa, largura_cm } })}
            error={!!errors?.mesa?.largura_cm}
          />
          <div className="space-y-1.5">
            <Label htmlFor="mesa-cor">
              Cor <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mesa-cor"
              value={value.mesa.cor}
              onChange={(e) => onChange({ ...value, mesa: { ...value.mesa, cor: e.target.value } })}
              aria-invalid={!!errors?.mesa?.cor}
              className={errors?.mesa?.cor ? "border-destructive" : undefined}
            />
          </div>
        </div>
        <AepAetFotosCampo
          label="Foto da mesa"
          fotos={value.mesa.fotos}
          onChange={(fotos) => onChange({ ...value, mesa: { ...value.mesa, fotos } })}
          required
          minFotos={1}
          maxFotos={1}
          error={!!errors?.mesa?.fotos}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 p-4">
        <h3 className="font-heading text-sm font-semibold">Cadeira</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum
            id="cad-alt"
            label="Altura do assento"
            suffix="cm"
            value={value.cadeira.altura_assento_cm}
            onChange={(altura_assento_cm) =>
              onChange({ ...value, cadeira: { ...value.cadeira, altura_assento_cm } })
            }
            error={!!errors?.cadeira?.altura_assento_cm}
          />
          <CampoNum
            id="cad-prof"
            label="Profundidade do assento"
            suffix="cm"
            value={value.cadeira.profundidade_assento_cm}
            onChange={(profundidade_assento_cm) =>
              onChange({ ...value, cadeira: { ...value.cadeira, profundidade_assento_cm } })
            }
            error={!!errors?.cadeira?.profundidade_assento_cm}
          />
          <CampoNum
            id="cad-larg"
            label="Largura do assento"
            suffix="cm"
            value={value.cadeira.largura_assento_cm}
            onChange={(largura_assento_cm) =>
              onChange({ ...value, cadeira: { ...value.cadeira, largura_assento_cm } })
            }
            error={!!errors?.cadeira?.largura_assento_cm}
          />
        </div>
        <AepAetFotosCampo
          label="Fotos da cadeira"
          fotos={value.cadeira.fotos}
          onChange={(fotos) => onChange({ ...value, cadeira: { ...value.cadeira, fotos } })}
          required
          minFotos={2}
          maxFotos={2}
          error={!!errors?.cadeira?.fotos}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 p-4">
        <h3 className="font-heading text-sm font-semibold">Monitor e periféricos</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNum
            id="mon-alt"
            label="Altura do monitor"
            suffix="cm"
            value={value.monitor.altura_monitor}
            onChange={(altura_monitor) =>
              onChange({ ...value, monitor: { ...value.monitor, altura_monitor } })
            }
            error={!!errors?.monitor?.altura_monitor}
          />
          <CampoNum
            id="mon-olhos"
            label="Distância do monitor aos olhos"
            suffix="cm"
            value={value.monitor.distancia_olhos}
            onChange={(distancia_olhos) =>
              onChange({ ...value, monitor: { ...value.monitor, distancia_olhos } })
            }
            error={!!errors?.monitor?.distancia_olhos}
          />
          <CampoNum
            id="mon-teclado"
            label="Distância entre o teclado e a borda da mesa"
            suffix="cm"
            value={value.monitor.distancia_teclado_borda}
            onChange={(distancia_teclado_borda) =>
              onChange({ ...value, monitor: { ...value.monitor, distancia_teclado_borda } })
            }
            error={!!errors?.monitor?.distancia_teclado_borda}
          />
        </div>
        <AepAetFotosCampo
          label="Fotos do monitor e periféricos"
          fotos={value.monitor.fotos}
          onChange={(fotos) => onChange({ ...value, monitor: { ...value.monitor, fotos } })}
          required
          minFotos={2}
          maxFotos={2}
          error={!!errors?.monitor?.fotos}
        />
      </div>
    </section>
  );
}
