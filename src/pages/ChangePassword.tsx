import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ChangePassword() {
  const { user, loading } = useAuth();
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
    const { error } = await supabase.auth.updateUser({
      password,
      current_password: currentPassword,
      data: { ...(user?.user_metadata || {}), must_change_password: false },
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com segurança.");
    navigate("/empresas", { replace: true });
  };

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-background">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground"><KeyRound className="h-5 w-5" /></div>
          <div><h1 className="font-heading text-xl font-bold">Defina sua nova senha</h1><p className="text-sm text-muted-foreground">A senha inicial precisa ser substituída no primeiro acesso.</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="current-password">Senha atual</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
          <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Alterar senha</Button>
        </form>
      </section>
    </main>
  );
}
