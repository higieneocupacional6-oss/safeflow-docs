import { useState, useRef } from "react";
import { Plus, FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Templates() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith(".docx")) {
        toast.error("Apenas arquivos .docx são aceitos");
        return;
      }
      setFile(f);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Informe o título do template");
      return;
    }
    if (!file) {
      toast.error("Selecione um arquivo .docx");
      return;
    }

    setSaving(true);
    try {
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("templates")
        .insert({ title: title.trim(), file_path: filePath });
      if (dbError) throw dbError;

      toast.success("Template salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setOpen(false);
      setTitle("");
      setFile(null);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from("templates").remove([filePath]);
    await supabase.from("templates").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    toast.success("Template removido");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Gerencie templates de documentos com variáveis dinâmicas"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Novo Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum template cadastrado</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="mt-4">
            <Upload className="w-4 h-4 mr-2" />Upload .docx
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="glass-card rounded-xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(t.id, t.file_path)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{t.title}</h3>
              <p className="text-xs text-muted-foreground">Enviado em {formatDate(t.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-xl p-5 mt-8">
        <h3 className="font-heading font-semibold mb-3">Variáveis Disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          {["{empresa}", "{cnpj}", "{endereco}", "{cnae}", "{setor}", "{funcao}", "{agente}", "{resultado}", "{unidade}", "{limite_tolerancia}", "{tecnica}", "{equipamento}", "{responsavel}", "{crea}", "{cargo}", "{data}"].map((v) => (
            <Badge key={v} variant="outline" className="font-mono text-xs py-1">{v}</Badge>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título do Template *</Label>
              <Input
                className="mt-1"
                placeholder="Ex: LTCAT Padrão v2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Arquivo do Template *</Label>
              <div className="mt-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="w-full justify-start gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {file ? file.name : "Selecionar arquivo .docx"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
