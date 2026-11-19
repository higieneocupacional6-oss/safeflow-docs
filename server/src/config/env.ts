import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(serverRoot, "..");
dotenv.config({ path: path.join(serverRoot, ".env") });

const read = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

const positiveInteger = (name: string, fallback: number) => {
  const raw = read(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }
  return parsed;
};

const portInteger = (name: string, fallback: number) => {
  const value = positiveInteger(name, fallback);
  if (value > 65535) throw new Error(`${name} deve ser um inteiro entre 1 e 65535.`);
  return value;
};

const sslMode = read("PGSSLMODE") ?? "disable";
if (!["disable", "require"].includes(sslMode)) {
  throw new Error("PGSSLMODE aceita apenas disable ou require.");
}

const nodeEnv = read("NODE_ENV") ?? "development";
const sameSiteRaw = (read("COOKIE_SAME_SITE") ?? "lax").toLowerCase();
if (!["lax", "strict", "none"].includes(sameSiteRaw)) {
  throw new Error("COOKIE_SAME_SITE aceita lax, strict ou none.");
}
const cookieSameSite = sameSiteRaw as "lax" | "strict" | "none";
const cookieSecure = read("COOKIE_SECURE")
  ? read("COOKIE_SECURE") === "true"
  : nodeEnv === "production" || cookieSameSite === "none";

const frontendDistRaw = read("FRONTEND_DIST") ?? path.join(repoRoot, "dist");
const frontendDist = path.isAbsolute(frontendDistRaw)
  ? frontendDistRaw
  : path.resolve(serverRoot, frontendDistRaw);

const dataDirRaw = read("DATA_DIR") ?? path.join(serverRoot, "data", "files");
const dataDir = path.isAbsolute(dataDirRaw) ? dataDirRaw : path.resolve(serverRoot, dataDirRaw);

export const env = {
  nodeEnv,
  port: portInteger("PORT", 4000),
  host: read("HOST") ?? "127.0.0.1",
  corsOrigins: (read("CORS_ORIGIN") ?? "http://localhost:3080")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: read("DATABASE_URL"),
  diagnosticToken: read("DIAGNOSTIC_TOKEN"),
  cookieSecure,
  cookieSameSite,
  sessionTtlHours: positiveInteger("SESSION_TTL_HOURS", 12),
  loginMaxFailures: positiveInteger("LOGIN_MAX_FAILURES", 5),
  loginMaxFailuresWindowMinutes: positiveInteger("LOGIN_LOCK_MINUTES", 15),
  frontendDist,
  dataDir,
  geminiApiKey: read("GEMINI_API_KEY"),
  geminiModel: read("GEMINI_MODEL") ?? "gemini-3.1-flash-lite",
  geminiFallbackModel: read("GEMINI_FALLBACK_MODEL") ?? "gemini-3.5-flash-lite",
  /** Contingência — só servidor; usados se o Gemini falhar (cota/429/indisponível). */
  groqApiKey: read("GROQ_API_KEY"),
  // llama-3.3-70b-versatile foi descontinuado na API Groq; default atual compatível com chat+json.
  groqModel: read("GROQ_MODEL") ?? "openai/gpt-oss-120b",
  openRouterApiKey: read("OPENROUTER_API_KEY"),
  openRouterModel: read("OPENROUTER_MODEL") ?? "openai/gpt-4o-mini",
  openRouterHttpReferer: read("OPENROUTER_HTTP_REFERER"),
  openRouterAppTitle: read("OPENROUTER_APP_TITLE") ?? "SegCRM",
  pg: {
    host: read("PGHOST"),
    port: read("PGPORT") ? portInteger("PGPORT", 5432) : 5432,
    user: read("PGUSER"),
    password: read("PGPASSWORD"),
    database: read("PGDATABASE"),
    sslMode,
  },
};

/** A conexão só existe quando a URL ou host, usuário e banco foram informados. */
export const databaseConfigured = () =>
  Boolean(env.databaseUrl || (env.pg.host && env.pg.user && env.pg.database));
