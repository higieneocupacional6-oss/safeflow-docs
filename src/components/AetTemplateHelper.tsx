import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const groups: { title: string; vars: { code: string; desc: string }[] }[] = [
  {
    title: "Identificação",
    vars: [
      { code: "{{empresa_nome}}", desc: "Razão social da empresa" },
      { code: "{{empresa.razao_social}}", desc: "Razão social no objeto empresa" },
      { code: "{{empresa.nome_fantasia}}", desc: "Nome fantasia" },
      { code: "{{empresa.cnpj}}", desc: "CNPJ" },
      { code: "{{empresa.endereco}}", desc: "Endereço" },
      { code: "{{empresa.cnae_principal}}", desc: "CNAE principal" },
      { code: "{{empresa.grau_risco}}", desc: "Grau de risco" },
      { code: "{{empresa.preposto_nome}}", desc: "Nome do preposto" },
      { code: "{{empresa.preposto_email}}", desc: "Email do preposto" },
      { code: "{{empresa.preposto_telefone}}", desc: "Telefone do preposto" },
      { code: "{{empresa.total_funcionarios}}", desc: "Total de funcionários" },
      { code: "{{empresa.numero_funcionarios_masc}}", desc: "Funcionários masculinos" },
      { code: "{{empresa.numero_funcionarios_fem}}", desc: "Funcionárias femininas" },
      { code: "{{empresa.jornada_trabalho}}", desc: "Jornada de trabalho" },
      { code: "{{responsavel_tecnico}}", desc: "Responsável técnico" },
      { code: "{{crea}}", desc: "Registro CREA" },
      { code: "{{cargo}}", desc: "Cargo do responsável" },
      { code: "{{data_elaboracao}}", desc: "Data de elaboração" },
      { code: "{{alteracoes_documento}}", desc: "Alterações do documento" },
    ],
  },
  {
    title: "Contrato",
    vars: [
      { code: "{{contrato.nome_contratante}}", desc: "Nome do contratante" },
      { code: "{{contrato.cnpj_contratante}}", desc: "CNPJ do contratante" },
      { code: "{{contrato.numero_contrato}}", desc: "Número do contrato" },
      { code: "{{contrato.vigencia_inicio}}", desc: "Início da vigência" },
      { code: "{{contrato.vigencia_fim}}", desc: "Fim da vigência" },
      { code: "{{contrato.escopo_contrato}}", desc: "Escopo do contrato" },
      { code: "{{contrato.gestor_nome}}", desc: "Nome do gestor" },
      { code: "{{contrato.gestor_email}}", desc: "Email do gestor" },
      { code: "{{contrato.gestor_telefone}}", desc: "Telefone do gestor" },
      { code: "{{contrato.fiscal_nome}}", desc: "Nome do fiscal" },
      { code: "{{contrato.fiscal_email}}", desc: "Email do fiscal" },
      { code: "{{contrato.fiscal_telefone}}", desc: "Telefone do fiscal" },
      { code: "{{contrato.local_trabalho}}", desc: "Local de trabalho" },
    ],
  },
  {
    title: "Revisões (loop)",
    vars: [
      { code: "{{#revisoes}}\n{{data_revisao}} - {{descricao_revisao}}\n{{/revisoes}}", desc: "Lista de revisões" },
    ],
  },
  {
    title: "Setores (loop principal)",
    vars: [
      { code: "{{#setores}} ... {{/setores}}", desc: "Abertura/fechamento do loop de setores" },
      { code: "{{setor_nome}}", desc: "Nome do setor" },
      { code: "{{ges}}", desc: "GES/GHE" },
      { code: "{{descricao_ambiente}}", desc: "Descrição do ambiente" },
      { code: "{{funcao_nome}}", desc: "Função analisada" },
      { code: "{{numero_funcionarios}}", desc: "Número de funcionários" },
      { code: "{{posto_trabalho}}", desc: "Posto de trabalho" },
      { code: "{{descricao_atividade}}", desc: "Descrição da atividade" },
      { code: "{{analise_organizacional}}", desc: "Análise organizacional" },
      { code: "{{tarefas}}", desc: "Tarefas" },
      { code: "{{riscos_observados}}", desc: "Riscos observados" },
      { code: "{{ritmo_complexidade}}", desc: "Ritmo e complexidade" },
      { code: "{{jornada_aspectos}}", desc: "Jornada e aspectos temporais" },
      { code: "{{caracterizacao_biomecanica}}", desc: "Caracterização biomecânica" },
      { code: "{{diagnostico_ergonomico}}", desc: "Diagnóstico ergonômico" },
      { code: "{{conclusao}}", desc: "Conclusão" },
    ],
  },
  {
    title: "Colaboradores (loop dentro do setor)",
    vars: [
      { code: "{{#colaboradores}}\n{{nome_colaborador}} - {{data_avaliacao}}\n{{/colaboradores}}", desc: "Lista de colaboradores avaliados" },
    ],
  },
  {
    title: "Avaliações quantitativas",
    vars: [
      { code: "{{#avaliacoes_quantitativas}}\n{{especificacao_setor}}\nRuído: {{ruido_valor}} {{ruido_unidade}} | Limite: {{limite_ruido}} {{unidade_limite_ruido}}\nIluminância: {{iluminancia_valor}} {{iluminancia_unidade}} | Limite: {{limite_iluminancia}} {{unidade_limite_iluminancia}}\nTemperatura: {{temperatura_valor}} {{temperatura_unidade}} | Limite: {{limite_temperatura}}\n{{/avaliacoes_quantitativas}}", desc: "Loop de medições + limites (NBR 10152 / NBR ISO 8995)" },
    ],
  },
  {
    title: "Plano de ação",
    vars: [
      { code: "{{#plano_acao}}\n{{o_que}} | {{como}} | {{responsavel}} | {{prazo}}\n{{/plano_acao}}", desc: "Loop do plano 5W" },
    ],
  },
  {
    title: "Ferramentas ergonômicas",
    vars: [
      { code: "{{#ferramentas}}\nTipo: {{tipo}}\nResultado: {{resultado}}\n{{/ferramentas}}", desc: "RULA/REBA/OCRA/NIOSH/OWAS/Moore-Garg" },
    ],
  },
  {
    title: "Descrição das imagens",
    vars: [
      { code: "{{descricao_imagens_ambiente}}", desc: "Descrição textual das imagens do ambiente" },
      { code: "{{descricao_imagens_funcao}}", desc: "Descrição textual das imagens da função" },
    ],
  },
  {
    title: "Avaliação Psicossocial (COPSOQ)",
    vars: [
      { code: "{{#avaliacoes_psicossociais}}\nColaborador: {{colaborador_nome}} ({{data_avaliacao}})\nResultado: {{resultado_psicossocial}}\nRiscos: {{riscos_psicossociais}}\n{{/avaliacoes_psicossociais}}", desc: "Loop de avaliações psicossociais por colaborador" },
      { code: "{{resultado_psicossocial}}", desc: "Texto-resumo automático do colaborador" },
      { code: "{{riscos_psicossociais}}", desc: "Riscos psicossociais identificados" },
      { code: "{{blocos.exigencias.media}} / {{blocos.exigencias.classificacao}}", desc: "Bloco Exigências (média + classificação)" },
      { code: "{{blocos.controle.media}} / {{blocos.controle.classificacao}}", desc: "Bloco Controle" },
      { code: "{{blocos.apoio.media}} / {{blocos.apoio.classificacao}}", desc: "Bloco Apoio" },
      { code: "{{blocos.reconhecimento.media}} / {{blocos.reconhecimento.classificacao}}", desc: "Bloco Reconhecimento" },
      { code: "{{blocos.seguranca.media}} / {{blocos.seguranca.classificacao}}", desc: "Bloco Segurança" },
      { code: "{{blocos.conflitos.media}} / {{blocos.conflitos.classificacao}}", desc: "Bloco Conflitos" },
      { code: "{{blocos.sintomas.media}} / {{blocos.sintomas.classificacao}}", desc: "Bloco Sintomas" },
    ],
  },
];

export function AetTemplateHelper() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success("Variável copiada");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Activity className="w-4 h-4 mr-2" /> Variáveis AET
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Variáveis disponíveis para template AET</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.title}>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">{g.title}</h3>
                <div className="space-y-1.5">
                  {g.vars.map((v) => (
                    <button
                      key={v.code}
                      onClick={() => copy(v.code)}
                      className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-muted transition-colors group"
                    >
                      {copied === v.code ? (
                        <Check className="w-3.5 h-3.5 mt-1 text-accent shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mt-1 text-muted-foreground/60 group-hover:text-foreground shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded block whitespace-pre-wrap break-all">
                          {v.code}
                        </code>
                        <p className="text-[11px] text-muted-foreground mt-1">{v.desc}</p>
                      </div>
                    </button>
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
