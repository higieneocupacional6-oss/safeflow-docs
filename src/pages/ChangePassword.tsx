import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { apiRequest, setApiCsrf } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AuthUser } from "@/lib/db/client";
import { toast } from "sonner";

export default function ChangePassword() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  if (!loading && !user) return <Navigate to="/login" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return toast.error("A nova senha deve ter pelo menos 8 caracteres.");
    if (password !== confirm) return toast.error("As novas senhas não coincidem.");
    setSaving(true);
    try {
      const result = await apiRequest<{ user: AuthUser; csrfToken?: string }>("/api/auth/change-password", {
        method: "POST",
        csrf: true,
        body: { currentPassword, newPassword: password },
      });
      if (result.csrfToken) setApiCsrf(result.csrfToken);
      toast.success("Senha alterada com segurança.");
      // Recarrega identidade com mustChangePassword=false
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="portal-surface w-full max-w-md p-6 sm:p-7">
        <div className="mb-6 space-y-4">
          <BrandLogo tone="dark" markClassName="h-11 w-11" />
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Defina sua nova senha</h1>
            <p className="text-sm text-muted-foreground">A senha inicial precisa ser substituída no primeiro acesso.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Alterar senha
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void signOut()}>
            Sair
          </Button>
        </form>
      </section>
      <ThemeToggle />
    </main>
  );
}
