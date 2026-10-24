import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { invocarGeracaoIa } from "@/lib/aiEdgeStream";
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
});