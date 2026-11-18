import { ReactNode, useCallback, useEffect, useState } from "react";
import { checkApiHealth } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";

/** Garante que a API do SegCRM (e o banco, via /health/ready) estão no ar. */
export function ApiConfigGate({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  const probe = useCallback(async () => {
    setChecking(true);
    setError(null);
    setReady(false);
    try {
      await checkApiHealth();
      setReady(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "API do SegCRM indisponível. Confira se o backend está em execução e se o PostgreSQL segcrm está acessível.",
      );
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <section className="max-w-lg rounded-xl border bg-card p-6 text-center shadow-sm space-y-4">
          <h1 className="font-heading text-xl font-bold">SegCRM offline</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground text-left space-y-1">
            <span className="block">Em desenvolvimento, a API precisa estar em http://127.0.0.1:4000:</span>
            <code className="block rounded bg-muted px-2 py-1 text-[11px]">npm run dev:api</code>
            <span className="block">ou os dois juntos:</span>
            <code className="block rounded bg-muted px-2 py-1 text-[11px]">npm run dev:full</code>
          </p>
          <Button type="button" onClick={() => void probe()} disabled={checking}>
            {checking ? "Verificando…" : "Tentar novamente"}
          </Button>
        </section>
      </main>
    );
  }

  if (!ready || checking) {
    return (
      <main className="min-h-screen grid place-items-center p-6 text-sm text-muted-foreground">
        Conectando ao SegCRM…
      </main>
    );
  }

  return <>{children}</>;
}
