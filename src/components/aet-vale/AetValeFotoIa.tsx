import { useRef, useState } from "react";
import { Download, Eye, Loader2, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { invocarGeracaoIa } from "@/lib/aiEdgeStream";
import { hashFotoVale, renderizarFotoAnotada } from "@/lib/aetValeFotoAnotada";
import { baixarBlobApr } from "@/lib/aprErgoPdf";
import type { AnaliseFotoVale, AnotacaoFotoVale, FotoVale } from "../../../supabase/functions/_shared/aetValeFotos";

export function AetValeFotoIa({ foto, registroId, numero, onAplicar }: { foto: FotoVale; registroId: string; numero: string; onAplicar: (fonte: string, anotacao: AnotacaoFotoVale) => void }) {
  const [gerando, setGerando] = useState(false), [aberta, setAberta] = useState(false);
  const [previa, setPrevia] = useState<{ fonte: string; anotacao: AnotacaoFotoVale } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const analisar = async () => {
    if (gerando) return;
    const fonte = foto.imagem;
    if (foto.anotacao?.registroId === registroId && foto.anotacao.fonteHash === await hashFotoVale(fonte)) {
      setPrevia(null); setAberta(true); return;
    }
    abort.current = new AbortController(); setGerando(true);
    try {
      const img = new Image(); img.src = fonte; await img.decode();
      const scale = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível preparar a foto. O original foi preservado.");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const analise = await invocarGeracaoIa<AnaliseFotoVale & { registroId: string; funcaoId: string }>("aet-vale-foto-analyze", { registroId, imagem: canvas.toDataURL("image/jpeg", .9), descricao: foto.descricao }, abort.current.signal);
      if (abort.current.signal.aborted) return;
      const imagem = await renderizarFotoAnotada(fonte, analise);
      setPrevia({ fonte, anotacao: { ...analise, imagem, fonteHash: await hashFotoVale(fonte) } }); setAberta(true);
    } catch (e) { if (!abort.current?.signal.aborted) toast.error(e instanceof Error ? e.message : "Não foi possível analisar a foto."); }
    finally { setGerando(false); }
  };
  const atual = previa?.anotacao || foto.anotacao;
  const baixar = async () => { if (!atual) return; baixarBlobApr(await (await fetch(atual.imagem)).blob(), `AET_VALE_Foto_${numero.replace(/[^a-zA-Z0-9_-]/g, "_")}_anotada.png`); };
  if (!foto.imagem) return null;
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={gerando} onClick={() => void analisar()}>{gerando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Analisar foto {numero}</Button>
      {gerando && <Button size="icon" variant="outline" aria-label="Parar análise da foto" onClick={() => abort.current?.abort()}><Square className="w-4 h-4" /></Button>}
      {foto.anotacao && <><Button size="icon" variant="outline" aria-label={`Visualizar foto anotada ${numero}`} onClick={() => { setPrevia(null); setAberta(true); }}><Eye className="w-4 h-4" /></Button><Button size="icon" variant="outline" aria-label={`Baixar foto anotada ${numero}`} onClick={() => void baixar()}><Download className="w-4 h-4" /></Button></>}
    </div>
    {foto.anotacao && <img src={foto.anotacao.imagem} alt={`Foto anotada ${numero}`} className="w-full h-auto object-contain border border-border" />}
    <Dialog open={aberta} onOpenChange={v => { setAberta(v); if (!v) setPrevia(null); }}><DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{previa ? "Prévia das marcações" : "Foto anotada"} — {numero}</DialogTitle></DialogHeader>
      {atual && <><img src={atual.imagem} alt="Prévia da foto anotada" className="w-full h-auto object-contain" />{atual.marcacoes.map((m, i) => <p key={i} className="text-sm"><strong>{i + 1}. {m.problema}</strong> — {m.melhoria}<br /><span className="text-muted-foreground">{m.evidencia}</span></p>)}{atual.observacao && <p className="text-sm">{atual.observacao}</p>}</>}
      <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => void baixar()}><Download className="w-4 h-4 mr-2" />Baixar imagem</Button>{previa && <Button onClick={() => { if (foto.imagem !== previa.fonte) { toast.error("A foto foi substituída. Analise o novo original."); return; } onAplicar(previa.fonte, previa.anotacao); setPrevia(null); setAberta(false); toast.success("Marcações aplicadas. Salve a avaliação para mantê-las."); }}>Confirmar marcações</Button>}</div>
    </DialogContent></Dialog>
  </div>;
}