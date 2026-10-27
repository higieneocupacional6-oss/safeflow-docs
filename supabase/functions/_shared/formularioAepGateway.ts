import { GEMINI_MODELO_PADRAO, partesGeminiDeConteudo, schemaEstrito, esperarMs, type ChamadaGemini } from "./aiStream.ts";
import { createLovableAiGatewayRunIdFetch } from "./run-id.ts";

// Repair only Formulário AEP's provider configuration; retain its Gemini model and schema.
export function pedidoFormularioAep(systemPrompt: string, userContent: unknown[], schema: unknown) {
  const { textParts, inlineParts } = partesGeminiDeConteudo(userContent);
  const content = [
    ...inlineParts.map((part) => {
      const { mime_type, data } = part.inline_data;
      return mime_type.startsWith("image/")
        ? { type: "image_url", image_url: { url: `data:${mime_type};base64,${data}` } }
        : { type: "file", file: { filename: "base.pdf", file_data: `data:${mime_type};base64,${data}` } };
    }),
    ...textParts.map((part) => ({ type: "text", text: part.text })),
  ];
  return {
    model: `google/${GEMINI_MODELO_PADRAO}`,
    stream: true,
    temperature: 0.2,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content }],
    response_format: { type: "json_schema", json_schema: { name: "formulario_aep", strict: true, schema: schemaEstrito(schema) } },
  };
}

export async function textoFluxoFormulario(response: Response): Promise<string> {
  if (!response.body) throw new Error("A IA não retornou conteúdo.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const consume = (line: string) => {
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") return;
    const event = JSON.parse(raw);
    if (event.error) throw new Error("A geração foi interrompida pelo serviço de IA.");
    for (const choice of event.choices || []) {
      if (choice.delta?.refusal || choice.finish_reason === "content_filter") throw new Error("O serviço de IA recusou esta solicitação.");
      if (choice.finish_reason === "length") throw new Error("A resposta da IA ficou incompleta.");
      if (typeof choice.delta?.content === "string") text += choice.delta.content;
    }
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(consume);
      if (chunk.done) { consume(buffer); break; }
    }
    return text.trim();
  } finally { reader.releaseLock(); }
}

export async function chamarFormularioAepGateway(opts: {
  key: string; systemPrompt: string; userContent: unknown[]; schema: unknown; signal?: AbortSignal;
}): Promise<ChamadaGemini> {
  const gateway = createLovableAiGatewayRunIdFetch();
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await gateway.fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", signal: opts.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": opts.key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify(pedidoFormularioAep(opts.systemPrompt, opts.userContent, opts.schema)),
    });
    if (response.ok) {
      try {
        const text = await textoFluxoFormulario(response);
        return text ? { ok: true, text } : { ok: false, status: 502, error: "A IA retornou uma resposta vazia. Seus dados foram mantidos.", retryable: false };
      } catch (error) {
        if (opts.signal?.aborted) throw error;
        return { ok: false, status: 502, error: (error as Error).message, retryable: false };
      }
    }
    const payload = await response.json().catch(() => ({}));
    const rawMessage = payload.message || payload.error?.message || (typeof payload.error === "string" ? payload.error : "");
    const message = String(rawMessage || "A geração com IA não pôde ser concluída. Seus dados foram mantidos.").split(opts.key).join("[redacted]");
    const retryable = (response.status === 429 || response.status >= 500) && payload.props?.retryable !== false && !payload.props?.requires;
    if (!retryable || attempt === 3) return { ok: false, status: response.status, error: message, retryable };
    const retryAfter = Number(response.headers.get("Retry-After"));
    await esperarMs(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** (attempt - 1), opts.signal);
  }
  return { ok: false, status: 503, error: "A IA está temporariamente indisponível.", retryable: true };
}