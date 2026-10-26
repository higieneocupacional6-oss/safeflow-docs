import { ReactNode } from "react";
import { supabaseConfigError } from "@/integrations/supabase/client";

/** Blocks the app shell when Vite baked no Supabase URL/key into the bundle. */
export function SupabaseConfigGate({ children }: { children: ReactNode }) {
  if (!supabaseConfigError) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Configuração incompleta</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{supabaseConfigError}</p>
        <p className="text-xs text-muted-foreground">
          Após salvar as variáveis, dispare um novo build/deploy — o Vite embute esses valores na compilação.
        </p>
      </div>
    </div>
  );
}
