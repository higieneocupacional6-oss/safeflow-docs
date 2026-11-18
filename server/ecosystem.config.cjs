/**
 * PM2 — SegCRM (Express + SPA em dist/)
 *
 * Na VPS (após npm run build:vps):
 *   cd /var/www/safeflow-docs/server
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 *
 * Porta: 4000 (Nginx/Caddy faz proxy 443 → 127.0.0.1:4000).
 * Segredos ficam em server/.env (não duplicar senhas aqui).
 */
module.exports = {
  apps: [
    {
      name: "segcrm",
      cwd: __dirname,
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      time: true,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "4000",
      },
      // Carrega DATABASE_URL, CORS_ORIGIN, COOKIE_*, DATA_DIR, GEMINI_* de server/.env
      // via dotenv em src/config/env.ts — mantenha o arquivo ao lado deste config.
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};
