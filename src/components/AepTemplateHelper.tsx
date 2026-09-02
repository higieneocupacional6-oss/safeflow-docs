import { useState } from "react";
import { Braces, Copy, Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const grupos: { title: string; vars: string[] }[] = [
  {
    title: "Empresa",
    vars: [
      "{{aep.empresa.razao_social}}", "{{aep.empresa.nome_fantasia}}", "{{aep.empresa.cnpj}}",
      "{{aep.empresa.cnae_principal}}", "{{aep.empresa.grau_risco}}", "{{aep.empresa.endereco}}",
      "{{aep.empresa.total_funcionarios}}", "{{aep.empresa.jornada_trabalho}}",
    ],
  },
  {
    title: "Contrato",
    vars: [
      "{{aep.contrato.numero}}", "{{aep.contrato.contratante}}", "{{aep.contrato.cnpj_contratante}}",
      "{{aep.contrato.vigencia_inicio}}", "{{aep.contrato.vigencia_fim}}", "{{aep.contrato.local_trabalho}}",
    ],
  },
  {
    title: "Documento",
    vars: [
      "{{aep.responsavel_tecnico}}", "{{aep.crea}}", "{{aep.cargo}}", "{{aep.data_elaboracao}}",
      "{{aep.alteracoes}}", "{{#aep.revisoes}}", "{{data_revisao}}", "{{descricao_revisao}}", "{{/aep.revisoes}}",
    ],
  },
  {
    title: "Loop de setores avaliados",
    vars: ["{{#setores}}", "... variáveis do setor ...", "{{/setores}}"],
  },
  {
    title: "Setor / GES (dentro do loop)",
    vars: [
      "{{aep.setor.nome}}", "{{aep.ges}}", "{{aep.descricao_ambiente}}",
      "{{aep.funcao}}", "{{aep.numero_funcionarios}}",
      "{{#aep.funcoes}}{{nome}}{{/aep.funcoes}}",
      "{{aep.colaboradores}}",
      "{{#aep.colaboradores_lista}}{{nome}}", "{{funcao}}", "{{data_avaliacao}}{{/aep.colaboradores_lista}}",
    ],
  },
  {
    title: "Atividade e condições",
    vars: [
      "{{aep.descricao_atividade}}", "{{aep.turno}}",
      "{{aep.postura_predominante}}", "{{aep.postura_observacao}}",
    ],
  },
  {
    title: "Checklist AEP",
    vars: [
      "{{aep.checklist.organizacao_trabalho.quantidade_inadequados}}", "{{aep.checklist.organizacao_trabalho.condicao}}", "{{aep.checklist.organizacao_trabalho.observacao}}",
      "{{aep.checklist.levantamento_transporte_cargas.quantidade_inadequados}}", "{{aep.checklist.levantamento_transporte_cargas.condicao}}", "{{aep.checklist.levantamento_transporte_cargas.observacao}}",
      "{{aep.checklist.mobiliario.quantidade_inadequados}}", "{{aep.checklist.mobiliario.condicao}}", "{{aep.checklist.mobiliario.observacao}}",
      "{{aep.checklist.maquinas_equipamentos_ferramentas.quantidade_inadequados}}", "{{aep.checklist.maquinas_equipamentos_ferramentas.condicao}}", "{{aep.checklist.maquinas_equipamentos_ferramentas.observacao}}",
      "{{aep.checklist.conforto_ambiente.quantidade_inadequados}}", "{{aep.checklist.conforto_ambiente.condicao}}", "{{aep.checklist.conforto_ambiente.observacao}}",
      "{{#aep.checklist_lista}}{{variavel}}", "{{quantidade_inadequados}}", "{{condicao}}", "{{observacao}}{{/aep.checklist_lista}}",
    ],
  },
  {
    title: "Riscos ergonômicos (tabela)",
    vars: [
      "{{#aep.riscos_ergonomicos_lista}}{{tipo_agente}}", "{{fator_risco}}", "{{fonte_geradora}}",
      "{{possiveis_danos}}", "{{controle_existente}}", "{{probabilidade}}", "{{severidade}}",
      "{{nivel_risco}}", "{{medidas}}{{/aep.riscos_ergonomicos_lista}}",
      "{{aep.riscos_ergonomicos}}", "{{aep.riscos_ergonomicos_texto}}",
    ],
  },
  {
    title: "Pareceres e conduta",
    vars: [
      "{{aep.parecer_ambiente}}", "{{aep.parecer_ergonomia}}",
      "{{aep.conduta_1}}", "{{aep.parecer_conduta_1}}",
      "{{aep.conduta_2}}", "{{aep.parecer_conduta_2}}", "{{aep.conduta}}",
    ],
  },
  {
    title: "Plano de ação",
    vars: [
      "{{aep.plano_acao}}",
      "{{#aep.plano_acao_lista}}{{acao}}", "{{o_que}}", "{{como}}", "{{responsavel}}", "{{prazo}}{{/aep.plano_acao_lista}}",
    ],
  },

];

export function AepTemplateHelper() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopied(v);
    toast.success(`Copiado: ${v}`);
    setTimeout(() => setCopied(""), 1800);
  };

  return (
    <>
      <Button variant="outline" size="icon" title="Variáveis da AEP" onClick={() => setOpen(true)}>
        <Braces className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Variáveis disponíveis — AEP</DialogTitle>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground mb-4">
            <Info className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Use estas variáveis no seu template .docx. As variáveis de setor devem ficar dentro do
            loop <code>{"{{#setores}} ... {{/setores}}"}</code>. Clique para copiar.
          </div>

          <div className="space-y-5">
            {grupos.map((g) => (
              <div key={g.title}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{g.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {g.vars.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 transition-colors"
                      onClick={() => copy(v)}
                    >
                      {v}
                      {copied === v ? <Check className="w-3 h-3 ml-1 text-success" /> : <Copy className="w-3 h-3 ml-1 opacity-40" />}
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
