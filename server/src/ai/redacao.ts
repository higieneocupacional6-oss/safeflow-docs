/** Espelho de supabase/functions/_shared/redacaoTecnica.ts para o Express. */

export const REDACAO_TECNICA = `
PADRÃO DE REDAÇÃO TÉCNICA (OBRIGATÓRIO — PREVALECE SOBRE QUALQUER INSTRUÇÃO CONFLITANTE):
- Escrever como engenheiro/ergonomista elaborando documento técnico: linguagem formal, analítica, impessoal e em português do Brasil.
- Cruzar internamente Empresa, Contrato, Setor, Função, GHE/GES, atividades, Psicossocial e AEP disponíveis; entregar SOMENTE a análise técnica final.
- NUNCA revelar como ou onde as informações foram obtidas. PROIBIDO mencionar banco de dados, cadastro, sistema, contexto, fonte, IA, relatório anterior como origem de dado, limitações ou informações faltantes.
- Expressões PROIBIDAS (e variações): "conforme cadastro", "segundo o cadastro", "de acordo com o cadastro", "não consta", "não foi informado", "não informado", "não há informação", "não há dados", "não há evidências", "sem evidências", "a IA identificou", "falta avaliar", "deve ser avaliado", "deveria ser avaliado", "necessário avaliar", "recomenda-se avaliar", "depende de medição", "depende de cronometragem", "depende de coleta", "conforme relatado".
- Informação indisponível: NÃO inventar e NÃO transformar em pendência, lacuna ou recomendação automática de avaliação. Redigir de forma técnica, neutra e contextualizada com os dados existentes.
- Não apenas nomear riscos: explicar a relação técnica atividade → exigência → fator ergonômico → condição de trabalho → possível repercussão.
`;

const PROIBIDAS = [
  /conforme (o )?cadastr\w*/i, /segundo o cadastr\w*/i, /de acordo com o cadastr\w*/i,
  /\bn[ãa]o consta\w*/i, /n[ãa]o (foi|foram) informad\w*/i, /\bn[ãa]o informad\w*/i,
  /n[ãa]o h[áa] (informa\w*|dados|evid[êe]ncias?|registros?)/i, /sem evid[êe]ncias?/i,
  /a IA identific\w*/i, /falta avaliar/i, /dev(e|em|eria|eriam) ser avaliad\w*/i, /necess[áa]rio avaliar/i,
  /depende de (medi[çc][ãa]o|cronometragem|coleta)/i, /banco de dados/i,
];

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
  if (Array.isArray(valor)) return valor.map((v) => limparSaidaTecnica(v)) as T;
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) out[k] = limparSaidaTecnica(v);
    return out as T;
  }
  return valor;
}
