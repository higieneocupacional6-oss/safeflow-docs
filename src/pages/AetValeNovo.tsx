import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, ClipboardList, Download, CalendarRange, FileSignature, FolderTree, Loader2 } from "lucide-react";
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
import { selecionarSetorAep } from "@/lib/aepContexto";
import { setoresAprErgoDoContrato, rotuloStatusAprErgo } from "@/lib/aprErgo";
import { baixarAetValeSalva } from "@/lib/aetValeDownload";
import {
  criarRegistroAetVale, funcaoDoRegistroAetVale, riscosAepAltos, setorDoRegistroAetVale,
  type AetValeSetor,
} from "@/lib/aetVale";

export default function AetValeNovo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [temporarios, setTemporarios] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [funcSel, setFuncSel] = useState<Record<string, string[]>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const salvandoRef = useRef(false);
  const [baixando, setBaixando] = useState<string | null>(null);
  const baixar = async (id: string) => { setBaixando(id); try { await baixarAetValeSalva(id, empresaId, contratoId); } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível baixar a avaliação."); } finally { setBaixando(null); } };

  const empresasQuery = useQuery({ queryKey: ["aet-vale-empresas"], queryFn: async () => {
    const { data, error } = await supabase.from("empresas").select("id, razao_social, nome_fantasia").order("razao_social");
    if (error) throw error; return data || [];
  } });
  const contratosQuery = useQuery({ queryKey: ["aet-vale-contratos", empresaId], enabled: !!empresaId, queryFn: async () => {
    const { data, error } = await supabase.from("contratos").select("id, numero_contrato, nome_contratante").eq("empresa_id", empresaId).order("created_at", { ascending: false });
    if (error) throw error; return data || [];
  } });
  const setoresQuery = useQuery({ queryKey: ["aet-vale-setores", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("setores").select("id, empresa_id, contrato_id, nome_setor, ghe_ges, funcoes(id, nome_funcao)").eq("empresa_id", empresaId).eq("contrato_id", contratoId);
    if (error) throw error; return sortByGes(setoresAprErgoDoContrato(data || [], empresaId, contratoId));
  } });
  const aepQuery = useQuery({ queryKey: ["aet-vale-aep", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("aep_documentos").select("id, setores, updated_at").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("updated_at", { ascending: false });
    if (error) throw error; return data || [];
  } });
  const registrosQuery = useQuery({ queryKey: ["aet-vale-registros", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("documentos").select("id, draft_snapshot, status, created_at").eq("tipo", "AET-VALE").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("created_at");
    if (error) throw error; return data || [];
  } });
  useRealtimeSync([
    { table: "empresas", queryKey: ["aet-vale-empresas"] }, { table: "contratos", queryKey: ["aet-vale-contratos"] },
    { table: "setores", queryKey: ["aet-vale-setores"] }, { table: "funcoes", queryKey: ["aet-vale-setores"] },
    { table: "aep_documentos", queryKey: ["aet-vale-aep"] }, { table: "documentos", queryKey: ["aet-vale-registros"] },
  ], "aet-vale-cadastro");

  const setores = (setoresQuery.data || []) as AetValeSetor[];
  const mudarEscopo = () => { setSelecionados([]); setTemporarios([]); setFuncSel({}); };

  const funcaoIndicada = (setor: AetValeSetor, funcaoId: string) => {
    const encontrado = selecionarSetorAep(aepQuery.data || [], { setorId: setor.id, funcaoIds: [funcaoId] });
    return !!encontrado && riscosAepAltos(encontrado.setor?.riscos_lista).length > 0;
  };

  // Pré-seleciona as funções indicadas pela AEP (Alto/Muito Alto) ao abrir o setor.
  useEffect(() => {
    if (!aepQuery.data) return;
    setFuncSel((prev) => {
      const next = { ...prev };
      for (const s of setores) {
        if (!selecionados.includes(s.id) || s.id in next) continue;
        next[s.id] = s.funcoes.filter((f) => funcaoIndicada(s, f.id)).map((f) => f.id);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aepQuery.data, setoresQuery.data, selecionados]);

  const alternarFuncao = (setorId: string, funcaoId: string, marcado: boolean) =>
    setFuncSel((prev) => {
      const atual = prev[setorId] || [];
      return { ...prev, [setorId]: marcado ? [...new Set([...atual, funcaoId])] : atual.filter((id) => id !== funcaoId) };
    });

  const registrar = async (setor: AetValeSetor) => {
    const funcs = funcSel[setor.id] || [];
    if (!funcs.length) return toast.error("Selecione ao menos uma função para registrar.");
    if (salvandoRef.current || registrosQuery.isLoading || registrosQuery.isError) return;
    const empresa = empresasQuery.data?.find((e) => e.id === empresaId);
    if (!empresa || !contratosQuery.data?.some((c) => c.id === contratoId)) return toast.error("Selecione uma empresa e um contrato válidos.");
    salvandoRef.current = true; setSalvando(setor.id);
    try {
      const existentes = registrosQuery.data || [];
      const ids: string[] = [];
      for (const funcaoId of funcs) {
        const existente = existentes.find((r) => setorDoRegistroAetVale(r.draft_snapshot) === setor.id && funcaoDoRegistroAetVale(r.draft_snapshot) === funcaoId);
        if (existente) { ids.push(existente.id); continue; }
        const id = crypto.randomUUID();
        const registro = criarRegistroAetVale(setor, empresaId, contratoId, empresa.razao_social, id, funcaoId);
        const { error } = await supabase.from("documentos").upsert(registro, { onConflict: "id", ignoreDuplicates: true });
        if (error) throw error;
        ids.push(id);
      }
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["aet-vale-registros"] }), queryClient.invalidateQueries({ queryKey: ["documentos"] })]);
      toast.success("Registro(s) AET (VALE) criado(s)");
      if (ids[0]) navigate(`/documentos/aet-vale/registro/${ids[0]}`);
    } catch { toast.error("Não foi possível criar o registro. Tente novamente."); }
    finally { salvandoRef.current = false; setSalvando(null); }
  };

  const erro = empresasQuery.isError || contratosQuery.isError || setoresQuery.isError || aepQuery.isError || registrosQuery.isError;
  return <div>
    <PageHeader title="AET (VALE)" description="Seleção de empresa, contrato, setores e funções para análise ergonômica" actions={<Button variant="outline" onClick={() => navigate("/documentos")}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>} />
    <div className="max-w-3xl space-y-5 mb-6">
      <div className="space-y-2"><Label className="flex items-center gap-2"><Building2 className="w-4 h-4" />Empresa</Label>
        <Select value={empresaId} disabled={empresasQuery.isLoading || !!salvando} onValueChange={(v) => { setEmpresaId(v); setContratoId(""); mudarEscopo(); }}><SelectTrigger aria-label="Empresa"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{(empresasQuery.data || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent></Select>
      </div>
      {empresaId && <div className="space-y-2"><Label className="flex items-center gap-2"><FileSignature className="w-4 h-4" />Contrato</Label>
        <Select value={contratoId} disabled={contratosQuery.isLoading || !!salvando} onValueChange={(v) => { setContratoId(v); mudarEscopo(); }}><SelectTrigger aria-label="Contrato"><SelectValue placeholder="Selecione o contrato" /></SelectTrigger><SelectContent>{(contratosQuery.data || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.numero_contrato || "Sem número"}{c.nome_contratante ? ` — ${c.nome_contratante}` : ""}</SelectItem>)}{contratosQuery.data?.length === 0 && <SelectItem value="vazio" disabled>Nenhum contrato cadastrado</SelectItem>}</SelectContent></Select>
      </div>}
      {contratoId && <Button variant="outline" disabled={!!salvando || setoresQuery.isLoading} onClick={() => { setTemporarios(selecionados); setModal(true); }}><FolderTree className="w-4 h-4 mr-2" />Selecionar setores</Button>}
      {erro && <div className="text-sm text-destructive flex flex-wrap gap-3 items-center">Não foi possível carregar os cadastros ou registros.<Button variant="outline" onClick={() => { void empresasQuery.refetch(); if (empresaId) void contratosQuery.refetch(); if (contratoId) { void setoresQuery.refetch(); void aepQuery.refetch(); void registrosQuery.refetch(); } }}>Tentar novamente</Button></div>}
    </div>
    <div className="space-y-4">{setores.filter((s) => selecionados.includes(s.id)).map((s) => {
      const registros = (registrosQuery.data || []).filter((r) => setorDoRegistroAetVale(r.draft_snapshot) === s.id);
      const marcadas = funcSel[s.id] || [];
      return <section key={s.id} className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading font-semibold break-words">{s.ghe_ges ? `${s.ghe_ges} — ` : ""}{s.nome_setor}</h2>
          <Button disabled={!!salvando || registrosQuery.isLoading || registrosQuery.isError} onClick={() => void registrar(s)}>{salvando === s.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardList className="w-4 h-4 mr-2" />}Registrar</Button>
        </div>
        <div><h3 className="text-xs font-medium text-muted-foreground mb-2">Funções para análise ergonômica</h3>
          {s.funcoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma função cadastrada neste setor</p>}
          <div className="space-y-2">{s.funcoes.map((f) => {
            const indicada = funcaoIndicada(s, f.id);
            const registro = registros.find(r => funcaoDoRegistroAetVale(r.draft_snapshot) === f.id);
            return <div key={f.id} className="flex flex-wrap items-center gap-3 p-3 border border-border rounded-md">
              <Checkbox checked={marcadas.includes(f.id)} onCheckedChange={(c) => alternarFuncao(s.id, f.id, c === true)} aria-label={f.nome_funcao} />
              <span className="text-sm break-words flex-1">{f.nome_funcao}</span>
              <Badge variant="outline">{registro?.status === "salvo" ? "Salvo" : "Rascunho"}</Badge>
              <Button variant="ghost" size="icon" aria-label={`Baixar ${f.nome_funcao}`} title="Baixar PDF" disabled={!registro || registro.status !== "salvo" || !!baixando} onClick={() => registro && void baixar(registro.id)}>{baixando === registro?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}</Button>
              {indicada && <Badge variant="outline" className="border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/10">Indicada pela AEP (Alto/Muito Alto)</Badge>}
            </div>;
          })}</div>
        </div>
        {registros.length > 0 && <div><h3 className="text-xs font-medium text-muted-foreground mb-2">Registros AET (VALE)</h3>
          <ul className="divide-y divide-border">{registros.map((r) => {
            const nome = s.funcoes.find((f) => f.id === funcaoDoRegistroAetVale(r.draft_snapshot))?.nome_funcao || "Função não identificada";
            return <li key={r.id} className="py-2 flex justify-between items-center gap-3 text-sm"><Button variant="link" className="h-auto p-0 whitespace-normal text-left justify-start break-words" onClick={() => navigate(`/documentos/aet-vale/registro/${r.id}`)}>{nome}</Button><div className="flex items-center gap-2"><Badge variant="outline" className="shrink-0">{rotuloStatusAprErgo(r.status)}</Badge><Button variant="ghost" size="icon" aria-label={`Baixar registro ${nome}`} title="Baixar PDF" disabled={r.status !== "salvo" || !!baixando} onClick={() => void baixar(r.id)}><Download className="w-4 h-4" /></Button></div></li>;
          })}</ul>
        </div>}
      </section>;
    })}</div>
    {contratoId && <div className="flex flex-col items-end gap-2 py-6"><Button disabled={!!salvando || !selecionados.length} onClick={() => { const setor = setores.find(s => selecionados.includes(s.id) && (funcSel[s.id] || []).length); if (setor) void registrar(setor); else toast.error("Selecione uma função para avançar."); }}>Avançar<ArrowRight className="w-4 h-4 ml-2" /></Button><Button variant="outline" aria-label="Plano de ação mensal" title="Plano de ação mensal" onClick={() => navigate(`/documentos/aet-vale/plano/${empresaId}/${contratoId}`)}><CalendarRange className="w-4 h-4 mr-2" />Plano de ação</Button></div>}
    <Dialog open={modal} onOpenChange={setModal}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Selecione os setores</DialogTitle></DialogHeader>
      <div className="max-h-80 overflow-y-auto space-y-2">{setores.map((s) => <label key={s.id} className="flex items-center gap-3 p-3 border border-border rounded-md cursor-pointer"><Checkbox checked={temporarios.includes(s.id)} onCheckedChange={(checked) => setTemporarios((ids) => checked === true ? [...ids.filter((id) => id !== s.id), s.id] : ids.filter((id) => id !== s.id))} /><span className="text-sm break-words">{s.ghe_ges ? `${s.ghe_ges} — ` : ""}{s.nome_setor}</span></label>)}{setores.length === 0 && <p className="text-sm text-muted-foreground">Nenhum setor cadastrado neste contrato</p>}</div>
      <DialogFooter><Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => { setSelecionados(temporarios); setModal(false); }}>OK</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
