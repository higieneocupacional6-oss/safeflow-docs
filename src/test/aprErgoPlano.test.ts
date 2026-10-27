import { describe, it, expect } from "vitest";
import {
  acoesDoPlano, aplicarPropostaPlano, novaAcaoPlanoApr, prioridadeDaClassificacao,
  riscosAprParaPlano,
} from "@/lib/aprErgoPlano";

const setores = [
  { id: "s1", empresa_id: "e1", contrato_id: "c1", nome_setor: "GERE 01", ghe_ges: "GHE 01", funcoes: [{ id: "f1", nome_funcao: "Operador" }] },
];

describe("Plano de ação APR-ERGO", () => {
  it("prioridade deriva da classificação da matriz", () => {
    expect(prioridadeDaClassificacao("MUITO ALTO")).toBe("Alta");
    expect(prioridadeDaClassificacao("ALTO")).toBe("Alta");
    expect(prioridadeDaClassificacao("MÉDIO")).toBe("Média");
    expect(prioridadeDaClassificacao("BAIXO")).toBe("Baixa");
    expect(prioridadeDaClassificacao("SEM RISCO")).toBe("");
    expect(prioridadeDaClassificacao("")).toBe("");
  });

  it("extrai riscos das APRs mantendo vínculo com o registro e a função", () => {
    const registros = [
      { id: "d1", draft_snapshot: { setor_id: "s1", funcao_id: "f1", tabela: { linhas: [
        { circunstancia: "Trabalho em postura forçada", classificacao: "ALTO", recomendacoes: "Ajustar bancada" },
        { circunstancia: "", classificacao: "BAIXO" },
        { circunstancia: "Vibração em equipamento", classificacao: "MÉDIO" },
      ] } } },
      { id: "d2", draft_snapshot: { setor_id: "inexistente", tabela: { linhas: [{ circunstancia: "X", classificacao: "ALTO" }] } } },
    ];
    const riscos = riscosAprParaPlano(registros, setores);
    expect(riscos).toHaveLength(2);
    expect(riscos[0]).toMatchObject({ documento_id: "d1", setor: "GERE 01", funcao: "Operador", risco: "Trabalho em postura forçada", classificacao: "ALTO", recomendacoes: "Ajustar bancada" });
    expect(riscos[1].risco).toBe("Vibração em equipamento");
  });

  it("lê ações salvas e ignora formatos inválidos", () => {
    expect(acoesDoPlano(null)).toEqual([]);
    expect(acoesDoPlano({ acoes: "texto" })).toEqual([]);
    const acao = { ...novaAcaoPlanoApr("a1"), o_que: "Instalar plataforma" };
    const lidas = acoesDoPlano({ acoes: [acao, 42, { o_que: 7 }] });
    expect(lidas).toHaveLength(2);
    expect(lidas[0]).toMatchObject({ id: "a1", o_que: "Instalar plataforma" });
    expect(lidas[1].o_que).toBe("");
  });

  it("aplicação da IA remove duplicidades e ações sem 'o quê'", () => {
    const base = { ...novaAcaoPlanoApr("x"), documento_id: "d1", risco: "Postura", o_que: "Ajustar bancada" };
    const resultado = aplicarPropostaPlano([
      base,
      { ...base, id: "y" },
      { ...novaAcaoPlanoApr("z"), documento_id: "d1", risco: "Postura", o_que: "  " },
    ]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("x");
  });
});
