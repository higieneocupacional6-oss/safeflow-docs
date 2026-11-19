import { useMemo, useState } from "react";
import {
  Plus, FileText, Loader2, Download, Trash2, Pencil, ArrowLeft, Search,
  ClipboardList, Shield, HeartPulse, Flame, Activity, Boxes, Wrench, AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InsalubridadeStartModal } from "@/components/InsalubridadeStartModal";
import { PericulosidadeStartModal } from "@/components/PericulosidadeStartModal";
import { PcmsoStartModal } from "@/components/PcmsoStartModal";
import { AprErgoExcluirModal } from "@/components/AprErgoExcluirModal";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { formatDateOnly } from "@/lib/dateOnly";

type DocTypeMeta = {
  id: string;
  tipo: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

const DOC_TYPES: DocTypeMeta[] = [
  { id: "ltcat", tipo: "LTCAT", label: "LTCAT", desc: "Laudo Técnico das Condições Ambientais de Trabalho", icon: ClipboardList },
  { id: "pgr", tipo: "PGR", label: "PGR", desc: "Programa de Gerenciamento de Riscos", icon: Shield },
  { id: "pcmso", tipo: "PCMSO", label: "PCMSO", desc: "Programa de Controle Médico de Saúde Ocupacional", icon: HeartPulse },
  { id: "insalubridade", tipo: "INSALUBRIDADE", label: "Insalubridade", desc: "Laudo de Insalubridade", icon: AlertTriangle },
  { id: "periculosidade", tipo: "PERICULOSIDADE", label: "Periculosidade", desc: "Laudo de Periculosidade", icon: Flame },
  { id: "aet", tipo: "AET", label: "AET", desc: "Análise Ergonômica do Trabalho", icon: Activity },
  { id: "aet-vale", tipo: "AET-VALE", label: "AET (VALE)", desc: "Análise Ergonômica do Trabalho (VALE)", icon: Boxes },
  { id: "aep", tipo: "AEP", label: "AEP", desc: "Análise Ergonômica Preliminar", icon: FileText },
  { id: "apr-ergo", tipo: "APR-ERGO", label: "APR-ERGO", desc: "Análise Preliminar de Riscos Ergonômicos", icon: Wrench },
];

const TIPO_ORDER = DOC_TYPES.map((d) => d.tipo);

const tipoLabel = (t: string) => {
  const up = (t || "").toUpperCase();
  const known = DOC_TYPES.find((d) => d.tipo === up);
  if (known) return known.label;
  if (up === "INSALUBRIDADE") return "Insalubridade";
  if (up === "PERICULOSIDADE") return "Periculosidade";
  return up || "Outros";
};

const iconForTipo = (t: string): LucideIcon => {
  const up = (t || "").toUpperCase();
  return DOC_TYPES.find((d) => d.tipo === up)?.icon || FileText;
};

export default function Documentos() {
  const [open, setOpen] = useState(false);
  const [insalubridadeOpen, setInsalubridadeOpen] = useState(false);
  const [periculosidadeOpen, setPericulosidadeOpen] = useState(false);
  const [pcmsoOpen, setPcmsoOpen] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [aprExcluir, setAprExcluir] = useState<any | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useRealtimeSync(
    [
      { table: "documentos", queryKey: ["documentos"] },
      { table: "aet_documentos", queryKey: ["documentos"] },
      { table: "aep_documentos", queryKey: ["documentos"] },
      { table: "contratos", queryKey: ["contratos-doc"] },
      { table: "empresas", queryKey: ["empresas-doc"] },
    ],
    "documentos-list-sync",
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
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia, cnpj")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos-doc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, empresa_id, numero_contrato, nome_contratante");
      if (error) throw error;
      return data;
    },
  });

  const empresaById = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of empresas as any[]) map.set(e.id, e);
    return map;
  }, [empresas]);

  const contratoById = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of contratos as any[]) map.set(c.id, c);
    return map;
  }, [contratos]);

  const empresaNome = (id: string | null) => {
    const e = id ? empresaById.get(id) : null;
    return e?.nome_fantasia || e?.razao_social || "(Sem empresa)";
  };
  const empresaCnpj = (id: string | null) => {
    const e = id ? empresaById.get(id) : null;
    return e?.cnpj || "—";
  };
  const contratoNome = (id: string | null) => {
    if (!id) return "Sem contrato";
    const c = contratoById.get(id);
    if (!c) return "Sem contrato";
    return c.numero_contrato || c.nome_contratante || "Contrato";
  };
  const dataElaboracao = (d: any) =>
    formatDateOnly(d.data_elaboracao) || formatDateOnly(d.created_at?.slice?.(0, 10)) || "—";

  const contagemPorTipo = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of documentos as any[]) {
      const t = (d.tipo || "").toUpperCase() || "OUTROS";
      map.set(t, (map.get(t) || 0) + 1);
    }
    return map;
  }, [documentos]);

  const tiposExtras = useMemo(() => {
    const known = new Set(TIPO_ORDER);
    return [...contagemPorTipo.keys()]
      .filter((t) => !known.has(t))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [contagemPorTipo]);

  const docsDoTipo = useMemo(() => {
    if (!tipoSelecionado) return [];
    const q = busca.trim().toLowerCase();
    return (documentos as any[])
      .filter((d) => ((d.tipo || "").toUpperCase() || "OUTROS") === tipoSelecionado)
      .filter((d) => {
        if (!q) return true;
        const emp = (d.empresa_nome || empresaNome(d.empresa_id)).toLowerCase();
        const cnpj = empresaCnpj(d.empresa_id).toLowerCase();
        const ctr = contratoNome(d.contrato_id).toLowerCase();
        const data = dataElaboracao(d).toLowerCase();
        const nome = (d.nome_documento || "").toLowerCase();
        return (
          emp.includes(q)
          || cnpj.includes(q)
          || ctr.includes(q)
          || data.includes(q)
          || nome.includes(q)
        );
      })
      .sort((a, b) => {
        const da = String(a.data_elaboracao || a.created_at || "");
        const db = String(b.data_elaboracao || b.created_at || "");
        return db.localeCompare(da);
      });
  }, [documentos, tipoSelecionado, busca, empresas, contratos]);

  const handleSelectType = (typeId: string) => {
    setOpen(false);
    if (typeId === "ltcat") navigate("/documentos/ltcat/novo");
    else if (typeId === "insalubridade") setTimeout(() => setInsalubridadeOpen(true), 100);
    else if (typeId === "periculosidade") setTimeout(() => setPericulosidadeOpen(true), 100);
    else if (typeId === "aet") navigate("/documentos/aet/novo");
    else if (typeId === "aet-vale") navigate("/documentos/aet-vale");
    else if (typeId === "aep") navigate("/documentos/aep/novo");
    else if (typeId === "apr-ergo") navigate("/documentos/apr-ergo");
    else if (typeId === "pgr") navigate("/documentos/pgr/novo");
    else if (typeId === "pcmso") setTimeout(() => setPcmsoOpen(true), 100);
  };

  const handleDownload = async (doc: any) => {
    const path = doc.file_path || doc.upload_file_path;
    if (!path) {
      toast.error("Documento ainda não gerado");
      return;
    }
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

  const pedirExclusao = (doc: any) => {
    if ((doc.tipo || "").toUpperCase() === "APR-ERGO" && doc.empresa_id && doc.contrato_id) {
      setAprExcluir(doc);
      return;
    }
    setToDelete(doc);
  };

  const handleEdit = (doc: any) => {
    const tipo = (doc.tipo || "").toUpperCase();
    const map: Record<string, string> = {
      LTCAT: "ltcat",
      INSALUBRIDADE: "insalubridade",
      PERICULOSIDADE: "periculosidade",
      AET: "aet",
      AEP: "aep",
      PGR: "pgr",
      PCMSO: "pcmso",
      "APR-ERGO": "apr-ergo",
    };
    if (tipo === "AET-VALE") {
      navigate(`/documentos/aet-vale/registro/${doc.id}`);
      return;
    }
    const slug = map[tipo];
    if (slug) navigate(`/documentos/${slug}/editar/${doc.id}`);
  };

  const cardsTipos: Array<{ tipo: string; label: string; desc: string; icon: LucideIcon; count: number; createId?: string }> = [
    ...DOC_TYPES.map((dt) => ({
      tipo: dt.tipo,
      label: dt.label,
      desc: dt.desc,
      icon: dt.icon,
      count: contagemPorTipo.get(dt.tipo) || 0,
      createId: dt.id,
    })),
    ...tiposExtras.map((t) => ({
      tipo: t,
      label: tipoLabel(t),
      desc: "Documentos deste tipo",
      icon: FileText,
      count: contagemPorTipo.get(t) || 0,
    })),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documentos SST"
        description={
          tipoSelecionado
            ? `Lista de ${tipoLabel(tipoSelecionado)}`
            : "Selecione um tipo de documento para visualizar os registros"
        }
        actions={
          <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Documento
          </Button>
        }
      />

      {!tipoSelecionado ? (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cardsTipos.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.tipo}
                    type="button"
                    onClick={() => {
                      setBusca("");
                      setTipoSelecionado(card.tipo);
                    }}
                    className="portal-surface group flex h-full flex-col gap-3 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary">{card.count}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
                        {card.label}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && (documentos as any[]).length === 0 && (
            <div className="portal-surface p-10 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum documento gerado ainda</p>
              <Button onClick={() => setOpen(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Criar Documento
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTipoSelecionado(null);
                setBusca("");
              }}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Tipos de documento
            </Button>
            <Badge variant="outline" className="gap-1">
              {(() => {
                const Icon = iconForTipo(tipoSelecionado);
                return <Icon className="h-3.5 w-3.5" />;
              })()}
              {tipoLabel(tipoSelecionado)}
            </Badge>
            <Badge variant="secondary">{docsDoTipo.length} registro(s)</Badge>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por CNPJ, empresa, contrato ou data de elaboração…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docsDoTipo.length === 0 ? (
            <div className="portal-surface p-10 text-center text-sm text-muted-foreground">
              {(documentos as any[]).some((d) => ((d.tipo || "").toUpperCase() || "OUTROS") === tipoSelecionado)
                ? "Nenhum documento encontrado para essa busca."
                : "Nenhum documento deste tipo ainda."}
            </div>
          ) : (
            <div className="portal-surface overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Data de Elaboração</TableHead>
                    <TableHead className="w-[130px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docsDoTipo.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {empresaCnpj(d.empresa_id)}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="font-medium">
                          {d.empresa_nome || empresaNome(d.empresa_id)}
                        </div>
                        {d.nome_documento && (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {d.nome_documento}
                          </div>
                        )}
                        {d.status === "rascunho" && (
                          <Badge className="mt-1 border border-amber-300 bg-amber-100 text-[9px] text-amber-700">
                            Rascunho
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.contrato_id ? contratoNome(d.contrato_id) : "Sem contrato"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {dataElaboracao(d)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => handleEdit(d)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Excluir"
                            onClick={() => pedirExclusao(d)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Baixar"
                            disabled={!d.file_path && !d.upload_file_path}
                            onClick={() => void handleDownload(d)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {DOC_TYPES.map((dt) => {
              const Icon = dt.icon;
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => handleSelectType(dt.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-heading font-semibold text-foreground">{dt.label}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dt.desc}</p>
                  </div>
                </button>
              );
            })}
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
              onClick={() => toDelete && void handleDelete(toDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {aprExcluir && (
        <AprErgoExcluirModal
          registros={[{
            id: aprExcluir.id,
            nome: aprExcluir.nome_documento || `APR-ERGO — ${aprExcluir.empresa_nome || ""}`,
          }]}
          empresaId={aprExcluir.empresa_id}
          contratoId={aprExcluir.contrato_id}
          onClose={() => setAprExcluir(null)}
          onDeleted={() => {
            void queryClient.invalidateQueries({ queryKey: ["documentos"] });
            setAprExcluir(null);
          }}
        />
      )}

      <InsalubridadeStartModal open={insalubridadeOpen} onOpenChange={setInsalubridadeOpen} />
      <PericulosidadeStartModal open={periculosidadeOpen} onOpenChange={setPericulosidadeOpen} />
      <PcmsoStartModal open={pcmsoOpen} onOpenChange={setPcmsoOpen} />
    </div>
  );
}
