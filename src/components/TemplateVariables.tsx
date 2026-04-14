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
      "{{ghe_ges}}", "{{nome_setor}}", "{{descricao_ambiente}}",
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
      "{{medidas_controle}}", "{{tipo_epi}}", "{{epi_eficaz}}",
    ],
  },
  {
    title: "VARIÁVEIS DE AVALIAÇÃO QUALITATIVA (LTCAT)",
    vars: [
      "{{descricao_tecnica}}", "{{tipo_avaliacao}}", "{{agente_nome}}", "{{tipo_agente}}"
    ],
  },
  {
    title: "VARIÁVEIS DE VIBRAÇÃO (LTCAT)",
    vars: [
      "{{equipamento_avaliado}}", "{{aren_resultado}}", "{{aren_unidade}}", "{{aren_limite}}", "{{aren_limite_unidade}}",
      "{{vdvr_resultado}}", "{{vdvr_unidade}}", "{{vdvr_limite}}", "{{vdvr_limite_unidade}}"
    ],
  },
  {
    title: "VARIÁVEIS DE RISCOS (LTCAT)",
    vars: [
      "{{empresa}}", "{{setor}}", "{{ghe_ges}}", "{{funcao}}", "{{colaborador}}",
      "{{tipo_avaliacao}}", "{{tipo_agente}}", "{{agente_nome}}", "{{codigo_esocial}}", 
      "{{descricao_esocial}}", "{{propagacao}}", "{{tipo_exposicao}}", "{{fonte_geradora}}", 
      "{{danos_saude}}", "{{medidas_controle}}", "{{tecnica_amostragem}}", "{{equipamento}}", 
      "{{resultado}}", "{{unidade_resultado}}", "{{limite_tolerancia}}", "{{unidade_limite}}",
    ],
  },
  {
    title: "Variáveis do Documento",
    vars: [
      "{{data}}", "{{responsavel}}", "{{crea}}", "{{cargo}}",
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
              Essas variáveis são provenientes do cadastro de empresa, contrato, setores/funções e riscos/agentes. Utilize-as para montar seus templates (.docx) e o sistema fará o preenchimento automático ao gerar o documento. As variáveis de setor, função e risco permitem repetição dinâmica (loop) para empresas com múltiplos registros.
            </p>
            <p className="text-accent font-medium text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              As variáveis de riscos do LTCAT são provenientes da etapa de avaliação de riscos por setor. Utilize essas variáveis para montar seus templates (.docx), e o sistema fará o preenchimento automático ao gerar o documento.
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
