import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, FileSignature, FolderTree, Loader2, Plus, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { sortByGes } from "@/lib/sortGes";
import { criarRegistroAprErgo, setorDoRegistroAprErgo, setoresAprErgoDoContrato, type AprErgoSetor } from "@/lib/aprErgo";

export default function AprErgoNovo() {
  const navigate = useNavigate();
  const { documentoId } = useParams();
  const queryClient = useQueryClient();
  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [temporarios, setTemporarios] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [salvando, setSalvando] = useState<string | null>(null);
  const salvandoRef = useRef(false);
  const pendingId = useRef<{ setorId: string; id: string } | null>(null);
  const { data: documento, isLoading: loadingDocumento, isError: erroDocumento } = useQuery({
    queryKey: ["apr-ergo-documento", documentoId], enabled: !!documentoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos").select("empresa_id, contrato_id, draft_snapshot").eq("id", documentoId || "").eq("tipo", "APR-ERGO").single();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!documento) return;
    setEmpresaId(documento.empresa_id || ""); setContratoId(documento.contrato_id || "");
    const setorId = setorDoRegistroAprErgo(documento.draft_snapshot);
    setSelecionados(setorId ? [setorId] : []);
  }, [documento]);
  const empresasQuery = useQuery({ queryKey: ["apr-ergo-empresas"], queryFn: async () => {
    const { data, error } = await supabase.from("empresas").select("id, razao_social, nome_fantasia").order("razao_social");
    if (error) throw error; return data || [];
  } });
  const contratosQuery = useQuery({ queryKey: ["apr-ergo-contratos", empresaId], enabled: !!empresaId, queryFn: async () => {
    const { data, error } = await supabase.from("contratos").select("id, numero_contrato, nome_contratante").eq("empresa_id", empresaId).order("created_at", { ascending: false });
    if (error) throw error; return data || [];
  } });
  const setoresQuery = useQuery({ queryKey: ["apr-ergo-setores", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("setores").select("id, empresa_id, contrato_id, nome_setor, ghe_ges, funcoes(id, nome_funcao)").eq("empresa_id", empresaId).eq("contrato_id", contratoId);
    if (error) throw error; return sortByGes(setoresAprErgoDoContrato(data || [], empresaId, contratoId));
  } });
  const registrosQuery = useQuery({ queryKey: ["apr-ergo-registros", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("documentos").select("id, draft_snapshot, status, created_at").eq("tipo", "APR-ERGO").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("created_at");
    if (error) throw error; return data || [];
  } });
  useRealtimeSync([
    { table: "empresas", queryKey: ["apr-ergo-empresas"] }, { table: "contratos", queryKey: ["apr-ergo-contratos"] },
    { table: "setores", queryKey: ["apr-ergo-setores"] }, { table: "funcoes", queryKey: ["apr-ergo-setores"] },
    { table: "documentos", queryKey: ["apr-ergo-registros"] },
  ], "apr-ergo-cadastro");
  const setores = setoresQuery.data || [];
  const mudarEscopo = () => { setSelecionados([]); setTemporarios([]); pendingId.current = null; };
  const adicionarRegistro = async (setor: AprErgoSetor) => {
    if (salvandoRef.current || registrosQuery.isError || registrosQuery.isLoading) return;
    const empresa = empresasQuery.data?.find((e) => e.id === empresaId);
    if (!empresa || !contratosQuery.data?.some((c) => c.id === contratoId)) return toast.error("Selecione uma empresa e um contrato válidos.");
    salvandoRef.current = true; setSalvando(setor.id);
    const id = pendingId.current?.setorId === setor.id ? pendingId.current.id : crypto.randomUUID();
    pendingId.current = { setorId: setor.id, id };
    try {
      const registro = criarRegistroAprErgo(setor, empresaId, contratoId, empresa.razao_social, id);
      const { error } = await supabase.from("documentos").upsert(registro, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw error;
      pendingId.current = null;
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["apr-ergo-registros"] }), queryClient.invalidateQueries({ queryKey: ["apr-ergo-documentos"] }), queryClient.invalidateQueries({ queryKey: ["documentos"] })]);
      toast.success("Registro APR-ERGO adicionado como rascunho");
    } catch { toast.error("Não foi possível adicionar o registro. Tente novamente."); }
    finally { salvandoRef.current = false; setSalvando(null); }
  };
  const erro = empresasQuery.isError || contratosQuery.isError || setoresQuery.isError || registrosQuery.isError;
  if (documentoId && loadingDocumento) return <Loader2 className="w-6 h-6 animate-spin mx-auto my-12" />;
  if (erroDocumento) return <div className="py-8 space-y-4"><p>Não foi possível abrir esta APR-ERGO.</p><Button variant="outline" onClick={() => navigate("/documentos/apr-ergo")}>Voltar</Button></div>;
  return <div>
    <PageHeader title={documentoId ? "APR-ERGO" : "Novo APR-ERGO"} actions={<Button variant="outline" onClick={() => navigate("/documentos/apr-ergo")}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>} />
    <div className="max-w-3xl space-y-5 mb-6">
      <div className="space-y-2"><Label className="flex items-center gap-2"><Building2 className="w-4 h-4" />Empresa</Label>
        <Select value={empresaId} disabled={!!documentoId || empresasQuery.isLoading || !!salvando} onValueChange={(v) => { setEmpresaId(v); setContratoId(""); mudarEscopo(); }}><SelectTrigger aria-label="Empresa"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{(empresasQuery.data || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent></Select>
      </div>
      {empresaId && <div className="space-y-2"><Label className="flex items-center gap-2"><FileSignature className="w-4 h-4" />Contrato</Label>
        <Select value={contratoId} disabled={!!documentoId || contratosQuery.isLoading || !!salvando} onValueChange={(v) => { setContratoId(v); mudarEscopo(); }}><SelectTrigger aria-label="Contrato"><SelectValue placeholder="Selecione o contrato" /></SelectTrigger><SelectContent>{(contratosQuery.data || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.numero_contrato || "Sem número"}{c.nome_contratante ? ` — ${c.nome_contratante}` : ""}</SelectItem>)}{contratosQuery.data?.length === 0 && <SelectItem value="vazio" disabled>Nenhum contrato cadastrado</SelectItem>}</SelectContent></Select>
      </div>}
      {contratoId && <Button variant="outline" disabled={!!salvando || setoresQuery.isLoading} onClick={() => { setTemporarios(selecionados); setModal(true); }}><FolderTree className="w-4 h-4 mr-2" />Selecionar setores</Button>}
      {erro && <div className="text-sm text-destructive flex flex-wrap gap-3 items-center">Não foi possível carregar os cadastros ou registros.<Button variant="outline" onClick={() => { void empresasQuery.refetch(); if (empresaId) void contratosQuery.refetch(); if (contratoId) { void setoresQuery.refetch(); void registrosQuery.refetch(); } }}>Tentar novamente</Button></div>}
    </div>
    <div className="space-y-4">{setores.filter((s) => selecionados.includes(s.id)).map((s) => {
      const registros = (registrosQuery.data || []).filter((r) => setorDoRegistroAprErgo(r.draft_snapshot) === s.id);
      return <section key={s.id} className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading font-semibold break-words">{s.ghe_ges ? `${s.ghe_ges} — ` : ""}{s.nome_setor}</h2><div className="flex gap-2">
          {registros.length === 0 && <Button variant="outline" disabled={!!salvando || registrosQuery.isLoading || registrosQuery.isError} onClick={() => adicionarRegistro(s)}><FilePlus2 className="w-4 h-4 mr-2" />Registro</Button>}
          <Button variant="outline" size="icon" title={`Adicionar APR-ERGO em ${s.nome_setor}`} aria-label={`Adicionar APR-ERGO em ${s.nome_setor}`} disabled={!!salvando || registrosQuery.isLoading || registrosQuery.isError} onClick={() => adicionarRegistro(s)}>{salvando === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}</Button>
        </div></div>
        <div><h3 className="text-xs font-medium text-muted-foreground mb-2">Funções</h3><div className="flex flex-wrap gap-2">{s.funcoes.map((f) => <Badge key={f.id} variant="secondary" className="whitespace-normal break-words">{f.nome_funcao}</Badge>)}{s.funcoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma função cadastrada neste setor</p>}</div></div>
        {registros.length > 0 && <ul className="divide-y divide-border">{registros.map((r, i) => <li key={r.id} className="py-2 flex justify-between items-center gap-3 text-sm"><span>Registro {i + 1}</span><Badge variant="outline">{r.status === "rascunho" ? "Rascunho" : r.status === "concluido" ? "Concluído" : r.status}</Badge></li>)}</ul>}
      </section>;
    })}</div>
    <Dialog open={modal} onOpenChange={setModal}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Selecione os setores</DialogTitle></DialogHeader>
      <div className="max-h-80 overflow-y-auto space-y-2">{setores.map((s) => <label key={s.id} className="flex items-center gap-3 p-3 border border-border rounded-md cursor-pointer"><Checkbox checked={temporarios.includes(s.id)} onCheckedChange={(checked) => setTemporarios((ids) => checked === true ? [...ids.filter((id) => id !== s.id), s.id] : ids.filter((id) => id !== s.id))} /><span className="text-sm break-words">{s.ghe_ges ? `${s.ghe_ges} — ` : ""}{s.nome_setor}</span></label>)}{setores.length === 0 && <p className="text-sm text-muted-foreground">Nenhum setor cadastrado neste contrato</p>}</div>
      <DialogFooter><Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => { setSelecionados(temporarios); setModal(false); }}>OK</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}