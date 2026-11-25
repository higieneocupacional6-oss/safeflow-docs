import { formatDateOnly } from "@/lib/dateOnly";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Wrench, Plus, Upload, Download, Edit, Trash2, ChevronLeft, ClipboardList, FileCheck2, FileX2,
  ArrowRight, Gauge, ShieldCheck, AlertTriangle, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { statusCalibracao, statusBadgeClasses, type CalibStatus } from "@/lib/calibracao";
import { catalogErrorMessage, deleteCatalog, updateCatalog } from "@/lib/cadastroPersist";
import { cn } from "@/lib/utils";

const BUCKET = "certificados-calibracao";

interface Props {
  equipamentos: any[];
  onNovoRegistro: (equipamentoId: string, equipamentoNome: string) => void;
  onEditEquipamento: (equipamento: any) => void;
  onDeleteEquipamento: (id: string) => void;
}

function sanitize(s: string) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "_");
}

function statusAccent(status: CalibStatus) {
  switch (status) {
    case "conforme":
      return "from-emerald-500/80 to-emerald-400/40";
    case "atencao":
      return "from-amber-500/80 to-amber-400/40";
    case "vencido":
      return "from-red-500/80 to-red-400/40";
    default:
      return "from-slate-400/70 to-slate-300/30";
  }
}

function StatusIcon({ status }: { status: CalibStatus }) {
  if (status === "conforme") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (status === "atencao") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (status === "vencido") return <XCircle className="h-3.5 w-3.5" />;
  return <Gauge className="h-3.5 w-3.5" />;
}

export function EquipamentosPanel({ equipamentos, onNovoRegistro, onEditEquipamento, onDeleteEquipamento }: Props) {
  const queryClient = useQueryClient();
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [listagemOpen, setListagemOpen] = useState(false);
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [baixando, setBaixando] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editReg, setEditReg] = useState<any | null>(null);
  const [savingReg, setSavingReg] = useState(false);
  const [delReg, setDelReg] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRegistro = useRef<any | null>(null);

  const categoria = useMemo(
    () => equipamentos.find((e) => e.id === categoriaId) || null,
    [equipamentos, categoriaId],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["equipamentos_ho"] });

  const pickFile = (registro: any) => {
    pendingRegistro.current = registro;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file?: File) => {
    const registro = pendingRegistro.current;
    pendingRegistro.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !registro) return;

    setUploadingId(registro.id);
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
    const novoPath = `${registro.id}/${Date.now()}-${sanitize(file.name)}`.replace(/\s+/g, "_");
    const anterior = registro.certificado_path as string | null;

    try {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(novoPath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) throw upErr;

      try {
        await updateCatalog("equipamentos_ho_registros", registro.id, registro.row_version, {
          certificado_path: novoPath,
          certificado_nome: file.name,
          certificado_updated_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        await supabase.storage.from(BUCKET).remove([novoPath]);
        throw dbErr;
      }

      if (anterior && anterior !== novoPath) {
        await supabase.storage.from(BUCKET).remove([anterior]);
      }
      invalidate();
      toast.success("Certificado enviado com sucesso!");
      void ext;
    } catch (err: any) {
      toast.error("Falha no upload. O certificado anterior foi mantido. " + catalogErrorMessage(err));
    } finally {
      setUploadingId(null);
    }
  };

  const baixarCertificado = async (registro: any) => {
    if (!registro.certificado_path) {
      toast.error("Certificado não cadastrado para esta série.");
      return;
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(registro.certificado_path);
    if (error || !data) {
      toast.error("Erro ao baixar o certificado.");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = registro.certificado_nome || `certificado-${sanitize(registro.numero_serie)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const salvarRegistro = async () => {
    if (!editReg?.numero_serie?.trim()) {
      toast.error("Informe o nº de série");
      return;
    }
    setSavingReg(true);
    try {
      await updateCatalog("equipamentos_ho_registros", editReg.id, editReg.row_version, {
        numero_serie: editReg.numero_serie.trim(),
        marca_modelo: editReg.marca_modelo?.trim() || null,
        data_calibracao: editReg.data_calibracao || null,
      });
    } catch (error) {
      setSavingReg(false);
      toast.error(catalogErrorMessage(error));
      return;
    }
    setSavingReg(false);
    invalidate();
    toast.success("Equipamento atualizado");
    setEditReg(null);
  };

  const excluirRegistro = async () => {
    if (!delReg) return;
    if (delReg.certificado_path) {
      await supabase.storage.from(BUCKET).remove([delReg.certificado_path]);
    }
    try {
      await deleteCatalog("equipamentos_ho_registros", delReg.id);
    } catch (error) {
      toast.error(catalogErrorMessage(error));
      return;
    }
    invalidate();
    toast.success("Registro excluído");
    setDelReg(null);
  };

  const registrosPlanos = useMemo(() => {
    const out: any[] = [];
    for (const e of equipamentos) {
      for (const r of e.equipamentos_ho_registros || []) out.push({ ...r, categoria: e.nome });
    }
    return out;
  }, [equipamentos]);

  const baixarSelecionados = async () => {
    const ids = Object.keys(selecionados).filter((k) => selecionados[k]);
    const regs = registrosPlanos.filter((r) => ids.includes(r.id));
    if (regs.length === 0) {
      toast.error("Selecione ao menos uma série.");
      return;
    }
    const semCert = regs.filter((r) => !r.certificado_path);
    const comCert = regs.filter((r) => r.certificado_path);
    if (comCert.length === 0) {
      toast.error("Nenhum dos itens selecionados possui certificado cadastrado.");
      return;
    }
    setBaixando(true);
    try {
      if (comCert.length === 1) {
        await baixarCertificado(comCert[0]);
      } else {
        const zip = new JSZip();
        for (const r of comCert) {
          const { data } = await supabase.storage.from(BUCKET).download(r.certificado_path);
          if (!data) continue;
          const nome = r.certificado_nome || "certificado.pdf";
          const extIdx = nome.lastIndexOf(".");
          const ext = extIdx > 0 ? nome.slice(extIdx) : ".pdf";
          zip.file(`${sanitize(r.categoria)}/${sanitize(r.numero_serie)}${ext}`, data);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Certificados_Calibracao.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      if (semCert.length > 0) {
        toast.warning(`${semCert.length} série(s) sem certificado cadastrado não foram incluídas.`);
      } else {
        toast.success("Download concluído");
      }
    } catch (err: any) {
      toast.error("Erro ao gerar o download: " + (err?.message || ""));
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div className="space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {categoria ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setCategoriaId(null)}
              >
                <ChevronLeft className="h-4 w-4" /> Categorias
              </Button>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Categoria
                </p>
                <h3 className="font-heading truncate text-lg font-semibold text-foreground">
                  {categoria.nome}
                </h3>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Inventário HO
              </p>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Categorias de equipamentos
              </h3>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-primary/20 bg-background/70 backdrop-blur-sm"
          onClick={() => setListagemOpen(true)}
        >
          <ClipboardList className="h-4 w-4" /> Listagem de Certificados
        </Button>
      </div>

      {/* Categorias */}
      {!categoria &&
        (equipamentos.length === 0 ? (
          <div className="portal-surface px-6 py-14 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum equipamento cadastrado. Clique em “+ Novo” para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {equipamentos.map((e) => {
              const regs = e.equipamentos_ho_registros || [];
              const comCert = regs.filter((r: any) => r.certificado_path).length;
              const vencidos = regs.filter((r: any) => statusCalibracao(r.data_calibracao).status === "vencido").length;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setCategoriaId(e.id)}
                  className="portal-surface group relative flex h-full flex-col overflow-hidden p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background:
                        "radial-gradient(420px 160px at 0% 0%, hsl(var(--primary) / 0.1), transparent 55%), radial-gradient(280px 140px at 100% 0%, hsl(152 25% 55% / 0.08), transparent 50%)",
                    }}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition group-hover:bg-primary/15">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  <div className="relative mt-4 min-w-0 flex-1 space-y-1">
                    <p className="font-heading text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                      {e.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {regs.length} equipamento{regs.length !== 1 ? "s" : ""} nesta categoria
                    </p>
                  </div>
                  <div className="relative mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground">
                      <Gauge className="h-3 w-3 text-primary" />
                      {regs.length} série{regs.length !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <FileCheck2 className="h-3 w-3" />
                      {comCert} cert.
                    </span>
                    {vencidos > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-300/70 bg-red-50/80 px-2.5 py-1 text-[11px] font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                        <XCircle className="h-3 w-3" />
                        {vencidos} venc.
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

      {/* Detalhe da categoria */}
      {categoria && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => onNovoRegistro(categoria.id, categoria.nome)}
            >
              <Plus className="h-4 w-4" /> Novo equipamento
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onEditEquipamento(categoria)}
            >
              <Edit className="h-3.5 w-3.5" /> Editar categoria
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onDeleteEquipamento(categoria.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir categoria
            </Button>
          </div>

          {(categoria.equipamentos_ho_registros || []).length === 0 ? (
            <div className="portal-surface px-6 py-14 text-center text-sm text-muted-foreground">
              Nenhum equipamento nesta categoria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(categoria.equipamentos_ho_registros || []).map((r: any) => {
                const st = statusCalibracao(r.data_calibracao);
                return (
                  <article
                    key={r.id}
                    className="portal-surface group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                  >
                    <div
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
                        statusAccent(st.status),
                      )}
                    />
                    <div className="space-y-3 p-4 pl-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Nº de série
                          </p>
                          <p className="truncate font-mono text-sm font-semibold tracking-tight text-foreground" title={r.numero_serie}>
                            {r.numero_serie}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("shrink-0 gap-1", statusBadgeClasses(st.status))}>
                          <StatusIcon status={st.status} />
                          {st.label}
                        </Badge>
                      </div>

                      <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground">Marca / Modelo</span>
                          <span className="max-w-[60%] text-right font-medium text-foreground">
                            {r.marca_modelo || "—"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground">Calibração</span>
                          <span className="text-right font-medium text-foreground">
                            {r.data_calibracao ? formatDateOnly(r.data_calibracao) : "—"}
                            {st.meses !== null && (
                              <span className="block text-[10px] font-normal text-muted-foreground">
                                {st.meses} mês(es)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 border-t border-border/50 pt-2">
                          {r.certificado_path ? (
                            <>
                              <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate text-foreground" title={r.certificado_nome || ""}>
                                {r.certificado_nome || "Certificado enviado"}
                              </span>
                            </>
                          ) : (
                            <>
                              <FileX2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-muted-foreground">Certificado não cadastrado</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-background/80 p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Upload certificado"
                          disabled={uploadingId === r.id}
                          onClick={() => pickFile(r)}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Download certificado"
                          disabled={!r.certificado_path}
                          onClick={() => baixarCertificado(r)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() =>
                            setEditReg({
                              id: r.id,
                              row_version: r.row_version,
                              numero_serie: r.numero_serie || "",
                              marca_modelo: r.marca_modelo || "",
                              data_calibracao: r.data_calibracao || "",
                            })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-8 w-8 text-destructive hover:text-destructive"
                          title="Excluir"
                          onClick={() => setDelReg(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={listagemOpen} onOpenChange={setListagemOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-accent" /> Listagem de Certificados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {equipamentos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado.</p>
            )}
            {equipamentos.map((e) => {
              const regs = e.equipamentos_ho_registros || [];
              if (regs.length === 0) return null;
              return (
                <div key={e.id}>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
                    {e.nome}
                  </h4>
                  <div className="space-y-1.5">
                    {regs.map((r: any) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={!!selecionados[r.id]}
                          onCheckedChange={(v) =>
                            setSelecionados((s) => ({ ...s, [r.id]: !!v }))
                          }
                        />
                        <span className="font-medium">Série: {r.numero_serie}</span>
                        <span className="text-xs text-muted-foreground">{r.marca_modelo || ""}</span>
                        <span className="ml-auto text-xs">
                          {r.certificado_path ? (
                            <span className="text-emerald-600">Certificado disponível</span>
                          ) : (
                            <span className="text-muted-foreground">Certificado não cadastrado</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <p className="mr-auto text-[11px] text-muted-foreground">
              Vários selecionados são reunidos em um único arquivo compactado (.zip).
            </p>
            <Button type="button" variant="outline" onClick={() => setSelecionados({})}>
              Limpar seleção
            </Button>
            <Button type="button" onClick={baixarSelecionados} disabled={baixando} className="gap-2">
              <Download className="h-4 w-4" /> {baixando ? "Preparando..." : "Baixar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editReg} onOpenChange={(o) => !o && setEditReg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar equipamento</DialogTitle>
          </DialogHeader>
          {editReg && (
            <div className="space-y-3">
              <div>
                <Label>Nº de Série *</Label>
                <Input
                  className="mt-1"
                  value={editReg.numero_serie}
                  onChange={(e) => setEditReg({ ...editReg, numero_serie: e.target.value })}
                />
              </div>
              <div>
                <Label>Marca / Modelo</Label>
                <Input
                  className="mt-1"
                  value={editReg.marca_modelo}
                  onChange={(e) => setEditReg({ ...editReg, marca_modelo: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de Calibração</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={editReg.data_calibracao}
                  onChange={(e) => setEditReg({ ...editReg, data_calibracao: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditReg(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvarRegistro} disabled={savingReg}>
              {savingReg ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delReg} onOpenChange={(o) => !o && setDelReg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">Excluir equipamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Deseja excluir a série <strong>{delReg?.numero_serie}</strong>? O certificado vinculado também será
            removido.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDelReg(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={excluirRegistro}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
