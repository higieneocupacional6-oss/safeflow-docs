/**
 * Cadeia de contingência: Gemini (já tentado) → Groq → OpenRouter.
 * Só entra quando a falha do Gemini é recuperável (cota, 429, 5xx, etc.).
 */
import { env } from "../config/env.js";
import { chamarGroqJson, chamarOpenRouterJson } from "./chatCompletions.js";
import type { PedidoGeracao } from "./gemini.js";
import { parsearJsonModelo, saidaJsonVazia } from "./gemini.js";

export function deveUsarContingencia(status: number, error = ""): boolean {
  if (status === 429 || status === 502 || status === 503 || status === 504) return true;
  const t = String(error || "").toLowerCase();
  return /quota|billing|credit|resource.?exhausted|high demand|overloaded|unavailable|try again later|rate.?limit|too many|temporariamente indispon/i.test(t);
}

type ResultadoGeracao =
  | { ok: true; output: any; provedor: string; modelo?: string }
  | { ok: false; status: number; error: string; retryable?: boolean; provedor?: string };

async function processarTexto(
  text: string,
  pedido: PedidoGeracao,
  provedor: string,
  modelo?: string,
): Promise<ResultadoGeracao> {
  try {
    const parsed = parsearJsonModelo(text);
    const output = pedido.posProcessar ? pedido.posProcessar(parsed) : parsed;
    if (saidaJsonVazia(output)) {
      console.error("Contingência saída sem campos aplicáveis", {
        provedor,
        schema: pedido.schemaName,
        preview: text.slice(0, 300),
      });
      return {
        ok: false,
        status: 502,
        error: "A IA de contingência retornou JSON sem campos aplicáveis ao formulário.",
        retryable: true,
        provedor,
      };
    }
    return { ok: true, output, provedor, modelo };
  } catch (e) {
    console.error("Contingência parse", {
      provedor,
      schema: pedido.schemaName,
      detail: (e as Error)?.message,
      preview: text.slice(0, 200),
    });
    return {
      ok: false,
      status: 502,
      error: "A resposta da IA de contingência veio em formato inválido.",
      retryable: true,
      provedor,
    };
  }
}

/** Tenta Groq e depois OpenRouter. Retorna null se nenhuma chave de contingência existir. */
export async function gerarComContingencia(
  pedido: PedidoGeracao,
  motivoGemini: string,
  signal?: AbortSignal,
): Promise<ResultadoGeracao | null> {
  const temGroq = Boolean(env.groqApiKey);
  const temOr = Boolean(env.openRouterApiKey);
  if (!temGroq && !temOr) return null;

  console.warn("AI fallback: Gemini indisponível, tentando contingência", {
    motivo: String(motivoGemini || "").slice(0, 200),
    groq: temGroq,
    openrouter: temOr,
  });

  if (temGroq) {
    const r = await chamarGroqJson({
      systemPrompt: pedido.systemPrompt,
      userContent: pedido.userContent as unknown[],
      schema: pedido.schema,
      signal,
    });
    console.info("AI contingency", { provedor: "groq", modelo: r.modelo, ok: r.ok, status: r.ok ? 200 : r.status });
    if (r.ok) {
      const out = await processarTexto(r.text, pedido, "groq", r.modelo);
      if (out.ok) return out;
    }
  }

  if (temOr) {
    const r = await chamarOpenRouterJson({
      systemPrompt: pedido.systemPrompt,
      userContent: pedido.userContent as unknown[],
      schema: pedido.schema,
      signal,
    });
    console.info("AI contingency", { provedor: "openrouter", modelo: r.modelo, ok: r.ok, status: r.ok ? 200 : r.status });
    if (r.ok) {
      const out = await processarTexto(r.text, pedido, "openrouter", r.modelo);
      if (out.ok) return out;
      return out;
    }
    return {
      ok: false,
      status: r.status,
      error: r.error,
      retryable: r.retryable,
      provedor: "openrouter",
    };
  }

  return {
    ok: false,
    status: 503,
    error: "Gemini indisponível e a contingência Groq também falhou. Configure OPENROUTER_API_KEY ou tente mais tarde.",
    retryable: true,
    provedor: "groq",
  };
}
