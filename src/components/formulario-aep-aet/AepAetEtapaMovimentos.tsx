import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AepAetSimNao } from "@/components/formulario-aep-aet/AepAetSimNao";
import { AepAetFotosCampo } from "@/components/formulario-aep-aet/AepAetFotosCampo";
import type { AepAetMovimentosRepetitivos } from "@/lib/aepAetFormulario";

type Props = {
  value: AepAetMovimentosRepetitivos;
  onChange: (next: AepAetMovimentosRepetitivos) => void;
  errors?: {
    existem_movimentos_repetitivos?: boolean;
    descricao_atividade?: boolean;
    frequencia?: boolean;
    fotos?: boolean;
  };
};

export function AepAetEtapaMovimentos({ value, onChange, errors }: Props) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Movimentos repetitivos</h2>
        <p className="text-sm text-muted-foreground">
          Identifique se a função envolve ciclos repetitivos de movimento.
        </p>
      </div>

      <AepAetSimNao
        id="mov-rep"
        label="Existem movimentos repetitivos?"
        value={value.existem_movimentos_repetitivos}
        onChange={(v) =>
          onChange({
            ...value,
            existem_movimentos_repetitivos: v,
            ...(v === "nao"
              ? { descricao_atividade: "", frequencia: "", fotos: [] }
              : {}),
          })
        }
        required
        error={!!errors?.existem_movimentos_repetitivos}
      />

      {value.existem_movimentos_repetitivos === "sim" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mov-desc">
              Descrição da atividade <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="mov-desc"
              rows={3}
              value={value.descricao_atividade}
              onChange={(e) => onChange({ ...value, descricao_atividade: e.target.value })}
              placeholder="Descreva os movimentos repetitivos observados"
              aria-invalid={!!errors?.descricao_atividade}
              className={errors?.descricao_atividade ? "border-destructive" : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-freq">
              Frequência de realização <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mov-freq"
              value={value.frequencia}
              onChange={(e) => onChange({ ...value, frequencia: e.target.value })}
              placeholder="Ex.: continuamente, a cada 30 segundos…"
              aria-invalid={!!errors?.frequencia}
              className={errors?.frequencia ? "border-destructive" : undefined}
            />
          </div>

          <AepAetFotosCampo
            label="Fotografia dos movimentos"
            fotos={value.fotos}
            onChange={(fotos) => onChange({ ...value, fotos })}
            required
            minFotos={1}
            maxFotos={8}
            error={!!errors?.fotos}
          />
        </div>
      )}
    </section>
  );
}
