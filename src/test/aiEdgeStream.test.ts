import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiRequest: vi.fn(async (path: string) => {
    if (path === "/api/auth/csrf") return { csrfToken: "csrf-test" };
    throw new Error(`unexpected ${path}`);
  }),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: api.apiRequest,
}));

import { invocarGeracaoIa, saidaVaziaCliente } from "@/lib/aiEdgeStream";

describe("geração IA via API Express", () => {
  beforeEach(() => {
    api.apiRequest.mockReset();
    api.apiRequest.mockImplementation(async (path: string) => {
      if (path === "/api/auth/csrf") return { csrfToken: "csrf-test" };
      throw new Error(`unexpected ${path}`);
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("falha quando o CSRF não está disponível", async () => {
    api.apiRequest.mockRejectedValueOnce(new Error("offline"));
    await expect(invocarGeracaoIa("aet-vale-generate", {})).rejects.toThrow("Sessão expirada");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("lê o resultado mesmo sem quebra de linha final no NDJSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('{"type":"ping"}\n{"type":"result","output":{"parecer_ergonomia":"ok"}}', {
        headers: { "Content-Type": "application/x-ndjson" },
      }),
    );
    await expect(invocarGeracaoIa("aep-generate", {})).resolves.toEqual({ parecer_ergonomia: "ok" });
  });

  it("rejeita resposta vazia em vez de aplicar conteúdo em branco", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        '{"type":"result","output":{"riscos_ergonomicos":[],"checklist":[],"parecer_ergonomia":""}}\n',
        { headers: { "Content-Type": "application/x-ndjson" } },
      ),
    );
    await expect(invocarGeracaoIa("aep-generate", {})).rejects.toThrow("resposta vazia");
  });

  it("propaga erro NDJSON sem aplicar conteúdo", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        '{"type":"ping"}\n{"type":"error","error":"O Gemini está temporariamente indisponível. Seus dados foram mantidos."}\n',
        { headers: { "Content-Type": "application/x-ndjson" } },
      ),
    );
    await expect(invocarGeracaoIa("apr-ergo-generate", {})).rejects.toThrow("dados foram mantidos");
  });

  it("trata HTTP 401 como sessão expirada", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await expect(invocarGeracaoIa("aep-generate", {})).rejects.toThrow("Sessão expirada");
  });
});

describe("saidaVaziaCliente", () => {
  it("marca objeto sem campos úteis como vazio", () => {
    expect(saidaVaziaCliente({ riscos_ergonomicos: [], parecer_ergonomia: "   " })).toBe(true);
    expect(saidaVaziaCliente({ parecer_ergonomia: "Texto técnico." })).toBe(false);
  });
});
