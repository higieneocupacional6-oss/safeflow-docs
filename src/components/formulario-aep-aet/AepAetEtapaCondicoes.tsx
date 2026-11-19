import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AepAetSimNao } from "@/components/formulario-aep-aet/AepAetSimNao";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import type { AepAetCondicoesAmbientais } from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  value: AepAetCondicoesAmbientais;
  onChange: (next: AepAetCondicoesAmbientais) => void;
  errors?: Partial<Record<keyof AepAetCondicoesAmbientais, boolean>>;
};

function CampoAmb({
  id,
  label,
  suffix,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
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
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn("pr-14", error && "border-destructive")}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function AepAetEtapaCondicoes({ value, onChange, errors }: Props) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Condições ambientais</h2>
        <p className="text-sm text-muted-foreground">
          Medições do ambiente de trabalho e exposição à vibração.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CampoAmb
          id="amb-lux"
          label="Iluminação"
          suffix="lux"
          value={value.iluminacao_lux}
          onChange={(iluminacao_lux) => onChange({ ...value, iluminacao_lux })}
          error={!!errors?.iluminacao_lux}
        />
        <CampoAmb
          id="amb-ruido"
          label="Ruído"
          suffix="dB(A)"
          value={value.ruido_dba}
          onChange={(ruido_dba) => onChange({ ...value, ruido_dba })}
          error={!!errors?.ruido_dba}
        />
        <CampoAmb
          id="amb-temp"
          label="Temperatura"
          suffix="°C"
          value={value.temperatura_c}
          onChange={(temperatura_c) => onChange({ ...value, temperatura_c })}
          error={!!errors?.temperatura_c}
        />
      </div>

      <AepAetFotosCampo
        label="Foto do ambiente"
        fotos={value.fotos}
        onChange={(fotos) => onChange({ ...value, fotos })}
        required
        minFotos={1}
        maxFotos={1}
        error={!!errors?.fotos}
      />

      <div className="space-y-4 rounded-xl border border-border/70 p-4">
        <h3 className="font-heading text-sm font-semibold">Vibração</h3>
        <AepAetSimNao
          id="vib-exp"
          label="Existe exposição?"
          value={value.vibracao_exposicao}
          onChange={(vibracao_exposicao) =>
            onChange({
              ...value,
              vibracao_exposicao,
              ...(vibracao_exposicao === "nao"
                ? { vibracao_valor: "", vibracao_unidade: "" }
                : {}),
            })
          }
          required
          error={!!errors?.vibracao_exposicao}
        />

        {value.vibracao_exposicao === "sim" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vib-val">
                Valor medido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vib-val"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={value.vibracao_valor}
                onChange={(e) => onChange({ ...value, vibracao_valor: e.target.value })}
                aria-invalid={!!errors?.vibracao_valor}
                className={errors?.vibracao_valor ? "border-destructive" : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vib-uni">
                Unidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vib-uni"
                value={value.vibracao_unidade}
                onChange={(e) => onChange({ ...value, vibracao_unidade: e.target.value })}
                placeholder="Ex.: m/s², mm/s, Hz"
                aria-invalid={!!errors?.vibracao_unidade}
                className={errors?.vibracao_unidade ? "border-destructive" : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
