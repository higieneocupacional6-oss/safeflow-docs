import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { todayDateOnly } from "@/lib/dateOnly";
import {
  criarPortalLink,
  formatBytes,
  invalidarPortalLink,
  resolvePublicPortalUrl,
  uploadPortalArquivoEmPartes,
  type PortalUploadProgress,
} from "@/lib/portalClientes";

type LinkRow = {
  id: string;
  token: string;
  empresa_id: string;
  data_referencia: string | null;
  observacoes: string | null;
  created_at: string;
  retained_until: string;
  ativo: boolean;
  empresas?: { razao_social: string; nome_fantasia: string | null } | null;
  portal_clientes_arquivos?: Array<{
    id: string;
    contrato_id: string;
    nome_original: string;
    contratos?: { numero_contrato: string | null; nome_contratante: string | null } | null;
  }>;
};

export default function PortalClientes() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [gerarOpen, setGerarOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [dataRef, setDataRef] = useState(todayDateOnly());
  const [observacoes, setObservacoes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [gerando, setGerando] = useState(false);
  const [progressos, setProgressos] = useState<PortalUploadProgress[]>([]);
  const [resultado, setResultado] = useState<{ token: string; url: string } | null>(null);
  const [invalidando, setInvalidando] = useState<string | null>(null);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratos = [], isLoading: loadingCtr } = useQuery({
    queryKey: ["portal-contratos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["portal-clientes-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_clientes_links")
        .select(
          "id, token, empresa_id, data_referencia, observacoes, created_at, retained_until, ativo, empresas(razao_social, nome_fantasia), portal_clientes_arquivos(id, contrato_id, nome_original, contratos(numero_contrato, nome_contratante))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LinkRow[];
    },
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) => {
      const emp = (l.empresas?.nome_fantasia || l.empresas?.razao_social || "").toLowerCase();
      const ctrs = (l.portal_clientes_arquivos || [])
        .map((a) => `${a.contratos?.numero_contrato || ""} ${a.contratos?.nome_contratante || ""}`.toLowerCase())
        .join(" ");
      const data = new Date(l.created_at).toLocaleString("pt-BR").toLowerCase();
      const dataRefStr = (l.data_referencia || "").toLowerCase();
      return emp.includes(q) || ctrs.includes(q) || data.includes(q) || dataRefStr.includes(q) || l.token.includes(q);
    });
  }, [links, busca]);

  const resetModal = () => {
    setEmpresaId("");
    setContratoId("");
    setDataRef(todayDateOnly());
    setObservacoes("");
    setFiles([]);
    setProgressos([]);
    setGerando(false);
  };

  const copiar = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const gerar = async () => {
    if (!empresaId) {
      toast.error("Selecione a empresa.");
      return;
    }
    if (!contratoId) {
      toast.error("Selecione o contrato.");
      return;
    }
    if (!files.length) {
      toast.error("Adicione ao menos um arquivo.");
      return;
    }
    setGerando(true);
    setProgressos(files.map((f) => ({
      fileName: f.name,
      loaded: 0,
      total: f.size || 1,
      percent: 0,
      status: "pending",
    })));
    try {
      const link = await criarPortalLink({
        empresaId,
        dataReferencia: dataRef || null,
        observacoes: observacoes.trim() || null,
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadPortalArquivoEmPartes({
          file,
          linkId: link.id,
          contratoId,
          onProgress: (p) => {
            setProgressos((prev) => prev.map((row, idx) => (idx === i ? p : row)));
          },
        });
      }

      const url = await resolvePublicPortalUrl(link.token);
      setResultado({ token: link.token, url });
      setGerarOpen(false);
      resetModal();
      void qc.invalidateQueries({ queryKey: ["portal-clientes-links"] });
      toast.success("Portal gerado com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o portal.");
    } finally {
      setGerando(false);
    }
  };

  const progressoGeral = progressos.length
    ? Math.round(progressos.reduce((s, p) => s + p.percent, 0) / progressos.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Clientes"
        description="Links permanentes para compartilhar documentos com cada empresa"
        actions={
          <Button onClick={() => { resetModal(); setGerarOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Gerar Link
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por empresa, contrato ou data…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="portal-surface overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum link gerado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead>Link curto</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((l) => {
                const emp = l.empresas?.nome_fantasia || l.empresas?.razao_social || "—";
                const ctrLabels = [
                  ...new Set(
                    (l.portal_clientes_arquivos || []).map((a) =>
                      a.contratos?.numero_contrato
                        || a.contratos?.nome_contratante
                        || "Contrato",
                    ),
                  ),
                ];
                const shortPath = `/p/${l.token}`;
                return (
                  <TableRow key={l.id} className={!l.ativo ? "opacity-60" : undefined}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/portal-clientes/link/${l.id}`}
                        className="text-primary hover:underline"
                      >
                        {emp}
                      </Link>
                      {!l.ativo && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">Inválido</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ctrLabels.length ? ctrLabels.join(", ") : "—"}
                      <div className="text-[11px]">
                        {(l.portal_clientes_arquivos || []).length} arquivo(s)
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{shortPath}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Copiar link"
                          disabled={!l.ativo}
                          onClick={async () => {
                            const url = await resolvePublicPortalUrl(l.token);
                            await copiar(url);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Invalidar link"
                          disabled={!l.ativo || invalidando === l.id}
                          onClick={async () => {
                            if (!confirm("Invalidar este link? Quem acessar não verá mais os documentos.")) {
                              return;
                            }
                            setInvalidando(l.id);
                            try {
                              await invalidarPortalLink(l.id);
                              toast.success("Link invalidado.");
                              void qc.invalidateQueries({ queryKey: ["portal-clientes-links"] });
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Falha ao invalidar.");
                            } finally {
                              setInvalidando(null);
                            }
                          }}
                        >
                          {invalidando === l.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={gerarOpen} onOpenChange={(v) => { if (!gerando) { setGerarOpen(v); if (!v) resetModal(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Gerar Link — Portal Clientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select
                value={empresaId || undefined}
                onValueChange={(v) => { setEmpresaId(v); setContratoId(""); }}
                disabled={gerando}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contrato</Label>
              <Select
                value={contratoId || undefined}
                onValueChange={setContratoId}
                disabled={!empresaId || gerando || loadingCtr}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!empresaId ? "Selecione a empresa" : loadingCtr ? "Carregando…" : "Selecione o contrato"} />
                </SelectTrigger>
                <SelectContent>
                  {contratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero_contrato || "(sem número)"}
                      {c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} disabled={gerando} />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={gerando}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Arquivos</Label>
              <Input
                type="file"
                multiple
                disabled={gerando}
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 && (
                <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {files.map((f) => (
                    <li key={`${f.name}-${f.size}`}>{f.name} · {formatBytes(f.size)}</li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground">
                Sem limite artificial de quantidade ou tamanho. Envio em partes com retomada automática.
              </p>
            </div>
            {gerando && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Enviando arquivos…</span>
                  <Badge variant="secondary">{progressoGeral}%</Badge>
                </div>
                <Progress value={progressoGeral} />
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {progressos.map((p) => (
                    <li key={p.fileName}>
                      {p.fileName}: {p.status === "done" ? "concluído" : p.status === "error" ? p.error : `${p.percent}%`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={gerando} onClick={() => setGerarOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={gerando} onClick={() => void gerar()}>
              {gerando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Link2 className="mr-1.5 h-4 w-4" />}
              Gerar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultado} onOpenChange={(v) => { if (!v) setResultado(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Link gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Link permanente e exclusivo desta empresa. Copie e compartilhe com o cliente.
            </p>
            <code className="block break-all rounded-lg bg-muted p-3 text-xs">{resultado?.url}</code>
            <p className="text-[11px] text-muted-foreground">
              Use o link em <strong>http://</strong> na rede local (sem HTTPS). Em outro PC/celular da mesma rede, abra exatamente esse endereço.
            </p>
            <Button type="button" className="w-full" onClick={() => resultado && void copiar(resultado.url)}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar link
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setResultado(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
