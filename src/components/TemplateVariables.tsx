import { useState } from "react";
import { Info, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const variableGroups = [
  {
    title: "Variáveis de Empresa",
    vars: [
      "{{cnpj}}", "{{razao_social}}", "{{nome_fantasia}}", "{{cnae_principal}}",
      "{{grau_risco}}", "{{endereco}}", "{{numero_funcionarios_fem}}",
      "{{numero_funcionarios_masc}}", "{{total_funcionarios}}", "{{jornada_trabalho}}",
    ],
  },
  {
    title: "Variáveis de Contrato",
    vars: [
      "{{numero_contrato}}", "{{cnpj_contratante}}", "{{nome_contratante}}",
      "{{vigencia_inicio}}", "{{vigencia_fim}}", "{{local_trabalho}}", "{{escopo_contrato}}",
    ],
  },
  {
    title: "Variáveis de Responsáveis",
    vars: [
      "{{gestor_nome}}", "{{gestor_email}}", "{{gestor_telefone}}",
      "{{fiscal_nome}}", "{{fiscal_email}}", "{{fiscal_telefone}}",
      "{{preposto_nome}}", "{{preposto_email}}", "{{preposto_telefone}}",
    ],
  },
  {
    title: "Variáveis de Setor",
    vars: [
      "{{inicio_setor}}", "{{fim_setor}}",
      "{{setor}}", "{{ghe_ges}}", "{{nome_setor}}", "{{descricao_ambiente}}",
      "{{local_trabalho}}", "{{jornada_trabalho}}",
    ],
  },
  {
    title: "Variáveis de Função",
    vars: [
      "{{nome_funcao}}", "{{cbo_codigo}}", "{{cbo_descricao}}", "{{descricao_atividades}}",
    ],
  },
  {
    title: "Variáveis de Risco / Agente",
    vars: [
      "{{agente_nome}}", "{{tipo_agente}}", "{{codigo_esocial}}", "{{descricao_esocial}}",
      "{{propagacao}}", "{{tipo_exposicao}}", "{{fonte_geradora}}", "{{danos_saude}}",
      "{{medidas_controle}}", "{{tecnica_amostragem}}", "{{tipo_epi}}", "{{epi_eficaz}}",
    ],
  },
  {
    title: "Variáveis de Avaliação (LTCAT)",
    vars: [
      "{{data_avaliacao}}", "{{colaborador}}", "{{funcao}}", "{{resultado}}",
      "{{unidade_resultado}}", "{{limite_tolerancia}}", "{{unidade_limite}}",
      "{{tipo_avaliacao}}", "{{descricao_tecnica}}",
    ],
  },
  {
    title: "Variáveis de Calor (LTCAT)",
    vars: [
      "{{setor}}", "{{funcao}}", "{{colaborador}}", "{{local_avaliado}}", "{{atividade_avaliada}}",
      "{{taxa_metabolica}}", "{{resultado_calor}}", "{{unidade_resultado_calor}}", "{{limite_tolerancia_calor}}", "{{unidade_limite_calor}}",
    ],
  },
  {
    title: "Variáveis de Vibração (LTCAT)",
    vars: [
      "{{equipamento_avaliado}}", "{{aren_resultado}}", "{{aren_unidade}}", "{{aren_limite}}", "{{aren_limite_unidade}}",
      "{{vdvr_resultado}}", "{{vdvr_unidade}}", "{{vdvr_limite}}", "{{vdvr_limite_unidade}}",
    ],
  },
  {
    title: "Variáveis de Riscos (LTCAT)",
    vars: [
      "{{empresa}}", "{{setor}}", "{{ghe_ges}}", "{{funcao}}", "{{colaborador}}",
      "{{tipo_avaliacao}}", "{{tipo_agente}}", "{{agente_nome}}", "{{codigo_esocial}}",
      "{{descricao_esocial}}", "{{propagacao}}", "{{tipo_exposicao}}", "{{fonte_geradora}}",
      "{{danos_saude}}", "{{medidas_controle}}", "{{tecnica_amostragem}}", "{{equipamento}}",
      "{{nome_equipamento}}", "{{serie_equipamento}}", "{{data_calibracao}}",
      "{{resultado}}", "{{unidade_resultado}}", "{{limite_tolerancia}}", "{{unidade_limite}}",
    ],
  },
  {
    title: "Variáveis do Documento",
    vars: [
      "{{data}}", "{{responsavel}}", "{{crea}}", "{{cargo}}",
    ],
  },
  {
    title: "Variáveis Gerais de Avaliação",
    vars: [
      "{{data_avaliacao}}", "{{funcoes_ges}}", "{{tecnica_amostragem}}",
      "{{tempo_coleta}}", "{{unidade_tempo_coleta}}",
    ],
  },
  {
    title: "Variáveis de Resultado Quantitativo",
    vars: [
      "{{colaborador}}", "{{funcao}}", "{{data_avaliacao}}", "{{dose_percentual}}",
      "{{resultado}}", "{{unidade_resultado}}", "{{limite_tolerancia}}", "{{unidade_limite}}",
      "{{situacao}}", "{{cod_gfip}}",
    ],
  },
  {
    title: "Loop de Equipamentos da Avaliação",
    vars: [
      "{{#equipamentos_avaliacao}}", "{{agente_nome}}", "{{nome_equipamento}}",
      "{{modelo_equipamento}}", "{{serie_equipamento}}", "{{data_avaliacao}}",
      "{{data_calibracao}}", "{{/equipamentos_avaliacao}}",
    ],
  },
  {
    title: "Variáveis de EPI (LTCAT)",
    vars: [
      "{{epi_nome}}", "{{epi_ca}}", "{{epi_atenuacao}}", "{{epi_eficaz}}",
    ],
  },
  {
    title: "Variáveis de EPC (LTCAT)",
    vars: [
      "{{epc_nome}}", "{{epc_eficaz}}",
    ],
  },
  {
    title: "Parecer Técnico (LTCAT)",
    vars: [
      "{{parecer_tecnico}}", "{{aposentadoria_especial}}",
    ],
  },
  {
    title: "Coloração Condicional do Agente (LTCAT)",
    vars: [
      "{{#is_agente_fisico}}", "{{agente_nome}}", "{{/is_agente_fisico}}",
      "{{#is_agente_quimico}}", "{{agente_nome}}", "{{/is_agente_quimico}}",
      "{{#is_agente_biologico}}", "{{agente_nome}}", "{{/is_agente_biologico}}",
    ],
  },
  {
    title: "Coloração Condicional da Situação (LTCAT)",
    vars: [
      "{{#is_nocivo}}", "{{situacao}}", "{{/is_nocivo}}",
      "{{#is_seguro}}", "{{situacao}}", "{{/is_seguro}}",
    ],
  },
  {
    title: "Variáveis de Agente Qualitativo (LTCAT)",
    vars: [
      "{{#is_qualitativo}}", "{{agente_nome}}", "{{funcoes_ges}}", "{{tipo_avaliacao}}",
      "{{tipo_agente}}", "{{fonte_geradora}}", "{{propagacao}}", "{{tipo_exposicao}}",
      "{{danos_saude}}", "{{codigo_esocial}}",
      "{{#avaliacoes}}", "{{data_avaliacao}}", "{{colaborador}}", "{{funcao}}", "{{descricao_avaliacao}}", "{{/avaliacoes}}",
      "{{#epis}}", "{{epi_nome}}", "{{epi_eficaz}}", "{{/epis}}",
      "{{#epcs}}", "{{epc_nome}}", "{{epc_eficaz}}", "{{/epcs}}",
      "{{parecer_tecnico}}", "{{aposentadoria_especial}}", "{{/is_qualitativo}}",
    ],
  },
  {
    title: "Variáveis de Revisão (LTCAT)",
    vars: [
      "{{#revisoes}}", "{{revisao}}", "{{data_revisao}}", "{{motivo}}", "{{responsavel}}", "{{/revisoes}}",
    ],
  },
];

export function TemplateVariables() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");

  const handleCopy = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopied(v);
    toast.success(`Copiado: ${v}`);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Info className="w-4 h-4" />
        Variáveis Disponíveis
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Variáveis Disponíveis</DialogTitle>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground mb-4 space-y-2">
            <p>
              <Info className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Essas variáveis são provenientes do cadastro de empresa, contrato, setores/funções e riscos/agentes. Utilize-as para montar seus templates (.docx) e o sistema fará o preenchimento automático ao gerar o documento.
            </p>
            <p className="text-accent font-medium text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              <strong>Bloco por Setor (GES/GHE):</strong> use <code>{"{{inicio_setor}}"}</code> no início e <code>{"{{fim_setor}}"}</code> no fim de cada setor (dentro do loop <code>{"{{#setores}}...{{/setores}}"}</code>). O sistema empacota automaticamente o conteúdo entre eles em um bloco independente, evitando sobreposição de tabelas e mistura de dados entre setores. Os setores são ordenados por GHE/GES ao gerar o documento.
            </p>
            <p className="text-accent font-medium text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              As variáveis de avaliação, calor e vibração são provenientes da etapa de avaliação de riscos por setor no LTCAT. Suportam repetição dinâmica (loop): <code>{"{{#setores}}{{#riscos}}{{#avaliacoes}}...{{/avaliacoes}}{{/riscos}}{{/setores}}"}</code>
            </p>
            <p className="text-accent font-medium text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              As variáveis de EPI/EPC são provenientes da avaliação de riscos no LTCAT. Suportam uso em loop (múltiplos EPIs/EPCs por risco): <code>{"{{#epis}}...{{/epis}}"}</code> e <code>{"{{#epcs}}...{{/epcs}}"}</code>
            </p>
            <p className="text-accent font-medium text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              As variáveis de Parecer Técnico (<code>parecer_tecnico</code> e <code>aposentadoria_especial</code>) são preenchidas na etapa de Listagem de Riscos do LTCAT, dentro de cada avaliação.
            </p>
          </div>

          <div className="space-y-5">
            {variableGroups.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {group.vars.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 transition-colors"
                      onClick={() => handleCopy(v)}
                    >
                      {v}
                      {copied === v ? (
                        <Check className="w-3 h-3 ml-1 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 ml-1 opacity-40" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
