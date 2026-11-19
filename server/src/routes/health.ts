import { Router } from "express";
import { databaseConfigured, env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { resolvePublicAppInfo } from "../lib/publicAppUrl.js";

export const healthRouter = Router();

type DbStatus = "ok" | "not_configured" | "unavailable";

const checkDatabase = async (): Promise<{ database: boolean; databaseStatus: DbStatus }> => {
  if (!databaseConfigured()) {
    return { database: false, databaseStatus: "not_configured" };
  }
  const pool = getPool();
  if (!pool) {
    return { database: false, databaseStatus: "not_configured" };
  }
  try {
    await pool.query("SELECT 1");
    return { database: true, databaseStatus: "ok" };
  } catch (error) {
    console.error("PostgreSQL indisponível:", error instanceof Error ? error.message : "falha de conexão");
    return { database: false, databaseStatus: "unavailable" };
  }
};

/** Liveness: processo Express no ar. */
healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "segcrm-api",
    time: new Date().toISOString(),
  });
});

/**
 * Origem pública para links/QR (questionário psicossocial no celular).
 * Em localhost, sugere o IP LAN da máquina para o aparelho alcançar o Vite/API.
 */
healthRouter.get("/api/public-app", (req, res) => {
  res.status(200).json(resolvePublicAppInfo(req));
});

/** Readiness: API + PostgreSQL segcrm. */
healthRouter.get("/health/ready", async (_req, res) => {
  const db = await checkDatabase();
  const ready = db.database;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    service: "segcrm-api",
    api: true,
    database: db.database,
    databaseStatus: db.databaseStatus,
    host: env.host,
    port: env.port,
    time: new Date().toISOString(),
  });
});

healthRouter.get("/health/database", async (_req, res) => {
  const db = await checkDatabase();
  if (db.databaseStatus === "not_configured") {
    res.status(503).json({ status: "not_configured", database: false });
    return;
  }
  if (!db.database) {
    res.status(503).json({ status: "unavailable", database: false });
    return;
  }
  res.status(200).json({ status: "ok", database: true });
});
