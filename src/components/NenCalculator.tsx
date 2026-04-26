import { useState, useMemo, useEffect } from "react";
import { Calculator, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/** Converte um valor de dose (string|number) em decimal (1.0 = 100%). */
function parseDose(raw: any): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  let str = s.replace(",", ".");
  let pct = false;
  if (str.includes("%")) {
    pct = true;
    str = str.replace(/%/g, "").trim();
  }
  const n = Number(str);
  if (!isFinite(n) || n <= 0) return null;
  if (pct) return n / 100;
  if (n > 10) return n / 100;
  return n;
}

export interface NenRow {
  raw: string;
  dose: number;
  nen: number;
  nen_informado?: string;
  colaborador?: string;
  classificacao: "Aceitável" | "Acima do limite";
}

export interface NenResultado {
  linhas: NenRow[];
  nen_medio: number;
  classificacao: "Aceitável" | "Acima do limite";
  passos?: {
    li: number[];
    soma: number;
    media: number;
  };
}

/** Calcula NEN individual e médio (média energética) — NHO-01. */
export function calcularNEN(doses: number[]): { nens: number[]; nen_medio: number; li: number[]; soma: number; media: number } {
  const nens = doses.map((d) => Math.round((85 + 10 * Math.log10(d)) * 10) / 10);
  if (nens.length === 0) return { nens, nen_medio: 0, li: [], soma: 0, media: 0 };
  const li = nens.map((n) => Math.pow(10, n / 10));
  const soma = li.reduce((a, b) => a + b, 0);
  const media = soma / li.length;
  const nen_medio = Math.round(10 * Math.log10(media) * 10) / 10;
  return { nens, nen_medio, li, soma, media };
}

interface ResultadoCadastrado {
  dose_percentual?: string | number | null;
  dose?: string | number | null;
  resultado?: string | number | null;
  colaborador?: string | null;
}

interface Props {
  enabled: boolean;
  /** Resultados cadastrados (do modal "+ Resultados"). */
  resultados?: ResultadoCadastrado[];
  /** Resultado salvo anteriormente (modo visualização). */
  value?: NenResultado | null;
  /** Callback ao salvar/atualizar cálculo. */
  onChange?: (r: NenResultado) => void;
}

export function NenCalculator({ enabled, resultados = [], value, onChange }: Props) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [resultado, setResultado] = useState<NenResultado | null>(value || null);

  useEffect(() => {
    if (value) setResultado(value);
  }, [value]);

  // Cálculo automático a partir dos resultados cadastrados
  const computed = useMemo<{ data: NenResultado | null; erro: string | null }>(() => {
    const parsed: { raw: string; dose: number; nen_informado?: string; colaborador?: string }[] = [];
    for (const r of resultados || []) {
      const rawDose = r.dose_percentual ?? r.dose;
      const d = parseDose(rawDose);
      if (d == null) continue;
      parsed.push({
        raw: rawDose != null ? String(rawDose) : "",
        dose: d,
        nen_informado: r.resultado != null && String(r.resultado).trim() !== "" ? String(r.resultado) : undefined,
        colaborador: r.colaborador || undefined,
      });
    }
    if (parsed.length < 2) {
      return { data: null, erro: "Necessário no mínimo 2 medições válidas" };
    }
    const { nens, nen_medio, li, soma, media } = calcularNEN(parsed.map((p) => p.dose));
    const linhas: NenRow[] = parsed.map((p, i) => ({
      raw: p.raw,
      dose: p.dose,
      nen: nens[i],
      nen_informado: p.nen_informado,
      colaborador: p.colaborador,
      classificacao: nens[i] >= 85 ? "Acima do limite" : "Aceitável",
    }));
    return {
      data: {
        linhas,
        nen_medio,
        classificacao: nen_medio >= 85 ? "Acima do limite" : "Aceitável",
        passos: { li, soma, media },
      },
      erro: null,
    };
  }, [resultados]);

  // Atualiza/salva automaticamente quando o cálculo for válido e mudar
  useEffect(() => {
    if (!calcOpen) return;
    if (computed.data) {
      setResultado(computed.data);
      onChange?.(computed.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcOpen, computed.data?.nen_medio, computed.data?.linhas?.length]);

  if (!enabled) return null;

  const renderTabela = (r: NenResultado) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dose cadastrada</TableHead>
          <TableHead>Dose convertida</TableHead>
          <TableHead>NEN calculado (dB)</TableHead>
          <TableHead>NEN informado</TableHead>
          <TableHead>Classificação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {r.linhas.map((l, i) => (
          <TableRow key={i}>
            <TableCell className="font-mono">{l.raw}</TableCell>
            <TableCell className="font-mono">{(l.dose * 100).toFixed(1)}%</TableCell>
            <TableCell className="font-mono font-semibold">{l.nen.toFixed(1)}</TableCell>
            <TableCell className="font-mono text-muted-foreground">{l.nen_informado || "—"}</TableCell>
            <TableCell>
              <Badge
                className={
                  l.classificacao === "Acima do limite"
                    ? "bg-red-100 text-red-700 hover:bg-red-100"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                }
              >
                {l.classificacao}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderPassoAPasso = (r: NenResultado) => {
    if (!r.passos) return null;
    const { li, soma, media } = r.passos;
    return (
      <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
        <p className="font-semibold uppercase text-xs tracking-wider text-muted-foreground">Passo a passo do cálculo</p>
        <div>
          <p className="font-medium">1. NEN individual: <span className="font-mono">NEN = 85 + 10·log₁₀(D)</span></p>
          <ul className="ml-4 mt-1 font-mono text-xs space-y-0.5">
            {r.linhas.map((l, i) => (
              <li key={i}>
                D = {l.dose.toFixed(4)} → NEN = {l.nen.toFixed(1)} dB
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium">2. Conversão energética: <span className="font-mono">Lᵢ = 10^(NEN/10)</span></p>
          <p className="ml-4 mt-1 font-mono text-xs break-all">
            [{li.map((v) => v.toExponential(3)).join(", ")}]
          </p>
        </div>
        <div>
          <p className="font-medium">3. Soma e média:</p>
          <p className="ml-4 mt-1 font-mono text-xs">
            Σ Lᵢ = {soma.toExponential(3)} &nbsp;|&nbsp; Lₘ = Σ/n = {media.toExponential(3)}
          </p>
        </div>
        <div>
          <p className="font-medium">4. NEN médio: <span className="font-mono">10·log₁₀(Lₘ)</span></p>
          <p className="ml-4 mt-1 font-mono text-xs">
            NEN médio = <strong>{r.nen_medio.toFixed(1)} dB</strong>
          </p>
        </div>
      </div>
    );
  };

  const renderResultadoFinal = (r: NenResultado) => (
    <div
      className={`rounded-xl border p-5 text-center ${
        r.classificacao === "Acima do limite"
          ? "bg-red-50 border-red-200"
          : "bg-emerald-50 border-emerald-200"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        NEN Médio (energético) — NHO-01
      </p>
      <p
        className={`text-3xl font-heading font-bold mt-1 ${
          r.classificacao === "Acima do limite" ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {r.nen_medio.toFixed(1)} dB
      </p>
      <p className="text-sm font-medium mt-1">{r.classificacao}</p>
    </div>
  );

  return (
    <>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="gap-2" onClick={() => setCalcOpen(true)}>
          <Calculator className="w-4 h-4" /> Calcular NEN
        </Button>
        {resultado && (
          <Button type="button" variant="outline" className="gap-2" onClick={() => setViewOpen(true)}>
            <Eye className="w-4 h-4" /> Visualizar cálculo
          </Button>
        )}
      </div>

      {/* MODAL DE CÁLCULO */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">
              Cálculo de NEN – Ruído (NHO-01)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Doses obtidas automaticamente do cadastro de resultados. O cálculo é executado e salvo automaticamente.
            </p>

            {computed.erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
                {computed.erro}
              </div>
            )}

            {computed.data && (
              <>
                {renderTabela(computed.data)}
                {renderPassoAPasso(computed.data)}
                {renderResultadoFinal(computed.data)}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL VISUALIZAÇÃO */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">
              Visualizar Cálculo de NEN — Ruído (NHO-01)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resultado ? (
              <>
                {renderTabela(resultado)}
                {renderPassoAPasso(resultado)}
                {renderResultadoFinal(resultado)}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum cálculo salvo.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NenCalculator;
