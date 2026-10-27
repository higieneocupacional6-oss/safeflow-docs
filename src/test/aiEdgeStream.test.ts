import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { invocarGeracaoIa, saidaVaziaCliente } from "@/lib/aiEdgeStream";

const sessaoValida = () => {
  auth.getSession.mockResolvedValue({ data: { session: { access_token: "tok", expires_at: 9999999999 } } });
};

describe("sessão da geração IA", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", vi.fn()); });
  it("não envia chave pública como token de usuário sem sessão", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(invocarGeracaoIa("aet-vale-generate", {})).rejects.toThrow("Sessão expirada");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("renova uma vez ao receber 401 e retorna a análise", async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: "old", expires_at: 9999999999 } } });
    auth.refreshSession.mockResolvedValue({ data: { session: { access_token: "renewed" } } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 401 })).mockResolvedValueOnce(new Response('{"type":"result","output":{"ok":true}}\n', { headers: { "Content-Type": "application/x-ndjson" } }));
    await expect(invocarGeracaoIa("aet-vale-generate", {})).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1][1]?.headers).toMatchObject({ Authorization: "Bearer renewed" });
  });
  it("lê o resultado mesmo sem quebra de linha final no NDJSON", async () => {
    sessaoValida();
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"type":"ping"}\n{"type":"result","output":{"parecer_ergonomia":"ok"}}', { headers: { "Content-Type": "application/x-ndjson" } }));
    await expect(invocarGeracaoIa("aep-generate", {})).resolves.toEqual({ parecer_ergonomia: "ok" });
  });
  it("rejeita resposta vazia em vez de aplicar conteúdo em branco", async () => {
    sessaoValida();
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"type":"result","output":{"riscos_ergonomicos":[],"checklist":[],"parecer_ergonomia":""}}\n', { headers: { "Content-Type": "application/x-ndjson" } }));
    await expect(invocarGeracaoIa("aep-generate", {})).rejects.toThrow("resposta vazia");
  });
  it("propaga esgotamento 503 sem aplicar conteúdo", async () => {
    sessaoValida();
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"type":"ping"}\n{"type":"error","error":"O Gemini está temporariamente indisponível por alta demanda ou limite de uso. Seus dados foram mantidos. Aguarde alguns instantes e tente novamente.","retryable":true}\n', { headers: { "Content-Type": "application/x-ndjson" } }));
    await expect(invocarGeracaoIa("apr-ergo-generate", {})).rejects.toThrow("dados foram mantidos");
  });
  it("trata HTTP 400 de JWT como sessão expirada, sem desligar a autenticação", async () => {
    sessaoValida();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ code: 400, message: "invalid JWT: bad_jwt" }), { status: 400, headers: { "Content-Type": "application/json" } }));
    await expect(invocarGeracaoIa("aep-generate", {})).rejects.toThrow("Sessão expirada");
  });
});

describe("saidaVaziaCliente", () => {
  it("marca objeto sem campos úteis como vazio", () => {
    expect(saidaVaziaCliente({ riscos_ergonomicos: [], parecer_ergonomia: "   " })).toBe(true);
    expect(saidaVaziaCliente({ parecer_ergonomia: "Texto técnico." })).toBe(false);
  });
});