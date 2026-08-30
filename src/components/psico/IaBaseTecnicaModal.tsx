import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export const BUCKET_BASE_TECNICA = "psico-base-tecnica";

export function useBaseTecnica() {
  return useQuery({
    queryKey: ["psico-base-tecnica"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_base_tecnica").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });
}

const kb = (n?: number | null) => (n ? `${(n / 1024 / 1024).toFixed(2)} MB` : "—");

export function IaBaseTecnicaModal({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const { data: arquivos = [], isLoading } = useBaseTecnica();

  const enviar = async (files: FileList | null) => {
    if (!files?.length) return;
    setEnviando(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") {
          toast.error(`${file.name}: apenas arquivos PDF são aceitos.`);
          continue;
        }
        const caminho = `${crypto.randomUUID()}.pdf`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET_BASE_TECNICA).upload(caminho, file, { contentType: "application/pdf" });
        if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
        const { error } = await supabase.from("psico_base_tecnica").insert({
          nome: file.name, caminho, tamanho: file.size,
        } as any);
        if (error) { toast.error(error.message); continue; }
      }
      qc.invalidateQueries({ queryKey: ["psico-base-tecnica"] });
      toast.success("Base técnica atualizada.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (row: any) => {
    await supabase.storage.from(BUCKET_BASE_TECNICA).remove([row.caminho]);
    const { error } = await supabase.from("psico_base_tecnica").delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["psico-base-tecnica"] });
    toast.success("Arquivo removido.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Base técnica da IA</DialogTitle>
          <DialogDescription>
            Os PDFs cadastrados aqui são consultados pela IA como fundamentação técnica e normativa
            na elaboração da metodologia, interpretações, fatores de risco, medidas de prevenção,
            plano de ação e conclusão. A base fica disponível para os próximos relatórios.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => enviar(e.target.files)}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={enviando}>
          {enviando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          Adicionar PDFs
        </Button>

        <div className="space-y-2">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
          {!isLoading && !arquivos.length && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum documento cadastrado na base técnica.
            </p>
          )}
          {arquivos.map((a) => (
            <Card key={a.id} className="p-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.nome}</p>
                <p className="text-xs text-muted-foreground">{kb(a.tamanho)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remover(a)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
