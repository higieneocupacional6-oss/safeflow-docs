import { useState } from "react";
import { Plus, Stethoscope, FileCode, MessageSquare, Edit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type Tab = "exames" | "esocial" | "observacoes";

const CATEGORIAS = ["Audiológico", "Oftalmológico", "Cardiológico", "Neurológico", "Pulmonar", "Laboratorial", "Clínico", "Outro"];

export default function CadastrosPcmso() {
  const [tab, setTab] = useState<Tab>("exames");
  const qc = useQueryClient();

  useRealtimeSync([
    { table: "exames_catalogo", queryKey: ["exames_catalogo"] },
    { table: "esocial_exames", queryKey: ["esocial_exames"] },
    { table: "pcmso_observacoes_padrao", queryKey: ["pcmso_observacoes_padrao"] },
  ]);

  const { data: exames = [] } = useQuery({
    queryKey: ["exames_catalogo"],
    queryFn: async () => (await supabase.from("exames_catalogo").select("*").order("nome")).data || [],
  });
  const { data: esocial = [] } = useQuery({
    queryKey: ["esocial_exames"],
    queryFn: async () => (await supabase.from("esocial_exames").select("*").order("codigo")).data || [],
  });
  const { data: observacoes = [] } = useQuery({
    queryKey: ["pcmso_observacoes_padrao"],
    queryFn: async () => (await supabase.from("pcmso_observacoes_padrao").select("*").order("created_at", { ascending: false })).data || [],
  });

  // Exames
  const [exOpen, setExOpen] = useState(false);
  const [exEdit, setExEdit] = useState<any>(null);
  const [exForm, setExForm] = useState({ nome: "", categoria: "", descricao: "", ativo: true });

  const openExame = (row: any = null) => {
    setExEdit(row);
    setExForm(row ? { nome: row.nome, categoria: row.categoria || "", descricao: row.descricao || "", ativo: !!row.ativo } : { nome: "", categoria: "", descricao: "", ativo: true });
    setExOpen(true);
  };
  const saveExame = async () => {
    if (!exForm.nome.trim()) return toast.error("Informe o nome");
    const payload = { ...exForm, nome: exForm.nome.trim() };
    const res = exEdit
      ? await supabase.from("exames_catalogo").update(payload).eq("id", exEdit.id)
      : await supabase.from("exames_catalogo").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Exame salvo");
    setExOpen(false);
    qc.invalidateQueries({ queryKey: ["exames_catalogo"] });
  };
  const deleteExame = async (id: string) => {
    if (!confirm("Remover exame?")) return;
    const { error } = await supabase.from("exames_catalogo").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["exames_catalogo"] });
  };

  // eSocial
  const [esOpen, setEsOpen] = useState(false);
  const [esEdit, setEsEdit] = useState<any>(null);
  const [esForm, setEsForm] = useState({ codigo: "", descricao: "", ativo: true });

  const openEsocial = (row: any = null) => {
    setEsEdit(row);
    setEsForm(row ? { codigo: row.codigo, descricao: row.descricao, ativo: !!row.ativo } : { codigo: "", descricao: "", ativo: true });
    setEsOpen(true);
  };
  const saveEsocial = async () => {
    if (!esForm.codigo.trim() || !esForm.descricao.trim()) return toast.error("Preencha código e descrição");
    const payload = { codigo: esForm.codigo.trim(), descricao: esForm.descricao.trim(), ativo: esForm.ativo };
    const res = esEdit
      ? await supabase.from("esocial_exames").update(payload).eq("id", esEdit.id)
      : await supabase.from("esocial_exames").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Código salvo");
    setEsOpen(false);
    qc.invalidateQueries({ queryKey: ["esocial_exames"] });
  };
  const deleteEsocial = async (id: string) => {
    if (!confirm("Remover código?")) return;
    const { error } = await supabase.from("esocial_exames").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["esocial_exames"] });
  };

  // Observações
  const [obOpen, setObOpen] = useState(false);
  const [obEdit, setObEdit] = useState<any>(null);
  const [obTexto, setObTexto] = useState("");

  const openObs = (row: any = null) => {
    setObEdit(row);
    setObTexto(row?.texto || "");
    setObOpen(true);
  };
  const saveObs = async () => {
    if (!obTexto.trim()) return toast.error("Informe o texto");
    const res = obEdit
      ? await supabase.from("pcmso_observacoes_padrao").update({ texto: obTexto.trim() }).eq("id", obEdit.id)
      : await supabase.from("pcmso_observacoes_padrao").insert({ texto: obTexto.trim() });
    if (res.error) return toast.error(res.error.message);
    toast.success("Observação salva");
    setObOpen(false);
    qc.invalidateQueries({ queryKey: ["pcmso_observacoes_padrao"] });
  };
  const deleteObs = async (id: string) => {
    if (!confirm("Remover observação?")) return;
    const { error } = await supabase.from("pcmso_observacoes_padrao").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["pcmso_observacoes_padrao"] });
  };

  return (
    <div>
      <PageHeader title="Cadastros PCMSO" description="Exames ocupacionais, códigos eSocial e biblioteca de observações" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="exames" className="gap-2"><Stethoscope className="w-3.5 h-3.5" />Exames</TabsTrigger>
          <TabsTrigger value="esocial" className="gap-2"><FileCode className="w-3.5 h-3.5" />eSocial</TabsTrigger>
          <TabsTrigger value="observacoes" className="gap-2"><MessageSquare className="w-3.5 h-3.5" />Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="exames">
          <div className="flex justify-end mb-3">
            <Button onClick={() => openExame()}><Plus className="w-4 h-4 mr-2" />Novo exame</Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exames.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell>{r.categoria || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={r.ativo ? "default" : "outline"}>{r.ativo ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openExame(r)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteExame(r.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!exames.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum exame cadastrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="esocial">
          <div className="flex justify-end mb-3">
            <Button onClick={() => openEsocial()}><Plus className="w-4 h-4 mr-2" />Novo código</Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {esocial.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.codigo}</TableCell>
                    <TableCell>{r.descricao}</TableCell>
                    <TableCell><Badge variant={r.ativo ? "default" : "outline"}>{r.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEsocial(r)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteEsocial(r.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!esocial.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum código cadastrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="observacoes">
          <div className="flex justify-end mb-3">
            <Button onClick={() => openObs()}><Plus className="w-4 h-4 mr-2" />Nova observação</Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Texto</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {observacoes.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.texto}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openObs(r)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteObs(r.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!observacoes.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhuma observação cadastrada</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Exame modal */}
      <Dialog open={exOpen} onOpenChange={setExOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{exEdit ? "Editar exame" : "Novo exame"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={exForm.nome} onChange={(e) => setExForm({ ...exForm, nome: e.target.value })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={exForm.categoria} onValueChange={(v) => setExForm({ ...exForm, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={exForm.descricao} onChange={(e) => setExForm({ ...exForm, descricao: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={exForm.ativo} onCheckedChange={(v) => setExForm({ ...exForm, ativo: v })} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setExOpen(false)}>Cancelar</Button><Button onClick={saveExame}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* eSocial modal */}
      <Dialog open={esOpen} onOpenChange={setEsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{esEdit ? "Editar código" : "Novo código eSocial"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Código</Label><Input value={esForm.codigo} onChange={(e) => setEsForm({ ...esForm, codigo: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={esForm.descricao} onChange={(e) => setEsForm({ ...esForm, descricao: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={esForm.ativo} onCheckedChange={(v) => setEsForm({ ...esForm, ativo: v })} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEsOpen(false)}>Cancelar</Button><Button onClick={saveEsocial}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Observação modal */}
      <Dialog open={obOpen} onOpenChange={setObOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{obEdit ? "Editar observação" : "Nova observação"}</DialogTitle></DialogHeader>
          <Textarea rows={4} value={obTexto} onChange={(e) => setObTexto(e.target.value)} placeholder="Ex.: Exame obrigatório para exposição a ruído." />
          <DialogFooter><Button variant="outline" onClick={() => setObOpen(false)}>Cancelar</Button><Button onClick={saveObs}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
