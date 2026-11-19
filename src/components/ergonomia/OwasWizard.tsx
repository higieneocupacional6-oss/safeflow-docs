import { useMemo, useState } from "react";
import { calcularOwas, OWAS_LABELS, type OwasInput } from "@/lib/ergonomia/owas";
import {
  ErgoOrientacao,
  ErgoStepShell,
  ResultadoErgoPanel,
  VisualChoice,
  VisualChoiceGrid,
} from "./ErgoStepShell";
import { SvgOwasBracos, SvgOwasCostas, SvgOwasPernas } from "./PostureSvgs";

type Props = {
  value: OwasInput;
  onChange: (v: OwasInput) => void;
  onReadyChange?: (ready: boolean) => void;
};

export function OwasWizard({ value: o, onChange, onReadyChange }: Props) {
  const [step, setStep] = useState(0);
  const set = (patch: Partial<OwasInput>) => onChange({ ...o, ...patch });
  const resultado = useMemo(() => calcularOwas(o), [o]);

  const steps = [
    { id: "costas", titulo: "Costas", valida: true },
    { id: "bracos", titulo: "Braços", valida: true },
    { id: "pernas", titulo: "Pernas", valida: true },
    { id: "carga", titulo: "Carga", valida: true },
  ];

  return (
    <ErgoStepShell
      steps={steps}
      stepIndex={step}
      onStepIndexChange={setStep}
      onReadyChange={onReadyChange}
      resultado={
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Código OWAS:{" "}
            <span className="font-mono text-base font-bold text-foreground">
              {o.costas}{o.bracos}{o.pernas}{o.carga}
            </span>
          </p>
          <ResultadoErgoPanel resultado={resultado} />
        </div>
      }
    >
      {step === 0 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Postura das costas predominante no ciclo de trabalho."
            como="Classifique se as costas estão retas, flexionadas, torcidas ou ambas."
            correto="Costas retas."
            incorreto="Costas flexionadas e torcidas simultaneamente."
            selecionado={OWAS_LABELS.costas[o.costas]}
          />
          <VisualChoiceGrid cols={2}>
            {([1, 2, 3, 4] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={o.costas === n}
                onSelect={() => set({ costas: n })}
                title={`${n}`}
                subtitle={OWAS_LABELS.costas[n]}
                illustration={<SvgOwasCostas grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Posição dos braços em relação à linha dos ombros."
            como="Verifique se um ou ambos os braços ultrapassam a altura dos ombros."
            correto="Ambos os braços abaixo da linha dos ombros."
            incorreto="Ambos os braços acima da linha dos ombros."
            selecionado={OWAS_LABELS.bracos[o.bracos]}
          />
          <VisualChoiceGrid cols={3}>
            {([1, 2, 3] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={o.bracos === n}
                onSelect={() => set({ bracos: n })}
                title={`${n}`}
                subtitle={OWAS_LABELS.bracos[n]}
                illustration={<SvgOwasBracos grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Postura das pernas (sentado, em pé, agachado, ajoelhado ou andando)."
            como="Escolha a postura das pernas que predomina na tarefa observada."
            correto="Em pé com as duas pernas retas ou sentado com apoio adequado."
            incorreto="Agachado com joelhos flexionados ou ajoelhado por longos períodos."
            selecionado={OWAS_LABELS.pernas[o.pernas]}
          />
          <VisualChoiceGrid cols={2}>
            {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={o.pernas === n}
                onSelect={() => set({ pernas: n })}
                title={`${n}`}
                subtitle={OWAS_LABELS.pernas[n]}
                illustration={<SvgOwasPernas grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Massa da carga manipulada ou força equivalente."
            como="Estime o peso sustentado/manipulado durante a postura observada."
            correto="Até 10 kg."
            incorreto="Acima de 20 kg."
            selecionado={OWAS_LABELS.carga[o.carga]}
          />
          <VisualChoiceGrid cols={3}>
            {([1, 2, 3] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={o.carga === n}
                onSelect={() => set({ carga: n })}
                title={OWAS_LABELS.carga[n]}
                subtitle={`Categoria ${n}`}
                illustration={
                  <div className="grid h-16 place-items-center text-2xl font-bold opacity-40">
                    {n === 1 ? "≤10" : n === 2 ? "10–20" : ">20"}
                  </div>
                }
              />
            ))}
          </VisualChoiceGrid>
        </div>
      )}
    </ErgoStepShell>
  );
}
