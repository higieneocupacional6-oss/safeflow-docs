import { describe, expect, it } from "vitest";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { ltcatEvaluationFields, ltcatRiskFields } from "@/lib/ltcatRiskFields";
import { formatDateOnly } from "@/lib/dateOnly";
import { createAgentScopedParser } from "@/lib/setorLoopScope";
import { sanitizeRiscosForTest } from "./ltcatRiskFixture";

describe.each(["LTCAT", "INSALUBRIDADE"])("%s qualitative document generation", documentType => {
  it.each(["fisico", "quimico", "biologico"])("renders four fields only for matching %s risk", type => {
    const techniques = [{ id: "tech", nome: `Técnica ${type}` }];
    const risk = { tipo_exposicao: `Exposição ${type}`, tecnica_id: "tech", descricao_tecnica: `Descrição ${type}` };
    const row = { colaborador: `Pessoa ${type}` };
    const evaluations = [{ ...ltcatEvaluationFields(risk, row, techniques), data_avaliacao: formatDateOnly("2026-10-29") }];
    const fields = ltcatRiskFields([risk], evaluations, techniques);
    const matching = { ...fields, avaliacoes: evaluations, [`is_qualitativo_${type}`]: true };
    const risks = sanitizeRiscosForTest([matching, { descricao_avaliacao: "OUTRO RISCO", is_qualitativo_outro: true }]);
    const zip = new PizZip();
    zip.file("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file("word/document.xml", `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{#riscos}}{{#is_qualitativo_${type}}}{{descricao_avaliacao}}|{{colaborador}}|{{tecnica_amostragem}}|{{tipo_exposicao}}{{#avaliacoes}}|{{data_avaliacao}}{{/avaliacoes}}{{/is_qualitativo_${type}}}{{/riscos}}</w:t></w:r></w:p></w:body></w:document>`);
    const doc = new Docxtemplater(zip, { delimiters: { start: "{{", end: "}}" }, parser: createAgentScopedParser() });
    doc.render({ tipo: documentType, riscos: risks });
    const xml = doc.getZip().file("word/document.xml")?.asText() || "";
    expect(xml).toContain(`Descrição ${type}|Pessoa ${type}|Técnica ${type}|Exposição ${type}|29/10/2026`);
    expect(xml).not.toContain("OUTRO RISCO");
  });
});