import { ReactNode, useCallback, useEffect, useState } from "react";
import { checkApiHealth } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { getErgoPreparedAt } from "@/lib/ergonomia/offlineDb";

function isPublicPsicoPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/avaliacao-psicossocial/");
}

function isPublicPortalClientesPath(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  // /p/:token ou /portal-clientes/:token — não inclui /portal-clientes/link/:id (admin)
  return p.startsWith("/p/") || /^\/portal-clientes\/(?!link(?:\/|$))[^/]+/.test(p);
}

function isPublicUnauthPath(): boolean {
  return isPublicPsicoPath() || isPublicPortalClientesPath();
}

function isFerramentasErgoPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/ferramentas-ergonomicas");
}

/** Shell autenticado offline: pacote ergonômico preparado neste dispositivo. */
function canUseErgoOfflineShell(): boolean {
  if (typeof window === "undefined") return false;
  return !!getErgoPreparedAt() || isFerramentasErgoPath();
}

/**
 * Garante API/banco no ar para o SaaS.
 * Rotas públicas (psico) e shell das Ferramentas Ergonômicas (pacote preparado)
 * abrem sem API — cálculos e IndexedDB locais.
 */
export function ApiConfigGate({ children }: { children: ReactNode }) {
  const [publicRoute] = useState(() => isPublicUnauthPath());
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(publicRoute);
  const [checking, setChecking] = useState(!publicRoute);
  const [offlineShell, setOfflineShell] = useState(false);

  const probe = useCallback(async () => {
    if (isPublicUnauthPath()) {
      setReady(true);
      setChecking(false);
      setError(null);
      setOfflineShell(false);
      return;
    }
    setChecking(true);
    setError(null);
    setReady(false);
    setOfflineShell(false);
    try {
      await checkApiHealth();
      setReady(true);
    } catch (err) {
      if (canUseErgoOfflineShell()) {
        setOfflineShell(true);
        setReady(true);
        setError(null);
        return;
      }
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

  if (publicRoute || isPublicUnauthPath()) {
    return <>{children}</>;
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <section className="max-w-lg rounded-xl border bg-card p-6 text-center shadow-sm space-y-4">
          <h1 className="font-heading text-xl font-bold">SegCRM offline</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground text-left space-y-1">
            <span className="block">Para Ferramentas Ergonômicas offline, prepare o pacote com internet em</span>
            <code className="block rounded bg-muted px-2 py-1 text-[11px]">/ferramentas-ergonomicas</code>
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

  return (
    <>
      {offlineShell && (
        <div className="border-b border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-center text-xs text-amber-900 dark:text-amber-100">
          Modo offline — API indisponível. Ferramentas Ergonômicas usam o pacote local deste dispositivo.
        </div>
      )}
      {children}
    </>
  );
}
