import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProviderId = "gemini" | "groq" | "openrouter";

type ProviderStatus = {
  provider: ProviderId;
  configured: boolean;
  keyHint: string | null;
  model: string;
  fallbackModel: string | null;
  role: "primary" | "contingency";
};

type StatusResponse = {
  ok: boolean;
  gemini: ProviderStatus;
  groq: ProviderStatus;
  openrouter: ProviderStatus;
  chain: ProviderId[];
};

type PingResult = {
  ok: boolean;
  provider: ProviderId;
  latencyMs: number;
  model: string;
  message: string;
  code?: string;
  httpStatus?: number;
  recommendedModel?: string | null;
  detail?: string;
};

type ModelsResult = {
  ok: boolean;
  provider: ProviderId;
  latencyMs: number;
  configuredModel: string;
  configuredFallbackModel?: string | null;
  models: Array<{ id: string; displayName?: string; deprecated?: boolean; supportsGenerateContent?: boolean }>;
  configuredStatus: "ok" | "missing_key" | "not_found" | "unknown";
  fallbackStatus?: "ok" | "not_found" | "none" | "unknown";
  recommendedModel?: string | null;
  code?: string;
  httpStatus?: number;
  error?: string;
  detail?: string;
};

type FallbackResult = {
  ok: boolean;
  latencyMs: number;
  message: string;
  steps: Array<{ step: string; ok: boolean; latencyMs: number; message: string; model?: string }>;
};

type HistoryEntry = {
  id: string;
  at: string;
  kind: "ping" | "models" | "fallback";
  provider?: string;
  ok: boolean;
  latencyMs: number;
  model?: string;
  message: string;
  detail?: string;
};

const LABELS: Record<ProviderId, string> = {
  gemini: "Gemini",
  groq: "Groq",
  openrouter: "OpenRouter",
};

function statusBadge(configured: boolean, ping?: PingResult | null, modelStatus?: ModelsResult | null) {
  if (!configured) return <Badge variant="secondary">Sem chave</Badge>;
  if (ping && !ping.ok) return <Badge variant="destructive">Falha</Badge>;
  if (ping?.ok) return <Badge className="bg-emerald-600 hover:bg-emerald-600">Conectado</Badge>;
  if (modelStatus?.configuredStatus === "not_found") {
    return <Badge variant="destructive">Modelo ausente</Badge>;
  }
  return <Badge variant="outline">Não testado</Badge>;
}

function modelFlag(status?: ModelsResult | null, ping?: PingResult | null) {
  if (!status && !ping?.recommendedModel) return null;
  if (status?.configuredStatus === "not_found" || ping?.code === "model_not_found") {
    const rec = status?.recommendedModel || ping?.recommendedModel;
    return (
      <div className="text-xs text-destructive mt-1 space-y-1">
        <p className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Modelo configurado não encontrado na API (possível descontinuação).
        </p>
        {rec && (
          <p className="text-amber-800">
            Recomendação (não aplicada automaticamente): altere no <code className="font-mono">server/.env</code> para{" "}
            <code className="font-mono">{rec}</code> e reinicie o servidor.
          </p>
        )}
      </div>
    );
  }
  if (status?.configuredStatus === "ok") {
    return <p className="text-xs text-emerald-700 mt-1">Modelo configurado encontrado na lista oficial (generateContent/chat).</p>;
  }
  return null;
}

export default function AiDiagnostico() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [pings, setPings] = useState<Partial<Record<ProviderId, PingResult>>>({});
  const [models, setModels] = useState<Partial<Record<ProviderId, ModelsResult>>>({});
  const [testing, setTesting] = useState<Partial<Record<ProviderId | "fallback" | "models", boolean>>>({});
  const [fallback, setFallback] = useState<FallbackResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const [st, hist] = await Promise.all([
        apiRequest<StatusResponse>("/api/ai-diagnostics/status"),
        apiRequest<{ entries: HistoryEntry[] }>("/api/ai-diagnostics/history"),
      ]);
      setStatus(st);
      setHistory(hist.entries || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar status das IAs.");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const hist = await apiRequest<{ entries: HistoryEntry[] }>("/api/ai-diagnostics/history");
      setHistory(hist.entries || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (isAdmin) void loadStatus();
  }, [isAdmin, loadStatus]);

  if (!authLoading && !isAdmin) return <Navigate to="/empresas" replace />;

  const providers: ProviderId[] = ["gemini", "groq", "openrouter"];

  const testProvider = async (provider: ProviderId) => {
    setTesting((t) => ({ ...t, [provider]: true }));
    try {
      const result = await apiRequest<PingResult>(`/api/ai-diagnostics/test/${provider}`, {
        method: "POST",
        body: {},
        csrf: true,
      });
      setPings((p) => ({ ...p, [provider]: result }));
      toast[result.ok ? "success" : "error"](result.message);
      await loadHistory();
    } catch (e: any) {
      const body = e?.body as PingResult | undefined;
      const message = body?.message || (e instanceof Error ? e.message : "Falha no teste.");
      setPings((p) => ({
        ...p,
        [provider]: body && typeof body === "object"
          ? { ...body, ok: false, provider, message }
          : {
            ok: false,
            provider,
            latencyMs: 0,
            model: status?.[provider]?.model || "",
            message,
            code: body?.code,
            httpStatus: e?.status,
            recommendedModel: body?.recommendedModel,
          },
      }));
      toast.error(message);
      await loadHistory();
    } finally {
      setTesting((t) => ({ ...t, [provider]: false }));
    }
  };

  const fetchModels = async (provider: ProviderId) => {
    setTesting((t) => ({ ...t, models: true }));
    try {
      const result = await apiRequest<ModelsResult>(`/api/ai-diagnostics/models/${provider}`);
      setModels((m) => ({ ...m, [provider]: result }));
      if (result.configuredStatus === "not_found") {
        toast.error(result.error || `Modelo ${result.configuredModel} não encontrado.`);
      } else if (!result.ok) {
        toast.error(result.error || "Falha ao listar modelos.");
      } else {
        toast.success(`${LABELS[provider]}: ${result.models.length} modelos`);
      }
      await loadHistory();
    } catch (e: any) {
      const body = e?.body as ModelsResult | undefined;
      if (body?.models || body?.configuredModel) setModels((m) => ({ ...m, [provider]: body }));
      toast.error(body?.error || (e instanceof Error ? e.message : "Falha ao listar modelos."));
      await loadHistory();
    } finally {
      setTesting((t) => ({ ...t, models: false }));
    }
  };

  const testFallback = async () => {
    setTesting((t) => ({ ...t, fallback: true }));
    setFallback(null);
    try {
      const result = await apiRequest<FallbackResult>("/api/ai-diagnostics/test-fallback", {
        method: "POST",
        body: {},
        csrf: true,
      });
      setFallback(result);
      toast[result.ok ? "success" : "error"](result.message);
      await loadHistory();
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no teste de fallback.");
      await loadHistory();
    } finally {
      setTesting((t) => ({ ...t, fallback: false }));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Central de Diagnóstico de IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Testes reais nas APIs. Chaves ficam só no servidor. Modelos de produção não são alterados.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadStatus()} disabled={loadingStatus}>
          {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Atualizar
        </Button>
      </div>

      <Card className="border-amber-200/80 bg-amber-50/40">
        <CardContent className="pt-4 flex gap-2 text-sm text-amber-950">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Acesso exclusivo a administradores. Os testes disparam chamadas reais (ping JSON mínimo) e não gravam
            documentos. A ordem de contingência é Gemini → Groq → OpenRouter.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((id) => {
          const st = status?.[id];
          const ping = pings[id];
          const mod = models[id];
          return (
            <Card key={id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{LABELS[id]}</CardTitle>
                  {statusBadge(Boolean(st?.configured), ping, mod)}
                </div>
                <CardDescription>
                  {st?.role === "primary" ? "Principal" : "Contingência"}
                  {st?.keyHint ? ` · chave ${st.keyHint}` : " · sem chave"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Modelo</p>
                  <p className="font-mono text-xs break-all">{st?.model || "—"}</p>
                  {st?.fallbackModel && (
                    <p className="font-mono text-[11px] text-muted-foreground mt-1 break-all">
                      Fallback Gemini: {st.fallbackModel}
                    </p>
                  )}
                  {modelFlag(mod, ping)}
                </div>
                {ping && (
                  <p className={`text-xs ${ping.ok ? "text-emerald-700" : "text-destructive"}`}>
                    {ping.ok ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : null}
                    {ping.message}
                    {ping.latencyMs > 0 ? ` · ${ping.latencyMs} ms` : ""}
                    {ping.code ? ` · ${ping.code}` : ""}
                    {ping.httpStatus ? ` · HTTP ${ping.httpStatus}` : ""}
                  </p>
                )}
                {mod?.ok && (
                  <p className="text-xs text-muted-foreground">
                    {mod.models.length} modelos oficiais · consulta {mod.latencyMs} ms
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" disabled={testing[id]} onClick={() => void testProvider(id)}>
                    {testing[id] ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                    Teste rápido
                  </Button>
                  <Button size="sm" variant="outline" disabled={testing.models} onClick={() => void fetchModels(id)}>
                    Modelos
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fallback e contingência</CardTitle>
          <CardDescription>
            Testa Gemini e a cadeia Groq → OpenRouter (sem alterar configuração de produção).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => void testFallback()} disabled={testing.fallback}>
            {testing.fallback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
            Testar fallback automaticamente
          </Button>
          {fallback && (
            <div className="space-y-2">
              <p className={`text-sm ${fallback.ok ? "text-emerald-700" : "text-destructive"}`}>
                {fallback.message} ({fallback.latencyMs} ms)
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latência</TableHead>
                    <TableHead>Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fallback.steps.map((s) => (
                    <TableRow key={s.step}>
                      <TableCell className="font-mono text-xs">{s.step}</TableCell>
                      <TableCell>{s.ok ? <Badge className="bg-emerald-600">OK</Badge> : <Badge variant="destructive">Falha</Badge>}</TableCell>
                      <TableCell>{s.latencyMs} ms</TableCell>
                      <TableCell className="text-xs max-w-md truncate" title={s.message}>
                        {s.model ? `${s.model} — ` : ""}{s.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {providers.some((id) => models[id]?.models?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modelos disponíveis (amostra)</CardTitle>
            <CardDescription>Lista oficial da API — uso informativo; nada é aplicado automaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.map((id) => {
              const mod = models[id];
              if (!mod?.models?.length) return null;
              return (
                <div key={id}>
                  <p className="text-sm font-medium mb-2">{LABELS[id]}</p>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {mod.models.slice(0, 40).map((m) => (
                      <Badge
                        key={m.id}
                        variant={m.id === mod.configuredModel || m.id.endsWith(mod.configuredModel) ? "default" : "outline"}
                        className="font-mono text-[10px] font-normal"
                      >
                        {m.id}{m.deprecated ? " (deprecated)" : ""}
                      </Badge>
                    ))}
                    {mod.models.length > 40 && (
                      <Badge variant="secondary">+{mod.models.length - 40}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de testes e erros</CardTitle>
          <CardDescription>Memória do processo do servidor (últimos eventos desta instância).</CardDescription>
        </CardHeader>
        <CardContent>
          {!history.length ? (
            <p className="text-sm text-muted-foreground">Nenhum teste registrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>OK</TableHead>
                  <TableHead>ms</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(h.at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{h.kind}</TableCell>
                    <TableCell className="text-xs">{h.provider || "—"}</TableCell>
                    <TableCell>{h.ok ? "sim" : "não"}</TableCell>
                    <TableCell>{h.latencyMs}</TableCell>
                    <TableCell className="text-xs max-w-sm truncate" title={h.detail || h.message}>{h.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
