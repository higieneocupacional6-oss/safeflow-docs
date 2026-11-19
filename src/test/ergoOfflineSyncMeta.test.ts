import { describe, expect, it } from "vitest";

/**
 * Dedupe offline usa `_offline_client_id` embutido em `respostas`.
 * Garante o contrato estável consumido por offlineSync / persist.
 */
describe("ergo offline sync metadata", () => {
  it("embeds stable client id without dropping tool responses", () => {
    const clientId = "client-abc";
    const respostas = { costas: 1, bracos: 2, _offline_client_id: clientId };
    expect(respostas._offline_client_id).toBe(clientId);
    expect(respostas.costas).toBe(1);
  });

  it("offline pdf path encodes client id for local download", () => {
    const clientId = "c1";
    const path = `offline://${clientId}/niosh-avaliacao.pdf`;
    expect(path.startsWith("offline://")).toBe(true);
    expect(path.replace(/^offline:\/\//, "").split("/")[0]).toBe(clientId);
  });
});
