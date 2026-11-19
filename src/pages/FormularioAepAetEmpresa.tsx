import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileSignature, Loader2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useAuth } from "@/hooks/useAuth";
import { TIPO_AEP_AET, urlAepAetContrato, urlAepAetNovo } from "@/lib/aepAetFormulario";
import { countAepAetOfflinePending } from "@/lib/aepAetOfflineDb";
import { syncAepAetOfflinePendentes } from "@/lib/aepAetOfflineSync";
import { toast } from "sonner";

export default function FormularioAepAetEmpresa() {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [pendingByContrato, setPendingByContrato] = useState<Record<string, number>>({});

  useRealtimeSync(
    [
      { table: "contratos", queryKey: ["aep-aet-contratos", empresaId] },
      { table: "documentos", queryKey: ["aep-aet-docs-emp", empresaId] },
    ],
    `aep-aet-emp-${empresaId}`,
  );

  const { data: empresa, isLoading: loadingEmp } = useQuery({
    queryKey: ["aep-aet-empresa", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia, cnpj")
        .eq("id", empresaId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: contratos = [], isLoading: loadingCtr } = useQuery({
    queryKey: ["aep-aet-contratos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante, local_trabalho, escopo_contrato")
        .eq("empresa_id", empresaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["aep-aet-docs-emp", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, contrato_id, status, updated_at")
        .eq("tipo", TIPO_AEP_AET)
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, number> = {};
      for (const c of contratos) {
        try {
          const counts = await countAepAetOfflinePending(c.id);
          map[c.id] = counts.pending + counts.error;
        } catch {
          map[c.id] = 0;
        }
      }
      if (!cancelled) setPendingByContrato(map);
    })();
    return () => { cancelled = true; };
  }, [contratos, syncingId]);

  const contratosComStats = useMemo(() => {
    return contratos.map((c) => {
      const doCtr = docs.filter((d) => d.contrato_id === c.id);
      return { ...c, total: doCtr.length, offlinePending: pendingByContrato[c.id] || 0 };
    });
  }, [contratos, docs, pendingByContrato]);

  const sincronizarContrato = async (contratoId: string) => {
    if (!empresaId || syncingId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Sem conexão. Conecte-se à internet para sincronizar.");
      return;
    }
    setSyncingId(contratoId);
    try {
      const result = await syncAepAetOfflinePendentes({
        empresaId,
        contratoId,
        userId: user?.id || null,
      });
      if (result.total === 0) {
        toast.message("Nada a sincronizar", {
          description: "Não há avaliações offline pendentes neste contrato.",
        });
      } else {
        toast.success(
          `Sincronização: ${result.synced} enviada(s), ${result.duplicates} já existente(s), ${result.errors} erro(s).`,
        );
        if (result.errors > 0) {
          const first = result.items.find((i) => i.status === "error");
          if (first?.message) toast.error(first.message);
        }
      }
      void qc.invalidateQueries({ queryKey: ["aep-aet-docs"] });
      void qc.invalidateQueries({ queryKey: ["aep-aet-docs-emp", empresaId] });
      void qc.invalidateQueries({ queryKey: ["aep-aet-docs-ctr", contratoId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na sincronização.");
    } finally {
      setSyncingId(null);
    }
  };

  const loading = loadingEmp || loadingCtr;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/formulario-aep-aet">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Formulário AEP/AET
          </Button>
        </Link>
      </div>

      <PageHeader
        title={empresa?.nome_fantasia || empresa?.razao_social || "Empresa"}
        description={empresa?.razao_social && empresa?.nome_fantasia ? empresa.razao_social : "Contratos com avaliações AEP/AET"}
        actions={
          <Button onClick={() => navigate(urlAepAetNovo({ empresa: empresaId }))}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova avaliação
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : contratosComStats.length === 0 ? (
        <div className="portal-surface p-10 text-center text-sm text-muted-foreground">
          Nenhum contrato cadastrado para esta empresa.
        </div>
      ) : (
        <div className="space-y-2">
          {contratosComStats.map((c) => (
            <div
              key={c.id}
              className="portal-surface flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => navigate(urlAepAetContrato(empresaId!, c.id))}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold">
                    Contrato {c.numero_contrato || "(sem número)"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.nome_contratante || c.escopo_contrato || c.local_trabalho || "—"}
                  </p>
                </div>
                <Badge variant="outline">{c.total} função{c.total === 1 ? "" : "ões"}</Badge>
                {c.offlinePending > 0 && (
                  <Badge variant="secondary">{c.offlinePending} offline</Badge>
                )}
              </button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 relative"
                title="Sincronizar avaliações offline deste contrato"
                aria-label="Sincronizar avaliações offline deste contrato"
                disabled={syncingId === c.id}
                onClick={() => void sincronizarContrato(c.id)}
              >
                {syncingId === c.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {c.offlinePending > 0 && syncingId !== c.id && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    {c.offlinePending}
                  </span>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
