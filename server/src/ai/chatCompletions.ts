/**
 * Adaptadores OpenAI-compatíveis (Groq / OpenRouter) para contingência de IA.
 * Recebem o mesmo PedidoGeracao do Gemini e devolvem texto JSON.
 */
import { env } from "../config/env.js";
import { schemaEstrito, type ChamadaGemini } from "./gemini.js";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string | Array<Record<string, unknown>> };

function sanitizar(texto: string, key?: string): string {
  let s = String(texto || "").slice(0, 500);
  if (key) s = s.split(key).join("[redacted]");
  return s.replace(/key[=:]\s*[A-Za-z0-9_\-]{8,}/gi, "key=[redacted]");
}

/** Converte userContent (formato Responses/Gemini parts) em mensagens Chat Completions. */
export function mensagensDePedido(systemPrompt: string, userContent: unknown[], schema: unknown): ChatMessage[] {
  const schemaTxt = JSON.stringify(schemaEstrito(schema));
  // OpenRouter exige a palavra "json" (minúscula) nas messages quando response_format=json_object.
  const system: ChatMessage = {
    role: "system",
    content: `${systemPrompt}

Responda EXCLUSIVAMENTE com json válido (sem markdown) conforme este schema json:
${schemaTxt}`,
  };

  const textChunks: string[] = [];
  const imageUrls: string[] = [];

  for (const item of userContent || []) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, any>;
    if (p.type === "input_text" || p.type === "text") {
      const text = String(p.text || "");
      if (text) textChunks.push(text);
      continue;
    }
    if (p.type === "input_image" || p.type === "image_url") {
      const raw = typeof p.image_url === "string" ? p.image_url : p.image_url?.url || p.data || "";
      if (raw) imageUrls.push(raw);
      continue;
    }
    if (p.type === "input_file" || p.type === "file") {
      const nome = String(p.filename || p.file?.filename || "anexo");
      textChunks.push(`[Anexo "${nome}" omitido no provedor de contingência — use apenas o texto do relato e metadados.]`);
    }
  }

  if (!textChunks.length && !imageUrls.length) {
    textChunks.push("Gere a resposta json solicitada com base nas instruções do sistema.");
  } else if (!textChunks.some((t) => /\bjson\b/i.test(t))) {
    textChunks.push("Formato obrigatório: json.");
  }

  if (imageUrls.length) {
    const parts: Array<Record<string, unknown>> = [];
    if (textChunks.length) parts.push({ type: "text", text: textChunks.join("\n\n") });
    for (const url of imageUrls.slice(0, 4)) {
      parts.push({ type: "image_url", image_url: { url } });
    }
    return [system, { role: "user", content: parts }];
  }

  return [system, { role: "user", content: textChunks.join("\n\n") }];
}

async function chamarChatCompletions(opts: {
  provedor: "groq" | "openrouter";
  url: string;
  key: string;
  model: string;
  messages: ChatMessage[];
  headers?: Record<string, string>;
  signal?: AbortSignal;
}): Promise<ChamadaGemini & { provedor: string; modelo: string }> {
  let resp: Response;
  try {
    resp = await fetch(opts.url, {
      method: "POST",
      signal: opts.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.key}`,
        ...opts.headers,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    return {
      ok: false,
      status: 503,
      error: `Provedor de contingência (${opts.provedor}) indisponível no momento.`,
      retryable: true,
      provedor: opts.provedor,
      modelo: opts.model,
    };
  }

  const raw = await resp.text().catch(() => "");
  if (!resp.ok) {
    let detalhe = "";
    try {
      const p = JSON.parse(raw);
      detalhe = p?.error?.message || p?.message || "";
    } catch { /* ignore */ }
    console.error("AI contingency error", {
      provedor: opts.provedor,
      modelo: opts.model,
      status: resp.status,
      detalhe: sanitizar(detalhe || raw, opts.key),
    });
    // Preserva 404 (modelo inexistente), 401/403, 429 — não colapsar tudo em 502.
    const status = resp.status === 429 ? 429
      : resp.status === 401 || resp.status === 403 ? resp.status
      : resp.status === 404 ? 404
      : resp.status === 400 ? 400
      : resp.status >= 500 ? resp.status
      : 502;
    const retryable = status === 429 || status >= 500;
    return {
      ok: false,
      status,
      error: detalhe || `Falha no provedor de contingência (${opts.provedor}).`,
      retryable,
      provedor: opts.provedor,
      modelo: opts.model,
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      status: 502,
      error: `Resposta inválida do provedor de contingência (${opts.provedor}).`,
      retryable: true,
      provedor: opts.provedor,
      modelo: opts.model,
    };
  }

  const text = String(parsed?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    return {
      ok: false,
      status: 502,
      error: `Provedor de contingência (${opts.provedor}) retornou resposta vazia.`,
      retryable: true,
      provedor: opts.provedor,
      modelo: opts.model,
    };
  }
  return { ok: true, text, provedor: opts.provedor, modelo: opts.model };
}

export async function chamarGroqJson(opts: {
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  signal?: AbortSignal;
}): Promise<ChamadaGemini & { provedor: string; modelo: string }> {
  const key = env.groqApiKey;
  if (!key) {
    return { ok: false, status: 503, error: "GROQ_API_KEY não configurada.", retryable: false, provedor: "groq", modelo: env.groqModel };
  }
  const messages = mensagensDePedido(opts.systemPrompt, opts.userContent, opts.schema);
  return chamarChatCompletions({
    provedor: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key,
    model: env.groqModel,
    messages,
    signal: opts.signal,
  });
}

export async function chamarOpenRouterJson(opts: {
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  signal?: AbortSignal;
}): Promise<ChamadaGemini & { provedor: string; modelo: string }> {
  const key = env.openRouterApiKey;
  if (!key) {
    return {
      ok: false,
      status: 503,
      error: "OPENROUTER_API_KEY não configurada.",
      retryable: false,
      provedor: "openrouter",
      modelo: env.openRouterModel,
    };
  }
  const headers: Record<string, string> = {};
  if (env.openRouterHttpReferer) headers["HTTP-Referer"] = env.openRouterHttpReferer;
  if (env.openRouterAppTitle) headers["X-Title"] = env.openRouterAppTitle;
  const messages = mensagensDePedido(opts.systemPrompt, opts.userContent, opts.schema);
  return chamarChatCompletions({
    provedor: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    key,
    model: env.openRouterModel,
    messages,
    headers,
    signal: opts.signal,
  });
}
