import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function AprErgo() {
  const navigate = useNavigate();
  useRealtimeSync([{ table: "documentos", queryKey: ["apr-ergo-documentos"] }], "apr-ergo-lista");
  const { data: registros = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["apr-ergo-documentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos")
        .select("id, empresa_id, contrato_id, empresa_nome, nome_documento, status, created_at, contratos(numero_contrato, nome_contratante)")
        .eq("tipo", "APR-ERGO").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  return <div>
    <PageHeader title="APR-ERGO" actions={<div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => navigate("/documentos")}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
      <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/documentos/apr-ergo/novo")}><Plus className="w-4 h-4 mr-2" />Novo APR-ERGO</Button>
    </div>} />
    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto my-12 text-muted-foreground" />
      : isError ? <div className="py-12 text-center space-y-3"><p>Não foi possível carregar as APR-ERGO.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div>
      : registros.length === 0 ? <div className="py-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3" /><p>Nenhuma APR-ERGO cadastrada</p></div>
      : <div className="space-y-2">{registros.map((r) => <Button key={r.id} variant="outline" className="w-full h-auto p-4 justify-start text-left whitespace-normal gap-3" onClick={() => navigate(`/documentos/apr-ergo/editar/${r.id}`)}>
        <FileText className="w-5 h-5 text-accent shrink-0" />
        <span className="flex-1 min-w-0 space-y-1"><span className="block font-medium break-words">{r.nome_documento || "APR-ERGO"}</span><span className="block text-xs text-muted-foreground break-words">{r.empresa_nome} · {r.contratos?.numero_contrato || r.contratos?.nome_contratante || "Sem contrato"} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</span></span>
        <Badge variant="outline" className="shrink-0">{r.status === "rascunho" ? "Rascunho" : r.status === "concluido" ? "Concluído" : r.status}</Badge>
      </Button>)}</div>}
  </div>;
}