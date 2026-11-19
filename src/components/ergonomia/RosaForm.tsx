import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ROSA_DURACAO_LABELS,
  type RosaDuracao,
  type RosaInput,
} from "@/lib/ergonomia/rosa";
import {
  DicaErgo,
  IlustracaoCadeira,
  IlustracaoEstacao,
  IlustracaoMonitor,
} from "./ErgoIllustrations";

type Props = {
  value: RosaInput;
  onChange: (v: RosaInput) => void;
};

function DuracaoSelect({
  value,
  onChange,
}: {
  value: RosaDuracao;
  onChange: (v: RosaDuracao) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v) as RosaDuracao)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {([-1, 0, 1] as RosaDuracao[]).map((d) => (
          <SelectItem key={d} value={String(d)}>{ROSA_DURACAO_LABELS[d]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </label>
  );
}

export function RosaForm({ value: r, onChange }: Props) {
  const set = (patch: Partial<RosaInput>) => onChange({ ...r, ...patch });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3">
        <IlustracaoEstacao className="mx-auto h-24 max-w-sm text-primary" />
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Estação de escritório — observe cadeira, monitor, teclado, mouse e telefone em uso real.
        </p>
      </div>

      {/* Cadeira */}
      <section className="space-y-3 rounded-lg border p-3">
        <div className="flex items-start gap-3">
          <IlustracaoCadeira className="h-16 w-24 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Seção A — Cadeira</p>
            <DicaErgo>
              Compare com a postura ideal: joelhos ~90°, pés apoiados, ~8 cm entre o assento e a
              parte posterior do joelho, cotovelos alinhados aos ombros e apoio lombar com
              encosto entre 95° e 110°.
            </DicaErgo>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Altura do assento</Label>
            <Select
              value={String(r.alturaAssento)}
              onValueChange={(v) => set({ alturaAssento: Number(v) as 1 | 2 | 3 })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Joelhos flexionados ~90°</SelectItem>
                <SelectItem value="2">2 — Muito baixo (&lt;90°) ou muito alto (&gt;90°)</SelectItem>
                <SelectItem value="3">3 — Pés sem contato com o solo</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.alturaEspacoInsuficiente} onChange={(v) => set({ alturaEspacoInsuficiente: v })} label="Espaço insuficiente sob a mesa (+1)" />
              <Check checked={r.alturaNaoRegulavel} onChange={(v) => set({ alturaNaoRegulavel: v })} label="Altura não regulável (+1)" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Profundidade do assento</Label>
            <Select
              value={String(r.profundidadeAssento)}
              onValueChange={(v) => set({ profundidadeAssento: Number(v) as 1 | 2 })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — ~8 cm entre assento e joelho</SelectItem>
                <SelectItem value="2">2 — Muito longo (&lt;8 cm) ou muito curto (&gt;8 cm)</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              <Check checked={r.profundidadeNaoRegulavel} onChange={(v) => set({ profundidadeNaoRegulavel: v })} label="Profundidade não regulável (+1)" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Apoio para os braços</Label>
            <Select
              value={String(r.apoioBracos)}
              onValueChange={(v) => set({ apoioBracos: Number(v) as 1 | 2 })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Cotovelos apoiados, ombros relaxados</SelectItem>
                <SelectItem value="2">2 — Muito altos (ombros encolhidos) ou muito baixos</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.apoioMuitoSeparados} onChange={(v) => set({ apoioMuitoSeparados: v })} label="Muito separados (+1)" />
              <Check checked={r.apoioSuperficieDura} onChange={(v) => set({ apoioSuperficieDura: v })} label="Superfície dura/danificada (+1)" />
              <Check checked={r.apoioNaoAjustavel} onChange={(v) => set({ apoioNaoAjustavel: v })} label="Não ajustáveis (+1)" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Encosto</Label>
            <Select
              value={String(r.encosto)}
              onValueChange={(v) => set({ encosto: Number(v) as 1 | 2 })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — 95–110° com apoio lombar adequado</SelectItem>
                <SelectItem value="2">2 — Ângulo inadequado, sem lombar ou sem uso do encosto</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.encostoSuperficieAlta} onChange={(v) => set({ encostoSuperficieAlta: v })} label="Superfície de trabalho alta / ombros encolhidos (+1)" />
              <Check checked={r.encostoNaoAjustavel} onChange={(v) => set({ encostoNaoAjustavel: v })} label="Encosto não ajustável (+1)" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Tempo de uso da cadeira</Label>
          <DuracaoSelect value={r.duracaoCadeira} onChange={(v) => set({ duracaoCadeira: v })} />
        </div>
      </section>

      {/* Monitor + Telefone */}
      <section className="space-y-3 rounded-lg border p-3">
        <div className="flex items-start gap-3">
          <IlustracaoMonitor className="h-14 w-20 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Seção B — Monitor e telefone</p>
            <DicaErgo>
              Monitor ideal: 45–75 cm dos olhos, borda superior na altura dos olhos. Telefone ideal:
              headset ou uso com uma mão e pescoço neutro, ao alcance (≤30 cm).
            </DicaErgo>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Monitor</Label>
            <Select value={String(r.monitor)} onValueChange={(v) => set({ monitor: Number(v) as 1 | 2 | 3 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — 45–75 cm / topo ao nível dos olhos</SelectItem>
                <SelectItem value="2">2 — Muito baixo (~30° abaixo do olhar)</SelectItem>
                <SelectItem value="3">3 — Muito alto (extensão do pescoço)</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.monitorGiroPescoco} onChange={(v) => set({ monitorGiroPescoco: v })} label="Giro do pescoço &gt;30° (+1)" />
              <Check checked={r.monitorSemAtril} onChange={(v) => set({ monitorSemAtril: v })} label="Documentos sem atril (+1)" />
              <Check checked={r.monitorBrilho} onChange={(v) => set({ monitorBrilho: v })} label="Brilho/reflexos (+1)" />
              <Check checked={r.monitorMuitoLonge} onChange={(v) => set({ monitorMuitoLonge: v })} label="Muito longe (&gt;75 cm; só se baixo) (+1)" />
            </div>
            <div className="mt-2">
              <Label className="text-xs">Tempo de uso do monitor</Label>
              <DuracaoSelect value={r.duracaoMonitor} onChange={(v) => set({ duracaoMonitor: v })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Telefone</Label>
            <Select value={String(r.telefone)} onValueChange={(v) => set({ telefone: Number(v) as 1 | 2 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Headset / uma mão + pescoço neutro (≤30 cm)</SelectItem>
                <SelectItem value="2">2 — Telefone longe (&gt;30 cm)</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.telefoneOmbroPescoco} onChange={(v) => set({ telefoneOmbroPescoco: v })} label="Segurado entre ombro e pescoço (+2)" />
              <Check checked={r.telefoneSemMaosLivres} onChange={(v) => set({ telefoneSemMaosLivres: v })} label="Sem função mãos livres (+1)" />
            </div>
            <div className="mt-2">
              <Label className="text-xs">Tempo de uso do telefone</Label>
              <DuracaoSelect value={r.duracaoTelefone} onChange={(v) => set({ duracaoTelefone: v })} />
            </div>
          </div>
        </div>
      </section>

      {/* Mouse + Teclado */}
      <section className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-semibold">Seção C — Mouse e teclado</p>
        <DicaErgo>
          Mouse alinhado ao ombro, mesma superfície do teclado. Punhos retos, ombros relaxados;
          evite extensão &gt;15° e desvios laterais ao digitar.
        </DicaErgo>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Mouse</Label>
            <Select value={String(r.mouse)} onValueChange={(v) => set({ mouse: Number(v) as 1 | 2 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Alinhado com o ombro</SelectItem>
                <SelectItem value="2">2 — Desalinhado ou longe (alcançar)</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.mousePinça} onChange={(v) => set({ mousePinça: v })} label="Agarre em pinça / mouse pequeno (+1)" />
              <Check checked={r.mouseAlturaDiferente} onChange={(v) => set({ mouseAlturaDiferente: v })} label="Mouse e teclado em alturas diferentes (+2)" />
              <Check checked={r.mousePressao} onChange={(v) => set({ mousePressao: v })} label="Apoio/pressão inadequada na mão (+1)" />
            </div>
            <div className="mt-2">
              <Label className="text-xs">Tempo de uso do mouse</Label>
              <DuracaoSelect value={r.duracaoMouse} onChange={(v) => set({ duracaoMouse: v })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Teclado</Label>
            <Select value={String(r.teclado)} onValueChange={(v) => set({ teclado: Number(v) as 1 | 2 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Punhos retos, ombros relaxados</SelectItem>
                <SelectItem value="2">2 — Extensão do punho &gt;15°</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-3">
              <Check checked={r.tecladoDesvio} onChange={(v) => set({ tecladoDesvio: v })} label="Desvio lateral ao digitar (+1)" />
              <Check checked={r.tecladoMuitoAlto} onChange={(v) => set({ tecladoMuitoAlto: v })} label="Teclado alto / ombros encolhidos (+1)" />
              <Check checked={r.tecladoAlcanceAlto} onChange={(v) => set({ tecladoAlcanceAlto: v })} label="Alcance de objetos altos (+1)" />
              <Check checked={r.tecladoNaoAjustavel} onChange={(v) => set({ tecladoNaoAjustavel: v })} label="Teclado/plataforma não ajustável (+1)" />
            </div>
            <div className="mt-2">
              <Label className="text-xs">Tempo de uso do teclado</Label>
              <DuracaoSelect value={r.duracaoTeclado} onChange={(v) => set({ duracaoTeclado: v })} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
