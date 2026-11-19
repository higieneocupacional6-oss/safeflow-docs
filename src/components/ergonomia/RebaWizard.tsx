import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { RebaInput } from "@/lib/ergonomia/reba";
import { calcularReba } from "@/lib/ergonomia/reba";
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
  value: RebaInput;
  onChange: (v: RebaInput) => void;
  onReadyChange?: (ready: boolean) => void;
};

export function RebaWizard({ value: r, onChange, onReadyChange }: Props) {
  const [step, setStep] = useState(0);
  const set = (patch: Partial<RebaInput>) => onChange({ ...r, ...patch });
  const resultado = useMemo(() => calcularReba(r), [r]);

  const steps = [
    { id: "tronco", titulo: "Tronco, pescoço e pernas", valida: true },
    { id: "carga", titulo: "Carga", valida: true },
    { id: "bracos", titulo: "Membros superiores", valida: true },
    { id: "atividade", titulo: "Acoplamento e atividade", valida: true },
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
            observar="Postura do tronco, pescoço e estabilidade das pernas (Grupo A)."
            como="Avalie flexão do tronco, ângulo do pescoço e se o apoio é bilateral ou unilateral."
            correto="Tronco ereto; pescoço 0–20°; apoio bilateral estável."
            incorreto="Tronco >60°; pescoço em extensão; apoio unilateral."
            selecionado={`Tronco ${r.tronco}; pescoço ${r.pescoco}; pernas ${r.pernas}`}
          />
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
          <p className="text-xs font-semibold">Pescoço</p>
          <VisualChoiceGrid cols={3}>
            {([1, 2, 3] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.pescoco === n}
                onSelect={() => set({ pescoco: n })}
                title={`${n}`}
                subtitle={n === 1 ? "0–20°" : n === 2 ? ">20°" : "Extensão"}
                illustration={<SvgPescoco grau={n === 3 ? 4 : n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Pernas</p>
          <VisualChoiceGrid cols={2}>
            {([1, 2] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.pernas === n}
                onSelect={() => set({ pernas: n })}
                title={`${n}`}
                subtitle={n === 1 ? "Bilateral (estável)" : "Unilateral / instável"}
                illustration={<SvgPernas grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Flexão de joelhos</p>
          <VisualChoiceGrid cols={3}>
            {([
              [0, "Sem flexão relevante"],
              [1, "30°–60° (+1)"],
              [2, ">60° (+2)"],
            ] as const).map(([n, label]) => (
              <VisualChoice
                key={n}
                selected={r.pernasFlexao === n}
                onSelect={() => set({ pernasFlexao: n })}
                title={`${n}`}
                subtitle={label}
                illustration={<SvgPernas grau={n === 0 ? 1 : 2} />}
              />
            ))}
          </VisualChoiceGrid>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.troncoAjuste.torcido} onCheckedChange={(v) => set({ troncoAjuste: { ...r.troncoAjuste, torcido: !!v } })} />
              Tronco torcido (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.troncoAjuste.inclinado} onCheckedChange={(v) => set({ troncoAjuste: { ...r.troncoAjuste, inclinado: !!v } })} />
              Tronco inclinado lateral (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.pescocoAjuste.torcido} onCheckedChange={(v) => set({ pescocoAjuste: { ...r.pescocoAjuste, torcido: !!v } })} />
              Pescoço torcido (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.pescocoAjuste.inclinado} onCheckedChange={(v) => set({ pescocoAjuste: { ...r.pescocoAjuste, inclinado: !!v } })} />
              Pescoço inclinado (+1)
            </label>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Carga manipulada e presença de impacto ou início brusco."
            como="Estime o peso da carga e se há choque ou aceleração rápida."
            correto="Carga &lt;5 kg sem impacto."
            incorreto="Carga &gt;10 kg ou com impacto."
            selecionado={`Carga ${r.carga}${r.cargaImpacto ? " + impacto" : ""}`}
          />
          <VisualChoiceGrid cols={3}>
            {([
              [0, "< 5 kg"],
              [1, "5–10 kg"],
              [2, "> 10 kg"],
            ] as const).map(([n, label]) => (
              <VisualChoice
                key={n}
                selected={r.carga === n}
                onSelect={() => set({ carga: n })}
                title={`${n}`}
                subtitle={label}
                illustration={<div className="grid h-16 place-items-center text-xl font-bold opacity-40">{label}</div>}
              />
            ))}
          </VisualChoiceGrid>
          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={r.cargaImpacto} onCheckedChange={(v) => set({ cargaImpacto: !!v })} />
            Carga com impacto / início brusco (+1)
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Braço superior, antebraço e punho (Grupo B)."
            como="Meça ângulos de ombro, cotovelo e punho na postura mais desfavorável do ciclo."
            correto="Braço −20°…20°; antebraço 60–100°; punho 0–15°."
            incorreto="Braço &gt;90°; antebraço extremo; punho &gt;15° ou desviado."
            selecionado={`Braço ${r.bracoSup}; antebraço ${r.antebraco}; punho ${r.punho}`}
          />
          <p className="text-xs font-semibold">Braço superior</p>
          <VisualChoiceGrid cols={4}>
            {([1, 2, 3, 4] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.bracoSup === n}
                onSelect={() => set({ bracoSup: n })}
                title={`${n}`}
                subtitle={n === 1 ? "−20°–20°" : n === 2 ? "20–45°" : n === 3 ? "45–90°" : ">90°"}
                illustration={<SvgBraco grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Antebraço</p>
          <VisualChoiceGrid cols={2}>
            {([1, 2] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.antebraco === n}
                onSelect={() => set({ antebraco: n })}
                title={`${n}`}
                subtitle={n === 1 ? "60–100°" : "<60° ou >100°"}
                illustration={<SvgAntebraco grau={n} />}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Punho</p>
          <VisualChoiceGrid cols={2}>
            {([1, 2] as const).map((n) => (
              <VisualChoice
                key={n}
                selected={r.punho === n}
                onSelect={() => set({ punho: n })}
                title={`${n}`}
                subtitle={n === 1 ? "0–15°" : ">15°"}
                illustration={<SvgPunho grau={n === 1 ? 1 : 3} />}
              />
            ))}
          </VisualChoiceGrid>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAjuste.ombroElevado} onCheckedChange={(v) => set({ bracoAjuste: { ...r.bracoAjuste, ombroElevado: !!v } })} />
              Ombro elevado (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAjuste.abduzido} onCheckedChange={(v) => set({ bracoAjuste: { ...r.bracoAjuste, abduzido: !!v } })} />
              Braço abduzido (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.bracoAjuste.apoiado} onCheckedChange={(v) => set({ bracoAjuste: { ...r.bracoAjuste, apoiado: !!v } })} />
              Braço apoiado (−1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.punhoDesviado} onCheckedChange={(v) => set({ punhoDesviado: !!v })} />
              Punho desviado/torcido (+1)
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Qualidade da pega (acoplamento) e fatores de atividade."
            como="Classifique a pega e marque se a postura é estática, repetitiva ou com mudanças bruscas."
            correto="Pega boa; sem estática/repetição/instabilidade relevantes."
            incorreto="Pega inaceitável; estática &gt;1 min; &gt;4×/min; mudanças rápidas."
            selecionado={`Acoplamento ${r.acoplamento}`}
          />
          <p className="text-xs font-semibold">Acoplamento (pega)</p>
          <VisualChoiceGrid cols={2}>
            {([
              [0, "Bom"],
              [1, "Regular"],
              [2, "Ruim"],
              [3, "Inaceitável"],
            ] as const).map(([n, label]) => (
              <VisualChoice
                key={n}
                selected={r.acoplamento === n}
                onSelect={() => set({ acoplamento: n })}
                title={`${n} — ${label}`}
                subtitle="Qualidade da pega da carga/ferramenta"
                illustration={<div className="grid h-16 place-items-center text-lg font-bold opacity-40">{label}</div>}
              />
            ))}
          </VisualChoiceGrid>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.atividade.estatico} onCheckedChange={(v) => set({ atividade: { ...r.atividade, estatico: !!v } })} />
              Postura estática &gt;1 min (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.atividade.repetitivo} onCheckedChange={(v) => set({ atividade: { ...r.atividade, repetitivo: !!v } })} />
              Movimento repetitivo &gt;4×/min (+1)
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={r.atividade.instavel} onCheckedChange={(v) => set({ atividade: { ...r.atividade, instavel: !!v } })} />
              Mudanças rápidas/instáveis (+1)
            </label>
          </div>
        </div>
      )}
    </ErgoStepShell>
  );
}
