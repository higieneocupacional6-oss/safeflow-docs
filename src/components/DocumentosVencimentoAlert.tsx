import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  entraNoControleVencimento,
  labelTipoDocumento,
  statusVencimentoDocumento,
  validadeEfetiva,
} from "@/lib/documentoValidade";
import { formatDateOnly } from "@/lib/dateOnly";
import { cn } from "@/lib/utils";

type DocRow = {
  id: string;
  tipo: string;
  status: string | null;
  data_elaboracao: string | null;
  data_validade: string | null;
  empresa_nome: string | null;
  nome_documento: string | null;
};

/**
 * Aviso flutuante pós-login: documentos vencidos ou a vencer em 30 dias.
 * Fecha com X na sessão; reaparece em novo login enquanto houver pendências.
 */
export function DocumentosVencimentoAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const { data: documentos = [] } = useQuery({
    queryKey: ["docs-vencimento-alert"],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, status, data_elaboracao, data_validade, empresa_nome, nome_documento")
        .order("data_validade", { ascending: true });
      if (error) throw error;
      return (data || []) as DocRow[];
    },
  });

  const { vencidos, aVencer } = useMemo(() => {
    const vencidosList: DocRow[] = [];
    const aVencerList: DocRow[] = [];
    for (const doc of documentos) {
      if (!entraNoControleVencimento(doc)) continue;
      const st = statusVencimentoDocumento(doc);
      if (st === "vencido") vencidosList.push(doc);
      else if (st === "proximo") aVencerList.push(doc);
    }
    return { vencidos: vencidosList, aVencer: aVencerList };
  }, [documentos]);

  useEffect(() => {
    setDismissed(false);
  }, [user?.id]);

  const total = vencidos.length + aVencer.length;
  if (!user || dismissed || total === 0) return null;

  const titulo =
    vencidos.length > 0
      ? "Documentos com pendência de vencimento"
      : "Documentos próximos do vencimento";

  const nomeDoc = (d: DocRow) =>
    d.nome_documento || `${labelTipoDocumento(d.tipo)} — ${d.empresa_nome || "Empresa"}`;

  return (
    <aside
      className={cn(
        "fixed bottom-5 left-5 z-[60] w-[min(100%-2.5rem,22rem)] overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-lg backdrop-blur-md",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-start gap-3 border-b px-4 py-3",
          vencidos.length > 0
            ? "border-red-200/80 bg-red-50/90 dark:border-red-900 dark:bg-red-950/40"
            : "border-amber-200/80 bg-amber-50/90 dark:border-amber-900 dark:bg-amber-950/40",
        )}
      >
        <div
          className={cn(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
            vencidos.length > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100",
          )}
        >
          {vencidos.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-foreground">{titulo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {vencidos.length > 0 && (
              <span>
                <strong className="text-red-700 dark:text-red-300">{vencidos.length}</strong> vencido
                {vencidos.length > 1 ? "s" : ""}
              </span>
            )}
            {vencidos.length > 0 && aVencer.length > 0 && " · "}
            {aVencer.length > 0 && (
              <span>
                <strong className="text-amber-700 dark:text-amber-300">{aVencer.length}</strong> a vencer
                (30 dias)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar aviso"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="max-h-48 space-y-2 overflow-y-auto px-4 py-3 text-xs">
        {[...vencidos, ...aVencer].slice(0, 8).map((d) => {
          const st = statusVencimentoDocumento(d);
          return (
            <li key={d.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate font-medium text-foreground">{nomeDoc(d)}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  st === "vencido"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100",
                )}
              >
                {formatDateOnly(validadeEfetiva(d))}
              </span>
            </li>
          );
        })}
        {total > 8 && (
          <li className="text-muted-foreground">+ {total - 8} documento{total - 8 > 1 ? "s" : ""}…</li>
        )}
      </ul>

      <div className="border-t border-border/70 px-4 py-3">
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            setDismissed(true);
            navigate("/documentos/controle");
          }}
        >
          Abrir Controle de Documentos
        </Button>
      </div>
    </aside>
  );
}
