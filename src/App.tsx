import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Empresas from "./pages/Empresas";
import Cadastros from "./pages/Cadastros";
import Templates from "./pages/Templates";
import Documentos from "./pages/Documentos";
import LtcatWizard from "./pages/LtcatWizard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<AppLayout><Routes><Route path="*" element={null} /></Routes></AppLayout>}>
          </Route>
          <Route path="/empresas" element={<AppLayout><Empresas /></AppLayout>} />
          <Route path="/cadastros" element={<AppLayout><Cadastros /></AppLayout>} />
          <Route path="/templates" element={<AppLayout><Templates /></AppLayout>} />
          <Route path="/documentos" element={<AppLayout><Documentos /></AppLayout>} />
          <Route path="/documentos/ltcat/novo" element={<AppLayout><LtcatWizard /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
