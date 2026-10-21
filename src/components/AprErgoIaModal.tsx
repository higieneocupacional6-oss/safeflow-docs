import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { invocarGeracaoIa } from "@/lib/aiEdgeStream";
import { carregarBaseParaIa } from "@/lib/formularioAepBase";
import { CATEGORIAS, DURACAO, INTENSIDADE } from "@/components/formulario-aep/EtapaReconhecimento";
import { contarConflitosApr, contarConflitosResumoApr, type ResumoApr, type LinhaApr, type PropostaApr } from "../../supabase/functions/_shared/aprErgoIa";

export function AprErgoIaModal({ open, onOpenChange, registroId, basePath, linhas, cabecalho, onAplicar }: { open: boolean; onOpenChange: (v: boolean) => void; registroId: string; basePath: string; linhas: LinhaApr[]; cabecalho: ResumoApr; onAplicar: (r: PropostaApr, substituir: boolean) => void }) {
  const [relato, setRelato] = useState("");
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<PropostaApr | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const conflitos = resultado ? contarConflitosApr(linhas, resultado.linhas) + contarConflitosResumoApr(cabecalho, resultado.cabecalho) : 0;
  const gerar = async () => {
    setGerando(true);
    try {
      const base = await carregarBaseParaIa(basePath, 6);
      setResultado(await invocarGeracaoIa<PropostaApr>("apr-ergo-generate", { registroId, relato, base, criterios: { duracao: DURACAO, intensidade: INTENSIDADE, fatores: CATEGORIAS } }));
      setConfirmando(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha na geração."); }
    finally { setGerando(false); }
  };
  const aplicar = (substituir: boolean) => {
    if (!resultado) return;
    onAplicar(resultado, substituir); setResultado(null); setConfirmando(false); onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={(v) => { if (!gerando) onOpenChange(v); }}>
    <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Gerar análise APR-ERGO</DialogTitle></DialogHeader>
      {!resultado ? <>
        <Textarea aria-label="Relato da atividade" rows={8} maxLength={30000} value={relato} onChange={(e) => setRelato(e.target.value)} placeholder="Descreva a função, atividades reais, condições de trabalho e desconfortos." />
        <DialogFooter><Button variant="outline" disabled={gerando} onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={gerar} disabled={gerando || relato.trim().length < 10}>{gerando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}{gerando ? "Analisando..." : "Gerar prévia"}</Button></DialogFooter>
      </> : <>
        <h3 className="font-semibold">Prévia da análise</h3>
        {resultado.cabecalho && <div className="space-y-2 text-sm"><p><strong>Atividades/tarefas:</strong> {resultado.cabecalho.atividades || "—"}</p><p><strong>Ambiente de trabalho:</strong> {resultado.cabecalho.ambiente || "—"}</p></div>}
        <div className="divide-y divide-border">{resultado.linhas.map((l, i) => <div key={i} className="py-3 space-y-1 text-sm">
          <p className="font-medium">{i + 1}. {l.circunstancia}</p><p>{l.situacao} · {l.tipo}</p><p>{l.exigencia}</p>
          <p className="text-xs text-muted-foreground">Exposição: {l.estimativa || "—"} · Intensidade: {l.intensidade || "—"} · Severidade: {l.severidade || "—"} · Perfil: {l.perfil || "—"} · Risco: {l.classificacao || "—"}</p>
          <p>{l.recomendacoes}</p>
        </div>)}</div>
        {resultado.observacoes && <p className="text-sm text-muted-foreground">{resultado.observacoes}</p>}
        {confirmando ? <><p>{conflitos} campo(s) preenchido(s) seriam alterados.</p><DialogFooter><Button variant="outline" onClick={() => aplicar(false)}>Preencher só os vazios</Button><Button onClick={() => aplicar(true)}>Substituir</Button></DialogFooter></> : <DialogFooter><Button variant="outline" onClick={() => setResultado(null)}>Cancelar</Button><Button disabled={!resultado.linhas.length && !resultado.cabecalho?.atividades && !resultado.cabecalho?.ambiente} onClick={() => conflitos ? setConfirmando(true) : aplicar(false)}>Aplicar</Button></DialogFooter>}
      </>}
    </DialogContent>
  </Dialog>;
}