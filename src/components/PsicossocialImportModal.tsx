import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, Check, Loader2, Users, Building2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { importarArquivoPsicossocial, type FuncaoSetorPsico, type ImportResultado } from "@/lib/psicoImport";
import type { AvaliacaoPsicossocial } from "@/components/PsicossocialModal";
import type { RelatorioContext } from "@/lib/copsoqRelatorio";

export function PsicossocialImportModal({
  open,
  onOpenChange,
  relatorioContext,
  funcoesSetor = [],
  onImportado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  relatorioContext?: RelatorioContext;
  /** Funções selecionadas no setor da AET — usadas para validar/normalizar funções do PDF. */
  funcoesSetor?: FuncaoSetorPsico[];
  /** Callback opcional — recebe as avaliações anonimizadas importadas para persistir na AET. */
  onImportado?: (avaliacoes: AvaliacaoPsicossocial[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ImportResultado | null>(null);
  const [gerando, setGerando] = useState(false);
  const [mapeamentosConfirmados, setMapeamentosConfirmados] = useState<Record<string, string>>({});
  const [funcoesSelecionadas, setFuncoesSelecionadas] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResultado(null);
    setCarregando(false);
    setGerando(false);
    setMapeamentosConfirmados({});
    setFuncoesSelecionadas(new Set());
    setBusca("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processarArquivo = async (f: File, mapeamentos: Record<string, string>) => {
    setResultado(null);
    setCarregando(true);
    try {
      const r = await importarArquivoPsicossocial(f, {
        funcoesSetor,
        mapeamentosConfirmados: mapeamentos,
      });
      if (!r.avaliacoes.length) {
        toast.error("Nenhuma resposta reconhecida no arquivo.");
      } else if (r.ambiguidadesFuncoes?.length) {
        toast.warning("Confirme o mapeamento das funções ambíguas antes de gerar o relatório.");
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

  const handleFile = async (f: File) => {
    setFile(f);
    setMapeamentosConfirmados({});
    await processarArquivo(f, {});
  };

  const confirmarMapeamento = async (original: string, funcao: string) => {
    if (!file) return;
    const next = { ...mapeamentosConfirmados, [original]: funcao };
    setMapeamentosConfirmados(next);
    await processarArquivo(file, next);
  };

  const temAmbiguidade = !!resultado?.ambiguidadesFuncoes?.length;
  const contagemPorFuncao = (resultado?.avaliacoes || []).reduce<Record<string, number>>((acc, av) => {
    const f = av.funcao || "Não informada";
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});

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
                  {typeof resultado.paginasProcessadas === "number" && (
                    <div>
                      <span className="text-muted-foreground">Páginas processadas:</span>{" "}
                      <strong>{resultado.paginasProcessadas}</strong>
                    </div>
                  )}
                  {resultado.paginasOcr && resultado.paginasOcr.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Páginas via OCR:</span>{" "}
                      <strong>{resultado.paginasOcr.join(", ")}</strong>
                    </div>
                  )}
                  {resultado.paginasComFalha && resultado.paginasComFalha.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Páginas com falha:</span>{" "}
                      <strong className="text-amber-700">{resultado.paginasComFalha.join(", ")}</strong>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Funções identificadas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resultado.funcoesEncontradas.length ? (
                        resultado.funcoesEncontradas.map((f) => (
                          <Badge key={f} variant="secondary" className="text-[10px]">
                            {f} • {contagemPorFuncao[f] || 0} respondente(s)
                          </Badge>
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
                  {resultado.funcoesIgnoradas && resultado.funcoesIgnoradas.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Funções ignoradas por não pertencerem ao setor:</span>{" "}
                      <span className="text-[11px]">{resultado.funcoesIgnoradas.join(" • ")}</span>
                    </div>
                  )}
                </div>
                {resultado.mapeamentosFuncoes && resultado.mapeamentosFuncoes.length > 0 && (
                  <div className="border-t border-border pt-2 space-y-1.5">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Mapeamento de funções</p>
                    <div className="space-y-1">
                      {resultado.mapeamentosFuncoes.map((m, i) => (
                        <div key={`${m.original}-${i}`} className="text-[11px] flex flex-wrap items-center gap-1.5">
                          <Badge variant={m.status === "ambigua" ? "destructive" : "outline"} className="text-[10px]">
                            {m.status === "automatico" ? "automático" : m.status === "confirmado" ? "confirmado" : m.status === "fora_setor" ? "ignorado" : m.status === "ambigua" ? "confirmar" : "não identificado"}
                          </Badge>
                          <span className="text-muted-foreground">{m.original}</span>
                          {m.funcao && <span>→ <strong>{m.funcao}</strong>{typeof m.score === "number" ? ` (${Math.round(m.score * 100)}%)` : ""}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resultado.ambiguidadesFuncoes && resultado.ambiguidadesFuncoes.length > 0 && (
                  <div className="rounded-md border border-destructive/40 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <AlertTriangle className="w-4 h-4" /> Confirme as funções ambíguas
                    </div>
                    {resultado.ambiguidadesFuncoes.map((m) => (
                      <div key={m.original} className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">PDF: <strong>{m.original}</strong></p>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.candidatos || []).map((c) => (
                            <Button
                              key={c.funcao}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => confirmarMapeamento(m.original, c.funcao)}
                            >
                              {c.funcao} ({Math.round(c.score * 100)}%)
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {resultado.avisos.length > 0 && (
                  <ul className="text-[11px] text-amber-700 list-disc pl-4 space-y-0.5">
                    {resultado.avisos.slice(0, 5).map((a, i) => (
                      <li key={i}>
                        {a.pagina ? `Página ${a.pagina}: ` : a.linha ? `Linha ${a.linha}: ` : ""}
                        {a.mensagem}
                      </li>
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
                    className={`p-4 transition ${temAmbiguidade ? "opacity-60" : "cursor-pointer hover:border-accent"}`}
                    onClick={() => !gerando && !temAmbiguidade && gerarRelatorio("funcao")}
                  >
                    <Users className="w-6 h-6 text-accent mb-2" />
                    <h3 className="font-heading font-semibold text-sm">Gerar por Função</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Um relatório PDF para cada função identificada
                      ({resultado.funcoesEncontradas.length || 1}).
                    </p>
                  </Card>
                  <Card
                    className={`p-4 transition ${temAmbiguidade ? "opacity-60" : "cursor-pointer hover:border-accent"}`}
                    onClick={() => !gerando && !temAmbiguidade && gerarRelatorio("geral")}
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
