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
      { code: "{{responsavel_tecnico}}", desc: "Responsável técnico" },
      { code: "{{crea}}", desc: "Registro CREA" },
      { code: "{{cargo}}", desc: "Cargo do responsável" },
      { code: "{{data_elaboracao}}", desc: "Data de elaboração" },
      { code: "{{alteracoes_documento}}", desc: "Alterações do documento" },
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
      { code: "{{#avaliacoes_quantitativas}}\n{{especificacao_setor}} | Ruído: {{ruido_valor}} {{ruido_unidade}} | Lux: {{iluminancia_valor}} {{iluminancia_unidade}} | Temp: {{temperatura_valor}} {{temperatura_unidade}}\n{{/avaliacoes_quantitativas}}", desc: "Loop de medições quantitativas" },
    ],
  },
  {
    title: "Plano de ação",
    vars: [
      { code: "{{#plano_acao}}\n{{o_que}} | {{como}} | {{responsavel}} | {{prazo}}\n{{/plano_acao}}", desc: "Loop do plano 5W" },
    ],
  },
  {
    title: "Ferramentas ergonômicas (Fase 2)",
    vars: [
      { code: "{{#ferramentas}}\n{{tipo}} - {{resultado}}\n{{/ferramentas}}", desc: "RULA/REBA/OCRA/NIOSH/OWAS/Moore-Garg" },
    ],
  },
  {
    title: "Imagens (Fase 2)",
    vars: [
      { code: "{{#imagens_ambiente}}{{.}}{{/imagens_ambiente}}", desc: "URLs das imagens do ambiente (6cm x 4cm)" },
      { code: "{{#imagens_funcao}}{{.}}{{/imagens_funcao}}", desc: "URLs das imagens da função (6cm x 4cm)" },
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
                        <Check className="w-3.5 h-3.5 mt-1 text-emerald-600 shrink-0" />
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
