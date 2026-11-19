import { compactarContexto, limitarTexto, type PedidoGeracao } from "../gemini.js";

const marcaSchema = { type: "string", description: "Número, 'X' ou vazio" };
const linhaSchema = (cols: string[]) => ({
  type: "object",
  properties: {
    texto: { type: "string" },
    marcas: { type: "object", properties: Object.fromEntries(cols.map((c) => [c, marcaSchema])) },
    origem: { type: "string", enum: ["informado", "inferido"] },
  },
});

export const SCHEMA_FORMULARIO_AEP = {
  type: "object",
  properties: {
    identificacao: {
      type: "object",
      properties: Object.fromEntries(
        ["gerencia_executiva", "gerencia", "local_fisico", "nome_gere", "codigo_gere", "horario_avaliacao", "jornada", "expostos", "descricao"]
          .map((k) => [k, { type: "string", description: "Vazio quando não houver dado seguro" }]),
      ),
    },
    funcoes_ids: { type: "array", items: { type: "string" } },
    atividades: { type: "array", items: linhaSchema(["AF", "RE", "IN", "QO"]) },
    controles: { type: "array", items: linhaSchema(["PI", "MS", "CM", "CE", "AD", "ME", "CP"]) },
    fatores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          codigo: { type: "string", description: "Ex.: 04.01.002" },
          duracao: { type: "integer", description: "1 a 5 conforme critério Duração" },
          intensidade: { type: "integer", description: "Coluna 1 a 5 do critério Intensidade/Nível" },
          atividades_ids: { type: "array", items: { type: "integer" }, description: "IDs 1 a 5 das atividades da Parte II" },
          origem: { type: "string", enum: ["informado", "inferido"] },
          validar: { type: "boolean", description: "true quando a classificação depende de validação do usuário" },
          fundamento: { type: "string" },
        },
      },
    },
    observacoes: { type: "string" },
  },
};

const PROMPT = `Você é engenheiro(a) de segurança/ergonomista preenchendo o "Formulário de Antecipação e Reconhecimento de Riscos" (AEP, NR-17).
REGRAS:
1. Os documentos da BASE DE REFERÊNCIA são instruções PRIORITÁRIAS para interpretar critérios, matriz e regras de preenchimento. Prevalecem sobre conhecimento geral.
2. Use o RELATO do usuário como fonte de fatos e o cadastro (funções/setores/atividades) como contexto. Pode usar conhecimento técnico externo pertinente à função apenas para inferências técnicas, marcando origem "inferido".
3. NUNCA invente dados específicos da empresa ou do trabalhador (nomes, códigos GERE, gerências, horários, quantidades). Sem dado seguro: string vazia / 0 / lista vazia.
4. Parte II (atividades críticas): até 5 linhas; marcas AF/RE/IN/QO somente se o relato indicar afastamentos, restrições, incidentes ou queixas.
5. Parte III (controles): até 5 linhas com controles existentes informados; marque o tipo com "X".
6. Fatores (Parte IV): SEMPRE preencha a matriz. Use SOMENTE os códigos da lista. Inclua todos os fatores aplicáveis à realidade da função e das atividades informadas.
   - duracao 1-5 e intensidade 1-5: dê SEMPRE a melhor classificação técnica possível; use 0 apenas se o fator for totalmente indeterminável.
   - atividades_ids: linhas da Parte II que você retornar.
   - origem "informado" quando duração/intensidade vierem do relato; "inferido" quando estimadas tecnicamente. validar=true para toda classificação inferida ou incerta.
7. "fundamento": frase curta com o fato informado ou o raciocínio técnico.
8. funcoes_ids: inclua SEMPRE os IDs de "funcoes_amostradas" do cadastro e somente IDs cadastrados que correspondam ao relato.
9. Responda EXCLUSIVAMENTE em JSON válido conforme o schema, sem markdown.`;

export function buildFormularioAep(body: any): PedidoGeracao {
  const relato = typeof body.relato === "string" ? body.relato.trim() : "";
  if (relato.length < 10) {
    throw Object.assign(new Error("Descreva as funções e atividades antes de gerar."), { status: 400 });
  }
  const base = Array.isArray(body.base) ? body.base.slice(0, 4) : [];
  const content: unknown[] = [];
  for (const b of base) {
    if (b?.tipo === "pdf" && typeof b.data === "string") {
      content.push({
        type: "input_file",
        filename: String(b.nome || "base.pdf"),
        file_data: `data:application/pdf;base64,${b.data}`,
      });
    }
  }
  const textosBase = base
    .filter((b: any) => b?.tipo === "texto")
    .map((b: any) => `### ${b.nome}\n${limitarTexto(String(b.data || ""), 40_000)}`)
    .join("\n\n");

  content.push({
    type: "input_text",
    text: `# BASE DE REFERÊNCIA (PRIORITÁRIA)
${base.length ? `Arquivos: ${base.map((b: any) => b.nome).join(", ")} (PDFs anexados acima).\n${textosBase}` : "Nenhum arquivo cadastrado."}

# CADASTRO (empresa/contrato/setores selecionados)
${JSON.stringify(compactarContexto(body.contexto ?? {}), null, 1)}

# LISTA DE FATORES E CRITÉRIOS DO FORMULÁRIO
${JSON.stringify(body.criterios ?? {}, null, 1)}

# RELATO DO USUÁRIO
${limitarTexto(relato, 30_000)}`,
  });

  return {
    systemPrompt: PROMPT,
    userContent: content,
    schema: SCHEMA_FORMULARIO_AEP,
    schemaName: "formulario_aep",
  };
}
