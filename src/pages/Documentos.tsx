import { useState } from "react";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, Loader2, Download, Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const docTypes = [
  { id: "ltcat", label: "LTCAT", desc: "Laudo Técnico das Condições Ambientais de Trabalho" },
  { id: "pgr", label: "PGR", desc: "Programa de Gerenciamento de Riscos" },
  { id: "pcmso", label: "PCMSO", desc: "Programa de Controle Médico de Saúde Ocupacional" },
  { id: "insalubridade", label: "Insalubridade", desc: "Laudo de Insalubridade" },
  { id: "periculosidade", label: "Periculosidade", desc: "Laudo de Periculosidade" },
];

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  concluido: { label: "Concluído", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  rascunho: { label: "Rascunho", icon: Clock, className: "bg-amber-100 text-amber-700" },
  erro: { label: "Erro", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

export default function Documentos() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const handleSelectType = (typeId: string) => {
    setOpen(false);
    if (typeId === "ltcat") {
      navigate("/documentos/ltcat/novo");
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
    if (doc.tipo === "LTCAT") {
      navigate(`/documentos/ltcat/editar/${doc.id}`);
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : documentos.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum documento gerado ainda</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />Criar Documento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc: any) => {
            const st = statusConfig[doc.status] || statusConfig.rascunho;
            return (
              <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{doc.tipo}</Badge>
                    <span className="font-medium text-foreground">{doc.empresa_nome}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${st.className} gap-1`}>
                    <st.icon className="w-3 h-3" />
                    {st.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(doc)}
                    title="Editar documento"
                  >
                    <Pencil className="w-4 h-4" />
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
    </div>
  );
}
