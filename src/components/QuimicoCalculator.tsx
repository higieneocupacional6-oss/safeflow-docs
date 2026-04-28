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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

/** Converte valor em número (vírgula→ponto). Retorna null se inválido ou ≤ 0. */
function parseConc(raw: any): number | null {
  if (raw == null) return null;
  const s = String(raw).trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!isFinite(n) || n <= 0) return null;
  return n;
}

export type Variabilidade = "Baixa" | "Média" | "Alta";
export type Situacao = "Abaixo do limite" | "Acima do limite" | "Sem LT";

export interface QuimicoLinha {
  raw: string;
  valor: number;
}

export interface QuimicoComponenteResultado {
  componente: string;
  linhas: QuimicoLinha[];
  /** Média EXATA da concentração (sem arredondamento). Use toFixed apenas para exibição. */
  media: number;
  min: number;
  max: number;
  variacao_pct: number;
  variabilidade: Variabilidade;
  lt: number | null;
  /** Média EXATA do limite de tolerância (sem arredondamento). */
  lt_media: number | null;
  unidade: string;
  situacao: Situacao;
  erro?: string;
}

export interface QuimicoComponenteCalculo {
  componente: string;
  media_concentracao: number;
  media_limite: number | null;
  unidade: string;
  situacao: Situacao;
}

export interface QuimicoResultado {
  componentes: QuimicoComponenteResultado[];
  /** Estrutura simplificada para uso direto no template DOCX. */
  componentes_calculo?: QuimicoComponenteCalculo[];
  /** Compat: também acessível em snake_case via array igual a componentes_calculo. */
  media_concentracao?: number;
  media_limite_tolerancia?: number;
}

interface ResultadoCadastrado {
  componente_avaliado?: string | null;
  componente?: string | null;
  resultado?: string | number | null;
  limite_tolerancia?: string | number | null;
  unidade?: string | null;
}

interface ContextoQuimico {
  empresa?: string;
  setor?: string;
  colaboradores?: string;
  funcoes?: string;
  agente?: string;
}

function classificarVariabilidade(v: number): Variabilidade {
  if (v <= 30) return "Baixa";
  if (v <= 60) return "Média";
  return "Alta";
}

/** Agrupa por componente_avaliado e calcula estatísticas por componente. */
export function calcularExposicaoPorComponente(
  dados: ResultadoCadastrado[],
): QuimicoComponenteResultado[] {
  const grupos: Record<string, { linhas: QuimicoLinha[]; lts: number[]; unidade: string }> = {};
  for (const d of dados || []) {
    const nome = String(d.componente_avaliado || d.componente || "").trim();
    if (!nome) continue;
    const valor = parseConc(d.resultado);
    const ltVal = parseConc(d.limite_tolerancia);
    if (!grupos[nome]) grupos[nome] = { linhas: [], lts: [], unidade: String(d.unidade || "") };
    if (!grupos[nome].unidade && d.unidade) grupos[nome].unidade = String(d.unidade);
    if (ltVal != null) grupos[nome].lts.push(ltVal);
    if (valor == null) continue;
    grupos[nome].linhas.push({ raw: String(d.resultado ?? ""), valor });
  }
  return Object.entries(grupos).map(([componente, g]) => {
    // PRECISÃO TOTAL — sem arredondamento aqui. Apenas exibição usa toFixed(n).
    const lt_media = g.lts.length ? g.lts.reduce((a, b) => a + b, 0) / g.lts.length : null;
    const lt = g.lts.length ? g.lts[0] : null;
    if (g.linhas.length === 0) {
      return {
        componente,
        linhas: [],
        media: 0,
        min: 0,
        max: 0,
        variacao_pct: 0,
        variabilidade: "Baixa",
        lt,
        lt_media,
        unidade: g.unidade || "",
        situacao: "Sem LT",
        erro: "Componente sem medições válidas",
      } as QuimicoComponenteResultado;
    }
    const valores = g.linhas.map((l) => l.valor);
    const soma = valores.reduce((a, b) => a + b, 0);
    const media = soma / valores.length; // sem arredondar
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const variacao_pct = media > 0 ? ((max - min) / media) * 100 : 0;
    const variabilidade = classificarVariabilidade(variacao_pct);
    const situacao: Situacao =
      lt_media == null ? "Sem LT" : media >= lt_media ? "Acima do limite" : "Abaixo do limite";
    return {
      componente,
      linhas: g.linhas,
      media,
      min,
      max,
      variacao_pct,
      variabilidade,
      lt,
      lt_media,
      unidade: g.unidade || "",
      situacao,
    };
  });
}

/** Estrutura simplificada para uso no template (loop {{#componentes_calculo}}). */
export function buildComponentesCalculo(
  componentes: QuimicoComponenteResultado[],
): QuimicoComponenteCalculo[] {
  return (componentes || [])
    .filter((c) => !c.erro)
    .map((c) => ({
      componente: c.componente,
      media_concentracao: c.media,
      media_limite: c.lt_media,
      unidade: c.unidade || "",
      situacao: c.situacao,
    }));
}

interface Props {
  enabled: boolean;
  resultados?: ResultadoCadastrado[];
  value?: QuimicoResultado | null;
  onChange?: (r: QuimicoResultado) => void;
  contexto?: ContextoQuimico;
}

export function QuimicoCalculator({ enabled, resultados = [], value, onChange, contexto }: Props) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [resultado, setResultado] = useState<QuimicoResultado | null>(value || null);

  useEffect(() => {
    if (value) setResultado(value);
  }, [value]);

  const computed = useMemo<{ data: QuimicoResultado | null; erro: string | null }>(() => {
    const componentes = calcularExposicaoPorComponente(resultados || []);
    if (componentes.length === 0) {
      return { data: null, erro: "Nenhum componente com medições válidas." };
    }
    return { data: { componentes }, erro: null };
  }, [resultados]);

  useEffect(() => {
    if (!calcOpen) return;
    if (computed.data) {
      setResultado(computed.data);
      onChange?.(computed.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcOpen, computed.data?.componentes?.length]);

  if (!enabled) return null;

  const corSituacao = (s: Situacao) =>
    s === "Acima do limite"
      ? "bg-red-100 text-red-700 hover:bg-red-100"
      : s === "Abaixo do limite"
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : "bg-muted text-muted-foreground hover:bg-muted";

  const corVar = (v: Variabilidade) =>
    v === "Alta"
      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
      : v === "Média"
      ? "bg-sky-100 text-sky-800 hover:bg-sky-100"
      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";

  const renderComponente = (c: QuimicoComponenteResultado) => (
    <div
      key={c.componente}
      className={`rounded-xl border p-4 space-y-3 ${
        c.situacao === "Acima do limite"
          ? "bg-red-50/40 border-red-200"
          : c.situacao === "Abaixo do limite"
          ? "bg-emerald-50/40 border-emerald-200"
          : "bg-muted/20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h4 className="font-heading font-bold uppercase tracking-wide text-sm">
          {c.componente}
        </h4>
        <div className="flex flex-wrap gap-2">
          <Badge className={corVar(c.variabilidade)}>Variabilidade: {c.variabilidade}</Badge>
          <Badge className={corSituacao(c.situacao)}>{c.situacao}</Badge>
        </div>
      </div>

      {c.erro ? (
        <div className="text-sm text-muted-foreground">{c.erro}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Valor informado</TableHead>
                <TableHead>Valor tratado (mg/m³)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.linhas.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">{i + 1}</TableCell>
                  <TableCell className="font-mono">{l.raw || "—"}</TableCell>
                  <TableCell className="font-mono font-semibold">{l.valor.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs uppercase text-muted-foreground tracking-wider">Média</p>
              <p className="font-mono font-bold text-base">{c.media.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs uppercase text-muted-foreground tracking-wider">Mínimo</p>
              <p className="font-mono">{c.min.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs uppercase text-muted-foreground tracking-wider">Máximo</p>
              <p className="font-mono">{c.max.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs uppercase text-muted-foreground tracking-wider">Variação</p>
              <p className="font-mono">{c.variacao_pct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs uppercase text-muted-foreground tracking-wider">LT (média)</p>
              <p className="font-mono">{c.lt_media != null ? `${c.lt_media.toFixed(2)}${c.unidade ? ` ${c.unidade}` : ""}` : "—"}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderResumo = (componentes: QuimicoComponenteResultado[]) => (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <h4 className="font-heading font-bold uppercase tracking-wide text-sm">
        Resumo por componente
      </h4>
      <div className="space-y-3">
        {componentes.map((c) => (
          <div key={`resumo-${c.componente}`} className="rounded-lg border bg-card p-3 text-sm space-y-1">
            <p className="font-bold uppercase tracking-wide">Componente: {c.componente}</p>
            <p>
              <span className="text-muted-foreground">Média da concentração: </span>
              <span className="font-mono font-semibold">
                {c.linhas.length ? `${c.media.toFixed(2)}${c.unidade ? ` ${c.unidade}` : ""}` : "—"}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Limite de tolerância (média): </span>
              <span className="font-mono font-semibold">
                {c.lt_media != null ? `${c.lt_media.toFixed(2)}${c.unidade ? ` ${c.unidade}` : ""}` : "—"}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const sanitize = (s: string) => (s || "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

  const gerarPDF = (r: QuimicoResultado | null) => {
    if (!r || !r.componentes?.length) {
      toast.error("Nenhum dado disponível para exportação");
      return;
    }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("EXPOSIÇÃO QUÍMICA POR COMPONENTE (NHO-08)", pageW / 2, 13, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório técnico gerado automaticamente", pageW / 2, 18, { align: "center" });

    y = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("IDENTIFICAÇÃO", margin, y);
    y += 2;
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const dataAval = new Date().toLocaleDateString("pt-BR");
    const ident: [string, string][] = [
      ["Empresa:", contexto?.empresa || "—"],
      ["Setor:", contexto?.setor || "—"],
      ["Colaborador(es):", contexto?.colaboradores || "—"],
      ["Função(ões):", contexto?.funcoes || "—"],
      ["Agente:", contexto?.agente || "Químico"],
      ["Data da avaliação:", dataAval],
    ];
    ident.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(k, margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(String(v || "—"), pageW - margin * 2 - 40);
      doc.text(lines, margin + 38, y);
      y += 5 * Math.max(1, lines.length);
    });

    y += 4;
    r.componentes.forEach((c) => {
      if (y > 250) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`COMPONENTE: ${c.componente}`, margin, y);
      y += 2;
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      if (c.erro) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(c.erro, margin, y);
        y += 6;
        return;
      }

      const colX = [margin, margin + 20, margin + 70];
      doc.setFillColor(230, 230, 235);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFontSize(9);
      ["#", "Valor informado", "Valor tratado (mg/m³)"].forEach((h, i) => doc.text(h, colX[i] + 2, y + 5));
      y += 7;
      doc.setFont("helvetica", "normal");
      c.linhas.forEach((l, idx) => {
        if (y > 275) { doc.addPage(); y = margin; }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 250);
          doc.rect(margin, y, pageW - margin * 2, 6, "F");
        }
        doc.text(String(idx + 1), colX[0] + 2, y + 4.5);
        doc.text(String(l.raw || "—"), colX[1] + 2, y + 4.5);
        doc.text(l.valor.toFixed(2), colX[2] + 2, y + 4.5);
        y += 6;
      });
      y += 2;

      doc.setFont("helvetica", "bold");
      doc.text("Resumo:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const linhasResumo = [
        `Média: ${c.media.toFixed(2)}  |  Mín: ${c.min.toFixed(2)}  |  Máx: ${c.max.toFixed(2)}`,
        `Variabilidade: ${c.variacao_pct.toFixed(1)}% (${c.variabilidade})`,
        `LT: ${c.lt != null ? c.lt.toFixed(2) : "—"}  =>  ${c.situacao}`,
      ];
      linhasResumo.forEach((l) => {
        const wrapped = doc.splitTextToSize(l, pageW - margin * 2);
        if (y + wrapped.length * 4.5 > 280) { doc.addPage(); y = margin; }
        doc.text(wrapped, margin, y);
        y += wrapped.length * 4.5;
      });
      y += 6;
    });

    // Resumo final por componente (média da concentração + LT médio + unidade)
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RESUMO POR COMPONENTE", margin, y);
    y += 2;
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    r.componentes.forEach((c) => {
      const u = c.unidade ? ` ${c.unidade}` : "";
      const linhas = [
        `Componente: ${c.componente}`,
        `Média da concentração: ${c.linhas.length ? c.media.toFixed(2) + u : "—"}`,
        `Limite de tolerância (média): ${c.lt_media != null ? c.lt_media.toFixed(2) + u : "—"}`,
      ];
      if (y + linhas.length * 5 + 4 > 285) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(linhas[0], margin, y); y += 5;
      doc.setFont("helvetica", "normal");
      doc.text(linhas[1], margin, y); y += 5;
      doc.text(linhas[2], margin, y); y += 7;
    });

    const nome = sanitize(contexto?.colaboradores?.split(",")[0] || "quimico");
    const dataFile = new Date().toISOString().slice(0, 10);
    doc.save(`Quimico_NHO08_${nome}_${dataFile}.pdf`);
  };

  return (
    <>
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" className="gap-2" onClick={() => setCalcOpen(true)}>
                <Calculator className="w-4 h-4" /> Cálculo média
              </Button>
            </TooltipTrigger>
            <TooltipContent>Calcular média por componente (NHO-08)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {resultado && (
          <Button type="button" variant="outline" className="gap-2" onClick={() => setViewOpen(true)}>
            <Eye className="w-4 h-4" /> Visualizar cálculo
          </Button>
        )}
      </div>

      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">
              Cálculo de Exposição por Componente (NHO-08)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Dados obtidos automaticamente dos resultados cadastrados, agrupados por componente avaliado.
            </p>
            {computed.erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
                {computed.erro}
              </div>
            )}
            {computed.data?.componentes.map((c) => renderComponente(c))}
            {computed.data?.componentes?.length ? renderResumo(computed.data.componentes) : null}
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

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">
              Visualizar Cálculo Químico (NHO-08)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resultado?.componentes?.length ? (
              <>
                {resultado.componentes.map((c) => renderComponente(c))}
                {renderResumo(resultado.componentes)}
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

export default QuimicoCalculator;
