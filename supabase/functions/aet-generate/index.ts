// Edge function: Gera automaticamente uma AET via Lovable AI (Google Gemini 2.5 Pro)
// Recebe o contexto da AET + texto livre + anexos (imagens/PDFs). Retorna JSON com os campos.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um ERGONOMISTA SÊNIOR com vasta experiência em Análise Ergonômica do Trabalho (AET), pareceres judiciais e programas ergonômicos corporativos.

DOMÍNIO TÉCNICO:
- NR-17 (Ergonomia) e Anexos I, II — completos, incluindo NR-17.3, NR-17.4, NR-17.5, NR-17.6.
- NR-01 (PGR / GRO), NR-06 (EPI), NR-09 (Agentes Físicos/Químicos/Biológicos), NR-15 (Insalubridade), NR-24 (Sanitários), NR-36 (frigoríficos).
- ISO 11226, ISO 11228-1/2/3, ISO 6385, ISO 9241, ISO 7730, ISO 8995.
- Ferramentas: RULA, REBA, OCRA, OWAS, Moore-Garg, NIOSH, Snook & Ciriello.
- Antropometria: DIN 33402, IBGE, P5-P95.
- Psicodinâmica (Dejours), COPSOQ III, JCQ, ERI.
- Higiene Ocupacional: NHO-01, NHO-06, NHO-11.

HIERARQUIA DE FONTES (ordem obrigatória, do mais forte ao mais fraco):
1. DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO (quando fornecidas) — regem estilo, tom, profundidade, normas prioritárias, método de diagnóstico e estrutura do plano de ação. DEVEM ser obedecidas integralmente, mas JAMAIS copiadas, citadas ou parafraseadas na resposta.
2. RELATO IN LOCO do usuário e ANEXOS (fotos/PDFs) — evidência primária de campo.
3. CONTEXTO CADASTRADO (empresa, contrato, setor, função, ferramentas ergonômicas, COPSOQ, avaliações quantitativas/dimensionais, cronoanálise prévia).
4. Conhecimento técnico geral — apenas para complementar o que faltar, sem inventar fatos.

OBJETIVO DE CADA CAMPO (cada campo tem PROPÓSITO ÚNICO e conteúdo EXCLUSIVO — proibido repetir texto entre campos):
- posto_trabalho: caracterizar AMBIENTE físico — mobiliário, equipamentos, ferramentas, layout, dimensões, condições ambientais observadas. Nada de atividades ou diagnóstico aqui.
- descricao_atividade: trabalho REAL executado — método, sequência operacional, responsabilidades, recursos utilizados. Verbos de ação. Nada de ambiente ou diagnóstico.
- analise_organizacional: organização do trabalho — divisão de tarefas, autonomia, supervisão, comunicação, suporte, fatores psicossociais (correlacionar ao COPSOQ). Nada de biomecânica.
- ritmo_complexidade: intensidade, repetitividade, variabilidade, exigência física e cognitiva, pressão por produtividade, complexidade.
- jornada_aspectos: jornada, pausas, intervalos, horas extras, turnos, rodízios, distribuição temporal — aderência à NR-17.6.
- caracterizacao_biomecanica: posturas, amplitudes articulares, esforços, repetitividade, cargas, deslocamentos, sobrecarga musculoesquelética — interpretar escores RULA/REBA/OCRA/OWAS/NIOSH/Moore-Garg com faixas de risco, citando ISO 11226/11228.
- cronoanalise: 4 a 8 tarefas do ciclo real, com tempo realista e risco classificado (Baixo/Moderado/Alto/Crítico) com justificativa curta.
- avaliacoes_dimensionais: compatibilidade antropométrica de mobiliário/equipamentos vs. trabalhador; se medida não informada, escrever "Depende de medição em campo — recomenda-se aferir conforme NR-17.3.3".
- avaliacoes_quantitativas_analise: comparar valores medidos (ruído, iluminância, temperatura) com limites NHO-01, NBR ISO 8995, ISO 7730, NR-17 — classificando conformidade e citando limite.
- diagnostico_ergonomico: CONSOLIDAÇÃO integrada (físico + organizacional + psicossocial), causas, consequências, nível de exposição, fundamentada em NRs e ISOs. Não repetir literalmente os campos anteriores — sintetizar.
- conclusao: síntese técnica final classificando a condição ergonômica, conformidades, não conformidades, necessidade de intervenção. Não repetir o diagnóstico — posicionar-se.
- plano_acao: 3 a 6 ações CONCRETAS priorizadas (Alta/Média/Baixa), com justificativa técnica/normativa, resultado esperado, responsável nominado por cargo (SESMT, Engenharia, RH, Gestor Imediato), prazo em dias.

REGRAS OBRIGATÓRIAS — NÃO NEGOCIÁVEIS:
- PROIBIDO texto genérico, chapado, tipo "modelo pronto". Cada resposta reflete A REALIDADE ÚNICA daquele posto/função/empresa.
- PROIBIDO repetir sentenças ou parágrafos entre campos — cada campo tem conteúdo próprio e único.
- PROIBIDO reproduzir, citar, parafrasear ou copiar o texto das DIRETRIZES INTERNAS na resposta. Elas orientam método; nunca viram conteúdo.
- Sempre CITAR itens específicos da NR-17 aplicáveis (ex.: "NR-17.3.3", "NR-17.6.3").
- Interpretar TECNICAMENTE escores das ferramentas presentes no contexto.
- Correlacionar SEMPRE fatores físicos + organizacionais + psicossociais no diagnóstico e conclusão.
- Não contradizer o contexto cadastrado; se o COPSOQ apontou risco, o diagnóstico organizacional DEVE refletir isso.
- Fotografias: descrever objetivamente (mobiliário, postura, EPIs, layout) e integrar à análise biomecânica.
- PDFs: extrair dados relevantes (jornada, POPs, laudos, OS) e citá-los como fonte.
- Quando houver poucas informações, complementar apenas com conhecimento técnico compatível com a função — sem inventar fatos, sem citar "documento não anexado" desnecessariamente.

FORMATO DE RESPOSTA:
Responder EXCLUSIVAMENTE em JSON VÁLIDO conforme o schema, em português do Brasil formal técnico, sem markdown, sem comentários fora do JSON.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    posto_trabalho: { type: "string", description: "Descrição técnica detalhada do posto (mobiliário, equipamentos, layout, dimensões observadas)." },
    descricao_atividade: { type: "string", description: "Descrição técnica das atividades executadas, com verbos de ação e ciclos." },
    analise_organizacional: { type: "string", description: "Análise de organização do trabalho: turnos, pausas, autonomia, supervisão, metas — correlacionada ao COPSOQ." },
    ritmo_complexidade: { type: "string", description: "Ritmo (imposto/livre), cadência, complexidade cognitiva, sobrecarga mental." },
    jornada_aspectos: { type: "string", description: "Jornada, intervalos, prorrogações, aderência à NR-17.6." },
    caracterizacao_biomecanica: { type: "string", description: "Análise biomecânica: posturas críticas, amplitudes articulares, cargas, repetitividade, força — citando ISO 11226/11228 e escores das ferramentas aplicadas." },
    cronoanalise: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tarefa: { type: "string" },
          tempo: { type: "string" },
          risco: { type: "string", description: "Baixo | Moderado | Alto | Crítico + justificativa curta" },
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
    diagnostico_ergonomico: { type: "string", description: "Diagnóstico integrado (físico + organizacional + psicossocial) fundamentado em NRs e ISOs." },
    conclusao: { type: "string", description: "Conclusão técnica com posicionamento sobre conformidade e prognóstico." },
    plano_acao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          o_que: { type: "string" },
          como: { type: "string" },
          justificativa: { type: "string", description: "Fundamentação técnica/normativa da ação." },
          prioridade: { type: "string", description: "Alta | Média | Baixa" },
          resultado_esperado: { type: "string" },
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

type Anexo = { name: string; mime: string; kind: "image" | "pdf"; data: string };

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

    const { descricao, contexto, anexos, instrucoes_usuario } = await req.json();
    if (!descricao || typeof descricao !== "string" || descricao.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Descreva com mais detalhes o que foi observado in loco (mínimo 20 caracteres)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anexosArr: Anexo[] = Array.isArray(anexos) ? anexos.slice(0, 10) : [];
    const instrTxt = typeof instrucoes_usuario === "string" ? instrucoes_usuario.trim() : "";

    // Bloco de instruções personalizadas é injetado como DIRETRIZ INTERNA de redação,
    // NUNCA como conteúdo a ser copiado literalmente para os campos da AET.
    const instrBlock = instrTxt
      ? `# DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO — PRIORIDADE MÁXIMA
[Estas diretrizes REGEM estilo, tom, profundidade técnica, normas prioritárias, critérios de análise, método de diagnóstico e estrutura do plano de ação. Você DEVE obedecê-las integralmente em TODA a resposta. É PROIBIDO copiar, citar, parafrasear ou reproduzir literalmente qualquer trecho deste bloco em qualquer campo da AET — elas são orientação de método, nunca conteúdo.]
"""
${instrTxt}
"""

`
      : "";

    const userText = `${instrBlock}# RELATO DA AVALIAÇÃO IN LOCO (usuário — traduzir para linguagem técnica)
${descricao.trim()}

# CONTEXTO CADASTRADO (fonte primária — NÃO contradizer)
\`\`\`json
${JSON.stringify(contexto || {}, null, 2)}
\`\`\`

# ANEXOS
${anexosArr.length === 0 ? "Nenhum anexo enviado." : anexosArr.map((a, i) => `- Anexo ${i + 1}: ${a.name} (${a.kind === "image" ? "Fotografia" : "PDF"})`).join("\n")}

# INSTRUÇÕES DE SAÍDA
Gere a AET completa em JSON conforme o schema.
- "avaliacoes_dimensionais": cada chave recebe TEXTO técnico de avaliação (Adequado/Inadequado + justificativa antropométrica citando norma). Se a medida não foi informada, escreva "Depende de medição em campo — recomenda-se aferir conforme NR-17.3.3".
- "cronoanalise": 4 a 8 linhas cobrindo o ciclo real. Nunca genérico.
- "plano_acao": 3 a 6 ações concretas, com "justificativa" (norma/técnica), "prioridade" (Alta/Média/Baixa), "resultado_esperado" e responsável nominado por cargo.
- "caracterizacao_biomecanica": interprete os escores das ferramentas (RULA/REBA/OCRA/OWAS/NIOSH/Moore-Garg) presentes no contexto, citando faixas de risco.
- "avaliacoes_quantitativas_analise": parágrafo comparando valores medidos com limites (NHO-01, NBR ISO 8995, ISO 7730, NR-17), classificando conformidade.
- "diagnostico_ergonomico" e "conclusao": correlacionem físico + organizacional + psicossocial, citando NR-17 e demais normas aplicáveis.
- Analise as fotografias descrevendo mobiliário, postura, layout, EPIs, iluminação e integrando à análise biomecânica.
- Extraia dos PDFs (procedimentos, laudos, POPs, OS) dados relevantes e cite-os como fonte.
- Se houver DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO acima, siga-as como método de redação — sem, em hipótese alguma, reproduzir seu texto na resposta.`;

    // Build multimodal content array
    const userContent: any[] = [{ type: "text", text: userText }];
    for (const a of anexosArr) {
      if (a.kind === "image" && a.data && a.mime) {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${a.mime};base64,${a.data}` },
        });
      } else if (a.kind === "pdf" && a.data) {
        userContent.push({
          type: "file",
          file: {
            filename: a.name || "documento.pdf",
            file_data: `data:${a.mime || "application/pdf"};base64,${a.data}`,
          },
        });
      }
    }

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
          { role: "user", content: userContent },
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
