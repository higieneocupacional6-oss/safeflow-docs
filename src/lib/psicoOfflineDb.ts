/**
 * IndexedDB — Avaliações Psicossociais offline (PWA).
 * - packages: questionário completo preparado neste dispositivo
 * - drafts: rascunho em preenchimento
 * - pending: fila de respostas (não remove após sync; só marca synced)
 */

import type { BlocoCopsoq } from "@/lib/copsoqBlocos";

const DB_NAME = "segdoc-psico-offline";
const DB_VERSION = 2;
const DEVICE_KEY = "segdoc-psico-device-id";
const DEVICE_LABEL_KEY = "segdoc-psico-device-label";

export type PsicoEscalaOpt = { label: string; value: number };

export type PsicoLinkCache = {
  token: string;
  link_id: string;
  empresa_id: string;
  empresa_nome: string;
  avaliacao_id?: string | null;
  contrato_id?: string | null;
  contratos: { id: string; nome: string; funcoes: { id: string; nome: string }[] }[];
  cached_at: string;
};

/** Pacote completo para abrir o questionário sem rede. */
export type PsicoOfflinePackage = {
  token: string;
  link: PsicoLinkCache;
  blocos: BlocoCopsoq[];
  escala: PsicoEscalaOpt[];
  prepared_at: string;
  prepared_by_device: string;
};

export type PsicoDraft = {
  token: string;
  contratoId: string;
  funcaoNome: string;
  colaborador: string;
  respostas: Record<string, number[]>;
  updated_at: string;
  device_id: string;
};

export type PsicoPendingStatus = "pending" | "syncing" | "synced" | "error";

export type PsicoPendingResposta = {
  client_id: string;
  token: string;
  link_id: string | null;
  empresa_id: string | null;
  avaliacao_id: string | null;
  payload: Record<string, unknown>;
  status: PsicoPendingStatus;
  error_message?: string | null;
  created_at: string;
  synced_at?: string | null;
  server_id?: string | null;
  device_id: string;
  device_label: string;
  colaborador_nome?: string | null;
  funcao_nome?: string | null;
};

type StoreName = "links" | "drafts" | "pending" | "packages";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("links")) {
        db.createObjectStore("links", { keyPath: "token" });
      }
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "token" });
      }
      if (!db.objectStoreNames.contains("pending")) {
        const store = db.createObjectStore("pending", { keyPath: "client_id" });
        store.createIndex("by_token", "token", { unique: false });
        store.createIndex("by_status", "status", { unique: false });
        store.createIndex("by_avaliacao", "avaliacao_id", { unique: false });
      } else if (req.oldVersion < 2) {
        const store = req.transaction?.objectStore("pending");
        if (store && !store.indexNames.contains("by_token")) {
          store.createIndex("by_token", "token", { unique: false });
        }
      }
      if (!db.objectStoreNames.contains("packages")) {
        db.createObjectStore("packages", { keyPath: "token" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Falha ao abrir IndexedDB"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Falha na transação IndexedDB"));
    tx.onabort = () => reject(tx.error || new Error("Transação IndexedDB abortada"));
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    if (req) {
      const result = await new Promise<T>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      await txDone(tx);
      return result;
    }
    await txDone(tx);
    return undefined;
  } finally {
    db.close();
  }
}

export function getOrCreatePsicoDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev_ephemeral_${Date.now()}`;
  }
}

export function getPsicoDeviceLabel(): string {
  try {
    const saved = localStorage.getItem(DEVICE_LABEL_KEY);
    if (saved) return saved;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    let label = "Dispositivo";
    if (/iPhone|iPad|iPod/i.test(ua)) label = "iPhone/iPad";
    else if (/Android/i.test(ua)) label = "Android";
    else if (/Windows/i.test(ua)) label = "Windows";
    else if (/Mac/i.test(ua)) label = "Mac";
    else if (/Linux/i.test(ua)) label = "Linux";
    localStorage.setItem(DEVICE_LABEL_KEY, label);
    return label;
  } catch {
    return "Dispositivo";
  }
}

export async function cachePsicoLink(data: PsicoLinkCache): Promise<void> {
  await withStore("links", "readwrite", (s) => s.put(data));
}

export async function getCachedPsicoLink(token: string): Promise<PsicoLinkCache | null> {
  const row = await withStore<PsicoLinkCache | undefined>("links", "readonly", (s) => s.get(token));
  return row || null;
}

export async function savePsicoPackage(pkg: PsicoOfflinePackage): Promise<void> {
  await withStore("packages", "readwrite", (s) => s.put(pkg));
  await cachePsicoLink(pkg.link);
}

export async function getPsicoPackage(token: string): Promise<PsicoOfflinePackage | null> {
  const row = await withStore<PsicoOfflinePackage | undefined>("packages", "readonly", (s) => s.get(token));
  return row || null;
}

export async function savePsicoDraft(draft: PsicoDraft): Promise<void> {
  await withStore("drafts", "readwrite", (s) => s.put(draft));
}

export async function getPsicoDraft(token: string): Promise<PsicoDraft | null> {
  const row = await withStore<PsicoDraft | undefined>("drafts", "readonly", (s) => s.get(token));
  return row || null;
}

export async function clearPsicoDraft(token: string): Promise<void> {
  await withStore("drafts", "readwrite", (s) => s.delete(token));
}

export async function enqueuePsicoPending(item: PsicoPendingResposta): Promise<void> {
  await withStore("pending", "readwrite", (s) => s.put(item));
}

export async function updatePsicoPending(
  clientId: string,
  patch: Partial<PsicoPendingResposta>,
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("pending", "readwrite");
    const store = tx.objectStore("pending");
    const current = await new Promise<PsicoPendingResposta | undefined>((resolve, reject) => {
      const req = store.get(clientId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!current) {
      await txDone(tx);
      return;
    }
    store.put({ ...current, ...patch });
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function listPsicoPending(filter?: {
  token?: string;
  avaliacaoId?: string | null;
  statuses?: PsicoPendingStatus[];
}): Promise<PsicoPendingResposta[]> {
  const all = (await withStore<PsicoPendingResposta[]>("pending", "readonly", (s) => s.getAll())) || [];
  return all.filter((item) => {
    if (filter?.token && item.token !== filter.token) return false;
    if (filter?.avaliacaoId && item.avaliacao_id !== filter.avaliacaoId) return false;
    if (filter?.statuses && !filter.statuses.includes(item.status)) return false;
    return true;
  });
}

export async function countPsicoPendingForAvaliacao(avaliacaoId: string, token?: string | null): Promise<{
  pending: number;
  error: number;
  synced: number;
}> {
  const all = await listPsicoPending();
  const relevant = all.filter(
    (i) => i.avaliacao_id === avaliacaoId || (!!token && i.token === token),
  );
  return {
    pending: relevant.filter((i) => i.status === "pending" || i.status === "syncing").length,
    error: relevant.filter((i) => i.status === "error").length,
    synced: relevant.filter((i) => i.status === "synced").length,
  };
}

export function newPsicoClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `psico_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
