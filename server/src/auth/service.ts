import type { PoolClient } from "pg";
import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "./password.js";
import { createOpaqueToken, hashToken } from "./tokens.js";
import type { AppRole, AuthUser } from "./types.js";

type DbUser = {
  id: string;
  email: string;
  password_hash: string | null;
  must_change_password: boolean;
  nome: string | null;
  ativo: boolean | null;
  role: AppRole | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const requirePool = () => {
  const pool = getPool();
  if (!pool) throw new Error("Banco não configurado.");
  return pool;
};

const mapUser = (row: DbUser, sessionId: string): AuthUser => ({
  id: row.id,
  email: row.email,
  nome: row.nome?.trim() || row.email,
  ativo: row.ativo !== false,
  role: row.role === "admin" ? "admin" : "usuario",
  mustChangePassword: row.must_change_password,
  sessionId,
});

const loadUserByEmail = async (email: string) => {
  const result = await requirePool().query<DbUser>(
    `SELECT u.id, u.email, u.password_hash, u.must_change_password,
            p.nome, p.ativo, r.role::text AS role
     FROM app.users u
     LEFT JOIN public.profiles p ON p.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT ur.role
       FROM public.user_roles ur
       WHERE ur.user_id = u.id
       ORDER BY CASE WHEN ur.role = 'admin' THEN 0 ELSE 1 END
       LIMIT 1
     ) r ON true
     WHERE u.email = $1
     LIMIT 1`,
    [normalizeEmail(email)],
  );
  return result.rows[0] ?? null;
};

const loadUserById = async (userId: string) => {
  const result = await requirePool().query<DbUser>(
    `SELECT u.id, u.email, u.password_hash, u.must_change_password,
            p.nome, p.ativo, r.role::text AS role
     FROM app.users u
     LEFT JOIN public.profiles p ON p.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT ur.role
       FROM public.user_roles ur
       WHERE ur.user_id = u.id
       ORDER BY CASE WHEN ur.role = 'admin' THEN 0 ELSE 1 END
       LIMIT 1
     ) r ON true
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
};

const recordAttempt = async (email: string, ip: string | undefined, succeeded: boolean) => {
  await requirePool().query(
    `INSERT INTO app.login_attempts (email_normalized, ip, succeeded)
     VALUES ($1, $2::inet, $3)`,
    [normalizeEmail(email), ip ?? null, succeeded],
  );
};

export const isLoginBlocked = async (email: string, ip: string | undefined) => {
  const result = await requirePool().query<{ failures: number }>(
    `SELECT count(*)::int AS failures
     FROM app.login_attempts
     WHERE succeeded = false
       AND created_at > now() - ($1 || ' minutes')::interval
       AND (
         email_normalized = $2
         OR ($3::inet IS NOT NULL AND ip = $3::inet)
       )`,
    [String(env.loginMaxFailuresWindowMinutes), normalizeEmail(email), ip ?? null],
  );
  return result.rows[0].failures >= env.loginMaxFailures;
};

export const publicUser = (user: AuthUser) => ({
  id: user.id,
  email: user.email,
  nome: user.nome,
  ativo: user.ativo,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
});

export const createSession = async (
  userId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const token = createOpaqueToken(32);
  const tokenHash = hashToken(token);
  const result = await requirePool().query<{ id: string }>(
    `INSERT INTO app.sessions (user_id, token_hash, expires_at, user_agent, ip)
     VALUES ($1, $2, now() + ($3 || ' hours')::interval, $4, $5::inet)
     RETURNING id`,
    [userId, tokenHash, String(env.sessionTtlHours), meta.userAgent ?? null, meta.ip ?? null],
  );
  return { token, sessionId: result.rows[0].id };
};

export const revokeSession = async (sessionId: string) => {
  await requirePool().query(
    `UPDATE app.sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
};

export const revokeAllSessions = async (userId: string) => {
  await requirePool().query(
    `UPDATE app.sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
};

export const resolveSession = async (rawToken: string | undefined): Promise<AuthUser | null> => {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const result = await requirePool().query<DbUser & { session_id: string }>(
    `SELECT s.id AS session_id, u.id, u.email, u.password_hash, u.must_change_password,
            p.nome, p.ativo, r.role::text AS role
     FROM app.sessions s
     JOIN app.users u ON u.id = s.user_id
     LEFT JOIN public.profiles p ON p.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT ur.role
       FROM public.user_roles ur
       WHERE ur.user_id = u.id
       ORDER BY CASE WHEN ur.role = 'admin' THEN 0 ELSE 1 END
       LIMIT 1
     ) r ON true
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
     LIMIT 1`,
    [tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (row.ativo === false) return null;

  await requirePool().query(`UPDATE app.sessions SET last_seen_at = now() WHERE id = $1`, [row.session_id]);
  return mapUser(row, row.session_id);
};

export type LoginResult =
  | { ok: true; user: AuthUser; token: string }
  | { ok: false; code: "invalid" | "inactive" | "locked" | "password_unset" };

export const login = async (
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string },
): Promise<LoginResult> => {
  if (await isLoginBlocked(email, meta.ip)) {
    return { ok: false, code: "locked" };
  }

  const user = await loadUserByEmail(email);
  if (!user) {
    await recordAttempt(email, meta.ip, false);
    return { ok: false, code: "invalid" };
  }
  if (user.ativo === false) {
    await recordAttempt(email, meta.ip, false);
    return { ok: false, code: "inactive" };
  }
  if (!user.password_hash) {
    await recordAttempt(email, meta.ip, false);
    return { ok: false, code: "password_unset" };
  }

  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) {
    await recordAttempt(email, meta.ip, false);
    return { ok: false, code: "invalid" };
  }

  await recordAttempt(email, meta.ip, true);
  const session = await createSession(user.id, meta);
  return { ok: true, user: mapUser(user, session.sessionId), token: session.token };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  nextPassword: string,
) => {
  const policyError = validatePasswordPolicy(nextPassword);
  if (policyError) return { ok: false as const, error: policyError };

  const user = await loadUserById(userId);
  if (!user?.password_hash) return { ok: false as const, error: "Senha atual inválida." };

  const valid = await verifyPassword(user.password_hash, currentPassword);
  if (!valid) return { ok: false as const, error: "Senha atual inválida." };

  const nextHash = await hashPassword(nextPassword);
  await requirePool().query(
    `UPDATE app.users
     SET password_hash = $2, must_change_password = false, updated_at = now()
     WHERE id = $1`,
    [userId, nextHash],
  );
  await revokeAllSessions(userId);
  return { ok: true as const };
};

export const setInitialPassword = async (email: string, password: string, client?: PoolClient) => {
  const policyError = validatePasswordPolicy(password);
  if (policyError) throw new Error(policyError);

  const runner = client ?? requirePool();
  const hash = await hashPassword(password);
  const result = await runner.query(
    `UPDATE app.users
     SET password_hash = $2, must_change_password = true, updated_at = now()
     WHERE email = $1
     RETURNING id, email`,
    [normalizeEmail(email), hash],
  );
  if (!result.rowCount) throw new Error("Usuário não encontrado.");
  await runner.query(
    `UPDATE app.sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [result.rows[0].id],
  );
  return result.rows[0] as { id: string; email: string };
};

export const setAppUserContext = async (client: PoolClient, userId: string | null) => {
  await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId ?? ""]);
};
