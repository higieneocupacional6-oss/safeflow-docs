import { useState } from "react";
import { Info, Copy, Check, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const groups = [
  {
    title: "Identificação do PGR",
    vars: [
      "{{empresa}}", "{{cnpj}}", "{{razao_social}}", "{{responsavel_tecnico}}",
      "{{crea}}", "{{cargo}}", "{{data_elaboracao}}",
    ],
  },
  {
    title: "Revisões (loop)",
    vars: [
      "{{#revisoes}}", "{{revisao}}", "{{data}}", "{{motivo}}", "{{responsavel}}", "{{/revisoes}}",
    ],
  },
  {
    title: "GHE / Setores (loop principal)",
    vars: [
      "{{#ghe_setores}}", "{{ghe_ges}}", "{{nome_setor}}", "{{descricao_ambiente}}", "{{/ghe_setores}}",
    ],
  },
  {
    title: "Funções do GHE (loop dentro de ghe_setores)",
    vars: [
      "{{#funcoes_ghe}}", "{{nome_funcao}}", "{{cbo_codigo}}", "{{cbo_descricao}}", "{{descricao_atividades}}", "{{/funcoes_ghe}}",
    ],
  },
  {
    title: "Riscos / Agentes do GHE (loop dentro de ghe_setores)",
    vars: [
      "{{#riscos_ghe}}", "{{tipo_agente}}", "{{agente_nome}}", "{{fonte_geradora}}",
      "{{tipo_avaliacao}}", "{{tipo_exposicao}}", "{{propagacao}}",
      "{{danos_saude}}", "{{medidas_controle}}",
      "{{probabilidade}}", "{{severidade}}", "{{nivel_risco}}",
      "{{classificacao_risco}}", "{{resultado_matriz_risco}}",
      "{{/riscos_ghe}}",
    ],
  },
  {
    title: "Setores (legado — equivalente a ghe_setores)",
    vars: [
      "{{#setores}}", "{{nome_setor}}", "{{ghe_ges}}", "{{descricao_ambiente}}", "{{/setores}}",
    ],
  },
  {
    title: "Riscos (legado — equivalente a riscos_ghe)",
    vars: [
      "{{#riscos}}", "{{agente}}", "{{agente_nome}}", "{{tipo_agente}}", "{{tipo_avaliacao}}",
      "{{codigo_esocial}}", "{{descricao_esocial}}", "{{propagacao}}", "{{tipo_exposicao}}",
      "{{fonte_geradora}}", "{{danos_saude}}", "{{medidas_controle}}", "{{/riscos}}",
    ],
  },
  {
    title: "Matriz de Risco 3x3",
    vars: [
      "{{probabilidade}}", "{{severidade}}", "{{nivel_risco}}",
      "{{classificacao_risco}}", "{{resultado_matriz_risco}}",
    ],
  },
  {
    title: "EPIs (loop)",
    vars: [
      "{{#epis}}", "{{funcao}}", "{{nome_epi}}", "{{ca}}", "{{uso}}", "{{/epis}}",
    ],
  },
  {
    title: "Treinamentos (loop)",
    vars: [
      "{{#treinamentos}}", "{{funcao}}", "{{nome_treinamento}}", "{{/treinamentos}}",
    ],
  },
  {
    title: "Cronograma do PGR (loop)",
    vars: [
      "{{#cronograma_pgr}}",
      "{{item_cronograma}}", "{{acao_cronograma}}", "{{responsavel_cronograma}}",
      "{{prazo_cronograma}}", "{{situacao_cronograma}}",
      "{{/cronograma_pgr}}",
    ],
  },
];

const exemplo = `{{#ghe_setores}}
GHE: {{ghe_ges}} — {{nome_setor}}
Ambiente: {{descricao_ambiente}}

Funções:
{{#funcoes_ghe}}
  - {{nome_funcao}} (CBO {{cbo_codigo}}) — {{descricao_atividades}}
{{/funcoes_ghe}}

Riscos:
{{#riscos_ghe}}
  - {{tipo_agente}} | {{agente_nome}}
    Fonte: {{fonte_geradora}} | Exposição: {{tipo_exposicao}}
    Probabilidade: {{probabilidade}} | Severidade: {{severidade}}
    Nível: {{nivel_risco}} ({{classificacao_risco}}) — Resultado: {{resultado_matriz_risco}}
{{/riscos_ghe}}
{{/ghe_setores}}

Dica para tabelas no .docx: coloque {{#riscos_ghe}} ... {{/riscos_ghe}}
SOMENTE na linha de dados da tabela, nunca envolvendo a tabela inteira.

Cronograma (use somente na LINHA da tabela):
{{#cronograma_pgr}}
| {{item_cronograma}} | {{acao_cronograma}} | {{responsavel_cronograma}} | {{prazo_cronograma}} | {{situacao_cronograma}} |
{{/cronograma_pgr}}`;

export function PgrTemplateHelper() {
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
        <FileText className="w-4 h-4" />
        Variáveis PGR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Variáveis do PGR</DialogTitle>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground space-y-2">
            <p>
              <Info className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Use estas variáveis no seu template (.docx) para gerar o PGR automaticamente. As variáveis
              <code> {"{{#riscos}}...{{/riscos}}"} </code> fazem loop em cada risco cadastrado por setor.
            </p>
            <p className="text-accent text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              A Matriz 3x3 calcula automaticamente <code>nivel_risco</code>, <code>classificacao_risco</code> e
              <code> resultado_matriz_risco</code> a partir da probabilidade e severidade selecionadas.
            </p>
          </div>

          <div className="space-y-5 mt-2">
            {groups.map((g) => (
              <div key={g.title}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{g.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {g.vars.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10"
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

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Exemplo de uso
              </h4>
              <pre className="bg-muted/50 border rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{exemplo}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
