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
      ltcat_pareceres: {
        Row: {
          id: string
          empresa_id: string
          setor_id: string
          funcao_id: string
          agente_id: string
          colaborador_nome: string
          parecer_tecnico: string | null
          aposentadoria_especial: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          setor_id: string
          funcao_id: string
          agente_id: string
          colaborador_nome: string
          parecer_tecnico?: string | null
          aposentadoria_especial?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          setor_id?: string
          funcao_id?: string
          agente_id?: string
          colaborador_nome?: string
          parecer_tecnico?: string | null
          aposentadoria_especial?: string | null
          created_at?: string
          updated_at?: string
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
