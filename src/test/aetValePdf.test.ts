import { describe, expect, it } from "vitest";
import { gerarPdfVale, nomePdfVale, SECOES_PDF_VALE } from "@/lib/aetValePdf";
import { dadosVaziosAetVale } from "@/lib/aetVale";
import { TEXTOS_ETAPA2, CHECKS_ETAPA2 } from "../../supabase/functions/_shared/aetValeIa";
describe("PDF AET VALE", () => {
  it("trata nomes especiais no arquivo", () => expect(nomePdfVale("Empresa São José / Norte", "Técnico (campo)")).toBe("AET_VALE_Empresa_Sao_Jose_Norte_Tecnico_campo.pdf"));
  it("exporta todos os campos técnicos e checklists", () => {
    expect(SECOES_PDF_VALE.flatMap(s => [...s[1]]).sort()).toEqual(Object.keys(TEXTOS_ETAPA2).sort());
    expect(SECOES_PDF_VALE.flatMap(s => [...s[2]]).sort()).toEqual(Object.keys(CHECKS_ETAPA2).sort());
  });
  it("gera arquivo não vazio mesmo com texto longo e ações", () => {
    const dados=dadosVaziosAetVale("Operador"); dados.analise_atividade="Atividade real com condições e esforços. ".repeat(300);
    dados.etapa2.plano=[{fator_id:"r1",o_que:"Adequar bancada",por_que:"Reduzir flexão",onde:"Oficina",quando:"",quem:"",como:"Instalar ajuste",quanto:""}];
    const blob=gerarPdfVale(dados,"Empresa",[],[]); expect(blob.type).toBe("application/pdf"); expect(blob.size).toBeGreaterThan(3000);
  });
});