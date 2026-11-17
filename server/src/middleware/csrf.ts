import type { RequestHandler } from "express";
import { CSRF_COOKIE, setCsrfCookie } from "../auth/cookies.js";
import { createOpaqueToken, safeEqual } from "../auth/tokens.js";
import { env } from "../config/env.js";

const mutating = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const originAllowed = (origin: string | undefined) => {
  if (!origin) return false;
  return env.corsOrigins.includes(origin);
};

export const issueCsrfToken = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => {
  const existing = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (existing) return existing;
  const token = createOpaqueToken(24);
  setCsrfCookie(res, token);
  return token;
};

/** Exige Origin/Referer conhecido e o cabeçalho X-CSRF-Token igual ao cookie. */
export const requireCsrf: RequestHandler = (req, res, next) => {
  if (!mutating.has(req.method)) {
    next();
    return;
  }

  const origin = req.header("origin");
  const referer = req.header("referer");
  const originOk = originAllowed(origin);
  const refererOk = Boolean(referer && env.corsOrigins.some((allowed) => referer.startsWith(allowed)));
  if (!originOk && !refererOk) {
    res.status(403).json({ error: "Origem não permitida." });
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.header("x-csrf-token") ?? "";
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    res.status(403).json({ error: "Token CSRF inválido." });
    return;
  }

  next();
};
