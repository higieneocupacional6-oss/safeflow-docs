import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Building2, Pencil, Trash2, FileSignature, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContratoModal } from "@/components/ContratoModal";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function EmpresasContratos() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contratoModal, setContratoModal] = useState<{ open: boolean; empresaId: string; empresaNome: string; contrato?: any }>({
    open: false, empresaId: "", empresaNome: "",
  });
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  useRealtimeSync(
    [
      { table: "empresas", queryKey: ["empresas"] },
      { table: "contratos", queryKey: ["contratos"] },
    ],
    "empresas-contratos-sync",
  );

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contratos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const contratosByEmpresa = (id: string) => contratos.filter((c: any) => c.empresa_id === id);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const handleDeleteContrato = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("contratos").delete().eq("id", confirmDelete.id);
    if (error) return toast.error("Erro ao excluir");
    qc.invalidateQueries({ queryKey: ["contratos"] });
    toast.success("Contrato excluído");
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Empresas & Contratos"
        description="Visualize cada empresa e seus contratos vinculados"
        actions={
          <Button variant="outline" onClick={() => navigate("/empresas")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Empresas
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : empresas.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {empresas.map((emp: any) => {
            const isOpen = !!expanded[emp.id];
            const list = contratosByEmpresa(emp.id);
            const empresaNome = emp.nome_fantasia || emp.razao_social;
            return (
              <div key={emp.id} className="glass-card rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggle(emp.id)}
                    className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                  >
                    {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-foreground">{empresaNome}</span>
                        {emp.cnpj && <Badge variant="outline" className="font-mono text-[10px]">{emp.cnpj}</Badge>}
                        <Badge className="bg-accent/10 text-accent-foreground border-accent/20 text-[10px]">
                          {list.length} contrato{list.length === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.razao_social}</p>
                    </div>
                  </button>
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
                    onClick={() => setContratoModal({ open: true, empresaId: emp.id, empresaNome })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Contrato
                  </Button>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-2">
                    {list.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Nenhum contrato cadastrado para esta empresa
                      </div>
                    ) : (
                      list.map((c: any) => (
                        <div key={c.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
                          <FileSignature className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">
                                {c.numero_contrato || "Sem número"}
                              </span>
                              {c.nome_contratante && (
                                <span className="text-xs text-muted-foreground">— {c.nome_contratante}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                              {c.vigencia_inicio && c.vigencia_fim && (
                                <span>
                                  {new Date(c.vigencia_inicio).toLocaleDateString("pt-BR")} até {new Date(c.vigencia_fim).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                              {c.local_trabalho && <span className="truncate">📍 {c.local_trabalho}</span>}
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setContratoModal({ open: true, empresaId: emp.id, empresaNome, contrato: c })}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => setConfirmDelete(c)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ContratoModal
        open={contratoModal.open}
        onOpenChange={(v) => setContratoModal((p) => ({ ...p, open: v }))}
        empresaId={contratoModal.empresaId}
        empresaNome={contratoModal.empresaNome}
        contrato={contratoModal.contrato}
        onSaved={() => qc.invalidateQueries({ queryKey: ["contratos"] })}
      />

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir contrato?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o contrato <strong>{confirmDelete?.numero_contrato || "(sem número)"}</strong>? Documentos vinculados terão o vínculo removido.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteContrato}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
