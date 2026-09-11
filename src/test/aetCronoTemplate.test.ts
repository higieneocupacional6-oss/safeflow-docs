import { describe, expect, it } from "vitest";
import Mustache from "mustache";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { buildAetCronoTemplateData } from "@/lib/aetCronoTemplate";

const rows = [
  { tarefa: "Preparação de materiais", tempo: "30 min", risco: "Postura em pé" },
  { tarefa: "Operação do equipamento", tempo: "45 min", risco: "Movimentos repetitivos" },
  { tarefa: "Organização do ambiente", tempo: "20 min", risco: "Flexão de tronco" },
];

describe("AET cronoanalysis template data", () => {
  it("fills all three scalar variables with every persisted row", () => {
    const data = buildAetCronoTemplateData(rows);

    expect(data.tarefas).toBe(rows.map((row) => row.tarefa).join("\n"));
    expect(data.tempo).toBe(rows.map((row) => row.tempo).join("\n"));
    expect(data.riscos_observados).toBe(rows.map((row) => row.risco).join("\n"));
  });

  it("supports plural variables and legacy singular aliases in loops", () => {
    const data = buildAetCronoTemplateData(rows);
    const plural = Mustache.render(
      "{{#cronoanalise}}{{tarefas}}|{{tempo}}|{{riscos_observados}}\n{{/cronoanalise}}",
      data,
    );
    const singular = Mustache.render(
      "{{#cronoanalise}}{{tarefa}}|{{tempo}}|{{risco}}\n{{/cronoanalise}}",
      data,
    );

    expect(plural).toContain("Organização do ambiente|20 min|Flexão de tronco");
    expect(singular).toContain("Operação do equipamento|45 min|Movimentos repetitivos");
    expect(data.cronoanalise).toHaveLength(3);
  });

  it("rebuilds identical template data after JSON persistence", () => {
    const persisted = JSON.parse(JSON.stringify(rows));
    expect(buildAetCronoTemplateData(persisted)).toEqual(buildAetCronoTemplateData(rows));
  });

  it("renders every row in a DOCX template with the requested variables", () => {
    const zip = new PizZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.folder("word")?.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{tarefas}}</w:t></w:r></w:p><w:p><w:r><w:t>{{tempo}}</w:t></w:r></w:p><w:p><w:r><w:t>{{riscos_observados}}</w:t></w:r></w:p><w:p><w:r><w:t>{{#cronoanalise}}{{tarefas}}|{{tempo}}|{{riscos_observados}};{{/cronoanalise}}</w:t></w:r></w:p></w:body></w:document>`);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });
    doc.render(buildAetCronoTemplateData(rows));

    const xml = doc.getZip().file("word/document.xml")?.asText() || "";
    expect(xml).toContain("Preparação de materiais");
    expect(xml).toContain("45 min");
    expect(xml).toContain("Flexão de tronco");
    expect(xml).toContain("Organização do ambiente|20 min|Flexão de tronco");
  });
});