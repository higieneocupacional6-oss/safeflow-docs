import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest, checkApiHealth, clearApiCsrf, setApiCsrf } from "@/lib/apiClient";
import type { AuthUser } from "@/lib/db/client";

type AppRole = "admin" | "usuario";

interface AuthContextValue {
  session: { user: AuthUser } | null;
  user: AuthUser | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;
  profileName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_CACHE_KEY = "segdoc-auth-user-v1";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedUser(user: AuthUser | null): void {
  try {
    if (!user) localStorage.removeItem(AUTH_CACHE_KEY);
    else localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
  } catch {
    /* ignore quota / private mode */
  }
}

function isAuthRejection(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

function isNetworkOrServerFailure(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (typeof status === "number") return status >= 500 || status === 0;
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch|NetworkError|timeout|ECONNREFUSED|indisponível|conectar/i.test(msg);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      // Timeout: mantém identidade verificada em cache (outage ≠ logout).
      const cached = readCachedUser();
      setUser(cached);
      setLoading(false);
    }, 15000);

    void (async () => {
      try {
        await checkApiHealth();
        const me = await apiRequest<{ user: AuthUser }>("/api/auth/me");
        if (!active) return;
        setUser(me.user);
        writeCachedUser(me.user);
      } catch (error) {
        if (!active) return;
        if (isAuthRejection(error)) {
          writeCachedUser(null);
          setUser(null);
        } else if (isNetworkOrServerFailure(error) || (typeof navigator !== "undefined" && !navigator.onLine)) {
          // Rede/5xx: não reseta UI — identidade já verificada neste dispositivo.
          setUser(readCachedUser());
        } else {
          // Erro ambíguo sem status: se há cache e estamos offline, preserva.
          const cached = readCachedUser();
          if (cached && typeof navigator !== "undefined" && !navigator.onLine) setUser(cached);
          else {
            writeCachedUser(null);
            setUser(null);
          }
        }
      } finally {
        if (active) {
          window.clearTimeout(timeout);
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await apiRequest("/api/auth/csrf");
      const result = await apiRequest<{ user: AuthUser; csrfToken?: string }>("/api/auth/login", {
        method: "POST",
        csrf: true,
        body: { email, password },
      });
      if (result.csrfToken) setApiCsrf(result.csrfToken);
      if (!result.user.ativo) {
        await apiRequest("/api/auth/logout", { method: "POST", csrf: true });
        clearApiCsrf();
        writeCachedUser(null);
        return { error: "Usuário inativo. Contate o administrador." };
      }
      setUser(result.user);
      writeCachedUser(result.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Falha no login." };
    }
  };

  const signOut = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST", csrf: true });
    } catch {
      /* ignore */
    }
    clearApiCsrf();
    writeCachedUser(null);
    setUser(null);
  };

  const role = (user?.role as AppRole | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{
        session: user ? { user } : null,
        user,
        role,
        loading,
        isAdmin: role === "admin",
        mustChangePassword: user?.mustChangePassword === true,
        profileName: user?.nome?.trim() || null,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
