import { describe, it, expect } from "vitest";
import { riscoMatchFlags, scopeSetores } from "@/lib/setorLoopScope";

const setores = [
  { nome_setor: "GHE 1", riscos: [{ agente_nome: "Ruído", is_ruido: true }] },
  { nome_setor: "GHE 2", riscos: [{ agente_nome: "Calor", is_calor: true }] },
  {
    nome_setor: "GHE 3",
    riscos: [
      { agente_nome: "Ruído", is_ruido: true },
      { agente_nome: "Poeira", is_quimico: true, is_quantitativo: true },
    ],
  },
];

describe("setorLoopScope", () => {
  it("mantém apenas setores com o agente do bloco", () => {
    const out = scopeSetores(setores, ["is_calor"]);
    expect(out.map((s: any) => s.nome_setor)).toEqual(["GHE 2"]);
  });

  it("filtra os riscos dentro do setor mantido", () => {
    const out = scopeSetores(setores, ["is_ruido"]);
    expect(out.map((s: any) => s.nome_setor)).toEqual(["GHE 1", "GHE 3"]);
    expect(out[1].riscos).toHaveLength(1);
  });

  it("sem flags, não altera a lista", () => {
    expect(scopeSetores(setores, [])).toBe(setores);
  });

  it("flags ausentes (removidas pela sanitização) são falsas", () => {
    expect(riscoMatchFlags({ agente_nome: "Calor" }, ["is_ruido"])).toBe(false);
  });
});
