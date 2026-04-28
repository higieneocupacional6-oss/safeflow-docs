import { useState } from "react";
import { BookOpen, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ruidoBlock = `{{#setores}}

{{setor}}
GES: {{ghe_ges}} | Local: {{local_trabalho}} | Jornada: {{jornada_trabalho}}

Descrição do Setor:
{{descricao_ambiente}}

RECONHECIMENTO DE RISCOS
Funções do GES: {{funcoes_ges}} | Função Avaliada: {{funcao}} | Atividade: {{descricao_atividade}}

{{#riscos}}
{{#is_ruido}}

{{agente_nome}}

AGENTE | FONTE GERADORA | PROPAGAÇÃO | EXPOSIÇÃO | DANOS À SAÚDE | METODOLOGIA | TEMPO DE COLETA
{{agente_nome}} | {{fonte_geradora}} | {{propagacao}} | {{tipo_exposicao}} | {{danos_saude}} | {{tecnica_amostragem}} | {{tempo_coleta}} {{unidade_tempo_coleta}}

RESULTADOS DAS AVALIAÇÕES
DATA | COLABORADOR | FUNÇÃO | CÓD eSOCIAL | DOSE (%) | RESULTADO | LIMITE | SITUAÇÃO | GFIP
{{#avaliacoes}}
{{data_avaliacao}} | {{colaborador}} | {{funcao}} | {{codigo_esocial}} | {{dose_percentual}} | {{resultado}} {{unidade_resultado}} | {{limite_tolerancia}} {{unidade_limite}} | {{situacao}} | {{cod_gfip}}
{{/avaliacoes}}

MEDIDAS DE CONTROLE
EPI | CA | EFICAZ
{{#epis}}
{{epi_nome}} | {{epi_ca}} | {{epi_eficaz}}
{{/epis}}

EPC | EFICAZ
{{#epcs}}
{{epc_nome}} | {{epc_eficaz}}
{{/epcs}}

PARECER TÉCNICO
{{parecer_tecnico}}

ENSEJADOR DE APOSENTADORIA ESPECIAL
{{aposentadoria_especial}}

{{/is_ruido}}
{{/riscos}}
{{/setores}}`;

const quimicoBlock = `{{#setores}}
{{#riscos}}
{{#is_quimico}}

═══════════════════════════════════════
AGENTE QUÍMICO: {{agente_nome}}
═══════════════════════════════════════

SETOR: {{setor}}
GES: {{ghe_ges}} | Local: {{local_trabalho}} | Jornada: {{jornada_trabalho}}

Descrição do Setor:
{{descricao_ambiente}}

Funções do GES: {{funcoes_ges}}
Código eSocial: {{codigo_esocial}} — {{descricao_esocial}}

RECONHECIMENTO DO RISCO QUÍMICO
AGENTE | FONTE GERADORA | PROPAGAÇÃO | EXPOSIÇÃO | DANOS À SAÚDE | METODOLOGIA | TEMPO DE COLETA
{{agente_nome}} | {{fonte_geradora}} | {{propagacao}} | {{tipo_exposicao}} | {{danos_saude}} | {{tecnica_amostragem}} | {{tempo_coleta}} {{unidade_tempo_coleta}}

RESULTADOS DAS AVALIAÇÕES
DATA | COLABORADOR | FUNÇÃO | COMPONENTE AVALIADO | RESULTADO | LIMITE | SITUAÇÃO | GFIP
{{#avaliacoes}}
{{data_avaliacao}} | {{colaborador}} | {{funcao}} | {{componente_avaliado}} | {{resultado}} {{unidade_resultado}} | {{limite_tolerancia}} {{unidade_limite}} | {{situacao}} | {{cod_gfip}}
{{/avaliacoes}}

EQUIPAMENTOS UTILIZADOS NA AVALIAÇÃO
EQUIPAMENTO | MODELO | SÉRIE | DATA AVALIAÇÃO | DATA CALIBRAÇÃO
{{#equipamentos_avaliacao}}
{{nome_equipamento}} | {{modelo_equipamento}} | {{serie_equipamento}} | {{data_avaliacao}} | {{data_calibracao}}
{{/equipamentos_avaliacao}}

MEDIDAS DE CONTROLE
{{medidas_controle}}

EPI | CA | ATENUAÇÃO | EFICAZ
{{#epis}}
{{epi_nome}} | {{epi_ca}} | {{epi_atenuacao}} | {{epi_eficaz}}
{{/epis}}

EPC | EFICAZ
{{#epcs}}
{{epc_nome}} | {{epc_eficaz}}
{{/epcs}}

PARECER TÉCNICO
{{parecer_tecnico}}

ENSEJADOR DE APOSENTADORIA ESPECIAL
{{aposentadoria_especial}}

{{/is_quimico}}
{{/riscos}}
{{/setores}}`;

const quimicoTabelaSimples = `{{#setores}}
{{#riscos}}
{{#is_quimico}}

{{agente_nome}}

DATA | COLABORADOR | FUNÇÃO | COMPONENTE | RESULTADO | LIMITE | SITUAÇÃO | GFIP
{{#avaliacoes}}
{{data_avaliacao}} | {{colaborador}} | {{funcao}} | {{componente_avaliado}} | {{resultado}} {{unidade_resultado}} | {{limite_tolerancia}} {{unidade_limite}} | {{situacao}} | {{cod_gfip}}
{{/avaliacoes}}

{{/is_quimico}}
{{/riscos}}
{{/setores}}`;

const calorBlock = `{{#setores}}
{{#riscos}}
{{#is_calor}}

═══════════════════════════════════════
AGENTE FÍSICO — CALOR: {{agente_nome}}
═══════════════════════════════════════

SETOR: {{setor}}
GES: {{ghe_ges}} | Local: {{local_trabalho}} | Jornada: {{jornada_trabalho}}

Descrição do Setor:
{{descricao_ambiente}}

RECONHECIMENTO DO RISCO — CALOR
AGENTE | FONTE GERADORA | PROPAGAÇÃO | EXPOSIÇÃO | DANOS À SAÚDE | METODOLOGIA
{{agente_nome}} | {{fonte_geradora}} | {{propagacao}} | {{tipo_exposicao}} | {{danos_saude}} | {{tecnica_amostragem}}

RESULTADOS DAS AVALIAÇÕES — CALOR
DATA | COLABORADOR | FUNÇÃO | TIPO ATIVIDADE | TAXA METABÓLICA | EXPOSIÇÃO | LIMITE | SITUAÇÃO | GFIP
{{#avaliacoes}}
{{data_avaliacao}} | {{colaborador}} | {{funcao}} | {{tipo_atividade}} | {{taxa_metabolica}} | {{exposicao}} {{unidade_exposicao}} | {{limite_tolerancia}} {{unidade_limite}} | {{situacao}} | {{cod_gfip}}
{{/avaliacoes}}

MEDIDAS DE CONTROLE
EPI | CA | EFICAZ
{{#epis}}
{{epi_nome}} | {{epi_ca}} | {{epi_eficaz}}
{{/epis}}

EPC | EFICAZ
{{#epcs}}
{{epc_nome}} | {{epc_eficaz}}
{{/epcs}}

PARECER TÉCNICO
{{parecer_tecnico}}

ENSEJADOR DE APOSENTADORIA ESPECIAL
{{aposentadoria_especial}}

{{/is_calor}}
{{/riscos}}
{{/setores}}`;

const vciBlock = `{{#setores}}
{{#riscos}}
{{#is_vibracao_corpo_inteiro}}

═══════════════════════════════════════
VIBRAÇÃO DE CORPO INTEIRO (VCI): {{agente_nome}}
═══════════════════════════════════════

SETOR: {{setor}}
GES: {{ghe_ges}} | Local: {{local_trabalho}} | Jornada: {{jornada_trabalho}}

Descrição do Setor:
{{descricao_ambiente}}

RESULTADOS DAS AVALIAÇÕES — VCI
DATA | COLABORADOR | FUNÇÃO | EQUIPAMENTO | AREN | LIMITE AREN | VDVR | LIMITE VDVR | SITUAÇÃO | GFIP
{{#avaliacoes}}
{{data_avaliacao}} | {{colaborador}} | {{funcao}} | {{equipamento_avaliado}} | {{resultado_aren}} {{unidade_aren}} | {{limite_aren}} {{unidade_limite_aren}} | {{resultado_vdvr}} {{unidade_vdvr}} | {{limite_vdvr}} {{unidade_limite_vdvr}} | {{situacao}} | {{cod_gfip}}
{{/avaliacoes}}

MEDIDAS DE CONTROLE
EPI | CA | EFICAZ
{{#epis}}
{{epi_nome}} | {{epi_ca}} | {{epi_eficaz}}
{{/epis}}

EPC | EFICAZ
{{#epcs}}
{{epc_nome}} | {{epc_eficaz}}
{{/epcs}}

PARECER TÉCNICO
{{parecer_tecnico}}

ENSEJADOR DE APOSENTADORIA ESPECIAL
{{aposentadoria_especial}}

{{/is_vibracao_corpo_inteiro}}
{{/riscos}}
{{/setores}}`;

const vmbBlock = `{{#setores}}
{{#riscos}}
{{#is_vibracao_maos_bracos}}

═══════════════════════════════════════
VIBRAÇÃO DE MÃOS E BRAÇOS (VMB): {{agente_nome}}
═══════════════════════════════════════

SETOR: {{setor}}
GES: {{ghe_ges}} | Local: {{local_trabalho}} | Jornada: {{jornada_trabalho}}

Descrição do Setor:
{{descricao_ambiente}}

RESULTADOS DAS AVALIAÇÕES — VMB
DATA | COLABORADOR | FUNÇÃO | EQUIPAMENTO | AREN | LIMITE AREN | SITUAÇÃO | GFIP
{{#avaliacoes}}
{{data_avaliacao}} | {{colaborador}} | {{funcao}} | {{equipamento_avaliado}} | {{resultado_aren}} {{unidade_aren}} | {{limite_aren}} {{unidade_limite_aren}} | {{situacao}} | {{cod_gfip}}
{{/avaliacoes}}

MEDIDAS DE CONTROLE
EPI | CA | EFICAZ
{{#epis}}
{{epi_nome}} | {{epi_ca}} | {{epi_eficaz}}
{{/epis}}

EPC | EFICAZ
{{#epcs}}
{{epc_nome}} | {{epc_eficaz}}
{{/epcs}}

PARECER TÉCNICO
{{parecer_tecnico}}

ENSEJADOR DE APOSENTADORIA ESPECIAL
{{aposentadoria_especial}}

{{/is_vibracao_maos_bracos}}
{{/riscos}}
{{/setores}}`;

const rules = [
  "NÃO alterar {{}} das variáveis",
  "NÃO remover loops (# e /)",
  "Cada {{#setores}} deve fechar com {{/setores}}",
  "Cada {{#riscos}} deve fechar com {{/riscos}}",
  "Cada {{#avaliacoes}} deve fechar com {{/avaliacoes}}",
];

const displayRules = [
  { label: "SETOR", desc: "Aparece a cada novo setor — formatar MAIÚSCULO + NEGRITO" },
  { label: "AGENTE FÍSICO", desc: "Fundo VERDE no Word" },
  { label: "AGENTE QUÍMICO", desc: "Fundo VERMELHO + texto branco no Word" },
  { label: "RESULTADOS", desc: "Repete para cada colaborador avaliado" },
  { label: "Situação Segura", desc: "Cor verde (#00ff5f)" },
  { label: "Situação Nocivo", desc: "Cor vermelho (#ff3b1f)" },
];

export function LtcatTemplateHelper() {
  const [open, setOpen] = useState(false);
  const [showRuido, setShowRuido] = useState(false);
  const [showQuimico, setShowQuimico] = useState(false);
  const [showQuimicoVars, setShowQuimicoVars] = useState(false);
  const [showCalor, setShowCalor] = useState(false);
  const [showVci, setShowVci] = useState(false);
  const [showVmb, setShowVmb] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string>("");

  const handleCopyBlock = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    toast.success("Bloco copiado! Cole no seu template Word.");
    setTimeout(() => setCopiedKey(""), 3000);
  };

  const handleCopyVar = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopiedKey(v);
    toast.success(`Copiado: ${v}`);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const quimicoVarGroups = [
    {
      title: "Modal de Riscos (Químico)",
      vars: ["{{agente_nome}}", "{{tipo_agente}}", "{{is_quimico}}", "{{codigo_esocial}}", "{{descricao_esocial}}", "{{fonte_geradora}}", "{{propagacao}}", "{{tipo_exposicao}}", "{{danos_saude}}", "{{medidas_controle}}"],
    },
    {
      title: "Componentes Químicos",
      vars: ["{{#avaliacoes}}", "{{agente_nome}}", "{{codigo_esocial}}", "{{descricao_esocial}}", "{{tipo_agente}}", "{{/avaliacoes}}"],
    },
    {
      title: "Resultados (Químico)",
      vars: ["{{data_avaliacao}}", "{{colaborador}}", "{{funcao}}", "{{cbo_codigo}}", "{{cbo_descricao}}", "{{descricao_atividades}}", "{{componente_avaliado}}", "{{resultado}}", "{{unidade_resultado}}", "{{limite_tolerancia}}", "{{unidade_limite}}", "{{situacao}}", "{{cod_gfip}}", "{{dose_percentual}}"],
    },
    {
      title: "Avaliações Químicas",
      vars: ["{{tecnica_amostragem}}", "{{tempo_coleta}}", "{{unidade_tempo_coleta}}", "{{nome_equipamento}}", "{{modelo_equipamento}}", "{{serie_equipamento}}", "{{data_calibracao}}"],
    },
    {
      title: "Equipamentos da Avaliação (Químico)",
      vars: ["{{#equipamentos_avaliacao}}", "{{nome_equipamento}}", "{{modelo_equipamento}}", "{{serie_equipamento}}", "{{data_avaliacao}}", "{{data_calibracao}}", "{{/equipamentos_avaliacao}}"],
    },
    {
      title: "Parecer & Conclusão",
      vars: ["{{parecer_tecnico}}", "{{aposentadoria_especial}}"],
    },
    {
      title: "Flags Condicionais (Tipo de Agente)",
      vars: ["{{#is_quimico}}", "{{/is_quimico}}", "{{#is_fisico}}", "{{/is_fisico}}", "{{#is_biologico}}", "{{/is_biologico}}", "{{#is_ruido}}", "{{/is_ruido}}", "{{#is_calor}}", "{{/is_calor}}", "{{#is_vibracao}}", "{{/is_vibracao}}"],
    },
  ];

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <BookOpen className="w-4 h-4" />
        Variáveis LTCAT
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Variáveis LTCAT — Assistente de Template</DialogTitle>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground mb-4">
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Copie e cole as estruturas abaixo no seu template Word para montar automaticamente a tabela do LTCAT.
          </div>

          {/* Tabela Ruído */}
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => setShowRuido(!showRuido)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-success text-success-foreground">Físico</Badge>
                <span className="font-heading font-semibold">TABELA RUÍDO</span>
              </div>
              {showRuido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRuido && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Essa tabela será repetida automaticamente para cada <strong>SETOR</strong> e para cada <strong>AGENTE</strong> (Ruído).
                </p>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 gap-1.5"
                    onClick={() => handleCopyBlock("ruido", ruidoBlock)}
                  >
                    {copiedKey === "ruido" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "ruido" ? "Copiado!" : "Copiar Bloco"}
                  </Button>
                  <pre className="bg-muted/60 border border-border rounded-lg p-4 pt-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto">
                    {ruidoBlock}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Regras de exibição no Word</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayRules.map((r) => (
                      <div key={r.label} className="text-xs p-2 rounded bg-muted/40 border border-border">
                        <span className="font-semibold text-foreground">{r.label}:</span>{" "}
                        <span className="text-muted-foreground">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela Químico */}
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => setShowQuimico(!showQuimico)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-destructive text-destructive-foreground">Químico</Badge>
                <span className="font-heading font-semibold">TABELA QUÍMICO</span>
              </div>
              {showQuimico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showQuimico && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Bloco condicional via <code className="bg-muted px-1 rounded">{"{{#is_quimico}}"}</code> — só aparece quando o risco for do tipo <strong>QUÍMICO</strong>.
                </p>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 gap-1.5"
                    onClick={() => handleCopyBlock("quimico", quimicoBlock)}
                  >
                    {copiedKey === "quimico" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "quimico" ? "Copiado!" : "Copiar Bloco"}
                  </Button>
                  <pre className="bg-muted/60 border border-border rounded-lg p-4 pt-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto">
                    {quimicoBlock}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    📌 Tabela Químico Simples (com Componente Avaliado)
                  </h4>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 z-10 gap-1.5"
                      onClick={() => handleCopyBlock("quimico-simples", quimicoTabelaSimples)}
                    >
                      {copiedKey === "quimico-simples" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === "quimico-simples" ? "Copiado!" : "Copiar Bloco"}
                    </Button>
                    <pre className="bg-muted/60 border border-border rounded-lg p-4 pt-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[35vh] overflow-y-auto">
                      {quimicoTabelaSimples}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela Calor */}
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => setShowCalor(!showCalor)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-warning text-warning-foreground">Físico</Badge>
                <span className="font-heading font-semibold">TABELA CALOR</span>
              </div>
              {showCalor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCalor && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Bloco condicional via <code className="bg-muted px-1 rounded">{"{{#is_calor}}"}</code> — só aparece quando o agente for <strong>CALOR</strong>. Use o loop <code className="bg-muted px-1 rounded">{"{{#avaliacoes}}"}</code> para listar todos os colaboradores avaliados.
                </p>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 gap-1.5"
                    onClick={() => handleCopyBlock("calor", calorBlock)}
                  >
                    {copiedKey === "calor" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "calor" ? "Copiado!" : "Copiar Bloco"}
                  </Button>
                  <pre className="bg-muted/60 border border-border rounded-lg p-4 pt-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto">
                    {calorBlock}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Variáveis exclusivas — Calor</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "{{#is_calor}}", "{{/is_calor}}",
                      "{{#avaliacoes}}", "{{/avaliacoes}}",
                      "{{data_avaliacao}}", "{{colaborador}}", "{{funcao}}",
                      "{{tipo_atividade}}", "{{taxa_metabolica}}",
                      "{{exposicao}}", "{{unidade_exposicao}}",
                      "{{limite_tolerancia}}", "{{unidade_limite}}",
                      "{{situacao}}", "{{cod_gfip}}",
                    ].map((v) => (
                      <Badge
                        key={"calor-" + v}
                        variant="outline"
                        className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 transition-colors"
                        onClick={() => handleCopyVar(v)}
                      >
                        {v}
                        {copiedKey === v ? (
                          <Check className="w-3 h-3 ml-1 text-success" />
                        ) : (
                          <Copy className="w-3 h-3 ml-1 opacity-40" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela VCI */}
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => setShowVci(!showVci)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-success text-success-foreground">Físico</Badge>
                <span className="font-heading font-semibold">TABELA VIBRAÇÃO CORPO INTEIRO (VCI)</span>
              </div>
              {showVci ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showVci && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Bloco condicional via <code className="bg-muted px-1 rounded">{"{{#is_vibracao_corpo_inteiro}}"}</code> — só aparece para agentes de <strong>VCI</strong>. Avalia AREN e VDVR (NOCIVO se qualquer um ultrapassar o limite).
                </p>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 gap-1.5"
                    onClick={() => handleCopyBlock("vci", vciBlock)}
                  >
                    {copiedKey === "vci" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "vci" ? "Copiado!" : "Copiar Bloco"}
                  </Button>
                  <pre className="bg-muted/60 border border-border rounded-lg p-4 pt-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto">
                    {vciBlock}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Variáveis exclusivas — VCI</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "{{#is_vibracao_corpo_inteiro}}", "{{/is_vibracao_corpo_inteiro}}",
                      "{{#avaliacoes}}", "{{/avaliacoes}}",
                      "{{data_avaliacao}}", "{{colaborador}}", "{{funcao}}",
                      "{{equipamento_avaliado}}",
                      "{{resultado_aren}}", "{{unidade_aren}}",
                      "{{limite_aren}}", "{{unidade_limite_aren}}",
                      "{{resultado_vdvr}}", "{{unidade_vdvr}}",
                      "{{limite_vdvr}}", "{{unidade_limite_vdvr}}",
                      "{{situacao}}", "{{cod_gfip}}",
                    ].map((v) => (
                      <Badge
                        key={"vci-" + v}
                        variant="outline"
                        className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 transition-colors"
                        onClick={() => handleCopyVar(v)}
                      >
                        {v}
                        {copiedKey === v ? <Check className="w-3 h-3 ml-1 text-success" /> : <Copy className="w-3 h-3 ml-1 opacity-40" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela VMB */}
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => setShowVmb(!showVmb)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-success text-success-foreground">Físico</Badge>
                <span className="font-heading font-semibold">TABELA VIBRAÇÃO MÃOS E BRAÇOS (VMB)</span>
              </div>
              {showVmb ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showVmb && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Bloco condicional via <code className="bg-muted px-1 rounded">{"{{#is_vibracao_maos_bracos}}"}</code> — só aparece para agentes de <strong>VMB</strong>. Avalia apenas AREN.
                </p>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 gap-1.5"
                    onClick={() => handleCopyBlock("vmb", vmbBlock)}
                  >
                    {copiedKey === "vmb" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === "vmb" ? "Copiado!" : "Copiar Bloco"}
                  </Button>
                  <pre className="bg-muted/60 border border-border rounded-lg p-4 pt-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto">
                    {vmbBlock}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Variáveis exclusivas — VMB</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "{{#is_vibracao_maos_bracos}}", "{{/is_vibracao_maos_bracos}}",
                      "{{#avaliacoes}}", "{{/avaliacoes}}",
                      "{{data_avaliacao}}", "{{colaborador}}", "{{funcao}}",
                      "{{equipamento_avaliado}}",
                      "{{resultado_aren}}", "{{unidade_aren}}",
                      "{{limite_aren}}", "{{unidade_limite_aren}}",
                      "{{situacao}}", "{{cod_gfip}}",
                    ].map((v) => (
                      <Badge
                        key={"vmb-" + v}
                        variant="outline"
                        className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 transition-colors"
                        onClick={() => handleCopyVar(v)}
                      >
                        {v}
                        {copiedKey === v ? <Check className="w-3 h-3 ml-1 text-success" /> : <Copy className="w-3 h-3 ml-1 opacity-40" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Variáveis de cálculo (NEN / Dose média / Químicos) */}
          <div className="mt-3 border border-border rounded-lg overflow-hidden">
            <div className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary text-primary-foreground">Cálculo</Badge>
                <span className="font-heading font-semibold">VARIÁVEIS DE CÁLCULO — LTCAT / INSALUBRIDADE</span>
              </div>
              <p className="text-xs text-muted-foreground italic mb-3">
                Use dentro do loop <code className="bg-muted px-1 rounded">{"{{#riscos}}"}</code> (ou{" "}
                <code className="bg-muted px-1 rounded">{"{{#setores}}{{#riscos}}"}</code>). Os valores são
                calculados automaticamente a partir dos resultados cadastrados — retornam string vazia quando
                não houver dados suficientes.
              </p>
              <ul className="text-xs space-y-1.5 mb-3">
                <li>
                  <Badge
                    variant="outline"
                    className="font-mono cursor-pointer hover:bg-accent/10"
                    onClick={() => handleCopyVar("{{nen_medio}}")}
                  >
                    {"{{nen_medio}}"}
                    {copiedKey === "{{nen_medio}}" ? (
                      <Check className="w-3 h-3 ml-1 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 opacity-40" />
                    )}
                  </Badge>{" "}
                  <span className="text-muted-foreground">
                    NEN médio (energético) em dB — NHO-01 (1 casa decimal). Para <strong>Ruído</strong>.
                  </span>
                </li>
                <li>
                  <Badge
                    variant="outline"
                    className="font-mono cursor-pointer hover:bg-accent/10"
                    onClick={() => handleCopyVar("{{dose_media}}")}
                  >
                    {"{{dose_media}}"}
                    {copiedKey === "{{dose_media}}" ? (
                      <Check className="w-3 h-3 ml-1 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 opacity-40" />
                    )}
                  </Badge>{" "}
                  <span className="text-muted-foreground">
                    Dose média (%) — média aritmética das doses cadastradas (2 casas). Informativo para <strong>Insalubridade</strong>.
                  </span>
                </li>
                <li>
                  <Badge
                    variant="outline"
                    className="font-mono cursor-pointer hover:bg-accent/10"
                    onClick={() => handleCopyVar("{{media_concentracao}}")}
                  >
                    {"{{media_concentracao}}"}
                    {copiedKey === "{{media_concentracao}}" ? (
                      <Check className="w-3 h-3 ml-1 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 opacity-40" />
                    )}
                  </Badge>{" "}
                  <span className="text-muted-foreground">
                    Média das concentrações (mg/m³) cadastradas para <strong>Químicos</strong>.
                  </span>
                </li>
                <li>
                  <Badge
                    variant="outline"
                    className="font-mono cursor-pointer hover:bg-accent/10"
                    onClick={() => handleCopyVar("{{media_limite_tolerancia}}")}
                  >
                    {"{{media_limite_tolerancia}}"}
                    {copiedKey === "{{media_limite_tolerancia}}" ? (
                      <Check className="w-3 h-3 ml-1 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 opacity-40" />
                    )}
                  </Badge>{" "}
                  <span className="text-muted-foreground">
                    Média dos limites de tolerância informados para <strong>Químicos</strong>.
                  </span>
                </li>
                <li>
                  <Badge
                    variant="outline"
                    className="font-mono cursor-pointer hover:bg-accent/10"
                    onClick={() => handleCopyVar("{{#componentes_resumo}}")}
                  >
                    {"{{#componentes_resumo}}…{{/componentes_resumo}}"}
                    {copiedKey === "{{#componentes_resumo}}" ? (
                      <Check className="w-3 h-3 ml-1 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 opacity-40" />
                    )}
                  </Badge>{" "}
                  <span className="text-muted-foreground">
                    Loop por componente avaliado (Químicos). Variáveis internas:{" "}
                    <code>{"{{componente_nome}}"}</code>, <code>{"{{media_concentracao}}"}</code>,{" "}
                    <code>{"{{media_limite_tolerancia}}"}</code>, <code>{"{{unidade}}"}</code>.
                  </span>
                </li>
                <li>
                  <Badge
                    variant="outline"
                    className="font-mono cursor-pointer hover:bg-accent/10"
                    onClick={() => handleCopyVar("{{#componentes_calculo}}")}
                  >
                    {"{{#componentes_calculo}}…{{/componentes_calculo}}"}
                    {copiedKey === "{{#componentes_calculo}}" ? (
                      <Check className="w-3 h-3 ml-1 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 ml-1 opacity-40" />
                    )}
                  </Badge>{" "}
                  <span className="text-muted-foreground">
                    Loop NHO-08 com classificação automática. Variáveis internas:{" "}
                    <code>{"{{componente}}"}</code>, <code>{"{{media_concentracao}}"}</code>,{" "}
                    <code>{"{{media_limite}}"}</code>, <code>{"{{unidade}}"}</code>,{" "}
                    <code>{"{{situacao}}"}</code> (Abaixo/Acima do limite).
                  </span>
                </li>
              </ul>
              <pre className="bg-muted/60 border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`{{#riscos}}
  NEN médio: {{nen_medio}} dB
  Dose média: {{dose_media}} % (informativo)
  Concentração média: {{media_concentracao}}
  LT médio: {{media_limite_tolerancia}}

  {{#componentes_calculo}}
  Componente: {{componente}}
  Média da concentração: {{media_concentracao}} {{unidade}}
  LT médio: {{media_limite}} {{unidade}}
  Situação: {{situacao}}
  {{/componentes_calculo}}
{{/riscos}}`}
              </pre>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowQuimicoVars(!showQuimicoVars)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-destructive/40 text-destructive">Químico</Badge>
                <span className="font-heading font-semibold">VARIÁVEIS — AGENTE QUÍMICO</span>
              </div>
              {showQuimicoVars ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showQuimicoVars && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-muted-foreground italic">
                  Variáveis dos modais de Riscos, Resultados, Avaliações e Componentes — clique para copiar.
                </p>
                {quimicoVarGroups.map((group) => (
                  <div key={group.title}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.title}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {group.vars.map((v) => (
                        <Badge
                          key={v + group.title}
                          variant="outline"
                          className="font-mono text-xs py-1 px-2 cursor-pointer hover:bg-accent/10 transition-colors"
                          onClick={() => handleCopyVar(v)}
                        >
                          {v}
                          {copiedKey === v ? (
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
            )}
          </div>

          {/* Rules */}
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive mb-1">
              <AlertTriangle className="w-4 h-4" />
              Regras Importantes
            </div>
            {rules.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {i + 1}. {r}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
