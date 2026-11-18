import { Router } from "express";
import { getPool } from "../db/pool.js";
import { runTableQuery, type QueryRequest } from "../db/queryBuilder.js";
import { asyncHandler, requireAuth, requirePasswordCurrent } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const dataRouter = Router();

dataRouter.post(
  "/api/data/query",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const body = req.body as QueryRequest;
    try {
      const result = await runTableQuery(pool, body, req.authUser!.id);
      res.status(200).json(result);
    } catch (error) {
      const status = typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 400;
      const message = error instanceof Error ? error.message : "Falha na consulta.";
      res.status(status).json({ error: message });
    }
  }),
);
