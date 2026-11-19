import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, CloudUpload, Download, Loader2, Wifi, WifiOff, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FERRAMENTAS_ERGONOMICAS,
  urlFerramentaErgonomica,
} from "@/lib/ferramentasErgonomicas";
import {
  countErgoOfflinePending,
  getErgoModoPreferido,
  getErgoPreparedAt,
  setErgoModoPreferido,
  type ErgoModo,
} from "@/lib/ergonomia/offlineDb";
import { prepareErgoOfflinePackage } from "@/lib/ergonomia/offlinePrepare";
import { syncErgoOfflinePending } from "@/lib/ergonomia/offlineSync";

export default function FerramentasErgonomicas() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [modo, setModo] = useState<ErgoModo>(getErgoModoPreferido());
  const [preparedAt, setPreparedAt] = useState<string | null>(getErgoPreparedAt());
  const [preparando, setPreparando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, error: 0, draft: 0, synced: 0 });

  const refreshCounts = useCallback(async () => {
    try {
      setCounts(await countErgoOfflinePending());
    } catch {
      setCounts({ pending: 0, error: 0, draft: 0, synced: 0 });
    }
  }, []);

  useEffect(() => {
    const on = () => { setOnline(true); void refreshCounts(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    void refreshCounts();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refreshCounts]);

  const prepararOffline = async () => {
    if (!navigator.onLine) {
      toast.error("Conecte-se à internet para preparar o pacote offline.");
      return;
    }
    setPreparando(true);
    try {
      const ctx = await prepareErgoOfflinePackage();
      setPreparedAt(ctx.prepared_at);
      setErgoModoPreferido("offline");
      setModo("offline");
      toast.success(
        `Pacote offline pronto: ${ctx.empresas.length} empresas, ${ctx.setores.length} setores, ${ctx.funcoes.length} funções.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao preparar offline.");
    } finally {
      setPreparando(false);
    }
  };

  const sincronizar = async () => {
    if (!navigator.onLine) {
      toast.error("Sem conexão — não é possível sincronizar agora.");
      return;
    }
    setSincronizando(true);
    try {
      const r = await syncErgoOfflinePending();
      await refreshCounts();
      if (r.total === 0) {
        toast.message("Nenhuma avaliação pendente para sincronizar.");
      } else {
        toast.success(
          `Sincronização: ${r.synced} enviada(s), ${r.duplicates} já existente(s), ${r.errors} erro(s).`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na sincronização.");
    } finally {
      setSincronizando(false);
    }
  };

  const offlineAtivo = !online || modo === "offline";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ferramentas Ergonômicas"
        description="NIOSH, RULA, REBA, OWAS, ROSA e OCRA — mesmas ferramentas e histórico usados na AET"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={offlineAtivo ? "secondary" : "outline"} className="gap-1">
              {offlineAtivo ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
              {offlineAtivo ? "Offline" : "Online"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={preparando || !online}
              onClick={() => void prepararOffline()}
            >
              {preparando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
              Preparar para uso offline
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sincronizando || !online || (counts.pending + counts.error) === 0}
              onClick={() => void sincronizar()}
            >
              {sincronizando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-1.5 h-4 w-4" />}
              Sincronizar
              {(counts.pending + counts.error) > 0 && (
                <Badge variant="secondary" className="ml-1.5">{counts.pending + counts.error}</Badge>
              )}
            </Button>
          </div>
        }
      />

      <div className="portal-surface space-y-3 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p>
              Cálculos, ilustrações e critérios ficam no dispositivo. Avaliações offline são salvas no
              IndexedDB e só sobem ao servidor na sincronização manual (sem duplicar).
            </p>
            <p className="text-xs">
              {preparedAt
                ? `Pacote preparado em ${new Date(preparedAt).toLocaleString("pt-BR")}.`
                : "Ainda não há pacote offline neste dispositivo — use “Preparar para uso offline”."}
              {" "}
              Rascunhos: {counts.draft} · Pendentes: {counts.pending} · Erros: {counts.error} · Já sincronizadas: {counts.synced}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={modo === "online" ? "default" : "outline"}
            onClick={() => { setErgoModoPreferido("online"); setModo("online"); }}
          >
            Preferir online
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "offline" ? "default" : "outline"}
            onClick={() => { setErgoModoPreferido("offline"); setModo("offline"); }}
          >
            Preferir offline
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FERRAMENTAS_ERGONOMICAS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.slug}
              type="button"
              onClick={() => navigate(urlFerramentaErgonomica(f.slug))}
              className="portal-surface group flex h-full flex-col gap-4 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
                  {f.titulo}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{f.nomeCompleto}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.descricao}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Abrir avaliação <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
