import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Brain, ClipboardList, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function Psicossocial() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");

  useRealtimeSync(
    [
      { table: "psico_avaliacoes", queryKey: ["psico-avaliacoes-all"] },
      { table: "psico_respostas", queryKey: ["psico-avaliacoes-all"] },
    ],
    "psico-modulo-sync",
  );

  const { data: empresas = [] } = useQuery({
    queryKey: ["psico-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas").select("id, razao_social, nome_fantasia").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["psico-contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos").select("id, empresa_id, numero_contrato, objeto:escopo_contrato, local_trabalho");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ["psico-avaliacoes-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_avaliacoes")
        .select("id, empresa_id, contrato_id, titulo, data_avaliacao, created_at, empresas(razao_social), contratos(numero_contrato)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const contratosEmpresa = useMemo(
    () => contratos.filter((c) => c.empresa_id === empresaId),
    [contratos, empresaId],
  );

  /** Agrupa por empresa + contrato para listagem. */
  const grupos = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of avaliacoes) {
      const key = `${a.empresa_id}|${a.contrato_id || "sem"}`;
      const g = map.get(key) || {
        key,
        empresa_id: a.empresa_id,
        contrato_id: a.contrato_id,
        empresa: a.empresas?.razao_social || "Empresa",
        contrato: a.contratos?.numero_contrato || "Sem contrato",
        total: 0,
        ultima: a.data_avaliacao,
      };
      g.total++;
      if (a.data_avaliacao > g.ultima) g.ultima = a.data_avaliacao;
      map.set(key, g);
    }
    return Array.from(map.values());
  }, [avaliacoes]);

  const abrir = () => {
    if (!empresaId) { toast.error("Selecione a empresa"); return; }
    if (!contratoId) { toast.error("Selecione o contrato"); return; }
    setOpen(false);
    navigate(`/psicossocial/${empresaId}/${contratoId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Psicossocial"
        description="Gestão das Avaliações de Riscos Psicossociais por empresa e contrato"
        actions={
          <Button onClick={() => setOpen(true)}>
            <ClipboardList className="w-4 h-4 mr-1.5" /> Avaliação Psicossocial
          </Button>
        }
      />

      {grupos.length === 0 ? (
        <Card className="p-10 text-center space-y-2">
          <Brain className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Nenhuma avaliação cadastrada</p>
          <p className="text-sm text-muted-foreground">
            Clique em “Avaliação Psicossocial” e selecione empresa e contrato para começar.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <Card
              key={g.key}
              onClick={() => navigate(`/psicossocial/${g.empresa_id}/${g.contrato_id}`)}
              className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{g.empresa}</p>
                  <p className="text-xs text-muted-foreground truncate">Contrato: {g.contrato}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{g.total} avaliação(ões)</Badge>
                <span className="text-[11px] text-muted-foreground">
                  Última: {new Date(g.ultima + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Avaliação Psicossocial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Empresa *</Label>
              <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setContratoId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Contrato *</Label>
              <Select value={contratoId} onValueChange={setContratoId} disabled={!empresaId}>
                <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
                <SelectContent>
                  {contratosEmpresa.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero_contrato || c.objeto || "Contrato"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={abrir}>Abrir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
