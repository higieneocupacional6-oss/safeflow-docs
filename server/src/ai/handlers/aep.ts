import { compactarContexto, limitarAnexos, limitarTexto, type PedidoGeracao } from "../gemini.js";
import { limparSaidaTecnica, REDACAO_TECNICA } from "../redacao.js";

const SYSTEM_PROMPT = `Você é um ERGONOMISTA SÊNIOR responsável pela elaboração de AEP — Análise Ergonômica Preliminar (NR-17, NR-01/GRO).

HIERARQUIA: INFORMAÇÃO DO USUÁRIO → DADOS DA EMPRESA → GES/SETOR/AMBIENTE/FUNÇÕES → CADASTRO → FOTOGRAFIAS → ANÁLISE → AEP.

REGRAS OBRIGATÓRIAS:
- Toda análise deriva EXCLUSIVAMENTE das informações fornecidas. PROIBIDO inventar função, setor, GES, quantidade, equipamento ou condição não fornecida.
- riscos_ergonomicos: mapa dos 4 tipos (físico, organizacional, cognitivo, psicossocial), com fatores sustentados de nível baixo, médio e alto.
- checklist: 5 linhas fixas (chaves: organizacao_trabalho, levantamento_transporte_cargas, mobiliario, maquinas_equipamentos_ferramentas, conforto_ambiente).
- parecer_ambiente e parecer_ergonomia: textos técnicos distintos e coerentes.
- conduta_1 e conduta_2: "SIM" ou "NÃO".
- plano_acao: ações concretas derivadas dos riscos.
- Responder EXCLUSIVAMENTE em JSON válido conforme o schema, sem markdown.`;

export const SCHEMA_AEP = {
  type: "object",
  properties: {
    riscos_ergonomicos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tipo_agente: { type: "string" },
          fator_risco: { type: "string" },
          justificativa: { type: "string" },
          fonte_geradora: { type: "string" },
          possiveis_danos: { type: "string" },
          controle_existente: { type: "string" },
          probabilidade: { type: "string", description: "Baixa | Média | Alta" },
          severidade: { type: "string", description: "Leve | Moderada | Grave" },
          medidas: { type: "string" },
        },
        required: [
          "tipo_agente", "fator_risco", "justificativa", "fonte_geradora", "possiveis_danos",
          "controle_existente", "probabilidade", "severidade", "medidas",
        ],
      },
    },
    checklist: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chave: { type: "string" },
          quantidade_inadequados: { type: "string" },
          condicao: { type: "string" },
          observacao: { type: "string" },
        },
        required: ["chave", "quantidade_inadequados", "condicao", "observacao"],
      },
    },
    descricao_atividade: { type: "string" },
    turno: { type: "string" },
    parecer_ambiente: { type: "string" },
    parecer_ergonomia: { type: "string" },
    conduta_1: { type: "string" },
    parecer_conduta_1: { type: "string" },
    conduta_2: { type: "string" },
    parecer_conduta_2: { type: "string" },
    plano_acao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          acao: { type: "string" },
          como: { type: "string" },
          responsavel: { type: "string" },
          prazo: { type: "string" },
        },
        required: ["acao", "como", "responsavel", "prazo"],
      },
    },
  },
  required: [
    "descricao_atividade", "turno", "riscos_ergonomicos", "checklist", "parecer_ambiente", "parecer_ergonomia",
    "conduta_1", "parecer_conduta_1", "conduta_2", "parecer_conduta_2", "plano_acao",
  ],
};

export function buildAep(body: any): PedidoGeracao {
  const ctx = body.aep_context ?? body.contexto ?? {};
  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  const instrTxt = typeof body.instrucoes_usuario === "string" ? body.instrucoes_usuario.trim() : "";
  const anexosArr = Array.isArray(body.anexos) ? limitarAnexos(body.anexos, 10) : [];
  const conhecAnexos = Array.isArray(body.conhecimento?.anexos)
    ? limitarAnexos(body.conhecimento.anexos, 10)
    : [];

  const userText = `${instrTxt ? `# DIRETRIZES INTERNAS\n${instrTxt}\n\n` : ""}# INFORMAÇÕES DO USUÁRIO
${descricao || "Nenhuma informação complementar digitada."}

# CONTEXTO ESTRUTURADO
${JSON.stringify({ aep_context: compactarContexto(ctx), psicossocial: body.psicossocial ?? null }, null, 2)}

# FOTOGRAFIAS
${anexosArr.length === 0 ? "Nenhuma." : anexosArr.map((a: any, i: number) => `- Anexo ${i + 1}: ${a.name}`).join("\n")}

Gere JSON conforme o schema com checklist, riscos, pareceres, condutas e plano de ação.`;

  const userContent: unknown[] = [{ type: "input_text", text: limitarTexto(userText) }];
  for (const a of conhecAnexos) {
    if (!a?.data) continue;
    userContent.push({
      type: "input_file",
      filename: a.name || "conhecimento.pdf",
      file_data: `data:${a.mime || "application/pdf"};base64,${a.data}`,
    });
  }
  for (const a of anexosArr) {
    if (a.kind === "image" && a.data && a.mime) {
      userContent.push({ type: "input_image", image_url: `data:${a.mime};base64,${a.data}` });
    } else if (a.kind === "pdf" && a.data) {
      userContent.push({
        type: "input_file",
        filename: a.name || "documento.pdf",
        file_data: `data:${a.mime || "application/pdf"};base64,${a.data}`,
      });
    }
  }

  return {
    systemPrompt: `${SYSTEM_PROMPT}\n${REDACAO_TECNICA}`,
    userContent,
    schema: SCHEMA_AEP,
    schemaName: "aep_output",
    posProcessar: limparSaidaTecnica,
  };
}
