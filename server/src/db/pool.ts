import pg from "pg";
import { databaseConfigured, env } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

const ssl = () => (env.pg.sslMode === "require" ? { rejectUnauthorized: true } : undefined);

/** Cria o pool só no servidor. A senha permanece na variável de ambiente. */
export const getPool = () => {
  if (!databaseConfigured()) return null;
  if (pool) return pool;

  pool = env.databaseUrl
    ? new Pool({
        connectionString: env.databaseUrl,
        ssl: ssl(),
        max: 10,
        connectionTimeoutMillis: 5000,
      })
    : new Pool({
        host: env.pg.host,
        port: env.pg.port,
        user: env.pg.user,
        password: env.pg.password,
        database: env.pg.database,
        ssl: ssl(),
        max: 10,
        connectionTimeoutMillis: 5000,
      });

  pool.on("error", (error) => {
    console.error("Falha no pool PostgreSQL:", error.message);
  });

  return pool;
};

export const closePool = async () => {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
};
