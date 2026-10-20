import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, ChevronDown, ChevronRight, ClipboardCheck, FileSignature, Loader2, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("pt-BR") : "";

export default function FormularioAep() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  useRealtimeSync(
    [
      { table: "empresas", queryKey: ["formulario-aep-empresas"] },
      { table: "contratos", queryKey: ["formulario-aep-contratos"] },
      { table: "documentos", queryKey: ["formulario-aep-documentos"] },
      { table: "formularios_aep", queryKey: ["formulario-aep-salvos"] },
    ],
    "formulario-aep-sync",
  );

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["formulario-aep-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia, cnpj")
        .order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["formulario-aep-contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, empresa_id, numero_contrato, nome_contratante, local_trabalho")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: formularios = [] } = useQuery({
    queryKey: ["formulario-aep-documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, empresa_id, contrato_id, status, updated_at, created_at")
        .eq("tipo", "AEP")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: salvos = [] } = useQuery({
    queryKey: ["formulario-aep-salvos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formularios_aep")
        .select("id, empresa_id, contrato_id, setor_ids, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const contratosByEmpresa = (id: string) => contratos.filter((c) => c.empresa_id === id);
  const formulariosByContrato = (id: string) => [
    ...salvos.filter((f) => f.contrato_id === id).map((f) => ({ ...f, salvo: true })),
    ...formularios.filter((f) => f.contrato_id === id),
  ];

  return (
    <div>
      <PageHeader
        title="Formulário AEP"
        description="Análise Ergonômica Preliminar organizada por empresa e contrato"
        actions={
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => navigate("/formulario-aep/novo")}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Formulário
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : empresas.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {empresas.map((emp) => {
            const isOpen = !!expanded[emp.id];
            const listaContratos = contratosByEmpresa(emp.id);
            const empresaNome = emp.nome_fantasia || emp.razao_social;
            const totalFormularios = listaContratos.reduce(
              (acc, c) => acc + formulariosByContrato(c.id).length, 0,
            );
            return (
              <div key={emp.id} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(emp.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:opacity-80 transition-opacity"
                >
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-foreground">{empresaNome}</span>
                      {emp.cnpj && <Badge variant="outline" className="font-mono text-[10px]">{emp.cnpj}</Badge>}
                      <Badge className="bg-accent/10 text-accent-foreground border-accent/20 text-[10px]">
                        {listaContratos.length} contrato{listaContratos.length === 1 ? "" : "s"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {totalFormularios} formulário{totalFormularios === 1 ? "" : "s"} AEP
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.razao_social}</p>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-2">
                    {listaContratos.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Nenhum contrato cadastrado para esta empresa
                      </div>
                    ) : (
                      listaContratos.map((c) => {
                        const forms = formulariosByContrato(c.id);
                        return (
                          <div key={c.id} className="bg-card rounded-lg p-3 border border-border space-y-2">
                            <div className="flex items-center gap-3">
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
                                {c.local_trabalho && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">📍 {c.local_trabalho}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {forms.length} formulário{forms.length === 1 ? "" : "s"}
                              </Badge>
                            </div>

                            {forms.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground pl-7">
                                Nenhum formulário AEP vinculado a este contrato
                              </p>
                            ) : (
                              <div className="pl-7 space-y-1">
                                {forms.map((f) => (
                                  <button
                                    key={f.id}
                                    onClick={() => f.salvo
                                      ? navigate("/formulario-aep/preencher", { state: { empresaId: f.empresa_id, contratoId: f.contrato_id, setorIds: f.setor_ids || [], formularioId: f.id } })
                                      : navigate(`/documentos/aep/editar/${f.id}`)}
                                    className="w-full flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left hover:border-primary/50 hover:shadow-sm transition-all"
                                  >
                                    <ClipboardCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="flex-1 text-sm text-foreground truncate">
                                      Formulário AEP — {formatDate(f.created_at)}
                                    </span>
                                    <Badge
                                      variant={f.salvo || f.status === "concluido" ? "default" : "outline"}
                                      className="text-[10px] shrink-0"
                                    >
                                      {f.salvo ? "Formulário salvo" : f.status === "concluido" ? "Concluído" : "Rascunho"}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground shrink-0">
                                      atualizado em {formatDate(f.updated_at)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
