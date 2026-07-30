import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mantém qualquer módulo de Documentos sincronizado com o módulo
 * Setores e Funções. Ao inserir/editar/excluir um setor ou uma função,
 * todas as queries relacionadas (setores*, funcoes*) são invalidadas e o
 * callback `onChange` é disparado para que o documento possa remover
 * vínculos órfãos, preservando os demais dados já preenchidos.
 */
export function useSetoresFuncoesSync(onChange?: () => void) {
  const queryClient = useQueryClient();
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const root = String(q.queryKey?.[0] ?? "");
          return /setor|func/i.test(root);
        },
      });
      cbRef.current?.();
    };

    const channel = supabase
      .channel(`setores-funcoes-sync-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "setores" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "funcoes" }, handler)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
