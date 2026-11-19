/**
 * AET convencional — prompt, schema e pós-processamento alinhados ao formulário
 * (AetWizard) e à edge function aet-generate, com ênfase em análise ergonômica
 * profissional e exclusividade de conteúdo por campo.
 */
import { compactarContexto, limitarAnexos, limitarTexto, type PedidoGeracao } from "../gemini.js";
import { limparSaidaTecnica, REDACAO_TECNICA } from "../redacao.js";
import { INSTRUCAO_CONTEXTO_ERGO_INTEGRADO } from "../lib/contextoErgoIntegrado.js";

function extrairFocoAep(setor: Record<string, any>) {
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const normalizar = (v: unknown) =>
    texto(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const conduta2 = normalizar(setor.conduta_2);
  const parecer = texto(setor.parecer_conduta_2);
  const indicacao = conduta2 === "NAO"
    ? "recomendada"
    : conduta2 === "SIM"
      ? "solucao_preliminar_indicada"
      : "nao_informada";
  return {
    indicacao_aet: indicacao,
    motivo_registrado: parecer,
    condicao_inadequada: texto(setor.conduta_1),
    parecer_condicao: texto(setor.parecer_conduta_1),
    problemas_preliminares: texto(setor.parecer_ergonomia),
    ambiente_preliminar: texto(setor.parecer_ambiente),
    fatores_identificados: Array.isArray(setor.riscos_lista) ? setor.riscos_lista : [],
    checklist: setor.checklist && typeof setor.checklist === "object" ? setor.checklist : {},
    medidas_preliminares: Array.isArray(setor.plano_acao) ? setor.plano_acao : [],
    limite_evidencia:
      "Achados e medidas preliminares; eficácia, tempos, medições e solução definitiva somente quando comprovados pelos dados atuais.",
  };
}

const SYSTEM_PROMPT = `Você é um ERGONOMISTA PROFISSIONAL SÊNIOR elaborando Análise Ergonômica do Trabalho (AET) para documento técnico oficial.

POSTURA PROFISSIONAL:
- Interprete a FUNÇÃO e as ATIVIDADES REALMENTE executadas antes de redigir qualquer campo.
- Analise exigências físicas, cognitivas e organizacionais daquela função específica.
- Identifique fatores de risco ergonômico pertinentes à atividade real — não a um modelo genérico de "trabalho".
- Fundamente em NR-17 (e anexos), NR-01 (GRO/PGR) e normas técnicas aplicáveis (ISO 11226, ISO 11228, ISO 6385, NHO-01, NBR ISO 8995, ISO 7730, quando cabível).
- Cada AET deve ser INDIVIDUALIZADA: auxiliar de sondagem, operador de motosserra e analista administrativo NÃO podem receber análises intercambiáveis.
- Linguagem técnica, profissional e normativa, em português do Brasil. Textos curtos quando a informação for simples; desenvolvidos quando houver detalhes que justifiquem. Evite frases genéricas, repetitivas ou artificiais.

DOMÍNIO TÉCNICO:
- NR-17 (Ergonomia) e Anexos I/II — NR-17.3, NR-17.4, NR-17.5, NR-17.6.
- NR-01 (PGR/GRO), NR-06, NR-09, NR-15, NR-24, NR-36 (quando aplicável).
- Ferramentas: RULA, REBA, OCRA, OWAS, Moore-Garg, NIOSH, Snook & Ciriello — interpretar SOMENTE escores presentes no contexto; nunca inventar pontuações.
- Antropometria (DIN 33402, IBGE P5-P95) e higiene ocupacional (NHO-01, NHO-06, NHO-11) quando houver dados.

HIERARQUIA DE FONTES (do mais forte ao mais fraco):
1. DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO (método/estilo — jamais copiar na resposta).
2. RELATO IN LOCO e ANEXOS (fotos/PDFs) — evidência primária.
3. CONTEXTO CADASTRADO (empresa, contrato, setor, função, ferramentas, COPSOQ, avaliações, cronoanálise prévia).
4. Formulário AEP/AET e avaliações ergonômicas (ROSA/OCRA/RULA/REBA/OWAS/NIOSH) do mesmo escopo — somente leitura.
5. AEP correspondente (aprofundamento, não cópia literal).
6. Conhecimento técnico geral — complementar sem inventar fatos.

${INSTRUCAO_CONTEXTO_ERGO_INTEGRADO}

FINALIDADE EXCLUSIVA DE CADA CAMPO (proibido repetir o mesmo texto/parágrafo em campos diferentes):
- posto_trabalho: AMBIENTE físico — mobiliário, equipamentos, ferramentas, layout, dimensões, condições ambientais observadas. NÃO descreva a sequência da atividade nem o diagnóstico.
- descricao_atividade: trabalho REAL — método, sequência operacional, responsabilidades, recursos. Verbos de ação. NÃO descreva layout/ambiente nem diagnóstico.
- analise_organizacional: organização — divisão de tarefas, autonomia, supervisão, comunicação, suporte, psicossocial (COPSOQ quando houver). NÃO faça biomecânica.
- ritmo_complexidade: intensidade, repetitividade, variabilidade, exigência física/cognitiva, pressão por produtividade, complexidade da tarefa.
- jornada_aspectos: jornada, pausas, intervalos, horas extras, turnos, rodízios, distribuição temporal — aderência à NR-17.6.
- caracterizacao_biomecanica: posturas, amplitudes, esforços, cargas, deslocamentos, sobrecarga musculoesquelética — ISO 11226/11228; interpretar escores existentes.
- cronoanalise: tarefas reais do ciclo, com tempo (só se medido) e risco Baixo|Moderado|Alto|Crítico + justificativa curta. Sem tempo medido: tempo vazio ou qualitativo, sem inventar segundos.
- avaliacoes_dimensionais: objeto com chaves altura_mesa, altura_assento, profundidade_assento, monitor, distancia_olho_monitor, espaco_pernas — cada valor é texto Adequado/Inadequado + justificativa antropométrica (NR-17.3). Sem medida: análise qualitativa pertinente à função (ex.: posto de campo vs. administrativo), sem inventar cm.
- avaliacoes_quantitativas_analise: comparar valores MEDIDOS (ruído, iluminância, temperatura) com limites — se não houver medição, redija de forma técnica e neutra sem inventar números.
- diagnostico_ergonomico: consolidação NOVA (físico + organizacional + cognitivo/psicossocial), causas, consequências, nível de exposição. NÃO copie campos anteriores.
- conclusao: posicionamento técnico final sobre a condição ergonômica e necessidade de intervenção. NÃO repita o diagnóstico.
- plano_acao: 3 a 6 ações concretas e ESPECÍFICAS aos riscos identificados (o_que, como, justificativa normativa/técnica, prioridade Alta|Média|Baixa, resultado_esperado, responsavel por cargo, prazo). Priorize engenharia/organização/método; treinamento só como complemento.

REGRAS NÃO NEGOCIÁVEIS:
- PROIBIDO texto genérico tipo "modelo pronto" ou reaproveitável entre funções distintas.
- PROIBIDO inventar medições, pontuações de ferramentas, pesos, tempos de ciclo, fotografias, controles existentes ou condições não evidenciadas.
- PROIBIDO copiar/citar/parafrasear DIRETRIZES INTERNAS na resposta.
- Citar itens específicos da NR-17 quando aplicáveis (ex.: NR-17.3.3, NR-17.6.3).
- Se COPSOQ/psicossocial indicar risco, a análise organizacional e o diagnóstico DEVEM refletir isso.
- Fotografias: descrever o observável e integrar à biomecânica; não afirmar o não verificável.
- Quando houver AEP correspondente: aprofunde o motivo da indicação; não copie pareceres literais.

FORMATO: responder EXCLUSIVAMENTE em JSON válido conforme o schema, sem markdown.`;

export const SCHEMA_AET = {
  type: "object",
  properties: {
    posto_trabalho: {
      type: "string",
      description: "Somente ambiente/mobiliário/layout/equipamentos/condições ambientais.",
    },
    descricao_atividade: {
      type: "string",
      description: "Somente trabalho real executado, método e sequência operacional da função.",
    },
    analise_organizacional: {
      type: "string",
      description: "Organização do trabalho, autonomia, supervisão, suporte e psicossocial.",
    },
    ritmo_complexidade: {
      type: "string",
      description: "Ritmo, cadência, repetitividade, complexidade cognitiva e pressão.",
    },
    jornada_aspectos: {
      type: "string",
      description: "Jornada, pausas, turnos, rodízios — NR-17.6.",
    },
    caracterizacao_biomecanica: {
      type: "string",
      description: "Posturas, amplitudes, cargas, esforços — ISO 11226/11228 e escores existentes.",
    },
    cronoanalise: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tarefa: { type: "string" },
          tempo: { type: "string", description: "Duração medida ou vazio se não houver medição" },
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
      required: [
        "altura_mesa", "altura_assento", "profundidade_assento",
        "monitor", "distancia_olho_monitor", "espaco_pernas",
      ],
    },
    avaliacoes_quantitativas_analise: { type: "string" },
    diagnostico_ergonomico: {
      type: "string",
      description: "Consolidação integrada nova — não copiar campos anteriores.",
    },
    conclusao: {
      type: "string",
      description: "Posicionamento técnico final — não repetir o diagnóstico.",
    },
    plano_acao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          o_que: { type: "string" },
          como: { type: "string" },
          justificativa: { type: "string" },
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

const DIM_KEYS = [
  "altura_mesa",
  "altura_assento",
  "profundidade_assento",
  "monitor",
  "distancia_olho_monitor",
  "espaco_pernas",
] as const;

const TEXTO_KEYS = [
  "posto_trabalho",
  "descricao_atividade",
  "analise_organizacional",
  "ritmo_complexidade",
  "jornada_aspectos",
  "caracterizacao_biomecanica",
  "avaliacoes_quantitativas_analise",
  "diagnostico_ergonomico",
  "conclusao",
] as const;

function normFrase(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove frases idênticas repetidas entre campos de texto (mantém a primeira ocorrência). */
export function deduplicarCamposAet(output: Record<string, any>): Record<string, any> {
  const vistas = new Set<string>();
  const out = { ...output };
  for (const key of TEXTO_KEYS) {
    const texto = typeof out[key] === "string" ? out[key] : "";
    if (!texto.trim()) continue;
    const frases = texto.match(/[^.!?;]+[.!?;]?/g) || [texto];
    const filtradas: string[] = [];
    for (const f of frases) {
      const n = normFrase(f);
      if (n.length < 40) {
        filtradas.push(f);
        continue;
      }
      if (vistas.has(n)) continue;
      vistas.add(n);
      filtradas.push(f);
    }
    const joined = filtradas.join("").replace(/\s{2,}/g, " ").trim();
    // Se sobrou conteúdo após remover frases já usadas, aplica; se ficou vazio, mantém o original.
    out[key] = joined || texto;
  }
  return out;
}

export function normalizarSaidaAet(raw: any): Record<string, any> {
  const base = limparSaidaTecnica(raw && typeof raw === "object" ? raw : {});
  const out: Record<string, any> = { ...base };

  // Cronoanálise
  out.cronoanalise = Array.isArray(base.cronoanalise)
    ? base.cronoanalise.map((c: any) => ({
      tarefa: String(c?.tarefa || "").trim(),
      tempo: String(c?.tempo ?? c?.duracao ?? "").trim(),
      risco: String(c?.risco || "").trim(),
    })).filter((c: any) => c.tarefa)
    : [];

  // Dimensões: objeto com as 6 chaves do formulário
  const dims: Record<string, string> = {};
  const src = base.avaliacoes_dimensionais;
  if (src && typeof src === "object" && !Array.isArray(src)) {
    for (const k of DIM_KEYS) {
      const v = (src as any)[k];
      dims[k] = typeof v === "string" ? v.trim()
        : v && typeof v === "object" && typeof v.avaliacao === "string" ? v.avaliacao.trim()
        : "";
    }
  } else if (typeof src === "string" && src.trim()) {
    // Se o modelo devolver parágrafo único, aplica ao primeiro campo e deixa os demais neutros.
    dims.altura_mesa = src.trim();
    for (const k of DIM_KEYS.slice(1)) dims[k] = "Análise qualitativa integrada à caracterização do posto e da atividade.";
  } else {
    for (const k of DIM_KEYS) dims[k] = "";
  }
  out.avaliacoes_dimensionais = dims;

  // Plano de ação — aliases acao/prazo_dias → o_que/prazo
  out.plano_acao = Array.isArray(base.plano_acao)
    ? base.plano_acao.map((p: any) => ({
      o_que: String(p?.o_que ?? p?.acao ?? "").trim(),
      como: String(p?.como || "").trim(),
      justificativa: String(p?.justificativa || "").trim(),
      prioridade: String(p?.prioridade || "").trim(),
      resultado_esperado: String(p?.resultado_esperado || "").trim(),
      responsavel: String(p?.responsavel || "").trim(),
      prazo: String(p?.prazo ?? p?.prazo_dias ?? "").trim(),
    })).filter((p: any) => p.o_que)
    : [];

  for (const k of TEXTO_KEYS) {
    out[k] = typeof base[k] === "string" ? base[k] : "";
  }

  return deduplicarCamposAet(out);
}

function psicoBlock(p: any): string {
  if (!p || !p.disponivel) return "";
  return `# INTEGRAÇÃO PSICOSSOCIAL
Use os dados apenas para correlação técnica. Não copie textos literais do módulo Psicossocial.
Prioridade: Empresa → Setor → GHE/GES → Função. Não invente dados psicossociais.

## DADOS PSICOSSOCIAIS (origem: ${p.origem})
${p.observacao || ""}
\`\`\`json
${JSON.stringify({ alvo: p.alvo, setor: p.setor_resumo, empresa: p.empresa_resumo, indicadores: p.indicadores, avaliacoes: p.avaliacoes }, null, 2)}
\`\`\`

`;
}

function aepBlock(a: any): string {
  if (!a?.disponivel || !a?.setor) return "";
  return `# INTEGRAÇÃO AEP → AET
A AEP correspondente é ponto de partida do aprofundamento. Não copie pareceres literais. Aprofunde organização, demandas físicas/cognitivas, posturas, esforços, ritmo, pausas, mobiliário, equipamentos e método conforme evidências.

## FOCO DO APROFUNDAMENTO
${JSON.stringify(compactarContexto(extrairFocoAep(a.setor)), null, 2)}

## AEP CORRESPONDENTE
${JSON.stringify(compactarContexto(a.setor), null, 2)}

`;
}

function conhecimentoBlock(c: any): string {
  if (!c || !c.disponivel) return "";
  const pastas = (c.pastas || [])
    .map((p: any) => `- ${p.nome}: ${(p.arquivos || []).join(", ") || "(sem arquivos)"}`)
    .join("\n");
  return `# BASE DE CONHECIMENTO TÉCNICO (AET)
Use para conferir conceitos e fundamentação. Não copie trechos literais. Não extraia fatos da empresa desses arquivos.

## PASTAS
${pastas}

`;
}

export function buildAet(body: any): PedidoGeracao {
  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  if (descricao.length < 20) {
    throw Object.assign(
      new Error("Descreva com mais detalhes o que foi observado in loco (mínimo 20 caracteres)."),
      { status: 400 },
    );
  }

  const instrTxt = typeof body.instrucoes_usuario === "string" ? body.instrucoes_usuario.trim() : "";
  const anexosArr = Array.isArray(body.anexos) ? limitarAnexos(body.anexos, 10) : [];
  const conhecAnexos = Array.isArray(body.conhecimento?.anexos)
    ? limitarAnexos(body.conhecimento.anexos, 10)
    : [];

  const instrBlock = instrTxt
    ? `# DIRETRIZES INTERNAS DO RESPONSÁVEL TÉCNICO — PRIORIDADE MÁXIMA
[REGEM estilo, tom, profundidade e método. É PROIBIDO copiar ou citar este bloco na resposta.]
"""
${instrTxt}
"""

`
    : "";

  const ctx = body.contexto || {};
  const funcaoNome = ctx?.funcao_nome || ctx?.funcao || ctx?.avaliacao?.funcao_nome || "";
  const setorNome = ctx?.setor_nome || ctx?.setor || ctx?.avaliacao?.setor || "";

  const userText = `${instrBlock}${conhecimentoBlock(body.conhecimento)}${psicoBlock(body.psicossocial)}${aepBlock(body.aep)}# FUNÇÃO E SETOR EM ANÁLISE (individualizar toda a AET a esta realidade)
Função: ${funcaoNome || "conforme contexto"}
Setor/GHE: ${setorNome || "conforme contexto"}

# RELATO DA AVALIAÇÃO IN LOCO
${descricao}

# CONTEXTO CADASTRADO (não contradizer; não inventar além do sustentável)
\`\`\`json
${JSON.stringify(compactarContexto(ctx), null, 2)}
\`\`\`

# ANEXOS
${anexosArr.length === 0 ? "Nenhum anexo enviado." : anexosArr.map((a: any, i: number) => `- Anexo ${i + 1}: ${a.name} (${a.kind === "image" ? "Fotografia" : "PDF"})`).join("\n")}

# INSTRUÇÕES DE SAÍDA
Gere AET completa em JSON conforme o schema, com conteúdo EXCLUSIVO por campo e análise individualizada da função acima.
- posto_trabalho: só ambiente/mobiliário/layout.
- descricao_atividade: só trabalho real desta função.
- analise_organizacional / ritmo_complexidade / jornada_aspectos: cada um com propósito próprio.
- caracterizacao_biomecanica: biomecânica específica da atividade.
- cronoanalise: tarefas reais; tempo só se medido.
- avaliacoes_dimensionais: objeto com as 6 chaves do formulário.
- diagnostico_ergonomico: síntese nova; conclusao: posicionamento final distinto.
- plano_acao: ações específicas aos riscos desta função (campos o_que, como, justificativa, prioridade, resultado_esperado, responsavel, prazo).
Não produza texto reaproveitável para outra função.`;

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
    } else if (a.data) {
      userContent.push({
        type: "input_file",
        filename: a.name || "documento.pdf",
        file_data: `data:${a.mime || "application/pdf"};base64,${a.data}`,
      });
    }
  }

  return {
    systemPrompt: `${SYSTEM_PROMPT}\n${REDACAO_TECNICA}\n- A AET deve ser mais profunda que a AEP: aprofundar os problemas e pontos de atenção sem mencionar a AEP como fonte no texto final.`,
    userContent,
    schema: SCHEMA_AET,
    schemaName: "aet_output",
    posProcessar: normalizarSaidaAet,
  };
}
