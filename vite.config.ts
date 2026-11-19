import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Cores oficiais do SegDoc (portal SST)
const SEGDOC_PRIMARY = "#102A43"; // azul-marinho — navegação / theme_color
const SEGDOC_BACKGROUND = "#EFF5EF"; // fundo claro institucional

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
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.ico",
        "favicon.png",
        "apple-touch-icon.png",
        "segdoc-logo.png",
        "segdoc-logo-solid.png",
        "og-image.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-512x512.png",
      ],
      manifest: {
        id: "/",
        name: "SegDoc - Gestão SST",
        short_name: "SegDoc",
        description: "Portal profissional de Gestão de Segurança e Saúde do Trabalho",
        lang: "pt-BR",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "any",
        theme_color: SEGDOC_PRIMARY,
        background_color: SEGDOC_BACKGROUND,
        categories: ["business", "productivity"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        // SPA offline: /avaliacao-psicossocial/:token cai no index.html do precache
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/health(?:\/|$)/, /^\/admin(?:\/|$)/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // SW ativo também em `npm run dev` para questionário offline real
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallbackAllowlist: [
          /^\/$/,
          /^\/avaliacao-psicossocial\//,
          /^\/ferramentas-ergonomicas(?:\/|$)/,
          /^\/p\//,
          /^\/portal-clientes(?:\/|$)/,
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
