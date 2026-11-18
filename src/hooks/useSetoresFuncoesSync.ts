import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Sem Realtime: atualiza setores/funções ao focar a janela. */
export function useSetoresFuncoesSync(onChange?: () => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["setores"] });
      void queryClient.invalidateQueries({ queryKey: ["funcoes"] });
      onChange?.();
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
  }, [queryClient, onChange]);
}
