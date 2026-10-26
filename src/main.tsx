import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { SupabaseConfigGate } from "./components/SupabaseConfigGate";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Elemento #root não encontrado no HTML.");
}

createRoot(root).render(
  <AppErrorBoundary>
    <SupabaseConfigGate>
      <App />
    </SupabaseConfigGate>
  </AppErrorBoundary>,
);
