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
      equipamentos_ho: {
        Row: {
          certificado: string | null
          created_at: string | null
          id: string
          marca: string | null
          nome: string
        }
        Insert: {
          certificado?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          nome: string
        }
        Update: {
          certificado?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          nome?: string
        }
        Relationships: []
      }
      funcoes: {
        Row: {
          cbo_codigo: string | null
          cbo_descricao: string | null
          created_at: string
          descricao_atividades: string | null
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
      ltcat_avaliacoes: {
        Row: {
          agente_id: string | null
          aposentadoria_especial: string | null
          codigo_esocial: string | null
          colaborador: string | null
          created_at: string | null
          created_by: string | null
          danos_saude: string | null
          descricao_esocial: string | null
          empresa_id: string | null
          equipamento_id: string | null
          fonte_geradora: string | null
          funcao_id: string | null
          id: string
          limite_tolerancia: number | null
          medidas_controle: string | null
          parecer_tecnico: string | null
          propagacao: string | null
          resultado: number | null
          setor_id: string | null
          tecnica_id: string | null
          tipo_agente: string | null
          tipo_avaliacao: string | null
          tipo_exposicao: string | null
          unidade_limite_id: string | null
          unidade_resultado_id: string | null
        }
        Insert: {
          agente_id?: string | null
          aposentadoria_especial?: string | null
          codigo_esocial?: string | null
          colaborador?: string | null
          created_at?: string | null
          created_by?: string | null
          danos_saude?: string | null
          descricao_esocial?: string | null
          empresa_id?: string | null
          equipamento_id?: string | null
          fonte_geradora?: string | null
          funcao_id?: string | null
          id?: string
          limite_tolerancia?: number | null
          medidas_controle?: string | null
          parecer_tecnico?: string | null
          propagacao?: string | null
          resultado?: number | null
          setor_id?: string | null
          tecnica_id?: string | null
          tipo_agente?: string | null
          tipo_avaliacao?: string | null
          tipo_exposicao?: string | null
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
        }
        Update: {
          agente_id?: string | null
          aposentadoria_especial?: string | null
          codigo_esocial?: string | null
          colaborador?: string | null
          created_at?: string | null
          created_by?: string | null
          danos_saude?: string | null
          descricao_esocial?: string | null
          empresa_id?: string | null
          equipamento_id?: string | null
          fonte_geradora?: string | null
          funcao_id?: string | null
          id?: string
          limite_tolerancia?: number | null
          medidas_controle?: string | null
          parecer_tecnico?: string | null
          propagacao?: string | null
          resultado?: number | null
          setor_id?: string | null
          tecnica_id?: string | null
          tipo_agente?: string | null
          tipo_avaliacao?: string | null
          tipo_exposicao?: string | null
          unidade_limite_id?: string | null
          unidade_resultado_id?: string | null
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
          title: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
