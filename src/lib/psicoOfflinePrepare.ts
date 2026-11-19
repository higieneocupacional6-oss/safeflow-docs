import { supabase } from "@/integrations/supabase/client";
import { BLOCOS_COPSOQ } from "@/lib/copsoqBlocos";
import { ESCALA_COPSOQ } from "@/components/PsicossocialModal";
import {
  getOrCreatePsicoDeviceId,
  getPsicoPackage,
  savePsicoPackage,
  type PsicoLinkCache,
  type PsicoOfflinePackage,
} from "@/lib/psicoOfflineDb";

const RUNTIME_CACHE = "psico-offline-runtime-v1";

type LinkPayload = {
  link_id?: string;
  empresa_id?: string;
  empresa_nome?: string;
  avaliacao_id?: string | null;
  contrato_id?: string | null;
  contratos?: PsicoLinkCache["contratos"];
  error?: string;
};

/**
 * Baixa metadados do link + snapshot das perguntas e aquece o Cache API / SW.
 * Deve rodar COM internet (1ª preparação). Depois o questionário abre offline.
 */
export async function preparePsicoOfflinePackage(token: string): Promise<PsicoOfflinePackage> {
  if (!token) throw new Error("Token do questionário ausente.");
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const existing = await getPsicoPackage(token);
    if (existing) return existing;
    throw new Error("Sem internet e sem pacote preparado neste dispositivo.");
  }

  const { data, error } = await supabase.rpc("psico_get_public_link", { _token: token });
  if (error) throw error;
  const payload = data as LinkPayload;
  if (!payload || payload.error || !payload.link_id) {
    throw new Error(payload?.error || "Link inválido ou desativado.");
  }

  const link: PsicoLinkCache = {
    token,
    link_id: payload.link_id,
    empresa_id: payload.empresa_id || "",
    empresa_nome: payload.empresa_nome || "",
    avaliacao_id: payload.avaliacao_id ?? null,
    contrato_id: payload.contrato_id ?? null,
    contratos: payload.contratos || [],
    cached_at: new Date().toISOString(),
  };

  const pkg: PsicoOfflinePackage = {
    token,
    link,
    blocos: BLOCOS_COPSOQ.map((b) => ({
      key: b.key,
      titulo: b.titulo,
      perguntas: [...b.perguntas],
      polaridades: [...b.polaridades],
    })),
    escala: ESCALA_COPSOQ.map((e) => ({ label: e.label, value: e.value })),
    prepared_at: new Date().toISOString(),
    prepared_by_device: getOrCreatePsicoDeviceId(),
  };

  await savePsicoPackage(pkg);
  await warmPsicoRuntimeCache(token);
  await ensureServiceWorkerReady();
  return pkg;
}

/** Aguarda Service Worker do PWA (registrado por virtual:pwa-register). */
export async function ensureServiceWorkerReady(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.ready;
    return true;
  } catch {
    return false;
  }
}

/**
 * Aquece cache de navegação do questionário (shell + rota do token).
 * O SW (navigateFallback) serve o SPA; o pacote IndexedDB traz perguntas/contratos.
 */
export async function warmPsicoRuntimeCache(token: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const urls = [
    `/avaliacao-psicossocial/${encodeURIComponent(token)}`,
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/segdoc-logo.png",
    "/favicon.png",
    "/apple-touch-icon.png",
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
  } catch {
    /* Cache API indisponível */
  }
}

export async function isPsicoPreparedOffline(token: string): Promise<boolean> {
  const pkg = await getPsicoPackage(token);
  return !!pkg?.link?.link_id;
}
