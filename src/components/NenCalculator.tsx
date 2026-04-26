import { useState, useMemo, useEffect } from "react";
import { Calculator, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/** Converte uma linha de entrada em uma dose decimal (1.0 = 100%). */
function parseDose(raw: string): number | null {
  const s = (raw || "").trim();
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
  if (n > 10) return n / 100; // ex.: 80 -> 0.8
  return n; // ex.: 0.8
}

export interface NenRow {
  raw: string;
  dose: number; // decimal (1.0 = 100%)
  nen: number;  // dB(A)
  classificacao: "Aceitável" | "Acima do limite";
}

export interface NenResultado {
  linhas: NenRow[];
  nen_medio: number;
  classificacao: "Aceitável" | "Acima do limite";
  entrada: string;
}

/** Calcula NEN individual e médio (média energética) - NHO-01 Fundacentro. */
export function calcularNEN(doses: number[]): { nens: number[]; nen_medio: number } {
  const nens = doses.map((d) => Math.round((85 + 10 * Math.log10(d)) * 10) / 10);
  if (nens.length === 0) return { nens, nen_medio: 0 };
  const soma = nens.reduce((acc, n) => acc + Math.pow(10, n / 10), 0);
  const lm = soma / nens.length;
  const nen_medio = Math.round(10 * Math.log10(lm) * 10) / 10;
  return { nens, nen_medio };
}

interface Props {
  /** Mostra os botões somente quando habilitado (ex.: agente = ruído). */
  enabled: boolean;
  /** Resultado salvo anteriormente (para visualizar). */
  value?: NenResultado | null;
  /** Callback ao salvar cálculo. */
  onChange?: (r: NenResultado) => void;
}

export function NenCalculator({ enabled, value, onChange }: Props) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [entrada, setEntrada] = useState(value?.entrada || "");
  const [resultado, setResultado] = useState<NenResultado | null>(value || null);

  useEffect(() => {
    if (value) {
      setResultado(value);
      setEntrada(value.entrada || "");
    }
  }, [value]);

  const computed = useMemo<NenResultado | null>(() => {
    const linhasRaw = entrada.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: { raw: string; dose: number }[] = [];
    for (const raw of linhasRaw) {
      const d = parseDose(raw);
      if (d != null) parsed.push({ raw, dose: d });
    }
    if (parsed.length === 0) return null;
    const { nens, nen_medio } = calcularNEN(parsed.map((p) => p.dose));
    const linhas: NenRow[] = parsed.map((p, i) => ({
      raw: p.raw,
      dose: p.dose,
      nen: nens[i],
      classificacao: nens[i] >= 85 ? "Acima do limite" : "Aceitável",
    }));
    return {
      linhas,
      nen_medio,
      classificacao: nen_medio >= 85 ? "Acima do limite" : "Aceitável",
      entrada,
    };
  }, [entrada]);

  if (!enabled) return null;

  const handleSalvar = () => {
    if (!computed) return;
    setResultado(computed);
    onChange?.(computed);
    setCalcOpen(false);
  };

  const renderTabela = (r: NenResultado) => (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dose informada</TableHead>
            <TableHead>Dose convertida</TableHead>
            <TableHead>NEN (dB)</TableHead>
            <TableHead>Classificação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {r.linhas.map((l, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono">{l.raw}</TableCell>
              <TableCell className="font-mono">{(l.dose * 100).toFixed(1)}%</TableCell>
              <TableCell className="font-mono font-semibold">{l.nen.toFixed(1)}</TableCell>
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

      <div
        className={`mt-4 rounded-xl border p-5 text-center ${
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
    </>
  );

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setCalcOpen(true)}
        >
          <Calculator className="w-4 h-4" /> Calcular NEN
        </Button>
        {resultado && (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setViewOpen(true)}
          >
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
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Doses (uma por linha) — aceita 80, 80%, 0.8
              </label>
              <Textarea
                rows={6}
                className="mt-1 font-mono"
                placeholder={"80\n80%\n0.8\n100\n150%"}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Regras: <strong>%</strong> remove e divide por 100;{" "}
                <strong>&gt; 10</strong> divide por 100; ≤ 10 considerado decimal;
                vazios ignorados; ≤ 0 bloqueado.
              </p>
            </div>

            {computed ? (
              renderTabela(computed)
            ) : (
              <div className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
                Digite ao menos uma dose válida para calcular.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!computed}
              onClick={handleSalvar}
            >
              Salvar cálculo
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
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Doses informadas
                  </label>
                  <pre className="mt-1 p-3 rounded-lg bg-muted/30 border text-sm font-mono whitespace-pre-wrap">
                    {resultado.entrada}
                  </pre>
                </div>
                {renderTabela(resultado)}
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
