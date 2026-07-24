// Tipos compartilhados das ferramentas ergonômicas.
export type FerramentaTipo = "RULA" | "REBA" | "NIOSH" | "OCRA" | "OWAS" | "STRAIN_INDEX" | "ROSA";

export type CabecalhoAvaliacao = {
  colaborador_nome: string;
  funcao: string;
  empresa_nome: string;
  setor_nome: string;
  data_avaliacao: string; // ISO yyyy-mm-dd
};

export type ResultadoErgonomico = {
  escore_final: number;
  classificacao: string;
  nivel_acao: string;
  recomendacoes: string;
  memoria_calculo: Array<{ etapa: string; valor: string | number; detalhe?: string }>;
};

export type AvaliacaoErgonomica = {
  id?: string;
  ferramenta: FerramentaTipo;
  cabecalho: CabecalhoAvaliacao;
  atividade?: string;
  respostas: Record<string, unknown>;
  resultado: ResultadoErgonomico;
  pdf_path?: string;
  aet_documento_id?: string | null;
  setor_ref?: string | null;
};

