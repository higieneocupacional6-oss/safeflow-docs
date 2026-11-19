import os from "node:os";
import type { Request } from "express";
import { env } from "../config/env.js";

const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/i;
const PRIVATE_LAN =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/i;

/** IPv4 privadas da máquina (Wi‑Fi/Ethernet) — acessíveis por celular na mesma rede. */
export function listLanIpv4(): string[] {
  const out: string[] = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== "IPv4" && (entry.family as unknown) !== 4) continue;
      if (entry.internal) continue;
      out.push(entry.address);
    }
  }
  return out;
}

/** Dev/LAN sem certificado: nunca sugerir https:// em IP privado (causa ERR_SSL / resposta inválida). */
export function forceHttpForPrivateLan(url: string): string {
  try {
    const u = new URL(url);
    if (PRIVATE_LAN.test(u.hostname) && u.protocol === "https:") {
      u.protocol = "http:";
      return u.origin;
    }
    return u.origin;
  } catch {
    return url.replace(/\/$/, "");
  }
}

function originFromHeader(req: Request): URL | null {
  const rawOrigin = req.get("origin");
  if (rawOrigin) {
    try {
      return new URL(rawOrigin);
    } catch {
      /* ignore */
    }
  }
  const referer = req.get("referer");
  if (referer) {
    try {
      return new URL(referer);
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Origem que celular/tablet devem usar para abrir links/QR.
 * Preferência: PUBLIC_APP_URL → CORS_ORIGIN público → LAN com a porta do frontend atual.
 */
export function resolvePublicAppInfo(req: Request) {
  const configured =
    (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "") ||
    env.corsOrigins.find((o) => !/localhost|127\.0\.0\.1|\[::1\]/i.test(o))?.replace(/\/$/, "") ||
    "";

  const requestOrigin = originFromHeader(req);
  // IPs LAN do Vite/API local não têm TLS — sempre http: nas origens construídas.
  const port =
    requestOrigin?.port ||
    (requestOrigin?.protocol === "https:" && !PRIVATE_LAN.test(requestOrigin.hostname || "")
      ? "443"
      : requestOrigin
        ? requestOrigin.port || (requestOrigin.protocol === "https:" ? "443" : "80")
        : "3080");
  const frontendPort =
    port === "80" || port === "443" ? "" : `:${port || "3080"}`;

  const lanIps = listLanIpv4();
  const lanOrigins = lanIps.map((ip) => `http://${ip}${frontendPort || ":3080"}`);

  const hostIsLoopback = !requestOrigin || LOOPBACK.test(requestOrigin.hostname);
  const currentOrigin = requestOrigin
    ? forceHttpForPrivateLan(requestOrigin.origin)
    : "";

  let suggestedOrigin = configured ? forceHttpForPrivateLan(configured) : "";
  if (!suggestedOrigin) {
    if (!hostIsLoopback && currentOrigin) {
      suggestedOrigin = currentOrigin;
    } else if (lanOrigins[0]) {
      suggestedOrigin = lanOrigins[0];
    } else {
      suggestedOrigin = currentOrigin || "http://localhost:3080";
    }
  }

  return {
    publicAppUrl: configured ? forceHttpForPrivateLan(configured) : null,
    suggestedOrigin,
    currentOrigin: currentOrigin || null,
    lanOrigins,
    loopback: hostIsLoopback,
  };
}
