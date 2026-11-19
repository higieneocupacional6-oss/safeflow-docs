import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  OCRA_CHECKLIST_DEFAULT,
  OCRA_FA_OPTIONS,
  OCRA_FD_OPTIONS,
  OCRA_FF_OPTIONS,
  OCRA_FP_OPTIONS,
  OCRA_FR_OPTIONS,
  OCRA_INDICE_DEFAULT,
  multiplicadorDuracao,
  type OcraChecklistInput,
  type OcraIndiceInput,
  type OcraInput,
  type OcraLado,
} from "@/lib/ergonomia/ocra";
import { DicaErgo, IlustracaoMembros } from "./ErgoIllustrations";

type Props = {
  value: OcraInput;
  onChange: (v: OcraInput) => void;
};

export function OcraForm({ value, onChange }: Props) {
  const modalidade = value.modalidade;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3">
        <IlustracaoMembros className="mx-auto h-24 max-w-xs text-primary" />
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Identifique ações técnicas, posturas de ombro/cotovelo/punho/mão e fatores de exposição
          no ciclo observado.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs">Modalidade de avaliação</Label>
          <Select
            value={modalidade}
            onValueChange={(v) => {
              if (v === "indice") onChange({ ...OCRA_INDICE_DEFAULT, lado: value.lado });
              else onChange({ ...OCRA_CHECKLIST_DEFAULT, lado: value.lado });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="checklist">Checklist OCRA (ICKL)</SelectItem>
              <SelectItem value="indice">Índice OCRA (ATA/RTA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Membro superior avaliado</Label>
          <Select
            value={value.lado}
            onValueChange={(v) => onChange({ ...value, lado: v as OcraLado })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="direito">Direito (geralmente dominante)</SelectItem>
              <SelectItem value="esquerdo">Esquerdo</SelectItem>
              <SelectItem value="ambos_pior">Ambos — registrar o pior lado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {modalidade === "checklist" ? (
        <ChecklistFields
          value={value as OcraChecklistInput}
          onChange={(v) => onChange(v)}
        />
      ) : (
        <IndiceFields
          value={value as OcraIndiceInput}
          onChange={(v) => onChange(v)}
        />
      )}
    </div>
  );
}

function ChecklistFields({
  value: c,
  onChange,
}: {
  value: OcraChecklistInput;
  onChange: (v: OcraChecklistInput) => void;
}) {
  const set = (patch: Partial<OcraChecklistInput>) => onChange({ ...c, ...patch });
  const tntr = Math.max(
    0,
    c.duracaoTurnoMin - c.trabalhoNaoRepetitivoMin - c.pausasMin - c.almocoMin,
  );
  const md = multiplicadorDuracao(tntr);

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-semibold">Organização do turno</p>
        <DicaErgo>
          TNTR = duração no posto − (trabalho não repetitivo + pausas + almoço incluso). O MD é
          obtido da tabela oficial conforme TNTR.
        </DicaErgo>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Duração do turno no posto (min)</Label>
            <Input type="number" value={c.duracaoTurnoMin} onChange={(e) => set({ duracaoTurnoMin: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Trabalho não repetitivo (min)</Label>
            <Input type="number" value={c.trabalhoNaoRepetitivoMin} onChange={(e) => set({ trabalhoNaoRepetitivoMin: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Pausas (min)</Label>
            <Input type="number" value={c.pausasMin} onChange={(e) => set({ pausasMin: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Almoço incluso no turno (min)</Label>
            <Input type="number" value={c.almocoMin} onChange={(e) => set({ almocoMin: Number(e.target.value) })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          TNTR calculado: <strong>{tntr} min</strong> · MD = <strong>{md}</strong>
        </p>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold">FR — Recuperação</p>
        <Select value={String(c.fr)} onValueChange={(v) => set({ fr: Number(v) as OcraChecklistInput["fr"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 — ≥8 min/h de interrupção ou recuperação 5:1 no ciclo</SelectItem>
            <SelectItem value="2">2 — ≥4 interrupções ≥8 min + almoço (7–8 h)</SelectItem>
            <SelectItem value="3">3 — 3 pausas ≥8 min + almoço (7–8 h)</SelectItem>
            <SelectItem value="4">4 — 2 pausas ≥8 min + almoço (7–8 h)</SelectItem>
            <SelectItem value="6">6 — Apenas almoço em 8 h (incluso)</SelectItem>
            <SelectItem value="10">10 — Sem pausas reais (&lt;5 min em 7–8 h)</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold">FF — Frequência (ações técnicas)</p>
        <DicaErgo>
          Ação técnica = operação manual elementar (alcançar, agarrar, colocar, empurrar…). FF =
          máximo entre ações dinâmicas e estáticas.
        </DicaErgo>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Ações dinâmicas (ATD)</Label>
            <Select value={String(c.atd)} onValueChange={(v) => set({ atd: Number(v) as OcraChecklistInput["atd"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — ~20/min, pausas frequentes</SelectItem>
                <SelectItem value="1">1 — ~30/min, pequenas pausas</SelectItem>
                <SelectItem value="3">3 — &gt;40/min, pequenas pausas</SelectItem>
                <SelectItem value="4">4 — &gt;40/min, pausas ocasionais</SelectItem>
                <SelectItem value="6">6 — &gt;50/min, pausas irregulares</SelectItem>
                <SelectItem value="8">8 — &gt;60/min, ritmo difícil</SelectItem>
                <SelectItem value="10">10 — ≥70/min, sem pausas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ações estáticas (ATE)</Label>
            <Select value={String(c.ate)} onValueChange={(v) => set({ ate: Number(v) as OcraChecklistInput["ate"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Sem manutenção ≥5 s relevante</SelectItem>
                <SelectItem value="2.5">2,5 — Manutenção ≥5 s em ~2/3 do ciclo</SelectItem>
                <SelectItem value="4.5">4,5 — Manutenção ≥5 s em quase todo o ciclo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold">FFz — Força (escala de Borg CR-10)</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs">Moderada (Borg 3–4)</Label>
            <Select value={String(c.forcaModerada)} onValueChange={(v) => set({ forcaModerada: Number(v) as OcraChecklistInput["forcaModerada"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Ausente</SelectItem>
                <SelectItem value="2">2 — 1/3 do tempo</SelectItem>
                <SelectItem value="4">4 — 50% do tempo</SelectItem>
                <SelectItem value="6">6 — &gt;50% do tempo</SelectItem>
                <SelectItem value="8">8 — Quase todo o tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Intensa (Borg 5–7)</Label>
            <Select value={String(c.forcaIntensa)} onValueChange={(v) => set({ forcaIntensa: Number(v) as OcraChecklistInput["forcaIntensa"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Ausente</SelectItem>
                <SelectItem value="4">4 — 2 s / 10 min</SelectItem>
                <SelectItem value="8">8 — 1% do tempo</SelectItem>
                <SelectItem value="16">16 — 5% do tempo</SelectItem>
                <SelectItem value="24">24 — &gt;10% do tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quase máxima (Borg ≥8)</Label>
            <Select value={String(c.forcaQuaseMaxima)} onValueChange={(v) => set({ forcaQuaseMaxima: Number(v) as OcraChecklistInput["forcaQuaseMaxima"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Ausente</SelectItem>
                <SelectItem value="6">6 — 2 s / 10 min</SelectItem>
                <SelectItem value="12">12 — 1% do tempo</SelectItem>
                <SelectItem value="24">24 — 5% do tempo</SelectItem>
                <SelectItem value="32">32 — &gt;10% do tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold">FP — Posturas e estereotipia</p>
        <DicaErgo>
          FP = máximo (ombro, cotovelo, punho, mão) + estereotipia. Ombro: braço ~altura do ombro
          ou postura extrema; mão: pinça, gancho ou palmar.
        </DicaErgo>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Ombro / braço</Label>
            <Select value={String(c.ombro)} onValueChange={(v) => set({ ombro: Number(v) as OcraChecklistInput["ombro"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Sem postura forçada relevante</SelectItem>
                <SelectItem value="1">1 — Ligeiramente elevado &gt;½ do tempo</SelectItem>
                <SelectItem value="2">2 — À altura do ombro ~10% do tempo</SelectItem>
                <SelectItem value="6">6 — À altura do ombro ~1/3 do tempo</SelectItem>
                <SelectItem value="12">12 — À altura do ombro &gt;½ do tempo</SelectItem>
                <SelectItem value="24">24 — À altura do ombro todo o tempo</SelectItem>
              </SelectContent>
            </Select>
            <label className="mt-2 flex items-center gap-1.5 text-xs">
              <Checkbox checked={c.maosAcimaCabeca} onCheckedChange={(v) => set({ maosAcimaCabeca: !!v })} />
              Mãos acima da cabeça (duplica pontuação do ombro)
            </label>
          </div>
          <div>
            <Label className="text-xs">Cotovelo</Label>
            <Select value={String(c.cotovelo)} onValueChange={(v) => set({ cotovelo: Number(v) as OcraChecklistInput["cotovelo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Sem movimentos amplos/bruscos</SelectItem>
                <SelectItem value="2">2 — ~1/3 do tempo</SelectItem>
                <SelectItem value="4">4 — &gt;½ do tempo</SelectItem>
                <SelectItem value="8">8 — Quase todo o tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Punho</Label>
            <Select value={String(c.punho)} onValueChange={(v) => set({ punho: Number(v) as OcraChecklistInput["punho"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Neutro</SelectItem>
                <SelectItem value="2">2 — Extremo ~1/3 do tempo</SelectItem>
                <SelectItem value="4">4 — Extremo &gt;½ do tempo</SelectItem>
                <SelectItem value="8">8 — Extremo todo o tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mão (pinça / gancho / palmar)</Label>
            <Select value={String(c.mao)} onValueChange={(v) => set({ mao: Number(v) as OcraChecklistInput["mao"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Grip de potência adequado / sem pinça</SelectItem>
                <SelectItem value="2">2 — ~1/3 do tempo</SelectItem>
                <SelectItem value="4">4 — &gt;½ do tempo</SelectItem>
                <SelectItem value="8">8 — Quase todo o tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Movimentos estereotipados</Label>
            <Select value={String(c.estereotipia)} onValueChange={(v) => set({ estereotipia: Number(v) as OcraChecklistInput["estereotipia"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Ausentes ou &lt;2/3 do tempo</SelectItem>
                <SelectItem value="1.5">1,5 — Idênticos ≥2/3 do tempo ou ciclo 8–15 s</SelectItem>
                <SelectItem value="3">3 — Quase todo o tempo ou ciclo &lt;8 s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold">FC — Fatores complementares</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Físico-mecânicos</Label>
            <Select value={String(c.fisicoMecanico)} onValueChange={(v) => set({ fisicoMecanico: Number(v) as OcraChecklistInput["fisicoMecanico"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Ausentes</SelectItem>
                <SelectItem value="2">2 — Um fator (luvas, frio, vibração, precisão, impactos…)</SelectItem>
                <SelectItem value="3">3 — Vários fatores quase todo o tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Socio-organizativos (ritmo)</Label>
            <Select value={String(c.socioOrganizativo)} onValueChange={(v) => set({ socioOrganizativo: Number(v) as OcraChecklistInput["socioOrganizativo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Ritmo autodeterminado</SelectItem>
                <SelectItem value="1">1 — Ritmo parcial da máquina (pequenos ajustes)</SelectItem>
                <SelectItem value="2">2 — Ritmo totalmente determinado pela máquina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}

function IndiceFields({
  value: i,
  onChange,
}: {
  value: OcraIndiceInput;
  onChange: (v: OcraIndiceInput) => void;
}) {
  const set = (patch: Partial<OcraIndiceInput>) => onChange({ ...i, ...patch });
  const fObs = i.tempoCicloSeg > 0
    ? Math.round(((i.acoesTecnicasCiclo * 60) / i.tempoCicloSeg) * 10) / 10
    : 0;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-semibold">Índice OCRA — ações observadas</p>
        <DicaErgo>
          IE = ATA / RTA. Frequência observada = (ações no ciclo × 60) / tempo de ciclo.
          RTA/min = CF(30) × Ff × Fp × Fa × Fr × Fd. Multiplicadores oficiais (ISO 11228-3).
        </DicaErgo>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Ações técnicas no ciclo</Label>
            <Input type="number" step="0.25" value={i.acoesTecnicasCiclo} onChange={(e) => set({ acoesTecnicasCiclo: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Tempo de ciclo (s)</Label>
            <Input type="number" step="0.1" value={i.tempoCicloSeg} onChange={(e) => set({ tempoCicloSeg: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">TNTR (min)</Label>
            <Input type="number" value={i.tntrMin} onChange={(e) => set({ tntrMin: Number(e.target.value) })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Frequência observada: <strong>{fObs} ações/min</strong>
        </p>
      </section>

      <section className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold">Multiplicadores (RTA)</p>
        {([
          ["Ff", OCRA_FF_OPTIONS, i.Ff],
          ["Fp", OCRA_FP_OPTIONS, i.Fp],
          ["Fa", OCRA_FA_OPTIONS, i.Fa],
          ["Fr", OCRA_FR_OPTIONS, i.Fr],
          ["Fd", OCRA_FD_OPTIONS, i.Fd],
        ] as const).map(([key, opts, val]) => (
          <div key={key}>
            <Label className="text-xs">{key}</Label>
            <Select
              value={String(val)}
              onValueChange={(v) => set({ [key]: Number(v) } as Partial<OcraIndiceInput>)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {opts.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </section>
    </div>
  );
}
