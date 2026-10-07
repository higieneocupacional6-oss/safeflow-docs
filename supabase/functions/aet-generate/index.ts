// Edge function: Gera automaticamente uma AET via Lovable AI
// Recebe o contexto da AET + texto livre + anexos (imagens/PDFs). Retorna JSON com os campos.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { compactarContexto, gerarJsonEmFluxo, limitarAnexos, limitarTexto } from "../_shared/aiStream.ts";
import { extrairFocoAep } from "../_shared/aepAprofundamento.ts";
import { REDACAO_TECNICA, limparSaidaTecnica } from "../_shared/redacaoTecnica.ts";

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
- cronoanalise: tarefas do ciclo real documentado, com risco classificado (Baixo/Moderado/Alto/Crítico) e justificativa curta. Não criar tarefas para atingir quantidade; sem duração medida, descrever a tarefa e seu risco qualitativamente, sem estimar tempos.
- avaliacoes_dimensionais: compatibilidade antropométrica de mobiliário/equipamentos vs. trabalhador; sem medida disponível, analisar qualitativamente a compatibilidade com a atividade e a NR-17.3, sem citar a ausência.
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
- PDFs: extrair dados relevantes (jornada, POPs, laudos, OS) e integrá-los à análise.
- Quando houver poucas informações, complementar apenas com conhecimento técnico compatível com a função — sem inventar fatos, sem citar "documento não anexado" desnecessariamente.
- PROTEÇÃO ANTI-INVENÇÃO: Se uma informação não existe no contexto, nos anexos ou no relato e não pode ser inferida tecnicamente com segurança, não a invente e redija de forma técnica e neutra com os dados existentes, sem apontar a ausência.

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
      required: ["altura_mesa", "altura_assento", "profundidade_assento", "monitor", "distancia_olho_monitor", "espaco_pernas"],
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
        required: ["o_que", "como", "responsavel", "prazo", "justificativa", "prioridade", "resultado_esperado"],
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
    "avaliacoes_quantitativas_analise",
    "diagnostico_ergonomico",
    "conclusao",
    "plano_acao",
  ],
};


const psicoRules = `# INTEGRAÇÃO PSICOSSOCIAL (dados já avaliados para esta empresa)
- Use os dados psicossociais APENAS para correlação técnica. É PROIBIDO copiar, colar ou parafrasear literalmente textos do módulo Psicossocial.
- Prioridade: Empresa → Setor → GHE/GES → Função. Se houver dados do MESMO setor/GHE, use-os preferencialmente e não misture outros setores.
- Se os dados forem gerais da empresa (origem = "empresa"), utilize somente quando tecnicamente pertinentes e deixe explícito no texto que se trata de informação psicossocial geral da empresa, não específica do setor.
- Correlacione os fatores (exigências, ritmo, autonomia, apoio/liderança, reconhecimento, segurança, conflitos, jornada, comunicação, exigências cognitivas e emocionais) com as atividades, organização do trabalho, pausas, exigências físicas/cognitivas, riscos ergonômicos e medidas de prevenção observados.
- NUNCA invente dados psicossociais. Se não houver dados, redija normalmente sem qualquer menção a avaliação psicossocial.`;

function psicoBlock(p: any): string {
  if (!p || !p.disponivel) return "";
  return `${psicoRules}

## DADOS PSICOSSOCIAIS DISPONÍVEIS (origem: ${p.origem})
${p.observacao || ""}
\`\`\`json
${JSON.stringify({ alvo: p.alvo, setor: p.setor_resumo, empresa: p.empresa_resumo, indicadores: p.indicadores, avaliacoes: p.avaliacoes }, null, 2)}
\`\`\`

`;
}

const aepRules = `# INTEGRAÇÃO AEP → AET
- Os dados abaixo pertencem a uma AEP salva da MESMA empresa, contrato, setor/GHE e função.
- Use a AEP como análise preliminar anterior: aprofunde tecnicamente na AET, sem copiar literalmente e sem tratar conclusões preliminares como medições não realizadas.
- A AEP correspondente é o PONTO DE PARTIDA PRINCIPAL obrigatório da investigação. Leia a decisão: conduta_2 NÃO significa ausência de solução rápida e encaminhamento à AET; SIM indica solução preliminar/plano de ação, não recomendação de AET. Se decisão não informada, não invente encaminhamento.
- Identifique o MOTIVO registrado em parecer_conduta_2, inadequações, fatores de risco, checklist, situações que exigem investigação e medidas preliminares. Não afirme que uma medida falhou, foi implementada ou resolveu o problema sem evidência atual.
- Organize a AET em torno desses pontos: organização, demandas físicas/cognitivas, posturas, movimentos, esforços, repetitividade, ritmo, exposição, pausas, mobiliário, equipamentos, ferramentas, ambiente, método e interação trabalhador–atividade–ambiente, somente conforme evidências disponíveis.
- No diagnostico_ergonomico, explicite o vínculo "problema identificado na AEP → análise aprofundada na AET", distinguindo achados comprovados de hipóteses e investigações pendentes. Na conclusao, posicione-se sobre o motivo da indicação e o que permanece a investigar, sem repetir o diagnóstico.
- Cada ação deve vincular sua justificativa ao problema da AEP e detalhar solução prática, humana e aplicável, método de implantação e verificação da eficácia. Priorize eliminar/reduzir/mitigar o risco com processo, organização, equipamento, ambiente e método; evite "treinar o trabalhador" como solução genérica ou substituta de melhoria estrutural.
- A hierarquia é PSICOSSOCIAIS → AEP → AET. Preserve a coerência de identificação, atividade, organização, riscos e medidas.
- Não invente informações nem altere a AEP. Quando houver conflito, os dados atuais observados na AET e as edições do responsável técnico prevalecem.`;

function aepBlock(a: any): string {
  if (!a?.disponivel || !a?.setor) return "";
  return `${aepRules}\n\n## DECISÃO E FOCO DO APROFUNDAMENTO\n${JSON.stringify(compactarContexto(extrairFocoAep(a.setor)), null, 2)}\n\n## AEP CORRESPONDENTE (documento: ${a.documento_id || "não informado"})\n${a.observacao || ""}\n\`\`\`json\n${JSON.stringify(compactarContexto(a.setor), null, 2)}\n\`\`\`\n\n`;
}


const conhecimentoRules = `# BASE DE CONHECIMENTO TÉCNICO DO RESPONSÁVEL (Conhecimento IA — tipo {TIPO})
- Os documentos abaixo foram cadastrados pelo responsável técnico como FONTE DE CONSULTA COMPLEMENTAR para {TIPO}.
- Use-os para conferir conceitos, metodologias, itens e numerações de normas, critérios e fundamentação técnica, evitando citar itens normativos incorretos ou desatualizados.
- É PROIBIDO copiar trechos literais desses documentos para os campos da resposta; interprete e aplique ao caso concreto.
- NÃO se limite a esses arquivos: continue usando conhecimento técnico e normativo confiável já consolidado. A lógica é: conhecimento dos arquivos + conhecimento técnico externo confiável + dados preenchidos pelo usuário + dados do sistema.
- Em caso de divergência sobre a redação/numeração de um item normativo, prevalece o conteúdo dos arquivos cadastrados.
- Use SOMENTE o conhecimento do tipo {TIPO}; nunca aplique base de outro tipo de documento.
- Esses arquivos são referência técnica, não fatos da empresa: nunca extraia deles dados do posto, colaboradores, medições ou condições avaliadas.`;

function conhecimentoBlock(c: any, tipo: string): string {
  if (!c || !c.disponivel) return "";
  const pastas = (c.pastas || [])
    .map((p: any) => `- ${p.nome}: ${(p.arquivos || []).join(", ") || "(sem arquivos)"}`)
    .join("\n");
  return `${conhecimentoRules.split("{TIPO}").join(tipo)}

## PASTAS E ARQUIVOS DISPONÍVEIS
${pastas}

`;
}

type ConhecimentoAnexo = { name: string; mime: string; data: string; pasta?: string };

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

    const { descricao, contexto, anexos, instrucoes_usuario, psicossocial, aep, conhecimento } = await req.json();
    if (!descricao || typeof descricao !== "string" || descricao.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Descreva com mais detalhes o que foi observado in loco (mínimo 20 caracteres)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anexosArr: Anexo[] = Array.isArray(anexos) ? limitarAnexos(anexos, 10) : [];
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

    const psicoTxt = psicoBlock(psicossocial);
    const aepTxt = aepBlock(aep);
    const conhecTxt = conhecimentoBlock(conhecimento, "AET");

    const userText = `${instrBlock}${conhecTxt}${psicoTxt}${aepTxt}# RELATO DA AVALIAÇÃO IN LOCO (usuário — traduzir para linguagem técnica)
${descricao.trim()}

# CONTEXTO CADASTRADO (fonte primária — NÃO contradizer)
\`\`\`json
${JSON.stringify(compactarContexto(contexto || {}), null, 2)}
\`\`\`

# ANEXOS
${anexosArr.length === 0 ? "Nenhum anexo enviado." : anexosArr.map((a, i) => `- Anexo ${i + 1}: ${a.name} (${a.kind === "image" ? "Fotografia" : "PDF"})`).join("\n")}

# INSTRUÇÕES DE SAÍDA
Gere a AET completa em JSON conforme o schema, respeitando o OBJETIVO ÚNICO de cada campo (ver system) — cada campo deve ter texto exclusivo, sem repetir sentenças ou parágrafos de outros campos.
- "posto_trabalho": apenas ambiente/mobiliário/layout/dimensões observadas.
- "descricao_atividade": apenas trabalho real executado, método e sequência operacional.
- "analise_organizacional": organização, autonomia, supervisão, suporte, psicossocial (COPSOQ).
- "ritmo_complexidade": intensidade, repetitividade, exigência cognitiva/física, pressão.
- "jornada_aspectos": jornada, pausas, turnos, rodízios — aderência à NR-17.6.
- "caracterizacao_biomecanica": posturas, amplitudes, cargas — interpretar escores (RULA/REBA/OCRA/OWAS/NIOSH/Moore-Garg) com faixas de risco, citando ISO 11226/11228.
- "cronoanalise": somente tarefas reais documentadas, risco justificado; sem tempo medido, não citar duração. Não inventar duração ou tarefas.
- "avaliacoes_dimensionais": cada chave = TEXTO técnico (Adequado/Inadequado + justificativa antropométrica citando norma). Sem medida disponível: análise qualitativa, sem citar ausência.
- "avaliacoes_quantitativas_analise": parágrafo comparando valores medidos com limites (NHO-01, NBR ISO 8995, ISO 7730, NR-17), classificando conformidade.
- "diagnostico_ergonomico": SINTETIZAR físico + organizacional + psicossocial em consolidação nova, com causas/consequências/nível de exposição — não copiar campos anteriores.
- "conclusao": posicionamento técnico final classificando a condição ergonômica — não repetir o diagnóstico.
- "plano_acao": 3 a 6 ações concretas com "justificativa" (norma/técnica), "prioridade" (Alta/Média/Baixa), "resultado_esperado", responsável nominado por cargo e prazo em dias.
- Fotografias: descrever mobiliário, postura, layout, EPIs, iluminação e integrar à análise biomecânica.
- PDFs: extrair jornada/POPs/laudos/OS e integrá-los à análise.
- Se houver DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO no topo, obedeça-as INTEGRALMENTE como método de redação — sem, em hipótese alguma, reproduzir seu texto na resposta.
- Quando faltarem dados, complementar apenas com conhecimento técnico compatível com a função — sem inventar fatos.`;

    // Build multimodal content array
    const userContent: any[] = [{ type: "input_text", text: limitarTexto(userText) }];
    const conhecAnexos: ConhecimentoAnexo[] = Array.isArray(conhecimento?.anexos)
      ? limitarAnexos(conhecimento.anexos, 10)
      : [];
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
        userContent.push({
          type: "input_image",
          image_url: `data:${a.mime};base64,${a.data}`,
        });
      } else if (a.kind === "pdf" && a.data) {
        userContent.push({
          type: "input_file",
          filename: a.name || "documento.pdf",
          file_data: `data:${a.mime || "application/pdf"};base64,${a.data}`,
        });
      }
    }

    return await gerarJsonEmFluxo({
      req, corsHeaders, key,
      systemPrompt: `${SYSTEM_PROMPT}\n${REDACAO_TECNICA}\n- A AET deve ser mais profunda que a AEP: identificar o motivo da indicação e aprofundar exatamente os problemas e pontos de atenção da AEP correspondente, conforme a NR-17, sem mencionar a AEP como fonte.`,
      posProcessar: limparSaidaTecnica,
      userContent,
      schemaName: "aet_output",
      schema: RESPONSE_SCHEMA,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
