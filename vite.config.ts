import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3080,
    // Se 3080 estiver ocupada, o Vite sobe em outra porta; o backend já aceita
    // localhost/LAN em desenvolvimento (server/src/config/origins.ts).
    strictPort: false,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": { target: "http://127.0.0.1:4000", changeOrigin: false },
      "/health": { target: "http://127.0.0.1:4000", changeOrigin: false },
      "/admin": { target: "http://127.0.0.1:4000", changeOrigin: false },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
