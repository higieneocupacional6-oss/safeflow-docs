import { useState } from "react";
import { Download, FolderTree, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { rotuloSetor } from "@/lib/formularioAepRegistro";

type FuncaoSetor = { id: string; nome_funcao: string; descricao_atividades?: string | null };
type SetorOpcao = {
  id: string;
  nome_setor: string;
  ghe_ges?: string | null;
  descricao_ambiente?: string | null;
  funcoes?: FuncaoOpcao[];
};
type FuncaoOpcao = FuncaoSetor;

export function FuncaoAepItem({
  nome, detalhe, onOpen, onDownload,
}: {
  nome: string;
  detalhe?: string;
  onOpen: () => void;
  onDownload?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left text-sm text-foreground truncate hover:text-primary">
        {nome}
      </button>
      {detalhe && <span className="text-[11px] text-muted-foreground shrink-0">{detalhe}</span>}
      {onDownload && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={`Baixar relatório de ${nome}`}
          onClick={onDownload}
        >
          <Download className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export function SeletorSetorFuncoesAep({
  setores, loading, funcoesPorSetor, salvas, onChange, onAbrir, onBaixar,
}: {
  setores: SetorOpcao[];
  loading: boolean;
  funcoesPorSetor: Record<string, string[]>;
  salvas: Record<string, { id: string; updated_at?: string }>;
  onChange: (next: Record<string, string[]>) => void;
  onAbrir: (setorId: string, funcaoId: string, formularioId?: string) => void;
  onBaixar: (setorId: string, funcaoId: string, formularioId: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [setorAtual, setSetorAtual] = useState<SetorOpcao | null>(null);
  const [temp, setTemp] = useState<Set<string>>(new Set());

  const selecionados = setores.filter((s) => (funcoesPorSetor[s.id] || []).length > 0);
  const nomeFuncao = (setor: SetorOpcao, id: string) =>
    setor.funcoes?.find((f) => f.id === id)?.nome_funcao || "Função";

  const abrirFuncoes = (setor: SetorOpcao) => {
    const lista = setor.funcoes || [];
    if (lista.length === 0) {
      toast.error("Este setor não tem funções vinculadas.");
      return;
    }
    setSetorAtual(setor);
    setTemp(new Set(funcoesPorSetor[setor.id] || []));
  };

  const confirmarFuncoes = () => {
    if (!setorAtual) return;
    if (temp.size === 0) {
      toast.error("Selecione ao menos uma função.");
      return;
    }
    onChange({ ...funcoesPorSetor, [setorAtual.id]: [...temp] });
    setSetorAtual(null);
  };

  const removerSetor = (setorId: string) => {
    const next = { ...funcoesPorSetor };
    delete next[setorId];
    onChange(next);
  };

  const fechar = (open: boolean) => {
    setAberto(open);
    if (!open) setSetorAtual(null);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <FolderTree className="w-4 h-4 text-muted-foreground" /> Selecione setores
      </Label>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start font-normal"
        onClick={() => { setSetorAtual(null); setAberto(true); }}
      >
        {selecionados.length === 0
          ? "Clique para selecionar os setores"
          : `${selecionados.length} setor(es) selecionado(s)`}
      </Button>

      {selecionados.length > 0 && (
        <div className="space-y-3 pt-1">
          {selecionados.map((setor) => (
            <div key={setor.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 py-1 px-2">
                  <span>{rotuloSetor(setor)}</span>
                  <button
                    type="button"
                    onClick={() => removerSetor(setor.id)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    aria-label={`Remover ${setor.nome_setor}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
              <div className="space-y-1 pl-1">
                {(funcoesPorSetor[setor.id] || []).map((funcaoId) => {
                  const salvo = salvas[funcaoId];
                  return (
                    <FuncaoAepItem
                      key={funcaoId}
                      nome={nomeFuncao(setor, funcaoId)}
                      detalhe={salvo ? "Formulário salvo" : "Pendente"}
                      onOpen={() => onAbrir(setor.id, funcaoId, salvo?.id)}
                      onDownload={salvo ? () => onBaixar(setor.id, funcaoId, salvo.id) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={fechar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {setorAtual ? `Funções de ${rotuloSetor(setorAtual)}` : "Selecione os setores"}
            </DialogTitle>
          </DialogHeader>

          {setorAtual ? (
            <div className="max-h-80 overflow-y-auto space-y-1 py-2">
              {[...(setorAtual.funcoes || [])]
                .sort((a, b) => a.nome_funcao.localeCompare(b.nome_funcao, "pt-BR"))
                .map((funcao) => (
                  <label
                    key={funcao.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Checkbox
                      checked={temp.has(funcao.id)}
                      onCheckedChange={() => {
                        setTemp((prev) => {
                          const next = new Set(prev);
                          if (next.has(funcao.id)) next.delete(funcao.id);
                          else next.add(funcao.id);
                          return next;
                        });
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{funcao.nome_funcao}</p>
                      {funcao.descricao_atividades && (
                        <p className="text-[11px] text-muted-foreground truncate">{funcao.descricao_atividades}</p>
                      )}
                    </div>
                  </label>
                ))}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : setores.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum setor cadastrado para esta empresa e contrato.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1 py-2">
              {setores.map((setor) => {
                const marcado = (funcoesPorSetor[setor.id] || []).length > 0;
                return (
                  <div
                    key={setor.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <Checkbox
                      checked={marcado}
                      onCheckedChange={(v) => (v ? abrirFuncoes(setor) : removerSetor(setor.id))}
                      aria-label={`Selecionar ${setor.nome_setor}`}
                    />
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => abrirFuncoes(setor)}>
                      <p className="text-sm font-medium text-foreground truncate">{rotuloSetor(setor)}</p>
                      {setor.descricao_ambiente && (
                        <p className="text-[11px] text-muted-foreground truncate">{setor.descricao_ambiente}</p>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            {setorAtual ? (
              <>
                <Button variant="outline" onClick={() => setSetorAtual(null)}>Voltar</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={confirmarFuncoes}>
                  Confirmar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => fechar(false)}>Cancelar</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => fechar(false)}>
                  OK
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
