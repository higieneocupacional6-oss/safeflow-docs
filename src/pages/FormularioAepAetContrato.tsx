import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, CloudOff, FolderTree, Loader2, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { sortByGes } from "@/lib/sortGes";
import {
  TIPO_AEP_AET,
  lerSnapshotAepAet,
  urlAepAetEmpresa,
  urlAepAetNovo,
  urlAepAetOffline,
  urlAepAetRegistro,
} from "@/lib/aepAetFormulario";
import { listAepAetOffline, type AepAetOfflineAvaliacao } from "@/lib/aepAetOfflineDb";

export default function FormularioAepAetContrato() {
  const { empresaId, contratoId } = useParams();
  const navigate = useNavigate();
  const [offlineLocais, setOfflineLocais] = useState<AepAetOfflineAvaliacao[]>([]);

  useRealtimeSync(
    [
      { table: "setores", queryKey: ["aep-aet-setores", contratoId] },
      { table: "funcoes", queryKey: ["aep-aet-funcoes", contratoId] },
      { table: "documentos", queryKey: ["aep-aet-docs-ctr", contratoId] },
    ],
    `aep-aet-ctr-${contratoId}`,
  );

  const { data: empresa } = useQuery({
    queryKey: ["aep-aet-empresa", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .eq("id", empresaId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: contrato } = useQuery({
    queryKey: ["aep-aet-contrato", contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante")
        .eq("id", contratoId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: setores = [], isLoading } = useQuery({
    queryKey: ["aep-aet-setores", contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, nome_setor, ghe_ges")
        .eq("contrato_id", contratoId!)
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      return sortByGes((data || []) as any[]);
    },
  });

  const { data: funcoes = [] } = useQuery({
    queryKey: ["aep-aet-funcoes", contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const setorIds = (
        await supabase.from("setores").select("id").eq("contrato_id", contratoId!).eq("empresa_id", empresaId!)
      ).data?.map((s: any) => s.id) || [];
      if (!setorIds.length) return [] as any[];
      const { data, error } = await supabase
        .from("funcoes")
        .select("id, nome_funcao, setor_id")
        .in("setor_id", setorIds);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["aep-aet-docs-ctr", contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, status, draft_snapshot, updated_at")
        .eq("tipo", TIPO_AEP_AET)
        .eq("empresa_id", empresaId!)
        .eq("contrato_id", contratoId!);
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (!contratoId) return;
    let cancelled = false;
    listAepAetOffline({ contratoId })
      .then((rows) => {
        if (!cancelled) setOfflineLocais(rows.filter((r) => !r.server_id || r.sync_status !== "synced"));
      })
      .catch(() => {
        if (!cancelled) setOfflineLocais([]);
      });
    return () => { cancelled = true; };
  }, [contratoId]);

  const setoresComFuncoes = useMemo(() => {
    return setores
      .map((s) => {
        const avaliacoes = docs
          .map((d) => ({ doc: d, snap: lerSnapshotAepAet(d.draft_snapshot) }))
          .filter((x) => x.snap?.setor_id === s.id)
          .map((x) => {
            const fn = funcoes.find((f) => f.id === x.snap!.funcao_id);
            return {
              avaliacaoId: x.doc.id,
              funcaoId: x.snap!.funcao_id,
              nome: fn?.nome_funcao || "Função",
              status: x.doc.status,
              updated_at: x.doc.updated_at,
              offline: false as boolean,
              clientId: null as string | null,
            };
          });

        const offlineDoSetor = offlineLocais
          .filter((o) => o.setor_id === s.id && !avaliacoes.some((a) => a.funcaoId === o.funcao_id))
          .map((o) => ({
            avaliacaoId: o.client_id,
            funcaoId: o.funcao_id,
            nome: o.funcao_nome || "Função",
            status: o.sync_status === "error" ? "erro sync" : "offline",
            updated_at: o.updated_at,
            offline: true,
            clientId: o.client_id,
          }));

        const all = [...avaliacoes, ...offlineDoSetor].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );
        return { ...s, avaliacoes: all };
      })
      .filter((s) => s.avaliacoes.length > 0);
  }, [setores, funcoes, docs, offlineLocais]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link to="/formulario-aep-aet">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Início
          </Button>
        </Link>
        <Link to={urlAepAetEmpresa(empresaId!)}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Contratos
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Contrato ${contrato?.numero_contrato || "—"}`}
        description={`${empresa?.nome_fantasia || empresa?.razao_social || "Empresa"} — setores e funções avaliadas`}
        actions={
          <Button onClick={() => navigate(urlAepAetNovo({ empresa: empresaId, contrato: contratoId }))}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova avaliação
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : setoresComFuncoes.length === 0 ? (
        <div className="portal-surface p-10 text-center text-sm text-muted-foreground">
          Nenhuma função avaliada neste contrato. Use “Nova avaliação” para cadastrar.
        </div>
      ) : (
        <div className="space-y-4">
          {setoresComFuncoes.map((setor) => (
            <section key={setor.id} className="portal-surface overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold">{setor.nome_setor}</p>
                  {setor.ghe_ges && (
                    <p className="text-[11px] text-muted-foreground">GHE/GES: {setor.ghe_ges}</p>
                  )}
                </div>
                <Badge variant="outline">{setor.avaliacoes.length}</Badge>
              </div>
              <ul className="divide-y divide-border/70">
                {setor.avaliacoes.map((av) => (
                  <li key={av.avaliacaoId}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                      onClick={() =>
                        navigate(
                          av.offline && av.clientId
                            ? urlAepAetOffline(empresaId!, contratoId!, av.clientId)
                            : urlAepAetRegistro(empresaId!, contratoId!, av.avaliacaoId),
                        )
                      }
                    >
                      {av.offline ? (
                        <CloudOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{av.nome}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {av.status || "rascunho"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
