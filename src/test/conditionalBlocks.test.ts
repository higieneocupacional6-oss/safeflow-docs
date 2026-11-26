import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import {
  computePresentBlocks,
  stripConditionalBlocksDocx,
} from "@/lib/conditionalBlocks";
import { buildMetalQuantitativeFlags } from "@/lib/agentFlags";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const paragraph = (text: string) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
const splitMarker = (prefix: string, suffix: string) =>
  `<w:p><w:r><w:t>${prefix}</w:t></w:r><w:r><w:t>${suffix}</w:t></w:r></w:p>`;

const makeDocx = () => {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}"><w:body>
    ${splitMarker("#inicio_texto_fumos", "metalicos_quantitativo")}
    <w:tbl><w:tr><w:tc>${paragraph("CONTEUDO_FUMOS")}</w:tc></w:tr></w:tbl>
    ${splitMarker("#fim_texto_fumosmetalicos_", "quantitativo")}
    ${splitMarker("#inicio_texto_poeirasmetalicas_", "quantitativo")}
    <w:tbl><w:tr><w:tc>${paragraph("CONTEUDO_POEIRAS")}</w:tc></w:tr></w:tbl>
    ${splitMarker("#fim_texto_poeiras", "metalicas_quantitativo")}
    <w:sectPr/>
  </w:body></w:document>`);
  const bytes = zip.generate({ type: "uint8array" });
  return {
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as Blob;
};

const readBlob = (blob: Blob): Promise<ArrayBuffer> => {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
};

const risk = (name: string, result = "1") => ({
  agente_nome: name,
  tipo_avaliacao: "Quantitativa",
  is_quantitativo: true,
  avaliacoes: [{ resultado: result }],
});

const renderScenario = async (risks: any[]) => {
  const setores = [{ riscos: risks.map((item) => ({
    ...item,
    ...buildMetalQuantitativeFlags(item),
  })) }];
  const output = await stripConditionalBlocksDocx(makeDocx(), computePresentBlocks({ setores }));
  const zip = new PizZip(await readBlob(output));
  return zip.file("word/document.xml")?.asText() || "";
};

describe("conditionalBlocks Ruído", () => {
  it("ativa risco_ruido para agente cadastrado só como Ruído", () => {
    const present = computePresentBlocks({
      setores: [{
        riscos: [{
          agente_nome: "Ruído",
          is_fisico: true,
          is_ruido: true,
          is_quantitativo: true,
          tipo_avaliacao: "Quantitativa",
        }],
      }],
    });
    expect(present.has("risco_ruido")).toBe(true);
  });

  it("ativa risco_ruido por nome mesmo sem flag is_ruido", () => {
    const present = computePresentBlocks({
      setores: [{
        riscos: [{
          agente_nome: "Ruído contínuo ou intermitente",
          is_fisico: true,
          is_quantitativo: true,
        }],
      }],
    });
    expect(present.has("risco_ruido")).toBe(true);
  });
});

describe("conditionalBlocks qualitativo", () => {
  it("ativa risco_fisico_qualitativo por tipo_avaliacao sem flag is_qualitativo", () => {
    const present = computePresentBlocks({
      setores: [{
        riscos: [{
          agente_nome: "Umidade",
          is_fisico: true,
          tipo_avaliacao: "Qualitativa",
        }],
      }],
    });
    expect(present.has("risco_fisico_qualitativo")).toBe(true);
  });
});

describe("conditionalBlocks seções Umidade/Frio/Cimento/Hidrocarbonetos/Poeira madeira", () => {
  it.each([
    ["Umidade", "risco_umidade"],
    ["Frio", "risco_frio"],
    ["Cimento", "risco_cimento"],
    ["Hidrocarbonetos", "risco_hidrocarbonetos"],
    ["Poeira de Madeira", "risco_poeira_madeira"],
    ["Pó de madeira", "risco_poeira_madeira"],
  ])("ativa %s → %s", (nome, block) => {
    const present = computePresentBlocks({
      setores: [{ riscos: [{ agente_nome: nome }] }],
    });
    expect(present.has(block)).toBe(true);
  });
});

describe("conditionalBlocks DOCX para agentes metálicos", () => {
  it.each([
    ["fumos metálicos", [risk("Fumos metálicos")], true, false],
    ["poeiras metálicas", [risk("Poeiras metálicas")], false, true],
    ["ambos", [risk("Fumos metálicos"), risk("Poeiras metálicas")], true, true],
    ["nenhum", [], false, false],
  ])("processa o cenário %s", async (_name, risks, keepsFumes, keepsDust) => {
    const xml = await renderScenario(risks as any[]);
    expect(xml.includes("CONTEUDO_FUMOS")).toBe(keepsFumes);
    expect(xml.includes("CONTEUDO_POEIRAS")).toBe(keepsDust);
    expect(xml).not.toMatch(/#(?:inicio|fim)_texto_/i);
  });

  it("não ativa condição sem resultado ou em avaliação qualitativa", () => {
    expect(buildMetalQuantitativeFlags(risk("Fumos metálicos", "")).is_fumosmetalicos).toBe(false);
    expect(buildMetalQuantitativeFlags({ ...risk("Poeiras metálicas"), tipo_avaliacao: "Qualitativa", is_quantitativo: false }).is_poeirasmetalicas).toBe(false);
  });
});