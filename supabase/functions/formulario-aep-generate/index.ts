// Preenchimento assistido do Formulário AEP (Parte 1 + Parte 2) a partir do relato do usuário,
// da Base de referência (instruções prioritárias) e do cadastro da empresa/contrato/setores.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { compactarContexto, gerarJsonEmFluxo, limitarTexto } from "../_shared/aiStream.ts";
import { exigirSessao } from "../_shared/sessao.ts";

const marcaSchema = { type: "string", description: "Número, 'X' ou vazio" };
const linhaSchema = (cols: string[]) => ({
  type: "object",
  properties: {
    texto: { type: "string" },
    marcas: { type: "object", properties: Object.fromEntries(cols.map((c) => [c, marcaSchema])) },
    origem: { type: "string", enum: ["informado", "inferido"] },
  },
});

const SCHEMA = {
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
6. Fatores (Parte IV): SEMPRE preencha a matriz. Use SOMENTE os códigos da lista. Inclua todos os fatores aplicáveis à realidade da função e das atividades informadas (confirmados pelo relato ou tecnicamente inerentes à função). Pesquise fontes técnicas externas confiáveis (NR-17, Manual de Aplicação da NR-17, ISO 11226/11228, NIOSH, ACGIH, Fundacentro, literatura ergonômica da função) para complementar quando o relato for insuficiente. Nunca inclua atividades, exposições ou condições incompatíveis com a função.
   - duracao 1-5 e intensidade 1-5: dê SEMPRE a melhor classificação técnica possível conforme os critérios da matriz; use 0 apenas se o fator for totalmente indeterminável.
   - atividades_ids: linhas da Parte II que você retornar (crie as atividades reais da função na Parte II quando o relato as descrever).
   - origem "informado" quando duração/intensidade vierem do relato; "inferido" quando estimadas tecnicamente. validar=true para toda classificação inferida ou incerta.
7. "fundamento": frase curta com o fato informado ou o raciocínio técnico e a referência (Base ou fonte externa).
8. funcoes_ids: inclua SEMPRE os IDs de "funcoes_amostradas" do cadastro (funções selecionadas pelo usuário) e, além delas, somente IDs cadastrados que correspondam ao relato.
9. FUNÇÕES AMOSTRADAS: associe o relato a cada função de "funcoes_amostradas", usando suas "atividades_reais". Na Parte II, cada atividade deve pertencer a uma dessas funções e o texto deve começar pelo nome da função (ex.: "Operador de Harvester – Corte e processamento de árvores"). Em cada fator da Parte IV, "atividades_ids" deve apontar exatamente para as linhas da Parte II cuja atividade gera aquele fator; nunca vincule um fator a uma atividade que não o produz.
10. PSICOSSOCIAL ("psicossocial" no cadastro): resultados salvos da avaliação psicossocial da mesma empresa e contrato, por setor/GHE/função. Use-os para classificar os fatores 04.05 (Psicossociais/Cognitivos) e os organizacionais 04.03 correlatos: fatores com classificação alta/média e frequência elevada sustentam o fator e sua intensidade; fatores baixos não devem gerar marcação isolada. Origem "informado" quando o fator vier diretamente desse resultado; cite no fundamento "Avaliação psicossocial". Se ausente, prossiga com as demais fontes.
11. FORMULÁRIOS ANTERIORES ("formularios_anteriores"): AEPs salvas da mesma empresa (priorize mesmo_contrato=true). Use-os para reconhecer funções, atividades, fatores e classificações anteriores pertinentes às mesmas funções; não copie classificações de funções diferentes. Marque validar=true quando a classificação vier apenas de formulário anterior.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status: number) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    if (!(await exigirSessao(sb, auth))) return json({ error: "Sessão expirada. Entre novamente." }, 401);

    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ error: "GEMINI_API_KEY não configurada. Crie a chave em https://aistudio.google.com/apikey e cadastre o secret nas Edge Functions do Supabase." }, 500);

    const body = await req.json();
    const relato = typeof body.relato === "string" ? body.relato.trim() : "";
    if (relato.length < 10) return json({ error: "Descreva as funções e atividades antes de gerar." }, 400);
    const base = Array.isArray(body.base) ? body.base.slice(0, 4) : [];

    const content: unknown[] = [];
    for (const b of base) {
      if (b?.tipo === "pdf" && typeof b.data === "string") {
        content.push({ type: "input_file", filename: String(b.nome || "base.pdf"), file_data: `data:application/pdf;base64,${b.data}` });
      }
    }
    const textosBase = base.filter((b: any) => b?.tipo === "texto")
      .map((b: any) => `### ${b.nome}\n${limitarTexto(String(b.data || ""), 40_000)}`).join("\n\n");

    content.push({
      type: "input_text",
      text: `# BASE DE REFERÊNCIA (PRIORITÁRIA)\n${base.length ? `Arquivos: ${base.map((b: any) => b.nome).join(", ")} (PDFs anexados acima).\n${textosBase}` : "Nenhum arquivo cadastrado."}

# CADASTRO (empresa/contrato/setores selecionados)
${JSON.stringify(compactarContexto(body.contexto ?? {}), null, 1)}

# LISTA DE FATORES E CRITÉRIOS DO FORMULÁRIO
${JSON.stringify(body.criterios ?? {}, null, 1)}

# RELATO DO USUÁRIO
${limitarTexto(relato, 30_000)}`,
    });

    return await gerarJsonEmFluxo({ req, corsHeaders, key, systemPrompt: PROMPT, userContent: content, schemaName: "formulario_aep", schema: SCHEMA });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return new Response(null, { status: 499, headers: corsHeaders });
    console.error(e);
    return json({ error: "Falha ao gerar o preenchimento. Tente novamente." }, 500);
  }
});
