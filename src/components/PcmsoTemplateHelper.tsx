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
    title: "EPI — por bloco/grupo (RECOMENDADO)",
    vars: [
      { tag: "{{#epis}} ... {{/epis}}", desc: "Loop por bloco de EPI (1 por grupo de funções cadastrado)" },
      { tag: "{{epi_funcoes}}", desc: "Funções do bloco — uma por linha (vertical)" },
      { tag: "{{epi_funcoes_lista}}", desc: "Alias de epi_funcoes (vertical)" },
      { tag: "{{epi_funcoes_inline}}", desc: "Funções separadas por vírgula (horizontal)" },
      { tag: "{{epi_setores}}", desc: "Setores das funções do bloco — um por linha" },
      { tag: "{{#funcoes}}{{nome_funcao}}{{/funcoes}}", desc: "Loop das funções do bloco (uma por linha)" },
      { tag: "{{#itens_epi}} ... {{/itens_epi}}", desc: "Loop dos EPIs do bloco — use SOMENTE na linha da tabela" },
      { tag: "{{epi_nome}}", desc: "Nome do EPI (dentro de itens_epi)" },
      { tag: "{{epi_ca}}", desc: "Número CA (dentro de itens_epi)" },
      { tag: "{{epi_classificacao_uso}}", desc: "Classificação de uso: Contínuo, Eventual, Não aplicado" },
      { tag: "{{epi_situacao}}", desc: "Situação do EPI (padrão: Ativo)" },
    ],
  },
  {
    title: "EPI — variáveis globais / aliases",
    vars: [
      { tag: "{{epi_lista}}", desc: "Lista completa de EPIs (texto, todos os blocos)" },
      { tag: "{{#epis_flat}} ... {{/epis_flat}}", desc: "Loop alternativo: 1 linha por EPI×Função (legado)" },
      { tag: "{{epi_setor}} / {{epi_funcao}}", desc: "Disponíveis dentro de epis_flat" },
    ],
  },
  {
    title: "Treinamentos (loop por bloco — RECOMENDADO)",
    vars: [
      { tag: "{{#treinamentos}} ... {{/treinamentos}}", desc: "Loop de treinamentos (1 por bloco)" },
      { tag: "{{treinamento_nome}}", desc: "Nome do treinamento" },
      { tag: "{{treinamento_funcoes}}", desc: "Funções vinculadas — uma por linha (vertical)" },
      { tag: "{{treinamento_funcoes_lista}}", desc: "Alias de treinamento_funcoes (vertical)" },
      { tag: "{{treinamento_funcoes_inline}}", desc: "Funções separadas por vírgula (horizontal)" },
      { tag: "{{#funcoes}}{{nome_funcao}}{{/funcoes}}", desc: "Loop das funções (uma por linha)" },
      { tag: "{{treinamento_carga_horaria}}", desc: "Carga horária" },
      { tag: "{{treinamento_periodicidade}}", desc: "Periodicidade" },
      { tag: "{{treinamento_validade}}", desc: "Validade (= periodicidade)" },
      { tag: "{{treinamento_setor}}", desc: "Setor(es) vinculado(s)" },
      { tag: "{{treinamento_observacao}}", desc: "Observação do cadastro" },
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
FUNÇÕES
{{epi_funcoes}}

| EPI | CA | Classificação de Uso | Situação |
{{#itens_epi}}
| {{epi_nome}} | {{epi_ca}} | {{epi_classificacao_uso}} | {{epi_situacao}} |
{{/itens_epi}}
{{/epis}}

Treinamentos:
{{#treinamentos}}
{{treinamento_nome}}

{{treinamento_funcoes}}
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
