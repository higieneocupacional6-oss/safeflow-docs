import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularNiosh, type NioshInput } from "@/lib/ergonomia/niosh";
import {
  ErgoOrientacao,
  ErgoStepShell,
  ResultadoErgoPanel,
  VisualChoice,
  VisualChoiceGrid,
} from "./ErgoStepShell";
import { SvgNioshLift } from "./PostureSvgs";

type Props = {
  value: NioshInput;
  onChange: (v: NioshInput) => void;
  onReadyChange?: (ready: boolean) => void;
};

function numOk(n: number) {
  return Number.isFinite(n) && n >= 0;
}

export function NioshWizard({ value: n, onChange, onReadyChange }: Props) {
  const [step, setStep] = useState(0);
  const set = (patch: Partial<NioshInput>) => onChange({ ...n, ...patch });
  const resultado = useMemo(() => {
    try {
      return calcularNiosh(n);
    } catch {
      return null;
    }
  }, [n]);

  const steps = [
    {
      id: "peso",
      titulo: "Peso da carga",
      valida: numOk(n.peso_carga_kg) && n.peso_carga_kg > 0,
    },
    {
      id: "H",
      titulo: "Distância horizontal (H)",
      valida: numOk(n.H_cm) && n.H_cm > 0,
    },
    {
      id: "VD",
      titulo: "Alturas V e D",
      valida: numOk(n.V_cm) && numOk(n.D_cm) && n.D_cm > 0,
    },
    {
      id: "AF",
      titulo: "Assimetria e frequência",
      valida: numOk(n.A_graus) && numOk(n.F_por_min) && n.F_por_min > 0,
    },
    {
      id: "dur",
      titulo: "Duração e acoplamento",
      valida: !!n.duracao && !!n.acoplamento,
    },
  ];

  return (
    <ErgoStepShell
      steps={steps}
      stepIndex={step}
      onStepIndexChange={setStep}
      onReadyChange={onReadyChange}
      resultado={
        resultado ? (
          <ResultadoErgoPanel resultado={resultado} />
        ) : (
          <p className="text-sm text-muted-foreground">Preencha os parâmetros para calcular o RWL e o LI.</p>
        )
      }
    >
      {step === 0 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Peso real da carga manipulada no levantamento."
            como="Use balança ou valor nominal do objeto. Informe em quilogramas."
            correto="Peso conhecido e estável."
            incorreto="Estimativa grosseira ou carga variável sem valor representativo."
            selecionado={n.peso_carga_kg > 0 ? `${n.peso_carga_kg} kg` : undefined}
          />
          <SvgNioshLift mode="peso" className="mx-auto h-24 max-w-xs text-primary" />
          <div>
            <Label className="text-xs">Peso da carga (kg) *</Label>
            <Input
              type="number"
              step="0.5"
              min={0.1}
              value={n.peso_carga_kg}
              onChange={(e) => set({ peso_carga_kg: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Distância horizontal (H) entre a projeção do tornozelo e o centro das mãos na origem."
            como="Meça em cm no início do levantamento. Valores &lt;25 cm são tratados como 25 cm na equação."
            correto="Carga próxima ao corpo (H próximo de 25 cm)."
            incorreto="Carga longe do corpo (H &gt;45–63 cm)."
            selecionado={`${n.H_cm} cm`}
          />
          <SvgNioshLift mode="H" className="mx-auto h-24 max-w-xs text-primary" />
          <div>
            <Label className="text-xs">H — distância horizontal (cm) *</Label>
            <Input
              type="number"
              min={1}
              value={n.H_cm}
              onChange={(e) => set({ H_cm: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Altura vertical inicial das mãos (V) e deslocamento vertical (D) até o destino."
            como="V = altura das mãos na origem; D = |destino − origem|. Ideal: V ≈ 75 cm; D mínimo necessário."
            correto="Origem próxima à altura dos nós dos dedos (~75 cm); pequeno deslocamento vertical."
            incorreto="Origem no chão ou acima dos ombros; grande deslocamento vertical."
            selecionado={`V=${n.V_cm} cm; D=${n.D_cm} cm`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3">
              <SvgNioshLift mode="V" className="h-20 text-primary" />
              <Label className="text-xs">V — altura vertical inicial (cm) *</Label>
              <Input type="number" value={n.V_cm} onChange={(e) => set({ V_cm: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <SvgNioshLift mode="D" className="h-20 text-primary" />
              <Label className="text-xs">D — deslocamento vertical (cm) *</Label>
              <Input type="number" min={1} value={n.D_cm} onChange={(e) => set({ D_cm: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Ângulo de assimetria (A) e frequência de levantamentos por minuto (F)."
            como="A = torção do tronco entre origem e destino (0–135°). F = nº de levantamentos por minuto."
            correto="Sem torção (A = 0°); baixa frequência."
            incorreto="Torção elevada; frequência alta sustentada."
            selecionado={`A=${n.A_graus}°; F=${n.F_por_min}/min`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3">
              <SvgNioshLift mode="A" className="h-20 text-primary" />
              <Label className="text-xs">A — assimetria (graus) *</Label>
              <Input type="number" min={0} max={180} value={n.A_graus} onChange={(e) => set({ A_graus: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <SvgNioshLift mode="F" className="h-20 text-primary" />
              <Label className="text-xs">F — frequência (levant./min) *</Label>
              <Input type="number" step="0.1" min={0.1} value={n.F_por_min} onChange={(e) => set({ F_por_min: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <ErgoOrientacao
            observar="Duração da tarefa no turno e qualidade do acoplamento (pega)."
            como="Duração: curta ≤1 h, moderada ≤2 h, longa ≤8 h. Acoplamento: alças, forma e estabilidade da carga."
            correto="Duração curta; pega boa (alças adequadas)."
            incorreto="Duração longa com alta frequência; pega ruim."
            selecionado={`${n.duracao}; acoplamento ${n.acoplamento}`}
          />
          <p className="text-xs font-semibold">Duração</p>
          <VisualChoiceGrid cols={3}>
            {([
              ["curta", "Curta (≤ 1 h)"],
              ["moderada", "Moderada (≤ 2 h)"],
              ["longa", "Longa (≤ 8 h)"],
            ] as const).map(([v, label]) => (
              <VisualChoice
                key={v}
                selected={n.duracao === v}
                onSelect={() => set({ duracao: v })}
                title={label}
                illustration={<div className="grid h-16 place-items-center text-sm font-semibold opacity-50">{v}</div>}
              />
            ))}
          </VisualChoiceGrid>
          <p className="text-xs font-semibold">Acoplamento (pega)</p>
          <VisualChoiceGrid cols={3}>
            {([
              ["bom", "Bom"],
              ["regular", "Regular"],
              ["ruim", "Ruim"],
            ] as const).map(([v, label]) => (
              <VisualChoice
                key={v}
                selected={n.acoplamento === v}
                onSelect={() => set({ acoplamento: v })}
                title={label}
                illustration={<div className="grid h-16 place-items-center text-sm font-semibold opacity-50">{label}</div>}
              />
            ))}
          </VisualChoiceGrid>
        </div>
      )}
    </ErgoStepShell>
  );
}
