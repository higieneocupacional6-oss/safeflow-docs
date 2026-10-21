import { describe, it, expect } from "vitest";
import { nomePdfApr } from "../lib/aprErgoPdf";
describe("APR PDF filename", () => {
  it("uses registered sector/company and the requested year with safe characters", () => {
    expect(nomePdfApr("Operação / GHE 02", "Florestas Engenharia & Cia.")).toBe("APR_ERGO_Operacao_GHE_02_Florestas_Engenharia_Cia_2026.pdf");
  });
});