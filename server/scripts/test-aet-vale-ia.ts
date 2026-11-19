import { getPool, closePool } from "../src/db/pool.js";
import { buildAetVale } from "../src/ai/handlers/aetVale.js";
import { gerarJsonEstruturado, saidaJsonVazia } from "../src/ai/gemini.js";
import { CAMPOS_ETAPA1, TEXTOS_ETAPA2 } from "../src/ai/lib/aetValeIa.js";

async function main() {
  const pool = getPool();
  if (!pool) throw new Error("DB não configurado");

  // 1) Pós-processamento com formatos divergentes (array + objeto)
  const docQ = await pool.query(
    `select id from documentos where tipo = 'AET-VALE' and draft_snapshot->>'setor_id' is not null and draft_snapshot->>'funcao_id' is not null limit 1`,
  );
  if (!docQ.rows[0]) {
    console.error("Nenhum registro AET-VALE com setor/função no banco para teste.");
    process.exit(1);
  }
  const registroId = docQ.rows[0].id as string;
  console.log("registro", registroId);

  const pedido = await buildAetVale({
    registroId,
    relato:
      "Operador realiza movimentação manual de caixas de até 12 kg em posto em pé, com flexão de tronco e alcance acima dos ombros. Pausas irregulares. Queixa de lombalgia. Ambiente coberto, temperatura confortável, ruído moderado.",
    atuais: { etapa1: {}, etapa2: { textos: {}, checks: {}, diagnosticos: {}, plano: [] } },
  });

  // Simula desvio de nomenclatura/Markdown que o modelo às vezes devolve
  const simulado = pedido.posProcessar!({
    etapa1: [
      { campo: "demanda ergonomica", texto: "Investigar sobrecarga lombar na movimentação." },
      { campo: "analise_atividade", texto: "Trabalho real com flexão e alcance acima dos ombros." },
      { campo: "tarefa_analisada", texto: "Movimentação manual de caixas." },
    ],
    textos: { posto: "Posto em pé no galpão", conclusao: "Há exigências biomecânicas relevantes." },
    checks: [{ campo: "corpo", opcoes: ["Coluna lombar", "inexistente"] }],
    origens: ["SST", "outra"],
    diagnosticos: [],
    plano: [],
    confirmacoes: ["Confirmar peso médio das caixas no posto."],
  });

  console.log("simulado etapa1 keys", Object.keys(simulado.etapa1));
  console.log("simulado textos", simulado.etapa2.textos);
  console.log("simulado checks", simulado.etapa2.checks);
  console.log("simulado cargo", simulado.etapa1.cargo);
  console.log("simulado vazio?", saidaJsonVazia(simulado));

  if (!simulado.etapa1.cargo) throw new Error("cargo do cadastro não foi aplicado");
  if (!simulado.etapa1.demanda_ergonomica) throw new Error("alias demanda ergonomica não mapeou");
  if (!simulado.etapa2.textos.posto) throw new Error("objeto textos não mapeou");
  if (!simulado.etapa2.checks.corpo?.includes("Coluna lombar")) throw new Error("check corpo não mapeou");
  if (saidaJsonVazia(simulado)) throw new Error("proposta simulada marcada como vazia");

  // 2) Chamada real Gemini
  console.log("schemaName", pedido.schemaName);
  console.log("campos_etapa1", CAMPOS_ETAPA1.length, "textos", Object.keys(TEXTOS_ETAPA2).length);
  const result = await gerarJsonEstruturado(pedido);
  if (!result.ok) {
    console.error("GEMINI FAIL", result.status, result.error);
    process.exit(2);
  }
  const out = result.output;
  console.log("gemini etapa1 preenchidos", Object.entries(out.etapa1 || {}).filter(([, v]) => String(v || "").trim()).map(([k]) => k));
  console.log("gemini textos", Object.keys(out.etapa2?.textos || {}));
  console.log("gemini checks", Object.keys(out.etapa2?.checks || {}));
  console.log("gemini confirmacoes", out.confirmacoes?.length ?? 0);
  console.log("gemini vazio?", saidaJsonVazia(out));
  console.log("sample analise", String(out.etapa1?.analise_atividade || "").slice(0, 160));

  // Critério de aplicação no formulário: PropostaVale com etapa1 Record + etapa2.textos
  if (typeof out.etapa1 !== "object" || Array.isArray(out.etapa1)) {
    throw new Error("etapa1 deve ser Record, não array");
  }
  if (!out.etapa2 || typeof out.etapa2.textos !== "object" || Array.isArray(out.etapa2.textos)) {
    throw new Error("etapa2.textos deve ser Record");
  }
  if (saidaJsonVazia(out)) throw new Error("saída Gemini marcada como vazia");

  const aplicaveis = Object.values(out.etapa1).some((v) => String(v || "").trim())
    || Object.values(out.etapa2.textos).some((v) => String(v || "").trim())
    || Object.values(out.etapa2.checks || {}).some((v: any) => Array.isArray(v) && v.length);
  if (!aplicaveis) throw new Error("nenhum campo aplicável após geração");

  console.log("OK_AET_VALE");
  await closePool();
}

main().catch(async (e) => {
  console.error(e);
  await closePool().catch(() => {});
  process.exit(1);
});
