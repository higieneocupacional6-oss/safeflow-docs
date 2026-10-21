import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ImagePlus, Loader2, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BaseAepModal } from "@/components/formulario-aep/FormularioAepIa";
import { AprErgoIaModal } from "@/components/AprErgoIaModal";
import { aplicarPropostaApr, aplicarResumoApr, recalcularLinhaApr, MAX_BASE_APR, type PropostaApr } from "../../supabase/functions/_shared/aprErgoIa";
import { SITUACOES_APR, TIPOS_APR, ESTIMATIVAS_APR, INTENSIDADES_APR, SEVERIDADES_APR, MEDIDAS_APR, exigenciasDaSituacao } from "../../supabase/functions/_shared/aprErgoPlanilha";

const LISTAS: Partial<Record<keyof Linha, (l: Linha) => readonly string[]>> = {
  situacao: () => SITUACOES_APR, tipo: () => TIPOS_APR, exigencia: (l) => exigenciasDaSituacao(l.situacao),
  estimativa: () => ESTIMATIVAS_APR.map((e) => e[0]), intensidade: () => INTENSIDADES_APR.map((e) => e[0]), severidade: () => SEVERIDADES_APR.map((e) => e[1]),
};
const AUTOMATICOS: (keyof Linha)[] = ["perfil", "classificacao"];

type Linha = { cenario: string; circunstancia: string; situacao: string; exigencia: string; tipo: string; medidas: string; estimativa: string; intensidade: string; perfil: string; severidade: string; classificacao: string; fotos: string[]; recomendacoes: string };
type Cabecalho = { empresa: string; data: string; pessoas: string; localSso: string; localFisico: string; gere: string; gerencia: string; cargo: string; funcao: string; atividades: string; ambiente: string; elaborador: string };
const linhaVazia = (): Linha => ({ cenario: "", circunstancia: "", situacao: "", exigencia: "", tipo: "", medidas: "", estimativa: "", intensidade: "", perfil: "", severidade: "", classificacao: "", fotos: [], recomendacoes: "" });
const COLUNAS: { key: keyof Linha; titulo: string; w: string; destaque?: boolean }[] = [
  { key: "cenario", titulo: "Cenário", w: "3%" },
  { key: "circunstancia", titulo: "Circunstância/Fonte de Exigência Ergonômica (DESCRITO PELO ERGONOMISTA)", w: "9%" },
  { key: "situacao", titulo: "Situação Ergonômica", w: "8%" },
  { key: "exigencia", titulo: "Exigencia Ergonômica (esta na tabela)", w: "9%" },
  { key: "tipo", titulo: "Tipo de risco", w: "5%" },
  { key: "medidas", titulo: "Medidas de Controle Existentes (esta na aba Medidas de controle)", w: "9%" },
  { key: "estimativa", titulo: "Estimativa do Tempo de Exposição", w: "7%" },
  { key: "intensidade", titulo: "Intensidade /Nível", w: "10%" },
  { key: "perfil", titulo: "Perfil da Exposição", w: "5%", destaque: true },
  { key: "severidade", titulo: "Severidade", w: "9%" },
  { key: "classificacao", titulo: "Classificação do Risco", w: "5%", destaque: true },
  { key: "fotos", titulo: "Foto da Exigência Ergonômica", w: "8%" },
  { key: "recomendacoes", titulo: "Recomendações / Sugestões / Observações", w: "13%" },
];

function reduzirImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 480, s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const context = c.getContext("2d");
      if (!context) { URL.revokeObjectURL(url); reject(new Error("Não foi possível carregar a foto.")); return; }
      context.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagem inválida")); };
    img.src = url;
  });
}

const cel = "border border-foreground/70";
const inp = "block w-full h-full min-w-0 bg-transparent outline-none resize-none text-[11px] leading-[1.25] p-1 focus:bg-primary/5 break-words";
const riscoClasse = (nivel: string) => ({ BAIXO: "apr-risco-baixo", "MÉDIO": "apr-risco-medio", ALTO: "apr-risco-alto", "MUITO ALTO": "apr-risco-muito-alto" }[nivel] || "");
function ajustarAltura(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function AprErgoRegistro() {
  const { registroId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cab, setCab] = useState<Cabecalho | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([linhaVazia(), linhaVazia()]);
  const [salvando, setSalvando] = useState(false);
  const [baseOpen, setBaseOpen] = useState(false);
  const [iaOpen, setIaOpen] = useState(false);
  const [fontesIa, setFontesIa] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const alvoFoto = useRef<number>(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["apr-ergo-registro", registroId], enabled: !!registroId,
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos").select("id, empresa_id, contrato_id, empresa_nome, draft_snapshot").eq("id", registroId || "").eq("tipo", "APR-ERGO").single();
      if (error) throw error;
      const snap = (data.draft_snapshot || {}) as Record<string, unknown>;
      let setorNome = "";
      let cargos: string[] = [];
      if (typeof snap.setor_id === "string") {
        const { data: s, error: setorError } = await supabase.from("setores").select("nome_setor, ghe_ges, funcoes(nome_funcao)").eq("id", snap.setor_id).eq("empresa_id", data.empresa_id || "").eq("contrato_id", data.contrato_id || "").maybeSingle();
        if (setorError) throw setorError;
        setorNome = s ? `${s.ghe_ges ? `${s.ghe_ges} — ` : ""}${s.nome_setor}` : "";
        cargos = [...new Set((s?.funcoes || []).map((f) => f.nome_funcao))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      }
      return { ...data, snap, setorNome, cargos };
    },
  });

  useEffect(() => {
    if (!data || cab) return;
    const t = (data.snap.tabela || {}) as { cabecalho?: Cabecalho; linhas?: Linha[] };
    setCab({ empresa: data.empresa_nome || "", data: "", pessoas: "", localSso: "", localFisico: "", gere: data.setorNome, gerencia: "", cargo: "", funcao: "", atividades: "", ambiente: "", elaborador: "", ...(t.cabecalho || {}) });
    if (t.linhas?.length) setLinhas(t.linhas.map((l) => recalcularLinhaApr({ ...linhaVazia(), ...l })));
    if (Array.isArray(data.snap.apr_fontes_aep)) setFontesIa(data.snap.apr_fontes_aep.filter((id): id is string => typeof id === "string"));
  }, [data, cab]);

  const setLinha = (i: number, k: keyof Linha, v: string) => setLinhas((ls) => ls.map((l, j) => {
    if (j !== i) return l;
    const nova = { ...l, [k]: v };
    if (k === "situacao" && l.exigencia && !exigenciasDaSituacao(v).includes(l.exigencia)) nova.exigencia = "";
    return recalcularLinhaApr(nova);
  }));
  const setC = (k: keyof Cabecalho, v: string) => setCab((c) => (c ? { ...c, [k]: v } : c));

  const onFotos = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const novas = await Promise.all(Array.from(files).filter((f) => f.type.startsWith("image/")).map(reduzirImagem));
      const i = alvoFoto.current;
      setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, fotos: [...l.fotos, ...novas] } : l)));
    } catch { toast.error("Não foi possível carregar a imagem."); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const salvar = async () => {
    if (!data || !cab) return;
    setSalvando(true);
    try {
      const { data: saved, error } = await supabase.from("documentos").update({ draft_snapshot: { ...data.snap, apr_fontes_aep: fontesIa, tabela: { cabecalho: { ...cab, cargo: data.cargos.join("; ") }, linhas } } }).eq("id", data.id).eq("tipo", "APR-ERGO").select("id").single();
      if (error || !saved) throw new Error("Não foi possível salvar. Tente novamente.");
      qc.invalidateQueries({ queryKey: ["apr-ergo-registro", registroId] });
      toast.success("APR-ERGO salva");
    } catch { toast.error("Não foi possível salvar. Seus dados continuam na tela."); }
    finally { setSalvando(false); }
  };

  const aplicarIa = (res: PropostaApr, substituir: boolean) => {
    setLinhas((atuais) => aplicarPropostaApr(atuais, res.linhas, substituir, res.condutas_matriz));
    setCab((atual) => atual ? aplicarResumoApr(atual, res.cabecalho, substituir) : atual);
    setFontesIa((ids) => [...new Set([...ids, ...res.fontes_aep])]);
    toast.success("Análise aplicada. Revise e salve a APR-ERGO.");
  };

  if (isLoading || (!cab && !isError)) return <Loader2 className="w-6 h-6 animate-spin mx-auto my-12" />;
  if (isError || !cab) return <div className="py-8 space-y-4"><p>Não foi possível abrir este registro.</p><Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button></div>;

  const campo = (label: string, k: keyof Cabecalho, colSpan: number, extra = "") => (
    <td colSpan={colSpan} className={`${cel} align-top px-1 ${extra}`}>
      <label className="block text-[11px] leading-tight"><span className="text-foreground/80">{label}</span>
        {k === "data" ? <input aria-label={label} value={cab[k]} onChange={(e) => setC(k, e.target.value)} type="date" className="block w-full min-w-0 bg-transparent outline-none text-[11px] focus:bg-primary/5" /> : <textarea aria-label={label} ref={ajustarAltura} rows={1} value={cab[k]} onChange={(e) => { setC(k, e.target.value); ajustarAltura(e.currentTarget); }} className={`${inp} min-h-[24px]`} />}</label>
    </td>
  );
  const basePath = `${data?.empresa_id}/${data?.contrato_id}/${registroId}/apr-base`;

  return <div className="flex flex-col gap-2 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setBaseOpen(true)}><BookOpen className="w-4 h-4 mr-1" />Base</Button>
        <Button variant="outline" size="sm" onClick={() => setIaOpen(true)} disabled={salvando}><Sparkles className="w-4 h-4 mr-1" />Gerar IA</Button>
        <Button size="sm" onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Salvar</Button>
      </div>
    </div>
    <div className="bg-card text-card-foreground border border-border p-1 min-w-0">
      <table className="w-full table-fixed border-collapse">
        <colgroup>{COLUNAS.map((c) => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
        <tbody>
          <tr><td colSpan={13} className={`${cel} px-1 py-0.5 text-[12px] font-bold`}>Anexo 3 Análise Preliminar de Riscos Ergonômicos (APR-ERGO)</td></tr>
          <tr>{campo("Empresa:", "empresa", 5)}{campo("Data:", "data", 3)}{campo("Nº de pessoas expostas:", "pessoas", 5)}</tr>
          <tr><td colSpan={5} className={cel} />{campo("Local SSO:", "localSso", 4)}{campo("Local Físico:", "localFisico", 4)}</tr>
          <tr>{campo("Nome do GERE:", "gere", 11)}{campo("Gerência de área:", "gerencia", 2)}</tr>
          <tr><td colSpan={13} className={`${cel} border-t-2 px-1 py-1 text-[11px]`}><span className="text-foreground/80">Cargo: </span><span aria-label="Cargo" className="whitespace-pre-wrap break-words">{data?.cargos.join("; ") || "—"}</span></td></tr>
          <tr><td colSpan={13} className={`${cel} px-1 align-top`}>
            <div className="text-[10px] text-foreground/80">Descrição das atividades/tarefas desempenhadas:</div>
            <div className="flex flex-wrap gap-2 items-end">
              <textarea aria-label="Descrição das atividades/tarefas desempenhadas" ref={ajustarAltura} rows={4} value={cab.atividades} onChange={(e) => { setC("atividades", e.target.value); ajustarAltura(e.currentTarget); }} className={`${inp} min-h-[64px] flex-1`} />
              <Button type="button" size="sm" variant="destructive" className="h-6 px-3 text-[10px] font-bold mb-1 shrink-0" onClick={() => setLinhas((l) => [...l, linhaVazia()])}>INSERIR LINHA</Button>
            </div>
          </td></tr>
          <tr><td colSpan={13} className={`${cel} px-1 align-top`}>
            <div className="text-[10px] text-foreground/80">Descrição do ambiente de trabalho:</div>
            <textarea aria-label="Descrição do ambiente de trabalho" ref={ajustarAltura} rows={2} value={cab.ambiente} onChange={(e) => { setC("ambiente", e.target.value); ajustarAltura(e.currentTarget); }} className={`${inp} min-h-[36px]`} />
          </td></tr>
          <tr className="h-[80px]">{COLUNAS.map((c) => <th key={c.key} className={`${cel} border-2 px-1 text-[10px] font-bold leading-[1.2] text-center align-middle break-words`}>{c.titulo}</th>)}</tr>
          {linhas.map((l, i) => <tr key={i} className="align-top">
            {COLUNAS.map((c) => c.key === "fotos"
              ? <td key={c.key} className={`${cel} p-0.5 align-middle`}>
                  <div className="flex flex-wrap gap-1 items-center justify-center h-full">
                    {l.fotos.map((f, k) => <div key={k} className="relative group w-full max-w-[120px]">
                      <img src={f} alt={`Foto ${k + 1}`} className="h-[80px] w-full object-contain rounded-sm border border-border" />
                      <Button type="button" variant="destructive" size="icon" aria-label="Remover foto" onClick={() => setLinhas((ls) => ls.map((x, j) => j === i ? { ...x, fotos: x.fotos.filter((_, n) => n !== k) } : x))} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 focus:opacity-100 w-5 h-5"><X className="w-3 h-3" /></Button>
                    </div>)}
                    <Button type="button" variant="ghost" size="icon" title="Adicionar foto" aria-label={`Adicionar foto linha ${i + 1}`} onClick={() => { alvoFoto.current = i; fileRef.current?.click(); }} className="text-muted-foreground h-5 w-5"><ImagePlus className="w-4 h-4" /></Button>
                  </div>
                </td>
              : LISTAS[c.key] ? <td key={c.key} className={`${cel} p-0 relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset`}>
                  <div className={`${inp} min-h-[100px] whitespace-pre-wrap ${l[c.key] ? "" : "text-muted-foreground"}`}>{(l[c.key] as string) || "Selecione"}</div>
                  <select aria-label={`${c.titulo} linha ${i + 1}`} title={l[c.key] as string} value={l[c.key] as string} onChange={(e) => setLinha(i, c.key, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[11px]">
                    <option value="" />
                    {[...new Set([...(l[c.key] ? [l[c.key] as string] : []), ...(LISTAS[c.key]?.(l) || [])])].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
              : AUTOMATICOS.includes(c.key) ? <td key={c.key} className={`${cel} p-0 ${c.key === "classificacao" && riscoClasse(l.classificacao) ? riscoClasse(l.classificacao) : "bg-secondary/40"}`} title="Campo automático calculado pela matriz da planilha">
                  <div aria-label={`${c.titulo} linha ${i + 1}`} className={`${inp} min-h-[100px] flex items-center justify-center text-center font-bold`}>{l[c.key] as string}</div>
                </td>
              : c.key === "medidas" ? <td key={c.key} className={`${cel} p-0 relative`}>
                  <textarea ref={ajustarAltura} rows={7} aria-label={`${c.titulo} linha ${i + 1}`} title={l.medidas} value={l.medidas} onChange={(e) => { setLinha(i, "medidas", e.target.value); ajustarAltura(e.currentTarget); }} className={`${inp} min-h-[100px] pr-4`} />
                  <select aria-label={`Adicionar medida de controle linha ${i + 1}`} title="Adicionar medida da aba Medidas de Controle" value="" onChange={(e) => e.target.value && setLinha(i, "medidas", l.medidas.trim() ? `${l.medidas.trim()}; ${e.target.value}` : e.target.value)} className="absolute top-0 right-0 w-4 h-4 text-[10px] bg-muted cursor-pointer">
                    <option value="">+</option>{[...new Set(MEDIDAS_APR)].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </td>
              : <td key={c.key} className={`${cel} p-0 ${c.key === "recomendacoes" ? riscoClasse(l.classificacao) : ""}`}>
                  <textarea ref={ajustarAltura} rows={7} aria-label={`${c.titulo} linha ${i + 1}`} title={l[c.key] as string} value={l[c.key] as string} onChange={(e) => { setLinha(i, c.key, e.target.value); ajustarAltura(e.currentTarget); }} className={`${inp} min-h-[100px] ${c.key === "recomendacoes" ? "font-bold" : ""}`} />
                </td>)}
          </tr>)}
        </tbody>
      </table>
      <div className="mt-1 text-[10px]"><div className="font-bold">Elaborador:</div>
        <input value={cab.elaborador} onChange={(e) => setC("elaborador", e.target.value)} placeholder="Escrever nome completo do profissional" className="bg-transparent outline-none w-full max-w-80 text-[10px] focus:bg-primary/5" /></div>
    </div>
    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFotos(e.target.files)} />
    <BaseAepModal empresaId={basePath} open={baseOpen} onOpenChange={setBaseOpen} limite={MAX_BASE_APR} titulo="Base de referência da APR-ERGO" />
    {registroId && <AprErgoIaModal open={iaOpen} onOpenChange={setIaOpen} registroId={registroId} basePath={basePath} linhas={linhas} cabecalho={cab} onAplicar={aplicarIa} />}
  </div>;
}
