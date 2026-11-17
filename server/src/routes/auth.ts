import { Router } from "express";
import {
  clearCsrfCookie,
  clearSessionCookie,
  setCsrfCookie,
  setSessionCookie,
  SESSION_COOKIE,
} from "../auth/cookies.js";
import {
  changePassword,
  createSession,
  login,
  publicUser,
  revokeSession,
} from "../auth/service.js";
import { createOpaqueToken } from "../auth/tokens.js";
import {
  asyncHandler,
  attachAuth,
  clientIp,
  requireAuth,
  requireRole,
} from "../middleware/auth.js";
import { issueCsrfToken, requireCsrf } from "../middleware/csrf.js";

export const authRouter = Router();

authRouter.use(attachAuth);

authRouter.get("/api/auth/csrf", (req, res) => {
  const token = issueCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

authRouter.post(
  "/api/auth/login",
  requireCsrf,
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ error: "Informe e-mail e senha." });
      return;
    }

    const result = await login(email, password, {
      ip: clientIp(req),
      userAgent: req.header("user-agent") ?? undefined,
    });

    if (!result.ok) {
      const messages = {
        invalid: "Credenciais inválidas.",
        inactive: "Usuário inativo. Contate o administrador.",
        locked: "Muitas tentativas. Aguarde alguns minutos.",
        password_unset: "Senha ainda não definida. Use o procedimento de senha inicial.",
      } as const;
      const status = result.code === "locked" ? 429 : result.code === "inactive" ? 403 : 401;
      res.status(status).json({ error: messages[result.code] });
      return;
    }

    setSessionCookie(res, result.token);
    const csrf = createOpaqueToken(24);
    setCsrfCookie(res, csrf);
    res.status(200).json({ user: publicUser(result.user), csrfToken: csrf });
  }),
);

authRouter.post(
  "/api/auth/logout",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (req.authUser) await revokeSession(req.authUser.sessionId);
    clearSessionCookie(res);
    clearCsrfCookie(res);
    res.status(200).json({ ok: true });
  }),
);

authRouter.get(
  "/api/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(200).json({ user: publicUser(req.authUser!) });
  }),
);

authRouter.post(
  "/api/auth/change-password",
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const nextPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (!currentPassword || !nextPassword) {
      res.status(400).json({ error: "Informe a senha atual e a nova senha." });
      return;
    }

    const result = await changePassword(req.authUser!.id, currentPassword, nextPassword);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const session = await createSession(req.authUser!.id, {
      ip: clientIp(req),
      userAgent: req.header("user-agent") ?? undefined,
    });
    setSessionCookie(res, session.token);
    const csrf = createOpaqueToken(24);
    setCsrfCookie(res, csrf);
    res.status(200).json({
      ok: true,
      user: publicUser({ ...req.authUser!, mustChangePassword: false, sessionId: session.sessionId }),
      csrfToken: csrf,
    });
  }),
);

/** Rota só para validar o middleware de papel nas rotas futuras. */
authRouter.get("/api/auth/admin-check", requireAuth, requireRole("admin"), (_req, res) => {
  res.status(200).json({ ok: true });
});

export const sessionCookieName = SESSION_COOKIE;
