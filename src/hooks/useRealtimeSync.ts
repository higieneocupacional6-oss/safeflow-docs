import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Sem postgres_changes: invalida queries ao focar a janela. */
export function useRealtimeSync(_tables?: string[]) {
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
