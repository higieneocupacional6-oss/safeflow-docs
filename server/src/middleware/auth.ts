import type { NextFunction, Request, RequestHandler, Response } from "express";
import { SESSION_COOKIE } from "../auth/cookies.js";
import { resolveSession } from "../auth/service.js";
import type { AppRole } from "../auth/types.js";

export const attachAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    req.authUser = (await resolveSession(token)) ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Autenticação obrigatória." });
    return;
  }
  if (!req.authUser.ativo) {
    res.status(403).json({ error: "Usuário inativo." });
    return;
  }
  next();
};

export const requireRole = (...roles: AppRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.authUser) {
      res.status(401).json({ error: "Autenticação obrigatória." });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: "Permissão insuficiente." });
      return;
    }
    next();
  };
};

export const requirePasswordCurrent: RequestHandler = (req, res, next) => {
  if (req.authUser?.mustChangePassword) {
    res.status(403).json({ error: "É necessário alterar a senha inicial." });
    return;
  }
  next();
};

export const clientIp = (req: Request) => {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.socket.remoteAddress?.replace(/^::ffff:/, "");
};

export const rejectIf = (
  res: Response,
  condition: boolean,
  status: number,
  error: string,
) => {
  if (!condition) return false;
  res.status(status).json({ error });
  return true;
};

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
