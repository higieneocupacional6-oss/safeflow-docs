import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wrench, AlertTriangle, CheckCircle2, XCircle, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SITUACAO_OPERACIONAL_OPCOES,
  statusCalibracao,
  statusBadgeClasses,
} from "@/lib/calibracao";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ControleEquipamentosModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState<{
    open: boolean;
    id: string;
    numero_serie: string;
    marca_modelo: string;
    data_calibracao: string;
  }>({ open: false, id: "", numero_serie: "", marca_modelo: "", data_calibracao: "" });
  const [saving, setSaving] = useState(false);

  const { data: equipamentos = [] } = useQuery({
    queryKey: ["equipamentos_ho"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos_ho")
        .select("*, equipamentos_ho_registros(id, numero_serie, marca_modelo, data_calibracao, situacao_operacional)")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const counts = useMemo(() => {
    let conforme = 0, atencao = 0, vencido = 0;
    for (const e of equipamentos as any[]) {
      for (const r of e.equipamentos_ho_registros || []) {
        const s = statusCalibracao(r.data_calibracao).status;
        if (s === "conforme") conforme++;
        else if (s === "atencao") atencao++;
        else if (s === "vencido") vencido++;
      }
    }
    return { conforme, atencao, vencido };
  }, [equipamentos]);

  const handleSituacaoChange = async (registroId: string, novaSituacao: string, registro: any) => {
    const { error } = await supabase
      .from("equipamentos_ho_registros")
      .update({ situacao_operacional: novaSituacao })
      .eq("id", registroId);
    if (error) {
      toast.error("Erro ao atualizar situação");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["equipamentos_ho"] });
    if (novaSituacao === "Aparelho calibrado") {
      setEditModal({
        open: true,
        id: registroId,
        numero_serie: registro.numero_serie || "",
        marca_modelo: registro.marca_modelo || "",
        data_calibracao: registro.data_calibracao || "",
      });
    } else {
      toast.success("Situação atualizada");
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal.data_calibracao) {
      toast.error("Informe a data de calibração");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("equipamentos_ho_registros")
      .update({
        numero_serie: editModal.numero_serie,
        marca_modelo: editModal.marca_modelo,
        data_calibracao: editModal.data_calibracao,
      })
      .eq("id", editModal.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["equipamentos_ho"] });
    toast.success("Calibração atualizada");
    setEditModal({ ...editModal, open: false });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Wrench className="w-5 h-5 text-accent" /> Controle de Equipamentos
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border p-3 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Em Conformidade
              </div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{counts.conforme}</div>
            </div>
            <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/30 border-amber-400">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" /> Atenção
              </div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{counts.atencao}</div>
            </div>
            <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/30 border-red-400">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-sm font-medium">
                <XCircle className="w-4 h-4" /> Vencido
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{counts.vencido}</div>
            </div>
          </div>

          {equipamentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              Nenhum equipamento cadastrado.
            </div>
          ) : (
            <div className="space-y-4">
              {(equipamentos as any[]).map((e) => {
                const registros = e.equipamentos_ho_registros || [];
                return (
                  <div key={e.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-accent" />
                      <h4 className="font-semibold">{e.nome}</h4>
                      <span className="text-xs text-muted-foreground">({registros.length} registro{registros.length !== 1 ? "s" : ""})</span>
                    </div>
                    {registros.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Sem registros de calibração</p>
                    ) : (
                      <div className="space-y-2">
                        {registros.map((r: any) => {
                          const st = statusCalibracao(r.data_calibracao);
                          return (
                            <div
                              key={r.id}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded-md p-2 bg-muted/30 text-xs"
                            >
                              <div className="md:col-span-2">
                                <span className="text-muted-foreground">Série:</span>{" "}
                                <span className="font-medium">{r.numero_serie}</span>
                              </div>
                              <div className="md:col-span-3">
                                <span className="text-muted-foreground">Marca/Modelo:</span> {r.marca_modelo || "—"}
                              </div>
                              <div className="md:col-span-2">
                                <span className="text-muted-foreground">Calibração:</span>{" "}
                                {r.data_calibracao
                                  ? new Date(r.data_calibracao + "T00:00:00").toLocaleDateString("pt-BR")
                                  : "—"}
                                {st.meses !== null && (
                                  <div className="text-[10px] text-muted-foreground">{st.meses} mês(es)</div>
                                )}
                              </div>
                              <div className="md:col-span-2">
                                <Badge variant="outline" className={statusBadgeClasses(st.status)}>
                                  {st.label}
                                </Badge>
                              </div>
                              <div className="md:col-span-3">
                                <Select
                                  value={r.situacao_operacional || "Aparelho calibrado"}
                                  onValueChange={(v) => handleSituacaoChange(r.id, v, r)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SITUACAO_OPERACIONAL_OPCOES.map((o) => (
                                      <SelectItem key={o} value={o}>
                                        {o}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editModal.open} onOpenChange={(o) => setEditModal({ ...editModal, open: o })}>
        <DialogContent
          className="sm:max-w-md z-[80]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-heading">Editar Calibração</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nº de Série *</Label>
              <Input
                value={editModal.numero_serie}
                onChange={(e) => setEditModal({ ...editModal, numero_serie: e.target.value })}
              />
            </div>
            <div>
              <Label>Marca/Modelo</Label>
              <Input
                value={editModal.marca_modelo}
                onChange={(e) => setEditModal({ ...editModal, marca_modelo: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de Calibração *</Label>
              <Input
                type="date"
                value={editModal.data_calibracao}
                onChange={(e) => setEditModal({ ...editModal, data_calibracao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal({ ...editModal, open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
