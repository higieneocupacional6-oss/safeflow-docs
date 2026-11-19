/**
 * Preparação offline das Ferramentas Ergonômicas.
 * Baixa contexto (empresas/contratos/setores/funções) para IndexedDB e aquece Cache API / SW.
 * Cálculos e ilustrações já são código local do bundle — não dependem de API.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  FERRAMENTAS_ERGONOMICAS,
  urlFerramentaErgonomica,
  urlFerramentasErgonomicas,
} from "@/lib/ferramentasErgonomicas";
import {
  getOrCreateErgoDeviceId,
  getErgoOfflineContext,
  saveErgoOfflineContext,
  setErgoPreparedAt,
  type ErgoOfflineContext,
} from "./offlineDb";

const RUNTIME_CACHE = "ergo-offline-runtime-v1";

export async function ensureServiceWorkerReady(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.ready;
    return true;
  } catch {
    return false;
  }
}

async function warmErgoRuntimeCache(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const urls = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/segdoc-logo.png",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/pwa-192x192.png",
    "/pwa-512x512.png",
    urlFerramentasErgonomicas(),
    ...FERRAMENTAS_ERGONOMICAS.map((f) => urlFerramentaErgonomica(f.slug)),
  ];
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    await Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url, { credentials: "same-origin", cache: "reload" });
          if (res.ok || res.type === "opaque") await cache.put(url, res.clone());
        } catch {
          /* ignora URL individual */
        }
      }),
    );
    // Aquece entrypoints JS/CSS já carregados (bundle do app) para navegação offline.
    if ("performance" in window) {
      const assets = performance
        .getEntriesByType("resource")
        .map((e) => (e as PerformanceResourceTiming).name)
        .filter((u) => /\.(js|css|woff2)(\?|$)/i.test(u) || u.includes("/assets/"));
      await Promise.all(
        assets.slice(0, 80).map(async (url) => {
          try {
            const res = await fetch(url, { credentials: "same-origin" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            /* ignore */
          }
        }),
      );
    }
  } catch {
    /* Cache API indisponível */
  }
}

/**
 * Baixa cadastros necessários e aquece o shell PWA.
 * Deve rodar COM internet. Depois as ferramentas abrem e calculam offline.
 */
export async function prepareErgoOfflinePackage(): Promise<ErgoOfflineContext> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const existing = await getErgoOfflineContext();
    if (existing) return existing;
    throw new Error("Sem internet e sem pacote preparado neste dispositivo.");
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.id) throw new Error("Usuário não autenticado");

  const [empRes, ctrRes, setRes, funRes] = await Promise.all([
    supabase.from("empresas").select("id, razao_social, nome_fantasia").order("razao_social"),
    supabase
      .from("contratos")
      .select("id, empresa_id, numero_contrato, nome_contratante")
      .order("created_at", { ascending: false }),
    supabase
      .from("setores")
      .select("id, empresa_id, contrato_id, nome_setor, ghe_ges")
      .order("nome_setor"),
    supabase.from("funcoes").select("id, setor_id, nome_funcao").order("nome_funcao"),
  ]);

  if (empRes.error) throw empRes.error;
  if (ctrRes.error) throw ctrRes.error;
  if (setRes.error) throw setRes.error;
  if (funRes.error) throw funRes.error;

  const now = new Date().toISOString();
  const ctx: ErgoOfflineContext = {
    id: "context",
    prepared_at: now,
    device_id: getOrCreateErgoDeviceId(),
    empresas: (empRes.data || []).map((e: any) => ({
      id: e.id,
      razao_social: e.razao_social || "",
      nome_fantasia: e.nome_fantasia ?? null,
    })),
    contratos: (ctrRes.data || []).map((c: any) => ({
      id: c.id,
      empresa_id: c.empresa_id,
      numero_contrato: c.numero_contrato ?? null,
      nome_contratante: c.nome_contratante ?? null,
    })),
    setores: (setRes.data || []).map((s: any) => ({
      id: s.id,
      empresa_id: s.empresa_id,
      contrato_id: s.contrato_id,
      nome_setor: s.nome_setor || "",
      ghe_ges: s.ghe_ges ?? null,
    })),
    funcoes: (funRes.data || []).map((f: any) => ({
      id: f.id,
      setor_id: f.setor_id,
      nome_funcao: f.nome_funcao || "",
    })),
  };

  await saveErgoOfflineContext(ctx);
  setErgoPreparedAt(now);
  await warmErgoRuntimeCache();
  await ensureServiceWorkerReady();
  return ctx;
}

export async function isErgoPreparedOffline(): Promise<boolean> {
  const ctx = await getErgoOfflineContext();
  return !!ctx && ctx.empresas.length >= 0 && !!ctx.prepared_at;
}
