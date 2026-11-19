/**
 * Base pública do app para links/QR do questionário.
 * Celulares não acessam localhost do PC — por isso, em loopback,
 * resolvemos o IP LAN (ou PUBLIC_APP_URL / VITE_PUBLIC_APP_URL).
 */

const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

let cachedBaseUrl: string | null = null;
let resolving: Promise<string> | null = null;

function envConfiguredBase(): string {
  return String(import.meta.env.VITE_PUBLIC_APP_URL || "")
    .trim()
    .replace(/\/$/, "");
}

function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK.test(hostname);
}

/** Origem síncrona (pode ser localhost — preferir resolvePublicAppBaseUrl para QR/link). */
export function publicAppBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;
  const configured = envConfiguredBase();
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

/**
 * Resolve origem acessível por celular (LAN ou URL pública).
 * Cacheia o resultado para QR, copiar link e templates.
 */
export async function resolvePublicAppBaseUrl(force = false): Promise<string> {
  if (!force && cachedBaseUrl) return cachedBaseUrl;
  if (!force && resolving) return resolving;

  resolving = (async () => {
    const configured = envConfiguredBase();
    if (configured) {
      cachedBaseUrl = configured;
      return configured;
    }

    const current =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";

    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";

    // Já está em IP/domínio acessível (não localhost) — usar como está.
    if (current && hostname && !isLoopbackHost(hostname)) {
      cachedBaseUrl = current;
      return current;
    }

    try {
      const response = await fetch("/api/public-app", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const body = (await response.json()) as {
          publicAppUrl?: string | null;
          suggestedOrigin?: string;
          lanOrigins?: string[];
        };
        let suggested =
          (body.publicAppUrl || "").replace(/\/$/, "") ||
          (body.suggestedOrigin || "").replace(/\/$/, "") ||
          (body.lanOrigins?.[0] || "").replace(/\/$/, "");
        // LAN sem TLS: https://192.168… / https://172… quebra no navegador.
        try {
          const u = new URL(suggested);
          if (
            /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(u.hostname)
            && u.protocol === "https:"
          ) {
            u.protocol = "http:";
            suggested = u.origin;
          }
        } catch {
          /* ignore */
        }
        if (suggested) {
          cachedBaseUrl = suggested;
          return suggested;
        }
      }
    } catch {
      /* offline / API indisponível — cai no fallback */
    }

    cachedBaseUrl = current;
    return current;
  })();

  try {
    return await resolving;
  } finally {
    resolving = null;
  }
}

/** URL pública do questionário (síncrona; use resolvePublicPsicoUrl no QR). */
export function publicPsicoUrl(token: string, baseUrl = publicAppBaseUrl()) {
  const base = baseUrl.replace(/\/$/, "");
  const path = `/avaliacao-psicossocial/${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

/** URL do questionário com origem resolvida para celular. */
export async function resolvePublicPsicoUrl(token: string): Promise<string> {
  const base = await resolvePublicAppBaseUrl();
  return publicPsicoUrl(token, base);
}

/** Indica se a origem atual é localhost (QR gerado assim falharia no celular). */
export function isLoopbackPublicOrigin(urlOrOrigin?: string): boolean {
  try {
    const host = new URL(urlOrOrigin || publicAppBaseUrl() || "http://localhost").hostname;
    return isLoopbackHost(host);
  } catch {
    return true;
  }
}

/** Classificação global (uma palavra) a partir das médias por bloco das respostas. */
export function statusGeralPsicossocial(
  respostas: { blocos?: Record<string, { media: number; classificacao: string }> | null }[],
): string {
  if (!respostas.length) return "Pendente";
  const medias: number[] = [];
  for (const r of respostas) {
    const b = r.blocos || {};
    for (const v of Object.values(b)) if (typeof v?.media === "number") medias.push(v.media);
  }
  if (!medias.length) return "Pendente";
  const m = medias.reduce((a, c) => a + c, 0) / medias.length;
  if (m <= 25) return "Baixo";
  if (m <= 50) return "Moderado";
  if (m <= 75) return "Alto";
  return "Crítico";
}

export function corClassificacao(c: string) {
  switch (c) {
    case "Baixo": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Moderado": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Alto": return "bg-orange-100 text-orange-800 border-orange-300";
    case "Crítico": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}
