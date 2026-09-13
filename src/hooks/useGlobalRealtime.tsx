import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const QUERY_KEYS_BY_TABLE: Record<string, string[]> = {
  empresas: ["empresas", "empresas-aet", "empresas-aep"],
  contratos: ["contratos", "contratos-sf", "contratos-aet", "contratos-aep"],
  setores: ["setores", "setores-empresa-aet", "setores-empresa-aep"],
  funcoes: ["funcoes", "funcoes-aet", "funcoes-aep"],
  riscos: ["riscos"],
  documentos: ["documentos"],
  templates: ["templates", "templates-aep", "templates-pgr"],
  equipamentos_ho: ["equipamentos_ho"],
  equipamentos_ho_registros: ["equipamentos_ho"],
  epi_epc: ["epi_epc", "epi-epc-cadastro"],
  epi_epc_riscos: ["epi_epc", "epi-epc-cadastro"],
  treinamentos_cadastro: ["treinamentos_cadastro"],
  exames_cadastro: ["exames_cadastro"],
  responsaveis: ["responsaveis"],
};

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

    const invalidateAffected = (payload?: { table?: string }) => {
      // debounce: várias linhas alteradas em lote geram um único refetch
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const keys = payload?.table ? QUERY_KEYS_BY_TABLE[payload.table] : undefined;
        if (!keys?.length) {
          queryClient.invalidateQueries({ refetchType: "active" });
          return;
        }
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key], refetchType: "active" }));
      }, 150);
    };

    const channel = supabase
      .channel(`global-sync-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public" }, invalidateAffected)
      .subscribe((status) => window.dispatchEvent(new CustomEvent("segdoc:sync-status", { detail: status })));

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
