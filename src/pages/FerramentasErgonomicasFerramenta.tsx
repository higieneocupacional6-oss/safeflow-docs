import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, CloudUpload, Download, Loader2, Plus, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ToolAssessmentModal,
  type ToolAssessmentResult,
} from "@/components/ergonomia/ToolAssessmentModal";
import { baixarPdfAvaliacao } from "@/lib/ergonomia/persist";
import { formatDateOnly } from "@/lib/dateOnly";
import {
  ferramentaErgoPorSlug,
  urlFerramentasErgonomicas,
} from "@/lib/ferramentasErgonomicas";
import {
  getErgoOffline,
  getErgoOfflineContext,
  isErgoOfflineNow,
  listErgoOffline,
  type ErgoOfflineAvaliacao,
} from "@/lib/ergonomia/offlineDb";
import { syncErgoOfflinePending } from "@/lib/ergonomia/offlineSync";

type HistRow = {
  id: string;
  colaborador_nome: string | null;
  funcao: string;
  empresa_nome: string;
  setor_nome: string;
  data_avaliacao: string;
  escore_final: number;
  classificacao: string;
  nivel_acao: string;
  pdf_path: string | null;
  created_at: string;
  offline?: boolean;
  sync_status?: string;
};

export default function FerramentasErgonomicasFerramenta() {
  const { toolSlug } = useParams();
  const meta = ferramentaErgoPorSlug(toolSlug);
  const qc = useQueryClient();

  const [empresaId, setEmpresaId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [setorIdx, setSetorIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [offlineCtx, setOfflineCtx] = useState<Awaited<ReturnType<typeof getErgoOfflineContext>>>(null);
  const [locais, setLocais] = useState<ErgoOfflineAvaliacao[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  const offlineMode = !online || isErgoOfflineNow();

  const refreshLocais = useCallback(async () => {
    if (!meta) return;
    try {
      const rows = await listErgoOffline({
        ferramenta: meta.tipo,
        statuses: ["pending", "error", "draft", "syncing", "synced"],
      });
      setLocais(rows.filter((r) => r.sync_status !== "synced" || !r.server_id));
    } catch {
      setLocais([]);
    }
  }, [meta]);

  useEffect(() => {
    const on = () => { setOnline(true); void refreshLocais(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    void (async () => {
      setOfflineCtx(await getErgoOfflineContext());
      await refreshLocais();
    })();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refreshLocais]);

  const { data: empresasOnline = [], isLoading: loadingEmp } = useQuery({
    queryKey: ["fe-empresas"],
    enabled: online && !isErgoOfflineNow(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: contratosOnline = [], isLoading: loadingCtr } = useQuery({
    queryKey: ["fe-contratos", empresaId],
    enabled: !!empresaId && online && !isErgoOfflineNow(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, nome_contratante")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: setoresOnline = [], isLoading: loadingSetores } = useQuery({
    queryKey: ["fe-setores", empresaId, contratoId],
    enabled: !!empresaId && !!contratoId && online && !isErgoOfflineNow(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setores")
        .select("id, nome_setor, ghe_ges")
        .eq("empresa_id", empresaId)
        .eq("contrato_id", contratoId)
        .order("nome_setor");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: historico = [], isLoading: loadingHist, refetch: refetchHist } = useQuery({
    queryKey: ["fe-historico", meta?.tipo],
    enabled: !!meta && online && !isErgoOfflineNow(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ergonomia_avaliacoes")
        .select(
          "id, colaborador_nome, funcao, empresa_nome, setor_nome, data_avaliacao, escore_final, classificacao, nivel_acao, pdf_path, created_at",
        )
        .eq("ferramenta", meta!.tipo)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as HistRow[];
    },
  });

  const empresas = useMemo(() => {
    if (!offlineMode && empresasOnline.length) return empresasOnline;
    return (offlineCtx?.empresas || []).map((e) => ({
      id: e.id,
      razao_social: e.razao_social,
      nome_fantasia: e.nome_fantasia,
    }));
  }, [offlineMode, empresasOnline, offlineCtx]);

  const contratos = useMemo(() => {
    if (!offlineMode && contratosOnline.length) return contratosOnline;
    return (offlineCtx?.contratos || [])
      .filter((c) => c.empresa_id === empresaId)
      .map((c) => ({
        id: c.id,
        numero_contrato: c.numero_contrato,
        nome_contratante: c.nome_contratante,
      }));
  }, [offlineMode, contratosOnline, offlineCtx, empresaId]);

  const setores = useMemo(() => {
    if (!offlineMode && setoresOnline.length) return setoresOnline;
    return (offlineCtx?.setores || [])
      .filter((s) => s.empresa_id === empresaId && s.contrato_id === contratoId)
      .map((s) => ({
        id: s.id,
        nome_setor: s.nome_setor,
        ghe_ges: s.ghe_ges,
      }));
  }, [offlineMode, setoresOnline, offlineCtx, empresaId, contratoId]);

  const empresa = useMemo(
    () => empresas.find((e) => e.id === empresaId),
    [empresas, empresaId],
  );
  const setorAtual = setores[setorIdx] || null;
  const setoresDisponiveis = setores.map((s) => ({
    id: s.id,
    nome: s.ghe_ges ? `${s.nome_setor} (${s.ghe_ges})` : s.nome_setor,
  }));

  const historicoLocal: HistRow[] = locais.map((l) => ({
    id: l.client_id,
    colaborador_nome: l.colaborador_nome || null,
    funcao: l.funcao,
    empresa_nome: l.empresa_nome,
    setor_nome: l.setor_nome,
    data_avaliacao: l.data_avaliacao,
    escore_final: l.resultado.escore_final,
    classificacao: l.resultado.classificacao,
    nivel_acao: l.resultado.nivel_acao,
    pdf_path: l.pdf_filename ? `offline://${l.client_id}` : null,
    created_at: l.updated_at,
    offline: true,
    sync_status: l.sync_status,
  }));

  const historicoMerged = useMemo(() => {
    const server = offlineMode ? [] : historico;
    const idsServer = new Set(server.map((h) => h.id));
    const locaisVisiveis = historicoLocal.filter(
      (h) => !idsServer.has(h.id) && h.sync_status !== "synced",
    );
    return [...locaisVisiveis, ...server];
  }, [historico, historicoLocal, offlineMode]);

  if (!meta) {
    return <Navigate to={urlFerramentasErgonomicas()} replace />;
  }

  const Icon = meta.icon;

  const abrirNova = () => {
    if (!empresaId) {
      toast.error("Selecione a empresa.");
      return;
    }
    if (!contratoId) {
      toast.error("Selecione o contrato.");
      return;
    }
    if (!setores.length) {
      toast.error(
        offlineMode
          ? "Nenhum setor no pacote offline. Prepare o uso offline com internet."
          : "Cadastre setores neste contrato em “Setores e Funções”.",
      );
      return;
    }
    setModalOpen(true);
  };

  const onComplete = (_r: ToolAssessmentResult) => {
    void qc.invalidateQueries({ queryKey: ["fe-historico", meta.tipo] });
    void refetchHist();
    void refreshLocais();
    setModalOpen(false);
  };

  const baixar = async (row: HistRow) => {
    if (!row.pdf_path) {
      toast.error("PDF não disponível para esta avaliação.");
      return;
    }
    try {
      if (row.offline && row.pdf_path.startsWith("offline://")) {
        const local = await getErgoOffline(row.id);
        if (!local?.pdf_blob) {
          toast.error("PDF local não encontrado (rascunho sem PDF final).");
          return;
        }
        saveAs(new Blob([local.pdf_blob], { type: "application/pdf" }), local.pdf_filename || "avaliacao.pdf");
        return;
      }
      await baixarPdfAvaliacao(row.pdf_path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao baixar o PDF.");
    }
  };

  const sincronizar = async () => {
    if (!navigator.onLine) {
      toast.error("Sem conexão.");
      return;
    }
    setSincronizando(true);
    try {
      const r = await syncErgoOfflinePending({ ferramenta: meta.tipo });
      await refreshLocais();
      void refetchHist();
      toast.success(
        r.total === 0
          ? "Nada pendente."
          : `Sync: ${r.synced} ok, ${r.duplicates} duplicata(s), ${r.errors} erro(s).`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na sincronização.");
    } finally {
      setSincronizando(false);
    }
  };

  const pendentes = locais.filter((l) => l.sync_status === "pending" || l.sync_status === "error").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to={urlFerramentasErgonomicas()}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Ferramentas Ergonômicas
          </Button>
        </Link>
      </div>

      <PageHeader
        title={meta.titulo}
        description={meta.nomeCompleto}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={offlineMode ? "secondary" : "outline"} className="gap-1">
              {offlineMode ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
              {offlineMode ? "Offline" : "Online"}
            </Badge>
            {pendentes > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sincronizando || !online}
                onClick={() => void sincronizar()}
              >
                {sincronizando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-1 h-4 w-4" />}
                Sincronizar ({pendentes})
              </Button>
            )}
            <Button onClick={abrirNova}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova avaliação
            </Button>
          </div>
        }
      />

      <div className="portal-surface flex items-start gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{meta.descricao}</p>
      </div>

      <div className="portal-surface space-y-4 p-5">
        <h2 className="font-heading text-sm font-semibold">Contexto da avaliação</h2>
        {!offlineCtx && offlineMode && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Pacote offline ausente. Volte ao hub e use “Preparar para uso offline” com internet.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <Select
              value={empresaId || undefined}
              onValueChange={(v) => {
                setEmpresaId(v);
                setContratoId("");
                setSetorIdx(0);
              }}
              disabled={!offlineMode && loadingEmp}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingEmp && !offlineMode ? "Carregando…" : "Selecione a empresa"} />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome_fantasia || e.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contrato</Label>
            <Select
              value={contratoId || undefined}
              onValueChange={(v) => {
                setContratoId(v);
                setSetorIdx(0);
              }}
              disabled={!empresaId || (!offlineMode && loadingCtr)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !empresaId ? "Selecione a empresa" : loadingCtr && !offlineMode ? "Carregando…" : "Selecione o contrato"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.numero_contrato || "(sem número)"}
                    {c.nome_contratante ? ` — ${c.nome_contratante}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {empresaId && contratoId && (
          <p className="text-xs text-muted-foreground">
            {loadingSetores && !offlineMode
              ? "Carregando setores…"
              : `${setores.length} setor(es) disponível(is) neste contrato.`}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-semibold">Histórico {meta.titulo}</h2>
          <Badge variant="outline">{historicoMerged.length}</Badge>
        </div>

        {loadingHist && !offlineMode ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : historicoMerged.length === 0 ? (
          <div className="portal-surface p-8 text-center text-sm text-muted-foreground">
            Nenhuma avaliação {meta.titulo} registrada ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {historicoMerged.map((h) => (
              <li key={h.id} className="portal-surface flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-heading text-sm font-semibold">
                    {h.funcao || "Função"}
                    {h.colaborador_nome ? ` — ${h.colaborador_nome}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {h.empresa_nome || "—"} · {h.setor_nome || "—"} ·{" "}
                    {formatDateOnly(h.data_avaliacao) || "—"}
                  </p>
                </div>
                {h.offline && (
                  <Badge variant="secondary" className="text-[10px]">
                    {h.sync_status === "draft" ? "Rascunho local" :
                      h.sync_status === "error" ? "Erro sync" :
                        h.sync_status === "pending" ? "Pendente sync" : "Local"}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  Escore {h.escore_final} — {h.classificacao}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {h.nivel_acao}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!h.pdf_path}
                  aria-label="Baixar PDF"
                  title="Baixar PDF"
                  onClick={() => void baixar(h)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <ToolAssessmentModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          tool={meta.tipo}
          cabecalho={{
            empresa_nome: empresa?.nome_fantasia || empresa?.razao_social || "",
            setor_nome: setorAtual?.nome_setor || "",
            funcao: "",
          }}
          aetDocumentoId={null}
          setorRef={setorAtual?.id || null}
          setoresDisponiveis={setoresDisponiveis}
          setorIndex={setorIdx}
          onSetorIndexChange={setSetorIdx}
          onComplete={onComplete}
          setorLabel="Setor avaliado"
          setorHint={
            offlineMode
              ? "Setores do pacote offline preparado neste dispositivo."
              : "Setores do cadastro de Setores e Funções deste contrato."
          }
          standalone
          empresaId={empresaId}
          contratoId={contratoId}
        />
      )}
    </div>
  );
}
