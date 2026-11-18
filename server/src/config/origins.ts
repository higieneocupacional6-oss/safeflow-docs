import { env } from "./env.js";

const LOOPBACK_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** IPv4 privadas comuns em `vite --host` (ex.: http://172.16.x.x:3082). */
const PRIVATE_LAN_ORIGIN =
  /^https?:\/\/((10|192\.168)\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

/**
 * Origens aceitas para CORS e CSRF.
 * Produção: só CORS_ORIGIN.
 * Desenvolvimento: também loopback e LAN privada em qualquer porta (Vite troca a porta se 3080 estiver ocupada).
 */
export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  if (env.corsOrigins.includes(origin)) return true;
  if (env.nodeEnv === "production") return false;
  return LOOPBACK_ORIGIN.test(origin) || PRIVATE_LAN_ORIGIN.test(origin);
};

export const isAllowedReferer = (referer: string | undefined): boolean => {
  if (!referer) return false;
  try {
    const origin = new URL(referer).origin;
    return isAllowedOrigin(origin);
  } catch {
    return env.corsOrigins.some((allowed) => referer.startsWith(allowed));
  }
};
