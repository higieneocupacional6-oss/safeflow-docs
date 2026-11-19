import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { RulaInput } from "@/lib/ergonomia/rula";
import { calcularRula } from "@/lib/ergonomia/rula";
import {
  ErgoOrientacao,
  ErgoStepShell,
  ResultadoErgoPanel,
  VisualChoice,
  VisualChoiceGrid,
} from "./ErgoStepShell";
import {
  SvgAntebraco,
  SvgBraco,
  SvgPernas,
  SvgPescoco,
  SvgPunho,
  SvgTronco,
} from "./PostureSvgs";

type Props = {
  value: RulaInput;
  onChange: (v: RulaInput) => void;
  onReadyChange?: (ready: boolean) => void;
};

export function RulaWizard({ value: r, onChange, onReadyChange }: Props) {
  const [step, setStep] = useState(0);
  const set = (patch: Partial<RulaInput>) => onChange({ ...r, ...patch });
  const resultado = useMemo(() => calcularRula(r), [r]);

  const steps = [
    { id: "braco", titulo: "Braço", valida: true },
    { id: "antebraco", titulo: "Antebraço e punho", valida: true },
    { id: "pescoco", titulo: "Pescoço e tronco", valida: true },
    { id: "carga", titulo: "Pernas, carga e músculo", valida: true },
  ];

  return (
    <ErgoStepShell
      steps={steps}
      stepIndex={step}
      onStepIndexChange={setStep}
      onReadyChange={onReadyChange}
      resultado={<ResultadoErgoPanel resultado={resultado} />}
    >
      {step === 0 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Posição do braço superior em relação ao tronco (ângulo no ombro)."
            como="Observe o ângulo entre o braço e o tronco no plano sagital. Ajuste se o ombro estiver elevado, abduzido ou apoiado."
            correto="Braço próximo ao corpo (−20° a +20°)."
            incorreto="Flexão elevada (>45°) ou braço muito alto (>90°)."
            selecionado={
              r.braco === 1 ? "−20° a +20°" :
              r.braco === 2 ? ">20° extensão/flexão" :
              r.braco === 3 ? "20°–45° de flexão" : "45°–90° de flexão"
            }
          />
          <VisualChoiceGrid cols={2}>
            {([1, 2, 3, 4] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.braco === n}
                onSelect={() => set({ braco: n })}
                title={`${n}`}
                subtitle={n === 1 ? "−20° a +20°" : n === 2 ? ">20° ext./flex." : n === 3 ? "20°–45°" : "45°–90°"}
                illustration={<SvgBraco grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAdicionais.ombroElevado} onCheckedChange={(v) => set({ bracoAdicionais: { ...r.bracoAdicionais, ombroElevado: !!v } })} />
              Ombro elevado (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAdicionais.abduzido} onCheckedChange={(v) => set({ bracoAdicionais: { ...r.bracoAdicionais, abduzido: !!v } })} />
              Braço abduzido (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAdicionais.apoiado} onCheckedChange={(v) => set({ bracoAdicionais: { ...r.bracoAdicionais, apoiado: !!v } })} />
              Braço apoiado (−1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAdicionais.bracoMuitoAlto} onCheckedChange={(v) => set({ bracoAdicionais: { ...r.bracoAdicionais, bracoMuitoAlto: !!v } })} />
              Braço &gt;90° (+1)
            </label>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Ângulo do antebraço e posição do punho (flexão/extensão e torção)."
            como="Meça o ângulo no cotovelo e a flexão do punho. Marque desvio da linha média se houver."
            correto="Antebraço 60–100°; punho neutro."
            incorreto="Antebraço &lt;60° ou &gt;100°; punho &gt;15° ou torcido."
            selecionado={`Antebraço ${r.antebraco === 1 ? "60–100°" : "fora da faixa"}; punho ${r.punho === 1 ? "neutro" : r.punho === 2 ? "0–15°" : ">15°"}`}
          />
          <p className="text-xs font-semibold">Antebraço</p>
          <VisualChoiceGrid cols={2}>
            {([1, 2] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.antebraco === n}
                onSelect={() => set({ antebraco: n })}
                title={`${n}`}
                subtitle={n === 1 ? "60°–100°" : "<60° ou >100°"}
                illustration={<SvgAntebraco grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Punho</p>
          <VisualChoiceGrid cols={3}>
            {([1, 2, 3] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.punho === n}
                onSelect={() => set({ punho: n })}
                title={`${n}`}
                subtitle={n === 1 ? "Neutro" : n === 2 ? "0–15°" : ">15°"}
                illustration={<SvgPunho grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={r.antebracoAdicionais.cruzaCorpo || r.antebracoAdicionais.foraLinhaMedia}
                onCheckedChange={(v) => set({ antebracoAdicionais: { cruzaCorpo: !!v, foraLinhaMedia: !!v } })}
              />
              Antebraço cruza o corpo / fora da linha média (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.punhoDesviado} onCheckedChange={(v) => set({ punhoDesviado: !!v })} />
              Punho desviado (+1)
            </label>
          </div>
          <p className="text-xs font-semibold">Torção do punho</p>
          <VisualChoiceGrid cols={2}>
            <VisualChoice
              selected={r.torcaoPunho === 1}
              onSelect={() => set({ torcaoPunho: 1 })}
              title="1 — Faixa média"
              subtitle="Rotação próxima do neutro"
              illustration={<SvgPunho grau={1} />}
            />
            <VisualChoice
              selected={r.torcaoPunho === 2}
              onSelect={() => set({ torcaoPunho: 2 })}
              title="2 — Próximo do limite"
              subtitle="Rotação extrema"
              illustration={<SvgPunho grau={3} />}
            />
          </VisualChoiceGrid>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Flexão/extensão do pescoço e inclinação do tronco."
            como="Veja o ângulo da cabeça em relação ao tronco e a flexão do tronco no plano sagital."
            correto="Pescoço 0–10°; tronco ereto."
            incorreto="Pescoço em extensão ou >20°; tronco >60°."
            selecionado={`Pescoço ${r.pescoco}; tronco ${r.tronco}`}
          />
          <p className="text-xs font-semibold">Pescoço</p>
          <VisualChoiceGrid cols={4}>
            {([1, 2, 3, 4] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.pescoco === n}
                onSelect={() => set({ pescoco: n })}
                title={`${n}`}
                subtitle={n === 1 ? "0–10°" : n === 2 ? "10–20°" : n === 3 ? ">20°" : "Extensão"}
                illustration={<SvgPescoco grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Tronco</p>
          <VisualChoiceGrid cols={4}>
            {([1, 2, 3, 4] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.tronco === n}
                onSelect={() => set({ tronco: n })}
                title={`${n}`}
                subtitle={n === 1 ? "Ereto" : n === 2 ? "0–20°" : n === 3 ? "20–60°" : ">60°"}
                illustration={<SvgTronco grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.pescocoAdicionais.torcido} onCheckedChange={(v) => set({ pescocoAdicionais: { ...r.pescocoAdicionais, torcido: !!v } })} />
              Pescoço torcido (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.pescocoAdicionais.inclinado} onCheckedChange={(v) => set({ pescocoAdicionais: { ...r.pescocoAdicionais, inclinado: !!v } })} />
              Pescoço inclinado (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.troncoAdicionais.torcido} onCheckedChange={(v) => set({ troncoAdicionais: { ...r.troncoAdicionais, torcido: !!v } })} />
              Tronco torcido (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.troncoAdicionais.inclinado} onCheckedChange={(v) => set({ troncoAdicionais: { ...r.troncoAdicionais, inclinado: !!v } })} />
              Tronco inclinado (+1)
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Apoio das pernas, carga/força e uso muscular estático ou repetitivo."
            como="Verifique se os pés/pernas estão equilibrados; estime a carga e se há postura estática >1 min ou >4 repetições/min."
            correto="Pernas apoiadas; carga &lt;2 kg intermitente; sem uso muscular excessivo."
            incorreto="Sem apoio; carga &gt;10 kg ou com impacto; uso muscular contínuo."
            selecionado={`Pernas ${r.pernas}; carga ${r.carga}; muscular ${r.usoMuscular ? "sim" : "não"}`}
          />
          <p className="text-xs font-semibold">Pernas</p>
          <VisualChoiceGrid cols={2}>
            {([1, 2] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.pernas === n}
                onSelect={() => set({ pernas: n })}
                title={`${n}`}
                subtitle={n === 1 ? "Apoiadas / equilibradas" : "Sem apoio adequado"}
                illustration={<SvgPernas grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Carga / força</p>
          <VisualChoiceGrid cols={2}>
            {([
              [0, "< 2 kg intermitente"],
              [1, "2–10 kg intermitente"],
              [2, "2–10 kg estático/repetitivo"],
              [3, "> 10 kg ou impacto"],
            ] as const).map(([n, label]) => (
              <VisualChoice
                key={n}
                selected={r.carga === n}
                onSelect={() => set({ carga: n })}
                title={`${n}`}
                subtitle={label}
                illustration={
                  <div className="grid h-16 place-items-center text-2xl font-bold opacity-40">{n}</div>
                }
              />
            ))}
          </VisualChoiceGrid>
          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={r.usoMuscular} onCheckedChange={(v) => set({ usoMuscular: !!v })} />
            Uso muscular estático (&gt;1 min) ou repetitivo (&gt;4×/min) (+1)
          </label>
        </div>
      )}
    </ErgoStepShell>
  );
}
