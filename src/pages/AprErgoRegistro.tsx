import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Linha = { cenario: string; circunstancia: string; situacao: string; exigencia: string; tipo: string; medidas: string; estimativa: string; intensidade: string; perfil: string; severidade: string; classificacao: string; fotos: string[]; recomendacoes: string };
type Cabecalho = { empresa: string; data: string; pessoas: string; localSso: string; localFisico: string; gere: string; gerencia: string; cargo: string; funcao: string; atividades: string; ambiente: string; elaborador: string };
const linhaVazia = (): Linha => ({ cenario: "", circunstancia: "", situacao: "", exigencia: "", tipo: "", medidas: "", estimativa: "", intensidade: "", perfil: "", severidade: "", classificacao: "", fotos: [], recomendacoes: "" });
const COLUNAS: { key: keyof Linha; titulo: string; w: string; destaque?: boolean }[] = [
  { key: "cenario", titulo: "Cenário", w: "3%" },
  { key: "circunstancia", titulo: "Circunstância/Fonte de Exigência Ergonômica (DESCRITO PELO ERGONOMISTA)", w: "6.5%" },
  { key: "situacao", titulo: "Situação Ergonômica", w: "6.5%" },
  { key: "exigencia", titulo: "Exigencia Ergonômica (esta na tabela)", w: "6.5%" },
  { key: "tipo", titulo: "Tipo de risco", w: "6.5%" },
  { key: "medidas", titulo: "Medidas de Controle Existentes (esta na aba Medidas de controle)", w: "9%" },
  { key: "estimativa", titulo: "Estimativa do Tempo de Exposição", w: "4.3%" },
  { key: "intensidade", titulo: "Intensidade /Nível", w: "7.5%" },
  { key: "perfil", titulo: "Perfil da Exposição", w: "3.8%", destaque: true },
  { key: "severidade", titulo: "Severidade", w: "9.1%" },
  { key: "classificacao", titulo: "Classificação do Risco", w: "3.8%", destaque: true },
  { key: "fotos", titulo: "Foto da Exigência Ergonômica", w: "16.5%" },
  { key: "recomendacoes", titulo: "Recomendações / Sugestões / Observações", w: "17%" },
];

function reduzirImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 480, s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagem inválida")); };
    img.src = url;
  });
}

const cel = "border border-foreground/70";
const inp = "w-full h-full bg-transparent outline-none resize-none text-[10px] leading-tight p-0.5 focus:bg-primary/5";

export default function AprErgoRegistro() {
  const { registroId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cab, setCab] = useState<Cabecalho | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([linhaVazia(), linhaVazia()]);
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const alvoFoto = useRef<number>(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["apr-ergo-registro", registroId], enabled: !!registroId,
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos").select("id, empresa_nome, draft_snapshot").eq("id", registroId || "").eq("tipo", "APR-ERGO").single();
      if (error) throw error;
      const snap = (data.draft_snapshot || {}) as Record<string, unknown>;
      let setorNome = "";
      if (typeof snap.setor_id === "string") {
        const { data: s } = await supabase.from("setores").select("nome_setor, ghe_ges").eq("id", snap.setor_id).maybeSingle();
        setorNome = s ? `${s.ghe_ges ? `${s.ghe_ges} — ` : ""}${s.nome_setor}` : "";
      }
      return { ...data, snap, setorNome };
    },
  });

  useEffect(() => {
    if (!data || cab) return;
    const t = (data.snap.tabela || {}) as { cabecalho?: Cabecalho; linhas?: Linha[] };
    setCab({ empresa: data.empresa_nome || "", data: "", pessoas: "", localSso: "", localFisico: "", gere: data.setorNome, gerencia: "", cargo: "", funcao: "", atividades: "", ambiente: "", elaborador: "", ...(t.cabecalho || {}) });
    if (t.linhas?.length) setLinhas(t.linhas.map((l) => ({ ...linhaVazia(), ...l })));
  }, [data, cab]);

  const setLinha = (i: number, k: keyof Linha, v: string) => setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
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
    const { error } = await supabase.from("documentos").update({ draft_snapshot: { ...data.snap, tabela: { cabecalho: cab, linhas } } }).eq("id", data.id);
    setSalvando(false);
    if (error) return toast.error("Não foi possível salvar. Tente novamente.");
    qc.invalidateQueries({ queryKey: ["apr-ergo-registro", registroId] });
    toast.success("APR-ERGO salva");
  };

  if (isLoading || (!cab && !isError)) return <Loader2 className="w-6 h-6 animate-spin mx-auto my-12" />;
  if (isError || !cab) return <div className="py-8 space-y-4"><p>Não foi possível abrir este registro.</p><Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button></div>;

  const campo = (label: string, k: keyof Cabecalho, colSpan: number, extra = "") => (
    <td colSpan={colSpan} className={`${cel} align-top px-1 ${extra}`}>
      <label className="flex gap-1 items-start text-[10px]"><span className="whitespace-nowrap text-foreground/80">{label}</span>
        <input value={cab[k]} onChange={(e) => setC(k, e.target.value)} type={k === "data" ? "date" : "text"} className="flex-1 min-w-0 bg-transparent outline-none text-[10px] focus:bg-primary/5" /></label>
    </td>
  );
  const altLinha = linhas.length <= 2 ? "h-[130px]" : linhas.length <= 4 ? "h-[72px]" : "h-[52px]";

  return <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
      <Button size="sm" onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Salvar</Button>
    </div>
    <div className="bg-card text-card-foreground rounded-md border border-border p-2">
      <table className="w-full table-fixed border-collapse">
        <colgroup>{COLUNAS.map((c) => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
        <tbody>
          <tr><td colSpan={13} className={`${cel} px-1 py-0.5 text-[12px] font-bold`}>Anexo 3 Análise Preliminar de Riscos Ergonômicos (APR-ERGO)</td></tr>
          <tr>{campo("Empresa:", "empresa", 5)}{campo("Data:", "data", 3)}{campo("Nº de pessoas expostas:", "pessoas", 5)}</tr>
          <tr><td colSpan={5} className={cel} />{campo("Local SSO:", "localSso", 4)}{campo("Local Físico:", "localFisico", 4)}</tr>
          <tr>{campo("Nome do GERE:", "gere", 11)}{campo("Gerência de área:", "gerencia", 2)}</tr>
          <tr>{campo("Cargo:", "cargo", 9, "border-t-2")}{campo("Função(descrição do cargo)", "funcao", 4, "border-t-2")}</tr>
          <tr><td colSpan={13} className={`${cel} px-1 align-top`}>
            <div className="text-[10px] text-foreground/80">Descrição das atividades/tarefas desempenhadas:</div>
            <div className="flex gap-2 items-end">
              <textarea value={cab.atividades} onChange={(e) => setC("atividades", e.target.value)} className={`${inp} h-9 flex-1`} />
              <Button type="button" size="sm" variant="destructive" className="h-6 px-3 text-[10px] font-bold mb-1 mr-8" onClick={() => setLinhas((l) => [...l, linhaVazia()])}>INSERIR LINHA</Button>
            </div>
          </td></tr>
          <tr><td colSpan={13} className={`${cel} px-1 align-top`}>
            <div className="text-[10px] text-foreground/80">Descrição do ambiente de trabalho:</div>
            <textarea value={cab.ambiente} onChange={(e) => setC("ambiente", e.target.value)} className={`${inp} h-5`} />
          </td></tr>
          <tr className="h-[58px]">{COLUNAS.map((c) => <th key={c.key} className={`${cel} border-2 px-0.5 text-[9.5px] font-bold leading-tight text-center align-middle break-words`}>{c.titulo}</th>)}</tr>
          {linhas.map((l, i) => <tr key={i} className={altLinha}>
            {COLUNAS.map((c) => c.key === "fotos"
              ? <td key={c.key} className={`${cel} p-0.5 align-middle`}>
                  <div className="flex flex-wrap gap-1 items-center justify-center h-full">
                    {l.fotos.map((f, k) => <div key={k} className="relative group">
                      <img src={f} alt={`Foto ${k + 1}`} className="max-h-[60px] max-w-[90px] object-contain rounded-sm border border-border" />
                      <button type="button" aria-label="Remover foto" onClick={() => setLinhas((ls) => ls.map((x, j) => j === i ? { ...x, fotos: x.fotos.filter((_, n) => n !== k) } : x))} className="absolute -top-1 -right-1 hidden group-hover:flex bg-destructive text-destructive-foreground rounded-full w-4 h-4 items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>)}
                    <button type="button" title="Adicionar foto" onClick={() => { alvoFoto.current = i; fileRef.current?.click(); }} className="text-muted-foreground hover:text-primary p-1"><ImagePlus className="w-4 h-4" /></button>
                  </div>
                </td>
              : <td key={c.key} className={`${cel} p-0 ${c.destaque ? "bg-secondary/40" : ""}`}>
                  <textarea aria-label={`${c.titulo} linha ${i + 1}`} value={l[c.key] as string} onChange={(e) => setLinha(i, c.key, e.target.value)} className={inp} />
                </td>)}
          </tr>)}
        </tbody>
      </table>
      <div className="mt-1 text-[10px]"><div className="font-bold">Elaborador:</div>
        <input value={cab.elaborador} onChange={(e) => setC("elaborador", e.target.value)} placeholder="Escrever nome completo do profissional" className="bg-transparent outline-none w-80 text-[10px] focus:bg-primary/5" /></div>
    </div>
    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFotos(e.target.files)} />
  </div>;
}
