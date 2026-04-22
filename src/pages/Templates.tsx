import { useState, useRef } from "react";
import { TemplateVariables } from "@/components/TemplateVariables";
import { LtcatTemplateHelper } from "@/components/LtcatTemplateHelper";
import { AetTemplateHelper } from "@/components/AetTemplateHelper";
import { CopsoqTemplateHelper } from "@/components/CopsoqTemplateHelper";
import { Plus, FileText, Upload, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { validateDocxTemplate, type TemplateIssue } from "@/lib/templateValidator";
import { validateHtmlTemplate } from "@/lib/htmlTemplate";

export default function Templates() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationIssues, setValidationIssues] = useState<TemplateIssue[]>([]);
  const [validationOpen, setValidationOpen] = useState(false);
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
      const lower = f.name.toLowerCase();
      if (!lower.endsWith(".docx") && !lower.endsWith(".html") && !lower.endsWith(".htm")) {
        toast.error("Apenas arquivos .docx ou .html são aceitos");
        return;
      }
      setFile(f);
    }
  };

  const persistTemplate = async (f: File) => {
    const filePath = `${Date.now()}_${f.name}`;
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(filePath, f);
    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from("templates")
      .insert({ title: title.trim(), file_path: filePath });
    if (dbError) throw dbError;
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
      // 1) Valida o template antes de salvar (DOCX ou HTML)
      const lower = file.name.toLowerCase();
      const isHtml = lower.endsWith(".html") || lower.endsWith(".htm");
      const issues = isHtml
        ? await validateHtmlTemplate(file)
        : await validateDocxTemplate(file);
      const blocking = issues.filter((i) => i.severidade === "erro");

      if (blocking.length > 0) {
        setValidationIssues(issues);
        setValidationOpen(true);
        toast.error(`${blocking.length} erro(s) encontrado(s) no template`);
        return;
      }

      // 2) Tudo certo → salva automático
      await persistTemplate(file);
      toast.success("✅ Template validado e salvo!");
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

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR");

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

      <div className="glass-card rounded-xl p-5 mt-8 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold mb-1">Variáveis para Templates</h3>
          <p className="text-xs text-muted-foreground">Clique para ver e copiar as variáveis disponíveis</p>
        </div>
        <div className="flex gap-2">
          <LtcatTemplateHelper />
          <AetTemplateHelper />
          <CopsoqTemplateHelper />
          <TemplateVariables />
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
                  accept=".docx,.html,.htm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="w-full justify-start gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {file ? file.name : "Selecionar arquivo .docx ou .html"}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Aceitamos <strong>.docx</strong> e <strong>.html</strong>. O documento final é sempre gerado em <strong>.docx</strong>.
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Ao clicar em <strong>Salvar</strong>, validamos o template antes de enviar. Se houver erros, mostraremos uma lista para correção.
              </p>
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
              {saving ? "Validando…" : "Salvar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Errors Modal */}
      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Erros encontrados no template
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Corrija os problemas abaixo no arquivo .docx e tente enviar novamente. Templates com erros não podem ser salvos.
          </p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
            {validationIssues.map((err, i) => (
              <div
                key={i}
                className={`rounded-lg p-4 border text-left ${
                  err.severidade === "erro"
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`text-xs font-bold rounded px-2 py-0.5 shrink-0 ${
                      err.severidade === "erro"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {err.severidade === "erro" ? "❌ ERRO" : "⚠️ AVISO"}
                  </span>
                  <div className="space-y-1.5 text-sm min-w-0">
                    <p className="font-semibold text-foreground">{err.mensagem}</p>
                    <p className="text-muted-foreground">{err.explicacao}</p>
                    <p className="text-accent font-medium">
                      ✏️ <span className="font-semibold">Solução:</span> {err.correcao}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {validationIssues.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="w-4 h-4" /> Nenhum problema encontrado.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationOpen(false)} className="gap-2">
              Entendi, corrigir template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
