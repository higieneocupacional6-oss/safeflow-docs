import { useState, useMemo, useEffect } from "react";
import { Calculator, Eye, FileDown } from "lucide-react";
import jsPDF from "jspdf";
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
import { toast } from "sonner";

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
  /** Dose média (%) — média aritmética das doses cadastradas, prioritária para Insalubridade (NR-15). */
  dose_media?: number;
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

/** Dose média (%) — média aritmética simples. NR-15. */
export function calcularDoseMedia(dosesDecimal: number[]): number {
  if (!dosesDecimal.length) return 0;
  const pcts = dosesDecimal.map((d) => d * 100);
  const m = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  return Math.round(m * 100) / 100;
}

interface ResultadoCadastrado {
  dose_percentual?: string | number | null;
  dose?: string | number | null;
  resultado?: string | number | null;
  colaborador?: string | null;
}

interface ContextoNen {
  empresa?: string;
  setor?: string;
  colaboradores?: string;
  funcoes?: string;
  agente?: string;
}

interface Props {
  enabled: boolean;
  /** Resultados cadastrados (do modal "+ Resultados"). */
  resultados?: ResultadoCadastrado[];
  /** Resultado salvo anteriormente (modo visualização). */
  value?: NenResultado | null;
  /** Callback ao salvar/atualizar cálculo. */
  onChange?: (r: NenResultado) => void;
  /** Contexto opcional usado no PDF. */
  contexto?: ContextoNen;
  /** Tipo de documento — adapta título e prioridade do cálculo. */
  modo?: "ltcat" | "insalubridade" | "periculosidade";
}

export function NenCalculator({ enabled, resultados = [], value, onChange, contexto, modo = "ltcat" }: Props) {
  const isInsalubridade = modo === "insalubridade";
  const tituloModal = isInsalubridade
    ? "Cálculo de NEN – Ruído (NR-15)"
    : "Cálculo de NEN – Ruído (NHO-01)";
  const tituloVisualizar = isInsalubridade
    ? "Visualizar Cálculo de NEN — Ruído (NR-15)"
    : "Visualizar Cálculo de NEN — Ruído (NHO-01)";
  const tituloBotao = isInsalubridade ? "Calcular NEN (NR-15)" : "Calcular NEN";
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
    const dose_media = calcularDoseMedia(parsed.map((p) => p.dose));
    return {
      data: {
        linhas,
        nen_medio,
        dose_media,
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

  const renderResultadoFinal = (r: NenResultado) => {
    if (isInsalubridade) {
      const dm = r.dose_media ?? 0;
      return (
        <div className="space-y-3">
          <div className="rounded-xl border p-5 text-center bg-primary/5 border-primary/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              NEN Médio (NR-15) — Resultado principal
            </p>
            <p className="text-3xl font-heading font-bold mt-1 text-primary">
              {r.nen_medio.toFixed(1)} dB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Média energética das doses cadastradas (NHO-01)
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center bg-muted/30">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Dose Média (informativo) — NR-15
            </p>
            <p className="text-lg font-heading font-semibold">
              {dm.toFixed(2)} % <span className="text-xs font-normal text-muted-foreground">• Média aritmética simples</span>
            </p>
          </div>
        </div>
      );
    }
    return (
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
        {r.dose_media != null && (
          <p className="text-xs text-muted-foreground mt-2">Dose média: <strong>{r.dose_media.toFixed(2)}%</strong></p>
        )}
      </div>
    );
  };

  const sanitize = (s: string) => (s || "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

  const gerarPDF = (r: NenResultado | null) => {
    if (!r || !r.linhas?.length) {
      toast.error("Nenhum dado disponível para exportação");
      return;
    }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // Cabeçalho
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(isInsalubridade ? "CÁLCULO DE EXPOSIÇÃO AO RUÍDO – DOSE MÉDIA (NR-15)" : "CÁLCULO DE EXPOSIÇÃO AO RUÍDO – NEN (NHO-01)", pageW / 2, 13, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório técnico gerado automaticamente", pageW / 2, 18, { align: "center" });

    y = 30;
    doc.setTextColor(0, 0, 0);

    // Identificação
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("IDENTIFICAÇÃO", margin, y);
    y += 2;
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const dataAval = new Date().toLocaleDateString("pt-BR");
    const linhasIdent: [string, string][] = [
      ["Empresa:", contexto?.empresa || "—"],
      ["Setor:", contexto?.setor || "—"],
      ["Colaborador(es):", contexto?.colaboradores || "—"],
      ["Função(ões):", contexto?.funcoes || "—"],
      ["Agente:", contexto?.agente || "Ruído contínuo ou intermitente"],
      ["Data da avaliação:", dataAval],
    ];
    linhasIdent.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(k, margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(String(v || "—"), pageW - margin * 2 - 40);
      doc.text(lines, margin + 38, y);
      y += 5 * Math.max(1, lines.length);
    });

    y += 4;

    // Tabela
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RESULTADOS DAS MEDIÇÕES", margin, y);
    y += 2;
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    const colX = [margin, margin + 45, margin + 85, margin + 125, margin + 160];
    const headers = ["Dose informada", "Dose convertida", "NEN (dB)", "Classificação"];
    doc.setFillColor(230, 230, 235);
    doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setFontSize(9);
    headers.forEach((h, i) => doc.text(h, colX[i] + 2, y + 5));
    y += 7;

    doc.setFont("helvetica", "normal");
    r.linhas.forEach((l, idx) => {
      if (y > 270) { doc.addPage(); y = margin; }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 250);
        doc.rect(margin, y, pageW - margin * 2, 7, "F");
      }
      doc.text(String(l.raw || "—"), colX[0] + 2, y + 5);
      doc.text(`${(l.dose * 100).toFixed(1)}%`, colX[1] + 2, y + 5);
      doc.text(l.nen.toFixed(1), colX[2] + 2, y + 5);
      doc.text(l.classificacao, colX[3] + 2, y + 5);
      y += 7;
    });

    y += 6;

    // Passo a passo
    if (r.passos) {
      if (y > 240) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CÁLCULO – PASSO A PASSO (NHO-01)", margin, y);
      y += 2;
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const blocos: string[] = [
        "1. NEN individual: NEN = 85 + 10 x log10(D)",
        ...r.linhas.map((l) => `   D = ${l.dose.toFixed(4)}  =>  NEN = ${l.nen.toFixed(1)} dB`),
        "",
        "2. Conversão energética: Li = 10^(NEN/10)",
        `   [${r.passos.li.map((v) => v.toExponential(3)).join(", ")}]`,
        "",
        "3. Soma e média:",
        `   Soma Li = ${r.passos.soma.toExponential(3)}`,
        `   Lm = Soma / n = ${r.passos.media.toExponential(3)}`,
        "",
        "4. NEN médio: 10 x log10(Lm)",
        `   NEN médio = ${r.nen_medio.toFixed(1)} dB`,
      ];
      blocos.forEach((linha) => {
        const wrapped = doc.splitTextToSize(linha, pageW - margin * 2);
        if (y + wrapped.length * 4.5 > 280) { doc.addPage(); y = margin; }
        doc.text(wrapped, margin, y);
        y += wrapped.length * 4.5;
      });
      y += 4;
    }

    // Resultado final
    if (y > 250) { doc.addPage(); y = margin; }
    const acima = r.classificacao === "Acima do limite";
    if (acima) doc.setFillColor(254, 226, 226);
    else doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(acima ? 153 : 6, acima ? 27 : 95, acima ? 27 : 70);
    doc.text(`NEN Médio: ${r.nen_medio.toFixed(1)} dB`, pageW / 2, y + 9, { align: "center" });
    doc.setFontSize(10);
    doc.text(r.classificacao, pageW / 2, y + 16, { align: "center" });
    doc.setTextColor(0, 0, 0);

    const colab = sanitize(contexto?.colaboradores?.split(",")[0] || "colaborador");
    const dataFile = new Date().toISOString().slice(0, 10);
    doc.save(`NEN_Ruido_${colab}_${dataFile}.pdf`);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="gap-2" onClick={() => setCalcOpen(true)}>
          <Calculator className="w-4 h-4" /> {tituloBotao}
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
              {tituloModal}
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
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => gerarPDF(computed.data || resultado)}
              disabled={!computed.data && !resultado}
            >
              <FileDown className="w-4 h-4" /> Baixar PDF
            </Button>
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
              {tituloVisualizar}
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
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => gerarPDF(resultado)}
              disabled={!resultado}
            >
              <FileDown className="w-4 h-4" /> Baixar PDF
            </Button>
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
