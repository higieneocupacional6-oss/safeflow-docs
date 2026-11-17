import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalRealtimeSync } from "@/hooks/useGlobalRealtime";

const Index = lazy(() => import("./pages/Index"));
import Login from "./pages/Login";
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresasContratos = lazy(() => import("./pages/EmpresasContratos"));
const Cadastros = lazy(() => import("./pages/Cadastros"));
const Templates = lazy(() => import("./pages/Templates"));
const Documentos = lazy(() => import("./pages/Documentos"));
const LtcatWizard = lazy(() => import("./pages/LtcatWizard"));
const PgrWizard = lazy(() => import("./pages/PgrWizard"));
const PcmsoWizard = lazy(() => import("./pages/PcmsoWizard"));
const AetWizard = lazy(() => import("./pages/AetWizard"));
const AepWizard = lazy(() => import("./pages/AepWizard"));
const AetValeNovo = lazy(() => import("./pages/AetValeNovo"));
const AetValeRegistro = lazy(() => import("./pages/AetValeRegistro"));
const AetValePlanoContrato = lazy(() => import("./pages/AetValePlanoContrato"));
const SetoresFuncoes = lazy(() => import("./pages/SetoresFuncoes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ControleDocumentos = lazy(() => import("./pages/ControleDocumentos"));
const Psicossocial = lazy(() => import("./pages/Psicossocial"));
const PsicossocialEmpresa = lazy(() => import("./pages/PsicossocialEmpresa"));
const PsicossocialAvaliacao = lazy(() => import("./pages/PsicossocialAvaliacao"));
const PsicossocialRelatorio = lazy(() => import("./pages/PsicossocialRelatorio"));
const TemplatesPsicossociais = lazy(() => import("./pages/TemplatesPsicossociais"));
const AvaliacaoPsicossocialPublica = lazy(() => import("./pages/AvaliacaoPsicossocialPublica"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const FichaTecnica = lazy(() => import("./pages/FichaTecnica"));
const FichaTecnicaContrato = lazy(() => import("./pages/FichaTecnicaContrato"));
const FormularioAep = lazy(() => import("./pages/FormularioAep"));
const FormularioAepNovo = lazy(() => import("./pages/FormularioAepNovo"));
const FormularioAepPreencher = lazy(() => import("./pages/FormularioAepPreencher"));
const AprErgo = lazy(() => import("./pages/AprErgo"));
const AprErgoNovo = lazy(() => import("./pages/AprErgoNovo"));
const AprErgoRegistro = lazy(() => import("./pages/AprErgoRegistro"));
const AprErgoPlano = lazy(() => import("./pages/AprErgoPlano"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: "always",
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});


const Protected = ({ children, admin }: { children: React.ReactNode; admin?: boolean }) => (
  <ProtectedRoute requireAdmin={admin}><AppLayout>{children}</AppLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalRealtimeSync />
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>}>
          <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/alterar-senha" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/avaliacao-psicossocial/:token" element={<AvaliacaoPsicossocialPublica />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/empresas" element={<Protected><Empresas /></Protected>} />
            <Route path="/empresas-contratos" element={<Protected><EmpresasContratos /></Protected>} />
            <Route path="/cadastros" element={<Protected><Cadastros /></Protected>} />
            <Route path="/templates" element={<Protected><Templates /></Protected>} />
            <Route path="/templates/avaliacoes-psicossociais" element={<Protected><TemplatesPsicossociais /></Protected>} />
            <Route path="/setores-funcoes" element={<Protected><SetoresFuncoes /></Protected>} />
            <Route path="/documentos" element={<Protected><Documentos /></Protected>} />
            <Route path="/documentos/apr-ergo" element={<Protected><AprErgo /></Protected>} />
            <Route path="/documentos/apr-ergo/novo" element={<Protected><AprErgoNovo /></Protected>} />
            <Route path="/documentos/apr-ergo/editar/:documentoId" element={<Protected><AprErgoNovo /></Protected>} />
            <Route path="/documentos/apr-ergo/registro/:registroId" element={<Protected><AprErgoRegistro /></Protected>} />
            <Route path="/documentos/apr-ergo/plano/:empresaId/:contratoId" element={<Protected><AprErgoPlano /></Protected>} />
            <Route path="/documentos/controle" element={<Protected><ControleDocumentos /></Protected>} />
            <Route path="/psicossocial" element={<Protected><Psicossocial /></Protected>} />
            <Route path="/ficha-tecnica" element={<Protected><FichaTecnica /></Protected>} />
            <Route path="/ficha-tecnica/:empresaId/:contratoId" element={<Protected><FichaTecnicaContrato /></Protected>} />
            <Route path="/formulario-aep" element={<Protected><FormularioAep /></Protected>} />
            <Route path="/formulario-aep/novo" element={<Protected><FormularioAepNovo /></Protected>} />
            <Route path="/formulario-aep/preencher" element={<Protected><FormularioAepPreencher /></Protected>} />
            <Route path="/psicossocial/:empresaId/:contratoId" element={<Protected><PsicossocialEmpresa /></Protected>} />
            <Route path="/psicossocial/:empresaId/:contratoId/avaliacao/:avaliacaoId" element={<Protected><PsicossocialAvaliacao /></Protected>} />
            <Route path="/psicossocial/:empresaId/:contratoId/avaliacao/:avaliacaoId/relatorio" element={<Protected><PsicossocialRelatorio /></Protected>} />

            <Route path="/documentos/ltcat/novo" element={<Protected><LtcatWizard modo="ltcat" /></Protected>} />
            <Route path="/documentos/ltcat/editar/:documentoId" element={<Protected><LtcatWizard modo="ltcat" /></Protected>} />
            <Route path="/documentos/insalubridade/novo" element={<Protected><LtcatWizard modo="insalubridade" /></Protected>} />
            <Route path="/documentos/insalubridade/editar/:documentoId" element={<Protected><LtcatWizard modo="insalubridade" /></Protected>} />
            <Route path="/documentos/periculosidade/novo" element={<Protected><LtcatWizard modo="periculosidade" /></Protected>} />
            <Route path="/documentos/periculosidade/editar/:documentoId" element={<Protected><LtcatWizard modo="periculosidade" /></Protected>} />
            <Route path="/documentos/pgr/novo" element={<Protected><PgrWizard /></Protected>} />
            <Route path="/documentos/pgr/editar/:documentoId" element={<Protected><PgrWizard /></Protected>} />
            <Route path="/documentos/pcmso/editar/:documentoId" element={<Protected><PcmsoWizard /></Protected>} />
            <Route path="/documentos/aet/novo" element={<Protected><AetWizard /></Protected>} />
            <Route path="/documentos/aet/editar/:documentoId" element={<Protected><AetWizard /></Protected>} />
            <Route path="/documentos/aet-vale" element={<Protected><AetValeNovo /></Protected>} />
            <Route path="/documentos/aet-vale/plano/:empresaId/:contratoId" element={<Protected><AetValePlanoContrato /></Protected>} />
            <Route path="/documentos/aet-vale/registro/:registroId" element={<Protected><AetValeRegistro /></Protected>} />
            <Route path="/documentos/aep/novo" element={<Protected><AepWizard /></Protected>} />
            <Route path="/documentos/aep/editar/:documentoId" element={<Protected><AepWizard /></Protected>} />
            <Route path="/usuarios" element={<Protected admin><Usuarios /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
