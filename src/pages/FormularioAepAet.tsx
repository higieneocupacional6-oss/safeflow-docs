import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, ClipboardList, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { TIPO_AEP_AET, urlAepAetEmpresa, urlAepAetNovo } from "@/lib/aepAetFormulario";

type Empresa = { id: string; razao_social: string; nome_fantasia: string | null; cnpj: string | null };
type DocRow = { id: string; empresa_id: string; contrato_id: string | null; updated_at: string };

export default function FormularioAepAet() {
  const navigate = useNavigate();

  useRealtimeSync(
    [
      { table: "empresas", queryKey: ["aep-aet-empresas"] },
      { table: "documentos", queryKey: ["aep-aet-docs"] },
    ],
    "aep-aet-list-sync",
  );

  const { data: empresas = [], isLoading: loadingEmp } = useQuery({
    queryKey: ["aep-aet-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia, cnpj")
        .order("razao_social");
      if (error) throw error;
      return (data || []) as Empresa[];
    },
  });

  const { data: docs = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["aep-aet-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, empresa_id, contrato_id, updated_at")
        .eq("tipo", TIPO_AEP_AET)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DocRow[];
    },
  });

  const empresasComAvaliacao = useMemo(() => {
    const byEmp = new Map<string, { total: number; contratos: Set<string>; ultima: string }>();
    for (const d of docs) {
      if (!d.empresa_id) continue;
      const cur = byEmp.get(d.empresa_id) || { total: 0, contratos: new Set<string>(), ultima: d.updated_at };
      cur.total += 1;
      if (d.contrato_id) cur.contratos.add(d.contrato_id);
      if (d.updated_at > cur.ultima) cur.ultima = d.updated_at;
      byEmp.set(d.empresa_id, cur);
    }
    return empresas
      .filter((e) => byEmp.has(e.id))
      .map((e) => {
        const stats = byEmp.get(e.id)!;
        return {
          ...e,
          total: stats.total,
          contratos: stats.contratos.size,
          ultima: stats.ultima,
        };
      });
  }, [empresas, docs]);

  const loading = loadingEmp || loadingDocs;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formulário AEP/AET"
        description="Avaliações por empresa, contrato, setor e função"
        actions={
          <Button onClick={() => navigate(urlAepAetNovo())}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova avaliação
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : empresasComAvaliacao.length === 0 ? (
        <div className="portal-surface px-6 py-14 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-heading text-base font-semibold text-foreground">Nenhuma avaliação AEP/AET</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em “Nova avaliação” para selecionar empresa, contrato e função.
          </p>
          <Button className="mt-5" onClick={() => navigate(urlAepAetNovo())}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova avaliação
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {empresasComAvaliacao.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => navigate(urlAepAetEmpresa(e.id))}
              className="portal-surface group flex flex-col gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary">
                    {e.nome_fantasia || e.razao_social}
                  </p>
                  {e.nome_fantasia && (
                    <p className="truncate text-xs text-muted-foreground">{e.razao_social}</p>
                  )}
                  {e.cnpj && <p className="mt-0.5 text-[11px] text-muted-foreground">{e.cnpj}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{e.total} avaliação{e.total === 1 ? "" : "ões"}</Badge>
                <Badge variant="outline">{e.contratos} contrato{e.contratos === 1 ? "" : "s"}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
