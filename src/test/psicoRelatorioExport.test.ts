import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { sortGroupsNumerically } from "@/lib/sortGes";
import { buildPsicossocialDocxHtml, gerarDocxPsicossocial } from "@/lib/psicoRelatorioDocx";
import type { GrupoRelatorio } from "@/lib/psicoRelatorio";
import type { PdfPayload } from "@/lib/psicoRelatorioPdf";

const grupo = (setor: string, ghe: string): GrupoRelatorio => ({
  id: `${setor}||${ghe}`, setor, ghe, funcoes: [], trabalhadores: 1, atividades: "Atividades",
  jornada: "8 horas", organizacao: "Organização", fatores: [], respondentes: 1,
});

const payload = (grupos: GrupoRelatorio[]): PdfPayload => ({
  empresa: { razao_social: "Empresa Teste" }, contrato: { numero_contrato: "1" },
  identificacao: { nome_fantasia: "Teste", cnpj: "00", cnae: "00", endereco: "Rua", unidade: "Unidade", responsavel_nome: "Responsável", responsavel_registro: "Registro", data_avaliacao: "05/10/2026" },
  metodologia: "Metodologia", grupos, medidas: [], conclusao: "Conclusão", indicadores: {},
  historico: "Histórico", registros: { versao: "1.0", aplicador: "Aplicador", responsavel_empresa: "Empresa", data: "05/10/2026" },
  titulo: "Avaliação Psicossocial", interpretacaoIndicadores: "Sem indicadores", introPlanoAcao: "Plano",
});

const lerBlob = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer);
  reader.onerror = () => reject(reader.error);
  reader.readAsArrayBuffer(blob);
});

describe("Ordenação e exportação dos relatórios Psicossociais", () => {
  it("ordena Setores e GHE/GES numericamente, sem alterar os registros", () => {
    const entrada = [grupo("GERE 10", "GHE 10"), grupo("GERE 02", "GHE 2"), grupo("GERE 01", "GHE 1")];
    const ordenada = sortGroupsNumerically(entrada);
    expect(ordenada.map((g) => g.setor)).toEqual(["GERE 01", "GERE 02", "GERE 10"]);
    expect(entrada.map((g) => g.setor)).toEqual(["GERE 10", "GERE 02", "GERE 01"]);
  });

  it("usa GHE/GES como segundo critério numérico e mantém estabilidade", () => {
    const entrada = [grupo("GERE 01", "GES 10"), grupo("GERE 01", "GES 01"), grupo("GERE 01", "GES 02")];
    expect(sortGroupsNumerically(entrada).map((g) => g.ghe)).toEqual(["GES 01", "GES 02", "GES 10"]);
    const semNumero = [grupo("Administrativo", "A"), grupo("Operacional", "B")];
    expect(sortGroupsNumerically(semNumero)).toEqual(semNumero);
  });

  it("mantém a ordem numérica no conteúdo Word", () => {
    const html = buildPsicossocialDocxHtml(payload([grupo("GERE 10", "GHE 10"), grupo("GERE 2", "GHE 2"), grupo("GERE 01", "GHE 1")]));
    expect(html.indexOf("GERE 01")).toBeLessThan(html.indexOf("GERE 2"));
    expect(html.indexOf("GERE 2")).toBeLessThan(html.indexOf("GERE 10"));
    expect(html).toContain("Plano de ação");
    expect(html).toContain("Responsáveis e registros");
  });

  it("gera DOCX válido com documento, cabeçalho, rodapé e tabelas", async () => {
    const { blob, nome } = await gerarDocxPsicossocial(payload([grupo("GERE 01", "GHE 1")]));
    const zip = await JSZip.loadAsync(await lerBlob(blob));
    const documento = await zip.file("word/document.xml")?.async("string");
    expect(nome).toMatch(/\.docx$/);
    expect(documento).toContain("GERE 01");
    expect(documento).toContain("w:tbl");
    expect(Object.keys(zip.files).some((path) => path.startsWith("word/header"))).toBe(true);
    expect(Object.keys(zip.files).some((path) => path.startsWith("word/footer"))).toBe(true);
  });
});