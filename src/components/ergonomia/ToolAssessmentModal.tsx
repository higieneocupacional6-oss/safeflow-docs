import { todayDateOnly } from "@/lib/dateOnly";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularRula, type RulaInput } from "@/lib/ergonomia/rula";
import { calcularReba, type RebaInput } from "@/lib/ergonomia/reba";
import { calcularNiosh, type NioshInput } from "@/lib/ergonomia/niosh";
import { calcularOwas, type OwasInput } from "@/lib/ergonomia/owas";
import { calcularRosa, ROSA_DEFAULT, type RosaInput } from "@/lib/ergonomia/rosa";
import { calcularOcra, OCRA_CHECKLIST_DEFAULT, type OcraInput } from "@/lib/ergonomia/ocra";
import { salvarAvaliacaoEGerarPdf } from "@/lib/ergonomia/persist";
import type { AvaliacaoErgonomica, CabecalhoAvaliacao, ResultadoErgonomico } from "@/lib/ergonomia/types";
import {
  deleteErgoOffline,
  getErgoOffline,
  getErgoOfflineContext,
  isErgoOfflineNow,
  newErgoClientId,
  saveErgoOffline,
  getOrCreateErgoDeviceId,
  getErgoDeviceLabel,
} from "@/lib/ergonomia/offlineDb";
import { RosaForm } from "./RosaForm";
import { OcraForm } from "./OcraForm";
import { RulaWizard } from "./RulaWizard";
import { RebaWizard } from "./RebaWizard";
import { NioshWizard } from "./NioshWizard";
import { OwasWizard } from "./OwasWizard";
import { Badge } from "@/components/ui/badge";

type ToolTipo = "RULA" | "REBA" | "NIOSH" | "OWAS" | "ROSA" | "OCRA";

const TOOLS_COM_WIZARD: ToolTipo[] = ["RULA", "REBA", "NIOSH", "OWAS"];

export type ToolAssessmentResult = {
  tipo: ToolTipo;
  colaborador_nome: string;
  funcao: string;
  atividade: string;
  data_avaliacao: string;
  escore_final: number;
  classificacao: string;
  nivel_acao: string;
  avaliacao_id: string;
  pdf_path: string;
  respostas: Record<string, unknown>;
  resumo: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tool: ToolTipo;
  cabecalho: Omit<CabecalhoAvaliacao, "colaborador_nome" | "data_avaliacao"> & {
    colaborador_nome?: string; data_avaliacao?: string;
  };
  aetDocumentoId?: string | null;
  setorRef?: string | null;
  setoresDisponiveis?: { id: string; nome: string }[];
  setorIndex?: number;
  onSetorIndexChange?: (idx: number) => void;
  onComplete: (r: ToolAssessmentResult) => void;
  setorLabel?: string;
  setorHint?: string;
  standalone?: boolean;
  empresaId?: string | null;
  contratoId?: string | null;
};

const RULA_DEFAULT: RulaInput = {
  braco: 1, bracoAdicionais: { ombroElevado: false, abduzido: false, apoiado: false, bracoMuitoAlto: false },
  antebraco: 1, antebracoAdicionais: { cruzaCorpo: false, foraLinhaMedia: false },
  punho: 1, punhoDesviado: false, torcaoPunho: 1,
  pescoco: 1, pescocoAdicionais: { torcido: false, inclinado: false },
  tronco: 1, troncoAdicionais: { torcido: false, inclinado: false },
  pernas: 1, usoMuscular: false, carga: 0,
};

const REBA_DEFAULT: RebaInput = {
  tronco: 1, troncoAjuste: { torcido: false, inclinado: false },
  pescoco: 1, pescocoAjuste: { torcido: false, inclinado: false },
  pernas: 1, pernasFlexao: 0,
  carga: 0, cargaImpacto: false,
  bracoSup: 1, bracoAjuste: { ombroElevado: false, abduzido: false, apoiado: false },
  antebraco: 1, punho: 1, punhoDesviado: false, acoplamento: 0,
  atividade: { estatico: false, repetitivo: false, instavel: false },
};

const NIOSH_DEFAULT: NioshInput = {
  peso_carga_kg: 10, H_cm: 30, V_cm: 75, D_cm: 50, A_graus: 0,
  F_por_min: 1, duracao: "curta", acoplamento: "bom",
};

const OWAS_DEFAULT: OwasInput = { costas: 1, bracos: 1, pernas: 2, carga: 1 };

export function ToolAssessmentModal({
  open, onOpenChange, tool, cabecalho, aetDocumentoId, setorRef,
  setoresDisponiveis = [], setorIndex = 0, onSetorIndexChange, onComplete,
  setorLabel = "Setor (AET atual)",
  setorHint = "Setores carregados automaticamente da AET em rascunho.",
  standalone = false,
  empresaId = null,
  contratoId = null,
}: Props) {
  const today = todayDateOnly();
  const [colaborador, setColaborador] = useState(cabecalho.colaborador_nome || "");
  const [funcaoSel, setFuncaoSel] = useState<string>(cabecalho.funcao || "");
  const [funcaoManual, setFuncaoManual] = useState<string>("");
  const [modoManual, setModoManual] = useState<boolean>(false);
  const [atividade, setAtividade] = useState<string>("");
  const [funcoesDb, setFuncoesDb] = useState<string[]>([]);
  const [data, setData] = useState(cabecalho.data_avaliacao || today);
  const [loading, setLoading] = useState(false);
  const [wizardReady, setWizardReady] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [draftClientId] = useState(() => newErgoClientId());
  const finalizedRef = useRef(false);
  const offlineMode = isErgoOfflineNow() || !online;

  const [rula, setRula] = useState<RulaInput>(RULA_DEFAULT);
  const [reba, setReba] = useState<RebaInput>(REBA_DEFAULT);
  const [niosh, setNiosh] = useState<NioshInput>(NIOSH_DEFAULT);
  const [owas, setOwas] = useState<OwasInput>(OWAS_DEFAULT);
  const [rosa, setRosa] = useState<RosaInput>(ROSA_DEFAULT);
  const [ocra, setOcra] = useState<OcraInput>(OCRA_CHECKLIST_DEFAULT);

  useEffect(() => {
    if (!open) return;
    setWizardReady(false);
    finalizedRef.current = false;
  }, [open, tool]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open) return;
      const nomes = new Set<string>();
      if (cabecalho.funcao) {
        cabecalho.funcao.split(",").map((s) => s.trim()).filter(Boolean).forEach((n) => nomes.add(n));
      }
      if (setorRef && online && !isErgoOfflineNow()) {
        try {
          const { data: fs } = await supabase
            .from("funcoes")
            .select("nome_funcao")
            .eq("setor_id", setorRef);
          (fs || []).forEach((f: any) => f?.nome_funcao && nomes.add(f.nome_funcao));
        } catch {
          /* rede falhou — tenta cache */
        }
      }
      if (nomes.size === 0 || !online || isErgoOfflineNow()) {
        const ctx = await getErgoOfflineContext();
        if (ctx && setorRef) {
          ctx.funcoes
            .filter((f) => f.setor_id === setorRef)
            .forEach((f) => f.nome_funcao && nomes.add(f.nome_funcao));
        }
      }
      if (!cancelled) setFuncoesDb(Array.from(nomes).sort((a, b) => a.localeCompare(b)));
    })();
    return () => { cancelled = true; };
  }, [open, setorRef, cabecalho.funcao, online]);

  const resultado = useMemo<ResultadoErgonomico | null>(() => {
    try {
      if (tool === "RULA") return calcularRula(rula);
      if (tool === "REBA") return calcularReba(reba);
      if (tool === "NIOSH") return calcularNiosh(niosh);
      if (tool === "OWAS") return calcularOwas(owas);
      if (tool === "ROSA") return calcularRosa(rosa);
      if (tool === "OCRA") return calcularOcra(ocra);
    } catch { /* ignore */ }
    return null;
  }, [tool, rula, reba, niosh, owas, rosa, ocra]);

  // Autosave de rascunho no IndexedDB (não bloqueia UI)
  useEffect(() => {
    if (!open || !resultado) return;
    const funcaoAtualDraft = (modoManual ? funcaoManual : funcaoSel).trim();
    if (!funcaoAtualDraft) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          if (finalizedRef.current) return;
          const existing = await getErgoOffline(draftClientId);
          // Não rebaixa avaliação já marcada para sync / sincronizada.
          if (existing && existing.sync_status !== "draft") return;
          const respostas: Record<string, unknown> =
            tool === "RULA" ? (rula as unknown as Record<string, unknown>) :
            tool === "REBA" ? (reba as unknown as Record<string, unknown>) :
            tool === "OWAS" ? (owas as unknown as Record<string, unknown>) :
            tool === "ROSA" ? (rosa as unknown as Record<string, unknown>) :
            tool === "OCRA" ? (ocra as unknown as Record<string, unknown>) :
            (niosh as unknown as Record<string, unknown>);
          const now = new Date().toISOString();
          await saveErgoOffline({
            client_id: draftClientId,
            device_id: existing?.device_id || getOrCreateErgoDeviceId(),
            device_label: existing?.device_label || getErgoDeviceLabel(),
            ferramenta: tool,
            empresa_id: empresaId ?? null,
            empresa_nome: cabecalho.empresa_nome || "",
            contrato_id: contratoId ?? null,
            setor_ref: setorRef ?? null,
            setor_nome: cabecalho.setor_nome || "",
            colaborador_nome: colaborador.trim(),
            funcao: funcaoAtualDraft,
            atividade: atividade.trim() || null,
            data_avaliacao: data,
            respostas: { ...respostas, _offline_client_id: draftClientId },
            resultado,
            aet_documento_id: aetDocumentoId ?? null,
            pdf_blob: existing?.pdf_blob ?? null,
            pdf_filename: existing?.pdf_filename ?? null,
            sync_status: "draft",
            error_message: null,
            server_id: null,
            pdf_path: null,
            created_at: existing?.created_at || now,
            updated_at: now,
            synced_at: null,
          });
        } catch {
          /* autosave best-effort */
        }
      })();
    }, 800);
    return () => window.clearTimeout(t);
  }, [
    open, tool, resultado, colaborador, funcaoSel, funcaoManual, modoManual,
    atividade, data, empresaId, contratoId, setorRef, cabecalho, aetDocumentoId,
    draftClientId, rula, reba, niosh, owas, rosa, ocra,
  ]);

  const funcaoAtual = (modoManual ? funcaoManual : funcaoSel).trim();
  const usaWizard = TOOLS_COM_WIZARD.includes(tool);
  const avaliacaoCompleta = !!funcaoAtual && !!resultado && (!usaWizard || wizardReady);

  const handleSubmit = async () => {
    if (!funcaoAtual) {
      toast.error("Selecione ou informe a função avaliada");
      return;
    }
    if (usaWizard && !wizardReady) {
      toast.error("Conclua todas as etapas da avaliação antes de salvar");
      return;
    }
    if (!resultado) {
      toast.error("Não foi possível calcular a avaliação");
      return;
    }
    setLoading(true);
    try {
      finalizedRef.current = true;
      const respostas: Record<string, unknown> =
        tool === "RULA" ? (rula as unknown as Record<string, unknown>) :
        tool === "REBA" ? (reba as unknown as Record<string, unknown>) :
        tool === "OWAS" ? (owas as unknown as Record<string, unknown>) :
        tool === "ROSA" ? (rosa as unknown as Record<string, unknown>) :
        tool === "OCRA" ? (ocra as unknown as Record<string, unknown>) :
        (niosh as unknown as Record<string, unknown>);
      const av: AvaliacaoErgonomica = {
        ferramenta: tool,
        cabecalho: {
          colaborador_nome: colaborador.trim(),
          funcao: funcaoAtual,
          empresa_nome: cabecalho.empresa_nome,
          setor_nome: cabecalho.setor_nome,
          data_avaliacao: data,
        },
        atividade: atividade.trim() || undefined,
        respostas,
        resultado,
      };
      const saved = await salvarAvaliacaoEGerarPdf(av, {
        aetDocumentoId: aetDocumentoId ?? null,
        setorRef: setorRef ?? null,
        empresaId: empresaId ?? null,
        contratoId: contratoId ?? null,
        forceOffline: offlineMode,
        clientId: draftClientId,
      });
      if (!saved.offline) {
        try { await deleteErgoOffline(draftClientId); } catch { /* ignore */ }
      }
      onComplete({
        tipo: tool,
        colaborador_nome: colaborador.trim(),
        funcao: funcaoAtual,
        atividade: atividade.trim(),
        data_avaliacao: data,
        escore_final: resultado.escore_final,
        classificacao: resultado.classificacao,
        nivel_acao: resultado.nivel_acao,
        avaliacao_id: saved.id,
        pdf_path: saved.pdf_path,
        respostas,
        resumo: resultado.memoria_calculo.map((m) => `${m.etapa}: ${m.valor}`).join(" • "),
      });
      toast.success(
        saved.offline
          ? `Avaliação ${tool} salva offline neste dispositivo — sincronize quando houver internet`
          : aetDocumentoId
            ? `Avaliação ${tool} concluída — PDF gerado e baixado`
            : standalone
              ? `Avaliação ${tool} salva — PDF gerado e baixado`
              : `Avaliação ${tool} salva — será vinculada automaticamente quando a AET for salva`,
      );
      onOpenChange(false);
    } catch (e: any) {
      finalizedRef.current = false;
      toast.error(e?.message || "Erro ao salvar avaliação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex flex-wrap items-center gap-2">
            <span>Avaliação {tool} — {cabecalho.funcao || "Função"}</span>
            <Badge variant={offlineMode ? "secondary" : "outline"} className="gap-1 font-normal">
              {offlineMode ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
              {offlineMode ? "Offline" : "Online"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label className="text-xs">{setorLabel}</Label>
              {setoresDisponiveis.length > 0 ? (
                <Select
                  value={String(setorIndex)}
                  onValueChange={(v) => onSetorIndexChange?.(Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {setoresDisponiveis.map((s, i) => (
                      <SelectItem key={`${s.id || "setor"}-${i}`} value={String(i)}>
                        {s.nome || `Setor ${i + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={cabecalho.setor_nome || ""} readOnly />
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{setorHint}</p>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Função avaliada *</Label>
                <button
                  type="button"
                  className="text-[11px] text-accent hover:underline"
                  onClick={() => setModoManual((v) => !v)}
                >
                  {modoManual ? "Escolher da lista" : "+ Nova função"}
                </button>
              </div>
              {modoManual ? (
                <Input
                  value={funcaoManual}
                  onChange={(e) => setFuncaoManual(e.target.value)}
                  placeholder="Digite o nome da função"
                />
              ) : (
                <Select value={funcaoSel} onValueChange={setFuncaoSel}>
                  <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                  <SelectContent>
                    {funcoesDb.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        Nenhuma função cadastrada — use &quot;+ Nova função&quot;
                      </SelectItem>
                    )}
                    {funcoesDb.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-xs">Colaborador avaliado (opcional)</Label>
              <Input value={colaborador} onChange={(e) => setColaborador(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs">Data da avaliação</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Atividade avaliada (opcional)</Label>
              <Textarea
                value={atividade}
                onChange={(e) => setAtividade(e.target.value)}
                placeholder="Ex.: digitação contínua, soldagem em estrutura metálica, levantamento manual de cargas…"
                rows={2}
              />
            </div>
          </div>

          {tool === "RULA" && (
            <RulaWizard value={rula} onChange={setRula} onReadyChange={setWizardReady} />
          )}
          {tool === "REBA" && (
            <RebaWizard value={reba} onChange={setReba} onReadyChange={setWizardReady} />
          )}
          {tool === "NIOSH" && (
            <NioshWizard value={niosh} onChange={setNiosh} onReadyChange={setWizardReady} />
          )}
          {tool === "OWAS" && (
            <OwasWizard value={owas} onChange={setOwas} onReadyChange={setWizardReady} />
          )}
          {tool === "ROSA" && <RosaForm value={rosa} onChange={setRosa} />}
          {tool === "OCRA" && <OcraForm value={ocra} onChange={setOcra} />}

          {!usaWizard && resultado && (
            <div className="rounded-lg border-2 border-accent bg-accent/5 p-3 space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Prévia do resultado</p>
              <p className="text-lg font-bold">
                Escore: {resultado.escore_final} —{" "}
                <span className="text-accent-foreground">{resultado.classificacao}</span>
              </p>
              <p className="text-xs text-muted-foreground">{resultado.nivel_acao}</p>
            </div>
          )}

          {usaWizard && !wizardReady && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Avance até a etapa de resultado para liberar o salvamento. Você pode voltar e corrigir respostas a qualquer momento.
            </p>
          )}

          {!aetDocumentoId && !standalone && (
            <div className="rounded-lg border border-sky-400 bg-sky-50 text-sky-900 p-3 text-xs">
              A AET ainda não foi salva. A avaliação será gravada normalmente e vinculada automaticamente à AET assim que ela for criada.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !avaliacaoCompleta}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Salvar avaliação e gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
