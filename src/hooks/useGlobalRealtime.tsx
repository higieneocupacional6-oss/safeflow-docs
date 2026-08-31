import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Sincronização global multiusuário.
 *
 * Assina TODAS as alterações (INSERT/UPDATE/DELETE) do schema `public` em um
 * único canal Realtime e invalida o cache do React Query, de forma que qualquer
 * dado criado/editado por um usuário apareça automaticamente para os demais,
 * em todos os módulos, sem recarregar a página.
 *
 * O banco continua sendo a única fonte de verdade: aqui apenas descartamos o
 * cache local e forçamos novo fetch.
 */
export function GlobalRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const invalidateAll = () => {
      // debounce: várias linhas alteradas em lote geram um único refetch
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ refetchType: "active" });
      }, 150);
    };

    const channel = supabase
      .channel(`global-sync-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public" }, invalidateAll)
      .subscribe();

    // Reconexão / volta de foco: garante estado fresco vindo do banco
    const onFocus = () => queryClient.invalidateQueries({ refetchType: "active" });
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  return null;
}
