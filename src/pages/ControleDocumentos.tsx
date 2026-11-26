import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Loader2, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useAuth } from "@/hooks/useAuth";
import { formatDateOnly, normalizeDateOnly, todayDateOnly } from "@/lib/dateOnly";
import {
  TIPOS_CADASTRO_MANUAL,
  TIPOS_CONTROLE_VENCIMENTO,
  calcularDataValidade,
  entraNoControleVencimento,
  labelTipoDocumento,
  statusVencimentoDocumento,
  validadeEfetiva,
  type DocumentoVencimentoLike,
  type TipoControleVencimento,
} from "@/lib/documentoValidade";
import {
  empresaSemContrato,
  contratoIdPersistivel,
} from "@/lib/empresaEscopo";
import type { StatusDoc } from "@/lib/notificacoes";

const statusBadge = (s: StatusDoc | null) => {
  if (s === "vencido") {
    return <Badge className="border border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">Vencido</Badge>;
  }
  if (s === "proximo") {
    return <Badge className="border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">A vencer</Badge>;
  }
  if (s === "no_prazo") {
    return <Badge className="border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">No prazo</Badge>;
  }
  return <Badge variant="outline">—</Badge>;
};

const fmtDate = (d: string | null | undefined) => (d ? formatDateOnly(d) : "—");

type DocRow = DocumentoVencimentoLike & Record<string, any>;

export default function ControleDocumentos() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [downloadModal, setDownloadModal] = useState<DocRow | null>(null);
  const [detalheModal, setDetalheModal] = useState<DocRow | null>(null);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);

  const [cadEmpresaId, setCadEmpresaId] = useState("");
  const [cadContratoId, setCadContratoId] = useState("");
  const [cadTipo, setCadTipo] = useState<TipoControleVencimento>("LTCAT");
  const [cadElaboracao, setCadElaboracao] = useState(todayDateOnly());

  useRealtimeSync(
    [
      { table: "documentos", queryKey: ["ctrl-docs"] },
      { table: "documentos", queryKey: ["docs-vencimento-alert"] },
      { table: "contratos", queryKey: ["ctrl-contratos"] },
      { table: "empresas", queryKey: ["ctrl-empresas"] },
    ],
    "controle-docs-sync",
  );

  const { data: empresas = [] } = useQuery({
    queryKey: ["ctrl-empresas"],
    queryFn: async () => (await supabase.from("empresas").select("*").order("razao_social")).data || [],
  });
  const { data: contratos = [] } = useQuery({
    queryKey: ["ctrl-contratos"],
    queryFn: async () => (await supabase.from("contratos").select("*")).data || [],
  });
  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["ctrl-docs"],
    queryFn: async () => {
      const { data } = await supabase.from("documentos").select("*").order("created_at", { ascending: false });
      return (data || []) as DocRow[];
    },
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["ctrl-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, nome, email")).data || [],
  });

  const empresaCadAtual = (empresas as DocRow[]).find((e) => e.id === cadEmpresaId);
  const independenteCad = empresaSemContrato(
    empresaCadAtual
      ? { id: String(empresaCadAtual.id || ""), sem_contrato: !!empresaCadAtual.sem_contrato }
      : null,
  );

  const contratosDaEmpresaCad = useMemo(
    () => (contratos as DocRow[]).filter((c) => c.empresa_id === cadEmpresaId),
    [contratos, cadEmpresaId],
  );

  const validadePreview = useMemo(
    () => calcularDataValidade(cadTipo, cadElaboracao),
    [cadTipo, cadElaboracao],
  );

  const docsControle = useMemo(() => {
    return documentos.filter((d) => entraNoControleVencimento(d));
  }, [documentos]);

  const docsFiltrados = useMemo(() => {
    return docsControle.filter((d) => {
      if (filtroEmpresa !== "all" && d.empresa_id !== filtroEmpresa) return false;
      if (filtroTipo !== "all" && d.tipo !== filtroTipo) return false;
      const st = statusVencimentoDocumento(d);
      if (filtroStatus !== "all" && st !== filtroStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const ctr = (contratos as DocRow[]).find((c) => c.id === d.contrato_id);
        const hay = [
          d.nome_documento,
          d.tipo,
          labelTipoDocumento(d.tipo),
          d.empresa_nome,
          ctr?.numero_contrato,
          ctr?.nome_contratante,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [docsControle, filtroEmpresa, filtroTipo, filtroStatus, search, contratos]);

  const docsOrdenados = useMemo(() => {
    const rank = (s: StatusDoc | null) => (s === "vencido" ? 0 : s === "proximo" ? 1 : 2);
    return [...docsFiltrados].sort((a, b) => {
      const ra = rank(statusVencimentoDocumento(a));
      const rb = rank(statusVencimentoDocumento(b));
      if (ra !== rb) return ra - rb;
      const va = validadeEfetiva(a) || "";
      const vb = validadeEfetiva(b) || "";
      return va.localeCompare(vb);
    });
  }, [docsFiltrados]);

  const tiposFiltro = useMemo(
    () => Array.from(new Set(docsControle.map((d) => d.tipo).filter(Boolean))) as string[],
    [docsControle],
  );

  const nomeResponsavel = (userId?: string | null) => {
    if (!userId) return "—";
    const p = (profiles as DocRow[]).find((x) => x.user_id === userId);
    return p?.nome || p?.email || userId;
  };

  const handleUploadClick = (docId: string) => {
    setUploadDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadDocId) return;
    const path = `${uploadDocId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documentos-upload").upload(path, file, { upsert: true });
    if (error) return toast.error("Erro no upload: " + error.message);
    const { error: upErr } = await supabase
      .from("documentos")
      .update({ upload_file_path: path, last_modified_by: user?.id || null })
      .eq("id", uploadDocId);
    if (upErr) return toast.error("Falha ao vincular arquivo: " + upErr.message);
    toast.success("Arquivo anexado");
    qc.invalidateQueries({ queryKey: ["ctrl-docs"] });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadDocId(null);
  };

  const handleDownload = async (path: string, label: string) => {
    const bucket = path === downloadModal?.upload_file_path ? "documentos-upload" : "templates";
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) return toast.error("Erro ao baixar");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}_${Date.now()}`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadModal(null);
  };

  const resetCadastro = () => {
    setCadEmpresaId("");
    setCadContratoId("");
    setCadTipo("LTCAT");
    setCadElaboracao(todayDateOnly());
  };

  const salvarCadastroManual = async () => {
    const empresa = (empresas as DocRow[]).find((e) => e.id === cadEmpresaId);
    const contrato = (contratos as DocRow[]).find((c) => c.id === cadContratoId);
    const elaboracao = normalizeDateOnly(cadElaboracao);
    if (!empresa) return toast.error("Selecione a empresa.");
    if (!independenteCad && !contrato) return toast.error("Selecione o contrato.");
    if (!elaboracao) return toast.error("Informe a data de elaboração.");
    if (!TIPOS_CONTROLE_VENCIMENTO.includes(cadTipo)) return toast.error("Tipo de documento inválido.");

    const validade = calcularDataValidade(cadTipo, elaboracao);
    if (!validade) return toast.error("Não foi possível calcular a validade.");

    setSaving(true);
    try {
      const contratoIdCad = contratoIdPersistivel(cadContratoId);
      let dupQuery = (supabase as any)
        .from("documentos")
        .select("id")
        .eq("empresa_id", cadEmpresaId)
        .eq("tipo", cadTipo)
        .eq("data_elaboracao", elaboracao);
      if (independenteCad) dupQuery = dupQuery.is("contrato_id", null);
      else dupQuery = dupQuery.eq("contrato_id", cadContratoId);
      const { data: existentes, error: dupErr } = await dupQuery.limit(1);
      if (dupErr) throw dupErr;
      if ((existentes || []).length > 0) {
        toast.error("Já existe documento com a mesma empresa, contrato, tipo e data de elaboração.");
        return;
      }

      const empresaNome = empresa.nome_fantasia || empresa.razao_social || "";
      const payload = {
        tipo: cadTipo,
        empresa_id: cadEmpresaId,
        contrato_id: contratoIdCad,
        empresa_nome: empresaNome,
        nome_documento: `${labelTipoDocumento(cadTipo)} — ${empresaNome}`,
        data_elaboracao: elaboracao,
        data_validade: validade,
        status: "manual",
        draft_snapshot: { origem: "manual" },
        last_modified_by: user?.id || null,
        current_step: 0,
      };

      const { error } = await supabase.from("documentos").insert(payload);
      if (error) throw error;

      toast.success("Documento cadastrado no controle de vencimentos.");
      setCadastroOpen(false);
      resetCadastro();
      qc.invalidateQueries({ queryKey: ["ctrl-docs"] });
      qc.invalidateQueries({ queryKey: ["docs-vencimento-alert"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao cadastrar documento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Controle de Documentos"
        description="Acompanhe vencimentos, cadastre documentos externos e gerencie anexos"
      />

      <Tabs defaultValue="vencidos" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
          </TabsList>
          <Button onClick={() => setCadastroOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Cadastro
          </Button>
        </div>

        <TabsContent value="vencidos" className="space-y-4">
          <div className="glass-card mb-0 grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contrato, tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
              <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {(empresas as DocRow[]).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposFiltro.map((t) => (
                  <SelectItem key={t} value={t}>{labelTipoDocumento(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="no_prazo">No prazo</SelectItem>
                <SelectItem value="proximo">A vencer</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => void handleFileChange(e)} />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docsOrdenados.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
              Nenhum documento no controle de vencimentos.
            </div>
          ) : (
            <div className="portal-surface overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Tipo de documento</TableHead>
                    <TableHead>Data de elaboração</TableHead>
                    <TableHead>Data de vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docsOrdenados.map((d) => {
                    const ctr = (contratos as DocRow[]).find((c) => c.id === d.contrato_id);
                    const st = statusVencimentoDocumento(d);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.empresa_nome || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {ctr?.numero_contrato || "—"}
                          {ctr?.nome_contratante ? (
                            <span className="block text-xs text-muted-foreground">{ctr.nome_contratante}</span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{labelTipoDocumento(d.tipo)}</span>
                            {d.status === "manual" && (
                              <Badge variant="outline" className="w-fit text-[10px]">Manual</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{fmtDate(d.data_elaboracao)}</TableCell>
                        <TableCell className="text-sm">{fmtDate(validadeEfetiva(d))}</TableCell>
                        <TableCell>{statusBadge(st)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Detalhes"
                              onClick={() => setDetalheModal(d)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Upload"
                              onClick={() => handleUploadClick(d.id)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Download"
                              disabled={!d.file_path && !d.upload_file_path}
                              onClick={() => setDownloadModal(d)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detalhes */}
      <Dialog open={!!detalheModal} onOpenChange={(o) => !o && setDetalheModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do documento</DialogTitle>
          </DialogHeader>
          {detalheModal && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-medium">{detalheModal.empresa_nome || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contrato</p>
                  <p className="font-medium">
                    {(contratos as DocRow[]).find((c) => c.id === detalheModal.contrato_id)?.numero_contrato || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{labelTipoDocumento(detalheModal.tipo)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="font-medium">{detalheModal.status === "manual" ? "Cadastro manual" : "Gerado no SegDoc"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Elaboração</p>
                  <p className="font-medium">{fmtDate(detalheModal.data_elaboracao)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{fmtDate(validadeEfetiva(detalheModal))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-0.5">{statusBadge(statusVencimentoDocumento(detalheModal))}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="font-medium">{nomeResponsavel(detalheModal.last_modified_by)}</p>
                </div>
              </div>
              {detalheModal.nome_documento && (
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{detalheModal.nome_documento}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <p>Criado em: {fmtDate(detalheModal.created_at?.slice?.(0, 10) || detalheModal.created_at)}</p>
                <p>Atualizado: {fmtDate(detalheModal.updated_at?.slice?.(0, 10) || detalheModal.updated_at)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalheModal(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadastro manual */}
      <Dialog
        open={cadastroOpen}
        onOpenChange={(o) => {
          setCadastroOpen(o);
          if (!o) resetCadastro();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro de documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={cadEmpresaId || undefined}
                onValueChange={(v) => {
                  setCadEmpresaId(v);
                  setCadContratoId("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {(empresas as DocRow[]).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cadEmpresaId && independenteCad ? (
              <p className="text-sm text-muted-foreground">Empresa independente — sem seleção de contrato.</p>
            ) : (
              <div className="space-y-2">
                <Label>Contrato</Label>
                <Select
                  value={cadContratoId || undefined}
                  onValueChange={setCadContratoId}
                  disabled={!cadEmpresaId}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
                  <SelectContent>
                    {contratosDaEmpresaCad.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.numero_contrato || "(sem número)"}
                        {c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select value={cadTipo} onValueChange={(v) => setCadTipo(v as TipoControleVencimento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CADASTRO_MANUAL.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-elaboracao">Data de elaboração</Label>
              <Input
                id="data-elaboracao"
                type="date"
                value={cadElaboracao}
                onChange={(e) => setCadElaboracao(e.target.value)}
              />
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Data de vencimento (automática)</p>
              <p className="font-semibold text-foreground">{fmtDate(validadePreview)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCadastroOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={() => void salvarCadastroManual()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download */}
      <Dialog open={!!downloadModal} onOpenChange={() => setDownloadModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Baixar documento</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <button
              type="button"
              disabled={!downloadModal?.file_path}
              onClick={() => handleDownload(downloadModal!.file_path, `${downloadModal!.tipo}_original`)}
              className="w-full rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-semibold">Documento original emitido pelo sistema</span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {downloadModal?.file_path ? "Arquivo gerado pelo SegDoc" : "Indisponível — documento ainda não foi gerado"}
              </p>
            </button>
            <button
              type="button"
              disabled={!downloadModal?.upload_file_path}
              onClick={() => handleDownload(downloadModal!.upload_file_path, `${downloadModal!.tipo}_upload`)}
              className="w-full rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-semibold">Arquivo enviado via upload</span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {downloadModal?.upload_file_path ? "Arquivo anexado manualmente" : "Indisponível — nenhum arquivo foi enviado"}
              </p>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadModal(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
