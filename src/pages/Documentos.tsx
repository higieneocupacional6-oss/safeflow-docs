import { useMemo, useState } from "react";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, Loader2, Download, Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InsalubridadeStartModal } from "@/components/InsalubridadeStartModal";
import { PericulosidadeStartModal } from "@/components/PericulosidadeStartModal";
import { PcmsoStartModal } from "@/components/PcmsoStartModal";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const docTypes = [
  { id: "ltcat", label: "LTCAT", desc: "Laudo Técnico das Condições Ambientais de Trabalho" },
  { id: "pgr", label: "PGR", desc: "Programa de Gerenciamento de Riscos" },
  { id: "pcmso", label: "PCMSO", desc: "Programa de Controle Médico de Saúde Ocupacional" },
  { id: "insalubridade", label: "Insalubridade", desc: "Laudo de Insalubridade" },
  { id: "periculosidade", label: "Periculosidade", desc: "Laudo de Periculosidade" },
  { id: "aet", label: "AET", desc: "Análise Ergonômica do Trabalho" },
];

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  concluido: { label: "Concluído", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  rascunho: { label: "Rascunho", icon: Clock, className: "bg-amber-100 text-amber-700 border border-amber-300" },
  erro: { label: "Erro", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

export default function Documentos() {
  const [open, setOpen] = useState(false);
  const [insalubridadeOpen, setInsalubridadeOpen] = useState(false);
  const [periculosidadeOpen, setPericulosidadeOpen] = useState(false);
  const [pcmsoOpen, setPcmsoOpen] = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("all");
  const [filtroContrato, setFiltroContrato] = useState<string>("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useRealtimeSync(
    [
      { table: "documentos", queryKey: ["documentos"] },
      { table: "aet_documentos", queryKey: ["documentos"] },
      { table: "contratos", queryKey: ["contratos-doc"] },
      { table: "empresas", queryKey: ["empresas-doc"] },
    ],
    "documentos-list-sync"
  );

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-doc"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id,razao_social,nome_fantasia").order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos-doc"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contratos").select("id,empresa_id,numero_contrato,nome_contratante");
      if (error) throw error;
      return data;
    },
  });

  const contratosFiltro = useMemo(() => {
    if (filtroEmpresa === "all") return [] as any[];
    return (contratos as any[]).filter((c) => c.empresa_id === filtroEmpresa);
  }, [contratos, filtroEmpresa]);

  const docsFiltrados = useMemo(() => {
    return (documentos as any[]).filter((d) => {
      if (filtroEmpresa !== "all" && d.empresa_id !== filtroEmpresa) return false;
      if (filtroContrato !== "all" && d.contrato_id !== filtroContrato) return false;
      return true;
    });
  }, [documentos, filtroEmpresa, filtroContrato]);

  const contratoNomeById = (id: string | null) => {
    if (!id) return null;
    const c = (contratos as any[]).find((x) => x.id === id);
    return c ? (c.numero_contrato || c.nome_contratante || "Contrato") : null;
  };

  const handleSelectType = (typeId: string) => {
    setOpen(false);
    if (typeId === "ltcat") {
      navigate("/documentos/ltcat/novo");
    } else if (typeId === "insalubridade") {
      setTimeout(() => setInsalubridadeOpen(true), 100);
    } else if (typeId === "periculosidade") {
      setTimeout(() => setPericulosidadeOpen(true), 100);
    } else if (typeId === "aet") {
      navigate("/documentos/aet/novo");
    } else if (typeId === "pgr") {
      navigate("/documentos/pgr/novo");
    } else if (typeId === "pcmso") {
      setTimeout(() => setPcmsoOpen(true), 100);
    }
  };

  const handleDownload = async (filePath: string, tipo: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("templates")
        .download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tipo}_${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar documento");
    }
  };

  const handleDelete = async (id: string, filePath: string | null) => {
    if (filePath) {
      await supabase.storage.from("templates").remove([filePath]);
    }
    await supabase.from("documentos").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["documentos"] });
    toast.success("Documento removido");
  };

  const handleEdit = (doc: any) => {
    const tipo = (doc.tipo || "").toUpperCase();
    if (tipo === "LTCAT") {
      navigate(`/documentos/ltcat/editar/${doc.id}`);
    } else if (tipo === "INSALUBRIDADE") {
      navigate(`/documentos/insalubridade/editar/${doc.id}`);
    } else if (tipo === "PERICULOSIDADE") {
      navigate(`/documentos/periculosidade/editar/${doc.id}`);
    } else if (tipo === "AET") {
      navigate(`/documentos/aet/editar/${doc.id}`);
    } else if (tipo === "PGR") {
      navigate(`/documentos/pgr/editar/${doc.id}`);
    } else if (tipo === "PCMSO") {
      navigate(`/documentos/pcmso/editar/${doc.id}`);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR");

  return (
    <div>
      <PageHeader
        title="Documentos SST"
        description="Crie e gerencie documentos técnicos de segurança do trabalho"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Novo Documento
          </Button>
        }
      />

      {/* Filtros Empresa + Contrato */}
      <div className="glass-card rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Empresa</label>
          <Select value={filtroEmpresa} onValueChange={(v) => { setFiltroEmpresa(v); setFiltroContrato("all"); }}>
            <SelectTrigger><SelectValue placeholder="Todas as empresas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {(empresas as any[]).map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome_fantasia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Contrato</label>
          <Select value={filtroContrato} onValueChange={setFiltroContrato} disabled={filtroEmpresa === "all"}>
            <SelectTrigger><SelectValue placeholder={filtroEmpresa === "all" ? "Selecione uma empresa" : "Todos os contratos"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os contratos</SelectItem>
              {contratosFiltro.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.numero_contrato || "Sem número"}{c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : docsFiltrados.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {documentos.length === 0 ? "Nenhum documento gerado ainda" : "Nenhum documento neste filtro"}
          </p>
          {documentos.length === 0 && (
            <Button onClick={() => setOpen(true)} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />Criar Documento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {docsFiltrados.map((doc: any) => {
            const st = statusConfig[doc.status] || statusConfig.rascunho;
            const ctrNome = contratoNomeById(doc.contrato_id);
            return (
              <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">{doc.tipo}</Badge>
                    <span className="font-medium text-foreground">{doc.empresa_nome}</span>
                    {ctrNome && (
                      <Badge className="bg-accent/10 text-accent-foreground border-accent/20 text-[10px]">
                        {ctrNome}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${st.className} gap-1`}>
                    <st.icon className="w-3 h-3" />
                    {st.label}
                  </Badge>
                  <Button
                    variant={doc.status === "rascunho" ? "outline" : "ghost"}
                    size={doc.status === "rascunho" ? "sm" : "icon"}
                    className={doc.status === "rascunho" ? "h-8 gap-1.5" : "h-8 w-8"}
                    onClick={() => handleEdit(doc)}
                    title={doc.status === "rascunho" ? "Continuar edição" : "Editar documento"}
                  >
                    <Pencil className="w-4 h-4" />
                    {doc.status === "rascunho" && <span className="text-xs">Continuar</span>}
                  </Button>
                  {doc.file_path && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(doc.file_path, doc.tipo)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(doc.id, doc.file_path)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {docTypes.map((dt) => (
              <button
                key={dt.id}
                onClick={() => handleSelectType(dt.id)}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors"
              >
                <span className="font-heading font-semibold text-foreground">{dt.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{dt.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <InsalubridadeStartModal open={insalubridadeOpen} onOpenChange={setInsalubridadeOpen} />
      <PericulosidadeStartModal open={periculosidadeOpen} onOpenChange={setPericulosidadeOpen} />
      <PcmsoStartModal open={pcmsoOpen} onOpenChange={setPcmsoOpen} />
    </div>
  );
}
