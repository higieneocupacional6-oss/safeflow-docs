const CSRF_HEADER = "X-CSRF-Token";

let csrfToken: string | null = null;

const apiBase = () => {
  const configured = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  return configured ? configured.replace(/\/+$/, "") : "";
};

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${apiBase()}/api/auth/csrf`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Não foi possível obter o token CSRF.");
  const body = await response.json() as { csrfToken?: string };
  csrfToken = body.csrfToken ?? null;
  if (!csrfToken) throw new Error("Token CSRF ausente.");
  return csrfToken;
}

export function clearApiCsrf() {
  csrfToken = null;
}

export function setApiCsrf(token: string | null) {
  csrfToken = token;
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  csrf?: boolean;
};

export async function apiRequest<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.csrf || (method !== "GET" && method !== "HEAD")) {
    headers[CSRF_HEADER] = await ensureCsrf();
  }

  const response = await fetch(`${apiBase()}${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { error: text || "Resposta inválida." };
  }

  if (!response.ok) {
    const message = json?.error || `HTTP ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status, body: json });
  }

  if (json?.csrfToken) setApiCsrf(json.csrfToken);
  return json as T;
}

export type ApiHealth = {
  status: string;
  api?: boolean;
  database?: boolean;
  databaseStatus?: string;
  service?: string;
};

/** Verifica API e, quando disponível, o readiness com PostgreSQL. */
export async function checkApiHealth(): Promise<ApiHealth> {
  const base = apiBase();
  let response: Response;
  try {
    response = await fetch(`${base}/health/ready`, { credentials: "include" });
  } catch {
    // Fallback: liveness simples (proxy antigo / API sem /ready).
    try {
      response = await fetch(`${base}/health`, { credentials: "include" });
    } catch {
      throw new Error(
        "Não foi possível conectar à API em :4000. Inicie o backend com npm run dev:api (ou npm run dev:full).",
      );
    }
  }

  let body: ApiHealth = { status: "unknown" };
  try {
    body = (await response.json()) as ApiHealth;
  } catch {
    /* ignore */
  }

  if (!response.ok) {
    if (body.databaseStatus === "not_configured") {
      throw new Error("API no ar, mas o PostgreSQL segcrm não está configurado no server/.env.");
    }
    if (body.database === false || body.databaseStatus === "unavailable") {
      throw new Error("API no ar, mas o PostgreSQL segcrm está inacessível. Verifique DATABASE_URL/PG*.");
    }
    throw new Error(body.status ? `API respondeu ${response.status} (${body.status}).` : "API indisponível.");
  }

  return { api: true, database: body.database !== false, ...body };
}
