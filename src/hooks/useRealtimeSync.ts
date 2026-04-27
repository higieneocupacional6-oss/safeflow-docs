import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Postgres realtime changes for a list of tables and
 * invalidates matching React Query caches so every screen stays in sync.
 *
 * Usage: useRealtimeSync([
 *   { table: "riscos", queryKey: ["riscos"] },
 *   { table: "unidades", queryKey: ["unidades"] },
 * ]);
 */
export function useRealtimeSync(
  subscriptions: { table: string; queryKey: unknown[] }[],
  channelName = "global-cadastros-sync"
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel(channelName);

    subscriptions.forEach(({ table, queryKey }) => {
      channel.on(
        // @ts-expect-error - postgres_changes types are loose
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
