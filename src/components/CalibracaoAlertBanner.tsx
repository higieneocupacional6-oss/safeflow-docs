import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { statusCalibracao } from "@/lib/calibracao";
import { useAuth } from "@/hooks/useAuth";

export function CalibracaoAlertBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["equipamentos_ho"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos_ho")
        .select("nome, equipamentos_ho_registros(data_calibracao)");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  let atencao = 0, vencido = 0;
  for (const e of data as any[]) {
    for (const r of e.equipamentos_ho_registros || []) {
      const s = statusCalibracao(r.data_calibracao).status;
      if (s === "atencao") atencao++;
      else if (s === "vencido") vencido++;
    }
  }

  useEffect(() => {
    setDismissed(false);
  }, [atencao, vencido]);

  if (!user || dismissed || (atencao === 0 && vencido === 0)) return null;

  const isVencido = vencido > 0;

  return (
    <div
      className={`relative px-4 py-2.5 text-sm flex items-center justify-center gap-3 ${
        isVencido
          ? "bg-red-100 text-red-900 border-b border-red-300 dark:bg-red-950/50 dark:text-red-200"
          : "bg-amber-100 text-amber-900 border-b border-amber-300 dark:bg-amber-950/50 dark:text-amber-100"
      }`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        Você possui equipamentos próximos do vencimento ou vencidos.
        {vencido > 0 && <strong> {vencido} vencido{vencido > 1 ? "s" : ""}</strong>}
        {vencido > 0 && atencao > 0 && " · "}
        {atencao > 0 && <strong>{atencao} em atenção</strong>}
        . Verifique o controle de calibração.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7"
        onClick={() => navigate("/cadastros?tab=equipamentos&controle=1")}
      >
        Abrir controle
      </Button>
      <button
        aria-label="Fechar"
        onClick={() => setDismissed(true)}
        className="ml-2 opacity-70 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
