import { describe, expect, it } from "vitest";
import Mustache from "mustache";
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
});