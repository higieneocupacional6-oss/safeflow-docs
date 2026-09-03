// Edge function: gera automaticamente a análise da AEP (Análise Ergonômica Preliminar)
// via Lovable AI. Recebe contexto do setor/função + relato in loco + anexos (fotos/PDFs).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um ERGONOMISTA SÊNIOR responsável pela elaboração de AEP — Análise Ergonômica Preliminar (NR-17, NR-01/GRO).

DOMÍNIO TÉCNICO: NR-17 e anexos, NR-01 (GRO/PGR), NR-06, ISO 11226, ISO 11228-1/2/3, ISO 6385, ISO 9241, ISO 7730, ISO 8995, RULA/REBA/OCRA/OWAS/NIOSH, antropometria (DIN 33402, IBGE P5-P95), COPSOQ III.

FLUXO OBRIGATÓRIO DE LEITURA (nesta ordem exata, sem pular etapas):
1. ETAPA 1 — Ler e interpretar PRIMEIRO o texto digitado pelo usuário (informações complementares). É o PONTO DE PARTIDA da análise.
2. ETAPA 2 — Ler os dados da empresa (razão social, nome fantasia, CNPJ, CNAE, grau de risco, endereço, contrato/unidade).
3. ETAPA 3 — Ler a identificação do setor da AEP: GES, setor, descrição do ambiente, funções avaliadas, nº de funcionários, colaboradores, atividade, turno e postura.
4. ETAPA 4 — Consultar o cadastro Empresa → Setores → Funções para saber quais funções existem naquele setor/empresa.
5. ETAPA 5 — Cruzar todas as fontes acima e compreender qual atividade real está sendo avaliada.
6. ETAPA 6 — SOMENTE DEPOIS analisar as fotografias, como informação COMPLEMENTAR. Distinguir explicitamente o que é identificado na imagem do que é presumido ("observa-se na imagem…" vs "possivelmente…"). Nunca afirmar como fato o que não é visualmente verificável.
7. ETAPA 7 — Gerar checklist, riscos, pareceres, condutas e plano de ação.

HIERARQUIA: INFORMAÇÃO DO USUÁRIO → DADOS DA EMPRESA → GES/SETOR/AMBIENTE/FUNÇÕES → CADASTRO DE SETORES E FUNÇÕES → FOTOGRAFIAS → ANÁLISE → AEP. Os demais dados COMPLEMENTAM e validam o texto do usuário; nunca o substituem ou contradizem.

FUNÇÕES: usar prioritariamente as funções selecionadas em "funções avaliadas". Se nenhuma foi selecionada, usar as funções cadastradas do setor apenas como contexto/sugestão, sem produzir avaliação definitiva para função não escolhida. PROIBIDO inventar funções, setores ou GES não cadastrados.

PROIBIDO INVENTAR: função, setor, GES, quantidade de funcionários, colaborador, equipamento, condição ambiental, controle existente, responsável, prazo, exposição, frequência ou qualquer dado não fornecido. Quando faltar informação: usar apenas o que for tecnicamente sustentável, deixar o campo vazio para preenchimento manual, ou registrar "Informação não fornecida".

REGRAS OBRIGATÓRIAS:
- Toda análise deve derivar EXCLUSIVAMENTE das informações fornecidas.
- PROIBIDO gerar riscos genéricos sem relação com a função e a atividade descritas.
- PROIBIDO repetir sentenças entre campos; cada campo tem conteúdo exclusivo.
- Linguagem técnica, formal, em português do Brasil, citando itens específicos da NR-17 quando aplicável.
- Não inventar responsáveis nominais: quando não informados, usar cargos genéricos adequados (ex.: "Gestão/Supervisão do setor", "SESMT", "Engenharia de Segurança").
- Probabilidade: Baixa | Média | Alta. Severidade: Leve | Moderada | Grave. O nível de risco é calculado pelo sistema — não é necessário informá-lo.
- riscos_ergonomicos: 3 a 8 riscos reais e específicos, classificados em Ergonômico físico, Ergonômico organizacional, Ergonômico cognitivo ou Ergonômico psicossocial.
- checklist: retornar as 5 linhas fixas (chaves: organizacao_trabalho, levantamento_transporte_cargas, mobiliario, maquinas_equipamentos_ferramentas, conforto_ambiente), com quantidade de itens inadequados (número como texto; vazio se não sustentável), condição (Adequado | Parcialmente adequado | Inadequado | Não aplicável) e observação técnica objetiva.
- conduta_1 (Há condição inadequada que necessita de soluções?) e conduta_2 (Foi encontrada solução rápida de baixo investimento e complexidade?) devem ser "SIM" ou "NÃO", coerentes com os riscos identificados e com o checklist.
- parecer_conduta_1 e parecer_conduta_2 devem ADAPTAR tecnicamente os textos de referência à situação real analisada, jamais copiá-los literalmente.
- plano_acao: ações concretas derivadas dos riscos e medidas recomendadas, com responsável e prazo editáveis.
- Respeitar o campo "modo" do contexto: em COMPLEMENTAR, não contradizer o conteúdo já preenchido.

FORMATO: responder EXCLUSIVAMENTE em JSON VÁLIDO conforme o schema, sem markdown.`;


const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    riscos_ergonomicos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tipo_agente: { type: "string", description: "Ergonômico físico | Ergonômico organizacional | Ergonômico cognitivo | Ergonômico psicossocial" },
          fator_risco: { type: "string" },
          fonte_geradora: { type: "string" },
          possiveis_danos: { type: "string" },
          controle_existente: { type: "string" },
          probabilidade: { type: "string", description: "Baixa | Média | Alta" },
          severidade: { type: "string", description: "Leve | Moderada | Grave" },
          medidas: { type: "string" },
        },
        required: [
          "tipo_agente", "fator_risco", "fonte_geradora", "possiveis_danos",
          "controle_existente", "probabilidade", "severidade", "medidas",
        ],
        additionalProperties: false,
      },
    },
    parecer_ambiente: { type: "string", description: "Parecer técnico do ambiente de trabalho: características, conforto, mobiliário, equipamentos, organização, checklist e riscos." },
    parecer_ergonomia: { type: "string", description: "Parecer ergonômico específico: atividade, função, postura, organização, fatores, controles, nível de risco e medidas." },
    conduta_1: { type: "string", description: "SIM | NÃO — Há condição inadequada que necessita de soluções?" },
    parecer_conduta_1: { type: "string" },
    conduta_2: { type: "string", description: "SIM | NÃO — Foi encontrada solução rápida de baixo investimento e complexidade?" },
    parecer_conduta_2: { type: "string" },
    plano_acao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          acao: { type: "string" },
          responsavel: { type: "string" },
          prazo: { type: "string" },
        },
        required: ["acao", "responsavel", "prazo"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "riscos_ergonomicos", "parecer_ambiente", "parecer_ergonomia",
    "conduta_1", "parecer_conduta_1", "conduta_2", "parecer_conduta_2", "plano_acao",
  ],
  additionalProperties: false,
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

    const anexosArr: Anexo[] = Array.isArray(anexos) ? anexos.slice(0, 10) : [];
    const instrTxt = typeof instrucoes_usuario === "string" ? instrucoes_usuario.trim() : "";

    const instrBlock = instrTxt
      ? `# DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO — PRIORIDADE MÁXIMA
[Regem estilo, tom, profundidade e método. É PROIBIDO copiar ou citar este bloco na resposta.]
"""
${instrTxt}
"""

`
      : "";

    const userText = `${instrBlock}# RELATO DA AVALIAÇÃO IN LOCO (usuário)
${typeof descricao === "string" && descricao.trim() ? descricao.trim() : "Sem relato complementar — basear-se integralmente no contexto cadastrado."}

# CONTEXTO CADASTRADO (fonte primária — NÃO contradizer)
\`\`\`json
${JSON.stringify(contexto || {}, null, 2)}
\`\`\`

# ANEXOS
${anexosArr.length === 0 ? "Nenhum anexo enviado." : anexosArr.map((a, i) => `- Anexo ${i + 1}: ${a.name} (${a.kind === "image" ? "Fotografia" : "PDF"})`).join("\n")}

# TEXTOS DE REFERÊNCIA (adaptar tecnicamente, nunca copiar)
- Conduta 1 = NÃO: "As condições são aceitáveis. Documentar, manter as medidas existentes e disponibilizar os resultados aos responsáveis."
- Conduta 1 = SIM: "As inadequações identificadas devem ser discutidas com os responsáveis, apresentando-se os resultados da AEP e definindo-se as medidas necessárias para controle ou correção das condições observadas."
- Conduta 2 = NÃO: "Realizar AET — Análise Ergonômica do Trabalho, nos termos da NR-17, para aprofundamento da avaliação e definição das medidas ergonômicas necessárias."
- Conduta 2 = SIM: "Elaborar plano de ação e implantar as medidas recomendadas."

# INSTRUÇÕES DE SAÍDA
Gerar JSON conforme o schema, com riscos ergonômicos específicos da função/atividade avaliada, pareceres técnicos exclusivos, condutas coerentes e plano de ação derivado das medidas recomendadas.`;

    const userContent: any[] = [{ type: "text", text: userText }];
    for (const a of anexosArr) {
      if (a.kind === "image" && a.data && a.mime) {
        userContent.push({ type: "image_url", image_url: { url: `data:${a.mime};base64,${a.data}` } });
      } else if (a.kind === "pdf" && a.data) {
        userContent.push({
          type: "file",
          file: { filename: a.name || "documento.pdf", file_data: `data:${a.mime || "application/pdf"};base64,${a.data}` },
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
          json_schema: { name: "aep_output", strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gateway error", resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha ao gerar AEP: " + errText.slice(0, 400) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content;
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return new Response(JSON.stringify({ error: "Resposta da IA não pôde ser interpretada.", raw }), {
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
