import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, FileSignature, FolderTree, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { sortByGes } from "@/lib/sortGes";
import { toast } from "sonner";

export default function FormularioAepNovo() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [setorModalOpen, setSetorModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [setoresSelecionados, setSetoresSelecionados] = useState<any[]>([]);

  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery({
    queryKey: ["formulario-aep-novo-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratos = [], isLoading: loadingContratos } = useQuery({
    queryKey: ["formulario-aep-novo-contratos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: setores = [], isLoading: loadingSetores } = useQuery({
    queryKey: ["formulario-aep-novo-setores", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("setores")
        .select("id, nome_setor, ghe_ges, descricao_ambiente")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      return sortByGes(data || []);
    },
  });

  const toggleSetor = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmSetores = () => {
    const escolhidos = (setores as any[]).filter((s) => selectedIds.has(s.id));
    setSetoresSelecionados(escolhidos);
    setSetorModalOpen(false);
  };

  const removerSetor = (id: string) => {
    setSetoresSelecionados((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCriar = () => {
    if (!empresaId) return toast.error("Selecione a empresa");
    if (!contratoId) return toast.error("Selecione o contrato");
    if (setoresSelecionados.length === 0) return toast.error("Selecione ao menos um setor");
    navigate("/documentos/aep/novo", {
      state: {
        empresaId,
        contratoId,
        setorIds: setoresSelecionados.map((s) => s.id),
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Novo Formulário AEP"
        description="Selecione a empresa, o contrato e os setores que farão parte da análise"
        actions={
          <Button variant="outline" onClick={() => navigate("/formulario-aep")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        }
      />

      <Card className="p-6 max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" /> Empresa
          </Label>
          <Select
            value={empresaId}
            onValueChange={(v) => {
              setEmpresaId(v);
              setContratoId("");
              setSetoresSelecionados([]);
              setSelectedIds(new Set());
            }}
            disabled={loadingEmpresas}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingEmpresas ? "Carregando..." : "Selecione a empresa"} />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {empresaId && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-muted-foreground" /> Contrato
            </Label>
            <Select
              value={contratoId}
              onValueChange={(v) => {
                setContratoId(v);
                setSetoresSelecionados([]);
                setSelectedIds(new Set());
              }}
              disabled={loadingContratos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingContratos ? "Carregando..." : "Selecione o contrato"} />
              </SelectTrigger>
              <SelectContent>
                {contratos.length === 0 ? (
                  <SelectItem value="__vazio__" disabled>
                    Nenhum contrato cadastrado
                  </SelectItem>
                ) : (
                  contratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero_contrato || "Sem número"}
                      {c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {empresaId && contratoId && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-muted-foreground" /> Selecione setores
            </Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start font-normal"
              onClick={() => setSetorModalOpen(true)}
            >
              {setoresSelecionados.length === 0
                ? "Clique para selecionar os setores"
                : `${setoresSelecionados.length} setor(es) selecionado(s)`}
            </Button>

            {setoresSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {setoresSelecionados.map((s) => (
                  <Badge key={s.id} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                    <span>
                      {s.ghe_ges ? `${s.ghe_ges} — ` : ""}{s.nome_setor}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerSetor(s.id)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      aria-label={`Remover ${s.nome_setor}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/formulario-aep")}>
            Cancelar
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleCriar}
            disabled={!empresaId || !contratoId || setoresSelecionados.length === 0}
          >
            Criar formulário
          </Button>
        </div>
      </Card>

      <Dialog open={setorModalOpen} onOpenChange={setSetorModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecione os setores</DialogTitle>
          </DialogHeader>

          {loadingSetores ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : setores.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum setor cadastrado para esta empresa e contrato.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1 py-2">
              {setores.map((s: any) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleSetor(s.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.ghe_ges ? `${s.ghe_ges} — ` : ""}{s.nome_setor}
                    </p>
                    {s.descricao_ambiente && (
                      <p className="text-[11px] text-muted-foreground truncate">{s.descricao_ambiente}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetorModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleConfirmSetores}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
