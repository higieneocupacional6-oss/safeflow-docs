import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, Eye, FileText, FolderPlus, Folder, Loader2, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUCKET_CONHECIMENTO, MAX_ARQUIVOS_POR_PASTA, type ConhecimentoTipo,
} from "@/lib/iaConhecimento";

const fmtTam = (n?: number | null) => (n ? `${(n / 1024 / 1024).toFixed(2)} MB` : "—");
const fmtData = (d?: string) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

export function ConhecimentoIaModal({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pastaUpload, setPastaUpload] = useState<any | null>(null);
  const [criando, setCriando] = useState(false);
  const [novoTipo, setNovoTipo] = useState<ConhecimentoTipo>("AET");
  const [novoNome, setNovoNome] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { data: pastas = [], isLoading } = useQuery({
    queryKey: ["ia-conhecimento-pastas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ia_conhecimento_pastas").select("*").order("created_at");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: open,
  });

  const { data: arquivos = [] } = useQuery({
    queryKey: ["ia-conhecimento-arquivos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ia_conhecimento_arquivos").select("*").order("created_at");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: open,
  });

  const daPasta = (id: string) => arquivos.filter((a) => a.pasta_id === id);

  const criarPasta = async () => {
    if (!novoNome.trim()) { toast.error("Informe o nome da pasta."); return; }
    const { error } = await supabase.from("ia_conhecimento_pastas").insert({
      tipo: novoTipo, nome: novoNome.trim(),
    } as any);
    if (error) { toast.error(error.message); return; }
    setNovoNome("");
    setCriando(false);
    qc.invalidateQueries({ queryKey: ["ia-conhecimento-pastas"] });
    toast.success("Pasta criada.");
  };

  const excluirPasta = async (p: any) => {
    if (!confirm(`Excluir a pasta "${p.nome}" e todos os seus arquivos?`)) return;
    const caminhos = daPasta(p.id).map((a) => a.caminho);
    if (caminhos.length) await supabase.storage.from(BUCKET_CONHECIMENTO).remove(caminhos);
    const { error } = await supabase.from("ia_conhecimento_pastas").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["ia-conhecimento-pastas"] });
    qc.invalidateQueries({ queryKey: ["ia-conhecimento-arquivos"] });
    toast.success("Pasta excluída.");
  };

  const abrirUpload = (p: any) => {
    if (daPasta(p.id).length >= MAX_ARQUIVOS_POR_PASTA) {
      toast.error(`Cada pasta aceita no máximo ${MAX_ARQUIVOS_POR_PASTA} arquivos.`);
      return;
    }
    setPastaUpload(p);
    setTimeout(() => inputRef.current?.click(), 0);
  };

  const enviar = async (files: FileList | null) => {
    const pasta = pastaUpload;
    if (!files?.length || !pasta) return;
    setEnviando(true);
    try {
      let restantes = MAX_ARQUIVOS_POR_PASTA - daPasta(pasta.id).length;
      for (const file of Array.from(files)) {
        if (restantes <= 0) {
          toast.error(`Limite de ${MAX_ARQUIVOS_POR_PASTA} arquivos atingido em "${pasta.nome}".`);
          break;
        }
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const caminho = `${pasta.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET_CONHECIMENTO).upload(caminho, file, { contentType: file.type || undefined });
        if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
        const { error } = await supabase.from("ia_conhecimento_arquivos").insert({
          pasta_id: pasta.id, nome: file.name, caminho, mime: file.type, tamanho: file.size,
        } as any);
        if (error) { toast.error(error.message); continue; }
        restantes--;
      }
      qc.invalidateQueries({ queryKey: ["ia-conhecimento-arquivos"] });
      toast.success("Arquivos enviados.");
    } finally {
      setEnviando(false);
      setPastaUpload(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const url = async (a: any) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_CONHECIMENTO).createSignedUrl(a.caminho, 300);
    if (error || !data?.signedUrl) { toast.error("Não foi possível abrir o arquivo."); return null; }
    return data.signedUrl;
  };

  const visualizar = async (a: any) => {
    const u = await url(a);
    if (u) window.open(u, "_blank", "noopener");
  };

  const baixar = async (a: any) => {
    const { data, error } = await supabase.storage.from(BUCKET_CONHECIMENTO).download(a.caminho);
    if (error || !data) { toast.error("Falha ao baixar o arquivo."); return; }
    const href = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = href; link.download = a.nome; link.click();
    URL.revokeObjectURL(href);
  };

  const excluirArquivo = async (a: any) => {
    if (!confirm(`Excluir "${a.nome}"?`)) return;
    await supabase.storage.from(BUCKET_CONHECIMENTO).remove([a.caminho]);
    const { error } = await supabase.from("ia_conhecimento_arquivos").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["ia-conhecimento-arquivos"] });
    toast.success("Arquivo excluído.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">🧠 Conhecimento IA</DialogTitle>
          <DialogDescription>
            Biblioteca técnica consultada pela IA na elaboração de AET e AEP. As pastas do tipo AET
            são usadas apenas na AET e as do tipo AEP apenas na AEP. Os arquivos são fonte
            complementar — a IA continua utilizando também o conhecimento técnico e normativo próprio.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.rtf,.odt"
          className="hidden"
          onChange={(e) => enviar(e.target.files)}
        />

        {criando ? (
          <Card className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Tipo de conhecimento *</Label>
                <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as ConhecimentoTipo)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AET">AET</SelectItem>
                    <SelectItem value="AEP">AEP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome da pasta *</Label>
                <Input
                  className="mt-1"
                  placeholder="Ex: Normas Ergonômicas"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCriando(false)}>Cancelar</Button>
              <Button onClick={criarPasta}>Criar pasta</Button>
            </div>
          </Card>
        ) : (
          <Button variant="outline" className="self-start" onClick={() => setCriando(true)}>
            <FolderPlus className="w-4 h-4 mr-1.5" /> Criar pasta
          </Button>
        )}

        <div className="space-y-3">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
          {!isLoading && !pastas.length && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma pasta criada. Crie uma pasta AET ou AEP para começar.
            </p>
          )}

          {pastas.map((p) => {
            const arqs = daPasta(p.id);
            return (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium truncate">{p.nome}</span>
                  <Badge variant="outline" className="text-[10px]">{p.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {arqs.length}/{MAX_ARQUIVOS_POR_PASTA}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="outline" size="sm"
                      disabled={enviando || arqs.length >= MAX_ARQUIVOS_POR_PASTA}
                      onClick={() => abrirUpload(p)}
                    >
                      {enviando && pastaUpload?.id === p.id
                        ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        : <Plus className="w-3.5 h-3.5 mr-1" />}
                      Adicionar arquivo
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => excluirPasta(p)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {!arqs.length && (
                  <p className="text-xs text-muted-foreground">Nenhum arquivo nesta pasta.</p>
                )}

                {arqs.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-md border p-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{a.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Enviado em {fmtData(a.created_at)} · {fmtTam(a.tamanho)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" title="Visualizar" onClick={() => visualizar(a)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Baixar" onClick={() => baixar(a)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Excluir" onClick={() => excluirArquivo(a)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
