import { Router } from "express";
import { hashPassword, validatePasswordPolicy } from "../auth/password.js";
import { getPool } from "../db/pool.js";
import { asyncHandler, requireAuth, requirePasswordCurrent, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { randomUUID } from "node:crypto";

export const usersRouter = Router();

usersRouter.post(
  "/api/users/manage",
  requireAuth,
  requirePasswordCurrent,
  requireRole("admin"),
  requireCsrf,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }

    const action = req.body?.action as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (action === "create") {
        const email = String(req.body?.email ?? "").trim().toLowerCase();
        const nome = String(req.body?.nome ?? "").trim();
        const password = String(req.body?.password ?? "");
        const role = req.body?.role === "admin" ? "admin" : "usuario";
        const policy = validatePasswordPolicy(password);
        if (!email || !nome) throw new Error("Nome e e-mail obrigatórios.");
        if (policy) throw new Error(policy);
        const id = randomUUID();
        const passwordHash = await hashPassword(password);
        await client.query(
          `INSERT INTO app.users (id, email, password_hash, must_change_password)
           VALUES ($1, $2, $3, true)`,
          [id, email, passwordHash],
        );
        await client.query(
          `INSERT INTO public.profiles (user_id, nome, email, ativo)
           VALUES ($1, $2, $3, true)`,
          [id, nome, email],
        );
        await client.query(
          `INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2::public.app_role)`,
          [id, role],
        );
        await client.query("COMMIT");
        res.status(200).json({ data: { user_id: id } });
        return;
      }

      if (action === "update") {
        const userId = String(req.body?.user_id ?? "");
        const nome = String(req.body?.nome ?? "").trim();
        const role = req.body?.role === "admin" ? "admin" : "usuario";
        const ativo = Boolean(req.body?.ativo);
        if (!userId || !nome) throw new Error("Dados incompletos.");
        await client.query(
          `UPDATE public.profiles SET nome = $2, ativo = $3, updated_at = now() WHERE user_id = $1`,
          [userId, nome, ativo],
        );
        await client.query(`DELETE FROM public.user_roles WHERE user_id = $1`, [userId]);
        await client.query(
          `INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2::public.app_role)`,
          [userId, role],
        );
        await client.query("COMMIT");
        res.status(200).json({ ok: true });
        return;
      }

      if (action === "reset_password") {
        const userId = String(req.body?.user_id ?? "");
        const password = String(req.body?.password ?? "");
        const policy = validatePasswordPolicy(password);
        if (!userId) throw new Error("user_id obrigatório.");
        if (policy) throw new Error(policy);
        const passwordHash = await hashPassword(password);
        await client.query(
          `UPDATE app.users
           SET password_hash = $2, must_change_password = true, updated_at = now()
           WHERE id = $1`,
          [userId, passwordHash],
        );
        await client.query(
          `UPDATE app.sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
          [userId],
        );
        await client.query("COMMIT");
        res.status(200).json({ ok: true });
        return;
      }

      throw new Error("Ação inválida.");
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: error instanceof Error ? error.message : "Falha ao gerenciar usuário." });
    } finally {
      client.release();
    }
  }),
);
