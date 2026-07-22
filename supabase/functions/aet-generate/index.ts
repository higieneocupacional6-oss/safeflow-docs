// Edge function: Gera automaticamente uma AET via Lovable AI (Google Gemini)
// Recebe o contexto da AET + texto livre do usuário. Retorna JSON com os campos.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um especialista sênior em Ergonomia Ocupacional, com domínio em:
- NR-17 e demais Normas Regulamentadoras aplicáveis
- Análise Ergonômica do Trabalho (AET)
- Biomecânica Ocupacional, Antropometria, Higiene Ocupacional
- Organização do Trabalho, Ergonomia Cognitiva, Física e Organizacional
- Psicodinâmica do Trabalho

Sua tarefa é elaborar uma AET completa, técnica, objetiva e personalizada com base em:
1) O relato in loco fornecido pelo usuário (pode ser informal — traduza para linguagem técnica).
2) O contexto cadastrado (empresa, contrato, setor, funções, ferramentas ergonômicas aplicadas, avaliação psicossocial, avaliações quantitativas e dimensionais).

REGRAS OBRIGATÓRIAS:
- Nunca produzir texto genérico. Toda descrição deve refletir a realidade descrita.
- Correlacionar aspectos físicos, organizacionais e psicossociais.
- Utilizar terminologia técnica de ergonomia.
- Interpretar automaticamente resultados de RULA/REBA/OCRA/OWAS/NIOSH/Moore-Garg quando presentes.
- Comparar valores quantitativos (ruído, iluminância, temperatura) com os limites informados e classificar conformidade.
- Se uma medida antropométrica não foi informada, indicar que depende de medição em campo.
- Fundamentar recomendações na NR-17 e boas práticas.
- Responder EXCLUSIVAMENTE em JSON válido conforme o schema solicitado, em português do Brasil.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    posto_trabalho: { type: "string" },
    descricao_atividade: { type: "string" },
    analise_organizacional: { type: "string" },
    ritmo_complexidade: { type: "string" },
    jornada_aspectos: { type: "string" },
    caracterizacao_biomecanica: { type: "string" },
    cronoanalise: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tarefa: { type: "string" },
          tempo: { type: "string" },
          risco: { type: "string" },
        },
        required: ["tarefa", "tempo", "risco"],
      },
    },
    avaliacoes_dimensionais: {
      type: "object",
      properties: {
        altura_mesa: { type: "string" },
        altura_assento: { type: "string" },
        profundidade_assento: { type: "string" },
        monitor: { type: "string" },
        distancia_olho_monitor: { type: "string" },
        espaco_pernas: { type: "string" },
      },
    },
    avaliacoes_quantitativas_analise: { type: "string" },
    diagnostico_ergonomico: { type: "string" },
    conclusao: { type: "string" },
    plano_acao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          o_que: { type: "string" },
          como: { type: "string" },
          responsavel: { type: "string" },
          prazo: { type: "string" },
        },
        required: ["o_que", "como", "responsavel", "prazo"],
      },
    },
  },
  required: [
    "posto_trabalho",
    "descricao_atividade",
    "analise_organizacional",
    "ritmo_complexidade",
    "jornada_aspectos",
    "caracterizacao_biomecanica",
    "cronoanalise",
    "avaliacoes_dimensionais",
    "diagnostico_ergonomico",
    "conclusao",
    "plano_acao",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { descricao, contexto } = await req.json();
    if (!descricao || typeof descricao !== "string" || descricao.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Descreva com mais detalhes o que foi observado in loco (mínimo 20 caracteres)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = `# RELATO DA AVALIAÇÃO IN LOCO (usuário)
${descricao.trim()}

# CONTEXTO CADASTRADO
\`\`\`json
${JSON.stringify(contexto || {}, null, 2)}
\`\`\`

Gere a AET completa em JSON, seguindo o schema.
- Em "avaliacoes_dimensionais", cada chave recebe um texto de avaliação técnica (Adequado/Inadequado + justificativa antropométrica). Se a medida não foi informada, escreva "Depende de medição em campo — recomenda-se aferir conforme NR-17.3.3".
- Em "cronoanalise", produza 4 a 8 linhas cobrindo o ciclo de trabalho descrito.
- Em "plano_acao", 3 a 6 ações concretas, priorizadas, com justificativa técnica embutida em "como".
- Em "diagnostico_ergonomico" e "conclusao", correlacione fatores físicos + organizacionais + psicossociais.
- Em "avaliacoes_quantitativas_analise", produza um parágrafo comparando os valores com os limites.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "aet_output", strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gateway error", resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha ao gerar AET: " + errText.slice(0, 400) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content;
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return new Response(JSON.stringify({ error: "Resposta da IA não pôde ser interpretada.", raw }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ output: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
