import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, FlaskConical, Ruler, Wrench, AlertTriangle, ShieldCheck, X, Check, Edit, Trash2, ClipboardList, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EQUIPAMENTO_TIPOS } from "@/lib/equipamentoTipos";
import { ControleEquipamentosModal } from "@/components/ControleEquipamentosModal";
import { statusCalibracao, statusBadgeClasses } from "@/lib/calibracao";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RiscoModal } from "@/components/RiscoModal";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

// Mock data removed in favor of real database queries


type TabKey = "riscos" | "tecnicas" | "equipamentos" | "unidades" | "epi_epc" | "pareceres";

export default function Cadastros() {
  const [tab, setTab] = useState<TabKey>("riscos");
  const [controleOpen, setControleOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [riscoModalOpen, setRiscoModalOpen] = useState(false);
  const [epiEpcModalOpen, setEpiEpcModalOpen] = useState(false);
  const [epiEpcForm, setEpiEpcForm] = useState({ tipo: "EPI", nome: "", risco_ids: [] as string[] });
  const [epiEpcSaving, setEpiEpcSaving] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState({ nome: "", tipo: "" as string });
  const [equipmentSaving, setEquipmentSaving] = useState(false);
  const [registrarModal, setRegistrarModal] = useState<{ open: boolean; equipamentoId: string; equipamentoNome: string }>({ open: false, equipamentoId: "", equipamentoNome: "" });
  const [registrarForm, setRegistrarForm] = useState({ numero_serie: "", marca_modelo: "", data_calibracao: "" });
  const [registrarSaving, setRegistrarSaving] = useState(false);
  const [tecnicasForm, setTecnicasForm] = useState({ nome: "", referencia: "" });
  const [unidadesForm, setUnidadesForm] = useState({ simbolo: "", nome: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: "", type: "" as TabKey | "epi_epc" });
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "equipamentos") setTab("equipamentos");
    if (searchParams.get("controle") === "1") {
      setTab("equipamentos");
      setControleOpen(true);
      const n = new URLSearchParams(searchParams);
      n.delete("controle");
      setSearchParams(n, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime sync: any change made in this session OR in another open tab/user
  // triggers an automatic refetch of the lists used here AND in other modals
  // (LTCAT, Insalubridade, AET) since they share the same query keys.
  useRealtimeSync([
    { table: "riscos", queryKey: ["riscos"] },
    { table: "tecnicas_amostragem", queryKey: ["tecnicas_amostragem"] },
    { table: "equipamentos_ho", queryKey: ["equipamentos_ho"] },
    { table: "equipamentos_ho_registros", queryKey: ["equipamentos_ho"] },
    { table: "unidades", queryKey: ["unidades"] },
    { table: "epi_epc", queryKey: ["epi_epc"] },
    { table: "epi_epc_riscos", queryKey: ["epi_epc"] },
  ]);

  const { data: riscos = [] } = useQuery({
    queryKey: ["riscos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("riscos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tecnicas = [] } = useQuery({
    queryKey: ["tecnicas_amostragem"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tecnicas_amostragem").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: equipamentos_ho = [] } = useQuery({
    queryKey: ["equipamentos_ho"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos_ho")
        .select("*, equipamentos_ho_registros(id, numero_serie, marca_modelo, data_calibracao)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("simbolo");
      if (error) throw error;
      return data;
    },
  });


  const { data: epiEpcList = [] } = useQuery({
    queryKey: ["epi_epc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_epc")
        .select("*, epi_epc_riscos(risco_id, riscos(nome))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSaveEpiEpc = async () => {
    if (!epiEpcForm.nome.trim()) {
      toast.error("Informe o nome do EPI/EPC");
      return;
    }
    // Duplicidade (mesmo nome + mesmo tipo)
    const nomeNorm = epiEpcForm.nome.trim().toLowerCase();
    const dup = (epiEpcList as any[]).find(
      (i) => i.id !== editingId && i.tipo === epiEpcForm.tipo && (i.nome || "").trim().toLowerCase() === nomeNorm
    );
    if (dup) {
      toast.error(`Já existe um ${epiEpcForm.tipo} com este nome.`);
      return;
    }
    setEpiEpcSaving(true);
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("epi_epc")
          .update({ tipo: epiEpcForm.tipo, nome: epiEpcForm.nome.trim() })
          .eq("id", editingId);
        if (error) throw error;

        // Refresh links: simplest is delete all and re-insert
        await supabase.from("epi_epc_riscos").delete().eq("epi_epc_id", editingId);
        if (epiEpcForm.risco_ids.length > 0) {
          const links = epiEpcForm.risco_ids.map((risco_id) => ({ epi_epc_id: editingId, risco_id }));
          const { error: linkError } = await supabase.from("epi_epc_riscos").insert(links);
          if (linkError) throw linkError;
        }
        toast.success("EPI/EPC atualizado com sucesso!");
      } else {
        // Insert
        const { data: inserted, error } = await supabase
          .from("epi_epc")
          .insert({ tipo: epiEpcForm.tipo, nome: epiEpcForm.nome.trim() })
          .select("id")
          .single();
        if (error) throw error;

        if (epiEpcForm.risco_ids.length > 0) {
          const links = epiEpcForm.risco_ids.map((risco_id) => ({ epi_epc_id: inserted.id, risco_id }));
          const { error: linkError } = await supabase.from("epi_epc_riscos").insert(links);
          if (linkError) throw linkError;
        }
        toast.success("EPI/EPC cadastrado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["epi_epc"] });
      setEpiEpcForm({ tipo: "EPI", nome: "", risco_ids: [] });
      setEditingId(null);
      setEpiEpcModalOpen(false);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setEpiEpcSaving(false);
    }
  };

  const toggleRiscoSelection = (riscoId: string) => {
    setEpiEpcForm((prev) => ({
      ...prev,
      risco_ids: prev.risco_ids.includes(riscoId)
        ? prev.risco_ids.filter((id) => id !== riscoId)
        : [...prev.risco_ids, riscoId],
    }));
  };

  const handleNovo = () => {
    setEditingId(null);
    if (tab === "riscos") {
      setRiscoModalOpen(true);
    } else if (tab === "epi_epc") {
      setEpiEpcForm({ tipo: "EPI", nome: "", risco_ids: [] });
      setEpiEpcModalOpen(true);
    } else if (tab === "equipamentos") {
      setEquipmentForm({ nome: "" });
      setDialogOpen(true);
    } else if (tab === "tecnicas") {
      setTecnicasForm({ nome: "", referencia: "" });
      setDialogOpen(true);
    } else if (tab === "unidades") {
      setUnidadesForm({ simbolo: "", nome: "" });
      setDialogOpen(true);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    if (tab === "riscos") {
      setRiscoModalOpen(true);
    } else if (tab === "epi_epc") {
      setEpiEpcForm({
        tipo: item.tipo,
        nome: item.nome,
        risco_ids: item.epi_epc_riscos?.map((r: any) => r.risco_id) || []
      });
      setEpiEpcModalOpen(true);
    } else if (tab === "equipamentos") {
      setEquipmentForm({ nome: item.nome });
      setDialogOpen(true);
    } else if (tab === "tecnicas") {
      setTecnicasForm({
        nome: item.nome,
        referencia: item.referencia || ""
      });
      setDialogOpen(true);
    } else if (tab === "unidades") {
      setUnidadesForm({
        simbolo: item.simbolo,
        nome: item.nome || ""
      });
      setDialogOpen(true);
    }
  };

  const handleDeleteClick = async (id: string) => {
    // Verificar vínculos em ltcat_avaliacoes
    const columnMap: any = {
      riscos: "agente_id",
      equipamentos: "equipamento_id",
      tecnicas: "tecnica_id",
      unidades: "unidade_resultado_id", // ou unidade_limite_id
    };

    if (columnMap[tab]) {
      const { count, error } = await (supabase
        .from("ltcat_avaliacoes")
        .select("*", { count: "exact", head: true }) as any)
        .eq(columnMap[tab], id);
      
      let usedInUnits = false;
      if (tab === "unidades") {
        const { count: count2 } = await supabase
          .from("ltcat_avaliacoes")
          .select("*", { count: "exact", head: true })
          .eq("unidade_limite_id", id);
        if (count2 && count2 > 0) usedInUnits = true;
      }

      if ((count && count > 0) || usedInUnits) {
        toast.error("Este registro está vinculado a outros dados e não pode ser excluído.");
        return;
      }
    }

    if (tab === "epi_epc") {
      // epi_epc_riscos não bloqueia, deleta em cascata (ou manualmente)
    }

    setDeleteConfirm({ open: true, id, type: tab });
  };

  const confirmDelete = async () => {
    const { id, type } = deleteConfirm;
    const tableMap: any = {
      riscos: "riscos",
      tecnicas: "tecnicas_amostragem",
      equipamentos: "equipamentos_ho",
      unidades: "unidades",
      epi_epc: "epi_epc"
    };

    try {
      if (type === "epi_epc") {
        await supabase.from("epi_epc_riscos").delete().eq("epi_epc_id", id);
      }
      const { error } = await supabase.from(tableMap[type]).delete().eq("id", id);
      if (error) throw error;

      const queryKeyMap: Record<string, string> = {
        riscos: "riscos",
        tecnicas: "tecnicas_amostragem",
        equipamentos: "equipamentos_ho",
        unidades: "unidades",
        epi_epc: "epi_epc",
      };
      await queryClient.invalidateQueries({ queryKey: [queryKeyMap[type]] });
      toast.success("Registro excluído com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || "Tente novamente"));
    } finally {
      setDeleteConfirm({ open: false, id: "", type: "riscos" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Cadastros Gerais"
        description="Gerencie riscos, agentes, técnicas e equipamentos"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="riscos" className="gap-2"><AlertTriangle className="w-3.5 h-3.5" />Riscos / Agentes</TabsTrigger>
            <TabsTrigger value="tecnicas" className="gap-2"><FlaskConical className="w-3.5 h-3.5" />Técnicas</TabsTrigger>
            <TabsTrigger value="equipamentos" className="gap-2"><Wrench className="w-3.5 h-3.5" />Equipamentos</TabsTrigger>
            <TabsTrigger value="unidades" className="gap-2"><Ruler className="w-3.5 h-3.5" />Unidades</TabsTrigger>
            <TabsTrigger value="epi_epc" className="gap-2"><ShieldCheck className="w-3.5 h-3.5" />EPI / EPC</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {tab === "equipamentos" && (
              <Button variant="outline" onClick={() => setControleOpen(true)} className="gap-2">
                <ClipboardList className="w-4 h-4" /> Controle de Equipamentos
              </Button>
            )}
            <Button onClick={handleNovo} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />Novo
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <TabsContent value="riscos" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>eSocial</TableHead>
                  <TableHead>Exposição</TableHead>
                  <TableHead>EPI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riscos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum risco cadastrado. Clique em "+ Novo" para começar.
                    </TableCell>
                  </TableRow>
                )}
                {riscos.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell><Badge variant="outline">{r.tipo}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{r.codigo_esocial || "—"}</TableCell>
                    <TableCell className="text-sm">{r.tipo_exposicao || "—"}</TableCell>
                    <TableCell>
                      {r.epi_eficaz ? (
                        <Badge variant={r.epi_eficaz === "Sim" ? "default" : "destructive"} className="text-xs">
                          {r.epi_eficaz}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" title="Editar" onClick={() => handleEdit(r)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Excluir" onClick={() => handleDeleteClick(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="tecnicas" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Técnica</TableHead><TableHead>Referência</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {tecnicas.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Nenhuma técnica cadastrada</TableCell></TableRow>
                ) : (
                  tecnicas.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{t.referencia}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => handleEdit(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="equipamentos" className="m-0">
            {equipamentos_ho.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                Nenhum equipamento cadastrado. Clique em "+ Novo" para começar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipamentos_ho.map((e: any) => {
                  const registros = e.equipamentos_ho_registros || [];
                  return (
                    <div key={e.id} className="border rounded-lg p-4 bg-card flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Wrench className="w-4 h-4 text-accent shrink-0" />
                          <h4 className="font-semibold truncate" title={e.nome}>{e.nome}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-accent"
                            title="Adicionar registro"
                            onClick={() => {
                              setRegistrarForm({ numero_serie: "", marca_modelo: "", data_calibracao: "" });
                              setRegistrarModal({ open: true, equipamentoId: e.id, equipamentoNome: e.nome });
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => handleEdit(e)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {registros.length === 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="self-start gap-1.5"
                          onClick={() => {
                            setRegistrarForm({ numero_serie: "", marca_modelo: "", data_calibracao: "" });
                            setRegistrarModal({ open: true, equipamentoId: e.id, equipamentoNome: e.nome });
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Registrar
                        </Button>
                      ) : (
                        <div className="space-y-2 text-xs">
                          {registros.map((r: any) => {
                            const st = statusCalibracao(r.data_calibracao);
                            return (
                            <div key={r.id} className="flex items-start justify-between gap-2 border rounded-md p-2 bg-muted/30">
                              <div className="space-y-0.5 min-w-0">
                                <div><span className="text-muted-foreground">Nº Série:</span> <span className="font-medium">{r.numero_serie}</span></div>
                                <div><span className="text-muted-foreground">Marca/Modelo:</span> {r.marca_modelo || "—"}</div>
                                <div><span className="text-muted-foreground">Calibração:</span> {r.data_calibracao ? new Date(r.data_calibracao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div>
                                <Badge variant="outline" className={`mt-1 ${statusBadgeClasses(st.status)}`}>{st.label}</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={async () => {
                                  const { error } = await supabase.from("equipamentos_ho_registros").delete().eq("id", r.id);
                                  if (error) { toast.error("Erro ao excluir registro"); return; }
                                  queryClient.invalidateQueries({ queryKey: ["equipamentos_ho"] });
                                  toast.success("Registro excluído");
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );})}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unidades" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Símbolo</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {unidades.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Nenhuma unidade cadastrada</TableCell></TableRow>
                ) : (
                  unidades.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell><Badge variant="outline" className="font-mono">{u.simbolo}</Badge></TableCell>
                      <TableCell>{u.nome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => handleEdit(u)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="epi_epc" className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Riscos Associados</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {epiEpcList.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Nenhum EPI/EPC cadastrado. Clique em "Cadastrar EPI/EPC" para começar.</TableCell></TableRow>
                ) : (
                  epiEpcList.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === 'EPI' ? 'default' : 'secondary'}>{item.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.epi_epc_riscos?.length > 0
                            ? item.epi_epc_riscos.map((r: any) => (
                                <Badge key={r.risco_id} variant="outline" className="text-xs">{r.riscos?.nome}</Badge>
                              ))
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal de Riscos */}
      <RiscoModal
        open={riscoModalOpen}
        onOpenChange={setRiscoModalOpen}
        editingId={editingId || undefined}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["riscos"] })}
      />

      {/* Modal EPI/EPC */}
      <Dialog open={epiEpcModalOpen} onOpenChange={setEpiEpcModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar" : "Cadastro de"} EPI / EPC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 1. Tipo */}
            <div>
              <Label>Tipo <span className="text-destructive">*</span></Label>
              <Select value={epiEpcForm.tipo} onValueChange={(v) => setEpiEpcForm({ ...epiEpcForm, tipo: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EPI">EPI</SelectItem>
                  <SelectItem value="EPC">EPC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Nome */}
            <div>
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input
                className="mt-1"
                placeholder="Ex: Protetor Auricular Tipo Concha"
                value={epiEpcForm.nome}
                onChange={(e) => setEpiEpcForm({ ...epiEpcForm, nome: e.target.value })}
              />
            </div>

            {/* 3. Riscos (multi-select) */}
            <div>
              <Label>Riscos Associados</Label>
              <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                {riscos.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">Nenhum risco cadastrado em Cadastros &gt; Riscos/Agentes.</p>
                ) : (
                  riscos.map((r: any) => {
                    const selected = epiEpcForm.risco_ids.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-accent/10 ${
                          selected ? "bg-accent/10 font-medium" : ""
                        }`}
                        onClick={() => toggleRiscoSelection(r.id)}
                      >
                        <span>{r.nome}</span>
                        {selected && <Check className="w-4 h-4 text-accent shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
              {epiEpcForm.risco_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {epiEpcForm.risco_ids.map((id) => {
                    const risco = riscos.find((r: any) => r.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-xs gap-1">
                        {risco?.nome}
                        <button type="button" onClick={() => toggleRiscoSelection(id)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEpiEpcModalOpen(false)}>Cancelar</Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleSaveEpiEpc}
              disabled={epiEpcSaving}
            >
              {epiEpcSaving ? "Salvando..." : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal genérico para outras abas */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingId ? "Editar" : "Novo"} {tab === "tecnicas" ? "Técnica" : tab === "equipamentos" ? "Equipamento" : "Unidade"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {tab === "tecnicas" && (
              <>
                <div><Label>Nome da Técnica</Label><Input className="mt-1" placeholder="Ex: Dosimetria de Ruído" value={tecnicasForm.nome} onChange={e => setTecnicasForm({ ...tecnicasForm, nome: e.target.value })} /></div>
                <div><Label>Referência / Norma</Label><Input className="mt-1" placeholder="Ex: NHO-01" value={tecnicasForm.referencia} onChange={e => setTecnicasForm({ ...tecnicasForm, referencia: e.target.value })} /></div>
              </>
            )}
            {tab === "equipamentos" && (
              <>
                <div>
                  <Label>Nome do Equipamento <span className="text-destructive">*</span></Label>
                  <Input 
                    className="mt-1" 
                    placeholder="Ex: Dosímetro DOS-500" 
                    value={equipmentForm.nome}
                    onChange={e => setEquipmentForm({ ...equipmentForm, nome: e.target.value })}
                  />
                </div>
              </>
            )}
            {tab === "unidades" && (
              <>
                <div><Label>Símbolo</Label><Input className="mt-1" placeholder="Ex: dB(A)" value={unidadesForm.simbolo} onChange={e => setUnidadesForm({ ...unidadesForm, simbolo: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input className="mt-1" placeholder="Ex: Decibéis ponderados em A" value={unidadesForm.nome} onChange={e => setUnidadesForm({ ...unidadesForm, nome: e.target.value })} /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90" 
              disabled={equipmentSaving}
              onClick={async () => { 
                if (tab === "equipamentos") {
                  if (!equipmentForm.nome.trim()) { toast.error("Informe o nome do equipamento"); return; }
                  const nomeNorm = equipmentForm.nome.trim().toLowerCase();
                  const dup = (equipamentos_ho as any[]).find(
                    (i) => i.id !== editingId && (i.nome || "").trim().toLowerCase() === nomeNorm
                  );
                  if (dup) { toast.error("Já existe um equipamento com este nome."); return; }
                  setEquipmentSaving(true);
                  try {
                    const payload = { nome: equipmentForm.nome.trim() };
                    if (editingId) {
                      const { error } = await supabase.from("equipamentos_ho").update(payload).eq("id", editingId);
                      if (error) throw error;
                      toast.success("Equipamento atualizado com sucesso!");
                    } else {
                      const { error } = await supabase.from("equipamentos_ho").insert(payload);
                      if (error) throw error;
                      toast.success("Equipamento cadastrado com sucesso!");
                    }
                    queryClient.invalidateQueries({ queryKey: ["equipamentos_ho"] });
                    setDialogOpen(false);
                  } catch (err: any) {
                    toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
                  } finally {
                    setEquipmentSaving(false);
                  }
                } else if (tab === "tecnicas") {
                  if (!tecnicasForm.nome.trim()) { toast.error("Informe o nome da técnica"); return; }
                  const nomeNorm = tecnicasForm.nome.trim().toLowerCase();
                  const dup = (tecnicas as any[]).find(
                    (i) => i.id !== editingId && (i.nome || "").trim().toLowerCase() === nomeNorm
                  );
                  if (dup) { toast.error("Já existe uma técnica com este nome."); return; }
                  setEquipmentSaving(true);
                  try {
                    const payload = { nome: tecnicasForm.nome.trim(), referencia: tecnicasForm.referencia.trim() || null };
                    if (editingId) {
                      const { error } = await supabase.from("tecnicas_amostragem").update(payload).eq("id", editingId);
                      if (error) throw error;
                      toast.success("Técnica atualizada com sucesso!");
                    } else {
                      const { error } = await supabase.from("tecnicas_amostragem").insert(payload);
                      if (error) throw error;
                      toast.success("Técnica cadastrada com sucesso!");
                    }
                    queryClient.invalidateQueries({ queryKey: ["tecnicas_amostragem"] });
                    setDialogOpen(false);
                  } catch (err: any) {
                    toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
                  } finally {
                    setEquipmentSaving(false);
                  }
                } else if (tab === "unidades") {
                  if (!unidadesForm.simbolo.trim()) { toast.error("Informe o símbolo"); return; }
                  const simNorm = unidadesForm.simbolo.trim().toLowerCase();
                  const dup = (unidades as any[]).find(
                    (i) => i.id !== editingId && (i.simbolo || "").trim().toLowerCase() === simNorm
                  );
                  if (dup) { toast.error("Já existe uma unidade com este símbolo."); return; }
                  setEquipmentSaving(true);
                  try {
                    const payload = { simbolo: unidadesForm.simbolo.trim(), nome: unidadesForm.nome.trim() || null };
                    if (editingId) {
                      const { error } = await supabase.from("unidades").update(payload).eq("id", editingId);
                      if (error) throw error;
                      toast.success("Unidade atualizada com sucesso!");
                    } else {
                      const { error } = await supabase.from("unidades").insert(payload);
                      if (error) throw error;
                      toast.success("Unidade cadastrada com sucesso!");
                    }
                    queryClient.invalidateQueries({ queryKey: ["unidades"] });
                    setDialogOpen(false);
                  } catch (err: any) {
                    toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
                  } finally {
                    setEquipmentSaving(false);
                  }
                } else {
                  setDialogOpen(false); 
                  toast.success("Cadastro salvo!"); 
                }
              }}
            >
              {equipmentSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar (registros do equipamento) */}
      <Dialog open={registrarModal.open} onOpenChange={(v) => setRegistrarModal({ ...registrarModal, open: v })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar — {registrarModal.equipamentoNome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nº de Série <span className="text-destructive">*</span></Label>
              <Input className="mt-1" placeholder="Ex: SN12345" value={registrarForm.numero_serie}
                onChange={(e) => setRegistrarForm({ ...registrarForm, numero_serie: e.target.value })} />
            </div>
            <div>
              <Label>Marca / Modelo</Label>
              <Input className="mt-1" placeholder="Ex: Instrutherm DOS-500" value={registrarForm.marca_modelo}
                onChange={(e) => setRegistrarForm({ ...registrarForm, marca_modelo: e.target.value })} />
            </div>
            <div>
              <Label>Data de Calibração</Label>
              <Input type="date" className="mt-1" value={registrarForm.data_calibracao}
                onChange={(e) => setRegistrarForm({ ...registrarForm, data_calibracao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistrarModal({ ...registrarModal, open: false })}>Cancelar</Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={registrarSaving}
              onClick={async () => {
                if (!registrarForm.numero_serie.trim()) { toast.error("Informe o nº de série"); return; }
                setRegistrarSaving(true);
                try {
                  const { error } = await supabase.from("equipamentos_ho_registros").insert({
                    equipamento_id: registrarModal.equipamentoId,
                    numero_serie: registrarForm.numero_serie.trim(),
                    marca_modelo: registrarForm.marca_modelo.trim() || null,
                    data_calibracao: registrarForm.data_calibracao || null,
                  });
                  if (error) throw error;
                  queryClient.invalidateQueries({ queryKey: ["equipamentos_ho"] });
                  toast.success("Registro adicionado!");
                  setRegistrarModal({ open: false, equipamentoId: "", equipamentoNome: "" });
                } catch (err: any) {
                  toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
                } finally {
                  setRegistrarSaving(false);
                }
              }}
            >
              {registrarSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteConfirm.open} onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground">Deseja realmente excluir este registro?</p>
            <p className="text-xs text-muted-foreground mt-2">Esta ação não poderá ser desfeita.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Confirmar exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ControleEquipamentosModal open={controleOpen} onOpenChange={setControleOpen} />
    </div>
  );
}
