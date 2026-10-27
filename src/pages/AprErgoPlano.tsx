import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, FileDown, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { gerarPlanoAprDocx, nomeArquivoPlanoDocx } from "@/lib/aprErgoPlanoDocx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { invocarGeracaoIa } from "@/lib/aiEdgeStream";
import {
  acoesDoPlano, aplicarPropostaPlano, novaAcaoPlanoApr, prioridadeDaClassificacao,
  riscosAprParaPlano, COLUNAS_PLANO_APR, PRIORIDADES_PLANO_APR,
  type AcaoPlanoApr,
} from "@/lib/aprErgoPlano";

type StatusSalvamento = "salvo" | "pendente" | "erro";

export default function AprErgoPlano() {
  const navigate = useNavigate();
  const { empresaId = "", contratoId = "" } = useParams();
  const queryClient = useQueryClient();
  const [acoes, setAcoes] = useState<AcaoPlanoApr[]>([]);
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusSalvamento>("salvo");
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [proposta, setProposta] = useState<AcaoPlanoApr[] | null>(null);
  const carregado = useRef(false);

  const empresaQuery = useQuery({ queryKey: ["apr-plano-empresa", empresaId], enabled: !!empresaId, queryFn: async () => {
    const { data, error } = await supabase.from("empresas").select("id, razao_social, nome_fantasia").eq("id", empresaId).single();
    if (error) throw error; return data;
  } });
  const contratoQuery = useQuery({ queryKey: ["apr-plano-contrato", contratoId], enabled: !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("contratos").select("id, numero_contrato, nome_contratante").eq("id", contratoId).eq("empresa_id", empresaId).single();
    if (error) throw error; return data;
  } });
  const setoresQuery = useQuery({ queryKey: ["apr-ergo-setores", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("setores").select("id, empresa_id, contrato_id, nome_setor, ghe_ges, funcoes(id, nome_funcao)").eq("empresa_id", empresaId).eq("contrato_id", contratoId);
    if (error) throw error; return data || [];
  } });
  const registrosQuery = useQuery({ queryKey: ["apr-ergo-registros", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("documentos").select("id, draft_snapshot, status").eq("tipo", "APR-ERGO").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("created_at");
    if (error) throw error; return data || [];
  } });
  const planoQuery = useQuery({ queryKey: ["apr-ergo-plano", empresaId, contratoId], enabled: !!empresaId && !!contratoId, queryFn: async () => {
    const { data, error } = await supabase.from("documentos").select("id, draft_snapshot").eq("tipo", "APR-ERGO-PLANO").eq("empresa_id", empresaId).eq("contrato_id", contratoId).order("created_at").limit(1);
    if (error) throw error; return data?.[0] || null;
  } });
  useRealtimeSync([{ table: "documentos", queryKey: ["apr-ergo-plano"] }], "apr-ergo-plano");

  useEffect(() => {
    if (carregado.current || planoQuery.isLoading) return;
    carregado.current = true;
    if (planoQuery.data) {
      setPlanoId(planoQuery.data.id);
      setAcoes(acoesDoPlano(planoQuery.data.draft_snapshot));
    }
  }, [planoQuery.data, planoQuery.isLoading]);

  const riscos = useMemo(() => riscosAprParaPlano(registrosQuery.data || [], setoresQuery.data || []), [registrosQuery.data, setoresQuery.data]);

  const alterar = (id: string, campo: keyof AcaoPlanoApr, valor: string) => {
    setStatus("pendente");
    setAcoes((lista) => lista.map((a) => a.id === id ? { ...a, [campo]: valor } : a));
  };
  const vincularRisco = (id: string, chave: string) => {
    const risco = riscos.find((r) => `${r.documento_id}|${r.risco}` === chave);
    setStatus("pendente");
    setAcoes((lista) => lista.map((a) => a.id === id
      ? risco ? { ...a, documento_id: risco.documento_id, setor_id: risco.setor_id, setor: risco.setor, funcao_id: risco.funcao_id, funcao: risco.funcao, risco: risco.risco, prioridade: a.prioridade || prioridadeDaClassificacao(risco.classificacao) }
        : { ...a, documento_id: "", setor_id: "", setor: "", funcao_id: "", funcao: "", risco: "" }
      : a));
  };

  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);
    const id = planoId || crypto.randomUUID();
    const registro = {
      id, tipo: "APR-ERGO-PLANO", empresa_id: empresaId, contrato_id: contratoId,
      empresa_nome: empresaQuery.data?.razao_social || "",
      nome_documento: `Plano de Ação APR-ERGO — ${contratoQuery.data?.numero_contrato || contratoQuery.data?.nome_contratante || "Contrato"}`,
      status: "salvo",
      draft_snapshot: { acoes },
    };
    const { error } = await supabase.from("documentos").upsert(registro, { onConflict: "id" });
    setSalvando(false);
    if (error) { setStatus("erro"); toast.error("Não foi possível salvar o plano. Tente novamente."); return; }
    setPlanoId(id);
    setStatus("salvo");
    await queryClient.invalidateQueries({ queryKey: ["apr-ergo-plano", empresaId, contratoId] });
    toast.success("Plano de ação salvo");
  };

  const gerarIa = async () => {
    if (gerando) return;
    setGerando(true);
    try {
      const resultado = await invocarGeracaoIa<{ acoes: AcaoPlanoApr[] }>("apr-ergo-plano-generate", { empresaId, contratoId });
      const propostas = aplicarPropostaPlano((resultado?.acoes || []).map((a) => ({ ...novaAcaoPlanoApr(a.id || crypto.randomUUID()), ...a })));
      if (!propostas.length) { toast.error("A IA não encontrou ações fundamentadas nas avaliações salvas."); return; }
      setProposta(propostas);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "A geração com IA falhou. Seus dados foram mantidos.");
    } finally { setGerando(false); }
  };

  const [baixando, setBaixando] = useState(false);
  const baixarWord = async () => {
    if (!planoId || baixando) return;
    setBaixando(true);
    try {
      const { data, error } = await supabase.from("documentos").select("draft_snapshot").eq("id", planoId).eq("tipo", "APR-ERGO-PLANO").single();
      if (error) throw error;
      const empresa = empresaQuery.data?.razao_social || empresaQuery.data?.nome_fantasia || "";
      const contrato = contratoQuery.data?.numero_contrato || contratoQuery.data?.nome_contratante || "";
      const blob = await gerarPlanoAprDocx(acoesDoPlano(data.draft_snapshot), empresa, contrato);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = nomeArquivoPlanoDocx(empresa, contrato);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("Não foi possível gerar o Word. Tente novamente.");
    } finally { setBaixando(false); }
  };

  const aplicarProposta = () => {
    if (!proposta) return;
    setAcoes(proposta);
    setStatus("pendente");
    setProposta(null);
    toast.success("Plano preenchido pela IA. Revise e salve.");
  };

  const erro = empresaQuery.isError || contratoQuery.isError || setoresQuery.isError || registrosQuery.isError || planoQuery.isError;
  const carregando = empresaQuery.isLoading || contratoQuery.isLoading || setoresQuery.isLoading || registrosQuery.isLoading || planoQuery.isLoading;
  const titulo = `Plano de Ação APR-ERGO — ${empresaQuery.data?.nome_fantasia || empresaQuery.data?.razao_social || ""} · ${contratoQuery.data?.numero_contrato || contratoQuery.data?.nome_contratante || ""}`;

  return <div>
    <PageHeader title="Plano de Ação APR-ERGO" actions={<div className="flex flex-wrap gap-2 items-center">
      <span className={`text-xs ${status === "erro" ? "text-destructive" : "text-muted-foreground"}`}>{status === "salvo" ? "Salvo" : status === "pendente" ? "Alterações pendentes" : "Erro ao salvar"}</span>
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
      <Button variant="outline" disabled={gerando || carregando || !!erro} onClick={gerarIa}>{gerando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Gerar IA</Button>
      <Button className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={salvando || carregando || !!erro} onClick={salvar}>{salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
      {planoId && <Button variant="outline" disabled={baixando || status !== "salvo"} title={status !== "salvo" ? "Salve o plano antes de baixar" : undefined} onClick={baixarWord}>{baixando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}Baixar Word</Button>}
    </div>} />
    <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4" />{titulo}</p>
    {carregando ? <Loader2 className="w-6 h-6 animate-spin mx-auto my-12 text-muted-foreground" />
      : erro ? <div className="py-12 text-center space-y-3"><p>Não foi possível carregar o plano de ação.</p><Button variant="outline" onClick={() => { void empresaQuery.refetch(); void contratoQuery.refetch(); void setoresQuery.refetch(); void registrosQuery.refetch(); void planoQuery.refetch(); }}>Tentar novamente</Button></div>
      : <>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full table-fixed min-w-[1400px] text-xs border-collapse">
            <thead className="bg-muted"><tr>
              <th className="p-2 text-left border border-border w-36">Setor</th>
              <th className="p-2 text-left border border-border w-36">Função</th>
              <th className="p-2 text-left border border-border w-52">Risco identificado</th>
              <th className="p-2 text-left border border-border w-24">Prioridade</th>
              {COLUNAS_PLANO_APR.map(([k, titulo]) => <th key={k} className="p-2 text-left border border-border">{titulo}</th>)}
              <th className="p-2 text-left border border-border">Resultado esperado</th>
              <th className="w-10 border border-border"><span className="sr-only">Excluir</span></th>
            </tr></thead>
            <tbody>{acoes.map((a, i) => <tr key={a.id} className="align-top">
              <td className="p-1 border border-border"><Textarea aria-label={`Setor — ação ${i + 1}`} rows={3} value={a.setor} onChange={(e) => alterar(a.id, "setor", e.target.value)} /></td>
              <td className="p-1 border border-border"><Textarea aria-label={`Função — ação ${i + 1}`} rows={3} value={a.funcao} onChange={(e) => alterar(a.id, "funcao", e.target.value)} /></td>
              <td className="p-1 border border-border">
                <select aria-label={`Risco vinculado — ação ${i + 1}`} className="w-full border border-input bg-background rounded-md p-1 mb-1" value={a.documento_id && a.risco ? `${a.documento_id}|${a.risco}` : ""} onChange={(e) => vincularRisco(a.id, e.target.value)}>
                  <option value="">Selecione o risco</option>
                  {riscos.map((r) => <option key={`${r.documento_id}|${r.risco}`} value={`${r.documento_id}|${r.risco}`}>{r.setor} · {r.funcao || "Função"} · {r.risco.slice(0, 80)} ({r.classificacao})</option>)}
                  {a.documento_id && a.risco && !riscos.some((r) => r.documento_id === a.documento_id && r.risco === a.risco) && <option value={`${a.documento_id}|${a.risco}`}>{a.risco.slice(0, 80)} (vinculado)</option>}
                </select>
                <Textarea aria-label={`Risco identificado — ação ${i + 1}`} rows={3} value={a.risco} onChange={(e) => alterar(a.id, "risco", e.target.value)} />
              </td>
              <td className="p-1 border border-border">
                <select aria-label={`Prioridade — ação ${i + 1}`} className="w-full border border-input bg-background rounded-md p-1" value={a.prioridade} onChange={(e) => alterar(a.id, "prioridade", e.target.value)}>
                  <option value="">—</option>
                  {PRIORIDADES_PLANO_APR.map((p) => <option key={p} value={p}>{p}</option>)}
                  {a.prioridade && !PRIORIDADES_PLANO_APR.includes(a.prioridade as typeof PRIORIDADES_PLANO_APR[number]) && <option value={a.prioridade}>{a.prioridade}</option>}
                </select>
              </td>
              {COLUNAS_PLANO_APR.map(([k, titulo]) => <td key={k} className="p-1 border border-border">
                <Textarea aria-label={`${titulo} — ação ${i + 1}`} rows={3} value={a[k]} onChange={(e) => alterar(a.id, k, e.target.value)} />
                {["quando", "quem", "quanto"].includes(k) && !a[k].trim() && <span className="text-muted-foreground block mt-1">A definir</span>}
              </td>)}
              <td className="p-1 border border-border"><Textarea aria-label={`Resultado esperado — ação ${i + 1}`} rows={3} value={a.resultado_esperado} onChange={(e) => alterar(a.id, "resultado_esperado", e.target.value)} /></td>
              <td className="p-1 border border-border"><Button variant="ghost" size="icon" aria-label={`Excluir ação ${i + 1}`} onClick={() => { setStatus("pendente"); setAcoes((lista) => lista.filter((x) => x.id !== a.id)); }}><Trash2 className="w-4 h-4" /></Button></td>
            </tr>)}
            {acoes.length === 0 && <tr><td colSpan={13} className="p-6 text-center text-muted-foreground">Nenhuma ação cadastrada. Adicione manualmente ou use Gerar IA.</td></tr>}
            </tbody>
          </table>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => { setStatus("pendente"); setAcoes((lista) => [...lista, novaAcaoPlanoApr(crypto.randomUUID())]); }}><Plus className="w-4 h-4 mr-2" />Adicionar ação</Button>
      </>}
    <Dialog open={!!proposta} onOpenChange={(o) => !o && setProposta(null)}>
      <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Aplicar plano gerado pela IA?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">A IA propôs {proposta?.length || 0} ação(ões) a partir das APR-ERGO salvas. {acoes.length > 0 ? "As ações atuais serão substituídas." : ""} Revise e salve para gravar.</p>
        <DialogFooter><Button variant="outline" onClick={() => setProposta(null)}>Descartar</Button><Button onClick={aplicarProposta}>Aplicar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
