// Edge function: gera os textos técnicos do Relatório Psicossocial (NR-01 / NR-17)
// a partir dos dados reais cadastrados + PDFs da base técnica do usuário.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um ESPECIALISTA SÊNIOR em Saúde e Segurança do Trabalho e em fatores de risco psicossocial, responsável pela redação de relatórios técnicos de Avaliação Psicossocial conforme NR-01 (GRO/PGR), NR-17, ISO 45003, COPSOQ III e diretrizes da OIT/OMS.

FONTES (ordem obrigatória):
1. BASE TÉCNICA EM PDF fornecida pelo usuário — referência normativa e metodológica prioritária.
2. DADOS REAIS CADASTRADOS (empresa, contrato, setores, GHE/GES, funções, atividades, indicadores, respostas do questionário e resultados consolidados).
3. Conhecimento técnico geral — apenas para redação e fundamentação, nunca para criar fatos.

REGRAS NÃO NEGOCIÁVEIS:
- É PROIBIDO inventar dados, atividades, riscos, controles, evidências, medições ou resultados.
- É PROIBIDO afirmar que qualquer medida foi implementada se isso não constar dos dados enviados.
- É PROIBIDO texto genérico ou "modelo pronto": cada texto deve refletir a empresa, o setor/GHE, as funções e os resultados reais recebidos.
- Quando uma informação necessária não estiver disponível, registre explicitamente a lacuna (ex.: "Informação não disponível no cadastro; recomenda-se levantamento junto ao setor de RH") em vez de supor.
- Preserve integralmente as chaves de identificação recebidas (grupo_id, fator_key, medida_key). Não crie chaves novas.
- Você é assistente técnico: o profissional responsável revisará e editará todo o conteúdo antes da emissão.

PLANO DE AÇÃO:
- Para cada medida recebida, proponha uma AÇÃO CONCRETA, aplicável e diretamente relacionada ao fator, ao setor/GHE, à atividade da função, à organização do trabalho, à causa/fonte e aos controles já existentes.
- Evite recomendações vagas como "realizar treinamentos" sem indicar conteúdo, público, periodicidade e o efeito esperado sobre o risco.
- Exemplos de linhas de ação, quando pertinentes ao risco real: ajustes na organização do trabalho, redistribuição de demandas, revisão de prazos e metas, melhoria de comunicação, definição de responsabilidades, melhoria de pausas, ações de liderança, fluxos de tratamento de conflitos, medidas de prevenção ao assédio, melhorias na gestão de equipes e acompanhamento periódico. Escolha conforme o risco encontrado; nunca aplique uma lista padrão a todos.
- Quando o fator for Baixo ou não identificado, a ação deve ser de manutenção e monitoramento, específica ao que sustentou o resultado favorável.
- O campo "status" NÃO deve ser preenchido por você.

FORMATO: responda EXCLUSIVAMENTE em JSON válido conforme o schema, em português do Brasil, linguagem técnica formal, sem markdown.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    metodologia: { type: "string", description: "Texto técnico da metodologia (métodos, abrangência, população, período, critérios de risco)." },
    conclusao: { type: "string", description: "Conclusão técnica analítica: situação geral, fatores críticos, setores prioritários e reavaliação." },
    intro_plano_acao: { type: "string", description: "Texto técnico introdutório do plano de ação, incluindo manutenção e monitoramento quando não houver risco relevante." },
    lacunas: {
      type: "array",
      description: "Informações necessárias que não estavam disponíveis nos dados enviados.",
      items: { type: "string" },
    },
    grupos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          grupo_id: { type: "string" },
          atividades: { type: "string", description: "Descrição resumida e técnica das atividades do GHE/setor." },
          organizacao: { type: "string", description: "Características da organização do trabalho do GHE/setor." },
          fatores: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                fator_key: { type: "string" },
                descricao: { type: "string" },
                fonte: { type: "string" },
                situacao: { type: "string" },
                interpretacao: { type: "string" },
                consequencias: { type: "string" },
                controles: { type: "string" },
              },
              required: ["fator_key", "descricao", "fonte", "situacao", "interpretacao", "consequencias", "controles"],
            },
          },
        },
        required: ["grupo_id", "atividades", "organizacao", "fatores"],
      },
    },
    medidas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          medida_key: { type: "string" },
          medida: { type: "string", description: "Ação concreta e aplicável ao risco identificado." },
          tipo: { type: "string" },
          responsavel: { type: "string", description: "Responsável por cargo/área (ex.: SESMT, Gestor do setor, RH)." },
          prazo: { type: "string" },
          prioridade: { type: "string" },
        },
        required: ["medida_key", "medida", "tipo", "responsavel", "prazo", "prioridade"],
      },
    },
  },
  required: ["metodologia", "conclusao", "intro_plano_acao", "lacunas", "grupos", "medidas"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contexto, baseTecnica } = await req.json();
    const pdfs: { name: string; data: string }[] = Array.isArray(baseTecnica) ? baseTecnica.slice(0, 6) : [];

    const userText = `# DADOS REAIS DO SISTEMA (fonte primária — não contradizer, não inventar)
\`\`\`json
${JSON.stringify(contexto || {}, null, 2)}
\`\`\`

# BASE TÉCNICA ANEXADA
${pdfs.length === 0
  ? "Nenhum PDF de base técnica cadastrado. Fundamente-se nas normas aplicáveis (NR-01, NR-17, ISO 45003) sem citar documentos inexistentes."
  : pdfs.map((p, i) => `- Documento ${i + 1}: ${p.name}`).join("\n")}

# INSTRUÇÕES DE SAÍDA
- Gere um texto exclusivo por campo, específico para esta empresa, seus setores/GHE e as funções avaliadas.
- Para cada grupo enviado, devolva o mesmo "grupo_id" e, para cada fator, o mesmo "fator_key".
- Para cada medida enviada, devolva o mesmo "medida_key" com uma ação real, viável e vinculada ao risco, ao setor e à atividade.
- Registre em "lacunas" toda informação necessária que não estava disponível nos dados recebidos.`;

    const userContent: any[] = [{ type: "text", text: userText }];
    for (const p of pdfs) {
      if (!p?.data) continue;
      userContent.push({
        type: "file",
        file: { filename: p.name || "base.pdf", file_data: `data:application/pdf;base64,${p.data}` },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "psico_output", strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gateway error", resp.status, errText);
      const msg = resp.status === 429
        ? "Limite de requisições da IA atingido. Tente novamente em instantes."
        : resp.status === 402
          ? "Créditos de IA esgotados. Adicione créditos no workspace."
          : "Falha ao gerar textos com IA: " + errText.slice(0, 400);
      return new Response(JSON.stringify({ error: msg }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content;
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return new Response(JSON.stringify({ error: "Resposta da IA não pôde ser interpretada." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ output: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Erro inesperado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
