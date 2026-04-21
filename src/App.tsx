import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Empresas from "./pages/Empresas";
import Cadastros from "./pages/Cadastros";
import Templates from "./pages/Templates";
import Documentos from "./pages/Documentos";
import LtcatWizard from "./pages/LtcatWizard";
import SetoresFuncoes from "./pages/SetoresFuncoes";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/empresas" element={<Protected><Empresas /></Protected>} />
            <Route path="/cadastros" element={<Protected><Cadastros /></Protected>} />
            <Route path="/templates" element={<Protected><Templates /></Protected>} />
            <Route path="/setores-funcoes" element={<Protected><SetoresFuncoes /></Protected>} />
            <Route path="/documentos" element={<Protected><Documentos /></Protected>} />
            <Route path="/documentos/ltcat/novo" element={<Protected><LtcatWizard modo="ltcat" /></Protected>} />
            <Route path="/documentos/ltcat/editar/:documentoId" element={<Protected><LtcatWizard modo="ltcat" /></Protected>} />
            <Route path="/documentos/insalubridade/novo" element={<Protected><LtcatWizard modo="insalubridade" /></Protected>} />
            <Route path="/documentos/insalubridade/editar/:documentoId" element={<Protected><LtcatWizard modo="insalubridade" /></Protected>} />
            <Route path="/documentos/periculosidade/novo" element={<Protected><LtcatWizard modo="periculosidade" /></Protected>} />
            <Route path="/documentos/periculosidade/editar/:documentoId" element={<Protected><LtcatWizard modo="periculosidade" /></Protected>} />
            <Route path="/usuarios" element={<Protected admin><Usuarios /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
