import { useMemo, useState } from "react";
import {
  Plus, FileText, Loader2, Download, Trash2, Pencil,
  ChevronDown, ChevronRight, Building2, FileSignature, Folder,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// Ordem canônica exibida na árvore.
const TIPO_ORDER = ["LTCAT", "INSALUBRIDADE", "PERICULOSIDADE", "PGR", "PCMSO", "AET"];

const tipoLabel = (t: string) => {
  const up = (t || "").toUpperCase();
  if (up === "INSALUBRIDADE") return "Laudo de Insalubridade";
  if (up === "PERICULOSIDADE") return "Laudo de Periculosidade";
  if (up === "AET") return "AET";
  return up;
};

export default function Documentos() {
  const [open, setOpen] = useState(false);
  const [insalubridadeOpen, setInsalubridadeOpen] = useState(false);
  const [periculosidadeOpen, setPericulosidadeOpen] = useState(false);
  const [pcmsoOpen, setPcmsoOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [expTipo, setExpTipo] = useState<Record<string, boolean>>({});
  const [expEmp, setExpEmp] = useState<Record<string, boolean>>({});
  const [expCtr, setExpCtr] = useState<Record<string, boolean>>({});
  const [toDelete, setToDelete] = useState<any | null>(null);
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

  const empresaNome = (id: string | null) => {
    const e = (empresas as any[]).find((x) => x.id === id);
    return e?.razao_social || e?.nome_fantasia || "(Sem empresa)";
  };
  const contratoNome = (id: string | null) => {
    const c = (contratos as any[]).find((x) => x.id === id);
    if (!c) return "Sem contrato";
    return c.numero_contrato || c.nome_contratante || "Contrato";
  };

  // Filtro por busca (nome, empresa, contrato, tipo).
  const docsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return documentos as any[];
    return (documentos as any[]).filter((d) => {
      const emp = (d.empresa_nome || empresaNome(d.empresa_id)).toLowerCase();
      const ctr = contratoNome(d.contrato_id).toLowerCase();
      const tipo = (d.tipo || "").toLowerCase();
      const nome = (d.nome_documento || "").toLowerCase();
      return emp.includes(q) || ctr.includes(q) || tipo.includes(q) || nome.includes(q);
    });
  }, [documentos, busca, empresas, contratos]);

  // Agrupa Tipo → Empresa → Contrato → [Docs].
  const arvore = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, any[]>>>();
    for (const d of docsFiltrados as any[]) {
      const t = (d.tipo || "").toUpperCase() || "OUTROS";
      const eKey = d.empresa_id || "__sem__";
      const cKey = d.contrato_id || "__sem__";
      if (!map.has(t)) map.set(t, new Map());
      const emps = map.get(t)!;
      if (!emps.has(eKey)) emps.set(eKey, new Map());
      const ctrs = emps.get(eKey)!;
      if (!ctrs.has(cKey)) ctrs.set(cKey, []);
      ctrs.get(cKey)!.push(d);
    }
    const tipos = Array.from(map.keys()).sort((a, b) => {
      const ia = TIPO_ORDER.indexOf(a); const ib = TIPO_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return { map, tipos };
  }, [docsFiltrados]);

  const handleSelectType = (typeId: string) => {
    setOpen(false);
    if (typeId === "ltcat") navigate("/documentos/ltcat/novo");
    else if (typeId === "insalubridade") setTimeout(() => setInsalubridadeOpen(true), 100);
    else if (typeId === "periculosidade") setTimeout(() => setPericulosidadeOpen(true), 100);
    else if (typeId === "aet") navigate("/documentos/aet/novo");
    else if (typeId === "pgr") navigate("/documentos/pgr/novo");
    else if (typeId === "pcmso") setTimeout(() => setPcmsoOpen(true), 100);
  };

  const handleDownload = async (doc: any) => {
    const path = doc.file_path || doc.upload_file_path;
    if (!path) { toast.error("Documento ainda não gerado"); return; }
    const bucket = doc.upload_file_path === path ? "documentos-upload" : "templates";
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.tipo}_${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar documento");
    }
  };

  const handleDelete = async (doc: any) => {
    try {
      if (doc.file_path) {
        await supabase.storage.from("templates").remove([doc.file_path]);
      }
      if (doc.upload_file_path) {
        await supabase.storage.from("documentos-upload").remove([doc.upload_file_path]);
      }
      await supabase.from("documentos").delete().eq("id", doc.id);
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Documento removido");
    } catch {
      toast.error("Erro ao remover documento");
    } finally {
      setToDelete(null);
    }
  };

  const handleEdit = (doc: any) => {
    const tipo = (doc.tipo || "").toUpperCase();
    const map: Record<string, string> = {
      LTCAT: "ltcat", INSALUBRIDADE: "insalubridade", PERICULOSIDADE: "periculosidade",
      AET: "aet", PGR: "pgr", PCMSO: "pcmso",
    };
    const slug = map[tipo];
    if (slug) navigate(`/documentos/${slug}/editar/${doc.id}`);
  };

  const totalPorTipo = (t: string) => {
    let n = 0;
    for (const emps of arvore.map.get(t)?.values() || []) {
      for (const arr of emps.values()) n += arr.length;
    }
    return n;
  };

  return (
    <div>
      <PageHeader
        title="Documentos SST"
        description="Estrutura por Tipo › Empresa › Contrato › Arquivos"
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />Novo Documento
          </Button>
        }
      />

      <div className="glass-card rounded-xl p-3 mb-4">
        <Input
          placeholder="Buscar por tipo, empresa, contrato ou nome do documento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : arvore.tipos.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {(documentos as any[]).length === 0
              ? "Nenhum documento gerado ainda"
              : "Nenhum documento encontrado para essa busca"}
          </p>
          {(documentos as any[]).length === 0 && (
            <Button onClick={() => setOpen(true)} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />Criar Documento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {arvore.tipos.map((t) => {
            const emps = arvore.map.get(t)!;
            const isOpen = expTipo[t] ?? true;
            return (
              <div key={t} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpTipo((p) => ({ ...p, [t]: !isOpen }))}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <FileText className="w-5 h-5 text-accent" />
                  <span className="font-heading font-semibold text-foreground flex-1 text-left">
                    {tipoLabel(t)}
                  </span>
                  <Badge className="bg-accent/10 text-accent-foreground border-accent/20">
                    {totalPorTipo(t)} docs
                  </Badge>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/10 p-3 space-y-2">
                    {Array.from(emps.entries())
                      .sort(([, a], [, b]) => {
                        const ea = Array.from(a.values())[0]?.[0];
                        const eb = Array.from(b.values())[0]?.[0];
                        return (ea?.empresa_nome || "").localeCompare(eb?.empresa_nome || "");
                      })
                      .map(([empId, ctrs]) => {
                        const empKey = `${t}_${empId}`;
                        const empOpen = expEmp[empKey] ?? false;
                        const firstDoc = Array.from(ctrs.values())[0]?.[0];
                        const empNome = firstDoc?.empresa_nome || empresaNome(empId);
                        const totalEmp = Array.from(ctrs.values()).reduce((s, arr) => s + arr.length, 0);
                        return (
                          <div key={empId} className="bg-card rounded-lg border border-border overflow-hidden">
                            <button
                              onClick={() => setExpEmp((p) => ({ ...p, [empKey]: !empOpen }))}
                              className="w-full flex items-center gap-3 p-3 hover:bg-muted/30"
                            >
                              {empOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm flex-1 text-left">{empNome}</span>
                              <Badge variant="outline" className="text-[10px]">{totalEmp} docs</Badge>
                            </button>

                            {empOpen && (
                              <div className="border-t border-border p-2 space-y-2">
                                {Array.from(ctrs.entries())
                                  .sort(([a], [b]) => contratoNome(a).localeCompare(contratoNome(b)))
                                  .map(([ctrId, docs]) => {
                                    const ctrKey = `${empKey}_${ctrId}`;
                                    const ctrOpen = expCtr[ctrKey] ?? false;
                                    const cNome = ctrId === "__sem__" ? "Sem contrato vinculado" : contratoNome(ctrId);
                                    return (
                                      <div key={ctrId} className="bg-background/60 rounded-md border border-border/70">
                                        <button
                                          onClick={() => setExpCtr((p) => ({ ...p, [ctrKey]: !ctrOpen }))}
                                          className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/30"
                                        >
                                          {ctrOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                          <FileSignature className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="text-sm flex-1 text-left">Contrato {cNome}</span>
                                          <Badge variant="outline" className="text-[10px]">{docs.length}</Badge>
                                        </button>

                                        {ctrOpen && (
                                          <div className="border-t border-border/70 p-2 space-y-1">
                                            {docs.map((d: any) => (
                                              <div
                                                key={d.id}
                                                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/40 group"
                                              >
                                                <Folder className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-sm font-medium truncate">
                                                    {d.nome_documento || `${d.tipo} — ${d.empresa_nome || ""}`}
                                                  </div>
                                                  <div className="text-[11px] text-muted-foreground">
                                                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                                                    {d.status === "rascunho" && (
                                                      <Badge className="ml-2 bg-amber-100 text-amber-700 border border-amber-300 text-[9px] py-0 px-1.5">
                                                        Rascunho
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                  <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    title="Download"
                                                    disabled={!d.file_path && !d.upload_file_path}
                                                    onClick={() => handleDownload(d)}
                                                  >
                                                    <Download className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    title="Editar"
                                                    onClick={() => handleEdit(d)}
                                                  >
                                                    <Pencil className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    title="Excluir"
                                                    onClick={() => setToDelete(d)}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
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

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento
              {toDelete?.nome_documento ? ` "${toDelete.nome_documento}"` : ""} e
              seus arquivos serão removidos definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && handleDelete(toDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InsalubridadeStartModal open={insalubridadeOpen} onOpenChange={setInsalubridadeOpen} />
      <PericulosidadeStartModal open={periculosidadeOpen} onOpenChange={setPericulosidadeOpen} />
      <PcmsoStartModal open={pcmsoOpen} onOpenChange={setPcmsoOpen} />
    </div>
  );
}
