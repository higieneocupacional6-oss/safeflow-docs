import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  funcoes: string[];
  empresaId: string;
  contratoId: string;
  /** Chamado após o cadastro; deve reprocessar e seguir para o relatório. */
  onCadastrado: () => void;
};

const NOVO = "__novo__";

export function FuncoesNaoVinculadasModal({
  open, onOpenChange, funcoes, empresaId, contratoId, onCadastrado,
}: Props) {
  const [etapa, setEtapa] = useState<"aviso" | "cadastro">("aviso");
  const [setorId, setSetorId] = useState<string>("");
  const [novoSetor, setNovoSetor] = useState("");
  const [ghe, setGhe] = useState("");
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setEtapa("aviso");
      setSelecionadas(funcoes);
      setSetorId("");
      setNovoSetor("");
      setGhe("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, funcoes.join("|")]);

  const { data: setores = [], refetch } = useQuery({
    queryKey: ["psico-setores-cad", empresaId, contratoId],
    enabled: open && !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, nome_setor, ghe_ges")
        .eq("empresa_id", empresaId)
        .order("nome_setor");
      if (error) throw error;
      return data as any[];
    },
  });

  const setorSelecionado = useMemo(
    () => setores.find((s) => s.id === setorId),
    [setores, setorId],
  );

  useEffect(() => {
    if (setorSelecionado?.ghe_ges) setGhe(setorSelecionado.ghe_ges);
  }, [setorSelecionado]);

  const salvar = async () => {
    if (!selecionadas.length) { toast.error("Selecione ao menos uma função."); return; }
    if (!setorId) { toast.error("Informe o setor."); return; }
    if (setorId === NOVO && !novoSetor.trim()) { toast.error("Informe o nome do novo setor."); return; }
    setSalvando(true);
    try {
      let idSetor = setorId;
      if (setorId === NOVO) {
        const { data, error } = await supabase
          .from("setores")
          .insert({
            empresa_id: empresaId,
            contrato_id: contratoId,
            nome_setor: novoSetor.trim(),
            ghe_ges: ghe.trim() || null,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        idSetor = data.id;
      } else if (ghe.trim() && ghe.trim() !== (setorSelecionado?.ghe_ges || "")) {
        const { error } = await supabase
          .from("setores")
          .update({ ghe_ges: ghe.trim() } as any)
          .eq("id", idSetor);
        if (error) throw error;
      }

      const rows = selecionadas.map((f) => ({ setor_id: idSetor, nome_funcao: f }));
      const { error: eF } = await supabase.from("funcoes").insert(rows as any);
      if (eF) throw eF;

      toast.success("Funções cadastradas.");
      await refetch();
      onOpenChange(false);
      onCadastrado();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao cadastrar funções.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={etapa === "aviso" ? "sm:max-w-lg" : "sm:max-w-3xl"}>
        {etapa === "aviso" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Atenção
              </DialogTitle>
              <DialogDescription>
                As funções abaixo foram avaliadas, mas não estão cadastradas em nenhum setor desta
                empresa. O relatório só pode ser gerado após o vínculo com Setor e GHE/GES.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 py-2">
              {funcoes.map((f) => (
                <Badge key={f} variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                  {f}
                </Badge>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              <Button onClick={() => setEtapa("cadastro")}>Cadastrar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading">Cadastrar funções em Setor / GHE</DialogTitle>
              <DialogDescription>
                Informe o GHE/GES e o Setor de destino e confirme as funções a serem cadastradas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Esquerda: GHE/GES */}
              <div className="grid gap-1.5 content-start">
                <Label>GHE / GES</Label>
                <Input
                  value={ghe}
                  onChange={(e) => setGhe(e.target.value)}
                  placeholder="Ex.: GHE 01"
                />
                <p className="text-[11px] text-muted-foreground">
                  Aplicado ao setor selecionado.
                </p>
              </div>

              {/* Centro: Setor */}
              <div className="grid gap-1.5 content-start">
                <Label>Setor</Label>
                <Select value={setorId} onValueChange={setSetorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {setores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome_setor}{s.ghe_ges ? ` — ${s.ghe_ges}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value={NOVO}>+ Novo setor…</SelectItem>
                  </SelectContent>
                </Select>
                {setorId === NOVO && (
                  <Input
                    value={novoSetor}
                    onChange={(e) => setNovoSetor(e.target.value)}
                    placeholder="Nome do novo setor"
                  />
                )}
              </div>

              {/* Direita: funções */}
              <div className="grid gap-1.5 content-start">
                <Label>Funções a cadastrar</Label>
                <div className="rounded-md border p-2 space-y-2 max-h-60 overflow-y-auto">
                  {funcoes.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selecionadas.includes(f)}
                        onCheckedChange={(v) =>
                          setSelecionadas((prev) => (v ? [...prev, f] : prev.filter((x) => x !== f)))
                        }
                      />
                      <span className="truncate">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEtapa("aviso")}>Voltar</Button>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null} OK
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
