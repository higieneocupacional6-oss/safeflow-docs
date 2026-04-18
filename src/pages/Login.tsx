import { useState, FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Loader2, Mail, Lock, ShieldCheck, FileText, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import safedocLogo from "@/assets/safedoc-logo.png";

export default function Login() {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && user) {
    const from = (location.state as any)?.from?.pathname || "/empresas";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      const msg = err.toLowerCase().includes("invalid") ? "Email ou senha incorretos." : err;
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Bem-vindo!");
    const from = (location.state as any)?.from?.pathname || "/empresas";
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-brand">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 20% 30%, hsl(0 0% 100% / 0.3), transparent 40%), radial-gradient(circle at 80% 70%, hsl(165 100% 53% / 0.4), transparent 40%)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <img src={safedocLogo} alt="SAFEDOC" className="h-14 w-14 rounded-2xl bg-white p-2 ring-1 ring-white/30 shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SAFEDOC</h1>
            <p className="text-xs text-white/80 uppercase tracking-[0.22em]">Gestão SST</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-heading text-4xl xl:text-5xl font-bold text-white leading-tight">
            Documentação<br />de SST simples,<br />segura e profissional.
          </h2>
          <p className="text-white/85 text-lg max-w-md">
            Centralize LTCAT, PGR, riscos e funções com agilidade e conformidade regulatória.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            {[
              { icon: ShieldCheck, label: "Seguro" },
              { icon: FileText, label: "Documentos" },
              { icon: BarChart3, label: "Análises" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 text-white">
                <Icon className="h-5 w-5 mb-2" />
                <p className="text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} SAFEDOC · Todos os direitos reservados</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={safedocLogo} alt="SAFEDOC" className="h-12 w-12 rounded-xl bg-white p-1.5 ring-1 ring-border shadow-sm" />
            <div>
              <h1 className="font-heading text-xl font-bold">SAFE<span className="text-gradient-brand">DOC</span></h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Gestão SST</p>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-muted-foreground">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" autoComplete="current-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="pl-10" />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full btn-premium h-11 text-base font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Entrando...</> : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Acesso restrito · Solicite credenciais ao administrador
          </p>
        </div>
      </div>
    </div>
  );
}
