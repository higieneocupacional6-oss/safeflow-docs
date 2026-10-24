import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "usuario";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const current = (version: number) => active && revision === version;
    const clearIdentity = () => {
      setSession(null);
      setUser(null);
      setRole(null);
      setProfileName(null);
    };
    // Storage/broker or network failures must never leave the protected shell loading forever.
    const timeout = window.setTimeout(() => {
      if (!active) return;
      revision += 1;
      clearIdentity();
      setLoading(false);
    }, 15000);

    const restore = async (candidate: Session | null, version: number) => {
      try {
        if (!current(version)) return;
        if (!candidate) { clearIdentity(); return; }
        // getSession reads local storage; only the auth server can validate the identity.
        let verified = await supabase.auth.getUser(candidate.access_token);
        if (verified.error || !verified.data.user) {
          if (!current(version)) return;
          const renewed = await supabase.auth.refreshSession();
          if (renewed.error || !renewed.data.session) throw new Error("Session unavailable");
          candidate = renewed.data.session;
          verified = await supabase.auth.getUser(candidate.access_token);
        }
        if (verified.error || !verified.data.user) throw new Error("Session unavailable");
        if (!current(version)) return;
        const uid = verified.data.user.id;
        const [{ data: roleData }, { data: profileData }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", uid).order("role", { ascending: true }).limit(1).maybeSingle(),
          supabase.from("profiles").select("nome").eq("user_id", uid).maybeSingle(),
        ]);
        if (!current(version)) return;
        setSession(candidate);
        setUser(verified.data.user);
        setRole((roleData?.role as AppRole) ?? "usuario");
        setProfileName(profileData?.nome?.trim() || null);
      } catch {
        // Do not revoke other devices or delete stored sessions on transient connectivity failures.
        if (current(version)) clearIdentity();
      } finally {
        if (current(version)) {
          window.clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const version = ++revision;
      if (!newSession) {
        clearIdentity();
        window.clearTimeout(timeout);
        setLoading(false);
      } else {
        // Never await another auth method inside the auth listener's locked callback.
        if (user?.id !== newSession.user.id) {
        setRole(null);
        setProfileName(null);
        }
        window.setTimeout(() => { void restore(newSession, version); }, 0);
      }
    });

    const initialVersion = revision;
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        await restore(data.session, initialVersion);
      } catch {
        if (current(initialVersion)) {
          clearIdentity();
          window.clearTimeout(timeout);
          setLoading(false);
        }
      }
    })();

    return () => { active = false; window.clearTimeout(timeout); sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Verifica se está ativo
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const { data: profile } = await supabase
        .from("profiles").select("ativo").eq("user_id", u.id).maybeSingle();
      if (profile && profile.ativo === false) {
        await supabase.auth.signOut();
        return { error: "Usuário inativo. Contate o administrador." };
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const mustChangePassword = user?.user_metadata?.must_change_password === true;

  return (
    <AuthContext.Provider value={{ session, user, role, loading, isAdmin: role === "admin", mustChangePassword, profileName, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
