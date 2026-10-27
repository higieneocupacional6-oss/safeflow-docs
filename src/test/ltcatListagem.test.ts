import { describe, expect, it } from "vitest";
import { montarListagemLtcat, tituloSetorListagem } from "@/lib/ltcatListagem";
import { podeReidratarLtcat } from "@/lib/ltcatPersistence";

const unidades = [{ id: "u-db", simbolo: "dB(A)", nome: "decibel" }];

describe("listagem LTCAT por setor e função", () => {
  const riscos = [
    {
      id: "av-ruido",
      setor_id: "s-adm",
      setor_nome: "Administração",
      agente_id: "ag-ruido",
      agente_nome: "Ruído",
      parecer_tecnico: "Exposição controlada.",
      resultado: "",
      items: [{ id: "av-ruido", funcao_id: "f-aux", funcao_nome: "Auxiliar", colaborador: "Ana" }],
      resultados_detalhados: [{ id: "av-ruido", funcao_id: "f-aux", colaborador: "Ana", resultado: "85", unidade_resultado_id: "u-db", situacao: "Acima do limite" }],
    },
    {
      id: "av-calor",
      setor_id: "s-adm",
      setor_nome: "Administração",
      agente_id: "ag-calor",
      agente_nome: "Calor",
      parecer_tecnico: "",
      items: [{ id: "av-calor", funcao_id: "f-aux", funcao_nome: "Auxiliar", colaborador: "Ana" }],
      resultados_calor: [{ id: "av-calor", funcao_id: "f-aux", ibutg_medido: "28,5" }],
    },
    {
      id: "av-op",
      setor_id: "s-op",
      setor_nome: "Operação",
      agente_id: "ag-ruido",
      agente_nome: "Ruído",
      resultado: "70",
      unidade_resultado_id: "u-db",
      parecer_tecnico: "Abaixo do limite.",
      items: [{ id: "av-op", funcao_id: "f-op", funcao_nome: "Operador", colaborador: "" }],
    },
  ];

  it("agrupa setor, função e riscos com resultado, unidade e conclusão salvos", () => {
    const lista = montarListagemLtcat(riscos, unidades);
    expect(lista.map((s) => s.setorNome)).toEqual(["Administração", "Operação"]);
    const auxiliar = lista[0].funcoes[0];
    expect(auxiliar.funcaoNome).toBe("Auxiliar");
    expect(auxiliar.riscos.map((r) => r.agenteNome)).toEqual(["Calor", "Ruído"]);
    const ruido = auxiliar.riscos.find((r) => r.agenteNome === "Ruído");
    expect(ruido?.medidas[0]).toMatchObject({ resultado: "85", unidade: "dB(A)", conclusao: "Acima do limite", colaborador: "Ana" });
    expect(lista[1].funcoes[0].riscos[0].medidas[0]).toMatchObject({ resultado: "70", unidade: "dB(A)", conclusao: "" });
    expect(JSON.stringify(lista)).not.toContain("Exposição controlada.");
    expect(JSON.stringify(lista)).not.toContain("Abaixo do limite.");
  });

  it("não calcula média nem inventa conclusão ausente", () => {
    const lista = montarListagemLtcat([{
      id: "av",
      setor_id: "s",
      setor_nome: "Campo",
      agente_id: "ag",
      agente_nome: "Ruído",
      parecer_tecnico: "",
      resultado: "80",
      limite_tolerancia: "85",
      items: [{ id: "av", funcao_id: "f", funcao_nome: "Técnico", colaborador: "" }],
      resultados_detalhados: [
        { id: "m1", funcao_id: "f", resultado: "80", unidade_resultado_id: "u-db" },
        { id: "m2", funcao_id: "f", resultado: "90", unidade_resultado_id: "u-db" },
      ],
    }], unidades);
    const medidas = lista[0].funcoes[0].riscos[0].medidas;
    expect(medidas.map((m) => m.resultado)).toEqual(["80", "90"]);
    expect(medidas.every((m) => m.conclusao === "")).toBe(true);
    expect(medidas.some((m) => m.resultado === "85")).toBe(false);
  });

  it("ordena pelo número do GHE ou GES e coloca o código ao lado do setor", () => {
    const riscoSetor = (setorId: string, setorNome: string, agente: string) => ({
      id: setorId,
      setor_id: setorId,
      setor_nome: setorNome,
      agente_id: agente,
      agente_nome: agente,
      items: [{ id: setorId, funcao_id: "f", funcao_nome: "Função", colaborador: "" }],
      resultado: "1",
    });
    const riscos = [
      riscoSetor("s-adm", "Administrativo", "Ruído"),
      riscoSetor("s-op", "Operação", "Calor"),
      riscoSetor("s-campo", "Campo", "Vibração"),
      riscoSetor("s-sem", "Almoxarifado", "Poeira"),
    ];
    const setores = [
      { id: "s-adm", ghe_ges: "GHE 02" },
      { id: "s-op", ghe_ges: "GHE 01" },
      { id: "s-campo", ghe_ges: "GES 10" },
    ];
    const lista = montarListagemLtcat(riscos, [], setores);
    expect(lista.map((setor) => tituloSetorListagem(setor.gheGes, setor.setorNome))).toEqual([
      "GHE 01: Operação",
      "GHE 02: Administrativo",
      "GES 10: Campo",
      "Almoxarifado",
    ]);
  });

  it("mostra vibração só com AREN e VDVR gravados", () => {
    const lista = montarListagemLtcat([{
      id: "av",
      setor_id: "s",
      setor_nome: "Oficina",
      agente_id: "ag",
      agente_nome: "Vibração",
      parecer_tecnico: "Avaliação pontual.",
      items: [{ id: "av", funcao_id: "f", funcao_nome: "Mecânico", colaborador: "" }],
      resultados_vibracao: [{ id: "av", funcao_id: "f", aren_resultado: "1,2", vdvr_resultado: "9" }],
    }], []);
    expect(lista[0].funcoes[0].riscos[0].medidas[0].resultado).toBe("AREN 1,2 · VDVR 9");
    expect(lista[0].funcoes[0].riscos[0].medidas[0].conclusao).toBe("");
    expect(JSON.stringify(lista)).not.toContain("Avaliação pontual.");
  });
});

describe("reidratação LTCAT", () => {
  it("bloqueia recarga remota com edição, gravação ou fila pendente", () => {
    expect(podeReidratarLtcat({ persisting: false, unsaved: false, pendingProtected: false })).toBe(true);
    expect(podeReidratarLtcat({ persisting: true, unsaved: false, pendingProtected: false })).toBe(false);
    expect(podeReidratarLtcat({ persisting: false, unsaved: true, pendingProtected: false })).toBe(false);
    expect(podeReidratarLtcat({ persisting: false, unsaved: false, pendingProtected: true })).toBe(false);
  });
});
