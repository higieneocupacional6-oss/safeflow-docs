// Chamada à IA (Google Gemini) com resposta em fluxo NDJSON para o navegador.
// Motivo: gerações longas excediam o tempo ocioso da Edge Function quando a
// resposta era montada inteira antes de responder. O cliente recebe "ping"
// periódicos e, ao final, {type:"result"} ou {type:"error"}.
// A chave fica só em Deno.env (GEMINI_API_KEY). Nunca no frontend nem nos logs.

import { chamarFormularioAepGateway } from "./formularioAepGateway.ts";

const MAX_TEXT_CHARS = 180_000;
const MAX_ANEXO_BYTES_TOTAL = 18 * 1024 * 1024;

/** Modelo atual da API Gemini (texto, PDF e imagem). Fallback só via secret GEMINI_FALLBACK_MODEL. */
export const GEMINI_MODELO_PADRAO = "gemini-3.8-flash";
export const GEMINI_MODELO_VISAO = "gemini-3.8-flash";
export const MAX_TENTATIVAS_GEMINI = 3;

/** Id sem prefixo `models/`, para o path `/v1beta/models/{id}:generateContent`. */
export function idModeloGemini(nome: string): string {
  return String(nome || "").trim().replace(/^models\//i, "");
}

export function urlGeracaoGemini(modelo: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(idModeloGemini(modelo))}:generateContent`;
}

/** Limita o tamanho de um texto preservando início e fim. */
export function limitarTexto(texto: string, max = MAX_TEXT_CHARS): string {
  if (texto.length <= max) return texto;
  const meio = Math.floor(max / 2);
  return `${texto.slice(0, meio)}\n\n[... conteúdo extenso resumido por limite de contexto ...]\n\n${texto.slice(-meio)}`;
}

/** Reduz JSON grande truncando strings longas e listas extensas. */
export function compactarContexto(valor: unknown, maxStr = 4000, maxArr = 60): unknown {
  if (typeof valor === "string") return valor.length > maxStr ? valor.slice(0, maxStr) + "…" : valor;
  if (Array.isArray(valor)) return valor.slice(0, maxArr).map((v) => compactarContexto(v, maxStr, maxArr));
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) out[k] = compactarContexto(v, maxStr, maxArr);
    return out;
  }
  return valor;
}

/** Mantém anexos dentro de um orçamento total de bytes (base64). */
export function limitarAnexos<T extends { data?: string }>(lista: T[], max = 10): T[] {
  let total = 0;
  const out: T[] = [];
  for (const a of lista.slice(0, max)) {
    const size = (a?.data?.length || 0) * 0.75;
    if (!a?.data || total + size > MAX_ANEXO_BYTES_TOTAL) continue;
    total += size;
    out.push(a);
  }
  return out;
}

/** Enum aceito pelo Gemini: sem vazio, nulo ou só espaço. */
export function enumValidoGemini(v: unknown): boolean {
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return Number.isFinite(v);
  return typeof v === "boolean";
}

function enumPermiteVazio(schema: any): boolean {
  return Array.isArray(schema?.enum) && schema.enum.some((v: unknown) => !enumValidoGemini(v));
}

/** Ajusta schema ao modo estrito: objetos fechados. Campos cujo enum inclui vazio
 * ficam opcionais — o Gemini rejeita string vazia em enum (HTTP 400). */
export function schemaEstrito(schema: any): any {
  if (Array.isArray(schema)) return schema.map(schemaEstrito);
  if (!schema || typeof schema !== "object") return schema;
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    out[k] = k === "properties"
      ? Object.fromEntries(Object.entries(v as any).map(([pk, pv]) => [pk, schemaEstrito(pv)]))
      : schemaEstrito(v);
  }
  if (out.type === "object" && out.properties) {
    out.additionalProperties = false;
    const declaradas = Array.isArray(schema.required) ? new Set(schema.required as string[]) : null;
    out.required = Object.keys(out.properties).filter((k) => {
      if (enumPermiteVazio(out.properties[k])) return false;
      return declaradas ? declaradas.has(k) : true;
    });
  }
  return out;
}

const TIPO_GEMINI: Record<string, string> = {
  object: "OBJECT", string: "STRING", number: "NUMBER", integer: "INTEGER",
  boolean: "BOOLEAN", array: "ARRAY", null: "NULL",
};

/** Remove campos rejeitados, enums vazios/inválidos e normaliza tipos para o Gemini. */
export function schemaParaGemini(schema: any): any {
  if (Array.isArray(schema)) return schema.map(schemaParaGemini);
  if (!schema || typeof schema !== "object") return schema;
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === "$schema" || k === "$id" || k === "examples" || k === "default" || k === "additionalProperties") continue;
    if (k === "type" && typeof v === "string") {
      out.type = TIPO_GEMINI[v.toLowerCase()] || v.toUpperCase();
      continue;
    }
    if (k === "type" && Array.isArray(v)) {
      out.type = v.map((t) => (typeof t === "string" ? (TIPO_GEMINI[t.toLowerCase()] || t.toUpperCase()) : t));
      continue;
    }
    if (k === "enum" && Array.isArray(v)) {
      const limpos = [...new Set(v.filter(enumValidoGemini))];
      if (limpos.length) out.enum = limpos;
      continue;
    }
    out[k] = k === "properties"
      ? Object.fromEntries(Object.entries(v as any).map(([pk, pv]) => [pk, schemaParaGemini(pv)]))
      : schemaParaGemini(v);
  }
  return out;
}

/** Schema efetivamente enviado em generationConfig.responseSchema. */
export function prepararSchemaGemini(schema: unknown): unknown {
  return schemaParaGemini(schemaEstrito(schema));
}

/** Texto da resposta, ignorando partes de raciocínio (thought). */
export function textoRespostaGemini(parsed: any): string {
  return (parsed?.candidates || [])
    .flatMap((c: any) => c?.content?.parts || [])
    .filter((p: any) => p && !p.thought && typeof p.text === "string")
    .map((p: any) => p.text)
    .join("")
    .trim();
}

/** Interpreta JSON do modelo: cerca markdown, string dupla e recorte {…}. */
export function parsearJsonModelo(text: string): any {
  let s = String(text || "").trim();
  if (!s) throw new Error("vazio");
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const tentar = (raw: string) => {
    const v = JSON.parse(raw);
    return typeof v === "string" ? JSON.parse(v) : v;
  };
  try {
    const v = tentar(s);
    if (v && typeof v === "object") return v;
  } catch { /* tenta recorte */ }
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    const v = tentar(s.slice(i, j + 1));
    if (v && typeof v === "object") return v;
  }
  throw new Error("invalid");
}

/** True quando o JSON não tem conteúdo aplicável à interface. */
export function saidaJsonVazia(valor: unknown): boolean {
  if (valor == null) return true;
  if (typeof valor === "string") return !valor.trim();
  if (typeof valor === "number" || typeof valor === "boolean") return false;
  if (Array.isArray(valor)) return valor.length === 0 || valor.every(saidaJsonVazia);
  if (typeof valor === "object") {
    const vals = Object.values(valor as Record<string, unknown>);
    return vals.length === 0 || vals.every(saidaJsonVazia);
  }
  return true;
}

/** Chave gerenciada do Lovable AI usada por todas as gerações. */
export function obterChaveIa(): string | null {
  return Deno.env.get("LOVABLE_API_KEY")?.trim() || null;
}

export const MENSAGEM_IA_NAO_CONFIGURADA = "O serviço de IA não está configurado. Seus dados foram mantidos.";

export function obterChaveGemini(): string | null {
  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  return key || null;
}

export function mensagemSemChaveGemini(): string {
  return "GEMINI_API_KEY não configurada. Crie uma chave gratuita em https://aistudio.google.com/apikey e cadastre o secret GEMINI_API_KEY nas Edge Functions do Supabase.";
}

export function mensagemGeminiIndisponivel(): string {
  return "O Gemini está temporariamente indisponível por alta demanda ou limite de uso. Seus dados foram mantidos. Aguarde alguns instantes e tente novamente.";
}

/** 503/429 e sobrecarga da API — vale nova tentativa. 400/401/403 não. */
export function erroTemporarioGemini(status: number, detalhe = "", statusGrpc = ""): boolean {
  if (status === 429 || status === 503) return true;
  const texto = `${detalhe} ${statusGrpc}`.toLowerCase();
  return statusGrpc === "UNAVAILABLE" || statusGrpc === "RESOURCE_EXHAUSTED"
    || /high demand|overloaded|unavailable|try again later|resource.?exhausted|too many/i.test(texto);
}

/** Espera antes da próxima tentativa (1s, 2s). */
export function esperaProgressivaMs(tentativaConcluida: number): number {
  const n = Math.max(1, Math.min(tentativaConcluida, MAX_TENTATIVAS_GEMINI - 1));
  return 1000 * (2 ** (n - 1));
}

/** Aceita só id compatível com /v1beta/models/{id}:generateContent. Não inventa nomes. */
export function modeloFallbackGemini(secret: string | null | undefined): string | null {
  const id = idModeloGemini(secret || "");
  if (!id || id.length > 80) return null;
  if (!/^gemini-[a-z0-9][a-z0-9._-]*$/i.test(id)) return null;
  return id;
}

export function filaModelosGemini(primario: string, fallbackSecret?: string | null): string[] {
  const p = idModeloGemini(primario);
  const f = modeloFallbackGemini(fallbackSecret);
  const out: string[] = [];
  if (p) out.push(p);
  if (f && f !== p) out.push(f);
  return out;
}

export async function esperarMs(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export type FalhaGemini = { ok: false; status: number; error: string; retryable: boolean };
export type SucessoGemini = { ok: true; text: string };
export type ChamadaGemini = SucessoGemini | FalhaGemini;

/** Retentativas 503/429 por modelo; fallback só se configurado. Uma resposta final. */
export async function orquestrarChamadasGemini(opts: {
  modelos: string[];
  chamar: (modelo: string) => Promise<ChamadaGemini>;
  maxTentativas?: number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  signal?: AbortSignal;
  log?: (info: { modelo: string; status: number; tentativa: number }) => void;
}): Promise<ChamadaGemini & { modelo?: string; tentativas: number }> {
  const max = opts.maxTentativas ?? MAX_TENTATIVAS_GEMINI;
  const sleep = opts.sleep ?? esperarMs;
  let ultimo: ChamadaGemini = { ok: false, status: 503, error: mensagemGeminiIndisponivel(), retryable: true };
  let tentativas = 0;
  let ultimoModelo = opts.modelos[0];

  for (const modelo of opts.modelos) {
    ultimoModelo = modelo;
    for (let tentativa = 1; tentativa <= max; tentativa++) {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      tentativas += 1;
      const r = await opts.chamar(modelo);
      opts.log?.({ modelo, status: r.ok ? 200 : r.status, tentativa });
      if (r.ok) return { ...r, modelo, tentativas };
      ultimo = r;
      if (r.status === 404) break;
      if (!erroTemporarioGemini(r.status, r.error)) return { ...r, modelo, tentativas };
      if (tentativa < max) await sleep(esperaProgressivaMs(tentativa), opts.signal);
    }
  }
  const temporario = !ultimo.ok && (erroTemporarioGemini(ultimo.status, ultimo.error) || ultimo.status === 404);
  return {
    ok: false,
    status: ultimo.ok ? 503 : ultimo.status,
    error: temporario ? mensagemGeminiIndisponivel() : ultimo.error,
    retryable: true,
    modelo: ultimoModelo,
    tentativas,
  };
}

function mensagemAmigavel(status: number, detalhe: string, statusGrpc?: string): string {
  const texto = `${detalhe} ${statusGrpc || ""}`.toLowerCase();
  if (status === 429 || statusGrpc === "RESOURCE_EXHAUSTED" || /resource.?exhausted|quota|rate.?limit|too many|high demand/i.test(texto)) {
    return mensagemGeminiIndisponivel();
  }
  if (status === 403 || /api.?key.?not.?valid|permission.?denied|consumer/i.test(texto)) {
    return "A chave GEMINI_API_KEY é inválida ou não tem permissão para o Gemini. Gere outra em https://aistudio.google.com/apikey e atualize o secret no Supabase.";
  }
  if (status === 400) {
    return "Os dados enviados não puderam ser processados pela IA. Reduza anexos ou textos muito extensos e tente novamente.";
  }
  if (status === 404) {
    return "O modelo de IA configurado não está disponível neste momento. Tente novamente mais tarde.";
  }
  if (status >= 500 || statusGrpc === "UNAVAILABLE") {
    return mensagemGeminiIndisponivel();
  }
  return detalhe || "A geração com IA não pôde ser concluída. Seus dados foram mantidos.";
}

function secretModeloFallback(): string | null {
  try {
    return Deno.env.get("GEMINI_FALLBACK_MODEL")?.trim() || null;
  } catch {
    return null;
  }
}

function extrairBase64(dataUrlOuBase64: string): { mime: string; data: string } | null {
  const m = String(dataUrlOuBase64 || "").match(/^data:([^;]+);base64,(.+)$/i);
  if (m) return { mime: m[1], data: m[2] };
  if (/^[A-Za-z0-9+/=\s]+$/.test(dataUrlOuBase64) && dataUrlOuBase64.length > 32) {
    return { mime: "application/octet-stream", data: dataUrlOuBase64.replace(/\s+/g, "") };
  }
  return null;
}

/** Converte o formato já usado pelas funções (input_text/image/file) para partes Gemini. */
export function partesGeminiDeConteudo(userContent: unknown[]): { textParts: any[]; inlineParts: any[] } {
  const textParts: any[] = [];
  const inlineParts: any[] = [];
  for (const item of userContent || []) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, any>;
    if (p.type === "input_text" || p.type === "text") {
      const text = String(p.text || "");
      if (text) textParts.push({ text });
      continue;
    }
    if (p.type === "input_image" || p.type === "image_url") {
      const raw = typeof p.image_url === "string" ? p.image_url : p.image_url?.url || p.data || "";
      const parsed = extrairBase64(raw);
      if (parsed) inlineParts.push({ inline_data: { mime_type: parsed.mime.startsWith("image/") ? parsed.mime : "image/jpeg", data: parsed.data } });
      continue;
    }
    if (p.type === "input_file" || p.type === "file") {
      const raw = p.file_data || p.file?.file_data || p.data || "";
      const parsed = extrairBase64(raw);
      const nome = String(p.filename || p.file?.filename || "anexo.pdf").toLowerCase();
      const mime = parsed?.mime && parsed.mime !== "application/octet-stream"
        ? parsed.mime
        : nome.endsWith(".pdf") ? "application/pdf" : (parsed?.mime || "application/pdf");
      if (parsed) inlineParts.push({ inline_data: { mime_type: mime, data: parsed.data } });
      continue;
    }
  }
  return { textParts, inlineParts };
}

function sanitizarErroParaLog(texto: string, key?: string): string {
  let s = String(texto || "").slice(0, 500);
  if (key) s = s.split(key).join("[redacted]");
  return s.replace(/key[=:]\s*[A-Za-z0-9_\-]{8,}/gi, "key=[redacted]");
}

async function chamarGeminiUmaVez(opts: {
  key: string;
  model: string;
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  signal?: AbortSignal;
}): Promise<ChamadaGemini> {
  const { textParts, inlineParts } = partesGeminiDeConteudo(opts.userContent);
  const parts = [...inlineParts, ...textParts];
  if (!parts.length) parts.push({ text: "Gere a resposta JSON solicitada." });

  const body = {
    systemInstruction: { parts: [{ text: opts.systemPrompt }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: prepararSchemaGemini(opts.schema),
    },
  };

  let resp: Response;
  try {
    resp = await fetch(urlGeracaoGemini(opts.model), {
      method: "POST",
      signal: opts.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.key,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    return { ok: false, status: 503, error: mensagemGeminiIndisponivel(), retryable: true };
  }

  const raw = await resp.text().catch(() => "");
  if (!resp.ok) {
    let detalhe = "";
    let statusGrpc = "";
    try {
      const p = JSON.parse(raw);
      detalhe = p?.error?.message || "";
      statusGrpc = p?.error?.status || "";
    } catch { /* texto não-JSON */ }
    console.error("Gemini error", { modelo: idModeloGemini(opts.model), status: resp.status, detalhe: sanitizarErroParaLog(detalhe || raw, opts.key) });
    const status = resp.status === 429 ? 429 : resp.status >= 500 ? resp.status : resp.status === 403 ? 403 : resp.status === 404 ? 404 : 502;
    return {
      ok: false,
      status,
      error: mensagemAmigavel(status, detalhe, statusGrpc),
      retryable: erroTemporarioGemini(status, detalhe, statusGrpc) || status === 404,
    };
  }

  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    return { ok: false, status: 502, error: "A resposta do Gemini veio em formato inválido.", retryable: true };
  }
  const text = textoRespostaGemini(parsed);
  const finish = parsed?.candidates?.[0]?.finishReason;
  if (!text) {
    return {
      ok: false,
      status: 502,
      error: finish === "MAX_TOKENS"
        ? "A resposta da IA ficou incompleta por excesso de conteúdo. Reduza anexos ou textos e tente novamente."
        : "A IA retornou uma resposta vazia. Tente novamente.",
      retryable: true,
    };
  }
  return { ok: true, text };
}

async function chamarGeminiJson(opts: {
  key: string;
  model: string;
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  signal?: AbortSignal;
  fallbackModel?: string | null;
}): Promise<ChamadaGemini> {
  const modelos = filaModelosGemini(opts.model, opts.fallbackModel ?? secretModeloFallback());
  if (!modelos.length) {
    return { ok: false, status: 502, error: "O modelo de IA configurado não está disponível neste momento. Tente novamente mais tarde.", retryable: false };
  }
  const result = await orquestrarChamadasGemini({
    modelos,
    signal: opts.signal,
    chamar: (modelo) => chamarGeminiUmaVez({ ...opts, model: modelo }),
    log: ({ modelo, status, tentativa }) => {
      console.info("Gemini", { modelo, status, tentativa });
    },
  });
  if (result.ok) {
    console.info("Gemini ok", { modelo: result.modelo, status: 200, tentativas: result.tentativas });
  } else {
    console.error("Gemini esgotado", { modelo: result.modelo, status: result.status, tentativas: result.tentativas });
  }
  return result;
}

export async function gerarJsonEmFluxo(opts: {
  req: Request;
  corsHeaders: Record<string, string>;
  key: string;
  systemPrompt: string;
  userContent: unknown[];
  schemaName: string;
  schema: unknown;
  posProcessar?: (output: any) => any;
  tools?: unknown[];
  model?: string;
  chamar?: () => Promise<ChamadaGemini>;
}): Promise<Response> {
  const { req, corsHeaders, key } = opts;
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  // tools (ex.: web_search do gateway antigo) não existem no plano gratuito Gemini — ignorados de propósito.
  void opts.tools;

  const temImagem = (opts.userContent || []).some((c: any) => c?.type === "input_image" || c?.type === "image_url");
  const model = opts.model || (temImagem ? GEMINI_MODELO_VISAO : GEMINI_MODELO_PADRAO);

  const headers = {
    ...corsHeaders,
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache",
  };
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch { /* fechado */ }
      };
      send({ type: "ping" });
      const ping = setInterval(() => send({ type: "ping" }), 10_000);
      try {
        // Retentativas (503/429) e fallback ocorrem aqui: o NDJSON só recebe pings
        // até um único {type:"result"} ou {type:"error"} final.
        void model;
        const result = await (opts.chamar ? opts.chamar() : chamarFormularioAepGateway({
          key,
          systemPrompt: opts.systemPrompt,
          userContent: opts.userContent,
          schema: opts.schema,
          schemaName: opts.schemaName,
          signal: req.signal,
        }));
        if (!result.ok) {
          send({ type: "error", error: result.error, retryable: result.retryable });
          return;
        }
        try {
          const parsed = parsearJsonModelo(result.text);
          const output = opts.posProcessar ? opts.posProcessar(parsed) : parsed;
          if (saidaJsonVazia(output)) {
            send({ type: "error", error: "A IA retornou uma resposta vazia. Tente novamente.", retryable: true });
            return;
          }
          send({ type: "result", output });
        } catch {
          send({ type: "error", error: "A resposta da IA veio em formato inválido. Tente novamente.", retryable: true });
        }
      } catch (e) {
        if (!req.signal.aborted) {
          console.error("Gemini stream error", (e as Error)?.name || "error");
          send({ type: "error", error: (e as Error).message || "Falha durante a geração com IA.", retryable: true });
        }
      } finally {
        clearInterval(ping);
        try { controller.close(); } catch { /* já fechado */ }
      }
    },
    cancel() { /* abort via req.signal */ },
  });

  // Atalho: se a chave estiver vazia, responde JSON imediato (não deveria ocorrer — callers checam).
  if (!key) {
    return new Response(JSON.stringify({ error: MENSAGEM_IA_NAO_CONFIGURADA, retryable: false }), { status: 500, headers: jsonHeaders });
  }

  return new Response(stream, { status: 200, headers });
}

/** Chamada síncrona JSON (ex.: psico-generate) sem NDJSON. */
export async function gerarJsonGemini(opts: {
  key: string;
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  model?: string;
  signal?: AbortSignal;
  schemaName?: string;
}): Promise<{ ok: true; output: any } | { ok: false; status: number; error: string }> {
  const result = await chamarFormularioAepGateway({
    key: opts.key,
    systemPrompt: opts.systemPrompt,
    userContent: opts.userContent,
    schema: opts.schema,
    schemaName: opts.schemaName,
    signal: opts.signal,
  });
  if (!result.ok) return { ok: false, status: result.status, error: result.error };
  try {
    const output = parsearJsonModelo(result.text);
    if (saidaJsonVazia(output)) return { ok: false, status: 502, error: "A IA retornou uma resposta vazia. Tente novamente." };
    return { ok: true, output };
  } catch {
    return { ok: false, status: 502, error: "A resposta da IA veio em formato inválido. Tente novamente." };
  }
}
