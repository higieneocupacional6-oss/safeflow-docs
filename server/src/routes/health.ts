import { Router } from "express";
import { databaseConfigured } from "../config/env.js";
import { getPool } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/health/database", async (_req, res) => {
  if (!databaseConfigured()) {
    res.status(503).json({ status: "not_configured", database: false });
    return;
  }

  const pool = getPool();
  if (!pool) {
    res.status(503).json({ status: "not_configured", database: false });
    return;
  }

  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: true });
  } catch (error) {
    console.error("PostgreSQL indisponível:", error instanceof Error ? error.message : "falha de conexão");
    res.status(503).json({ status: "unavailable", database: false });
  }
});
