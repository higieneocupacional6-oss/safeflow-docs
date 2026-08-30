import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
import { ArrowLeft, Download, Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  construirGrupos, medidasDosGrupos, conclusaoTecnica, metodologiaTexto, normalizarFuncao,
  resumoPorGrupo, riscosParaPgr, nivelDeRisco, corNivel, PROB_LABELS, SEV_LABELS,
  INDICADORES_CAMPOS, type GrupoRelatorio, type MedidaControle, type NivelRisco, type VinculoFuncao,
} from "@/lib/psicoRelatorio";
import { gerarPdfPsicossocial } from "@/lib/psicoRelatorioPdf";
import { MetodologiaModal, type MetodologiaInfo } from "@/components/psico/MetodologiaModal";

const NIVEL_BG: Record<NivelRisco, string> = {
  "Baixo": "bg-emerald-500",
  "Médio": "bg-yellow-500",
  "Alto": "bg-orange-500",
  "Crítico": "bg-red-600",
};

function Secao({ n, titulo, children, acao }: any) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <h2 className="font-heading font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs grid place-items-center">{n}</span>
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
  const [salvando, setSalvando] = useState(false);
  const [metOpen, setMetOpen] = useState(false);
  const [pronto, setPronto] = useState(false);

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
    setMetodologia(s.metodologia || metodologiaTexto({ ...info, respondentes: respostas.length }));

    const gs = (s.grupos as GrupoRelatorio[] | undefined)?.length
      ? gruposBase.map((g) => {
          const old = (s.grupos as GrupoRelatorio[]).find((x) => x.id === g.id);
          return old ? { ...g, ...old, fatores: old.fatores?.length ? old.fatores : g.fatores } : g;
        })
      : gruposBase;
    setGrupos(gs);

    const baseMed = medidasDosGrupos(gs);
    setMedidas(
      baseMed.map((m) => {
        const old = (s.medidas as MedidaControle[] | undefined)?.find((x) => x.key === m.key);
        return old ? { ...m, ...old } : m;
      }),
    );

    setConclusao(s.conclusao || conclusaoTecnica(gs, empresa?.razao_social || "a empresa"));
    setRegistros({ aplicador: "", responsavel_empresa: "", data: "", versao: salvo?.versao || "1.0", ...(s.registros || {}) });

    if (!s.metInfo?.periodo) setMetOpen(true);
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaliacao, gruposBase, salvoFetched]);

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
    setMetodologia(metodologiaTexto({ ...v, respondentes: respostas.length }));
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
    const dados = { ident, metInfo, metodologia, grupos, medidas, conclusao, historico, registros };
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
  const ocup = useMemo(() => {
    const m: Record<string, number> = {};
    grupos.forEach((g) => g.fatores.forEach((f) => { const k = `${f.probabilidade}-${f.severidade}`; m[k] = (m[k] || 0) + 1; }));
    return m;
  }, [grupos]);
  const pgr = useMemo(() => riscosParaPgr(grupos), [grupos]);

  if (!pronto) {
    return (
      <div className="max-w-6xl mx-auto p-10 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
        Consolidando dados da avaliação…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 print:p-0">
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
        <Textarea className="min-h-[260px] text-sm" value={metodologia} onChange={(e) => setMetodologia(e.target.value)} />
      </Secao>

      {/* 4 - Fatores */}
      <Secao n="4" titulo="Fatores de risco psicossocial investigados">
        <p className="text-xs text-muted-foreground">
          Todas as dimensões investigadas no questionário são apresentadas. Quando não há evidências
          suficientes de agravamento, o fator é registrado como investigado e classificado em nível Baixo.
        </p>
        {grupos.filter((g) => g.fatores.length).map((g) => (
          <div key={g.id} className="space-y-2">
            <h3 className="font-semibold text-sm">{g.setor} — {g.ghe}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border">
                <thead className="bg-muted">
                  <tr>
                    {["Fator", "Descrição", "Fonte/Causa", "Situação de exposição", "Expostos", "Freq.", "P", "S", "Nível", "Interpretação", "Consequências", "Controles existentes"].map((h) => (
                      <th key={h} className="border p-1.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.fatores.map((f) => (
                    <tr key={f.key} className="align-top">
                      <td className="border p-1 font-medium">{f.fator}</td>
                      <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={f.descricao} onChange={(e) => setFator(g.id, f.key, { descricao: e.target.value })} /></td>
                      <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={f.fonte} onChange={(e) => setFator(g.id, f.key, { fonte: e.target.value })} /></td>
                      <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={f.situacao} onChange={(e) => setFator(g.id, f.key, { situacao: e.target.value })} /></td>
                      <td className="border p-1 w-16"><Input className="h-8 text-[11px]" type="number" value={f.expostos} onChange={(e) => setFator(g.id, f.key, { expostos: Number(e.target.value) })} /></td>
                      <td className="border p-1 w-24"><Input className="h-8 text-[11px]" value={f.frequencia} onChange={(e) => setFator(g.id, f.key, { frequencia: e.target.value })} /></td>
                      <td className="border p-1 w-14"><Input className="h-8 text-[11px]" type="number" min={1} max={4} value={f.probabilidade} onChange={(e) => setFator(g.id, f.key, { probabilidade: Math.min(4, Math.max(1, Number(e.target.value))) })} /></td>
                      <td className="border p-1 w-14"><Input className="h-8 text-[11px]" type="number" min={1} max={4} value={f.severidade} onChange={(e) => setFator(g.id, f.key, { severidade: Math.min(4, Math.max(1, Number(e.target.value))) })} /></td>
                      <td className="border p-1"><Badge variant="outline" className={corNivel(f.nivel)}>{f.nivel}</Badge></td>
                      <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={f.interpretacao || ""} onChange={(e) => setFator(g.id, f.key, { interpretacao: e.target.value })} /></td>
                      <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={f.consequencias} onChange={(e) => setFator(g.id, f.key, { consequencias: e.target.value })} /></td>
                      <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={f.controles} onChange={(e) => setFator(g.id, f.key, { controles: e.target.value })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Secao>


      {/* 5 - Resultado */}
      <Secao n="5" titulo="Resultado da avaliação">
        <div className="grid gap-3 md:grid-cols-2">
          {grupos.map((g) => {
            const r = resumoPorGrupo(g);
            return (
              <Card key={g.id} className="p-4 space-y-2">
                <p className="font-semibold text-sm">{g.setor} — {g.ghe}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span>Fatores investigados: <b>{g.fatores.length}</b> · caracterizados: <b>{g.fatores.filter((f) => f.sustentado !== false).length}</b></span>
                  <span>Risco predominante: <b>{r.predominante}</b></span>
                  <span>Baixo: {r.cont.Baixo} · Médio: {r.cont["Médio"]}</span>
                  <span>Alto: {r.cont.Alto} · Crítico: {r.cont["Crítico"]}</span>
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
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <tbody>
              {[4, 3, 2, 1].map((s) => (
                <tr key={s}>
                  <td className="pr-2 text-right font-medium whitespace-nowrap">{SEV_LABELS[s - 1]}</td>
                  {[1, 2, 3, 4].map((p) => {
                    const n = nivelDeRisco(p, s);
                    const qtd = ocup[`${p}-${s}`] || 0;
                    return (
                      <td key={p} className="p-0.5">
                        <div className={`w-20 h-14 grid place-items-center rounded text-white font-bold ${NIVEL_BG[n]} ${qtd ? "" : "opacity-25"}`}>
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
                  <td key={l} className="text-center pt-1 font-medium">{l}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-semibold text-sm mt-4 mb-2">Riscos recomendados para gerenciamento no PGR</h3>
          {pgr.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Conforme os resultados obtidos, nenhum risco demanda gerenciamento adicional no PGR.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {pgr.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <Badge variant="outline" className={corNivel(r.nivel)}>{r.nivel}</Badge>
                  <span><b>{r.setor} — {r.ghe}:</b> {r.fator}. {r.justificativa}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Secao>

      {/* 7 - Medidas */}
      <Secao n="7" titulo="Medidas de prevenção e controle">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border">
            <thead className="bg-muted">
              <tr>{["Setor/GHE", "Risco", "Medida recomendada", "Tipo", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"].map((h) => <th key={h} className="border p-1.5 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {medidas.map((m) => (
                <tr key={m.key} className="align-top">
                  <td className="border p-1">{m.grupo}</td>
                  <td className="border p-1">{m.risco}</td>
                  <td className="border p-1"><Textarea className="text-[11px] min-h-16" value={m.medida} onChange={(e) => setMedida(m.key, { medida: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.tipo} onChange={(e) => setMedida(m.key, { tipo: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.responsavel} onChange={(e) => setMedida(m.key, { responsavel: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.prazo} onChange={(e) => setMedida(m.key, { prazo: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.prioridade} onChange={(e) => setMedida(m.key, { prioridade: e.target.value })} /></td>
                  <td className="border p-1 w-32">
                    <Select value={m.status} onValueChange={(v) => setMedida(m.key, { status: v })}>
                      <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.evidencia} onChange={(e) => setMedida(m.key, { evidencia: e.target.value })} /></td>
                </tr>
              ))}
              {!medidas.length && <tr><td colSpan={9} className="p-3 text-center text-muted-foreground">Nenhuma medida aplicável.</td></tr>}
            </tbody>
          </table>
        </div>
      </Secao>

      {/* 8 - Indicadores */}
      <Secao n="8" titulo="Indicadores organizacionais">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INDICADORES_CAMPOS.map((c) => (
            <Card key={c.key} className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{c.label}</p>
              <p className="text-lg font-heading font-bold">{indicadores[c.key] || "—"}</p>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Preenchidos na página da avaliação. Dados apresentados de forma agregada, preservando a
          confidencialidade dos trabalhadores.
        </p>
      </Secao>

      {/* 9 - Comparativo e histórico */}
      <Secao n="9" titulo="Comparativo entre setores e evolução histórica">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>{["Setor", "Nº de riscos", "Baixo", "Médio", "Alto", "Crítico", "Trabalhadores expostos"].map((h) => <th key={h} className="border p-1.5 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const r = resumoPorGrupo(g);
                return (
                  <tr key={g.id}>
                    <td className="border p-1.5">{g.setor} — {g.ghe}</td>
                    <td className="border p-1.5">{g.fatores.length}</td>
                    <td className="border p-1.5">{r.cont.Baixo}</td>
                    <td className="border p-1.5">{r.cont["Médio"]}</td>
                    <td className="border p-1.5">{r.cont.Alto}</td>
                    <td className="border p-1.5">{r.cont["Crítico"]}</td>
                    <td className="border p-1.5">{g.trabalhadores}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-1.5">
          <Label>Evolução histórica</Label>
          <Textarea className="min-h-[120px]" value={historico} onChange={(e) => setHistorico(e.target.value)} />
        </div>
      </Secao>

      {/* 10 - Conclusão */}
      <Secao n="10" titulo="Conclusão técnica">
        <Textarea className="min-h-[200px] text-sm" value={conclusao} onChange={(e) => setConclusao(e.target.value)} />
      </Secao>

      {/* 11 - Plano de ação */}
      <Secao n="11" titulo="Plano de ação">
        <p className="text-xs text-muted-foreground">
          O plano de ação reflete as medidas de prevenção e controle; edite os campos na seção 7 ou diretamente abaixo.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border">
            <thead className="bg-muted">
              <tr>{["Risco", "Ação", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"].map((h) => <th key={h} className="border p-1.5 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {medidas.map((m) => (
                <tr key={m.key} className="align-top">
                  <td className="border p-1">{m.grupo} — {m.risco}</td>
                  <td className="border p-1"><Textarea className="text-[11px] min-h-14" value={m.medida} onChange={(e) => setMedida(m.key, { medida: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.responsavel} onChange={(e) => setMedida(m.key, { responsavel: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.prazo} onChange={(e) => setMedida(m.key, { prazo: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.prioridade} onChange={(e) => setMedida(m.key, { prioridade: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.status} onChange={(e) => setMedida(m.key, { status: e.target.value })} /></td>
                  <td className="border p-1"><Input className="h-8 text-[11px]" value={m.evidencia} onChange={(e) => setMedida(m.key, { evidencia: e.target.value })} /></td>
                </tr>
              ))}
              {!medidas.length && <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">—</td></tr>}
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
