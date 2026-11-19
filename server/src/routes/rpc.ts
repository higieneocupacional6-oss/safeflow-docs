import { Router } from "express";
import { setAppUserContext } from "../auth/service.js";
import { prepareRpcArg } from "../db/jsonColumns.js";
import { getPool } from "../db/pool.js";
import {
  asyncHandler,
  attachAuth,
  requireAuth,
  requirePasswordCurrent,
} from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const rpcRouter = Router();

const PUBLIC_RPC = new Set(["psico_get_public_link", "psico_submit_resposta", "portal_get_public_link"]);
const ALLOWED = new Set([
  "update_shared_record",
  "save_ltcat_documento_v2",
  "sync_ltcat_avaliacoes",
  "import_ficha_tecnica_resultados",
  "has_role",
  "psico_get_public_link",
  "psico_submit_resposta",
  "portal_get_public_link",
]);

rpcRouter.use(attachAuth);

rpcRouter.post(
  "/api/rpc/:name",
  asyncHandler(async (req, res, next) => {
    const name = req.params.name;
    if (!ALLOWED.has(name)) {
      res.status(404).json({ error: "RPC não encontrada." });
      return;
    }
    if (PUBLIC_RPC.has(name)) {
      next();
      return;
    }
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      requirePasswordCurrent(req, res, (err2) => {
        if (err2) return next(err2);
        requireCsrf(req, res, next);
      });
    });
  }),
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }

    const name = req.params.name;
    const args = (req.body ?? {}) as Record<string, unknown>;
    const keys = Object.keys(args);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await setAppUserContext(client, req.authUser?.id ?? null);

      let result;
      if (keys.length === 0) {
        result = await client.query(`SELECT public.${name}() AS result`);
      } else {
        const params: unknown[] = [];
        const named = keys.map((key) => {
          if (!/^[a-z_][a-z0-9_]*$/i.test(key)) throw new Error(`Argumento inválido: ${key}`);
          const prepared = prepareRpcArg(name, key, args[key]);
          params.push(prepared.value);
          return `${key} => $${params.length}${prepared.cast}`;
        });
        result = await client.query(
          `SELECT public.${name}(${named.join(", ")}) AS result`,
          params,
        );
      }

      await client.query("COMMIT");
      res.status(200).json({ data: result.rows[0]?.result ?? null });
    } catch (error) {
      await client.query("ROLLBACK");
      const message = error instanceof Error ? error.message : "Falha na RPC.";
      if (/function .* does not exist/i.test(message)) {
        res.status(501).json({ error: `RPC ${name} ainda não está instalada no segcrm.` });
        return;
      }
      res.status(400).json({ error: message });
    } finally {
      client.release();
    }
  }),
);
