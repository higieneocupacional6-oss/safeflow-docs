import { buildFormularioAep } from "../src/ai/handlers/formularioAep.js";
import { buildAep } from "../src/ai/handlers/aep.js";
import { gerarJsonEstruturado, saidaJsonVazia } from "../src/ai/gemini.js";

async function run() {
  console.log("== formulario-aep-generate ==");
  const pedidoForm = buildFormularioAep({
    relato:
      "Operador de empilhadeira trabalha em pé e sentado cerca de 8h por turno, com levantamento manual eventual de caixas de até 15 kg, pausas irregulares e queixas de lombalgia. Ambiente coberto, piso irregular. Controles: EPI (luvas), treinamento de direção defensiva.",
    contexto: {
      funcoes_amostradas: [
        { id: "f1", nome: "Operador de Empilhadeira", atividades_reais: "Condução e carga/descarga" },
      ],
      setor: { nome: "Logística" },
    },
    criterios: {
      fatores: [
        ["04.01.001", "Postura"],
        ["04.01.002", "Levantamento de carga"],
        ["04.03.001", "Ritmo"],
        ["04.05.001", "Estresse"],
      ],
    },
    base: [],
  });
  const form = await gerarJsonEstruturado(pedidoForm);
  if (!form.ok) {
    console.error("FORM FAIL", form.status, form.error);
    process.exit(1);
  }
  console.log("form keys", Object.keys(form.output));
  console.log("form fatores", form.output.fatores?.length ?? 0);
  console.log("form vazio?", saidaJsonVazia(form.output));
  console.log("form fator0", JSON.stringify(form.output.fatores?.[0] ?? null));

  console.log("== aep-generate ==");
  const pedidoAep = buildAep({
    descricao:
      "Função: Operador de empilhadeira. Atividade: condução e movimentação de cargas. Postura sentada prolongada, vibração de corpo inteiro, levantamento eventual. Queixas de lombalgia.",
    aep_context: {
      avaliacao: {
        ges: "GHE-01",
        setor: "Logística",
        funcao_ges: "Operador de Empilhadeira",
        descricao_ambiente: "Galpão coberto, piso irregular",
      },
      empresa: { razao_social: "Empresa Teste LTDA", jornada_trabalho: "08h com 1h de intervalo" },
    },
    anexos: [],
  });
  const aep = await gerarJsonEstruturado(pedidoAep);
  if (!aep.ok) {
    console.error("AEP FAIL", aep.status, aep.error);
    process.exit(1);
  }
  console.log("aep keys", Object.keys(aep.output));
  console.log("aep riscos", aep.output.riscos_ergonomicos?.length ?? 0);
  console.log("aep parecer", String(aep.output.parecer_ergonomia || "").slice(0, 120));
  console.log("aep vazio?", saidaJsonVazia(aep.output));

  if (saidaJsonVazia(form.output) || saidaJsonVazia(aep.output)) process.exit(2);
  if (!(aep.output.riscos_ergonomicos?.length > 0) && !String(aep.output.parecer_ergonomia || "").trim()) {
    process.exit(3);
  }
  console.log("OK_E2E");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
