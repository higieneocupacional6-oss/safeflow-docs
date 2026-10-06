// Chamada à IA com resposta em fluxo (NDJSON) para o navegador.
// Motivo: gerações longas (~3 min) excediam o tempo ocioso da Edge Function quando a
// resposta era montada inteira antes de responder, fechando a conexão ("non-2xx").
// Aqui o cliente recebe "ping" periódicos e, ao final, {type:"result"} ou {type:"error"}.

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
} from "./run-id.ts";

const MAX_TEXT_CHARS = 180_000;
const MAX_ANEXO_BYTES_TOTAL = 18 * 1024 * 1024;

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

function mensagemAmigavel(status: number, detalhe: string): string {
  if (status === 429) return "Muitas solicitações de IA no momento. Aguarde alguns instantes e tente novamente.";
  if (status === 402) return detalhe || "Créditos de IA insuficientes. Adicione créditos no workspace.";
  if (status === 403) return detalhe || "Uso de IA bloqueado para este workspace.";
  if (status === 400) return "Os dados enviados não puderam ser processados pela IA. Reduza anexos ou textos muito extensos e tente novamente.";
  if (status >= 500) return "O serviço de IA está temporariamente indisponível. Tente novamente em instantes.";
  return detalhe || "A geração com IA não pôde ser concluída.";
}

export async function gerarJsonEmFluxo(opts: {
  req: Request;
  corsHeaders: Record<string, string>;
  key: string;
  systemPrompt: string;
  userContent: unknown[];
  schemaName: string;
  schema: unknown;
}): Promise<Response> {
  const { req, corsHeaders, key } = opts;
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const gateway = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));

  const resp = await gateway.fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    signal: req.signal,
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: [
        { role: "system", content: [{ type: "input_text", text: opts.systemPrompt }] },
        { role: "user", content: opts.userContent },
      ],
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema } },
    }),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => "");
    console.error("Gateway error", resp.status, errText.slice(0, 1000));
    let detalhe = "";
    try {
      const p = JSON.parse(errText);
      detalhe = p?.message || p?.error?.message || "";
    } catch { /* texto não-JSON */ }
    const status = resp.ok ? 502 : resp.status;
    return new Response(JSON.stringify({ error: mensagemAmigavel(status, detalhe), retryable: status === 429 || status >= 500 }), {
      status, headers: jsonHeaders,
    });
  }

  const headers = getLovableAiGatewayResponseHeaders(resp.headers, {
    ...corsHeaders,
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache",
  });
  const encoder = new TextEncoder();
  const upstream = resp.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch { /* fechado */ }
      };
      send({ type: "ping" });
      const ping = setInterval(() => send({ type: "ping" }), 10_000);
      const decoder = new TextDecoder();
      let buffer = "";
      let raw = "";
      let incompleto = false;
      try {
        while (true) {
          const { done, value } = await upstream.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const event of events) {
            const dataLine = event.split("\n").find((l) => l.startsWith("data:"));
            const data = dataLine?.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            let payload: any;
            try { payload = JSON.parse(data); } catch { continue; }
            if (payload.type === "response.output_text.delta") raw += payload.delta || "";
            else if (payload.type === "response.incomplete") incompleto = true;
            else if (payload.type === "error" || payload.type === "response.failed") {
              throw new Error(payload.error?.message || payload.response?.error?.message || "A IA não concluiu a geração.");
            }
          }
        }
        if (!raw.trim()) {
          send({ type: "error", error: "A IA retornou uma resposta vazia. Tente novamente.", retryable: true });
        } else {
          try {
            send({ type: "result", output: JSON.parse(raw) });
          } catch {
            send({
              type: "error",
              error: incompleto
                ? "A resposta da IA ficou incompleta por excesso de conteúdo. Reduza anexos ou textos e tente novamente."
                : "A resposta da IA veio em formato inválido. Tente novamente.",
              retryable: true,
            });
          }
        }
      } catch (e) {
        if (!req.signal.aborted) {
          console.error("Stream error", e);
          send({ type: "error", error: (e as Error).message || "Falha durante a geração com IA.", retryable: true });
        }
      } finally {
        clearInterval(ping);
        try { controller.close(); } catch { /* já fechado */ }
      }
    },
    cancel() {
      upstream.cancel().catch(() => {});
    },
  });

  return new Response(stream, { status: 200, headers });
}
