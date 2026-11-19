import { useState, FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Loader2, Mail, Lock, ShieldCheck, FileText, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export default function Login() {
  const { signIn, user, loading: authLoading, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && user) {
    if (mustChangePassword) return <Navigate to="/alterar-senha" replace />;
    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
    const { error: err } = await signIn(email.trim(), password);
    if (err) {
      const msg = err.toLowerCase().includes("invalid") ? "Email ou senha incorretos." : err;
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Bem-vindo!");
    navigate("/", { replace: true });
    } catch {
      const msg = "Não foi possível verificar sua sessão. Confira a conexão e tente novamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-nav p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 25%, hsl(0 0% 100% / 0.14), transparent 42%), radial-gradient(circle at 85% 75%, hsl(152 30% 45% / 0.22), transparent 45%)",
          }}
        />
        <div className="relative z-10">
          <BrandLogo priority tone="light" size="xl" className="gap-3" />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-heading text-4xl font-bold leading-tight text-white xl:text-5xl">
            Portal profissional<br />para Segurança<br />e Saúde do Trabalho.
          </h2>
          <p className="max-w-md text-lg text-white/80">
            Organize cadastros, documentos e avaliações com clareza, confiança e conformidade.
          </p>
          <div className="grid max-w-md grid-cols-3 gap-4 pt-6">
            {[
              { icon: ShieldCheck, label: "Seguro" },
              { icon: FileText, label: "Documentos" },
              { icon: BarChart3, label: "Análises" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-sm">
                <Icon className="mb-2 h-5 w-5" />
                <p className="text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/55">© {new Date().getFullYear()} SegDoc · Todos os direitos reservados</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo priority tone="dark" size="lg" className="gap-3" />
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

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Acesso restrito · Solicite credenciais ao administrador
          </p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}
