import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, QrCode, Copy, Sparkles, Loader2, Trash2, ClipboardList, FileBarChart2, Save, Bot,
} from "lucide-react";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { parseTexto } from "@/components/PsicossocialTextInputModal";
import { BLOCOS_COPSOQ } from "@/lib/copsoqBlocos";
import { ESCALA_COPSOQ } from "@/components/PsicossocialModal";
import { publicPsicoUrl, corClassificacao } from "@/lib/psicoLink";
import { FuncoesNaoVinculadasModal } from "@/components/psico/FuncoesNaoVinculadasModal";
import { IaBaseTecnicaModal } from "@/components/psico/IaBaseTecnicaModal";
import { IaEscolhaModal } from "@/components/psico/IaEscolhaModal";
import { INDICADORES_CAMPOS, normalizarFuncao } from "@/lib/psicoRelatorio";

const labelEscala = (v: number) =>
  ESCALA_COPSOQ.find((e) => e.value === v)?.label || "—";

export default function PsicossocialAvaliacao() {
  const { empresaId, contratoId, avaliacaoId } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [texto, setTexto] = useState("");
  const [funcaoManual, setFuncaoManual] = useState("");
  const [gerando, setGerando] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [detalhe, setDetalhe] = useState<any | null>(null);
  const [naoVinculadas, setNaoVinculadas] = useState<string[]>([]);
  const [avisoOpen, setAvisoOpen] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [indicadores, setIndicadores] = useState<Record<string, string>>({});
  const [salvandoInd, setSalvandoInd] = useState(false);
  const [baseIaOpen, setBaseIaOpen] = useState(false);
  const [iaEscolhaOpen, setIaEscolhaOpen] = useState(false);


  useRealtimeSync(
    [{ table: "psico_respostas", queryKey: ["psico-av-resp", avaliacaoId] }],
    `psico-av-${avaliacaoId}`,
  );

  const { data: avaliacao } = useQuery({
    queryKey: ["psico-av", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_avaliacoes")
        .select("*, empresas(razao_social), contratos(numero_contrato)")
        .eq("id", avaliacaoId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: respostas = [] } = useQuery({
    queryKey: ["psico-av-resp", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("psico_respostas")
        .select("*")
        .eq("avaliacao_id", avaliacaoId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  /** Um card por função (agrupa respostas da mesma função). */
  const cards = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of respostas) {
      const k = (r.funcao_nome || "Não informada").trim();
      map.set(k, [...(map.get(k) || []), r]);
    }
    return Array.from(map.entries()).map(([funcao, itens]) => ({ funcao, itens }));
  }, [respostas]);

  /** Cria (ou reaproveita) o link público desta avaliação. */
  const { data: link, refetch: refetchLink } = useQuery({
    queryKey: ["psico-av-link", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("psico_links")
        .select("id, token")
        .eq("avaliacao_id", avaliacaoId!)
        .maybeSingle();
      return (data as any) || null;
    },
  });

  const abrirLink = async () => {
    setLinkOpen(true);
    if (link?.token) return;
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("psico_links").insert({
      empresa_id: empresaId!,
      contrato_id: contratoId!,
      avaliacao_id: avaliacaoId!,
      token,
    } as any);
    if (error) { toast.error(error.message); return; }
    refetchLink();
  };

  useEffect(() => {
    if (linkOpen && link?.token) {
      QRCode.toDataURL(publicPsicoUrl(link.token), { width: 360, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    }
  }, [linkOpen, link?.token]);

  const copiar = async () => {
    if (!link?.token) return;
    await navigator.clipboard.writeText(publicPsicoUrl(link.token));
    toast.success("Link copiado");
  };

  const gerar = async () => {
    if (!texto.trim()) { toast.error("Escreva as perguntas e respostas do colaborador."); return; }
    setGerando(true);
    try {
      const res = parseTexto(texto, funcaoManual);
      if (!res.avaliacoes.length) {
        toast.error("Nenhuma resposta pôde ser reconhecida. Revise o texto.");
        return;
      }
      const rows = res.avaliacoes.map((a) => ({
        link_id: link?.id || null,
        avaliacao_id: avaliacaoId!,
        empresa_id: empresaId!,
        contrato_id: contratoId!,
        contrato_nome: avaliacao?.contratos?.numero_contrato || null,
        funcao_nome: a.funcao || funcaoManual || "Não informada",
        colaborador_nome: a.colaborador_nome || null,
        data_avaliacao: a.data_avaliacao || new Date().toISOString().slice(0, 10),
        respostas: a.respostas as any,
        blocos: a.blocos as any,
        alertas: a.alertas as any,
        resultado_psicossocial: a.resultado_psicossocial,
        riscos_psicossociais: a.riscos_psicossociais,
        total_positivas: a.total_positivas,
        total_negativas: a.total_negativas,
        copsoq_resultado_resumido: a.copsoq_resultado_resumido,
        copsoq_riscos_identificados: a.copsoq_riscos_identificados,
      }));
      const insert = link?.id ? rows : rows.map(({ link_id, ...r }) => r);
      const { error } = await supabase.from("psico_respostas").insert(insert as any);
      if (error) throw error;
      toast.success(`${rows.length} avaliação(ões) gerada(s).`);
      setTexto("");
      setFuncaoManual("");
      qc.invalidateQueries({ queryKey: ["psico-av-resp", avaliacaoId] });
    } catch (e: any) {
      toast.error("Erro ao gerar: " + (e?.message || ""));
    } finally {
      setGerando(false);
    }
  };

  const excluirResposta = async (id: string) => {
    const { error } = await supabase.from("psico_respostas").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["psico-av-resp", avaliacaoId] });
    setDetalhe(null);
  };

  /** Indicadores organizacionais desta avaliação. */
  const { data: indDb } = useQuery({
    queryKey: ["psico-av-ind", avaliacaoId],
    enabled: !!avaliacaoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("psico_indicadores").select("dados").eq("avaliacao_id", avaliacaoId!).maybeSingle();
      return ((data as any)?.dados || {}) as Record<string, string>;
    },
  });
  useEffect(() => { if (indDb) setIndicadores(indDb); }, [indDb]);

  const salvarIndicadores = async () => {
    setSalvandoInd(true);
    const { error } = await supabase.from("psico_indicadores").upsert({
      avaliacao_id: avaliacaoId!,
      empresa_id: empresaId!,
      contrato_id: contratoId!,
      dados: indicadores as any,
    } as any, { onConflict: "avaliacao_id" });
    setSalvandoInd(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["psico-av-ind", avaliacaoId] });
    toast.success("Indicadores salvos.");
  };

  /** Verifica vínculo Setor/GHE de todas as funções avaliadas e segue para o relatório. */
  const gerarRelatorio = async () => {
    setVerificando(true);
    try {
      const { data: setores, error } = await supabase
        .from("setores")
        .select("nome_setor, ghe_ges, funcoes(nome_funcao)")
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      const cadastradas = new Set<string>();
      for (const s of (setores as any[]) || []) {
        for (const f of s.funcoes || []) cadastradas.add(normalizarFuncao(f.nome_funcao));
      }
      const faltantes = Array.from(
        new Set(
          respostas
            .map((r) => (r.funcao_nome || "").trim())
            .filter((f) => f && !cadastradas.has(normalizarFuncao(f))),
        ),
      );
      if (faltantes.length) {
        setNaoVinculadas(faltantes);
        setAvisoOpen(true);
        return;
      }
      setIaEscolhaOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao verificar vínculos.");
    } finally {
      setVerificando(false);
    }
  };

  /** Abre o relatório informando se os textos devem ser elaborados com IA. */
  const irParaRelatorio = (usarIa: boolean) =>
    navigate(`/psicossocial/${empresaId}/${contratoId}/avaliacao/${avaliacaoId}/relatorio`, {
      state: { usarIa },
    });


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex gap-2">
        <Link to={`/psicossocial/${empresaId}/${contratoId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
        </Link>
      </div>

      <PageHeader
        title={avaliacao?.titulo || "Nova Avaliação"}
        description={`${avaliacao?.empresas?.razao_social || ""} — Contrato ${avaliacao?.contratos?.numero_contrato || "—"}`}
        actions={
          <>
            <Button variant="outline" onClick={abrirLink}>
              <QrCode className="w-4 h-4 mr-1.5" /> Preciso de Link
            </Button>
            {cards.length > 0 && (
              <Button onClick={gerarRelatorio} disabled={verificando}>
                {verificando
                  ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  : <FileBarChart2 className="w-4 h-4 mr-1.5" />}
                Gerar Relatório
              </Button>
            )}
          </>
        }
      />


      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="font-heading font-semibold">Escrever questionário</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cole ou escreva as perguntas e respostas do colaborador. É possível incluir várias funções
          no mesmo texto usando linhas como <code>Função: Eletricista</code>.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label>Função (opcional — usada se o texto não indicar)</Label>
            <Input
              value={funcaoManual}
              onChange={(e) => setFuncaoManual(e.target.value)}
              placeholder="Ex.: Eletricista"
            />
          </div>
          <Button onClick={gerar} disabled={gerando || !texto.trim()} className="gap-1.5">
            {gerando ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando…</> : <>Gerar</>}
          </Button>
        </div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-[220px] font-mono text-xs"
          placeholder={`Função: Eletricista

Seu trabalho exige que você trabalhe muito rápido?
Frequentemente

Seu trabalho exige prazos muito curtos?
Às vezes`}
        />
        <p className="text-[11px] text-muted-foreground">
          Escala aceita: Nunca, Raramente, Às vezes, Frequentemente e Sempre.
        </p>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading font-semibold">Indicadores</h2>
          <Button variant="outline" size="sm" onClick={salvarIndicadores} disabled={salvandoInd}>
            {salvandoInd ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Salvar indicadores
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha os indicadores organizacionais. Eles são utilizados automaticamente na geração do
          relatório técnico, de forma agregada e sem identificar trabalhadores.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INDICADORES_CAMPOS.map((c) => (
            <div key={c.key} className="grid gap-1.5">
              <Label className="text-xs">{c.label}</Label>
              <Input
                value={indicadores[c.key] || ""}
                onChange={(e) => setIndicadores({ ...indicadores, [c.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </Card>



      <div className="space-y-3">
        <h2 className="font-heading font-semibold">Funções avaliadas</h2>
        {cards.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma função gerada ainda. Escreva o questionário acima e clique em “Gerar”.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Card key={c.funcao} className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <ClipboardList className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.funcao}</p>
                    <p className="text-xs text-muted-foreground">{c.itens.length} avaliação(ões)</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.itens.map((r: any, i: number) => (
                    <Button key={r.id} size="sm" variant="outline" onClick={() => setDetalhe(r)}>
                      Abrir #{i + 1}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal link / QR */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Link da avaliação</DialogTitle>
          </DialogHeader>
          {link?.token ? (
            <div className="space-y-3 text-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code da avaliação psicossocial" className="mx-auto w-56 h-56" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              )}
              <Input readOnly value={publicPsicoUrl(link.token)} className="text-xs" />
            </div>
          ) : (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>Fechar</Button>
            <Button onClick={copiar} disabled={!link?.token}>
              <Copy className="w-4 h-4 mr-1.5" /> Copiar link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal detalhe da avaliação da função */}
      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {detalhe?.funcao_nome} — Avaliação Psicossocial
            </DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Data: {new Date(detalhe.data_avaliacao + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                {detalhe.colaborador_nome && <span>• Colaborador: {detalhe.colaborador_nome}</span>}
              </div>
              {BLOCOS_COPSOQ.map((b) => {
                const arr: number[] = detalhe.respostas?.[b.key] || [];
                const bloco = detalhe.blocos?.[b.key];
                return (
                  <Card key={b.key} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">{b.titulo}</h3>
                      {bloco && (
                        <Badge variant="outline" className={corClassificacao(bloco.classificacao)}>
                          {bloco.classificacao} ({bloco.media})
                        </Badge>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {b.perguntas.map((p, i) => (
                        <li key={i} className="flex items-start justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{p}</span>
                          <span className="font-medium whitespace-nowrap">
                            {typeof arr[i] === "number" && arr[i] >= 0 ? labelEscala(arr[i]) : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
              {detalhe.resultado_psicossocial && (
                <Card className="p-4">
                  <h3 className="font-semibold text-sm mb-1">Resultado</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detalhe.resultado_psicossocial}</p>
                </Card>
              )}
              {detalhe.riscos_psicossociais && (
                <Card className="p-4">
                  <h3 className="font-semibold text-sm mb-1">Riscos identificados</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detalhe.riscos_psicossociais}</p>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalhe(null)}>Fechar</Button>
            {detalhe && (
              <Button variant="destructive" onClick={() => excluirResposta(detalhe.id)}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FuncoesNaoVinculadasModal
        open={avisoOpen}
        onOpenChange={setAvisoOpen}
        funcoes={naoVinculadas}
        empresaId={empresaId!}
        contratoId={contratoId!}
        onCadastrado={() => { setNaoVinculadas([]); gerarRelatorio(); }}
      />
    </div>

  );
}
