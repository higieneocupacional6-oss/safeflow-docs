import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, FileText, Check, Loader2, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { importarArquivoPsicossocial, type ImportResultado } from "@/lib/psicoImport";
import type { AvaliacaoPsicossocial } from "@/components/PsicossocialModal";
import type { RelatorioContext } from "@/lib/copsoqRelatorio";

export function PsicossocialImportModal({
  open,
  onOpenChange,
  relatorioContext,
  onImportado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  relatorioContext?: RelatorioContext;
  /** Callback opcional — recebe as avaliações anonimizadas importadas para persistir na AET. */
  onImportado?: (avaliacoes: AvaliacaoPsicossocial[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ImportResultado | null>(null);
  const [gerando, setGerando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResultado(null);
    setCarregando(false);
    setGerando(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setResultado(null);
    setCarregando(true);
    try {
      const r = await importarArquivoPsicossocial(f);
      if (!r.avaliacoes.length) {
        toast.error("Nenhuma resposta reconhecida no arquivo.");
      } else {
        toast.success(`${r.avaliacoes.length} respondentes processados.`);
      }
      setResultado(r);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao ler o arquivo.");
    } finally {
      setCarregando(false);
    }
  };

  const gerarRelatorio = async (modo: "funcao" | "geral") => {
    if (!resultado || !resultado.avaliacoes.length) return;
    setGerando(true);
    try {
      const { gerarRelatorioCopsoqPDF } = await import("@/lib/copsoqRelatorio");
      // Sempre anonimizar (defesa em profundidade)
      const anonimas = resultado.avaliacoes.map((a) => ({ ...a, colaborador_nome: "" }));
      if (modo === "geral") {
        gerarRelatorioCopsoqPDF(anonimas, {
          ...(relatorioContext || {}),
          funcoes: resultado.funcoesEncontradas,
        });
        toast.success("Relatório geral gerado.");
      } else {
        // Um PDF por função
        const grupos = new Map<string, AvaliacaoPsicossocial[]>();
        for (const a of anonimas) {
          const k = a.funcao || "Não informada";
          if (!grupos.has(k)) grupos.set(k, []);
          grupos.get(k)!.push(a);
        }
        for (const [funcao, avs] of grupos) {
          gerarRelatorioCopsoqPDF(avs, {
            ...(relatorioContext || {}),
            funcoes: [funcao],
          });
          // pequena espera para navegador não bloquear múltiplos downloads
          await new Promise((r) => setTimeout(r, 400));
        }
        toast.success(`${grupos.size} relatório(s) por função gerado(s).`);
      }
      onImportado?.(anonimas);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar: " + (e?.message || ""));
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            Gerar Automaticamente por Arquivo (COPSOQ)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie uma planilha (.xlsx / .xls) ou PDF com as respostas do questionário.
            O sistema identifica automaticamente perguntas, respostas e funções.
            Nomes dos colaboradores <strong>não</strong> serão utilizados nos relatórios.
          </p>

          {/* Upload */}
          <Card
            className="p-6 border-dashed border-2 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/40 transition"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {file ? file.name : "Clique para selecionar o arquivo"}
            </p>
            <p className="text-xs text-muted-foreground">.xlsx, .xls, .pdf — até 20 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </Card>

          {carregando && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Lendo arquivo…
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <>
              <Card className="p-4 bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold">Leitura concluída</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Respondentes:</span>{" "}
                    <strong>{resultado.totalRespondentes}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Respostas reconhecidas:</span>{" "}
                    <strong>{resultado.totalPerguntasReconhecidas}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Funções identificadas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resultado.funcoesEncontradas.length ? (
                        resultado.funcoesEncontradas.map((f) => (
                          <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic">nenhuma</span>
                      )}
                    </div>
                  </div>
                  {resultado.colunasIgnoradas.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Colunas ignoradas:</span>{" "}
                      <span className="text-[11px]">{resultado.colunasIgnoradas.join(" • ")}</span>
                    </div>
                  )}
                </div>
                {resultado.avisos.length > 0 && (
                  <ul className="text-[11px] text-amber-700 list-disc pl-4 space-y-0.5">
                    {resultado.avisos.slice(0, 5).map((a, i) => (
                      <li key={i}>{a.linha ? `Linha ${a.linha}: ` : ""}{a.mensagem}</li>
                    ))}
                    {resultado.avisos.length > 5 && (
                      <li>… e mais {resultado.avisos.length - 5} avisos.</li>
                    )}
                  </ul>
                )}
              </Card>

              {resultado.avaliacoes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card
                    className="p-4 cursor-pointer hover:border-accent transition"
                    onClick={() => !gerando && gerarRelatorio("funcao")}
                  >
                    <Users className="w-6 h-6 text-accent mb-2" />
                    <h3 className="font-heading font-semibold text-sm">Gerar por Função</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Um relatório PDF para cada função identificada
                      ({resultado.funcoesEncontradas.length || 1}).
                    </p>
                  </Card>
                  <Card
                    className="p-4 cursor-pointer hover:border-accent transition"
                    onClick={() => !gerando && gerarRelatorio("geral")}
                  >
                    <Building2 className="w-6 h-6 text-accent mb-2" />
                    <h3 className="font-heading font-semibold text-sm">Relatório Geral da Empresa</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Análise institucional consolidada de todos os respondentes.
                    </p>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Fechar</Button>
          {gerando && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Gerando…
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
