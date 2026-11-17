import { createHash, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { env } from "../config/env.js";
import { readPublicCatalog } from "../db/catalog.js";
import { getPool } from "../db/pool.js";

export const adminDatabaseRouter = Router();

const sameSecret = (provided: string, expected: string) => {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
};

const presentedToken = (header: string | undefined) => {
  if (!header) return "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : "";
};

adminDatabaseRouter.get("/admin/database", async (req, res) => {
  if (!env.diagnosticToken) {
    res.status(404).json({ error: "Rota não encontrada." });
    return;
  }

  if (!sameSecret(presentedToken(req.header("authorization")), env.diagnosticToken)) {
    res.status(401).json({ error: "Não autorizado." });
    return;
  }

  const pool = getPool();
  if (!pool) {
    res.status(503).json({ status: "not_configured", database: false });
    return;
  }

  try {
    res.status(200).json(await readPublicCatalog(pool));
  } catch (error) {
    console.error("Falha no diagnóstico do banco:", error instanceof Error ? error.message : "erro desconhecido");
    res.status(503).json({ status: "unavailable", database: false });
  }
});
