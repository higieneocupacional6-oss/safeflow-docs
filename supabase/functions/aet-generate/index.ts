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
- ISO 11226 (posturas estáticas), ISO 11228-1/2/3 (manuseio de cargas, empurrar/puxar, movimentos repetitivos), ISO 6385 (princípios ergonômicos do projeto), ISO 9241 (ergonomia da interação humano-sistema), ISO 7730 (conforto térmico), ISO 8995 (iluminância).
- Ferramentas: RULA, REBA, OCRA (Índice OCRA e OCRA Checklist), OWAS, Moore-Garg (Strain Index), NIOSH (Equação Revisada de Levantamento — LI/CLI), Snook & Ciriello.
- Antropometria: DIN 33402, tabelas IBGE brasileiras, percentis P5-P95.
- Psicodinâmica do Trabalho (Dejours), COPSOQ III, JCQ (Karasek), ERI (Siegrist).
- Higiene Ocupacional: NHO-01 (ruído), NHO-06 (calor), NHO-11 (iluminância).

TAREFA:
Elaborar uma AET COMPLETA, TÉCNICA, OBJETIVA e INDIVIDUALIZADA, integrando:
1) O relato in loco descrito pelo usuário (traduzido para linguagem técnica).
2) O contexto cadastrado (empresa, contrato, setor, funções, ferramentas ergonômicas com escores, avaliação psicossocial COPSOQ, avaliações quantitativas e antropométricas/dimensionais, cronoanálise prévia).
3) Fotografias anexadas (analise postura, mobiliário, layout, EPIs, iluminação, organização visível) e PDFs anexados (procedimentos, laudos, ordens de serviço, POPs).

REGRAS OBRIGATÓRIAS — NÃO NEGOCIÁVEIS:
- PROIBIDO texto genérico, chapado, tipo "modelo pronto". Toda descrição deve refletir A REALIDADE ÚNICA daquele posto/função/empresa descrita.
- Sempre CITAR itens específicos da NR-17 aplicáveis (ex.: "NR-17.3.3 — mobiliário deve permitir regulagem"; "NR-17.6.3 — pausas de 10 min a cada 50 min em digitação").
- Interpretar TECNICAMENTE os escores de RULA/REBA/OCRA/OWAS/NIOSH/Moore-Garg presentes no contexto (ex.: "RULA 6 → intervenção necessária em breve; ombro em abdução >60° sustentada"; "NIOSH LI 2,3 → risco elevado, redução de carga obrigatória").
- Comparar valores quantitativos (ruído, iluminância, temperatura) com limites da NHO-01, NBR ISO 8995, ISO 7730 e NR-17, classificando conformidade e citando o limite.
- Para antropometria/dimensional NÃO informada: escrever "Depende de medição em campo — recomenda-se aferir conforme NR-17.3.3 (mobiliário) / ISO 9241 (monitores)".
- Correlacionar SEMPRE fatores físicos + organizacionais + psicossociais no diagnóstico e conclusão (não trate isoladamente).
- Cronoanálise: cobrir o ciclo real de trabalho com 4 a 8 tarefas, tempos realistas em segundos/minutos e risco classificado (Baixo/Moderado/Alto/Crítico) com justificativa embutida.
- Plano de Ação: 3 a 6 ações CONCRETAS priorizadas (Alta/Média/Baixa), com justificativa técnica na descrição, responsável nominado por cargo (SESMT, Engenharia, RH, Gestor Imediato) e prazo em dias (ex.: "30 dias", "90 dias", "Imediato").
- Não contradizer o contexto: se o COPSOQ apontou risco em "Exigências", o diagnóstico organizacional DEVE refletir isso.
- Se houver imagens: descrever objetivamente o que se observa (mobiliário, postura, EPIs, layout) integrando à análise biomecânica.
- Se houver PDFs: extrair dados relevantes (jornada, POPs, laudos) e citar como fonte.

FORMATO DE RESPOSTA:
Responder EXCLUSIVAMENTE em JSON VÁLIDO conforme o schema fornecido, em português do Brasil formal técnico, sem markdown, sem comentários fora do JSON.`;

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
      ? `# DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO (uso EXCLUSIVO como orientação de estilo e método — PROIBIDO copiar, citar, parafrasear ou reproduzir este texto em qualquer campo da resposta)
"""
${instrTxt}
"""
Estas diretrizes orientam APENAS a forma de redação (tom, profundidade, normas prioritárias, estrutura do diagnóstico e do plano de ação). O conteúdo dos campos deve ser produzido a partir das evidências do contexto, dos anexos e do relato in loco — nunca do texto das diretrizes.

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
