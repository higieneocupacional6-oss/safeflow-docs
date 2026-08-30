import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Users, CalendarDays, ClipboardList, Activity, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { statusGeralPsicossocial, corClassificacao } from "@/lib/psicoLink";

function Stat({ icon: Icon, label, value, extra }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-[11px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-2xl font-heading font-bold mt-1">{value}</p>
      {extra}
    </Card>
  );
}

function Campo({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

export default function PsicossocialEmpresa() {
  const { empresaId, contratoId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useRealtimeSync(
    [
      { table: "psico_avaliacoes", queryKey: ["psico-avs", empresaId, contratoId] },
      { table: "psico_respostas", queryKey: ["psico-resps", empresaId, contratoId] },
    ],
    `psico-dash-${contratoId}`,
  );

  const { data: empresa } = useQuery({
    queryKey: ["psico-empresa", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").eq("id", empresaId!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: contrato } = useQuery({
    queryKey: ["psico-contrato", contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contratos").select("*").eq("id", contratoId!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ["psico-avs", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_avaliacoes")
        .select("*")
        .eq("empresa_id", empresaId!)
        .eq("contrato_id", contratoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: respostas = [] } = useQuery({
    queryKey: ["psico-resps", empresaId, contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_respostas")
        .select("id, avaliacao_id, funcao_nome, data_avaliacao, blocos")
        .eq("contrato_id", contratoId!)
        .order("data_avaliacao", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const ultima = useMemo(() => {
    const datas = [
      ...respostas.map((r) => r.data_avaliacao),
      ...avaliacoes.map((a) => a.data_avaliacao),
    ].filter(Boolean).sort();
    return datas.length ? datas[datas.length - 1] : null;
  }, [respostas, avaliacoes]);

  const status = useMemo(() => statusGeralPsicossocial(respostas as any), [respostas]);

  const novaAvaliacao = async () => {
    const { data, error } = await supabase
      .from("psico_avaliacoes")
      .insert({
        empresa_id: empresaId!,
        contrato_id: contratoId!,
        titulo: `Avaliação ${new Date().toLocaleDateString("pt-BR")}`,
      } as any)
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["psico-avs", empresaId, contratoId] });
    navigate(`/psicossocial/${empresaId}/${contratoId}/avaliacao/${data.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex gap-2">
        <Link to="/psicossocial">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Psicossocial</Button>
        </Link>
      </div>

      <PageHeader
        title={empresa?.razao_social || "Empresa"}
        description={`Contrato: ${contrato?.numero_contrato || contrato?.escopo_contrato || "—"}`}
        actions={
          <Button onClick={novaAvaliacao}>
            <Plus className="w-4 h-4 mr-1.5" /> Nova Avaliação
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Colaboradores respondentes" value={respostas.length} />
        <Stat
          icon={CalendarDays}
          label="Última avaliação"
          value={ultima ? new Date(ultima + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
        />
        <Stat icon={ClipboardList} label="Avaliações geradas" value={avaliacoes.length} />
        <Stat
          icon={Activity}
          label="Status geral"
          value={<Badge className={`text-sm ${corClassificacao(status)}`} variant="outline">{status}</Badge> as any}
        />
      </div>

      <Card className="p-5">
        <h2 className="font-heading font-semibold mb-4">Dados da Empresa</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="CNPJ" value={empresa?.cnpj} />
          <Campo label="Razão Social" value={empresa?.razao_social} />
          <Campo label="Nome Fantasia" value={empresa?.nome_fantasia} />
          <Campo label="CNAE" value={empresa?.cnae_principal} />
          <Campo label="Grau de Risco" value={empresa?.grau_risco} />
          <Campo label="Local de Trabalho" value={contrato?.local_trabalho || empresa?.local_trabalho || empresa?.endereco} />
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="font-heading font-semibold">Histórico de Avaliações</h2>
        {avaliacoes.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma avaliação criada para este contrato.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {avaliacoes.map((a) => {
              const resp = respostas.filter((r) => r.avaliacao_id === a.id);
              const funcoes = new Set(resp.map((r) => r.funcao_nome));
              return (
                <Card
                  key={a.id}
                  onClick={() => navigate(`/psicossocial/${empresaId}/${contratoId}/avaliacao/${a.id}`)}
                  className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.data_avaliacao + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="outline">{funcoes.size} função(ões)</Badge>
                    <Badge variant="outline">{resp.length} resposta(s)</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
