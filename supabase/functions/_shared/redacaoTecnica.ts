// Padrão de redação técnica da AEP/AET: texto final de engenharia, sem expor
// fontes, cadastro, lacunas ou limitações da IA, e sem inventar dados.

export const REDACAO_TECNICA = `
PADRÃO DE REDAÇÃO TÉCNICA (OBRIGATÓRIO — PREVALECE SOBRE QUALQUER INSTRUÇÃO CONFLITANTE):
- Escrever como engenheiro/ergonomista elaborando documento técnico: linguagem formal, analítica, impessoal e em português do Brasil.
- Cruzar internamente Empresa, Contrato, Setor, Função, GHE/GES, atividades, Psicossocial e AEP disponíveis; entregar SOMENTE a análise técnica final.
- NUNCA revelar como ou onde as informações foram obtidas. PROIBIDO mencionar banco de dados, cadastro, sistema, contexto, fonte, IA, relatório anterior como origem de dado, limitações ou informações faltantes.
- Expressões PROIBIDAS (e variações): "conforme cadastro", "segundo o cadastro", "de acordo com o cadastro", "não consta", "não foi informado", "não informado", "não há informação", "não há dados", "não há evidências", "sem evidências", "a IA identificou", "falta avaliar", "deve ser avaliado", "deveria ser avaliado", "necessário avaliar", "recomenda-se avaliar", "depende de medição", "depende de cronometragem", "depende de coleta", "conforme relatado".
- Informação indisponível: NÃO inventar e NÃO transformar em pendência, lacuna ou recomendação automática de avaliação. Redigir de forma técnica, neutra e contextualizada com os dados existentes.
  ERRADO: "Não há avaliação de iluminância, sendo necessário avaliar."
  CORRETO: "As condições de iluminação integram o contexto ambiental relacionado às demandas visuais da atividade."
- Não apenas nomear riscos: explicar a relação técnica atividade → exigência → fator ergonômico → condição de trabalho → possível repercussão.
- Interpretar, conforme aplicável: atividade, organização do trabalho, demandas físicas, cognitivas e organizacionais, posturas, movimentos, esforços, repetitividade, ritmo, pausas, mobiliário, equipamentos, ferramentas e ambiente (NR-17).
- Plano de ação: soluções específicas, eficazes e aplicáveis para eliminar, reduzir ou neutralizar cada problema, priorizando a fonte, processo, organização do trabalho, mobiliário, equipamentos, ferramentas, método, ritmo, pausas e distribuição de tarefas. Treinamento/orientação somente como complemento de uma medida estrutural, nunca como ação isolada.
- Valores numéricos (tempos, medições, escores) somente quando existirem nos dados; na ausência, descrever qualitativamente sem citar a ausência.`;

const PROIBIDAS = [
  /conforme (o )?cadastr\w*/i, /segundo o cadastr\w*/i, /de acordo com o cadastr\w*/i,
  /\bn[ãa]o consta\w*/i, /n[ãa]o (foi|foram) informad\w*/i, /\bn[ãa]o informad\w*/i,
  /n[ãa]o h[áa] (informa\w*|dados|evid[êe]ncias?|registros?)/i, /sem evid[êe]ncias?/i,
  /a IA identific\w*/i, /falta avaliar/i, /dever(ia)? ser avaliad\w*/i, /necess[áa]rio avaliar/i,
  /depende de (medi[çc][ãa]o|cronometragem|coleta)/i, /banco de dados/i,
];

/** Remove frases que expõem fonte, lacuna ou pendência artificial. Nunca
 * esvazia um campo: se tudo for removido, mantém o texto original. */
export function limparTextoTecnico(texto: string): string {
  if (!texto || !PROIBIDAS.some((r) => r.test(texto))) return texto;
  const linhas = texto.split(/(\n+)/);
  const out = linhas.map((linha) => {
    if (/^\n+$/.test(linha)) return linha;
    const frases = linha.match(/[^.!?;]+[.!?;]*\s*/g) || [linha];
    return frases.filter((f) => !PROIBIDAS.some((r) => r.test(f))).join("").trimEnd();
  }).join("").replace(/\n{3,}/g, "\n\n").trim();
  return out.length >= 20 ? out : texto;
}

export function limparSaidaTecnica<T>(valor: T): T {
  if (typeof valor === "string") return limparTextoTecnico(valor) as T;
  if (Array.isArray(valor)) return valor.map(limparSaidaTecnica) as T;
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, limparSaidaTecnica(v)])) as T;
  }
  return valor;
}
