import { describe, it, expect } from "vitest";
import PizZip from "pizzip";
import { gerarPlanoAprDocx, nomeArquivoPlanoDocx } from "@/lib/aprErgoPlanoDocx";
import { novaAcaoPlanoApr } from "@/lib/aprErgoPlano";

describe("Word do plano APR-ERGO", () => {
  it("inclui todos os setores, riscos e ações", async () => {
    const a = { ...novaAcaoPlanoApr("1"), setor: "GERE 01", risco: "Postura inadequada", o_que: "Ajustar bancada" };
    const b = { ...novaAcaoPlanoApr("2"), setor: "GERE 02", risco: "Levantamento de carga", o_que: "Instalar talha" };
    const blob = await gerarPlanoAprDocx([a, b], "Empresa X", "C-1");
    const zip = new PizZip(await new Response(blob).arrayBuffer());
    const xml = zip.file("word/document.xml")!.asText();
    for (const t of ["GERE 01", "GERE 02", "Postura inadequada", "Levantamento de carga", "Ajustar bancada", "Instalar talha"]) expect(xml).toContain(t);
  });
  it("nomeia arquivo sem caracteres especiais", () => {
    expect(nomeArquivoPlanoDocx("Florestas Engenharia Ltda.", "Nº 12/26")).toBe("Plano_Acao_APR_ERGO_Florestas_Engenharia_Ltda_N_12_26.docx");
  });
});
