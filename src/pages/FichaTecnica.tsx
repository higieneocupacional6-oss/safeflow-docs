import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function FichaTecnica() {
  const navigate = useNavigate();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);

  useRealtimeSync([
    { table: "empresas", queryKey: ["ficha-tecnica-empresas"] },
    { table: "contratos", queryKey: ["ficha-tecnica-contratos"] },
    { table: "ficha_tecnica_resultados", queryKey: ["ficha-tecnica-contagens"] },
  ], "ficha-tecnica-home-sync");

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["ficha-tecnica-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id, razao_social, nome_fantasia, cnpj").order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["ficha-tecnica-contratos", selectedEmpresa],
    enabled: !!selectedEmpresa,
    queryFn: async () => {
      const { data, error } = await supabase.from("contratos").select("id, empresa_id, numero_contrato, nome_contratante, local_trabalho").eq("empresa_id", selectedEmpresa || "").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const empresa = empresas.find((item) => item.id === selectedEmpresa);

  return (
    <div className="space-y-6">
      <PageHeader title="Ficha Técnica" description="Resultados de higiene ocupacional organizados por empresa e contrato" />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !selectedEmpresa ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {empresas.map((item) => (
            <Card key={item.id} className="p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md" onClick={() => setSelectedEmpresa(item.id)}>
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Building2 className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading font-semibold truncate">{item.nome_fantasia || item.razao_social}</h2>
                  <p className="text-xs text-muted-foreground truncate mt-1">{item.razao_social}</p>
                  {item.cnpj && <Badge variant="outline" className="mt-3 font-mono text-[10px]">{item.cnpj}</Badge>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Button type="button" variant="ghost" className="w-fit px-0 text-muted-foreground" onClick={() => setSelectedEmpresa(null)}>← Todas as empresas</Button>
          <div>
            <h2 className="font-heading text-xl font-semibold">{empresa?.nome_fantasia || empresa?.razao_social}</h2>
            <p className="text-sm text-muted-foreground">Selecione um contrato</p>
          </div>
          {contratos.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">Nenhum contrato cadastrado para esta empresa.</Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contratos.map((contrato) => (
                <Card key={contrato.id} className="p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group" onClick={() => navigate(`/ficha-tecnica/${selectedEmpresa}/${contrato.id}`)}>
                  <div className="flex items-start gap-4">
                    <div className="text-accent-foreground shrink-0"><Folder className="h-10 w-10 fill-accent text-accent group-hover:hidden" /><FolderOpen className="h-10 w-10 fill-accent text-accent hidden group-hover:block" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{contrato.numero_contrato || "Contrato sem número"}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-1">{contrato.nome_contratante || contrato.local_trabalho || "Sem descrição"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}