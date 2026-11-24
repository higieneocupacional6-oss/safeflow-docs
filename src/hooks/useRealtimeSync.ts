import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Aceita nomes de tabela ou o formato legado `{ table, queryKey }` usado nas páginas. */
export type RealtimeSyncSpec = string | { table: string; queryKey?: string | string[] };

/**
 * Sem postgres_changes: invalida queries ao focar a janela.
 * O 2º argumento (channel) é ignorado — mantido só para compatibilidade com as call sites.
 */
export function useRealtimeSync(_tables?: RealtimeSyncSpec[], _channelName?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [queryClient]);
}
