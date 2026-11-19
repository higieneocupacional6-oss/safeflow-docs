import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ErgoStepDef = {
  id: string;
  titulo: string;
  /** true quando a etapa atual está válida para avançar */
  valida: boolean;
};

type Props = {
  steps: ErgoStepDef[];
  stepIndex: number;
  onStepIndexChange: (i: number) => void;
  children: ReactNode;
  /** Conteúdo da etapa de resultado (última). */
  resultado?: ReactNode;
  onReadyChange?: (ready: boolean) => void;
};

export function ErgoStepShell({
  steps,
  stepIndex,
  onStepIndexChange,
  children,
  resultado,
  onReadyChange,
}: Props) {
  const total = steps.length + (resultado ? 1 : 0);
  const isResult = !!resultado && stepIndex >= steps.length;
  const current = isResult ? null : steps[stepIndex];
  const progresso = ((stepIndex + 1) / total) * 100;
  const canNext = isResult ? true : !!current?.valida;
  const atEnd = stepIndex >= total - 1;
  const ready = !!resultado && stepIndex >= steps.length;

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Etapa {Math.min(stepIndex + 1, total)} de {total}
            {current ? ` — ${current.titulo}` : resultado ? " — Resultado" : ""}
          </span>
          <span>{Math.round(progresso)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <div className="hidden gap-1 sm:flex">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              disabled={i > stepIndex && !steps.slice(0, i).every((x) => x.valida)}
              onClick={() => {
                if (i <= stepIndex || steps.slice(0, i).every((x) => x.valida)) {
                  onStepIndexChange(i);
                }
              }}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < stepIndex ? "bg-primary/70" : i === stepIndex ? "bg-primary" : "bg-muted",
              )}
              title={s.titulo}
            />
          ))}
          {resultado && (
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full",
                isResult ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </div>
      </div>

      <div className="min-h-[220px]">
        {isResult ? resultado : children}
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={stepIndex <= 0}
          onClick={() => onStepIndexChange(Math.max(0, stepIndex - 1))}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>

        {!atEnd ? (
          <Button
            type="button"
            size="sm"
            disabled={!canNext}
            onClick={() => onStepIndexChange(stepIndex + 1)}
          >
            Próximo <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" /> Avaliação completa — revise o resultado
          </span>
        )}
      </div>
    </div>
  );
}

export function ErgoOrientacao({
  observar,
  como,
  correto,
  incorreto,
  selecionado,
}: {
  observar: string;
  como?: string;
  correto?: string;
  incorreto?: string;
  selecionado?: string;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
      <p><span className="font-semibold text-foreground">O que observar:</span> {observar}</p>
      {como && <p><span className="font-semibold text-foreground">Como identificar:</span> {como}</p>}
      {(correto || incorreto) && (
        <div className="grid gap-1 sm:grid-cols-2">
          {correto && (
            <p className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-800 dark:text-emerald-300">
              Adequado: {correto}
            </p>
          )}
          {incorreto && (
            <p className="rounded bg-amber-500/10 px-2 py-1 text-amber-900 dark:text-amber-200">
              Inadequado: {incorreto}
            </p>
          )}
        </div>
      )}
      {selecionado && (
        <p className="border-t pt-1.5 text-foreground">
          <span className="font-semibold">Selecionado:</span> {selecionado}
        </p>
      )}
    </div>
  );
}

export function VisualChoiceGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-3",
        cols === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

export function VisualChoice({
  selected,
  onSelect,
  title,
  subtitle,
  illustration,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  illustration: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <div className="flex h-20 items-center justify-center text-primary">{illustration}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground leading-snug">{subtitle}</p>}
      </div>
    </button>
  );
}

export function ResultadoErgoPanel({
  resultado,
}: {
  resultado: {
    escore_final: number;
    classificacao: string;
    nivel_acao: string;
    recomendacoes: string;
    memoria_calculo: Array<{ etapa: string; valor: string | number; detalhe?: string }>;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado automático</p>
        <p className="mt-1 font-heading text-2xl font-bold">
          {resultado.escore_final}
          <span className="ml-2 text-base font-semibold text-foreground/80">
            — {resultado.classificacao}
          </span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{resultado.nivel_acao}</p>
      </div>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold">Interpretação técnica</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{resultado.recomendacoes}</p>
      </div>

      <div className="rounded-lg border p-3">
        <p className="mb-2 text-sm font-semibold">Fatores que contribuíram</p>
        <ul className="space-y-1.5">
          {resultado.memoria_calculo.map((m, i) => (
            <li key={`${m.etapa}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{m.etapa}</span>
              <span className="font-medium text-foreground">
                {m.valor}
                {m.detalhe ? ` — ${m.detalhe}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
