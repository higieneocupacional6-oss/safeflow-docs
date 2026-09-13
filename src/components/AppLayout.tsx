import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCircle2, Wifi, WifiOff } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CalibracaoAlertBanner } from "@/components/CalibracaoAlertBanner";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [syncOnline, setSyncOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setSyncOnline(true);
    const offline = () => setSyncOnline(false);
    const sync = (event: Event) => setSyncOnline((event as CustomEvent<string>).detail === "SUBSCRIBED");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("segdoc:sync-status", sync);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("segdoc:sync-status", sync);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="glass-nav sticky top-0 z-40">
            <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
              <SidebarTrigger className="shrink-0" />
              <span className="font-heading text-sm font-bold tracking-tight hidden sm:block">
                SEG<span className="text-gradient-brand">DOC</span>
              </span>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground" title={syncOnline ? "Sincronização ativa" : "Sem sincronização"}>
                  {syncOnline ? <Wifi className="h-3.5 w-3.5 text-success" /> : <WifiOff className="h-3.5 w-3.5 text-destructive" />}
                  <span>{syncOnline ? "Sincronizado" : "Offline"}</span>
                </div>
                <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setProfileOpen(false), 150)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Perfil"
                >
                  <UserCircle2 className="h-5 w-5" />
                  <span className="text-xs font-medium max-w-[160px] truncate hidden sm:inline">{user?.email}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-muted-foreground">Logado como</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                      {isAdmin && <p className="text-[10px] text-primary font-semibold mt-1">ADMINISTRADOR</p>}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </header>

          <CalibracaoAlertBanner />

          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
