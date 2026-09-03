import { useState } from "react";
import { Braces, Copy, Check, Info, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Grupo = { title: string; loop?: string; nota?: string; vars: string[] };

const grupos: Grupo[] = [
  {
    title: "Dados da empresa",
    nota: "Variáveis globais do módulo Empresas — preenchidas automaticamente com a empresa/contrato selecionados.",
    vars: [
      "{{razao_social}}", "{{nome_fantasia}}", "{{cnpj}}", "{{cnae_principal}}", "{{grau_risco}}",
      "{{endereco}}", "{{preposto_nome}}", "{{preposto_email}}", "{{preposto_telefone}}",
      "{{total_funcionarios}}", "{{numero_funcionarios_masc}}", "{{numero_funcionarios_fem}}",
      "{{jornada_trabalho}}", "{{nome_contratante}}", "{{cnpj_contratante}}", "{{numero_contrato}}",
      "{{vigencia_inicio}}", "{{vigencia_fim}}", "{{escopo_contrato}}",
      "{{gestor_nome}}", "{{gestor_email}}", "{{gestor_telefone}}",
      "{{fiscal_nome}}", "{{fiscal_email}}", "{{fiscal_telefone}}",
      "{{local_trabalho}}", "{{caracteristicas_empresa}}",
    ],
  },
  {
    title: "Dados da AEP",
    vars: [
      "{{aep.responsavel_tecnico}}",
      "{{aep.crea}}",
      "{{aep.cargo}}",
      "{{aep.data_elaboracao}}",
      "{{aep.data}}",
      "{{aep.descricao}}",
    ],
  },
  {
    title: "Empresa e contrato (dentro de aep)",
    vars: [
      "{{aep.empresa.razao_social}}", "{{aep.empresa.nome_fantasia}}", "{{aep.empresa.cnpj}}",
      "{{aep.empresa.cnae_principal}}", "{{aep.empresa.grau_risco}}", "{{aep.empresa.endereco}}",
      "{{aep.empresa.total_funcionarios}}", "{{aep.empresa.jornada_trabalho}}",
      "{{aep.contrato.numero}}", "{{aep.contrato.contratante}}", "{{aep.contrato.cnpj_contratante}}",
      "{{aep.contrato.vigencia_inicio}}", "{{aep.contrato.vigencia_fim}}", "{{aep.contrato.local_trabalho}}",
    ],
  },
  {
    title: "Setores (loop principal)",
    loop: "Abre e fecha o bloco que envolve TODO o conteúdo do setor. Tudo entre as duas tags é repetido para cada setor cadastrado.",
    vars: ["{{#aep.setores}}", "{{/aep.setores}}"],
  },
  {
    title: "Setor (dentro do loop de setores)",
    vars: [
      "{{ges}}", "{{setor}}", "{{descricao_ambiente}}",
      "{{funcoes_avaliadas}}", "{{funcao_ges}}", "{{numero_funcionarios}}",
      "{{descricao_atividade}}", "{{turno}}", "{{postura_predominante}}", "{{observacao_complementar}}",
    ],
  },
  {
    title: "Colaboradores avaliados",
    loop: "Insira as tags de abertura/fechamento na linha da tabela; a linha é duplicada para cada colaborador.",
    vars: [
      "{{#colaboradores}}",
      "{{colaborador.nome}}", "{{colaborador.funcao}}", "{{colaborador.data}}",
      "{{/colaboradores}}",
    ],
  },
  {
    title: "Checklist AEP",
    vars: [
      "{{checklist.organizacao_trabalho.qtd_inadequados}}", "{{checklist.organizacao_trabalho.condicao}}", "{{checklist.organizacao_trabalho.observacao}}",
      "{{checklist.levantamento_cargas.qtd_inadequados}}", "{{checklist.levantamento_cargas.condicao}}", "{{checklist.levantamento_cargas.observacao}}",
      "{{checklist.mobiliario.qtd_inadequados}}", "{{checklist.mobiliario.condicao}}", "{{checklist.mobiliario.observacao}}",
      "{{checklist.maquinas_equipamentos.qtd_inadequados}}", "{{checklist.maquinas_equipamentos.condicao}}", "{{checklist.maquinas_equipamentos.observacao}}",
      "{{checklist.conforto_ambiente.qtd_inadequados}}", "{{checklist.conforto_ambiente.condicao}}", "{{checklist.conforto_ambiente.observacao}}",
    ],
  },
  {
    title: "Riscos ergonômicos",
    loop: "Coloque {{#riscos_ergonomicos}} na primeira célula da linha da tabela e {{/riscos_ergonomicos}} na última. A linha é duplicada para cada risco cadastrado (1, 5, 20…).",
    vars: [
      "{{#riscos_ergonomicos}}",
      "{{tipo_agente}}", "{{fator_risco}}", "{{fonte_geradora}}", "{{possiveis_danos}}",
      "{{controle_existente}}", "{{probabilidade}}", "{{severidade}}", "{{nivel_risco}}", "{{medidas}}",
      "{{/riscos_ergonomicos}}",
    ],
  },
  {
    title: "Pareceres",
    vars: ["{{parecer_ambiente_trabalho}}", "{{parecer_ergonomia}}"],
  },
  {
    title: "Conduta (SIM / NÃO)",
    vars: [
      "{{conduta.condicao_inadequada}}",
      "{{conduta.parecer_condicao_inadequada}}",
      "{{conduta.solucao_rapida}}",
      "{{conduta.parecer_solucao_rapida}}",
    ],
  },
  {
    title: "Plano de ação",
    loop: "Coloque {{#plano_acao}} na primeira célula da linha e {{/plano_acao}} na última. A linha é duplicada para cada ação cadastrada.",
    vars: ["{{#plano_acao}}", "{{o_que}}", "{{como}}", "{{responsavel}}", "{{prazo}}", "{{/plano_acao}}"],
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
            Todo o conteúdo do setor (checklist, riscos, pareceres, conduta e plano de ação) deve ficar
            dentro do loop principal <code>{"{{#aep.setores}} … {{/aep.setores}}"}</code>. Os grupos
            marcados como <strong>LOOP</strong> repetem automaticamente a linha da tabela onde forem
            inseridos. Clique na variável para copiar.
          </div>

          <div className="space-y-5">
            {grupos.map((g) => (
              <div key={g.title}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                  {g.title}
                  {g.loop && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                      <Repeat className="w-3 h-3 mr-1" /> LOOP
                    </Badge>
                  )}
                </h4>
                {g.loop && <p className="text-xs text-muted-foreground mb-2">{g.loop}</p>}
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
