import { useState } from "react";
import { Info, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const groups = [
  {
    title: "Identificação / Empresa",
    vars: [
      "{{empresa_nome}}", "{{empresa}}", "{{razao_social}}", "{{nome_fantasia}}",
      "{{cnpj}}", "{{cnae_principal}}", "{{grau_risco}}", "{{endereco}}",
      "{{total_funcionarios}}", "{{numero_funcionarios_masc}}", "{{numero_funcionarios_fem}}",
      "{{jornada_trabalho}}", "{{expostos}}",
      "{{data_elaboracao}}", "{{data_validade}}",
    ],
  },
  {
    title: "Contrato / Contratante",
    vars: [
      "{{numero_contrato}}", "{{nome_contratante}}", "{{cnpj_contratante}}",
      "{{escopo_contrato}}", "{{local_trabalho}}",
      "{{vigencia_inicio}}", "{{vigencia_fim}}",
    ],
  },
  {
    title: "Responsáveis (Preposto / Gestor / Fiscal / Técnico)",
    vars: [
      "{{responsavel}}", "{{responsavel_tecnico}}", "{{crea}}", "{{cargo}}",
      "{{preposto_nome}}", "{{preposto_email}}", "{{preposto_telefone}}",
      "{{gestor_nome}}", "{{gestor_email}}", "{{gestor_telefone}}",
      "{{fiscal_nome}}", "{{fiscal_email}}", "{{fiscal_telefone}}",
    ],
  },
  {
    title: "Revisões (loop)",
    vars: [
      "{{#revisoes}}", "{{revisao}}", "{{revisao.data}}", "{{revisao.motivo}}",
      "{{revisao.responsavel}}", "{{/revisoes}}",
    ],
  },
  {
    title: "Riscos Ocupacionais por Setor (dinâmico — do PGR)",
    vars: [
      "{{setor.riscos.fisicos}}", "{{setor.riscos.quimicos}}", "{{setor.riscos.biologicos}}",
      "{{setor.riscos.acidentes}}", "{{setor.riscos.ergonomicos}}", "{{setor.riscos.psicossociais}}",
    ],
  },
  {
    title: "Setores / Funções / Exames (loop)",
    vars: [
      "{{#setores}}", "{{setor.nome}}", "{{setor.descricao_ambiente}}",
      "{{setor.riscos.fisicos}}", "{{setor.riscos.quimicos}}", "{{setor.riscos.biologicos}}",
      "{{setor.riscos.acidentes}}", "{{setor.riscos.ergonomicos}}", "{{setor.riscos.psicossociais}}",
      "{{#funcoes}}", "{{funcao.nome}}", "{{funcao.cbo}}", "{{funcao.descricao}}", "{{/funcoes}}",
      "{{#exames}}", "{{exame.nome}}", "{{exame.esocial.codigo}}", "{{exame.esocial.descricao}}",
      "{{exame.admissional}}", "{{exame.periodico}}", "{{exame.periodo}}",
      "{{exame.retorno}}", "{{exame.mudanca_risco}}", "{{exame.demissional}}",
      "{{exame.observacao}}", "{{/exames}}",
      "{{/setores}}",
    ],

  },
  {
    title: "EPI (loop)",
    vars: [
      "{{#epis}}", "{{funcao_label}}", "{{epi.nome}}", "{{epi.ca}}", "{{epi.uso}}",
      "{{#is_first}}{{rowspan}}{{/is_first}}", "{{/epis}}",
    ],
  },
  {
    title: "Treinamentos (loop)",
    vars: [
      "{{#treinamentos}}", "{{funcao_label}}", "{{treinamento.nome}}", "{{treinamento.carga_horaria}}",
      "{{#is_first}}{{rowspan}}{{/is_first}}", "{{/treinamentos}}",
    ],
  },
  {
    title: "Cronograma (loop)",
    vars: [
      "{{#cronograma}}", "{{cronograma.acao}}", "{{cronograma.responsavel}}",
      "{{cronograma.prazo_mes}}", "{{cronograma.prazo_ano}}", "{{cronograma.situacao}}", "{{/cronograma}}",
    ],
  },
];

export function PcmsoTemplateHelper() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopied(v);
    toast.success(`Copiado: ${v}`);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Info className="w-4 h-4" />Variáveis PCMSO
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Variáveis do Template PCMSO</DialogTitle></DialogHeader>
          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground mb-4 space-y-2">
            <p><Info className="w-4 h-4 inline mr-1.5 -mt-0.5" />Utilize estas variáveis no template (.docx) do PCMSO. O sistema fará o preenchimento automático ao gerar o documento.</p>
            <p className="text-accent font-medium text-xs"><Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />Use loops Mustache para setores, exames, EPIs e treinamentos: <code>{"{{#setores}}{{#exames}}…{{/exames}}{{/setores}}"}</code></p>
          </div>
          <div className="space-y-5">
            {groups.map((g) => (
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
