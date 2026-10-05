import { describe, expect, it } from "vitest";
import {
  medidasDosGrupos, mesclarMedidasPlano, type FatorRisco, type GrupoRelatorio,
} from "@/lib/psicoRelatorio";

const fator = (key: string, nivel: FatorRisco["nivel"], sustentado = true): FatorRisco => ({
  key,
  fator: key,
  descricao: "",
  fonte: "",
  situacao: "",
  expostos: 1,
  frequencia: "",
  probabilidade: nivel === "Baixo" ? 1 : nivel === "Médio" ? 2 : nivel === "Alto" ? 3 : 4,
  severidade: nivel === "Baixo" ? 1 : nivel === "Médio" ? 2 : nivel === "Alto" ? 3 : 4,
  nivel,
  consequencias: "",
  controles: "",
  media: 60,
  sustentado,
  interpretacao: "",
});

const grupo = (fatores: FatorRisco[]): GrupoRelatorio => ({
  id: "setor-a||ghe-1",
  setor: "Setor A",
  ghe: "GHE 1",
  funcoes: ["Função A"],
  trabalhadores: 1,
  atividades: "",
  jornada: "",
  organizacao: "",
  fatores,
  respondentes: 1,
});

describe("Plano de Ação Psicossocial", () => {
  it("gera ações somente para riscos Médios e Altos", () => {
    const medidas = medidasDosGrupos([
      grupo([
        fator("exigencias", "Baixo"),
        fator("controle", "Médio"),
        fator("apoio", "Alto"),
        fator("conflitos", "Crítico"),
        fator("sintomas", "Médio", false),
      ]),
    ]);

    expect(medidas.map((m) => m.risco)).toEqual(["controle", "apoio"]);
    expect(medidas.map((m) => m.prioridade)).toEqual(["Média", "Alta"]);
    expect(medidas.some((m) => m.tipo === "Monitoramento" || m.prioridade === "Manutenção")).toBe(false);
  });

  it("não duplica ações com a mesma chave", () => {
    const g = grupo([fator("controle", "Médio"), fator("controle", "Médio")]);
    expect(medidasDosGrupos([g])).toHaveLength(1);
  });

  it("preserva edição salva e mantém exclusão após reabertura", () => {
    const grupos = [grupo([fator("controle", "Médio"), fator("apoio", "Alto")])];
    const base = medidasDosGrupos(grupos);
    const editada = { ...base[0], medida: "Ação revisada" };
    const reabertas = mesclarMedidasPlano(grupos, [editada], [base[1].key]);

    expect(reabertas).toHaveLength(1);
    expect(reabertas[0].medida).toBe("Ação revisada");
  });

  it("recria somente ações atualmente elegíveis quando exclusões são limpas", () => {
    const grupos = [grupo([fator("controle", "Médio"), fator("apoio", "Alto")])];
    expect(mesclarMedidasPlano(grupos, [], [])).toHaveLength(2);
  });
});