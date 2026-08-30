import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Loader2, Save, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  construirGrupos, medidasDosGrupos, conclusaoTecnica, metodologiaTexto, normalizarFuncao,
  resumoPorGrupo, riscosParaPgr, nivelDeRisco, corNivel, PROB_LABELS, SEV_LABELS,
  INDICADORES_CAMPOS, matrizOcupada, fatorCaracterizado, planoAcaoTexto,
  indicadoresPreenchidos, interpretarIndicadores,
  type GrupoRelatorio, type MedidaControle, type NivelRisco, type VinculoFuncao,
} from "@/lib/psicoRelatorio";
import { gerarPdfPsicossocial } from "@/lib/psicoRelatorioPdf";
import { MetodologiaModal, type MetodologiaInfo } from "@/components/psico/MetodologiaModal";
import { montarContexto, gerarTextosIa } from "@/lib/psicoIa";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const NIVEL_BG: Record<NivelRisco, string> = {
  "Baixo": "bg-emerald-500",
  "Médio": "bg-yellow-500",
  "Alto": "bg-orange-500",
  "Crítico": "bg-red-600",
};

function Secao({ n, titulo, children, acao }: any) {
  return (
    <Card className="p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3 border-b pb-4">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2.5">
          <span className="w-7 h-7 rounded bg-primary text-primary-foreground text-xs grid place-items-center shrink-0">{n}</span>
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </Card>
  );
}

export default function PsicossocialRelatorio() {
  const { empresaId, contratoId, avaliacaoId } = useParams();
  const location = useLocation();
  const usarIa = Boolean((location.state as any)?.usarIa);
  const [salvando, setSalvando] = useState(false);
  const [metOpen, setMetOpen] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [iaRodando, setIaRodando] = useState(false);
  const [lacunasIa, setLacunasIa] = useState<string[]>([]);
  const iaFeitaRef = useRef(false);
  const abrirMetRef = useRef(false);


  // ---------- Dados ----------
  const { data: avaliacao } = useQuery({
    queryKey: ["rel-av", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_avaliacoes")
        .select("*, empresas(*), contratos(*)")
        .eq("id", avaliacaoId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: respostas = [] } = useQuery({
    queryKey: ["rel-resp", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_respostas").select("*").eq("avaliacao_id", avaliacaoId!);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: setores = [] } = useQuery({
    queryKey: ["rel-setores", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, nome_setor, ghe_ges, funcoes(nome_funcao, expostos, descricao_atividades)")
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: responsaveis = [] } = useQuery({
    queryKey: ["rel-responsaveis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("responsaveis").select("*").order("nome");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: indicadoresDb } = useQuery({
    queryKey: ["rel-indic", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("psico_indicadores").select("dados").eq("avaliacao_id", avaliacaoId!).maybeSingle();
      return ((data as any)?.dados || {}) as Record<string, string>;
    },
  });

  const { data: salvo, isFetched: salvoFetched } = useQuery({
    queryKey: ["rel-doc", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("psico_relatorios").select("dados, versao").eq("avaliacao_id", avaliacaoId!).maybeSingle();
      return (data as any) || null;
    },
  });

  const { data: anterior } = useQuery({
    queryKey: ["rel-anterior", avaliacaoId, contratoId],
    enabled: !!avaliacaoId && !!contratoId && !!avaliacao,
    queryFn: async () => {
      const { data: avs } = await supabase
        .from("psico_avaliacoes")
        .select("id, titulo, created_at")
        .eq("contrato_id", contratoId!)
        .lt("created_at", avaliacao.created_at)
        .order("created_at", { ascending: false })
        .limit(1);
      const prev = (avs as any[])?.[0];
      if (!prev) return null;
      const { data: resp } = await supabase
        .from("psico_respostas").select("*").eq("avaliacao_id", prev.id);
      return { avaliacao: prev, respostas: (resp as any[]) || [] };
    },
  });

  const vinculos = useMemo(() => {
    const m = new Map<string, VinculoFuncao>();
    for (const s of setores) {
      for (const f of s.funcoes || []) {
        m.set(normalizarFuncao(f.nome_funcao), {
          setor: s.nome_setor,
          ghe: s.ghe_ges || "—",
          expostos: parseInt(String(f.expostos || "0").replace(/\D/g, "")) || 0,
          atividades: f.descricao_atividades || "",
        });
      }
    }
    return m;
  }, [setores]);

  const empresa = avaliacao?.empresas;
  const contrato = avaliacao?.contratos;

  const gruposBase = useMemo(
    () => (respostas.length && vinculos.size ? construirGrupos(respostas, vinculos, empresa?.jornada_trabalho || "") : []),
    [respostas, vinculos, empresa],
  );

  // ---------- Estado editável ----------
  const [ident, setIdent] = useState<Record<string, string>>({});
  const [metInfo, setMetInfo] = useState<MetodologiaInfo>({ periodo: "", participacao: "", observacao: "" });
  const [metodologia, setMetodologia] = useState("");
  const [grupos, setGrupos] = useState<GrupoRelatorio[]>([]);
  const [medidas, setMedidas] = useState<MedidaControle[]>([]);
  const [conclusao, setConclusao] = useState("");
  const [introPlano, setIntroPlano] = useState("");
  const [historico, setHistorico] = useState("");
  const [registros, setRegistros] = useState<Record<string, string>>({
    aplicador: "", responsavel_empresa: "", data: "", versao: "1.0",
  });

  const indicadores = indicadoresDb || {};

  useEffect(() => {
    if (pronto || !avaliacao || !salvoFetched) return;
    if (!gruposBase.length) return;
    const s = salvo?.dados || {};

    setIdent({
      razao_social: empresa?.razao_social || "",
      nome_fantasia: empresa?.nome_fantasia || "",
      cnpj: empresa?.cnpj || "",
      cnae: empresa?.cnae_principal || "",
      endereco: empresa?.endereco || "",
      unidade: empresa?.local_trabalho || contrato?.numero_contrato || "",
      responsavel_id: "",
      responsavel_nome: "",
      responsavel_registro: "",
      data_avaliacao: avaliacao?.data_avaliacao
        ? new Date(avaliacao.data_avaliacao + "T00:00:00").toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      ...(s.ident || {}),
    });

    const info: MetodologiaInfo = { periodo: "", participacao: "", observacao: "", ...(s.metInfo || {}) };
    setMetInfo(info);
    const gsBase = (s.grupos as GrupoRelatorio[] | undefined)?.length
      ? gruposBase.map((g) => {
          const old = (s.grupos as GrupoRelatorio[]).find((x) => x.id === g.id);
          return old ? { ...g, ...old, fatores: old.fatores?.length ? old.fatores : g.fatores } : g;
        })
      : gruposBase;
    setMetodologia(
      s.metodologia ||
        metodologiaTexto({
          ...info,
          respondentes: respostas.length,
          empresaNome: empresa?.razao_social || "a empresa avaliada",
          grupos: gsBase,
        }),
    );

    const gs = gsBase;
    setGrupos(gs);

    const baseMed = medidasDosGrupos(gs);
    setMedidas(
      baseMed.map((m) => {
        const old = (s.medidas as MedidaControle[] | undefined)?.find((x) => x.key === m.key);
        return old ? { ...m, ...old } : m;
      }),
    );

    setConclusao(s.conclusao || conclusaoTecnica(gs, empresa?.razao_social || "a empresa"));
    setIntroPlano(s.introPlano || planoAcaoTexto(gs, empresa?.razao_social || "a empresa avaliada"));
    setRegistros({ aplicador: "", responsavel_empresa: "", data: "", versao: salvo?.versao || "1.0", ...(s.registros || {}) });

    abrirMetRef.current = !s.metInfo?.periodo;
    if (!usarIa && abrirMetRef.current) setMetOpen(true);
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaliacao, gruposBase, salvoFetched]);

  // ---------- IA: gera os textos técnicos antes do modal de metodologia ----------
  useEffect(() => {
    if (!pronto || !usarIa || iaFeitaRef.current) return;
    iaFeitaRef.current = true;
    (async () => {
      setIaRodando(true);
      try {
        const contexto = montarContexto({
          empresa, contrato, avaliacao, setores, indicadores,
          respondentes: respostas.length, grupos, medidas, metInfo,
        });
        const out = await gerarTextosIa(contexto);
        if (out.metodologia) setMetodologia(out.metodologia);
        if (out.conclusao) setConclusao(out.conclusao);
        if (out.intro_plano_acao) setIntroPlano(out.intro_plano_acao);
        setLacunasIa(out.lacunas || []);
        if (out.grupos?.length) {
          setGrupos((prev) => prev.map((g) => {
            const ia = out.grupos.find((x) => x.grupo_id === g.id);
            if (!ia) return g;
            return {
              ...g,
              atividades: ia.atividades || g.atividades,
              organizacao: ia.organizacao || g.organizacao,
              fatores: g.fatores.map((f) => {
                const fi = ia.fatores?.find((x) => x.fator_key === f.key);
                if (!fi) return f;
                return {
                  ...f,
                  descricao: fi.descricao || f.descricao,
                  fonte: fi.fonte || f.fonte,
                  situacao: fi.situacao || f.situacao,
                  interpretacao: fi.interpretacao || f.interpretacao,
                  consequencias: fi.consequencias || f.consequencias,
                  controles: fi.controles || f.controles,
                };
              }),
            };
          }));
        }
        if (out.medidas?.length) {
          setMedidas((prev) => prev.map((m) => {
            const mi = out.medidas.find((x) => x.medida_key === m.key);
            return mi
              ? {
                  ...m,
                  medida: mi.medida || m.medida,
                  tipo: mi.tipo || m.tipo,
                  responsavel: mi.responsavel || m.responsavel,
                  prazo: mi.prazo || m.prazo,
                  prioridade: mi.prioridade || m.prioridade,
                }
              : m;
          }));
        }
        toast.success("Textos técnicos gerados com IA. Revise antes da emissão.");
      } catch (e: any) {
        toast.error(e?.message || "Não foi possível gerar os textos com IA.");
      } finally {
        setIaRodando(false);
        if (abrirMetRef.current) setMetOpen(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, usarIa]);


  // Evolução histórica
  useEffect(() => {
    if (!pronto || historico) return;
    if (anterior === undefined) return;
    if (!anterior) {
      setHistorico("Não há avaliação anterior disponível para comparação.");
      return;
    }
    const prevGrupos = construirGrupos(anterior.respostas, vinculos, empresa?.jornada_trabalho || "");
    const prevMap = new Map<string, NivelRisco>();
    prevGrupos.forEach((g) => g.fatores.forEach((f) => prevMap.set(`${g.id}::${f.key}`, f.nivel)));
    const atualMap = new Map<string, NivelRisco>();
    grupos.forEach((g) => g.fatores.forEach((f) => atualMap.set(`${g.id}::${f.key}`, f.nivel)));

    const novos: string[] = [], reduzidos: string[] = [], alterados: string[] = [];
    for (const [k, n] of atualMap) {
      const p = prevMap.get(k);
      const nome = k.split("::")[0].replace("||", " — ");
      if (!p) novos.push(`${nome} / ${k.split("::")[1]}`);
      else if (p !== n) alterados.push(`${nome} / ${k.split("::")[1]}: ${p} → ${n}`);
    }
    for (const [k] of prevMap) if (!atualMap.has(k)) reduzidos.push(`${k.split("::")[0].replace("||", " — ")} / ${k.split("::")[1]}`);

    const concl = medidas.filter((m) => m.status === "Concluída").length;
    setHistorico([
      `Comparativo com a avaliação anterior "${anterior.avaliacao.titulo}" (${new Date(anterior.avaliacao.created_at).toLocaleDateString("pt-BR")}).`,
      `Riscos novos: ${novos.length ? novos.join("; ") : "nenhum"}.`,
      `Riscos reduzidos/eliminados: ${reduzidos.length ? reduzidos.join("; ") : "nenhum"}.`,
      `Alterações no nível de risco: ${alterados.length ? alterados.join("; ") : "nenhuma"}.`,
      `Ações concluídas registradas no plano de ação: ${concl}. Ações vencidas: conforme prazos registrados no plano de ação.`,
    ].join(" "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, anterior, grupos]);

  const aplicarMetodologia = (v: MetodologiaInfo) => {
    setMetInfo(v);
    setMetodologia(metodologiaTexto({
      ...v,
      respondentes: respostas.length,
      empresaNome: empresa?.razao_social || "a empresa avaliada",
      grupos,
    }));
    toast.success("Texto da metodologia atualizado.");
  };

  const escolherResponsavel = (id: string) => {
    const r = responsaveis.find((x) => x.id === id);
    setIdent((p) => ({
      ...p,
      responsavel_id: id,
      responsavel_nome: r?.nome || p.responsavel_nome,
      responsavel_registro: r?.registro_profissional || p.responsavel_registro,
    }));
  };

  const salvar = async () => {
    setSalvando(true);
    const dados = { ident, metInfo, metodologia, grupos, medidas, conclusao, introPlano, historico, registros };
    const { error } = await supabase.from("psico_relatorios").upsert({
      avaliacao_id: avaliacaoId!,
      empresa_id: empresaId!,
      contrato_id: contratoId!,
      versao: registros.versao || "1.0",
      dados: dados as any,
    } as any, { onConflict: "avaliacao_id" });
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Relatório salvo.");
  };

  const baixarPdf = () => {
    try {
      gerarPdfPsicossocial({
        empresa, contrato, identificacao: ident, metodologia, grupos, medidas,
        conclusao, indicadores, historico, registros,
        interpretacaoIndicadores: interpretarIndicadores(indicadores, grupos),
        introPlanoAcao: introPlano || planoAcaoTexto(grupos, empresa?.razao_social || "a empresa avaliada"),
        titulo: avaliacao?.titulo || "Avaliação Psicossocial",
      });
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + (e?.message || ""));
    }
  };

  const setGrupo = (id: string, patch: Partial<GrupoRelatorio>) =>
    setGrupos((p) => p.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const setFator = (gid: string, key: string, patch: any) =>
    setGrupos((p) => p.map((g) => (g.id === gid
      ? { ...g, fatores: g.fatores.map((f) => (f.key === key ? { ...f, ...patch, nivel: nivelDeRisco(patch.probabilidade ?? f.probabilidade, patch.severidade ?? f.severidade) } : f)) }
      : g)));
  const setMedida = (key: string, patch: Partial<MedidaControle>) =>
    setMedidas((p) => p.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const totalTrab = grupos.reduce((a, g) => a + (g.trabalhadores || 0), 0) || 1;
  // A matriz representa apenas os riscos caracterizados (exclui Baixo e não identificados).
  const ocup = useMemo(() => matrizOcupada(grupos), [grupos]);
  const totalMatriz = useMemo(
    () => grupos.flatMap((g) => g.fatores).filter(fatorCaracterizado).length,
    [grupos],
  );
  const pgr = useMemo(() => riscosParaPgr(grupos), [grupos]);
  const indicadoresGraf = useMemo(() => indicadoresPreenchidos(indicadores), [indicadores]);
  const textoIndicadores = useMemo(() => interpretarIndicadores(indicadores, grupos), [indicadores, grupos]);
  const textoPlanoFallback = useMemo(
    () => planoAcaoTexto(grupos, empresa?.razao_social || "a empresa avaliada"),
    [grupos, empresa],
  );

  if (!pronto) {
    return (
      <div className="max-w-7xl mx-auto p-10 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
        Consolidando dados da avaliação…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-8 print:p-0">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/psicossocial/${empresaId}/${contratoId}/avaliacao/${avaliacaoId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Salvar edições
          </Button>
          <Button onClick={baixarPdf}><Download className="w-4 h-4 mr-1.5" /> Baixar PDF</Button>
        </div>
      </div>

      <PageHeader
        title="Relatório Técnico de Avaliação Psicossocial"
        description="NR-01 · NR-17 — todos os textos gerados são editáveis antes da emissão do PDF."
      />

      {/* 1 - Identificação */}
      <Secao n="1" titulo="Identificação da empresa">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["razao_social", "Razão Social"], ["nome_fantasia", "Nome Fantasia"], ["cnpj", "CNPJ"],
            ["cnae", "CNAE"], ["endereco", "Endereço"], ["unidade", "Unidade / Estabelecimento"],
          ].map(([k, l]) => (
            <div key={k} className="grid gap-1.5">
              <Label>{l}</Label>
              <Input value={ident[k] || ""} onChange={(e) => setIdent({ ...ident, [k]: e.target.value })} />
            </div>
          ))}
          <div className="grid gap-1.5">
            <Label>Responsável pela avaliação</Label>
            <Select value={ident.responsavel_id || ""} onValueChange={escolherResponsavel}>
              <SelectTrigger><SelectValue placeholder="Selecionar do cadastro" /></SelectTrigger>
              <SelectContent>
                {responsaveis.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nome}{r.funcao ? ` — ${r.funcao}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="mt-1"
              placeholder="Nome (edição manual)"
              value={ident.responsavel_nome || ""}
              onChange={(e) => setIdent({ ...ident, responsavel_nome: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Registro profissional</Label>
            <Input value={ident.responsavel_registro || ""} onChange={(e) => setIdent({ ...ident, responsavel_registro: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Data da avaliação</Label>
            <Input value={ident.data_avaliacao || ""} onChange={(e) => setIdent({ ...ident, data_avaliacao: e.target.value })} />
          </div>
        </div>
      </Secao>

      {/* 2 - Setores / GHE */}
      <Secao n="2" titulo="Identificação dos setores / GHE-GES">
        <div className="space-y-4">
          {grupos.map((g) => (
            <Card key={g.id} className="p-4 space-y-3 bg-muted/30">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary">{g.setor}</Badge>
                <Badge variant="outline">GHE/GES: {g.ghe}</Badge>
                <span className="text-xs text-muted-foreground">{g.funcoes.join(", ")}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Quantidade de trabalhadores</Label>
                  <Input
                    type="number"
                    value={g.trabalhadores}
                    onChange={(e) => setGrupo(g.id, { trabalhadores: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Jornada / turno</Label>
                  <Input value={g.jornada} onChange={(e) => setGrupo(g.id, { jornada: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Descrição resumida das atividades</Label>
                <Textarea value={g.atividades} onChange={(e) => setGrupo(g.id, { atividades: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Características da organização do trabalho</Label>
                <Textarea value={g.organizacao} onChange={(e) => setGrupo(g.id, { organizacao: e.target.value })} />
              </div>
            </Card>
          ))}
        </div>
      </Secao>

      {/* 3 - Metodologia */}
      <Secao
        n="3"
        titulo="Metodologia utilizada"
        acao={<Button variant="outline" size="sm" onClick={() => setMetOpen(true)}><Settings2 className="w-4 h-4 mr-1.5" />Informações</Button>}
      >
        <Textarea className="min-h-[320px] text-sm leading-relaxed" value={metodologia} onChange={(e) => setMetodologia(e.target.value)} />
      </Secao>

      {/* 4 - Fatores */}
      <Secao n="4" titulo="Fatores de risco psicossocial investigados">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Todas as dimensões investigadas no questionário são apresentadas, independentemente do
          resultado. Quando não há evidências suficientes de agravamento, o fator permanece registrado
          como investigado e classificado em nível Baixo ou como não identificado.
        </p>
        {grupos.filter((g) => g.fatores.length).map((g) => (
          <div key={g.id} className="space-y-4">
            <h3 className="font-semibold text-sm border-l-4 border-primary pl-3">{g.setor} — {g.ghe}</h3>
            <div className="space-y-4">
              {g.fatores.map((f) => (
                <Card key={f.key} className="p-5 space-y-4 bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm">{f.fator}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={corNivel(f.nivel)}>{f.nivel}</Badge>
                      <Badge variant="outline">
                        {f.sustentado === false ? "Não identificado" : "Fator caracterizado"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Descrição</Label>
                      <Textarea value={f.descricao} onChange={(e) => setFator(g.id, f.key, { descricao: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Fonte / Causa</Label>
                      <Textarea value={f.fonte} onChange={(e) => setFator(g.id, f.key, { fonte: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Situação de exposição</Label>
                      <Textarea value={f.situacao} onChange={(e) => setFator(g.id, f.key, { situacao: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Interpretação técnica</Label>
                      <Textarea value={f.interpretacao || ""} onChange={(e) => setFator(g.id, f.key, { interpretacao: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Consequências potenciais</Label>
                      <Textarea value={f.consequencias} onChange={(e) => setFator(g.id, f.key, { consequencias: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Controles existentes</Label>
                      <Textarea value={f.controles} onChange={(e) => setFator(g.id, f.key, { controles: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Trabalhadores expostos</Label>
                      <Input type="number" value={f.expostos} onChange={(e) => setFator(g.id, f.key, { expostos: Number(e.target.value) })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Frequência</Label>
                      <Input value={f.frequencia} onChange={(e) => setFator(g.id, f.key, { frequencia: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Probabilidade (1-4)</Label>
                      <Input type="number" min={1} max={4} value={f.probabilidade} onChange={(e) => setFator(g.id, f.key, { probabilidade: Math.min(4, Math.max(1, Number(e.target.value))) })} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Severidade (1-4)</Label>
                      <Input type="number" min={1} max={4} value={f.severidade} onChange={(e) => setFator(g.id, f.key, { severidade: Math.min(4, Math.max(1, Number(e.target.value))) })} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </Secao>


      {/* 5 - Resultado */}
      <Secao n="5" titulo="Resultado da avaliação">
        <div className="grid gap-4 md:grid-cols-2">
          {grupos.map((g) => {
            const r = resumoPorGrupo(g);
            return (
              <Card key={g.id} className="p-5 space-y-2.5">
                <p className="font-semibold text-sm">{g.setor} — {g.ghe}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Fatores investigados: <b>{r.investigados}</b></span>
                  <span>Caracterizados: <b>{r.caracterizados}</b></span>
                  <span>Baixo: {r.cont.Baixo} · Não identificado: {r.naoIdentificado}</span>
                  <span>Médio: {r.cont["Médio"]}</span>
                  <span>Alto: {r.cont.Alto} · Crítico: {r.cont["Crítico"]}</span>
                  <span>Predominante: <b>{r.predominante}</b></span>
                  <span className="col-span-2">Trabalhadores envolvidos: <b>{Math.round(((g.trabalhadores || 0) / totalTrab) * 100)}%</b> ({g.trabalhadores})</span>
                  <span className="col-span-2">Prioritários: {r.criticos.join("; ") || "—"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </Secao>

      {/* 6 - Matriz */}
      <Secao n="6" titulo="Matriz de risco (Probabilidade × Severidade)">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A matriz representa somente os riscos caracterizados que demandam representação metodológica.
          Fatores classificados como Baixo e fatores não identificados não são plotados, permanecendo
          registrados nas seções 4 e 6.1 para fins de rastreabilidade.
        </p>
        {totalMatriz === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum risco caracterizado a representar na matriz conforme os critérios da metodologia adotada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm">
              <tbody>
                {[4, 3, 2, 1].map((s) => (
                  <tr key={s}>
                    <td className="pr-3 text-right font-medium whitespace-nowrap">{SEV_LABELS[s - 1]}</td>
                    {[1, 2, 3, 4].map((p) => {
                      const n = nivelDeRisco(p, s);
                      const qtd = ocup[`${p}-${s}`] || 0;
                      return (
                        <td key={p} className="p-1">
                          <div className={`w-24 h-16 grid place-items-center rounded text-primary-foreground font-bold ${NIVEL_BG[n]} ${qtd ? "" : "opacity-25"}`}>
                            {qtd || ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td />
                  {PROB_LABELS.map((l) => (
                    <td key={l} className="text-center pt-2 font-medium">{l}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="space-y-3 pt-2">
          <h3 className="font-semibold text-sm">6.1 Riscos recomendados para gerenciamento no PGR</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Constam todos os fatores investigados, com distinção entre o resultado da avaliação e a
            necessidade de intervenção, assegurando a rastreabilidade completa.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  {["Setor", "GHE/GES", "Fator investigado", "Resultado da avaliação", "Intervenção", "Justificativa técnica"].map((h) => (
                    <th key={h} className="border p-2.5 text-left font-semibold align-bottom">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pgr.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="border p-2.5">{r.setor}</td>
                    <td className="border p-2.5">{r.ghe}</td>
                    <td className="border p-2.5 font-medium">{r.fator}</td>
                    <td className="border p-2.5">
                      <Badge variant="outline" className={corNivel(r.nivel)}>{r.nivel}</Badge>
                      <span className="block mt-1 text-xs text-muted-foreground">{r.resultado}</span>
                    </td>
                    <td className="border p-2.5">{r.intervencao}</td>
                    <td className="border p-2.5 leading-relaxed">{r.justificativa}</td>
                  </tr>
                ))}
                {!pgr.length && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum fator investigado registrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Secao>

      {/* 7 - Medidas */}
      <Secao n="7" titulo="Medidas de prevenção e controle">
        <div className="space-y-4">
          {medidas.map((m) => (
            <Card key={m.key} className="p-5 space-y-4 bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-sm">{m.grupo} — {m.risco}</p>
                <Badge variant="outline">{m.prioridade}</Badge>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Medida recomendada</Label>
                <Textarea value={m.medida} onChange={(e) => setMedida(m.key, { medida: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Tipo de controle</Label>
                  <Input value={m.tipo} onChange={(e) => setMedida(m.key, { tipo: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Responsável</Label>
                  <Input value={m.responsavel} onChange={(e) => setMedida(m.key, { responsavel: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Prazo</Label>
                  <Input value={m.prazo} onChange={(e) => setMedida(m.key, { prazo: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Prioridade</Label>
                  <Input value={m.prioridade} onChange={(e) => setMedida(m.key, { prioridade: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={m.status} onValueChange={(v) => setMedida(m.key, { status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Monitorado">Monitorado</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Evidência</Label>
                  <Input value={m.evidencia} onChange={(e) => setMedida(m.key, { evidencia: e.target.value })} />
                </div>
              </div>
            </Card>
          ))}
          {!medidas.length && <p className="text-sm text-muted-foreground">Nenhuma medida aplicável.</p>}
        </div>
      </Secao>

      {/* 8 - Indicadores */}
      <Secao n="8" titulo="Indicadores organizacionais">
        {!indicadoresGraf.numericos.length && !indicadoresGraf.qualitativos.length ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Não foram informados indicadores organizacionais para esta avaliação.
          </p>
        ) : (
          <>
            {!!indicadoresGraf.numericos.length && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="p-5">
                  <p className="text-sm font-semibold mb-4">Indicadores quantitativos informados</p>
                  <ResponsiveContainer width="100%" height={Math.max(240, indicadoresGraf.numericos.length * 52)}>
                    <BarChart
                      data={indicadoresGraf.numericos}
                      layout="vertical"
                      margin={{ top: 8, right: 40, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={180}
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={22}>
                        <LabelList dataKey="valor" position="right" style={{ fontSize: 12 }} />
                        {indicadoresGraf.numericos.map((n) => <Cell key={n.key} fill={n.cor} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2 content-start">
                  {indicadoresGraf.numericos.map((n) => (
                    <Card key={n.key} className="p-4 border-l-4" style={{ borderLeftColor: n.cor }}>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{n.label}</p>
                      <p className="text-2xl font-heading font-bold" style={{ color: n.cor }}>{n.texto}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {!!indicadoresGraf.qualitativos.length && (
              <div className="grid gap-4 md:grid-cols-2">
                {indicadoresGraf.qualitativos.map((q) => (
                  <Card key={q.key} className="p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{q.label}</p>
                    <p className="text-sm leading-relaxed mt-1">{q.texto}</p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        <div className="grid gap-1.5">
          <Label>Análise técnica dos indicadores</Label>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground border rounded-md p-4 bg-muted/20">
            {textoIndicadores}
          </p>
        </div>
      </Secao>

      {/* 9 - Comparativo e histórico */}
      <Secao n="9" titulo="Comparativo entre setores e evolução histórica">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Setor / GHE", "Nº de fatores investigados", "Baixo", "Não identificado", "Médio", "Alto", "Crítico", "Trabalhadores envolvidos"].map((h) => (
                  <th key={h} className="border p-2.5 text-left font-semibold align-bottom">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const r = resumoPorGrupo(g);
                return (
                  <tr key={g.id}>
                    <td className="border p-2.5">{g.setor} — {g.ghe}</td>
                    <td className="border p-2.5">{r.investigados}</td>
                    <td className="border p-2.5">{r.cont.Baixo}</td>
                    <td className="border p-2.5">{r.naoIdentificado}</td>
                    <td className="border p-2.5">{r.cont["Médio"]}</td>
                    <td className="border p-2.5">{r.cont.Alto}</td>
                    <td className="border p-2.5">{r.cont["Crítico"]}</td>
                    <td className="border p-2.5">{g.trabalhadores}</td>
                  </tr>
                );
              })}
              {!grupos.length && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Nenhum setor avaliado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid gap-1.5">
          <Label>Evolução histórica</Label>
          <Textarea className="min-h-[140px]" value={historico} onChange={(e) => setHistorico(e.target.value)} />
        </div>
      </Secao>

      {/* 10 - Conclusão */}
      <Secao n="10" titulo="Conclusão técnica">
        <Textarea className="min-h-[300px] text-sm leading-relaxed" value={conclusao} onChange={(e) => setConclusao(e.target.value)} />
      </Secao>

      {/* 11 - Plano de ação */}
      <Secao n="11" titulo="Plano de ação">
        <p className="text-sm leading-relaxed border rounded-md p-4 bg-muted/20">{textoPlano}</p>
        <p className="text-sm text-muted-foreground">
          O plano de ação reflete as medidas de prevenção e controle; edite os campos na seção 7 ou diretamente abaixo.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>{["Risco", "Ação", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"].map((h) => <th key={h} className="border p-2.5 text-left font-semibold align-bottom">{h}</th>)}</tr>
            </thead>
            <tbody>
              {medidas.map((m) => (
                <tr key={m.key} className="align-top">
                  <td className="border p-2.5 min-w-[180px]">{m.grupo} — {m.risco}</td>
                  <td className="border p-2 min-w-[320px]"><Textarea value={m.medida} onChange={(e) => setMedida(m.key, { medida: e.target.value })} /></td>
                  <td className="border p-2 min-w-[140px]"><Input value={m.responsavel} onChange={(e) => setMedida(m.key, { responsavel: e.target.value })} /></td>
                  <td className="border p-2 min-w-[130px]"><Input value={m.prazo} onChange={(e) => setMedida(m.key, { prazo: e.target.value })} /></td>
                  <td className="border p-2 min-w-[120px]"><Input value={m.prioridade} onChange={(e) => setMedida(m.key, { prioridade: e.target.value })} /></td>
                  <td className="border p-2 min-w-[130px]"><Input value={m.status} onChange={(e) => setMedida(m.key, { status: e.target.value })} /></td>
                  <td className="border p-2 min-w-[140px]"><Input value={m.evidencia} onChange={(e) => setMedida(m.key, { evidencia: e.target.value })} /></td>
                </tr>
              ))}
              {!medidas.length && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">—</td></tr>}
            </tbody>
          </table>
        </div>
      </Secao>

      {/* 12 - Responsáveis */}
      <Secao n="12" titulo="Responsáveis e registros">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <Label>Profissional responsável</Label>
            <Input value={ident.responsavel_nome || ""} onChange={(e) => setIdent({ ...ident, responsavel_nome: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Registro profissional</Label>
            <Input value={ident.responsavel_registro || ""} onChange={(e) => setIdent({ ...ident, responsavel_registro: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Aplicador da avaliação</Label>
            <Input
              list="lista-responsaveis"
              value={registros.aplicador}
              onChange={(e) => setRegistros({ ...registros, aplicador: e.target.value })}
            />
            <datalist id="lista-responsaveis">
              {responsaveis.map((r) => <option key={r.id} value={r.nome} />)}
            </datalist>
          </div>
          <div className="grid gap-1.5">
            <Label>Responsável da empresa</Label>
            <Input value={registros.responsavel_empresa} onChange={(e) => setRegistros({ ...registros, responsavel_empresa: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Data</Label>
            <Input value={registros.data} placeholder={ident.data_avaliacao} onChange={(e) => setRegistros({ ...registros, data: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Versão do documento</Label>
            <Input value={registros.versao} onChange={(e) => setRegistros({ ...registros, versao: e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          As assinaturas são impressas no PDF em campo próprio para o profissional responsável e o responsável da empresa.
        </p>
      </Secao>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={salvar} disabled={salvando}>
          {salvando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />} Salvar edições
        </Button>
        <Button size="lg" onClick={baixarPdf}><Download className="w-4 h-4 mr-1.5" /> Baixar PDF</Button>
      </div>

      <MetodologiaModal open={metOpen} onOpenChange={setMetOpen} valor={metInfo} onConfirm={aplicarMetodologia} />
    </div>
  );
}
