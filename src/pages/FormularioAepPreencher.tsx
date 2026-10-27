import { todayDateOnly } from "@/lib/dateOnly";
import { usePersistedState } from "@/hooks/usePersistedState";
import { gerarPdfFormularioAep } from "@/lib/formularioAepPdf";
import { useToast } from "@/hooks/use-toast";
import { EtapaReconhecimento, reconhecimentoVazio, type ReconhecimentoState } from "@/components/formulario-aep/EtapaReconhecimento";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, BookOpen, Save, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BaseAepModal, GerarIaAepModal, type ResultadoIaAep } from "@/components/formulario-aep/FormularioAepIa";
import { CATEGORIAS, DURACAO, INTENSIDADE } from "@/components/formulario-aep/EtapaReconhecimento";
import { supabase } from "@/integrations/supabase/client";
import { carregarContextoFormularioAep } from "@/lib/formularioAepContexto";
import { carregarExposicoes, mesclarAepExposicoes } from "@/lib/aepAprCompartilhado";
import {
  baixarPdfFormularioAep, estadoDeDadosSalvos, montarPdfDados, urlNovoFormularioAep,
} from "@/lib/formularioAepRegistro";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PrefillState = { empresaId?: string; contratoId?: string; setorIds?: string[]; formularioId?: string } | null;

const CRITERIOS = ["AF", "RE", "IN", "QO"] as const;
const CONTROLES = ["PI", "MS", "CM", "CE", "AD", "ME", "CP"] as const;
const LINHAS = [1, 2, 3, 4, 5];

type LinhaTabela = { texto: string; marcas: Record<string, string> };
const linhasVazias = (): LinhaTabela[] => LINHAS.map(() => ({ texto: "", marcas: {} }));

// Aceita apenas números ou "X"
const filtrarMarca = (v: string) => {
  const s = v.toUpperCase().replace(/\s/g, "");
  if (s === "" || s === "X") return s;
  return s.replace(/[^0-9]/g, "").slice(0, 4);
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-foreground border-b border-border pb-2 mb-4">{children}</h2>;
}

function TabelaMarcacao({
  colunas, tituloTexto, linhas, onChange,
}: {
  colunas: readonly string[];
  tituloTexto: string;
  linhas: LinhaTabela[];
  onChange: (l: LinhaTabela[]) => void;
}) {
  const set = (i: number, patch: Partial<LinhaTabela>) =>
    onChange(linhas.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="w-12 px-2 py-2 text-center font-medium text-muted-foreground border-r border-border">ID</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground border-r border-border">{tituloTexto}</th>
            {colunas.map((c) => (
              <th key={c} className="w-14 px-1 py-2 text-center font-medium text-muted-foreground border-r border-border last:border-r-0">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-2 py-1 text-center text-muted-foreground border-r border-border">{i + 1}</td>
              <td className="p-1 border-r border-border">
                <Input value={l.texto} onChange={(e) => set(i, { texto: e.target.value })} className="h-8 border-0 shadow-none focus-visible:ring-1" />
              </td>
              {colunas.map((c) => (
                <td key={c} className="p-1 border-r border-border last:border-r-0">
                  <Input
                    value={l.marcas[c] || ""}
                    onChange={(e) => set(i, { marcas: { ...l.marcas, [c]: filtrarMarca(e.target.value) } })}
                    className="h-8 px-1 text-center border-0 shadow-none focus-visible:ring-1"
                    aria-label={`${c} linha ${i + 1}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FormularioAepPreencher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefill = (useLocation().state as PrefillState) || null;
  const empresaId = searchParams.get("empresa") || prefill?.empresaId || "";
  const contratoId = searchParams.get("contrato") || prefill?.contratoId || "";
  const funcaoId = searchParams.get("funcao") || "";
  const setorId = searchParams.get("setor") || "";
  const formularioIdUrl = searchParams.get("id") || prefill?.formularioId || "";
  const origem = searchParams.get("origem") === "lista" ? "lista" : "novo";
  const funcoesEscopo = (searchParams.get("funcoes") || funcaoId).split(",").filter(Boolean);
  const setorIds = setorId ? [setorId] : (prefill?.setorIds || []);

  const chave = `formulario-aep:${empresaId}:${contratoId}:${funcaoId || formularioIdUrl || "novo"}`;
  const [etapa, setEtapa] = usePersistedState<number>(`${chave}:etapa`, 1);
  const [reconhecimento, setReconhecimento] = usePersistedState<ReconhecimentoState>(`${chave}:etapa2`, reconhecimentoVazio());
  const [ident, setIdent] = usePersistedState(`${chave}:ident`, {
    gerencia_executiva: "", gerencia: "", local_fisico: "", nome_gere: "", codigo_gere: "",
    horario_avaliacao: "", jornada: "", expostos: "", descricao: "",
  });
  const [funcoesArr, setFuncoesArr] = usePersistedState<string[]>(`${chave}:funcoes`, funcaoId ? [funcaoId] : []);
  const funcoesSel = new Set(funcaoId ? [funcaoId] : funcoesArr);
  const [atividades, setAtividades] = usePersistedState<LinhaTabela[]>(`${chave}:atividades`, linhasVazias());
  const [controles, setControles] = usePersistedState<LinhaTabela[]>(`${chave}:controles`, linhasVazias());
  const [formularioId, setFormularioId] = usePersistedState<string>(`${chave}:id`, formularioIdUrl);
  const [salvoHash, setSalvoHash] = usePersistedState<string>(`${chave}:salvo`, "");
  const [salvando, setSalvando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [atividadeIds, setAtividadeIds] = usePersistedState<string[]>(`${chave}:atividade-ids`, []);
  const aplicado = useRef("");
  const { toast } = useToast();
  const dadosForm = useMemo(() => ({ ident, funcoes: funcaoId ? [funcaoId] : funcoesArr, atividades, controles, reconhecimento, atividade_ids: atividadeIds }), [ident, funcoesArr, atividades, controles, reconhecimento, funcaoId, atividadeIds]);
  const hashAtual = JSON.stringify(dadosForm);
  const salvoAtual = !!formularioId && salvoHash === hashAtual;

  const { data: registroSalvo } = useQuery({
    queryKey: ["formulario-aep-registro", empresaId, contratoId, funcaoId, formularioIdUrl],
    enabled: !!empresaId && !!contratoId && (!!funcaoId || !!formularioIdUrl),
    queryFn: async () => {
      if (formularioIdUrl) {
        const porId = await supabase.from("formularios_aep").select("id, dados, funcao_id, updated_at").eq("id", formularioIdUrl).eq("empresa_id", empresaId).eq("contrato_id", contratoId).maybeSingle();
        if (porId.error) throw porId.error;
        if (porId.data) return porId.data;
      }
      if (!funcaoId) return null;
      const porFuncao = await supabase.from("formularios_aep").select("id, dados, funcao_id, updated_at").eq("empresa_id", empresaId).eq("contrato_id", contratoId).eq("funcao_id", funcaoId).maybeSingle();
      if (porFuncao.error) throw porFuncao.error;
      return porFuncao.data;
    },
  });

  const { data: exposicoesCompartilhadas } = useQuery({
    queryKey: ["aep-apr-exposicoes", empresaId, contratoId, setorId, funcaoId, registroSalvo?.updated_at],
    enabled: !!empresaId && !!contratoId && !!setorId && !!funcaoId && registroSalvo !== undefined,
    queryFn: () => carregarExposicoes({ empresa: empresaId, contrato: contratoId, setor: setorId, funcao: funcaoId }, registroSalvo?.id),
  });
  const exposicaoAplicada = useRef("");
  useEffect(() => {
    if (!exposicoesCompartilhadas) return;
    const chaveAplicacao = JSON.stringify([registroSalvo?.updated_at, exposicoesCompartilhadas]);
    if (exposicaoAplicada.current === chaveAplicacao) return;
    exposicaoAplicada.current = chaveAplicacao;
    setReconhecimento((r) => mesclarAepExposicoes(r, exposicoesCompartilhadas));
    setAtividadeIds((ids) => Array.from({ length: 5 }, (_, i) => ids[i] || exposicoesCompartilhadas.find((e) => e.atividade_numero === i + 1)?.atividade_id || crypto.randomUUID()));
  }, [exposicoesCompartilhadas, registroSalvo, setReconhecimento, setAtividadeIds]);

  useEffect(() => {
    if (!registroSalvo) return;
    const marca = `${funcaoId}:${registroSalvo.id}:${registroSalvo.updated_at}`;
    if (aplicado.current === marca) return;
    aplicado.current = marca;
    const estado = estadoDeDadosSalvos(registroSalvo.dados, funcaoId || registroSalvo.funcao_id || undefined);
    setIdent(estado.ident);
    setFuncoesArr(estado.funcoes);
    setAtividades(estado.atividades);
    setControles(estado.controles);
    setReconhecimento(estado.reconhecimento);
    setAtividadeIds((registroSalvo.dados as any)?.atividade_ids || []);
    setFormularioId(registroSalvo.id);
    setSalvoHash(JSON.stringify({ ident: estado.ident, funcoes: estado.funcoes, atividades: estado.atividades, controles: estado.controles, reconhecimento: estado.reconhecimento, atividade_ids: (registroSalvo.dados as any)?.atividade_ids || [] }));
  }, [registroSalvo, funcaoId, setIdent, setFuncoesArr, setAtividades, setControles, setReconhecimento, setFormularioId, setSalvoHash]);

  const { data: nomes } = useQuery({
    queryKey: ["formulario-aep-nomes", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const [e, c] = await Promise.all([
        supabase.from("empresas").select("razao_social, nome_fantasia").eq("id", empresaId).maybeSingle(),
        supabase.from("contratos").select("numero_contrato, nome_contratante").eq("id", contratoId).maybeSingle(),
      ]);
      return {
        empresa: e.data?.razao_social || e.data?.nome_fantasia || "",
        contrato: [c.data?.numero_contrato, c.data?.nome_contratante].filter(Boolean).join(" – ") || "Sem número",
      };
    },
  });

  const { data: funcoes = [], isLoading } = useQuery({
    queryKey: ["formulario-aep-funcoes", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, funcoes(id, nome_funcao)")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      const lista = (data || []).flatMap((s: any) => s.funcoes || []);
      const unicas = new Map<string, any>(lista.map((f: any) => [f.id, f]));
      return [...unicas.values()].sort((a, b) => a.nome_funcao.localeCompare(b.nome_funcao));
    },
  });

  const { data: setoresCtx = [] } = useQuery({
    queryKey: ["formulario-aep-setores-ctx", empresaId, contratoId, setorIds.join(",")],
    enabled: !!empresaId && !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, nome_setor, ghe_ges, descricao_ambiente, funcoes(id, nome_funcao, descricao_atividades)")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId);
      if (error) throw error;
      return (data || []).filter((s: any) => !setorIds.length || setorIds.includes(s.id));
    },
  });
  const [baseOpen, setBaseOpen] = useState(false);
  const [iaOpen, setIaOpen] = useState(false);
  const { data: ctxIntegrado } = useQuery({
    queryKey: ["formulario-aep-ctx-integrado", empresaId, contratoId, setorIds.join(","), (funcaoId || funcoesArr.join(",")), formularioId],
    enabled: !!empresaId && !!contratoId && setoresCtx.length > 0,
    queryFn: () => carregarContextoFormularioAep({
      empresaId, contratoId, formularioAtualId: formularioId,
      setores: setoresCtx as any, funcoesSelecionadas: new Set(funcaoId ? [funcaoId] : funcoesArr),
    }),
  });

  const criterios = {
    duracao: DURACAO.map((t, i) => `D${i + 1} = ${t}`),
    intensidade: INTENSIDADE.map((t, i) => `coluna ${i + 1} = ${t}`),
    fatores: CATEGORIAS.map(([cat, itens]) => ({ categoria: cat, itens })),
  };
  const codigosValidos = new Set(CATEGORIAS.flatMap(([, itens]) => itens.map((i) => i.split(":")[0])));
  const marcasFator = (f: ResultadoIaAep["fatores"][number]) => {
    const m: Record<string, string> = {};
    if (f.duracao >= 1 && f.duracao <= 5) m[`D${f.duracao}`] = "X";
    if (f.intensidade >= 1 && f.intensidade <= 5) m[`I${f.intensidade}`] = "X";
    (f.atividades_ids || []).filter((n) => n >= 1 && n <= 5).forEach((n) => { m[`A${n}`] = "X"; });
    return m;
  };
  const temMarca = (m?: Record<string, string>, prefixo?: string) =>
    Object.entries(m || {}).some(([k, v]) => v && (!prefixo || k.startsWith(prefixo)));

  const contarConflitos = (r: ResultadoIaAep) => {
    let n = 0;
    Object.entries(r.identificacao || {}).forEach(([k, v]) => {
      const atual = (ident as any)[k];
      if (v?.trim() && atual?.trim() && atual.trim() !== v.trim()) n++;
    });
    (["atividades", "controles"] as const).forEach((k) => {
      const atual = k === "atividades" ? atividades : controles;
      (r[k] || []).slice(0, 5).forEach((l, i) => { if (l.texto?.trim() && (atual[i]?.texto.trim() || temMarca(atual[i]?.marcas))) n++; });
    });
    (r.fatores || []).forEach((f) => { if (codigosValidos.has(f.codigo) && temMarca(reconhecimento.marcas[f.codigo])) n++; });
    return n;
  };

  const aplicarIa = (r: ResultadoIaAep, substituir: boolean) => {
    setIdent((p) => {
      const novo: any = { ...p };
      Object.entries(r.identificacao || {}).forEach(([k, v]) => {
        if (!(k in novo) || !v?.trim()) return;
        if (substituir || !novo[k]?.trim()) novo[k] = v.trim();
      });
      return novo;
    });
    const validas = new Set(funcoes.map((f: any) => f.id));
    setFuncoesArr((prev) => (funcaoId ? [funcaoId] : [...new Set([...prev, ...(r.funcoes_ids || []).filter((id) => validas.has(id))])]));
    const mesclar = (atual: LinhaTabela[], novas: ResultadoIaAep["atividades"]) =>
      atual.map((l, i) => {
        const n = novas?.[i];
        if (!n?.texto?.trim()) return l;
        const ocupada = l.texto.trim() || temMarca(l.marcas);
        if (ocupada && !substituir) return l;
        const marcas = Object.fromEntries(Object.entries(n.marcas || {}).map(([c, v]) => [c, filtrarMarca(String(v || ""))]).filter(([, v]) => v));
        return { texto: n.texto.trim(), marcas };
      });
    setAtividades((a) => mesclar(a, r.atividades));
    setControles((c) => mesclar(c, r.controles));
    setReconhecimento((rec) => {
      const marcas = { ...rec.marcas };
      const ia = { ...(rec.ia || {}) };
      (r.fatores || []).forEach((f) => {
        if (!codigosValidos.has(f.codigo)) return;
        const m = marcasFator(f);
        if (!Object.keys(m).length) return;
        if (temMarca(marcas[f.codigo]) && !substituir) return;
        marcas[f.codigo] = m;
        ia[f.codigo] = { origem: f.origem, validar: f.validar ?? f.origem !== "informado", fundamento: f.fundamento };
      });
      return { ...rec, marcas, ia };
    });
    setEtapa(2);
    window.scrollTo(0, 0);
  };
  const nomeFuncao = (id: string) => funcoes.find((f: any) => f.id === id)?.nome_funcao || id;

  const montarPdf = () => montarPdfDados({
    empresaNome: nomes?.empresa || "",
    contratoNome: nomes?.contrato || "",
    funcaoNome: (funcaoId ? [nomeFuncao(funcaoId)] : funcoesArr.map(nomeFuncao)).join("; "),
    dados: dadosForm,
  });

  const voltar = () => {
    if (origem === "lista") navigate("/formulario-aep", { state: { expand: empresaId } });
    else navigate(urlNovoFormularioAep(empresaId, contratoId, funcoesEscopo));
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fontes = {
        psico_relatorio_ids: Array.from(new Set((ctxIntegrado?.psicossocial || []).map((p: any) => p.relatorio_id).filter(Boolean))),
        formularios_anteriores_ids: (ctxIntegrado?.formularios_anteriores || []).map((f: any) => f.id),
      };
      const registro = {
        empresa_id: empresaId,
        contrato_id: contratoId,
        setor_ids: setorIds,
        funcao_id: funcaoId || null,
        dados: { ...dadosForm, funcao_id: funcaoId || null, setor_id: setorId || setorIds[0] || null, fontes_ia: fontes } as any,
      };
      let id = formularioId || registroSalvo?.id || "";
      if (!id && funcaoId) {
        const existente = await supabase.from("formularios_aep").select("id").eq("empresa_id", empresaId).eq("contrato_id", contratoId).eq("funcao_id", funcaoId).maybeSingle();
        if (existente.error) throw existente.error;
        id = existente.data?.id || "";
      }
      if (id) {
        const { error } = await supabase.from("formularios_aep").update(registro).eq("id", id).eq("empresa_id", empresaId).eq("contrato_id", contratoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("formularios_aep").insert({ ...registro, created_by: user?.id }).select("id").single();
        if (error?.code === "23505" && funcaoId) {
          const existente = await supabase.from("formularios_aep").select("id").eq("empresa_id", empresaId).eq("contrato_id", contratoId).eq("funcao_id", funcaoId).maybeSingle();
          if (existente.error || !existente.data) throw error;
          const atualizado = await supabase.from("formularios_aep").update(registro).eq("id", existente.data.id).eq("empresa_id", empresaId).eq("contrato_id", contratoId);
          if (atualizado.error) throw atualizado.error;
          id = existente.data.id;
        } else {
          if (error) throw error;
          id = data.id;
        }
      }
      const pasta = `${empresaId}/${contratoId}/${id}`;
      const pdf = gerarPdfFormularioAep(montarPdf());
      const up = await supabase.storage.from("formularios-aep").upload(`${pasta}/formulario-aep.pdf`, pdf, { upsert: true, contentType: "application/pdf" });
      if (!up.error) {
        await supabase.storage.from("formularios-aep").upload(`${pasta}/dados.json`, new Blob([hashAtual], { type: "application/json" }), { upsert: true, contentType: "application/json" });
        await supabase.from("formularios_aep").update({ pdf_path: `${pasta}/formulario-aep.pdf` }).eq("id", id).eq("empresa_id", empresaId).eq("contrato_id", contratoId);
      }
      setFormularioId(id);
      setSalvoHash(hashAtual);
      await queryClient.invalidateQueries({ queryKey: ["formulario-aep-salvos"] });
      await queryClient.invalidateQueries({ queryKey: ["formulario-aep-novo-salvos"] });
      await queryClient.invalidateQueries({ queryKey: ["formulario-aep-registro"] });
      toast({
        title: "Formulário salvo",
        description: up.error
          ? "Os dados foram gravados. O arquivo da pasta não pôde ser atualizado; o download do relatório continua disponível."
          : `Salvo na pasta de ${nomes?.empresa || "empresa"} • ${nomes?.contrato || "contrato"}.`,
      });
      voltar();
    } catch (e: any) {
      toast({ title: "Não foi possível salvar", description: e?.message || "Tente novamente. Seus dados continuam na tela.", variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  };

  const baixar = () => {
    if (!salvoAtual) return;
    setBaixando(true);
    try {
      const nomeFunc = funcaoId ? nomeFuncao(funcaoId) : (nomes?.empresa || "empresa");
      const nome = `Formulario_AEP_${nomeFunc.replace(/[^\w]+/g, "_")}_${todayDateOnly()}.pdf`;
      baixarPdfFormularioAep(montarPdf(), nome);
      toast({ title: "PDF baixado", description: nome });
    } catch (e: any) {
      toast({ title: "Falha ao gerar o PDF", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setBaixando(false);
    }
  };

  const campo = (k: keyof typeof ident, label: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={ident[k]} onChange={(e) => setIdent((p) => ({ ...p, [k]: e.target.value }))} />
    </div>
  );

  const toggleFuncao = (id: string) =>
    setFuncoesArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div>
      <PageHeader
        title="Formulário AEP"
        description={funcaoId ? `Função: ${nomeFuncao(funcaoId)}` : "Preencha a identificação e as tabelas da avaliação"}
        actions={
          <div className="flex gap-2">
          {empresaId && contratoId && etapa === 1 && (
            <>
              <Button variant="outline" onClick={() => setBaseOpen(true)}><BookOpen className="w-4 h-4 mr-2" /> Base</Button>
              <Button onClick={() => setIaOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90"><Sparkles className="w-4 h-4 mr-2" /> Gerar IA</Button>
            </>
          )}
          <Button variant="outline" onClick={() => (etapa === 2 ? (setEtapa(1), window.scrollTo(0, 0)) : voltar())}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          </div>
        }
      />

      {empresaId && (
        <>
          <BaseAepModal empresaId={empresaId} open={baseOpen} onOpenChange={setBaseOpen} />
          <GerarIaAepModal
            open={iaOpen} onOpenChange={setIaOpen} empresaId={empresaId}
            contexto={{
              setores: setoresCtx,
              funcoes_amostradas: setoresCtx.flatMap((st: any) => (st.funcoes || [])
                .filter((f: any) => funcoesSel.has(f.id))
                .map((f: any) => ({ id: f.id, nome_funcao: f.nome_funcao, atividades_reais: f.descricao_atividades || "", setor: st.nome_setor, ghe_ges: st.ghe_ges }))),
              identificacao_atual: ident,
              atividades_atuais: atividades.map((l, i) => ({ id: i + 1, texto: l.texto })).filter((l) => l.texto),
              psicossocial: ctxIntegrado?.psicossocial || [],
              formularios_anteriores: ctxIntegrado?.formularios_anteriores || [],
            }}
            criterios={criterios} nomeFuncao={nomeFuncao} contarConflitos={contarConflitos} onAplicar={aplicarIa}
          />
        </>
      )}

      {!empresaId || !contratoId ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Selecione empresa, contrato e setores em “Novo Formulário” para iniciar.
        </Card>
      ) : etapa === 2 ? (
        <div className="space-y-6">
          <EtapaReconhecimento value={reconhecimento} onChange={setReconhecimento} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={() => { setEtapa(1); window.scrollTo(0, 0); }}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              {formularioId && !salvoAtual && <span className="text-xs text-muted-foreground">Há alterações não salvas</span>}
              <Button onClick={salvar} disabled={salvando} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
              </Button>
              <Button variant="outline" onClick={baixar} disabled={!salvoAtual || baixando || salvando} title={salvoAtual ? "Baixar PDF" : "Salve o formulário para liberar o download"}>
                <Download className="w-4 h-4 mr-2" /> Baixar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <SectionTitle>I – IDENTIFICAÇÃO E CARACTERIZAÇÃO</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {campo("gerencia_executiva", "Gerência Executiva")}
              {campo("gerencia", "Gerência")}
              {campo("local_fisico", "Local Físico")}
              {campo("nome_gere", "Nome GERE")}
              {campo("codigo_gere", "Código GERE")}
            </div>

            <div className="mt-5 space-y-2">
              <Label className="text-xs">Funções amostradas em campo</Label>
              {funcaoId ? (
                <div className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                  {nomeFuncao(funcaoId)}
                </div>
              ) : isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : funcoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma função cadastrada para esta empresa e contrato.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border border-border p-3">
                  {funcoes.map((f: any) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={funcoesSel.has(f.id)} onCheckedChange={() => toggleFuncao(f.id)} />
                      <span className="truncate">{f.nome_funcao}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {campo("horario_avaliacao", "Horário da avaliação")}
              {campo("jornada", "Jornada de trabalho")}
              {campo("expostos", "Nº de trabalhadores expostos")}
            </div>

            <div className="mt-5 space-y-1.5">
              <Label className="text-xs">Descrição resumida</Label>
              <Textarea rows={4} value={ident.descricao} onChange={(e) => setIdent((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle>II – PRIORIZAÇÃO DE DEMANDA – ATIVIDADES CRÍTICAS</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3">
              Critérios de criticidade: AF – Afastamentos | RE – Restritos | IN – Incidentes | QO – Queixas Osteomusculares
            </p>
            <TabelaMarcacao colunas={CRITERIOS} tituloTexto="Atividades" linhas={atividades} onChange={setAtividades} />
          </Card>

          <Card className="p-6">
            <SectionTitle>III – MEDIDAS DE CONTROLE EXISTENTES/CIRCUNSTÂNCIAS DE EXIGÊNCIAS ERGONÔMICAS</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3">
              Tipos de Controle: PI – Proteção Individual | MS – Manutenção e Substituição | CM – Coletiva e Minimização | CE – Coletiva e Engenharia | AD – Administrativa | ME – Médico | CP – Capacitação
            </p>
            <TabelaMarcacao
              colunas={CONTROLES}
              tituloTexto="Descrição do Controle/Circunstância de Exigência Ergonômica"
              linhas={controles}
              onChange={setControles}
            />
          </Card>

          <div className="flex justify-end">
            <Button type="button" onClick={() => { setEtapa(2); window.scrollTo(0, 0); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Avançar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
