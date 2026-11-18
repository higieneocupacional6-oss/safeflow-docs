import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ApiConfigGate } from "./components/ApiConfigGate";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Elemento #root não encontrado no HTML.");
}

createRoot(root).render(
  <AppErrorBoundary>
    <ApiConfigGate>
      <App />
    </ApiConfigGate>
  </AppErrorBoundary>,
);
