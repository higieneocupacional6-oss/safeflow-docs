import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closePool } from "./db/pool.js";

const app = createApp();
const server = app.listen(env.port, env.host, () => {
  console.log(`API disponível em http://${env.host}:${env.port}`);
});

let closing = false;

const shutdown = (signal: string) => {
  if (closing) return;
  closing = true;
  console.log(`Encerrando a API (${signal}).`);
  server.close(async () => {
    try {
      await closePool();
    } catch (error) {
      console.error("Falha ao encerrar o PostgreSQL:", error instanceof Error ? error.message : "erro desconhecido");
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
