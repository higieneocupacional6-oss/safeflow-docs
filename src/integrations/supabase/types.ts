export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aet_documentos: {
        Row: {
          alteracoes_documento: string | null
          cargo: string | null
          contrato_id: string | null
          crea: string | null
          created_at: string
          created_by: string | null
          current_step: number
          data_elaboracao: string | null
          documento_id: string | null
          empresa_id: string | null
          id: string
          responsavel_tecnico: string | null
          revisoes: Json
          setores: Json
          status: string
          updated_at: string
        }
        Insert: {
          alteracoes_documento?: string | null
          cargo?: string | null
          contrato_id?: string | null
          crea?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          data_elaboracao?: string | null
          documento_id?: string | null
          empresa_id?: string | null
          id?: string
          responsavel_tecnico?: string | null
          revisoes?: Json
          setores?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          alteracoes_documento?: string | null
          cargo?: string | null
          contrato_id?: string | null
          crea?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          data_elaboracao?: string | null
          documento_id?: string | null
          empresa_id?: string | null
          id?: string
          responsavel_tecnico?: string | null
          revisoes?: Json
          setores?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aet_documentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aet_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aet_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cnpj_contratante: string | null
          created_at: string
          empresa_id: string
          escopo_contrato: string | null
          fiscal_email: string | null
          fiscal_nome: string | null
          fiscal_telefone: string | null
          gestor_email: string | null
          gestor_nome: string | null
          gestor_telefone: string | null
          id: string
          jornada_trabalho: string | null
          local_trabalho: string | null
          nome_contratante: string | null
          numero_contrato: string | null
          numero_funcionarios_fem: number | null
          numero_funcionarios_masc: number | null
          preposto_email: string | null
          preposto_nome: string | null
          preposto_telefone: string | null
          total_funcionarios: number | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          cnpj_contratante?: string | null
          created_at?: string
          empresa_id: string
          escopo_contrato?: string | null
          fiscal_email?: string | null
          fiscal_nome?: string | null
          fiscal_telefone?: string | null
          gestor_email?: string | null
          gestor_nome?: string | null
          gestor_telefone?: string | null
          id?: string
          jornada_trabalho?: string | null
          local_trabalho?: string | null
          nome_contratante?: string | null
          numero_contrato?: string | null
          numero_funcionarios_fem?: number | null
          numero_funcionarios_masc?: number | null
          preposto_email?: string | null
          preposto_nome?: string | null
          preposto_telefone?: string | null
          total_funcionarios?: number | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          cnpj_contratante?: string | null
          created_at?: string
          empresa_id?: string
          escopo_contrato?: string | null
          fiscal_email?: string | null
          fiscal_nome?: string | null
          fiscal_telefone?: string | null
          gestor_email?: string | null
          gestor_nome?: string | null
          gestor_telefone?: string | null
          id?: string
          jornada_trabalho?: string | null
          local_trabalho?: string | null
          nome_contratante?: string | null
          numero_contrato?: string | null
          numero_funcionarios_fem?: number | null
          numero_funcionarios_masc?: number | null
          preposto_email?: string | null
          preposto_nome?: string | null
          preposto_telefone?: string | null
          total_funcionarios?: number | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          alteracoes_documento: string | null
          cargo: string | null
          contrato_id: string | null
          crea: string | null
          created_at: string
          current_step: number
          data_elaboracao: string | null
          draft_snapshot: Json | null
          empresa_id: string | null
          empresa_nome: string
          file_path: string | null
          id: string
          responsavel_tecnico: string | null
          revisoes: Json
          status: string
          template_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          alteracoes_documento?: string | null
          cargo?: string | null
          contrato_id?: string | null
          crea?: string | null
          created_at?: string
          current_step?: number
          data_elaboracao?: string | null
          draft_snapshot?: Json | null
          empresa_id?: string | null
          empresa_nome?: string
          file_path?: string | null
          id?: string
          responsavel_tecnico?: string | null
          revisoes?: Json
          status?: string
          template_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          alteracoes_documento?: string | null
          cargo?: string | null
          contrato_id?: string | null
          crea?: string | null
          created_at?: string
          current_step?: number
          data_elaboracao?: string | null
          draft_snapshot?: Json | null
          empresa_id?: string | null
          empresa_nome?: string
          file_path?: string | null
          id?: string
          responsavel_tecnico?: string | null
          revisoes?: Json
          status?: string
          template_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_contatos: {
        Row: {
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          nome: string
          telefone: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_contatos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnae_principal: string | null
          cnpj: string
          cnpj_contratante: string | null
          created_at: string
          endereco: string | null
          escopo_contrato: string | null
          fiscal_email: string | null
          fiscal_nome: string | null
          fiscal_telefone: string | null
          gestor_email: string | null
          gestor_nome: string | null
          gestor_telefone: string | null
          grau_risco: string | null
          id: string
          jornada_trabalho: string | null
          local_trabalho: string | null
          nome_contratante: string | null
          nome_fantasia: string | null
          numero_contrato: string | null
          numero_funcionarios_fem: number | null
          numero_funcionarios_masc: number | null
          preposto_email: string | null
          preposto_nome: string | null
          preposto_telefone: string | null
          razao_social: string
          total_funcionarios: number | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          cnae_principal?: string | null
          cnpj: string
          cnpj_contratante?: string | null
          created_at?: string
          endereco?: string | null
          escopo_contrato?: string | null
          fiscal_email?: string | null
          fiscal_nome?: string | null
          fiscal_telefone?: string | null
          gestor_email?: string | null
          gestor_nome?: string | null
          gestor_telefone?: string | null
          grau_risco?: string | null
          id?: string
          jornada_trabalho?: string | null
          local_trabalho?: string | null
          nome_contratante?: string | null
          nome_fantasia?: string | null
          numero_contrato?: string | null
          numero_funcionarios_fem?: number | null
          numero_funcionarios_masc?: number | null
          preposto_email?: string | null
          preposto_nome?: string | null
          preposto_telefone?: string | null
          razao_social: string
          total_funcionarios?: number | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          cnae_principal?: string | null
          cnpj?: string
          cnpj_contratante?: string | null
          created_at?: string
          endereco?: string | null
          escopo_contrato?: string | null
          fiscal_email?: string | null
          fiscal_nome?: string | null
          fiscal_telefone?: string | null
          gestor_email?: string | null
          gestor_nome?: string | null
          gestor_telefone?: string | null
          grau_risco?: string | null
          id?: string
          jornada_trabalho?: string | null
          local_trabalho?: string | null
          nome_contratante?: string | null
          nome_fantasia?: string | null
          numero_contrato?: string | null
          numero_funcionarios_fem?: number | null
          numero_funcionarios_masc?: number | null
          preposto_email?: string | null
          preposto_nome?: string | null
          preposto_telefone?: string | null
          razao_social?: string
          total_funcionarios?: number | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: []
      }
      epi_epc: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      epi_epc_riscos: {
        Row: {
          epi_epc_id: string
          id: string
          risco_id: string
        }
        Insert: {
          epi_epc_id: string
          id?: string
          risco_id: string
        }
        Update: {
          epi_epc_id?: string
          id?: string
          risco_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_epc_riscos_epi_epc_id_fkey"
            columns: ["epi_epc_id"]
            isOneToOne: false
            referencedRelation: "epi_epc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_epc_riscos_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos_avaliacao: {
        Row: {
          agente_nome: string | null
          avaliacao_id: string | null
          created_at: string
          data_avaliacao: string | null
          data_calibracao: string | null
          empresa_id: string | null
          id: string
          modelo_equipamento: string | null
          nome_equipamento: string | null
          serie_equipamento: string | null
          setor_id: string | null
          tipo_documento: string
        }
        Insert: {
          agente_nome?: string | null
          avaliacao_id?: string | null
          created_at?: string
          data_avaliacao?: string | null
          data_calibracao?: string | null
          empresa_id?: string | null
          id?: string
          modelo_equipamento?: string | null
          nome_equipamento?: string | null
          serie_equipamento?: string | null
          setor_id?: string | null
          tipo_documento?: string
        }
        Update: {
          agente_nome?: string | null
          avaliacao_id?: string | null
          created_at?: string
          data_avaliacao?: string | null
          data_calibracao?: string | null
          empresa_id?: string | null
          id?: string
          modelo_equipamento?: string | null
          nome_equipamento?: string | null
          serie_equipamento?: string | null
          setor_id?: string | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_avaliacao_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos_ho: {
        Row: {
          certificado: string | null
          created_at: string | null
          id: string
          marca: string | null
          nome: string
          tipo: string | null
        }
        Insert: {
          certificado?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          nome: string
          tipo?: string | null
        }
        Update: {
          certificado?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      equipamentos_ho_registros: {
        Row: {
          created_at: string
          data_calibracao: string | null
          equipamento_id: string
          id: string
          marca_modelo: string | null
          numero_serie: string
          situacao_operacional: string
        }
        Insert: {
          created_at?: string
          data_calibracao?: string | null
          equipamento_id: string
          id?: string
          marca_modelo?: string | null
          numero_serie: string
          situacao_operacional?: string
        }
        Update: {
          created_at?: string
          data_calibracao?: string | null
          equipamento_id?: string
          id?: string
          marca_modelo?: string | null
          numero_serie?: string
          situacao_operacional?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_ho_registros_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_ho"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          cbo_codigo: string | null
          cbo_descricao: string | null
          created_at: string
          descricao_atividades: string | null
          expostos: string | null
          id: string
          nome_funcao: string
          setor_id: string
          updated_at: string
        }
        Insert: {
          cbo_codigo?: string | null
          cbo_descricao?: string | null
          created_at?: string
          descricao_atividades?: string | null
          expostos?: string | null
          id?: string
          nome_funcao: string
          setor_id: string
          updated_at?: string
        }
        Update: {
          cbo_codigo?: string | null
          cbo_descricao?: string | null
          created_at?: string
          descricao_atividades?: string | null
          expostos?: string | null
          id?: string
          nome_funcao?: string
          setor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcoes_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_av_calor: {
        Row: {
          aposentadoria_especial: string | null
          avaliacao_id: string
          cod_gfip: string | null
          colaborador: string | null
          created_at: string
          data_avaliacao: string | null
          descricao_atividade: string | null
          equipamento_id: string | null
          funcao_id: string | null
          ibutg_limite: number | null
          ibutg_medido: number | null
          ibutg_tipo: string | null
          id: string
          local_atividade: string | null
          m_kcal_h: number | null
          ordem: number
          parecer_tecnico: string | null
          situacao: string | null
          taxa_metabolica: string | null
          tbn_valores: string | null
          tbs_valores: string | null
          tempo_exposicao: string | null
          tg_valores: string | null
          tipo_atividade: string | null
          tipo_documento: string
        }
        Insert: {
          aposentadoria_especial?: string | null
          avaliacao_id: string
          cod_gfip?: string | null
          colaborador?: string | null
          created_at?: string
          data_avaliacao?: string | null
          descricao_atividade?: string | null
          equipamento_id?: string | null
          funcao_id?: string | null
          ibutg_limite?: number | null
          ibutg_medido?: number | null
          ibutg_tipo?: string | null
          id?: string
          local_atividade?: string | null
          m_kcal_h?: number | null
          ordem?: number
          parecer_tecnico?: string | null
          situacao?: string | null
          taxa_metabolica?: string | null
          tbn_valores?: string | null
          tbs_valores?: string | null
          tempo_exposicao?: string | null
          tg_valores?: string | null
          tipo_atividade?: string | null
          tipo_documento?: string
        }
        Update: {
          aposentadoria_especial?: string | null
          avaliacao_id?: string
          cod_gfip?: string | null
          colaborador?: string | null
          created_at?: string
          data_avaliacao?: string | null
          descricao_atividade?: string | null
          equipamento_id?: string | null
          funcao_id?: string | null
          ibutg_limite?: number | null
          ibutg_medido?: number | null
          ibutg_tipo?: string | null
          id?: string
          local_atividade?: string | null
          m_kcal_h?: number | null
          ordem?: number
          parecer_tecnico?: string | null
          situacao?: string | null
          taxa_metabolica?: string | null
          tbn_valores?: string | null
          tbs_valores?: string | null
          tempo_exposicao?: string | null
          tg_valores?: string | null
          tipo_atividade?: string | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_av_calor_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_av_componentes: {
        Row: {
          aposentadoria_especial: string | null
          avaliacao_id: string
          cas: string | null
          cod_gfip: string | null
          colaborador: string | null
          componente: string | null
          created_at: string
          data_avaliacao: string | null
          descricao_avaliacao: string | null
          dose_percentual: number | null
          funcao_id: string | null
          id: string
          limite_tolerancia: number | null
          numero_serie_bomba: string | null
          ordem: number
          parecer_tecnico: string | null
          resultado: number | null
          situacao: string | null
          tempo_coleta: string | null
          tipo_documento: string
          unidade_limite_id: string | null
          unidade_resultado_id: string | null
          unidade_tempo_coleta: string | null
        }
        Insert: {
          aposentadoria_especial?: string | null
          avaliacao_id: string
          cas?: string | null
          cod_gfip?: string | null
          colaborador?: string | null
          componente?: string | null
          created_at?: string
          data_avaliacao?: string | null
          descricao_avaliacao?: string | null
          dose_percentual?: number | null
          funcao_id?: string | null
          id?: string
          limite_tolerancia?: number | null
          numero_serie_bomba?: string | null
          ordem?: number
          parecer_tecnico?: string | null
          resultado?: number | null
          situacao?: string | null
          tempo_coleta?: string | null
          tipo_documento?: string
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
          unidade_tempo_coleta?: string | null
        }
        Update: {
          aposentadoria_especial?: string | null
          avaliacao_id?: string
          cas?: string | null
          cod_gfip?: string | null
          colaborador?: string | null
          componente?: string | null
          created_at?: string
          data_avaliacao?: string | null
          descricao_avaliacao?: string | null
          dose_percentual?: number | null
          funcao_id?: string | null
          id?: string
          limite_tolerancia?: number | null
          numero_serie_bomba?: string | null
          ordem?: number
          parecer_tecnico?: string | null
          resultado?: number | null
          situacao?: string | null
          tempo_coleta?: string | null
          tipo_documento?: string
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
          unidade_tempo_coleta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_av_componentes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_av_epi_epc: {
        Row: {
          avaliacao_id: string
          created_at: string
          epc_eficaz: string | null
          epc_id: string | null
          epi_atenuacao: string | null
          epi_ca: string | null
          epi_eficaz: string | null
          epi_id: string | null
          id: string
          tipo_documento: string
        }
        Insert: {
          avaliacao_id: string
          created_at?: string
          epc_eficaz?: string | null
          epc_id?: string | null
          epi_atenuacao?: string | null
          epi_ca?: string | null
          epi_eficaz?: string | null
          epi_id?: string | null
          id?: string
          tipo_documento?: string
        }
        Update: {
          avaliacao_id?: string
          created_at?: string
          epc_eficaz?: string | null
          epc_id?: string | null
          epi_atenuacao?: string | null
          epi_ca?: string | null
          epi_eficaz?: string | null
          epi_id?: string | null
          id?: string
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_av_epi_epc_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: true
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_av_equipamentos: {
        Row: {
          agente_nome: string | null
          avaliacao_id: string
          created_at: string
          data_avaliacao: string | null
          data_calibracao: string | null
          id: string
          modelo_equipamento: string | null
          nome_equipamento: string | null
          ordem: number
          serie_equipamento: string | null
          tipo_documento: string
        }
        Insert: {
          agente_nome?: string | null
          avaliacao_id: string
          created_at?: string
          data_avaliacao?: string | null
          data_calibracao?: string | null
          id?: string
          modelo_equipamento?: string | null
          nome_equipamento?: string | null
          ordem?: number
          serie_equipamento?: string | null
          tipo_documento?: string
        }
        Update: {
          agente_nome?: string | null
          avaliacao_id?: string
          created_at?: string
          data_avaliacao?: string | null
          data_calibracao?: string | null
          id?: string
          modelo_equipamento?: string | null
          nome_equipamento?: string | null
          ordem?: number
          serie_equipamento?: string | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_av_equipamentos_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_av_resultados: {
        Row: {
          aposentadoria_especial: string | null
          avaliacao_id: string
          cod_gfip: string | null
          colaborador: string | null
          created_at: string
          data_avaliacao: string | null
          descricao_avaliacao: string | null
          dose_percentual: number | null
          equipamento_registro_id: string | null
          funcao_id: string | null
          id: string
          limite_tolerancia: number | null
          ordem: number
          parecer_tecnico: string | null
          resultado: number | null
          situacao: string | null
          tempo_coleta: string | null
          tipo_documento: string
          unidade_limite_id: string | null
          unidade_resultado_id: string | null
          unidade_tempo_coleta: string | null
        }
        Insert: {
          aposentadoria_especial?: string | null
          avaliacao_id: string
          cod_gfip?: string | null
          colaborador?: string | null
          created_at?: string
          data_avaliacao?: string | null
          descricao_avaliacao?: string | null
          dose_percentual?: number | null
          equipamento_registro_id?: string | null
          funcao_id?: string | null
          id?: string
          limite_tolerancia?: number | null
          ordem?: number
          parecer_tecnico?: string | null
          resultado?: number | null
          situacao?: string | null
          tempo_coleta?: string | null
          tipo_documento?: string
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
          unidade_tempo_coleta?: string | null
        }
        Update: {
          aposentadoria_especial?: string | null
          avaliacao_id?: string
          cod_gfip?: string | null
          colaborador?: string | null
          created_at?: string
          data_avaliacao?: string | null
          descricao_avaliacao?: string | null
          dose_percentual?: number | null
          equipamento_registro_id?: string | null
          funcao_id?: string | null
          id?: string
          limite_tolerancia?: number | null
          ordem?: number
          parecer_tecnico?: string | null
          resultado?: number | null
          situacao?: string | null
          tempo_coleta?: string | null
          tipo_documento?: string
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
          unidade_tempo_coleta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_av_resultados_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_av_vibracao: {
        Row: {
          aposentadoria_especial: string | null
          aren: number | null
          aren_limite: number | null
          avaliacao_id: string
          cod_gfip: string | null
          colaborador: string | null
          created_at: string
          data_avaliacao: string | null
          funcao_id: string | null
          id: string
          ordem: number
          parecer_tecnico: string | null
          situacao: string | null
          tempo_exposicao: string | null
          tipo: string | null
          tipo_documento: string
          vdvr: number | null
          vdvr_limite: number | null
        }
        Insert: {
          aposentadoria_especial?: string | null
          aren?: number | null
          aren_limite?: number | null
          avaliacao_id: string
          cod_gfip?: string | null
          colaborador?: string | null
          created_at?: string
          data_avaliacao?: string | null
          funcao_id?: string | null
          id?: string
          ordem?: number
          parecer_tecnico?: string | null
          situacao?: string | null
          tempo_exposicao?: string | null
          tipo?: string | null
          tipo_documento?: string
          vdvr?: number | null
          vdvr_limite?: number | null
        }
        Update: {
          aposentadoria_especial?: string | null
          aren?: number | null
          aren_limite?: number | null
          avaliacao_id?: string
          cod_gfip?: string | null
          colaborador?: string | null
          created_at?: string
          data_avaliacao?: string | null
          funcao_id?: string | null
          id?: string
          ordem?: number
          parecer_tecnico?: string | null
          situacao?: string | null
          tempo_exposicao?: string | null
          tipo?: string | null
          tipo_documento?: string
          vdvr?: number | null
          vdvr_limite?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_av_vibracao_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "ltcat_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_avaliacoes: {
        Row: {
          agente_id: string | null
          aposentadoria_especial: string | null
          cod_gfip: string | null
          codigo_esocial: string | null
          colaborador: string | null
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          danos_saude: string | null
          data_avaliacao: string | null
          descricao_esocial: string | null
          documento_id: string | null
          dose_percentual: number | null
          empresa_id: string | null
          equipamento_id: string | null
          fonte_geradora: string | null
          funcao_id: string | null
          funcoes_ges: string | null
          id: string
          limite_tolerancia: number | null
          medidas_controle: string | null
          parecer_tecnico: string | null
          propagacao: string | null
          resultado: number | null
          setor_id: string | null
          situacao: string | null
          tecnica_id: string | null
          tempo_coleta: string | null
          tipo_agente: string | null
          tipo_avaliacao: string | null
          tipo_documento: string
          tipo_exposicao: string | null
          unidade_limite_id: string | null
          unidade_resultado_id: string | null
          unidade_tempo_coleta: string | null
        }
        Insert: {
          agente_id?: string | null
          aposentadoria_especial?: string | null
          cod_gfip?: string | null
          codigo_esocial?: string | null
          colaborador?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          danos_saude?: string | null
          data_avaliacao?: string | null
          descricao_esocial?: string | null
          documento_id?: string | null
          dose_percentual?: number | null
          empresa_id?: string | null
          equipamento_id?: string | null
          fonte_geradora?: string | null
          funcao_id?: string | null
          funcoes_ges?: string | null
          id?: string
          limite_tolerancia?: number | null
          medidas_controle?: string | null
          parecer_tecnico?: string | null
          propagacao?: string | null
          resultado?: number | null
          setor_id?: string | null
          situacao?: string | null
          tecnica_id?: string | null
          tempo_coleta?: string | null
          tipo_agente?: string | null
          tipo_avaliacao?: string | null
          tipo_documento?: string
          tipo_exposicao?: string | null
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
          unidade_tempo_coleta?: string | null
        }
        Update: {
          agente_id?: string | null
          aposentadoria_especial?: string | null
          cod_gfip?: string | null
          codigo_esocial?: string | null
          colaborador?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          danos_saude?: string | null
          data_avaliacao?: string | null
          descricao_esocial?: string | null
          documento_id?: string | null
          dose_percentual?: number | null
          empresa_id?: string | null
          equipamento_id?: string | null
          fonte_geradora?: string | null
          funcao_id?: string | null
          funcoes_ges?: string | null
          id?: string
          limite_tolerancia?: number | null
          medidas_controle?: string | null
          parecer_tecnico?: string | null
          propagacao?: string | null
          resultado?: number | null
          setor_id?: string | null
          situacao?: string | null
          tecnica_id?: string | null
          tempo_coleta?: string | null
          tipo_agente?: string | null
          tipo_avaliacao?: string | null
          tipo_documento?: string
          tipo_exposicao?: string | null
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
          unidade_tempo_coleta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_avaliacoes_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_ho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_tecnica_id_fkey"
            columns: ["tecnica_id"]
            isOneToOne: false
            referencedRelation: "tecnicas_amostragem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_unidade_limite_id_fkey"
            columns: ["unidade_limite_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltcat_avaliacoes_unidade_resultado_id_fkey"
            columns: ["unidade_resultado_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ltcat_pareceres: {
        Row: {
          agente_id: string
          aposentadoria_especial: string | null
          colaborador_nome: string | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          funcao_id: string | null
          id: string
          parecer_tecnico: string | null
          setor_id: string
          tipo_documento: string
          updated_at: string | null
        }
        Insert: {
          agente_id: string
          aposentadoria_especial?: string | null
          colaborador_nome?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          funcao_id?: string | null
          id?: string
          parecer_tecnico?: string | null
          setor_id: string
          tipo_documento?: string
          updated_at?: string | null
        }
        Update: {
          agente_id?: string
          aposentadoria_especial?: string | null
          colaborador_nome?: string | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          funcao_id?: string | null
          id?: string
          parecer_tecnico?: string | null
          setor_id?: string
          tipo_documento?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ltcat_pareceres_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pareceres_tecnicos: {
        Row: {
          created_at: string
          created_by: string | null
          documento: string
          id: string
          parecer_tecnico: string
          risco_id: string | null
          situacao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          documento: string
          id?: string
          parecer_tecnico?: string
          risco_id?: string | null
          situacao: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          documento?: string
          id?: string
          parecer_tecnico?: string
          risco_id?: string | null
          situacao?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      riscos: {
        Row: {
          codigo_esocial: string | null
          created_at: string
          danos_saude: string | null
          descricao_esocial: string | null
          epi_eficaz: string | null
          fonte_geradora: string | null
          id: string
          medidas_controle: string | null
          nome: string
          propagacao: string[] | null
          tipo: string
          tipo_epi: string | null
          tipo_exposicao: string | null
          updated_at: string
        }
        Insert: {
          codigo_esocial?: string | null
          created_at?: string
          danos_saude?: string | null
          descricao_esocial?: string | null
          epi_eficaz?: string | null
          fonte_geradora?: string | null
          id?: string
          medidas_controle?: string | null
          nome: string
          propagacao?: string[] | null
          tipo: string
          tipo_epi?: string | null
          tipo_exposicao?: string | null
          updated_at?: string
        }
        Update: {
          codigo_esocial?: string | null
          created_at?: string
          danos_saude?: string | null
          descricao_esocial?: string | null
          epi_eficaz?: string | null
          fonte_geradora?: string | null
          id?: string
          medidas_controle?: string | null
          nome?: string
          propagacao?: string[] | null
          tipo?: string
          tipo_epi?: string | null
          tipo_exposicao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      setores: {
        Row: {
          created_at: string
          descricao_ambiente: string | null
          empresa_id: string
          ghe_ges: string | null
          id: string
          nome_setor: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao_ambiente?: string | null
          empresa_id: string
          ghe_ges?: string | null
          id?: string
          nome_setor: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao_ambiente?: string | null
          empresa_id?: string
          ghe_ges?: string | null
          id?: string
          nome_setor?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tecnicas_amostragem: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          referencia: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          referencia?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          referencia?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          file_path: string
          id: string
          is_system: boolean
          title: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          is_system?: boolean
          title: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          is_system?: boolean
          title?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          created_at: string | null
          id: string
          nome: string | null
          simbolo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome?: string | null
          simbolo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string | null
          simbolo?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "usuario"],
    },
  },
} as const
