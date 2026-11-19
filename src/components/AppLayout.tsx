import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppTopNav } from "@/components/AppTopNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CalibracaoAlertBanner } from "@/components/CalibracaoAlertBanner";
import { DocumentosVencimentoAlert } from "@/components/DocumentosVencimentoAlert";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
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
    <div className="flex min-h-screen w-full flex-col">
      <AppTopNav syncOnline={syncOnline} onLogout={() => void handleLogout()} />
      <CalibracaoAlertBanner />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl animate-fade-in px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          {children}
        </div>
      </main>
      <DocumentosVencimentoAlert />
      <ThemeToggle />
    </div>
  );
}
