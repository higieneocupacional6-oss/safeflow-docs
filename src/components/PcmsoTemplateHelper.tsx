import { useState } from "react";
import { Info, Copy, Check, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type VarDef = { name: string; tipo: "texto" | "loop" | "boolean" | "lista"; exemplo: string };

const groups: { title: string; vars: VarDef[] }[] = [
  {
    title: "Empresa / Contrato",
    vars: [
      { name: "{{empresa.nome}}", tipo: "texto", exemplo: "ACME Ltda" },
      { name: "{{empresa.cnpj}}", tipo: "texto", exemplo: "12.345.678/0001-00" },
      { name: "{{empresa.cnae_principal}}", tipo: "texto", exemplo: "8121-4/00" },
      { name: "{{empresa.grau_risco}}", tipo: "texto", exemplo: "3" },
      { name: "{{empresa.endereco}}", tipo: "texto", exemplo: "Rua X, 123" },
      { name: "{{empresa.total_funcionarios}}", tipo: "texto", exemplo: "42" },
    ],
  },
  {
    title: "Identificação do PCMSO",
    vars: [
      { name: "{{responsavel_tecnico}}", tipo: "texto", exemplo: "Dr. João" },
      { name: "{{crea}}", tipo: "texto", exemplo: "CRM 12345" },
      { name: "{{cargo}}", tipo: "texto", exemplo: "Médico do Trabalho" },
      { name: "{{vigencia_inicio}}", tipo: "texto", exemplo: "01/01/2026" },
      { name: "{{vigencia_fim}}", tipo: "texto", exemplo: "31/12/2026" },
      { name: "{{data_elaboracao}}", tipo: "texto", exemplo: "29/05/2026" },
    ],
  },
  {
    title: "Revisões (loop)",
    vars: [
      { name: "{{#revisoes}}", tipo: "loop", exemplo: "abre o loop" },
      { name: "{{revisao}}", tipo: "texto", exemplo: "01" },
      { name: "{{data}}", tipo: "texto", exemplo: "29/05/2026" },
      { name: "{{motivo}}", tipo: "texto", exemplo: "Atualização" },
      { name: "{{responsavel}}", tipo: "texto", exemplo: "Dr. João" },
      { name: "{{/revisoes}}", tipo: "loop", exemplo: "fecha o loop" },
    ],
  },
  {
    title: "Setores (loop principal)",
    vars: [
      { name: "{{#setores}}", tipo: "loop", exemplo: "abre o loop por setor" },
      { name: "{{setor.nome}}", tipo: "texto", exemplo: "Operacional" },
      { name: "{{setor.funcoes}}", tipo: "texto", exemplo: "Auxiliar, Encarregado" },
      { name: "{{/setores}}", tipo: "loop", exemplo: "fecha o loop" },
    ],
  },
  {
    title: "Riscos do setor (texto)",
    vars: [
      { name: "{{setor.riscos.fisicos}}", tipo: "texto", exemplo: "Ruído contínuo" },
      { name: "{{setor.riscos.quimicos}}", tipo: "texto", exemplo: "Poeira mineral" },
      { name: "{{setor.riscos.biologicos}}", tipo: "texto", exemplo: "Vírus, bactérias" },
      { name: "{{setor.riscos.ergonomicos}}", tipo: "texto", exemplo: "Postura inadequada" },
      { name: "{{setor.riscos.acidentes}}", tipo: "texto", exemplo: "Queda de mesmo nível" },
      { name: "{{setor.riscos.psicossociais}}", tipo: "texto", exemplo: "Estresse, jornada" },
    ],
  },
  {
    title: "Exames por setor (loop interno)",
    vars: [
      { name: "{{#setor.exames}}", tipo: "loop", exemplo: "abre o loop de exames" },
      { name: "{{nome}}", tipo: "texto", exemplo: "Hemograma" },
      { name: "{{esocial.codigo}}", tipo: "texto", exemplo: "0584" },
      { name: "{{esocial.descricao}}", tipo: "texto", exemplo: "Hemograma completo" },
      { name: "{{periodo}}", tipo: "texto", exemplo: "Anual" },
      { name: "{{observacao}}", tipo: "texto", exemplo: "Texto livre" },
      { name: "{{/setor.exames}}", tipo: "loop", exemplo: "fecha o loop" },
    ],
  },
  {
    title: "Checkboxes do exame (boolean — marca X)",
    vars: [
      { name: "{{#admissional}}X{{/admissional}}", tipo: "boolean", exemplo: "X se admissional=sim" },
      { name: "{{#periodico}}X{{/periodico}}", tipo: "boolean", exemplo: "X se periódico" },
      { name: "{{#retorno_trabalho}}X{{/retorno_trabalho}}", tipo: "boolean", exemplo: "X se retorno" },
      { name: "{{#mudanca_funcao}}X{{/mudanca_funcao}}", tipo: "boolean", exemplo: "X se mudança" },
      { name: "{{#demissional}}X{{/demissional}}", tipo: "boolean", exemplo: "X se demissional" },
    ],
  },
];

const exemplo = `{{#setores}}
SETOR: {{setor.nome}}
Funções: {{setor.funcoes}}

Riscos Físicos: {{setor.riscos.fisicos}}
Riscos Químicos: {{setor.riscos.quimicos}}
Riscos Biológicos: {{setor.riscos.biologicos}}
Riscos Ergonômicos: {{setor.riscos.ergonomicos}}
Riscos de Acidentes: {{setor.riscos.acidentes}}
Riscos Psicossociais: {{setor.riscos.psicossociais}}

Exames:
{{#setor.exames}}
| {{nome}} | {{esocial.codigo}} | {{#admissional}}X{{/admissional}} | {{#periodico}}X{{/periodico}} {{periodo}} | {{#retorno_trabalho}}X{{/retorno_trabalho}} | {{#mudanca_funcao}}X{{/mudanca_funcao}} | {{#demissional}}X{{/demissional}} | {{observacao}} |
{{/setor.exames}}
{{/setores}}

Dica .docx: para tabelas, coloque {{#setor.exames}} ... {{/setor.exames}}
APENAS na linha de dados (não envolva a tabela inteira).`;

export function PcmsoTemplateHelper() {
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
        Variáveis PCMSO
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Variáveis do PCMSO</DialogTitle>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground space-y-1.5">
            <p><Info className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Variáveis simples usam <code>{"{{variavel}}"}</code>.<br/>
              Loops usam <code>{"{{#loop}} ... {{/loop}}"}</code>.<br/>
              Campos booleanos podem mostrar <strong>X</strong> automaticamente: <code>{"{{#admissional}}X{{/admissional}}"}</code>.
            </p>
            <p className="text-accent text-xs">
              <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              Campos vazios são renderizados como string vazia — o template <strong>nunca</strong> mostra "undefined".
            </p>
          </div>

          <div className="space-y-5 mt-2">
            {groups.map((g) => (
              <div key={g.title}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{g.title}</h4>
                <div className="space-y-1">
                  {g.vars.map((v) => (
                    <div key={v.name} className="flex items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 shrink-0"
                        onClick={() => handleCopy(v.name)}
                      >
                        {v.name}
                        {copied === v.name ? <Check className="w-3 h-3 ml-1 text-success" /> : <Copy className="w-3 h-3 ml-1 opacity-40" />}
                      </Badge>
                      <span className="text-muted-foreground/60 uppercase tracking-wider text-[10px]">{v.tipo}</span>
                      <span className="text-muted-foreground truncate">{v.exemplo}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exemplo de uso</h4>
              <pre className="bg-muted/50 border rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{exemplo}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
