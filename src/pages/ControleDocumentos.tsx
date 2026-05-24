import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Building2, FileSignature, Folder, Upload, Download, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { calcStatus, gerarNotificacoes } from "@/lib/notificacoes";

const statusBadge = (s: string | null) => {
  if (s === "vencido") return <Badge className="bg-red-100 text-red-700 border border-red-300">Vencido</Badge>;
  if (s === "proximo") return <Badge className="bg-amber-100 text-amber-700 border border-amber-300">Próx. vencimento</Badge>;
  if (s === "no_prazo") return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">No prazo</Badge>;
  return <Badge variant="outline">—</Badge>;
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

export default function ControleDocumentos() {
  const qc = useQueryClient();
  const [expandedEmp, setExpandedEmp] = useState<Record<string, boolean>>({});
  const [expandedCtr, setExpandedCtr] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("all");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [downloadModal, setDownloadModal] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);

  useRealtimeSync(
    [
      { table: "documentos", queryKey: ["ctrl-docs"] },
      { table: "contratos", queryKey: ["ctrl-contratos"] },
      { table: "empresas", queryKey: ["ctrl-empresas"] },
    ],
    "controle-docs-sync"
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
      // run async, fire-and-forget
      gerarNotificacoes().catch(() => {});
      return data || [];
    },
  });

  const tipos = useMemo(() => Array.from(new Set(documentos.map((d: any) => d.tipo).filter(Boolean))), [documentos]);

  const docsFiltrados = useMemo(() => {
    return (documentos as any[]).filter((d) => {
      if (filtroEmpresa !== "all" && d.empresa_id !== filtroEmpresa) return false;
      if (filtroTipo !== "all" && d.tipo !== filtroTipo) return false;
      const st = calcStatus(d.data_validade);
      if (filtroStatus === "vencido" && st !== "vencido") return false;
      if (filtroStatus === "proximo" && st !== "proximo") return false;
      if (filtroStatus === "no_prazo" && st !== "no_prazo") return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(d.nome_documento || "").toLowerCase().includes(q) &&
          !(d.tipo || "").toLowerCase().includes(q) &&
          !(d.empresa_nome || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [documentos, filtroEmpresa, filtroTipo, filtroStatus, search]);

  const empresasComDocs = useMemo(() => {
    const ids = new Set(docsFiltrados.map((d: any) => d.empresa_id).filter(Boolean));
    return (empresas as any[]).filter((e) => ids.has(e.id));
  }, [empresas, docsFiltrados]);

  const contratosDaEmpresa = (empId: string) => {
    const usados = new Set(docsFiltrados.filter((d: any) => d.empresa_id === empId).map((d: any) => d.contrato_id));
    return (contratos as any[]).filter((c) => c.empresa_id === empId && usados.has(c.id));
  };
  const docsDoContrato = (empId: string, ctrId: string) =>
    docsFiltrados.filter((d: any) => d.empresa_id === empId && d.contrato_id === ctrId);
  const docsSemContrato = (empId: string) =>
    docsFiltrados.filter((d: any) => d.empresa_id === empId && !d.contrato_id);

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
    await supabase.from("documentos").update({ upload_file_path: path }).eq("id", uploadDocId);
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

  const renderTable = (docs: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead>Elaboração</TableHead>
          <TableHead>Validade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((d) => {
          const ctr = (contratos as any[]).find((c) => c.id === d.contrato_id);
          return (
            <TableRow key={d.id}>
              <TableCell><Badge variant="outline" className="font-mono text-[10px]">{d.tipo}</Badge></TableCell>
              <TableCell className="font-medium">{d.nome_documento || `${d.tipo} - ${d.empresa_nome}`}</TableCell>
              <TableCell className="text-sm">{d.empresa_nome}</TableCell>
              <TableCell className="text-sm">{ctr?.numero_contrato || "—"}</TableCell>
              <TableCell className="text-sm">{fmtDate(d.data_elaboracao)}</TableCell>
              <TableCell className="text-sm">{fmtDate(d.data_validade)}</TableCell>
              <TableCell>{statusBadge(calcStatus(d.data_validade))}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUploadClick(d.id)} title="Upload">
                  <Upload className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => setDownloadModal(d)}
                  disabled={!d.file_path && !d.upload_file_path}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <PageHeader
        title="Controle de Documentos"
        description="Organização hierárquica por Empresa › Contrato › Documentos com controle automático de vencimento"
      />

      <div className="glass-card rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, tipo, empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {(empresas as any[]).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {tipos.map((t: any) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="no_prazo">No prazo</SelectItem>
            <SelectItem value="proximo">Próximo do vencimento</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : empresasComDocs.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">Nenhum documento encontrado.</div>
      ) : (
        <div className="space-y-2">
          {empresasComDocs.map((emp: any) => {
            const isOpen = !!expandedEmp[emp.id];
            const ctrs = contratosDaEmpresa(emp.id);
            const semCtr = docsSemContrato(emp.id);
            const total = docsFiltrados.filter((d: any) => d.empresa_id === emp.id).length;
            return (
              <div key={emp.id} className="glass-card rounded-xl overflow-hidden">
                <button onClick={() => setExpandedEmp((p) => ({ ...p, [emp.id]: !p[emp.id] }))}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <span className="font-heading font-semibold text-foreground flex-1 text-left">{emp.nome_fantasia || emp.razao_social}</span>
                  <Badge className="bg-accent/10 text-accent-foreground border-accent/20">{total} docs</Badge>
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-muted/10 p-3 space-y-2">
                    {ctrs.map((c: any) => {
                      const ctrKey = `${emp.id}_${c.id}`;
                      const ctrOpen = !!expandedCtr[ctrKey];
                      const ds = docsDoContrato(emp.id, c.id);
                      return (
                        <div key={c.id} className="bg-card rounded-lg border border-border overflow-hidden">
                          <button onClick={() => setExpandedCtr((p) => ({ ...p, [ctrKey]: !p[ctrKey] }))}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/30">
                            {ctrOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <FileSignature className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm flex-1 text-left">
                              Contrato {c.numero_contrato || "(sem número)"} {c.nome_contratante && <span className="text-muted-foreground">— {c.nome_contratante}</span>}
                            </span>
                            <Badge variant="outline" className="text-[10px]">{ds.length} docs</Badge>
                          </button>
                          {ctrOpen && (
                            <div className="border-t border-border p-3">
                              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                <Folder className="w-3.5 h-3.5" /> Documentos
                              </div>
                              {renderTable(ds)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {semCtr.length > 0 && (
                      <div className="bg-card rounded-lg border border-dashed border-border p-3">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <Folder className="w-3.5 h-3.5" /> Documentos sem contrato vinculado
                        </div>
                        {renderTable(semCtr)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!downloadModal} onOpenChange={() => setDownloadModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Baixar documento</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <button
              disabled={!downloadModal?.file_path}
              onClick={() => handleDownload(downloadModal.file_path, `${downloadModal.tipo}_original`)}
              className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="font-semibold">Documento original emitido pelo sistema</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {downloadModal?.file_path ? "Arquivo gerado pelo SafeDoc" : "Indisponível — documento ainda não foi gerado"}
              </p>
            </button>
            <button
              disabled={!downloadModal?.upload_file_path}
              onClick={() => handleDownload(downloadModal.upload_file_path, `${downloadModal.tipo}_upload`)}
              className="w-full text-left p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="font-semibold">Arquivo enviado via upload</span>
              <p className="text-xs text-muted-foreground mt-0.5">
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
