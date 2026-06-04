import { useState } from "react";
import { Code2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const SECTIONS: { title: string; vars: { tag: string; desc: string }[] }[] = [
  {
    title: "Identificação",
    vars: [
      { tag: "{{empresa}}", desc: "Razão social da empresa" },
      { tag: "{{responsavel_tecnico}}", desc: "Nome do responsável técnico" },
      { tag: "{{crea}}", desc: "Registro CREA" },
      { tag: "{{cargo}}", desc: "Cargo do responsável" },
      { tag: "{{vigencia_inicio}}", desc: "Data início da vigência" },
      { tag: "{{vigencia_fim}}", desc: "Data fim da vigência" },
    ],
  },
  {
    title: "Revisões (loop)",
    vars: [
      { tag: "{{#revisoes}} ... {{/revisoes}}", desc: "Abre o loop de revisões" },
      { tag: "{{revisao}}", desc: "Número da revisão" },
      { tag: "{{data}}", desc: "Data da revisão" },
      { tag: "{{motivo}}", desc: "Motivo da revisão" },
      { tag: "{{responsavel}}", desc: "Responsável pela revisão" },
    ],
  },
  {
    title: "Setores (loop)",
    vars: [
      { tag: "{{#setores}} ... {{/setores}}", desc: "Abre o loop de setores da empresa" },
      { tag: "{{nome_setor}}", desc: "Nome do setor" },
      { tag: "{{descricao_ambiente}}", desc: "Descrição do ambiente (cadastro Setores e Funções)" },
      { tag: "{{funcoes_lista}}", desc: "Lista das funções do setor em texto" },
      { tag: "{{agentes_fisicos}}", desc: "Agentes físicos" },
      { tag: "{{agentes_quimicos}}", desc: "Agentes químicos" },
      { tag: "{{agentes_biologicos}}", desc: "Agentes biológicos" },
      { tag: "{{agentes_ergonomicos}}", desc: "Agentes ergonômicos" },
      { tag: "{{agentes_acidentes}}", desc: "Agentes de acidentes" },
      { tag: "{{agentes_psicossociais}}", desc: "Agentes psicossociais" },
    ],
  },
  {
    title: "Funções (loop dentro de setores)",
    vars: [
      { tag: "{{#funcoes}} ... {{/funcoes}}", desc: "Loop das funções do setor" },
      { tag: "{{nome_funcao}}", desc: "Nome da função" },
      { tag: "{{cbo}}", desc: "Código CBO" },
      { tag: "{{descricao_atividades}}", desc: "Descrição das atividades" },
      { tag: "{{expostos}}", desc: "Trabalhadores expostos" },
    ],
  },
  {
    title: "Exames (loop dentro de setores)",
    vars: [
      { tag: "{{#exames}} ... {{/exames}}", desc: "Loop de exames do setor" },
      { tag: "{{tipo_exame}}", desc: "Tipo de exame" },
      { tag: "{{cod_esocial}}", desc: "Código eSocial" },
      { tag: "{{descricao_esocial}}", desc: "Descrição eSocial" },
      { tag: "{{admissional}}", desc: "Sim/Não" },
      { tag: "{{periodico}}", desc: "Sim/Não" },
      { tag: "{{periodo}}", desc: "Período (se periódico)" },
      { tag: "{{retorno_trabalho}}", desc: "Sim/Não" },
      { tag: "{{mudanca_funcao}}", desc: "Sim/Não" },
      { tag: "{{demissional}}", desc: "Sim/Não" },
      { tag: "{{observacao}}", desc: "Observações do exame" },
    ],
  },
  {
    title: "EPI (loop)",
    vars: [
      { tag: "{{#epis}} ... {{/epis}}", desc: "Loop de EPIs (uma linha por EPI/função)" },
      { tag: "{{epi_nome}}", desc: "Nome do EPI" },
      { tag: "{{epi_ca}}", desc: "Certificado de Aprovação (CA)" },
      { tag: "{{epi_descricao}}", desc: "Descrição do EPI" },
      { tag: "{{epi_setor}}", desc: "Setor vinculado" },
      { tag: "{{epi_funcao}}", desc: "Função vinculada" },
      { tag: "{{epi_finalidade}}", desc: "Finalidade do EPI" },
      { tag: "{{epi_periodicidade}}", desc: "Periodicidade de troca" },
      { tag: "{{epi_lista}}", desc: "Lista completa de EPIs (texto)" },
      { tag: "{{funcao.nome}} / {{epi.nome}} / {{epi.ca}} / {{epi.uso}}", desc: "Aliases nested (compatibilidade)" },
    ],
  },
  {
    title: "Treinamentos (loop)",
    vars: [
      { tag: "{{#treinamentos}} ... {{/treinamentos}}", desc: "Loop de treinamentos (1 por bloco)" },
      { tag: "{{treinamento_nome}}", desc: "Nome do treinamento" },
      { tag: "{{treinamento_carga_horaria}}", desc: "Carga horária" },
      { tag: "{{treinamento_periodicidade}}", desc: "Periodicidade" },
      { tag: "{{treinamento_validade}}", desc: "Validade (mesma periodicidade)" },
      { tag: "{{treinamento_data_realizacao}}", desc: "Data de realização" },
      { tag: "{{treinamento_data_vencimento}}", desc: "Data de vencimento" },
      { tag: "{{treinamento_instrutor}}", desc: "Instrutor" },
      { tag: "{{treinamento_responsavel}}", desc: "Responsável" },
      { tag: "{{treinamento_funcao}}", desc: "Função(ões) vinculada(s)" },
      { tag: "{{treinamento_setor}}", desc: "Setor(es) vinculado(s)" },
      { tag: "{{treinamento_observacao}}", desc: "Observação do treinamento" },
      { tag: "{{treinamento_funcoes_lista}}", desc: "Funções uma por linha" },
      { tag: "{{treinamento_lista}}", desc: "Lista completa de treinamentos (texto)" },
    ],
  },
  {
    title: "Cronograma PCMSO (loop)",
    vars: [
      { tag: "{{#cronograma_pcmso}} ... {{/cronograma_pcmso}}", desc: "Loop do cronograma" },
      { tag: "{{item}}", desc: "Item" },
      { tag: "{{acao}}", desc: "Ação" },
      { tag: "{{responsavel}}", desc: "Responsável" },
      { tag: "{{prazo}}", desc: "Prazo" },
      { tag: "{{situacao}}", desc: "Situação" },
      { tag: "{{observacao}}", desc: "Observações" },
    ],
  },
];

const EXAMPLE = `{{#setores}}
SETOR: {{nome_setor}}
AMBIENTE: {{descricao_ambiente}}
{{#funcoes}}
FUNÇÃO: {{nome_funcao}}
CBO: {{cbo}}
ATIVIDADES: {{descricao_atividades}}
EXPOSTOS: {{expostos}}
{{/funcoes}}
{{#exames}}
- {{tipo_exame}} ({{cod_esocial}}) — Admissional: {{admissional}} | Periódico: {{periodico}} {{periodo}}
{{/exames}}
{{/setores}}

EPIs:
{{#epis}}
- {{funcao.nome}} | {{epi.nome}} | CA {{epi.ca}} | {{epi.uso}} | {{epi.observacao}}
{{/epis}}

Treinamentos:
{{#treinamentos}}
- {{funcao.nome}} | {{treinamento.nome}} | {{treinamento.carga_horaria}} | {{treinamento.periodicidade}}
{{/treinamentos}}

Cronograma:
{{#cronograma_pcmso}}
- {{item}} | {{acao}} | {{responsavel}} | {{prazo}} | {{situacao}}
{{/cronograma_pcmso}}`;

export function PcmsoTemplateHelper() {
  const [open, setOpen] = useState(false);
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Code2 className="w-4 h-4" />Variáveis PCMSO</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">Variáveis do template PCMSO</DialogTitle></DialogHeader>
        <div className="space-y-6">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <h4 className="text-sm font-bold uppercase text-muted-foreground mb-2">{sec.title}</h4>
              <div className="space-y-1">
                {sec.vars.map((v) => (
                  <div key={v.tag} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border hover:bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono text-primary">{v.tag}</code>
                      <p className="text-xs text-muted-foreground">{v.desc}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(v.tag)}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold uppercase text-muted-foreground">Exemplo completo</h4>
              <Button variant="outline" size="sm" onClick={() => copy(EXAMPLE)}><Copy className="w-3.5 h-3.5 mr-1" />Copiar</Button>
            </div>
            <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">{EXAMPLE}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
