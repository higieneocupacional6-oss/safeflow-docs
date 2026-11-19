/** Tabelas public acessíveis pela API autenticada. */
export const PUBLIC_TABLES = [
  "aep_documentos",
  "aet_documentos",
  "aet_instrucoes_usuario",
  "audit_log",
  "contratos",
  "documentos",
  "empresa_contatos",
  "empresas",
  "epi_epc",
  "epi_epc_riscos",
  "equipamentos_avaliacao",
  "equipamentos_ho",
  "equipamentos_ho_registros",
  "ergonomia_avaliacoes",
  "exames_cadastro",
  "ficha_tecnica_resultados",
  "formularios_aep",
  "funcoes",
  "ia_conhecimento_arquivos",
  "ia_conhecimento_pastas",
  "ltcat_av_calor",
  "ltcat_av_componentes",
  "ltcat_av_epi_epc",
  "ltcat_av_equipamentos",
  "ltcat_av_resultados",
  "ltcat_av_vibracao",
  "ltcat_avaliacoes",
  "ltcat_pareceres",
  "notificacoes",
  "pareceres_tecnicos",
  "pcmso_documentos",
  "pcmso_observacoes_padrao",
  "portal_clientes_arquivos",
  "portal_clientes_links",
  "profiles",
  "psico_avaliacoes",
  "psico_base_tecnica",
  "psico_indicadores",
  "psico_links",
  "psico_relatorios",
  "psico_respostas",
  "responsaveis",
  "riscos",
  "setores",
  "tecnicas_amostragem",
  "templates",
  "treinamentos_cadastro",
  "unidades",
  "user_roles",
] as const;

export type PublicTable = (typeof PUBLIC_TABLES)[number];

export const isPublicTable = (name: string): name is PublicTable =>
  (PUBLIC_TABLES as readonly string[]).includes(name);

export const FILE_BUCKETS = [
  "templates",
  "documentos-upload",
  "certificados-calibracao",
  "ergonomia-relatorios",
  "ia-conhecimento",
  "psico-base-tecnica",
  "formulario-aep-base",
  "formularios-aep",
  "aet-imagens",
  "portal-clientes",
] as const;

export type FileBucket = (typeof FILE_BUCKETS)[number];

export const isFileBucket = (name: string): name is FileBucket =>
  (FILE_BUCKETS as readonly string[]).includes(name);
