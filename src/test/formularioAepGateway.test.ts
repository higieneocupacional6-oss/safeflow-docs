import { afterEach, describe, expect, it, vi } from "vitest";
import { chamarFormularioAepGateway, pedidoFormularioAep, textoFluxoFormulario } from "../../supabase/functions/_shared/formularioAepGateway";

afterEach(() => vi.unstubAllGlobals());
const opts = { key: "test-private-key", systemPrompt: "JSON", userContent: [{ type: "input_text", text: "Atividade real" }], schema: { type: "object", properties: { descricao: { type: "string" } } } };
describe("Formulário AEP — serviço configurado", () => {
  it("mantém modelo, critérios e PDFs no contrato do gateway", () => {
    const body = pedidoFormularioAep(opts.systemPrompt, [...opts.userContent, { type: "input_file", filename: "base.pdf", file_data: "data:application/pdf;base64,YWJj" }], opts.schema);
    expect(body.model).toBe("google/gemini-3.8-flash");
    expect(body.stream).toBe(true);
    expect(body.temperature).toBe(0.2);
    expect(body.messages[1].content).toContainEqual({ type: "file", file: { filename: "base.pdf", file_data: "data:application/pdf;base64,YWJj" } });
  });
  it("gera com a chave gerenciada sem consultar GEMINI_API_KEY", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"{\\"descricao\\":\\"Real\\"}"}}]}\n\ndata: [DONE]\n'));
    vi.stubGlobal("fetch", fetch);
    expect(await chamarFormularioAepGateway(opts)).toEqual({ ok: true, text: '{"descricao":"Real"}' });
    expect(fetch.mock.calls[0][1].headers.get("Lovable-API-Key")).toBe(opts.key);
    expect(fetch.mock.calls[0][0]).toBe("https://ai.gateway.lovable.dev/v1/chat/completions");
  });
  it("não repete recusa de acesso nem devolve dados fictícios", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Acesso negado" } }), { status: 403 }));
    vi.stubGlobal("fetch", fetch);
    expect(await chamarFormularioAepGateway(opts)).toEqual({ ok: false, status: 403, error: "Acesso negado", retryable: false });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("remove opção vazia de enum e usa o nome do schema da geração", () => {
    const body = pedidoFormularioAep("JSON", opts.userContent, { type: "object", properties: { estimativa: { type: "string", enum: ["", "Raro"] } } }, "apr_ergo");
    expect(body.response_format.json_schema.name).toBe("apr_ergo");
    expect(body.response_format.json_schema.schema.properties.estimativa.enum).toEqual(["Raro"]);
  });
  it("não aplica resultado truncado", async () => {
    await expect(textoFluxoFormulario(new Response('data: {"choices":[{"delta":{"content":"parcial"},"finish_reason":"length"}]}\n'))).rejects.toThrow("incompleta");
  });
});