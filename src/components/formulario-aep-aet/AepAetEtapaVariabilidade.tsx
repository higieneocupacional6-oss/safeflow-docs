import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AepAetSimNao } from "@/components/formulario-aep-aet/AepAetSimNao";
import type { AepAetVariabilidade } from "@/lib/aepAetFormulario";

type Props = {
  value: AepAetVariabilidade;
  onChange: (next: AepAetVariabilidade) => void;
  errors?: Partial<Record<keyof AepAetVariabilidade, boolean>>;
};

export function AepAetEtapaVariabilidade({ value, onChange, errors }: Props) {
  const set = <K extends keyof AepAetVariabilidade>(campo: K, v: AepAetVariabilidade[K]) =>
    onChange({ ...value, [campo]: v });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Variabilidade da tarefa</h2>
        <p className="text-sm text-muted-foreground">
          Caracterize a rotina e a variação das atividades avaliadas.
        </p>
      </div>

      <div className="space-y-3">
        <AepAetSimNao
          id="ativ-igual"
          label="A atividade é sempre igual?"
          value={value.atividade_sempre_igual}
          onChange={(v) => set("atividade_sempre_igual", v)}
          required
          error={!!errors?.atividade_sempre_igual}
        />
        <AepAetSimNao
          id="ativ-diferentes"
          label="Existem atividades diferentes ao longo do dia?"
          value={value.atividades_diferentes_dia}
          onChange={(v) => set("atividades_diferentes_dia", v)}
          required
          error={!!errors?.atividades_diferentes_dia}
        />
        <AepAetSimNao
          id="rodizio"
          label="Existe rodízio de atividades?"
          value={value.rodizio_atividades}
          onChange={(v) => set("rodizio_atividades", v)}
          required
          error={!!errors?.rodizio_atividades}
        />
        <AepAetSimNao
          id="he"
          label="Realiza horas extras?"
          value={value.realiza_horas_extras}
          onChange={(v) => {
            onChange({
              ...value,
              realiza_horas_extras: v,
              frequencia_horas_extras: v === "nao" ? "" : value.frequencia_horas_extras,
            });
          }}
          required
          error={!!errors?.realiza_horas_extras}
        />

        {value.realiza_horas_extras === "sim" && (
          <div className="space-y-1.5 pl-1">
            <Label htmlFor="aep-aet-freq-he">
              Com que frequência? <span className="text-destructive">*</span>
            </Label>
            <Input
              id="aep-aet-freq-he"
              value={value.frequencia_horas_extras}
              onChange={(e) => set("frequencia_horas_extras", e.target.value)}
              placeholder="Ex.: 2 vezes por semana, aos sábados…"
              aria-invalid={!!errors?.frequencia_horas_extras}
              className={errors?.frequencia_horas_extras ? "border-destructive" : undefined}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="aep-aet-obs">Observações</Label>
          <Textarea
            id="aep-aet-obs"
            rows={4}
            value={value.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Observações relevantes sobre a variabilidade da tarefa"
          />
        </div>
      </div>
    </section>
  );
}
