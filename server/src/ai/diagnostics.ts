/**
 * Diagnóstico real das IAs (Gemini / Groq / OpenRouter).
 * Não altera modelos de produção nem gera documentos de negócio.
 */
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { idModeloGemini, textoRespostaGemini, urlGeracaoGemini } from "./gemini.js";
import { gerarComContingencia } from "./failover.js";

/** Ping de diagnóstico: 1 tentativa, payload mínimo, sem fila de fallback/retry de produção. */
const PING_TIMEOUT_MS = 15_000;

export type AiProviderId = "gemini" | "groq" | "openrouter";

export type DiagnosticErrorCode =
  | "ok"
  | "missing_key"
  | "invalid_key"
  | "forbidden"
  | "model_not_found"
  | "rate_limit"
  | "timeout"
  | "provider_unavailable"
  | "invalid_request"
  | "unknown";

export type DiagnosticHistoryEntry = {
  id: string;
  at: string;
  kind: "ping" | "models" | "fallback";
  provider?: AiProviderId | "chain";
  ok: boolean;
  latencyMs: number;
  model?: string;
  message: string;
  detail?: string;
  code?: DiagnosticErrorCode;
  userId?: string;
};

export type ListedModel = {
  id: string;
  displayName?: string;
  deprecated?: boolean;
  supportsGenerateContent?: boolean;
};

const HISTORY_MAX = 100;
const history: DiagnosticHistoryEntry[] = [];

const PING_SCHEMA = {
  type: "object",
  properties: { ok: { type: "boolean" }, provider: { type: "string" } },
  required: ["ok", "provider"],
};

/** Preferências de substituição quando o modelo configurado sumiu da API. */
const RECOMENDACOES: Record<AiProviderId, string[]> = {
  gemini: ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"],
  groq: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"],
  openrouter: ["openai/gpt-4o-mini", "google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct"],
};

function hintKey(key: string | undefined): string | null {
  if (!key) return null;
  const t = key.trim();
  if (t.length < 8) return "****";
  return `…${t.slice(-4)}`;
}

function pushHistory(entry: Omit<DiagnosticHistoryEntry, "id" | "at"> & { at?: string }): DiagnosticHistoryEntry {
  const full: DiagnosticHistoryEntry = {
    id: randomUUID(),
    at: entry.at || new Date().toISOString(),
    kind: entry.kind,
    provider: entry.provider,
    ok: entry.ok,
    latencyMs: entry.latencyMs,
    model: entry.model,
    message: entry.message,
    detail: entry.detail ? String(entry.detail).slice(0, 400) : undefined,
    code: entry.code,
    userId: entry.userId,
  };
  history.unshift(full);
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  return full;
}

export function listDiagnosticHistory(limit = 50): DiagnosticHistoryEntry[] {
  return history.slice(0, Math.min(100, Math.max(1, limit)));
}

export function statusProvedores() {
  return {
    gemini: {
      provider: "gemini" as const,
      configured: Boolean(env.geminiApiKey),
      keyHint: hintKey(env.geminiApiKey),
      model: env.geminiModel,
      fallbackModel: env.geminiFallbackModel,
      role: "primary" as const,
    },
    groq: {
      provider: "groq" as const,
      configured: Boolean(env.groqApiKey),
      keyHint: hintKey(env.groqApiKey),
      model: env.groqModel,
      fallbackModel: null as string | null,
      role: "contingency" as const,
    },
    openrouter: {
      provider: "openrouter" as const,
      configured: Boolean(env.openRouterApiKey),
      keyHint: hintKey(env.openRouterApiKey),
      model: env.openRouterModel,
      fallbackModel: null as string | null,
      role: "contingency" as const,
    },
    chain: ["gemini", "groq", "openrouter"] as AiProviderId[],
  };
}

export function normalizeModelId(provider: AiProviderId, id: string): string {
  const raw = String(id || "").trim();
  if (provider === "gemini") return idModeloGemini(raw);
  return raw.replace(/^models\//i, "");
}

/** Compara IDs com aliases comuns (prefixos, suffix preview, case). */
export function modeloCorresponde(provider: AiProviderId, configured: string, candidate: string): boolean {
  const a = normalizeModelId(provider, configured).toLowerCase();
  const b = normalizeModelId(provider, candidate).toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.replace(/-preview$/i, "") === b.replace(/-preview$/i, "")) return true;
  if (provider === "gemini") {
    if (a.endsWith(b) || b.endsWith(a)) return true;
  }
  if (provider === "groq") {
    // llama-3.3-70b-versatile vs meta-llama/llama-3.3-70b-versatile
    const short = (s: string) => s.split("/").pop() || s;
    if (short(a) === short(b)) return true;
  }
  return false;
}

export function classificarErroHttp(status: number, detalhe = ""): {
  code: DiagnosticErrorCode;
  httpStatus: number;
  message: string;
} {
  const t = String(detalhe || "").toLowerCase();
  if (status === 401 || /invalid.?api.?key|incorrect.?api.?key|unauthorized|api.?key.?not.?valid/i.test(t)) {
    return { code: "invalid_key", httpStatus: 401, message: "Chave API inválida ou rejeitada pelo provedor." };
  }
  if (status === 403 || /permission|forbidden|not allowed|consumer/i.test(t)) {
    return { code: "forbidden", httpStatus: 403, message: "Sem permissão para este recurso ou modelo." };
  }
  if (status === 404 || /model.?not.?found|does not exist|not found|unknown model/i.test(t)) {
    return { code: "model_not_found", httpStatus: 404, message: "Modelo configurado não encontrado na API (possível descontinuação)." };
  }
  if (status === 429 || /rate.?limit|quota|resource.?exhausted|too many/i.test(t)) {
    return { code: "rate_limit", httpStatus: 429, message: "Limite de requisições ou cota atingido." };
  }
  if (status === 408 || status === 504 || /timeout|aborted|deadline/i.test(t)) {
    return { code: "timeout", httpStatus: 504, message: "Timeout ao contactar o provedor." };
  }
  if (status === 503 || status === 502 || /unavailable|high demand|overloaded/i.test(t)) {
    return { code: "provider_unavailable", httpStatus: 503, message: "Provedor temporariamente indisponível." };
  }
  if (status === 400 || /invalid.?request|bad request/i.test(t)) {
    return { code: "invalid_request", httpStatus: 400, message: "Pedido rejeitado pelo provedor (parâmetros inválidos)." };
  }
  return {
    code: "unknown",
    httpStatus: status >= 400 && status < 600 ? status : 502,
    message: detalhe?.slice(0, 240) || "Falha no provedor.",
  };
}

function sanitizarDetalhe(texto: string): string {
  return String(texto || "")
    .replace(/gsk_[A-Za-z0-9]+/g, "gsk_[redacted]")
    .replace(/sk-or-v1-[A-Za-z0-9]+/g, "sk-or-[redacted]")
    .replace(/AQ\.[A-Za-z0-9_-]+/g, "AQ.[redacted]")
    .replace(/key[=:]\s*[A-Za-z0-9_\-]{8,}/gi, "key=[redacted]")
    .slice(0, 400);
}

function recomendarModelo(provider: AiProviderId, models: ListedModel[], configured: string): string | null {
  const geracao = models.filter((m) => m.supportsGenerateContent !== false && !m.deprecated);
  const pool = geracao.length ? geracao : models;
  if (!pool.length) return RECOMENDACOES[provider][0] || null;

  for (const pref of RECOMENDACOES[provider]) {
    const hit = pool.find((m) => modeloCorresponde(provider, pref, m.id));
    if (hit && !modeloCorresponde(provider, configured, hit.id)) return hit.id;
  }
  // primeiro modelo de chat/geração diferente do configurado
  const other = pool.find((m) => !modeloCorresponde(provider, configured, m.id));
  return other?.id || pool[0]?.id || null;
}

function isGroqChatModel(id: string): boolean {
  const s = id.toLowerCase();
  if (/whisper|prompt-guard|tts|orpheus|guard/i.test(s)) return false;
  return true;
}

async function fetchModelosGemini(): Promise<ListedModel[]> {
  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
    headers: { "x-goog-api-key": env.geminiApiKey! },
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    const err = classificarErroHttp(resp.status, raw);
    throw Object.assign(new Error(err.message), { diagnosticCode: err.code, httpStatus: err.httpStatus, detail: sanitizarDetalhe(raw) });
  }
  const parsed = JSON.parse(raw);
  return (parsed?.models || [])
    .map((m: any) => {
      const id = normalizeModelId("gemini", String(m.name || ""));
      const methods: string[] = m.supportedGenerationMethods || [];
      const supportsGenerateContent = methods.includes("generateContent");
      const deprecated = Boolean(m.description && /deprecated|discontinued|legacy/i.test(String(m.description)));
      return { id, displayName: m.displayName || id, deprecated, supportsGenerateContent };
    })
    .filter((m: ListedModel) => m.id && /gemini/i.test(m.id) && m.supportsGenerateContent);
}

async function fetchModelosGroq(): Promise<ListedModel[]> {
  const resp = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${env.groqApiKey}` },
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    const err = classificarErroHttp(resp.status, raw);
    throw Object.assign(new Error(err.message), { diagnosticCode: err.code, httpStatus: err.httpStatus, detail: sanitizarDetalhe(raw) });
  }
  const parsed = JSON.parse(raw);
  return (parsed?.data || [])
    .map((m: any) => ({
      id: String(m.id || ""),
      displayName: String(m.id || ""),
      deprecated: Boolean(m.deprecated),
      supportsGenerateContent: isGroqChatModel(String(m.id || "")),
    }))
    .filter((m: ListedModel) => m.id && m.supportsGenerateContent);
}

async function fetchModelosOpenRouter(): Promise<ListedModel[]> {
  const headers: Record<string, string> = { Authorization: `Bearer ${env.openRouterApiKey}` };
  if (env.openRouterHttpReferer) headers["HTTP-Referer"] = env.openRouterHttpReferer;
  if (env.openRouterAppTitle) headers["X-Title"] = env.openRouterAppTitle;
  const resp = await fetch("https://openrouter.ai/api/v1/models", {
    headers,
    signal: AbortSignal.timeout(45_000),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    const err = classificarErroHttp(resp.status, raw);
    throw Object.assign(new Error(err.message), { diagnosticCode: err.code, httpStatus: err.httpStatus, detail: sanitizarDetalhe(raw) });
  }
  const parsed = JSON.parse(raw);
  return (parsed?.data || [])
    .map((m: any) => ({
      id: String(m.id || ""),
      displayName: m.name || m.id,
      deprecated: false,
      supportsGenerateContent: true,
    }))
    .filter((m: ListedModel) => m.id);
}

export type ModelsDiagnosticResult = {
  ok: boolean;
  provider: AiProviderId;
  latencyMs: number;
  configuredModel: string;
  configuredFallbackModel?: string | null;
  models: ListedModel[];
  configuredStatus: "ok" | "missing_key" | "not_found" | "unknown";
  fallbackStatus?: "ok" | "not_found" | "none" | "unknown";
  recommendedModel?: string | null;
  code: DiagnosticErrorCode;
  httpStatus: number;
  error?: string;
  detail?: string;
};

export async function listarModelosOficiais(
  provider: AiProviderId,
  userId?: string,
): Promise<ModelsDiagnosticResult> {
  const started = Date.now();
  const status = statusProvedores()[provider];
  const configuredModel = status.model;
  const configuredFallback = provider === "gemini" ? env.geminiFallbackModel : null;

  if (!status.configured) {
    const latencyMs = Date.now() - started;
    pushHistory({
      kind: "models",
      provider,
      ok: false,
      latencyMs,
      model: configuredModel,
      message: "Chave não configurada no servidor.",
      code: "missing_key",
      userId,
    });
    return {
      ok: false,
      provider,
      latencyMs,
      configuredModel,
      configuredFallbackModel: configuredFallback,
      models: [],
      configuredStatus: "missing_key",
      fallbackStatus: configuredFallback ? "unknown" : "none",
      recommendedModel: RECOMENDACOES[provider][0],
      code: "missing_key",
      httpStatus: 503,
      error: `Chave de ${provider} não configurada.`,
    };
  }

  try {
    const models =
      provider === "gemini" ? await fetchModelosGemini()
        : provider === "groq" ? await fetchModelosGroq()
          : await fetchModelosOpenRouter();

    const configuredStatus: ModelsDiagnosticResult["configuredStatus"] =
      models.length === 0 ? "unknown"
        : models.some((m) => modeloCorresponde(provider, configuredModel, m.id)) ? "ok"
          : "not_found";

    let fallbackStatus: ModelsDiagnosticResult["fallbackStatus"] = "none";
    if (configuredFallback) {
      fallbackStatus = models.length === 0 ? "unknown"
        : models.some((m) => modeloCorresponde(provider, configuredFallback, m.id)) ? "ok"
          : "not_found";
    }

    const recommendedModel =
      configuredStatus === "not_found" || fallbackStatus === "not_found"
        ? recomendarModelo(provider, models, configuredModel)
        : null;

    const latencyMs = Date.now() - started;
    const message = configuredStatus === "not_found"
      ? `Modelo "${configuredModel}" não está na API. Recomendado: ${recommendedModel || "consultar documentação"}.`
      : `${models.length} modelos listados; configurado: ${configuredStatus}`;

    pushHistory({
      kind: "models",
      provider,
      ok: true,
      latencyMs,
      model: configuredModel,
      message,
      code: configuredStatus === "not_found" ? "model_not_found" : "ok",
      userId,
    });

    // Lista oficial OK → HTTP 200 mesmo se o modelo configurado estiver descontinuado (diagnóstico, não falha de API).
    return {
      ok: true,
      provider,
      latencyMs,
      configuredModel,
      configuredFallbackModel: configuredFallback,
      models: models.slice(0, 200),
      configuredStatus,
      fallbackStatus,
      recommendedModel,
      code: configuredStatus === "not_found" ? "model_not_found" : "ok",
      httpStatus: 200,
      error: configuredStatus === "not_found" ? message : undefined,
    };
  } catch (e) {
    const latencyMs = Date.now() - started;
    const anyErr = e as Error & { diagnosticCode?: DiagnosticErrorCode; httpStatus?: number; detail?: string };
    const code = anyErr.diagnosticCode || ( /timeout|aborted/i.test(anyErr.message || "") ? "timeout" : "unknown");
    const httpStatus = anyErr.httpStatus || (code === "timeout" ? 504 : 502);
    const error = anyErr.message || "Falha ao listar modelos.";
    pushHistory({
      kind: "models",
      provider,
      ok: false,
      latencyMs,
      model: configuredModel,
      message: error,
      detail: anyErr.detail,
      code,
      userId,
    });
    return {
      ok: false,
      provider,
      latencyMs,
      configuredModel,
      configuredFallbackModel: configuredFallback,
      models: [],
      configuredStatus: "unknown",
      fallbackStatus: configuredFallback ? "unknown" : "none",
      recommendedModel: RECOMENDACOES[provider][0],
      code,
      httpStatus,
      error,
      detail: anyErr.detail,
    };
  }
}

export type PingDiagnosticResult = {
  ok: boolean;
  provider: AiProviderId;
  latencyMs: number;
  model: string;
  message: string;
  code: DiagnosticErrorCode;
  httpStatus: number;
  recommendedModel?: string | null;
  sample?: unknown;
  detail?: string;
};

type PingBruto = { ok: true; text: string; model: string } | { ok: false; status: number; error: string; model: string };

/** Gemini: 1 generateContent, sem schema estrito, sem fallback/retry de produção. */
async function pingGeminiRapido(model: string, key: string, signal: AbortSignal): Promise<PingBruto> {
  const modelo = idModeloGemini(model);
  try {
    const resp = await fetch(urlGeracaoGemini(modelo), {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: 'Reply with json only: {"ok":true,"provider":"gemini"}' }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 32,
          responseMimeType: "application/json",
        },
      }),
    });
    const raw = await resp.text();
    if (!resp.ok) {
      let detalhe = raw;
      try { detalhe = JSON.parse(raw)?.error?.message || raw; } catch { /* ignore */ }
      return { ok: false, status: resp.status, error: String(detalhe).slice(0, 300), model: modelo };
    }
    const text = textoRespostaGemini(JSON.parse(raw));
    if (!text) return { ok: false, status: 502, error: "Resposta vazia do Gemini.", model: modelo };
    return { ok: true, text, model: modelo };
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return { ok: false, status: 504, error: "Timeout no ping Gemini.", model: modelo };
    return { ok: false, status: 503, error: (e as Error)?.message || "Falha de rede Gemini.", model: modelo };
  }
}

/** Groq/OpenRouter: 1 chat completion enxuto (sem retries). */
async function pingChatRapido(opts: {
  provider: "groq" | "openrouter";
  url: string;
  key: string;
  model: string;
  headers?: Record<string, string>;
  signal: AbortSignal;
}): Promise<PingBruto> {
  try {
    // Groq gpt-oss: json_object sem max_tokens baixo (max_tokens pequeno + json_object falha).
    const body: Record<string, unknown> = {
      model: opts.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Reply with json only." },
        { role: "user", content: `Return json {"ok":true,"provider":"${opts.provider}"}` },
      ],
    };

    const resp = await fetch(opts.url, {
      method: "POST",
      signal: opts.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.key}`,
        ...opts.headers,
      },
      body: JSON.stringify(body),
    });
    const raw = await resp.text();
    if (!resp.ok) {
      let detalhe = raw;
      try {
        const p = JSON.parse(raw);
        detalhe = p?.error?.message || p?.message || raw;
      } catch { /* ignore */ }
      return { ok: false, status: resp.status, error: String(detalhe).slice(0, 300), model: opts.model };
    }
    const msg = JSON.parse(raw)?.choices?.[0]?.message || {};
    let text = String(msg.content || "").trim();
    // Alguns modelos (gpt-oss) deixam content vazio e raciocinam em `reasoning`.
    if (!text && typeof msg.reasoning === "string") {
      const m = msg.reasoning.match(/\{[^{}]*"ok"[^{}]*\}/);
      if (m) text = m[0];
    }
    if (!text) return { ok: false, status: 502, error: "Resposta vazia.", model: opts.model };
    return { ok: true, text, model: opts.model };
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      return { ok: false, status: 504, error: `Timeout no ping ${opts.provider}.`, model: opts.model };
    }
    return { ok: false, status: 503, error: (e as Error)?.message || "Falha de rede.", model: opts.model };
  }
}

export async function testarProvedor(
  provider: AiProviderId,
  userId?: string,
): Promise<PingDiagnosticResult> {
  const started = Date.now();
  const status = statusProvedores()[provider];
  if (!status.configured) {
    const latencyMs = Date.now() - started;
    const entry: PingDiagnosticResult = {
      ok: false,
      provider,
      latencyMs,
      model: status.model,
      message: `Chave de ${provider} não configurada no servidor.`,
      code: "missing_key",
      httpStatus: 503,
    };
    pushHistory({ kind: "ping", ...entry, userId });
    return entry;
  }

  try {
    const signal = AbortSignal.timeout(PING_TIMEOUT_MS);
    let bruto: PingBruto;

    if (provider === "gemini") {
      bruto = await pingGeminiRapido(status.model, env.geminiApiKey!, signal);
    } else if (provider === "groq") {
      bruto = await pingChatRapido({
        provider: "groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: env.groqApiKey!,
        model: status.model,
        signal,
      });
    } else {
      const headers: Record<string, string> = {};
      if (env.openRouterHttpReferer) headers["HTTP-Referer"] = env.openRouterHttpReferer;
      if (env.openRouterAppTitle) headers["X-Title"] = env.openRouterAppTitle;
      bruto = await pingChatRapido({
        provider: "openrouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: env.openRouterApiKey!,
        model: status.model,
        headers,
        signal,
      });
    }

    if (!bruto.ok) {
      const classified = classificarErroHttp(bruto.status, bruto.error);
      // Recomendação imediata (sem segunda round-trip de listagem — mantém o Teste ágil).
      const recommendedModel = classified.code === "model_not_found" ? RECOMENDACOES[provider][0] : null;
      const latencyMs = Date.now() - started;
      const message = recommendedModel
        ? `${classified.message} Configurado: ${status.model}. Recomendado: ${recommendedModel} (altere no server/.env e reinicie).`
        : classified.message;
      const entry: PingDiagnosticResult = {
        ok: false,
        provider,
        latencyMs,
        model: status.model,
        message,
        code: classified.code,
        httpStatus: classified.httpStatus,
        recommendedModel,
        detail: sanitizarDetalhe(bruto.error),
      };
      pushHistory({ kind: "ping", provider, ok: false, latencyMs, model: status.model, message, code: classified.code, detail: entry.detail, userId });
      return entry;
    }

    let sample: unknown = bruto.text.slice(0, 200);
    try {
      sample = JSON.parse(bruto.text);
    } catch { /* keep preview */ }

    const latencyMs = Date.now() - started;
    const entry: PingDiagnosticResult = {
      ok: true,
      provider,
      latencyMs,
      model: bruto.model,
      message: `Conexão OK (${latencyMs} ms)`,
      code: "ok",
      httpStatus: 200,
      sample,
    };
    pushHistory({ kind: "ping", provider, ok: true, latencyMs, model: bruto.model, message: entry.message, code: "ok", userId });
    return entry;
  } catch (e) {
    const latencyMs = Date.now() - started;
    const raw = e instanceof Error ? e.message : "Falha no teste.";
    const classified = classificarErroHttp(/timeout|aborted/i.test(raw) ? 504 : 502, raw);
    const entry: PingDiagnosticResult = {
      ok: false,
      provider,
      latencyMs,
      model: status.model,
      message: classified.message,
      code: classified.code,
      httpStatus: classified.httpStatus,
      detail: sanitizarDetalhe(raw),
    };
    pushHistory({ kind: "ping", ...entry, userId });
    return entry;
  }
}

/** Exercita a cadeia de contingência sem alterar env/modelos de produção. */
export async function testarFallback(userId?: string): Promise<{
  ok: boolean;
  latencyMs: number;
  steps: Array<{ step: string; ok: boolean; latencyMs: number; message: string; model?: string; code?: DiagnosticErrorCode }>;
  message: string;
  httpStatus: number;
}> {
  const started = Date.now();
  const steps: Array<{ step: string; ok: boolean; latencyMs: number; message: string; model?: string; code?: DiagnosticErrorCode }> = [];

  const gemini = await testarProvedor("gemini", userId);
  steps.push({
    step: "gemini_primary",
    ok: gemini.ok,
    latencyMs: gemini.latencyMs,
    message: gemini.message,
    model: gemini.model,
    code: gemini.code,
  });

  const t0 = Date.now();
  const pedido = {
    systemPrompt: "Diagnóstico de contingência SegCRM. Responda só com json.",
    userContent: [{ type: "input_text", text: 'Retorne json {"ok":true,"provider":"contingency"}' }],
    schema: PING_SCHEMA,
    schemaName: "ai_diagnostics_fallback",
  };
  const contingencia = await gerarComContingencia(
    pedido,
    "Diagnóstico admin: teste forçado da cadeia de contingência (Gemini simulado indisponível).",
    AbortSignal.timeout(90_000),
  );
  const contingenciaMs = Date.now() - t0;

  if (contingencia == null) {
    steps.push({
      step: "contingency_chain",
      ok: false,
      latencyMs: contingenciaMs,
      message: "Nenhuma chave Groq/OpenRouter configurada — contingência inativa.",
      code: "missing_key",
    });
  } else if (contingencia.ok) {
    steps.push({
      step: "contingency_chain",
      ok: true,
      latencyMs: contingenciaMs,
      message: `Contingência OK via ${contingencia.provedor}`,
      model: contingencia.modelo,
      code: "ok",
    });
  } else {
    const classified = classificarErroHttp(contingencia.status || 502, contingencia.error);
    steps.push({
      step: "contingency_chain",
      ok: false,
      latencyMs: contingenciaMs,
      message: contingencia.error,
      code: classified.code,
    });
  }

  if (env.groqApiKey) {
    const g = await testarProvedor("groq", userId);
    steps.push({ step: "groq_direct", ok: g.ok, latencyMs: g.latencyMs, message: g.message, model: g.model, code: g.code });
  }
  if (env.openRouterApiKey) {
    const o = await testarProvedor("openrouter", userId);
    steps.push({ step: "openrouter_direct", ok: o.ok, latencyMs: o.latencyMs, message: o.message, model: o.model, code: o.code });
  }

  const latencyMs = Date.now() - started;
  const chainOk = steps.some((s) => s.step === "contingency_chain" && s.ok)
    || (steps.some((s) => s.step === "gemini_primary" && s.ok) && steps.some((s) => (s.step === "groq_direct" || s.step === "openrouter_direct") && s.ok));
  const message = chainOk
    ? "Teste de fallback concluído. Modelos de produção não foram alterados automaticamente."
    : "Teste de fallback concluiu com falhas. Verifique chaves/modelos no server/.env.";

  pushHistory({
    kind: "fallback",
    provider: "chain",
    ok: chainOk,
    latencyMs,
    message,
    detail: steps.map((s) => `${s.step}:${s.ok ? "ok" : "fail"}`).join(", "),
    code: chainOk ? "ok" : "unknown",
    userId,
  });

  return { ok: chainOk, latencyMs, steps, message, httpStatus: chainOk ? 200 : 207 };
}
