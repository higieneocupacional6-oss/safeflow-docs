import { todayDateOnly } from "@/lib/dateOnly";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, CloudOff, Download, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BLOCOS_COPSOQ, ESCALA_COPSOQ, emptyPsicossocial,
  calcularPsicossocial, type AvaliacaoPsicossocial,
} from "@/components/PsicossocialModal";
import type { BlocoCopsoq } from "@/lib/copsoqBlocos";
import {
  clearPsicoDraft,
  enqueuePsicoPending,
  getOrCreatePsicoDeviceId,
  getPsicoDeviceLabel,
  getPsicoDraft,
  getPsicoPackage,
  newPsicoClientId,
  savePsicoDraft,
  type PsicoEscalaOpt,
  type PsicoOfflinePackage,
} from "@/lib/psicoOfflineDb";
import { preparePsicoOfflinePackage } from "@/lib/psicoOfflinePrepare";
import { syncPsicoPendingRespostas } from "@/lib/psicoOfflineSync";

type LinkData = {
  link_id: string;
  empresa_id: string;
  empresa_nome: string;
  avaliacao_id?: string | null;
  contrato_id?: string | null;
  contratos: { id: string; nome: string; funcoes: { id: string; nome: string }[] }[];
  from_cache?: boolean;
  prepared_at?: string;
  error?: string;
};

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="psico-public-shell min-h-[100dvh] w-full overflow-x-hidden"
      style={{ backgroundColor: "#F3F4F6", color: "#142B45", WebkitOverflowScrolling: "touch" }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 480px at 0% 0%, rgba(16,42,67,0.05), transparent 55%), radial-gradient(700px 420px at 100% 0%, rgba(16,42,67,0.04), transparent 50%), #F3F4F6",
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}

function PublicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-[#D7DCE3] bg-white p-4 shadow-sm sm:p-5 md:p-6", className)}>
      {children}
    </section>
  );
}

function packageToLinkData(pkg: PsicoOfflinePackage): LinkData {
  return {
    ...pkg.link,
    from_cache: true,
    prepared_at: pkg.prepared_at,
  };
}

export default function AvaliacaoPsicossocialPublica() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<LinkData | null>(null);
  const [blocos, setBlocos] = useState<BlocoCopsoq[]>(BLOCOS_COPSOQ);
  const [escala, setEscala] = useState<PsicoEscalaOpt[]>([...ESCALA_COPSOQ]);
  const [loading, setLoading] = useState(true);
  const [preparando, setPreparando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fase, setFase] = useState<"form" | "done">("form");
  const [doneMode, setDoneMode] = useState<"online" | "offline" | "synced">("offline");
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [prepared, setPrepared] = useState(false);
  const draftHydrated = useRef(false);

  const [contratoId, setContratoId] = useState("");
  const [funcaoNome, setFuncaoNome] = useState("");
  const [colaborador, setColaborador] = useState("");
  const today = todayDateOnly();
  const [draft, setDraft] = useState<AvaliacaoPsicossocial>(emptyPsicossocial());

  const flushPending = useCallback(async () => {
    if (!token || !navigator.onLine) return;
    const result = await syncPsicoPendingRespostas({ token });
    if (result.total > 0 && result.errors === 0) {
      toast.success(`${result.synced + result.duplicates} resposta(s) sincronizada(s) com o SegDoc.`);
    } else if (result.errors > 0) {
      toast.error(`${result.errors} resposta(s) com erro — permanecem neste dispositivo.`);
    }
    return result;
  }, [token]);

  useEffect(() => {
    const on = () => {
      setOnline(true);
      void flushPending();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [flushPending]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const local = await getPsicoPackage(token);
      if (cancelled) return;

      if (local) {
        setData(packageToLinkData(local));
        setBlocos(local.blocos?.length ? local.blocos : BLOCOS_COPSOQ);
        setEscala(local.escala?.length ? local.escala : [...ESCALA_COPSOQ]);
        setPrepared(true);
        setLoading(false);
      }

      if (navigator.onLine) {
        try {
          const pkg = await preparePsicoOfflinePackage(token);
          if (cancelled) return;
          setData(packageToLinkData(pkg));
          setBlocos(pkg.blocos);
          setEscala(pkg.escala);
          setPrepared(true);
          void flushPending();
        } catch (e) {
          if (!local && !cancelled) {
            setData({
              error: e instanceof Error ? e.message : "Não foi possível carregar o questionário.",
            } as LinkData);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else if (!local) {
        setData({
          error:
            "Este dispositivo ainda não preparou o questionário. Abra o link com internet uma vez para baixar o pacote offline.",
        } as LinkData);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, flushPending]);

  useEffect(() => {
    if (!token || draftHydrated.current) return;
    (async () => {
      const saved = await getPsicoDraft(token);
      draftHydrated.current = true;
      if (!saved) return;
      setContratoId(saved.contratoId || "");
      setFuncaoNome(saved.funcaoNome || "");
      setColaborador(saved.colaborador || "");
      setDraft((prev) => ({ ...prev, respostas: saved.respostas || prev.respostas }));
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !draftHydrated.current || fase !== "form") return;
    const handle = window.setTimeout(() => {
      void savePsicoDraft({
        token,
        contratoId,
        funcaoNome,
        colaborador,
        respostas: draft.respostas,
        updated_at: new Date().toISOString(),
        device_id: getOrCreatePsicoDeviceId(),
      });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [token, contratoId, funcaoNome, colaborador, draft.respostas, fase]);

  const contrato = useMemo(
    () => data?.contratos.find((c) => c.id === contratoId),
    [data, contratoId],
  );

  const setResposta = (blocoKey: string, idx: number, value: number) => {
    setDraft((prev) => {
      const arr = [...(prev.respostas[blocoKey] || [])];
      arr[idx] = value;
      return { ...prev, respostas: { ...prev.respostas, [blocoKey]: arr } };
    });
  };

  const allAnswered = blocos.every((b) =>
    (draft.respostas[b.key] || []).every((r) => r >= 0),
  );

  const resetFormForNext = () => {
    setContratoId("");
    setFuncaoNome("");
    setColaborador("");
    setDraft(emptyPsicossocial());
    setFase("form");
    draftHydrated.current = true;
  };

  const prepararAgora = async () => {
    if (!token) return;
    if (!navigator.onLine) {
      toast.error("Conecte-se à internet para preparar o questionário neste aparelho.");
      return;
    }
    setPreparando(true);
    try {
      const pkg = await preparePsicoOfflinePackage(token);
      setData(packageToLinkData(pkg));
      setBlocos(pkg.blocos);
      setEscala(pkg.escala);
      setPrepared(true);
      toast.success("Questionário preparado para uso offline neste dispositivo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao preparar offline.");
    } finally {
      setPreparando(false);
    }
  };

  const submit = async () => {
    if (!token || !data?.link_id) return;
    if (!contratoId) { toast.error("Selecione o contrato"); return; }
    if (!funcaoNome.trim()) { toast.error("Informe a função"); return; }
    if (!allAnswered) { toast.error("Responda todas as perguntas"); return; }

    const clientId = newPsicoClientId();
    const deviceId = getOrCreatePsicoDeviceId();
    const deviceLabel = getPsicoDeviceLabel();
    const calc = calcularPsicossocial({
      ...draft,
      colaborador_nome: colaborador,
      data_avaliacao: today,
    });
    const payload = {
      contrato_id: contratoId,
      contrato_nome: contrato?.nome || "",
      funcao_nome: funcaoNome.trim(),
      colaborador_nome: colaborador || null,
      data_avaliacao: today,
      respostas: calc.respostas,
      blocos: calc.blocos,
      alertas: calc.alertas,
      resultado_psicossocial: calc.resultado_psicossocial,
      riscos_psicossociais: calc.riscos_psicossociais,
      total_positivas: calc.total_positivas,
      total_negativas: calc.total_negativas,
      copsoq_resultado_resumido: calc.copsoq_resultado_resumido,
      copsoq_riscos_identificados: calc.copsoq_riscos_identificados,
      offline_client_id: clientId,
      offline_device_id: deviceId,
      offline_device_label: deviceLabel,
    };

    setEnviando(true);
    try {
      // Sempre grava na fila local primeiro (fonte da verdade no dispositivo).
      await enqueuePsicoPending({
        client_id: clientId,
        token,
        link_id: data.link_id,
        empresa_id: data.empresa_id,
        avaliacao_id: data.avaliacao_id || null,
        payload,
        status: "pending",
        created_at: new Date().toISOString(),
        device_id: deviceId,
        device_label: deviceLabel,
        colaborador_nome: colaborador || null,
        funcao_nome: funcaoNome.trim(),
      });
      await clearPsicoDraft(token);

      if (navigator.onLine) {
        const result = await syncPsicoPendingRespostas({ clientIds: [clientId] });
        const item = result.items[0];
        if (item && (item.status === "synced" || item.status === "duplicate")) {
          setDoneMode("synced");
          setFase("done");
          toast.success("Resposta enviada ao SegDoc.");
          return;
        }
        setDoneMode("offline");
        setFase("done");
        toast.message("Salva neste dispositivo", {
          description: "Houve falha no envio. A resposta permanece na fila para sincronizar.",
        });
        return;
      }

      setDoneMode("offline");
      setFase("done");
      toast.success("Resposta salva offline neste dispositivo.");
    } catch (e) {
      toast.error("Erro ao salvar: " + (e instanceof Error ? e.message : ""));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="grid min-h-[100dvh] place-items-center p-6">
          <Loader2 className="h-7 w-7 animate-spin text-[#102A43]/60" />
        </div>
      </PublicShell>
    );
  }

  if (!data || data.error) {
    return (
      <PublicShell>
        <div className="grid min-h-[100dvh] place-items-center px-4 py-8">
          <PublicCard className="w-full max-w-md space-y-4 text-center">
            <BrandLogo markOnly className="justify-center" markClassName="h-12 w-12" />
            <h1 className="font-heading text-xl font-bold text-[#142B45]">Questionário indisponível</h1>
            <p className="text-sm leading-relaxed text-[#4B5565]">
              {data?.error || "Esta avaliação não está disponível."}
            </p>
            {online && (
              <Button onClick={() => void prepararAgora()} disabled={preparando} className="w-full">
                {preparando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Preparar neste dispositivo
              </Button>
            )}
          </PublicCard>
        </div>
      </PublicShell>
    );
  }

  if (fase === "done") {
    return (
      <PublicShell>
        <div className="grid min-h-[100dvh] place-items-center px-4 py-8">
          <PublicCard className="w-full max-w-md space-y-4 text-center">
            <CheckCircle2
              className={cn(
                "mx-auto h-14 w-14",
                doneMode === "synced" ? "text-emerald-600" : "text-amber-500",
              )}
            />
            <h1 className="font-heading text-xl font-bold text-[#142B45]">
              {doneMode === "synced" ? "Resposta registrada!" : "Resposta salva neste dispositivo"}
            </h1>
            <p className="text-sm leading-relaxed text-[#4B5565]">
              {doneMode === "synced"
                ? "Obrigado por participar da Avaliação Psicossocial."
                : "Os dados ficaram na fila offline. Com internet, abra este link novamente ou use a sincronização no SegDoc neste aparelho."}
            </p>
            <Button className="w-full" onClick={resetFormForNext}>
              Nova resposta neste dispositivo
            </Button>
            {online && doneMode !== "synced" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void flushPending().then((r) => {
                  if (r && r.errors === 0 && r.total > 0) setDoneMode("synced");
                })}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Tentar sincronizar agora
              </Button>
            )}
          </PublicCard>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-6 md:px-6 md:pt-8">
        <header className="mb-5 space-y-2 text-center sm:mb-6">
          <BrandLogo markOnly className="justify-center" markClassName="mx-auto h-12 w-12 sm:h-14 sm:w-14" />
          <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-[#142B45] sm:text-2xl">
            Avaliação Psicossocial (COPSOQ)
          </h1>
          <p className="text-sm font-medium text-[#102A43]/80">{data.empresa_nome}</p>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-[#5B6573] sm:text-sm">
            Suas respostas são anônimas e utilizadas apenas para análise coletiva.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium",
                online
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800",
              )}
            >
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? "Online" : "Offline"}
            </span>
            {prepared && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#102A43]/20 bg-white px-3 py-1 text-[11px] font-medium text-[#102A43]">
                <CloudOff className="h-3.5 w-3.5" />
                Pronto offline neste aparelho
              </span>
            )}
          </div>
          {online && (
            <div className="pt-1">
              <Button size="sm" variant="outline" onClick={() => void prepararAgora()} disabled={preparando}>
                {preparando ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                {prepared ? "Atualizar pacote offline" : "Preparar para uso offline"}
              </Button>
            </div>
          )}
        </header>

        <div className="space-y-4 sm:space-y-5">
          <PublicCard className="space-y-4">
            <h2 className="font-heading text-base font-semibold text-[#142B45]">Dados iniciais</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label className="text-[#334155]">Contrato *</Label>
                <Select value={contratoId} onValueChange={(v) => { setContratoId(v); setFuncaoNome(""); }}>
                  <SelectTrigger className="h-11 w-full bg-white text-[#142B45]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.contratos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-[#334155]">Função *</Label>
                <Input
                  className="h-11 bg-white text-[#142B45]"
                  value={funcaoNome}
                  onChange={(e) => setFuncaoNome(e.target.value)}
                  placeholder="Digite sua função"
                  autoComplete="organization-title"
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-[#334155]">Nome (opcional)</Label>
                <Input
                  className="h-11 bg-white text-[#142B45]"
                  value={colaborador}
                  onChange={(e) => setColaborador(e.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-[#334155]">Data</Label>
                <Input className="h-11 bg-[#F8FAFC] text-[#142B45]" value={today} disabled />
              </div>
            </div>
          </PublicCard>

          {blocos.map((bloco) => (
            <PublicCard key={bloco.key}>
              <h3 className="mb-4 font-heading text-base font-semibold leading-snug text-[#102A43]">
                {bloco.titulo}
              </h3>
              <div className="space-y-5">
                {bloco.perguntas.map((p, i) => {
                  const selected = draft.respostas[bloco.key]?.[i];
                  return (
                    <div key={i} className="border-b border-[#E5E7EB] pb-5 last:border-0 last:pb-0">
                      <p className="mb-3 text-[15px] font-medium leading-relaxed text-[#142B45] sm:text-sm">
                        <span className="mr-1 text-[#64748B]">{i + 1}.</span>
                        {p}
                      </p>
                      <RadioGroup
                        value={selected != null && selected >= 0 ? String(selected) : ""}
                        onValueChange={(v) => setResposta(bloco.key, i, Number(v))}
                        className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                      >
                        {escala.map((opt) => {
                          const active = selected === opt.value;
                          return (
                            <label
                              key={opt.value}
                              className={cn(
                                "flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                                active
                                  ? "border-[#102A43] bg-[#102A43] text-white shadow-sm"
                                  : "border-[#D7DCE3] bg-[#F8FAFC] text-[#142B45] hover:border-[#102A43]/40 hover:bg-white",
                              )}
                            >
                              <RadioGroupItem
                                value={String(opt.value)}
                                className={cn("shrink-0 border-[#94A3B8] text-white", active && "border-white text-white")}
                              />
                              <span className="min-w-0 flex-1 break-words leading-snug">{opt.label}</span>
                            </label>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  );
                })}
              </div>
            </PublicCard>
          ))}

          <div className="sticky bottom-0 z-10 -mx-3 border-t border-[#D7DCE3]/80 bg-[#F3F4F6]/95 px-3 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <Button className="h-12 w-full text-base font-semibold" size="lg" onClick={() => void submit()} disabled={enviando}>
              {enviando ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : online ? (
                "Enviar avaliação"
              ) : (
                "Salvar offline"
              )}
            </Button>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
