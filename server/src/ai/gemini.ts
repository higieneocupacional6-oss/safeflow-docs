/**
 * Cliente Gemini direto (Node). Porta a lógica de supabase/functions/_shared/aiStream.ts
 * sem Deno.env / Lovable — usa GEMINI_API_KEY do Express.
 */
import { env } from "../config/env.js";

const MAX_TEXT_CHARS = 180_000;
const MAX_ANEXO_BYTES_TOTAL = 18 * 1024 * 1024;
export const MAX_TENTATIVAS_GEMINI = 3;

export type FalhaGemini = { ok: false; status: number; error: string; retryable: boolean };
export type SucessoGemini = { ok: true; text: string };
export type ChamadaGemini = SucessoGemini | FalhaGemini;

export function idModeloGemini(nome: string): string {
  return String(nome || "").trim().replace(/^models\//i, "");
}

export function urlGeracaoGemini(modelo: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(idModeloGemini(modelo))}:generateContent`;
}

export function limitarTexto(texto: string, max = MAX_TEXT_CHARS): string {
  if (texto.length <= max) return texto;
  const meio = Math.floor(max / 2);
  return `${texto.slice(0, meio)}\n\n[... conteúdo extenso resumido por limite de contexto ...]\n\n${texto.slice(-meio)}`;
}

export function compactarContexto(valor: unknown, maxStr = 4000, maxArr = 60): unknown {
  if (typeof valor === "string") return valor.length > maxStr ? `${valor.slice(0, maxStr)}…` : valor;
  if (Array.isArray(valor)) return valor.slice(0, maxArr).map((v) => compactarContexto(v, maxStr, maxArr));
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) out[k] = compactarContexto(v, maxStr, maxArr);
    return out;
  }
  return valor;
}

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

export function enumValidoGemini(v: unknown): boolean {
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return Number.isFinite(v);
  return typeof v === "boolean";
}

function enumPermiteVazio(schema: any): boolean {
  return Array.isArray(schema?.enum) && schema.enum.some((v: unknown) => !enumValidoGemini(v));
}

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

export function prepararSchemaGemini(schema: unknown): unknown {
  return schemaParaGemini(schemaEstrito(schema));
}

/** Extrai texto útil, ignorando partes de raciocínio (thought) do Gemini 3.x. */
export function textoRespostaGemini(parsed: any): string {
  return (parsed?.candidates || [])
    .flatMap((c: any) => c?.content?.parts || [])
    .filter((p: any) => p && !p.thought && typeof p.text === "string")
    .map((p: any) => p.text)
    .join("")
    .trim();
}

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

export function mensagemGeminiIndisponivel(): string {
  return "O Gemini está temporariamente indisponível por alta demanda ou limite de uso. Seus dados foram mantidos. Aguarde alguns instantes e tente novamente.";
}

export function erroTemporarioGemini(status: number, detalhe = "", statusGrpc = ""): boolean {
  if (status === 429 || status === 503 || status === 502) return true;
  const texto = `${detalhe} ${statusGrpc}`.toLowerCase();
  return statusGrpc === "UNAVAILABLE" || statusGrpc === "RESOURCE_EXHAUSTED"
    || /high demand|overloaded|unavailable|try again later|resource.?exhausted|too many|quota|billing|credit/i.test(texto);
}

export function esperaProgressivaMs(tentativaConcluida: number): number {
  const n = Math.max(1, Math.min(tentativaConcluida, MAX_TENTATIVAS_GEMINI - 1));
  return 1000 * (2 ** (n - 1));
}

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
  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      const err = new Error("Aborted");
      err.name = "AbortError";
      reject(err);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function mensagemAmigavel(status: number, detalhe: string, statusGrpc?: string): string {
  const texto = `${detalhe} ${statusGrpc || ""}`.toLowerCase();
  if (status === 429 || statusGrpc === "RESOURCE_EXHAUSTED" || /resource.?exhausted|quota|rate.?limit|too many|high demand/i.test(texto)) {
    return mensagemGeminiIndisponivel();
  }
  if (status === 403 || /api.?key.?not.?valid|permission.?denied|consumer/i.test(texto)) {
    return "A chave GEMINI_API_KEY é inválida ou não tem permissão para o Gemini. Gere outra em https://aistudio.google.com/apikey.";
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

function extrairBase64(dataUrlOuBase64: string): { mime: string; data: string } | null {
  const m = String(dataUrlOuBase64 || "").match(/^data:([^;]+);base64,(.+)$/i);
  if (m) return { mime: m[1], data: m[2] };
  if (/^[A-Za-z0-9+/=\s]+$/.test(dataUrlOuBase64) && dataUrlOuBase64.length > 32) {
    return { mime: "application/octet-stream", data: dataUrlOuBase64.replace(/\s+/g, "") };
  }
  return null;
}

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
      if (parsed) {
        inlineParts.push({
          inline_data: {
            mime_type: parsed.mime.startsWith("image/") ? parsed.mime : "image/jpeg",
            data: parsed.data,
          },
        });
      }
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
    console.error("Gemini error", {
      modelo: idModeloGemini(opts.model),
      status: resp.status,
      detalhe: sanitizarErroParaLog(detalhe || raw, opts.key),
    });
    const status = resp.status === 429 ? 429
      : resp.status >= 500 ? resp.status
      : resp.status === 403 ? 403
      : resp.status === 404 ? 404
      : 502;
    return {
      ok: false,
      status,
      error: mensagemAmigavel(status, detalhe, statusGrpc),
      retryable: erroTemporarioGemini(status, detalhe, statusGrpc) || status === 404,
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: 502, error: "A resposta do Gemini veio em formato inválido.", retryable: true };
  }

  const text = textoRespostaGemini(parsed);
  const finish = parsed?.candidates?.[0]?.finishReason;
  if (!text) {
    const block = parsed?.promptFeedback?.blockReason || parsed?.candidates?.[0]?.finishReason;
    return {
      ok: false,
      status: 502,
      error: finish === "MAX_TOKENS"
        ? "A resposta da IA ficou incompleta por excesso de conteúdo. Reduza anexos ou textos e tente novamente."
        : block
          ? `A IA não retornou texto utilizável (motivo: ${block}). Tente novamente.`
          : "A IA retornou uma resposta vazia. Tente novamente.",
      retryable: true,
    };
  }
  return { ok: true, text };
}

export async function orquestrarChamadasGemini(opts: {
  modelos: string[];
  chamar: (modelo: string) => Promise<ChamadaGemini>;
  maxTentativas?: number;
  signal?: AbortSignal;
}): Promise<ChamadaGemini & { modelo?: string; tentativas: number }> {
  const max = opts.maxTentativas ?? MAX_TENTATIVAS_GEMINI;
  let ultimo: ChamadaGemini = { ok: false, status: 503, error: mensagemGeminiIndisponivel(), retryable: true };
  let tentativas = 0;
  let ultimoModelo = opts.modelos[0];

  for (const modelo of opts.modelos) {
    ultimoModelo = modelo;
    for (let tentativa = 1; tentativa <= max; tentativa++) {
      if (opts.signal?.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        throw err;
      }
      tentativas += 1;
      const r = await opts.chamar(modelo);
      console.info("Gemini", { modelo, status: r.ok ? 200 : r.status, tentativa });
      if (r.ok) return { ...r, modelo, tentativas };
      ultimo = r;
      if (r.status === 404) break;
      if (!erroTemporarioGemini(r.status, r.error)) return { ...r, modelo, tentativas };
      if (tentativa < max) await esperarMs(esperaProgressivaMs(tentativa), opts.signal);
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

export async function chamarGeminiJson(opts: {
  key: string;
  model?: string;
  fallbackModel?: string | null;
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  signal?: AbortSignal;
}): Promise<ChamadaGemini & { modelo?: string; tentativas?: number }> {
  const primario = opts.model || env.geminiModel || "gemini-3.5-flash-lite";
  const fallback = opts.fallbackModel ?? env.geminiFallbackModel ?? "gemini-3.5-flash-lite";
  const modelos = filaModelosGemini(primario, fallback);
  if (!modelos.length) {
    return { ok: false, status: 502, error: "O modelo de IA configurado não está disponível neste momento.", retryable: false };
  }
  return orquestrarChamadasGemini({
    modelos,
    signal: opts.signal,
    chamar: (modelo) => chamarGeminiUmaVez({ ...opts, model: modelo }),
  });
}

export type PedidoGeracao = {
  systemPrompt: string;
  userContent: unknown[];
  schema: unknown;
  schemaName: string;
  posProcessar?: (output: any) => any;
};

export async function gerarJsonEstruturado(
  pedido: PedidoGeracao,
  signal?: AbortSignal,
): Promise<{ ok: true; output: any } | { ok: false; status: number; error: string; retryable?: boolean }> {
  const { deveUsarContingencia, gerarComContingencia } = await import("./failover.js");

  const tentarContingencia = async (status: number, error: string) => {
    if (!deveUsarContingencia(status, error)) return null;
    return gerarComContingencia(pedido, error, signal);
  };

  const key = env.geminiApiKey;
  if (!key) {
    const fb = await tentarContingencia(503, "GEMINI_API_KEY não configurada no servidor.");
    if (fb?.ok) {
      console.info("AI ok via contingência", { provedor: fb.provedor, modelo: fb.modelo });
      return { ok: true, output: fb.output };
    }
    if (fb && !fb.ok) return { ok: false, status: fb.status, error: fb.error, retryable: fb.retryable };
    return { ok: false, status: 503, error: "GEMINI_API_KEY não configurada no servidor.", retryable: false };
  }

  const result = await chamarGeminiJson({
    key,
    systemPrompt: pedido.systemPrompt,
    userContent: pedido.userContent,
    schema: pedido.schema,
    signal,
  });
  if (!result.ok) {
    const fb = await tentarContingencia(result.status, result.error);
    if (fb?.ok) {
      console.info("AI ok via contingência", { provedor: fb.provedor, modelo: fb.modelo });
      return { ok: true, output: fb.output };
    }
    if (fb && !fb.ok) {
      return {
        ok: false,
        status: fb.status,
        error: `Gemini indisponível e contingência falhou: ${fb.error}`,
        retryable: fb.retryable ?? true,
      };
    }
    return { ok: false, status: result.status, error: result.error, retryable: result.retryable };
  }
  try {
    const parsed = parsearJsonModelo(result.text);
    const output = pedido.posProcessar ? pedido.posProcessar(parsed) : parsed;
    // Não descarta resposta parcial: só rejeita se NÃO houver nenhum campo aplicável.
    if (saidaJsonVazia(output)) {
      console.error("Gemini saída sem campos aplicáveis", {
        schema: pedido.schemaName,
        preview: result.text.slice(0, 300),
        keys: output && typeof output === "object" ? Object.keys(output as object) : typeof output,
      });
      const msg = "A IA retornou JSON sem campos aplicáveis ao formulário. Tente novamente com mais detalhes no relato.";
      const fb = await tentarContingencia(502, msg);
      if (fb?.ok) {
        console.info("AI ok via contingência", { provedor: fb.provedor, modelo: fb.modelo });
        return { ok: true, output: fb.output };
      }
      return { ok: false, status: 502, error: msg, retryable: true };
    }
    return { ok: true, output };
  } catch (e) {
    const msg = (e as Error)?.message === "vazio"
      ? "A IA retornou texto vazio após o parse."
      : "A resposta da IA veio em formato inválido (JSON não pôde ser interpretado).";
    console.error("Gemini parse", { schema: pedido.schemaName, detail: (e as Error)?.message, preview: result.text.slice(0, 200) });
    const fb = await tentarContingencia(502, msg);
    if (fb?.ok) {
      console.info("AI ok via contingência", { provedor: fb.provedor, modelo: fb.modelo });
      return { ok: true, output: fb.output };
    }
    return { ok: false, status: 502, error: msg, retryable: true };
  }
}
