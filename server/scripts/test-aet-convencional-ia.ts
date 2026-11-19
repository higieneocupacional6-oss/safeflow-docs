import { buildAet, normalizarSaidaAet, deduplicarCamposAet } from "../src/ai/handlers/aet.js";
import { gerarJsonEstruturado, saidaJsonVazia } from "../src/ai/gemini.js";

const FUNCOES = [
  {
    nome: "Auxiliar de Sondagem",
    setor: "Geotecnia / Campo",
    relato:
      "Auxiliar de sondagem trabalha em campo aberto, manuseia hastes e tubos, permanece predominantemente em pé com flexões de tronco ao auxiliar a equipe de perfuração, carrega equipamentos auxiliares e sofre vibração transmitida ocasionalmente. Jornada diurna com pausas irregulares conforme a frente de trabalho. Relato de fadiga lombar ao final do turno.",
  },
  {
    nome: "Operador de Motosserra",
    setor: "Silvicultura",
    relato:
      "Operador de motosserra realiza corte e processamento de árvores em terreno irregular, com esforço de sustentação da ferramenta, posturas assimétricas, vibração mão-braço e ruído elevado. Usa EPI auditivo e luvas antivibração. Ciclos curtos de corte intercalados com deslocamentos. Queixas de formigamento em mãos após longos períodos.",
  },
  {
    nome: "Analista Administrativo",
    setor: "Escritório / Administrativo",
    relato:
      "Analista administrativo permanece predominantemente sentado em microcomputador, digitação e análise de planilhas por cerca de 7h com intervalo de almoço. Monitor à frente, mouse à direita, poucas pausas micro. Relato de desconforto cervical ao final do expediente. Ambiente climatizado, iluminação artificial.",
  },
];

function overlapRatio(a: string, b: string): number {
  const na = a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nb = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const fa = new Set((na.match(/[a-z0-9]{5,}/g) || []));
  const fb = new Set((nb.match(/[a-z0-9]{5,}/g) || []));
  if (!fa.size || !fb.size) return 0;
  let inter = 0;
  for (const t of fa) if (fb.has(t)) inter += 1;
  return inter / Math.min(fa.size, fb.size);
}

async function main() {
  // Unitário: normalização de aliases + dedupe
  const norm = normalizarSaidaAet({
    posto_trabalho: "Ambiente de escritório com mesa e cadeira.",
    descricao_atividade: "Ambiente de escritório com mesa e cadeira. Digita planilhas.",
    analise_organizacional: "Autonomia parcial sob supervisão.",
    ritmo_complexidade: "Ritmo moderado com prazos mensais.",
    jornada_aspectos: "Jornada diurna com intervalo de almoço.",
    caracterizacao_biomecanica: "Postura sentada prolongada com flexão cervical.",
    avaliacoes_quantitativas_analise: "Sem medições quantitativas aplicáveis neste trecho.",
    diagnostico_ergonomico: "Exigência postural sedentária predominante.",
    conclusao: "Há necessidade de adequações do posto administrativo.",
    cronoanalise: [{ tarefa: "Digitação", tempo: "", risco: "Moderado — postura estática" }],
    avaliacoes_dimensionais: { altura_mesa: "Adequado qualitativamente", altura_assento: "Adequado" },
    plano_acao: [{ acao: "Ajustar monitor", como: "Alinhar ao horizonte", prazo_dias: "30", responsavel: "SESMT", justificativa: "NR-17.3", prioridade: "Alta", resultado_esperado: "Reduzir cervicalgia" }],
  });
  if (!norm.plano_acao[0]?.o_que) throw new Error("alias acao→o_que falhou");
  if (!norm.plano_acao[0]?.prazo) throw new Error("alias prazo_dias→prazo falhou");
  if (!norm.avaliacoes_dimensionais.monitor && norm.avaliacoes_dimensionais.monitor !== "") {
    throw new Error("dimensões incompletas");
  }
  const dedup = deduplicarCamposAet({
    posto_trabalho: "O trabalhador permanece em postura inadequada durante toda a jornada laboral diária.",
    descricao_atividade: "O trabalhador permanece em postura inadequada durante toda a jornada laboral diária. Executa digitação.",
    analise_organizacional: "x",
    ritmo_complexidade: "x",
    jornada_aspectos: "x",
    caracterizacao_biomecanica: "x",
    avaliacoes_quantitativas_analise: "x",
    diagnostico_ergonomico: "x",
    conclusao: "x",
  });
  if (dedup.descricao_atividade.includes("postura inadequada durante toda a jornada laboral diária")
    && dedup.posto_trabalho.includes("postura inadequada durante toda a jornada laboral diária")) {
    throw new Error("dedupe não removeu frase repetida");
  }
  console.log("unitarios OK");

  const resultados: Array<{ nome: string; out: any }> = [];
  for (const f of FUNCOES) {
    const pedido = buildAet({
      descricao: f.relato,
      contexto: {
        funcao_nome: f.nome,
        setor_nome: f.setor,
        descricao_ambiente: f.setor,
        funcoes_selecionadas: [{ id: "1", nome: f.nome }],
      },
      anexos: [],
    });
    const r = await gerarJsonEstruturado(pedido);
    if (!r.ok) {
      console.error("FAIL", f.nome, r.error);
      process.exit(2);
    }
    const out = r.output;
    if (saidaJsonVazia(out)) throw new Error(`vazio: ${f.nome}`);
    if (typeof out.avaliacoes_dimensionais !== "object" || Array.isArray(out.avaliacoes_dimensionais)) {
      throw new Error(`dimensões inválidas: ${f.nome}`);
    }
    if (!Array.isArray(out.plano_acao) || !out.plano_acao[0]?.o_que) {
      throw new Error(`plano inválido: ${f.nome}`);
    }
    // Individualização: a descrição da atividade deve conversar com a função
    const blob = `${out.descricao_atividade} ${out.caracterizacao_biomecanica} ${out.diagnostico_ergonomico}`.toLowerCase();
    const tokens = f.nome.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
    const hit = tokens.some((t) => blob.includes(t))
      || (f.nome.includes("Motosserra") && /motosserra|corte|vibra/.test(blob))
      || (f.nome.includes("Sondagem") && /sondagem|haste|campo|perfura/.test(blob))
      || (f.nome.includes("Administrativo") && /digit|monitor|sentad|escrit/.test(blob));
    if (!hit) {
      console.error("pouca individualização", f.nome, out.descricao_atividade?.slice(0, 120));
      process.exit(3);
    }
    // Exclusividade aproximada: posto ≠ descricao
    if (normFrase(out.posto_trabalho) === normFrase(out.descricao_atividade)) {
      throw new Error(`campos idênticos posto/atividade: ${f.nome}`);
    }
    console.log("---", f.nome);
    console.log("posto:", String(out.posto_trabalho).slice(0, 100));
    console.log("atividade:", String(out.descricao_atividade).slice(0, 100));
    console.log("biomecanica:", String(out.caracterizacao_biomecanica).slice(0, 100));
    console.log("plano0:", out.plano_acao[0].o_que);
    resultados.push({ nome: f.nome, out });
  }

  // Entre funções: descrições de atividade não devem ser quase iguais
  for (let i = 0; i < resultados.length; i++) {
    for (let j = i + 1; j < resultados.length; j++) {
      const r = overlapRatio(resultados[i].out.descricao_atividade, resultados[j].out.descricao_atividade);
      console.log(`overlap ${resultados[i].nome} x ${resultados[j].nome}: ${r.toFixed(2)}`);
      if (r > 0.72) {
        throw new Error(`análises pouco individualizadas entre ${resultados[i].nome} e ${resultados[j].nome}`);
      }
    }
  }

  console.log("OK_AET_CONVENCIONAL");
}

function normFrase(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
