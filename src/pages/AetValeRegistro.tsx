import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Download, ImagePlus, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { CORES_NIVEL_RISCO } from "@/lib/aepRisco";
import { dadosVaziosAetVale, ORIGENS_DEMANDA, type AetValeDados } from "@/lib/aetVale";
import { AetValeEtapa2 } from "@/components/aet-vale/AetValeEtapa2";
import { AetValeIaModal } from "@/components/aet-vale/AetValeIaModal";
import { AetValePlano } from "@/components/aet-vale/AetValePlano";
import { AetValeFotoIa } from "@/components/aet-vale/AetValeFotoIa";
import { aplicarAnotacaoFoto, substituirFotoVale } from "../../supabase/functions/_shared/aetValeFotos";
import { gerarPdfVale, nomePdfVale } from "@/lib/aetValePdf";
import { baixarBlobApr } from "@/lib/aprErgoPdf";
import { fatoresVale, riscosAprValeAltos, mesclarEtapa2, aplicarPropostaVale } from "../../supabase/functions/_shared/aetValeIa";

const lerFoto = (file: File) => new Promise<string>((resolve, reject) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
    reject(new Error("Selecione uma foto JPEG, PNG ou WebP de até 8 MB.")); return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    resolve(String(reader.result));
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function AetValeRegistro() {
  const { registroId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dados, setDados] = useState<AetValeDados | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [iaAberta, setIaAberta] = useState(false);
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);
  const inputsFoto = useRef<(HTMLInputElement | null)[]>([]);

  const registroQuery = useQuery({ queryKey: ["aet-vale-registro", registroId], enabled: !!registroId, queryFn: async () => {
    const { data, error } = await supabase.from("documentos").select("id, empresa_id, contrato_id, empresa_nome, draft_snapshot, status").eq("id", registroId || "").eq("tipo", "AET-VALE").single();
    if (error) throw error;
    return data;
  } });
  const snap = (registroQuery.data?.draft_snapshot || {}) as { setor_id?: string; funcao_id?: string; dados?: Partial<AetValeDados> };
  const setorQuery = useQuery({ queryKey: ["aet-vale-setor", snap.setor_id], enabled: !!snap.setor_id, queryFn: async () => {
    const { data, error } = await supabase.from("setores").select("id, nome_setor, ghe_ges, descricao_ambiente").eq("id", snap.setor_id || "").eq("empresa_id", registroQuery.data?.empresa_id || "").eq("contrato_id", registroQuery.data?.contrato_id || "").single();
    if (error) throw error;
    return data;
  } });
  const funcaoQuery = useQuery({ queryKey: ["aet-vale-funcao", snap.funcao_id], enabled: !!snap.funcao_id, queryFn: async () => {
    const { data, error } = await supabase.from("funcoes").select("id, nome_funcao, descricao_atividades").eq("id", snap.funcao_id || "").eq("setor_id", snap.setor_id || "").single();
    if (error) throw error;
    return data;
  } });
  const aepQuery = useQuery({ queryKey: ["aet-vale-aep-reg", registroQuery.data?.empresa_id, registroQuery.data?.contrato_id], enabled: !!registroQuery.data?.empresa_id && !!registroQuery.data?.contrato_id, queryFn: async () => {
    const registro = registroQuery.data;
    if (!registro?.empresa_id || !registro.contrato_id) return [];
    const { data, error } = await supabase.from("aep_documentos").select("id, setores, updated_at").eq("empresa_id", registro.empresa_id).eq("contrato_id", registro.contrato_id).order("updated_at", { ascending: false });
    if (error) throw error; return data || [];
  } });
  const aprQuery = useQuery({ queryKey: ["aet-vale-aprs", registroQuery.data?.empresa_id, registroQuery.data?.contrato_id, snap.setor_id], enabled: !!registroQuery.data?.empresa_id && !!registroQuery.data?.contrato_id && !!snap.setor_id, refetchInterval: 30000, queryFn: async () => {
    const registro = registroQuery.data;
    if (!registro?.empresa_id || !registro.contrato_id) return [];
    const { data, error } = await supabase.from("documentos").select("id, draft_snapshot").eq("tipo", "APR-ERGO").eq("status", "salvo").eq("empresa_id", registro.empresa_id).eq("contrato_id", registro.contrato_id).contains("draft_snapshot", { setor_id: snap.setor_id });
    if (error) throw error;
    return data || [];
  } });

  useEffect(() => {
    if (!registroQuery.data || dados) return;
    if (snap.funcao_id && funcaoQuery.isLoading) return;
    const base = dadosVaziosAetVale(funcaoQuery.data?.nome_funcao || "");
    const salvo = snap.dados || {};
    const fotos = Array.isArray(salvo.fotos) && salvo.fotos.length
      ? salvo.fotos
      : base.fotos;
    setDados({ ...base, ...salvo, origens: Array.isArray(salvo.origens) ? salvo.origens : [], fotos, etapa2: mesclarEtapa2(salvo.etapa2) });
  }, [registroQuery.data, funcaoQuery.data, funcaoQuery.isLoading, dados, snap]);

  const set = <K extends keyof AetValeDados>(campo: K, valor: AetValeDados[K]) =>
    setDados((d) => (d ? { ...d, [campo]: valor } : d));

  const setFoto = (idx: number, parcial: Partial<{ imagem: string; descricao: string }>) =>
    setDados((d) => {
      if (!d) return d;
      const fotos = d.fotos.map((f, i) => (i === idx ? { ...f, ...parcial } : f));
      return { ...d, fotos };
    });

  const escolherFoto = async (idx: number, file?: File | null) => {
    if (!file) return;
    try { const imagem = await lerFoto(file); setDados(d => d ? { ...d, fotos: d.fotos.map((f,i) => i === idx ? substituirFotoVale(f,imagem) : f) } : d); }
    catch { toast.error("Não foi possível ler a foto selecionada."); }
  };

  const salvar = async () => {
    if (!dados || !registroQuery.data || salvando) return;
    setSalvando(true);
    try {
      const nome = `AET (VALE) — ${setorQuery.data?.nome_setor || "Setor"} — ${dados.cargo || funcaoQuery.data?.nome_funcao || "Função"}`;
      const { error } = await supabase.from("documentos")
        .update({ draft_snapshot: { ...snap, setor_id: snap.setor_id, funcao_id: snap.funcao_id, dados }, status: "salvo", nome_documento: nome })
        .eq("id", registroQuery.data.id).eq("tipo", "AET-VALE").eq("empresa_id", registroQuery.data.empresa_id || "").eq("contrato_id", registroQuery.data.contrato_id || "");
      if (error) throw error;
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["aet-vale-registro", registroId] }), queryClient.invalidateQueries({ queryKey: ["aet-vale-registros"] }), queryClient.invalidateQueries({ queryKey: ["documentos"] })]);
      toast.success("Registro AET (VALE) salvo");
    } catch { toast.error("Não foi possível salvar. Tente novamente."); }
    finally { setSalvando(false); }
  };

  useRealtimeSync([{ table: "documentos", queryKey: ["aet-vale-aprs"] }], "aet-vale-aprs-registro");
  const riscosAep = riscosAprValeAltos(aprQuery.data || [], { setorId: snap.setor_id || "", funcaoId: snap.funcao_id || "", funcaoNome: funcaoQuery.data?.nome_funcao || "" });
  const fatores = fatoresVale(aprQuery.data || [], aepQuery.data || [], { setorId: snap.setor_id || "", funcaoId: snap.funcao_id || "", funcaoNome: funcaoQuery.data?.nome_funcao || "", setorNome: setorQuery.data?.nome_setor, ghe: setorQuery.data?.ghe_ges || "" });
  const irPara = (v: number) => { setEtapa(v); window.scrollTo({ top: 0, behavior: "auto" }); };

  if (registroQuery.isLoading || !dados) {
    if (registroQuery.isError) return <div className="py-8 space-y-4"><p>Não foi possível abrir este registro AET (VALE).</p><Button variant="outline" onClick={() => navigate("/documentos/aet-vale")}>Voltar</Button></div>;
    return <Loader2 className="w-6 h-6 animate-spin mx-auto my-12" />;
  }

  return <div className="max-w-5xl">
    <PageHeader title="AET (VALE) — Registro" description={`${registroQuery.data?.empresa_nome || ""}`} actions={<div className="flex gap-2">
      {etapa === 1 && <Button variant="outline" onClick={() => setIaAberta(true)}><Sparkles className="w-4 h-4 mr-2" />Gerar IA</Button>}
      <Button variant="outline" onClick={() => navigate("/documentos/aet-vale")}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
      <Button onClick={() => void salvar()} disabled={salvando}>{salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
      <Button variant="outline" size="icon" aria-label="Baixar PDF" title="Baixar PDF" disabled={aepQuery.isLoading || aprQuery.isLoading || aepQuery.isError || aprQuery.isError} onClick={() => {
        try { baixarBlobApr(gerarPdfVale(dados, registroQuery.data?.empresa_nome || "", fatores, riscosAep), nomePdfVale(registroQuery.data?.empresa_nome || "", funcaoQuery.data?.nome_funcao || dados.cargo)); }
        catch { toast.error("Não foi possível gerar o PDF. Seus dados foram mantidos."); }
      }}><Download className="w-4 h-4" /></Button>
    </div>} />

    {etapa === 1 ? <><section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-4">
      <h2 className="font-heading font-semibold">Dados gerais</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Gerência de área</Label><Input value={dados.gerencia_area} onChange={(e) => set("gerencia_area", e.target.value)} /></div>
        <div className="space-y-2"><Label>Data da avaliação</Label><Input type="date" value={dados.data_avaliacao} onChange={(e) => set("data_avaliacao", e.target.value)} /></div>
        <div className="space-y-2"><Label>Revisão</Label><Input value={dados.revisao} onChange={(e) => set("revisao", e.target.value)} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Descrição do ambiente</Label><Textarea rows={3} value={dados.descricao_ambiente} onChange={(e) => set("descricao_ambiente", e.target.value)} /></div>
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-4">
      <h2 className="font-heading font-semibold">Identificação</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nome do GERE</Label><Input value={dados.nome_gere} onChange={(e) => set("nome_gere", e.target.value)} /></div>
        <div className="space-y-2"><Label>Jornada de trabalho</Label><Input value={dados.jornada} onChange={(e) => set("jornada", e.target.value)} /></div>
        <div className="space-y-2"><Label>Cargo analisado</Label><Input value={dados.cargo} onChange={(e) => set("cargo", e.target.value)} /></div>
        <div className="space-y-2"><Label>Tarefa analisada</Label><Input value={dados.tarefa_analisada} onChange={(e) => set("tarefa_analisada", e.target.value)} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Descrição do cargo</Label><Textarea rows={3} value={dados.descricao_cargo} onChange={(e) => set("descricao_cargo", e.target.value)} /></div>
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-4">
      <h2 className="font-heading font-semibold">Dados da AEP</h2>
      <p className="text-xs text-muted-foreground">Riscos da APR-ERGO salva da mesma empresa, contrato, setor e função.</p>
      {aprQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando riscos…</p>}
      {aprQuery.isError && <p className="text-sm text-destructive">Não foi possível consultar os riscos da APR-ERGO.</p>}
      {!aprQuery.isLoading && !aprQuery.isError && riscosAep.length === 0 && <p className="text-sm text-muted-foreground">Nenhum risco Alto ou Muito Alto foi identificado nos registros da APR-ERGO consultados.</p>}
      {riscosAep.length > 0 && <div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-xs">
        <thead><tr className="bg-muted text-left">
          <th className="p-2 font-semibold">Tipo</th><th className="p-2 font-semibold">Fator de risco</th>
          <th className="p-2 font-semibold">Exposição</th><th className="p-2 font-semibold">Severidade</th>
          <th className="p-2 font-semibold">Nível</th><th className="p-2 font-semibold">Situação</th><th className="p-2 font-semibold">Recomendações</th>
        </tr></thead>
        <tbody>{riscosAep.map((r, i) => <tr key={i} className="border-t border-border align-top">
          <td className="p-2">{r.tipo || "—"}</td>
          <td className="p-2 whitespace-pre-wrap">{r.circunstancia || "—"}</td>
          <td className="p-2">{r.estimativa || "—"}</td>
          <td className="p-2">{r.severidade || "—"}</td>
          <td className="p-2">{r.classificacao ? <span className={`inline-block px-2 py-1 rounded-md border font-semibold ${CORES_NIVEL_RISCO[r.classificacao === "Muito Alto" ? "Crítico" : "Alto"]}`}>{r.classificacao}</span> : "—"}</td>
          <td className="p-2 whitespace-pre-wrap">{r.situacao || "—"}</td>
          <td className="p-2 whitespace-pre-wrap">{r.recomendacoes || "—"}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    <section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-4">
      <h2 className="font-heading font-semibold">Origem da demanda</h2>
      <div className="flex flex-wrap gap-4">{ORIGENS_DEMANDA.map((o) => <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox checked={dados.origens.includes(o)} onCheckedChange={(c) => set("origens", c === true ? [...new Set([...dados.origens, o])] : dados.origens.filter((x) => x !== o))} aria-label={o} />{o}
      </label>)}</div>
      <div className="space-y-2"><Label>Detalhamento da origem</Label><Textarea rows={2} value={dados.origem_detalhe} onChange={(e) => set("origem_detalhe", e.target.value)} /></div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-4">
      <h2 className="font-heading font-semibold">Campos de análise</h2>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Demanda ergonômica</Label><Textarea rows={3} value={dados.demanda_ergonomica} onChange={(e) => set("demanda_ergonomica", e.target.value)} /></div>
        <div className="space-y-2"><Label>Descrição da tarefa</Label><Textarea rows={3} value={dados.descricao_tarefa} onChange={(e) => set("descricao_tarefa", e.target.value)} /></div>
        <div className="space-y-2"><Label>Análise da atividade</Label><Textarea rows={4} value={dados.analise_atividade} onChange={(e) => set("analise_atividade", e.target.value)} /></div>
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-4">
      <h2 className="font-heading font-semibold">Registro fotográfico</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{dados.fotos.map((foto, idx) => <div key={idx} className="space-y-2">
        <input ref={(el) => { inputsFoto.current[idx] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { void escolherFoto(idx, e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" onClick={() => (foto.imagem ? setFotoAberta(foto.imagem) : inputsFoto.current[idx]?.click())} className="w-full rounded-md border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "5.27 / 3.96" }} aria-label={`Foto ${idx + 1}`}>
          {foto.imagem ? <img src={foto.imagem} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" /> : <span className="flex flex-col items-center gap-2 text-muted-foreground text-xs"><ImagePlus className="w-6 h-6" />Adicionar foto</span>}
        </button>
        {foto.imagem && <Button type="button" variant="outline" size="sm" onClick={() => inputsFoto.current[idx]?.click()}>Substituir foto</Button>}
        <Input placeholder="Descrição da foto" value={foto.descricao} onChange={(e) => setFoto(idx, { descricao: e.target.value })} />
        {registroId && <AetValeFotoIa foto={foto} registroId={registroId} numero={`1-${idx+1}`} onAplicar={(fonte, anotacao) => setDados(d => d ? { ...d, fotos: d.fotos.map((f,i) => i === idx ? aplicarAnotacaoFoto(f,fonte,anotacao) : f) } : d)} />}
      </div>)}</div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4 space-y-4 mb-6">
      <h2 className="font-heading font-semibold">Verbalização</h2>
      <div className="space-y-2"><Label>Verbalização do Empregado</Label><Textarea rows={4} value={dados.verbalizacao} onChange={(e) => set("verbalizacao", e.target.value)} /></div>
    </section>
    </> : etapa === 2 ? <AetValeEtapa2 registroId={registroId} dados={dados.etapa2} fatores={fatores} onChange={v => set("etapa2", v)} onFoto={async (idx, file) => {
      try { const imagem = await lerFoto(file); setDados(d => d ? { ...d, etapa2: { ...d.etapa2, fotos: d.etapa2.fotos.map((f, i) => i === idx ? substituirFotoVale(f, imagem) : f) } } : d); }
      catch { toast.error("Não foi possível ler a foto selecionada."); }
    }} /> : <AetValePlano dados={dados.etapa2} fatores={fatores} onChange={v => set("etapa2", v)} />}

    <div className="flex justify-between">
      {etapa > 1 && <Button variant="outline" onClick={() => irPara(etapa - 1)}><ArrowLeft className="w-4 h-4 mr-2" />Anterior</Button>}
      <Button variant="outline" onClick={() => void salvar()} disabled={salvando}>{salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
      {etapa < 3 && <Button onClick={() => irPara(etapa + 1)}>Próximo<ArrowRight className="w-4 h-4 ml-2" /></Button>}
    </div>
    {registroId && <AetValeIaModal open={iaAberta} onOpenChange={setIaAberta} registroId={registroId} dados={dados} onAplicar={(p, substituir) => { setDados(d => d ? aplicarPropostaVale(d, p, substituir) : d); toast.success("Proposta aplicada. Revise os campos e salve a AET."); }} />}

    <Dialog open={!!fotoAberta} onOpenChange={(o) => !o && setFotoAberta(null)}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Foto</DialogTitle></DialogHeader>
      {fotoAberta && <img src={fotoAberta} alt="Foto ampliada" className="w-full h-auto object-contain" />}
    </DialogContent></Dialog>
  </div>;
}
