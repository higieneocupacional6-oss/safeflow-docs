import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "segcrm_session";
export const CSRF_COOKIE = "segcrm_csrf";

const baseCookie = (): CookieOptions => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: "/",
  maxAge: env.sessionTtlHours * 60 * 60 * 1000,
});

export const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, baseCookie());
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
  });
};

export const setCsrfCookie = (res: Response, token: string) => {
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
    maxAge: env.sessionTtlHours * 60 * 60 * 1000,
  });
};

export const clearCsrfCookie = (res: Response) => {
  res.clearCookie(CSRF_COOKIE, {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
  });
};
