import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Wrench, Plus, Upload, Download, Edit, Trash2, ChevronLeft, ClipboardList, FileCheck2, FileX2,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { statusCalibracao, statusBadgeClasses } from "@/lib/calibracao";

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

  // ---------- Upload de certificado (substitui o anterior somente após sucesso) ----------
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

      const { error: dbErr } = await supabase
        .from("equipamentos_ho_registros")
        .update({
          certificado_path: novoPath,
          certificado_nome: file.name,
          certificado_updated_at: new Date().toISOString(),
        } as any)
        .eq("id", registro.id);
      if (dbErr) {
        // rollback: remove o arquivo novo, mantém o anterior intacto
        await supabase.storage.from(BUCKET).remove([novoPath]);
        throw dbErr;
      }

      // só agora remove o certificado anterior
      if (anterior && anterior !== novoPath) {
        await supabase.storage.from(BUCKET).remove([anterior]);
      }
      invalidate();
      toast.success("Certificado enviado com sucesso!");
      void ext;
    } catch (err: any) {
      toast.error("Falha no upload. O certificado anterior foi mantido. " + (err?.message || ""));
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
    const { error } = await supabase
      .from("equipamentos_ho_registros")
      .update({
        numero_serie: editReg.numero_serie.trim(),
        marca_modelo: editReg.marca_modelo || null,
        data_calibracao: editReg.data_calibracao || null,
      })
      .eq("id", editReg.id);
    setSavingReg(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    invalidate();
    toast.success("Equipamento atualizado");
    setEditReg(null);
  };

  const excluirRegistro = async () => {
    if (!delReg) return;
    if (delReg.certificado_path) {
      await supabase.storage.from(BUCKET).remove([delReg.certificado_path]);
    }
    const { error } = await supabase.from("equipamentos_ho_registros").delete().eq("id", delReg.id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    invalidate();
    toast.success("Registro excluído");
    setDelReg(null);
  };

  // ---------- Listagem de certificados ----------
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
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {categoria && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setCategoriaId(null)}>
              <ChevronLeft className="w-4 h-4" /> Categorias
            </Button>
          )}
          {categoria && <h3 className="font-heading font-semibold">{categoria.nome}</h3>}
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setListagemOpen(true)}>
          <ClipboardList className="w-4 h-4" /> Listagem de Certificados
        </Button>
      </div>

      {/* ---------- Categorias ---------- */}
      {!categoria &&
        (equipamentos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            Nenhum equipamento cadastrado. Clique em "+ Novo" para começar.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {equipamentos.map((e) => {
              const regs = e.equipamentos_ho_registros || [];
              const comCert = regs.filter((r: any) => r.certificado_path).length;
              return (
                <button
                  key={e.id}
                  onClick={() => setCategoriaId(e.id)}
                  className="text-left border rounded-xl p-4 bg-card hover:border-accent hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20">
                    <Wrench className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-sm leading-tight line-clamp-2" title={e.nome}>
                    {e.nome}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {regs.length} equipamento{regs.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {comCert} com certificado
                  </p>
                </button>
              );
            })}
          </div>
        ))}

      {/* ---------- Equipamentos da categoria ---------- */}
      {categoria && (
        <>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => onNovoRegistro(categoria.id, categoria.nome)}>
              <Plus className="w-4 h-4" /> Novo equipamento
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEditEquipamento(categoria)}>
              <Edit className="w-3.5 h-3.5" /> Editar categoria
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive"
              onClick={() => onDeleteEquipamento(categoria.id)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir categoria
            </Button>
          </div>

          {(categoria.equipamentos_ho_registros || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              Nenhum equipamento nesta categoria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(categoria.equipamentos_ho_registros || []).map((r: any) => {
                const st = statusCalibracao(r.data_calibracao);
                return (
                  <div key={r.id} className="border rounded-xl p-4 bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Nº de Série</div>
                        <div className="font-semibold truncate" title={r.numero_serie}>{r.numero_serie}</div>
                      </div>
                      <Badge variant="outline" className={statusBadgeClasses(st.status)}>{st.label}</Badge>
                    </div>
                    <div className="text-xs space-y-1">
                      <div><span className="text-muted-foreground">Marca/Modelo:</span> {r.marca_modelo || "—"}</div>
                      <div>
                        <span className="text-muted-foreground">Calibração:</span>{" "}
                        {r.data_calibracao
                          ? new Date(r.data_calibracao + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                        {st.meses !== null && <span className="text-muted-foreground"> ({st.meses} mês(es))</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {r.certificado_path ? (
                          <>
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate" title={r.certificado_nome || ""}>
                              {r.certificado_nome || "Certificado enviado"}
                            </span>
                          </>
                        ) : (
                          <>
                            <FileX2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Certificado não cadastrado</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pt-1 border-t">
                      <Button
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
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Editar"
                        onClick={() =>
                          setEditReg({
                            id: r.id,
                            numero_serie: r.numero_serie || "",
                            marca_modelo: r.marca_modelo || "",
                            data_calibracao: r.data_calibracao || "",
                          })
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Excluir"
                        onClick={() => setDelReg(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------- Modal Listagem de Certificados ---------- */}
      <Dialog open={listagemOpen} onOpenChange={setListagemOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-accent" /> Listagem de Certificados
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
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/80 mb-2">
                    {e.nome}
                  </h4>
                  <div className="space-y-1.5">
                    {regs.map((r: any) => (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 bg-muted/30 cursor-pointer"
                      >
                        <Checkbox
                          checked={!!selecionados[r.id]}
                          onCheckedChange={(v) =>
                            setSelecionados((s) => ({ ...s, [r.id]: !!v }))
                          }
                        />
                        <span className="font-medium">Série: {r.numero_serie}</span>
                        <span className="text-muted-foreground text-xs">{r.marca_modelo || ""}</span>
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <p className="text-[11px] text-muted-foreground mr-auto">
              Vários selecionados são reunidos em um único arquivo compactado (.zip).
            </p>
            <Button variant="outline" onClick={() => setSelecionados({})}>Limpar seleção</Button>
            <Button onClick={baixarSelecionados} disabled={baixando} className="gap-2">
              <Download className="w-4 h-4" /> {baixando ? "Preparando..." : "Baixar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Modal editar registro ---------- */}
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
            <Button variant="outline" onClick={() => setEditReg(null)}>Cancelar</Button>
            <Button onClick={salvarRegistro} disabled={savingReg}>
              {savingReg ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Confirmar exclusão de registro ---------- */}
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
            <Button variant="outline" onClick={() => setDelReg(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={excluirRegistro}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
