import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileCheck2, Loader2, Save, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AetValeCronograma } from "@/components/aet-vale/AetValeCronograma";
import { invocarGeracaoIa } from "@/lib/aiEdgeStream";
import { baixarBlobApr } from "@/lib/aprErgoPdf";
import { renderPlanoValeTemplate } from "@/lib/aetValePlanoTemplate";
import { cronogramaVazio, mesclarAcoesMensais, type CronogramaVale, type AcaoMensalVale } from "../../supabase/functions/_shared/aetValeCronograma";

export default function AetValePlanoContrato() {
  const {empresaId,contratoId}=useParams(); const navigate=useNavigate(); const qc=useQueryClient();
  const [plano,setPlano]=useState<CronogramaVale|null>(null), [salvando,setSalvando]=useState(false), [gerando,setGerando]=useState(false), [exportando,setExportando]=useState(false), [proposta,setProposta]=useState<AcaoMensalVale[]|null>(null), [validado,setValidado]=useState(false);
  const controle=useRef<AbortController|null>(null); const documentoId=useRef<string|null>(null); const versao=useRef<number|null>(null);
  const contexto=useQuery({queryKey:["aet-vale-plano",empresaId,contratoId],enabled:!!empresaId && !!contratoId,queryFn:async()=>{
    const [empresa,contrato,docs,templates]=await Promise.all([
      supabase.from("empresas").select("*").eq("id",empresaId || "").single(),
      supabase.from("contratos").select("*").eq("id",contratoId || "").eq("empresa_id",empresaId || "").single(),
      supabase.from("documentos").select("id,draft_snapshot,row_version").eq("tipo","AET-VALE-PLANO").eq("empresa_id",empresaId || "").eq("contrato_id",contratoId || "").order("created_at"),
      supabase.from("templates").select("id,title,file_path").order("created_at",{ascending:false}),
    ]);
    if(empresa.error || contrato.error || docs.error || templates.error) throw new Error("Não foi possível abrir o plano.");
    return {empresa:empresa.data,contrato:contrato.data,doc:docs.data?.[0],templates:templates.data || []};
  }});
  useEffect(()=>{ if(plano || !contexto.data) return; const d=contexto.data.doc; documentoId.current=d?.id || null; versao.current=d?.row_version || null; const snap=d?.draft_snapshot as {cronograma?:CronogramaVale}|null; setPlano({...cronogramaVazio(),...snap?.cronograma}); },[contexto.data,plano]);
  useEffect(()=>()=>controle.current?.abort(),[]);
  const alterar=(v:CronogramaVale)=>{setPlano(v);setValidado(false);};
  const salvar=async()=>{
    if(!plano || !contexto.data || !empresaId || !contratoId || salvando) return;
    setSalvando(true);
    try {
      const patch={draft_snapshot:{cronograma:plano} as unknown as Json,template_id:plano.templateId || null,status:"salvo",nome_documento:"AET (VALE) — Plano de ação"};
      if(documentoId.current) {
        let q=supabase.from("documentos").update(patch).eq("id",documentoId.current).eq("tipo","AET-VALE-PLANO").eq("empresa_id",empresaId).eq("contrato_id",contratoId);
        if(versao.current !== null) q=q.eq("row_version",versao.current);
        const {data,error}=await q.select("row_version").single();
        if(error || !data) throw new Error("O plano foi alterado por outro usuário ou não pôde ser salvo. Seus dados permanecem nesta tela.");
        versao.current=data.row_version;
      } else {
        const id=crypto.randomUUID();
        const {data,error}=await supabase.from("documentos").insert({...patch,id,tipo:"AET-VALE-PLANO",empresa_id:empresaId,contrato_id:contratoId,empresa_nome:contexto.data.empresa.razao_social}).select("row_version").single();
        if(error) throw error; documentoId.current=id; versao.current=data.row_version;
      }
      await qc.invalidateQueries({queryKey:["aet-vale-plano",empresaId,contratoId]}); toast.success("Plano de ação salvo");
    } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar o plano."); } finally {setSalvando(false);}
  };
  const gerar=async()=>{ if(!empresaId || !contratoId || gerando) return; controle.current=new AbortController(); setGerando(true); try { const p=await invocarGeracaoIa<{acoes:AcaoMensalVale[]}>("aet-vale-plano-generate",{empresaId,contratoId},controle.current.signal); setProposta(p.acoes); } catch(e) { if(!controle.current.signal.aborted) toast.error(e instanceof Error ? e.message : "Não foi possível gerar o plano."); } finally {setGerando(false);} };
  const exportar=async(baixar:boolean)=>{ if(!plano || !contexto.data) return; const t=contexto.data.templates.find(t=>t.id===plano.templateId); if(!t) return; setExportando(true); try { const blob=await renderPlanoValeTemplate(t,plano,contexto.data.empresa,contexto.data.contrato); setValidado(true); if(baixar) baixarBlobApr(blob,`AET_VALE_Plano_${contexto.data.empresa.razao_social.replace(/[^a-zA-Z0-9]/g,"_")}.docx`); else toast.success("Template validado"); } catch(e) {toast.error(e instanceof Error ? e.message : "Não foi possível gerar o documento.");} finally {setExportando(false);} };
  if(contexto.isError) return <div className="py-8"><p>Não foi possível abrir o plano de ação.</p><Button onClick={()=>void contexto.refetch()}>Tentar novamente</Button></div>;
  if(!plano || !contexto.data) return <Loader2 className="w-6 h-6 animate-spin m-8" />;
  const candidatos=contexto.data.templates.filter(t=>/aet|ergon/i.test(t.title)); const templates=candidatos.length ? candidatos : contexto.data.templates;
  return <div><PageHeader title="AET (VALE) — Plano de ação" description={`${contexto.data.empresa.razao_social} — ${contexto.data.contrato.numero_contrato || ""}`} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>navigate("/documentos/aet-vale")}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>{gerando ? <Button variant="outline" onClick={()=>controle.current?.abort()}><Square className="w-4 h-4 mr-2" />Parar</Button> : <Button variant="outline" onClick={()=>void gerar()}><Sparkles className="w-4 h-4 mr-2" />Gerar IA</Button>}<Button disabled={salvando} onClick={()=>void salvar()}>{salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button></div>} />
    {gerando && <p className="text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Analisando avaliações salvas…</p>}
    <AetValeCronograma dados={plano} onChange={alterar} />
    <section className="py-6 space-y-4 border-t border-border"><h2 className="font-heading font-semibold">Template AET</h2><Select value={plano.templateId} onValueChange={v=>alterar({...plano,templateId:v})}><SelectTrigger className="max-w-lg" aria-label="Template AET"><SelectValue placeholder="Escolher template" /></SelectTrigger><SelectContent>{templates.map(t=><SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select>{!templates.length && <p className="text-sm text-muted-foreground">Nenhum template cadastrado.</p>}<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!plano.templateId || exportando} onClick={()=>void exportar(false)}><FileCheck2 className="w-4 h-4 mr-2" />Validar documento</Button><Button disabled={!validado || exportando} onClick={()=>void exportar(true)}><Download className="w-4 h-4 mr-2" />Gerar documento</Button></div></section>
    <Dialog open={proposta!==null} onOpenChange={v=>!v && setProposta(null)}><DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Prévia do plano de ação</DialogTitle></DialogHeader>{proposta?.length===0 && <p>Nenhuma nova ação fundamentada foi identificada.</p>}{proposta?.map(a=><div key={a.id} className="border-b border-border py-2 text-sm"><strong>{a.funcao} — {a.risco}</strong><p className="whitespace-pre-wrap">{a.o_que}</p><p>{a.por_que}</p><p>{a.como}</p></div>)}<DialogFooter><Button variant="outline" onClick={()=>setProposta(null)}>Cancelar</Button><Button onClick={()=>{alterar(mesclarAcoesMensais(plano,proposta || []));setProposta(null);}}>Adicionar ações</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}