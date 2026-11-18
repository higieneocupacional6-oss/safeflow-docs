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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      setUser(null);
      setLoading(false);
    }, 15000);

    void (async () => {
      try {
        await checkApiHealth();
        const me = await apiRequest<{ user: AuthUser }>("/api/auth/me");
        if (!active) return;
        setUser(me.user);
      } catch {
        if (active) setUser(null);
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
        return { error: "Usuário inativo. Contate o administrador." };
      }
      setUser(result.user);
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
