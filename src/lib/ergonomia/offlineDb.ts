/**
 * IndexedDB — Ferramentas Ergonômicas offline (PWA).
 * Avaliações locais (draft/pending) só marcam synced após confirmação do servidor.
 * Contexto (empresas/contratos/setores/funções) é preparado previamente para uso sem rede.
 */

import type { FerramentaTipo, ResultadoErgonomico } from "./types";

const DB_NAME = "segdoc-ergo-offline";
const DB_VERSION = 1;
const DEVICE_KEY = "segdoc-ergo-device-id";
const DEVICE_LABEL_KEY = "segdoc-ergo-device-label";
const MODE_KEY = "segdoc-ergo-mode";
const PREP_KEY = "segdoc-ergo-prepared-at";

export type ErgoOfflineSyncStatus = "draft" | "pending" | "syncing" | "synced" | "error";
export type ErgoModo = "online" | "offline";

export type ErgoOfflineAvaliacao = {
  client_id: string;
  device_id: string;
  device_label: string;
  ferramenta: FerramentaTipo;
  empresa_id: string | null;
  empresa_nome: string;
  contrato_id: string | null;
  setor_ref: string | null;
  setor_nome: string;
  colaborador_nome: string;
  funcao: string;
  atividade: string | null;
  data_avaliacao: string;
  respostas: Record<string, unknown>;
  resultado: ResultadoErgonomico;
  aet_documento_id: string | null;
  /** PDF gerado localmente (ArrayBuffer) para upload no sync. */
  pdf_blob: ArrayBuffer | null;
  pdf_filename: string | null;
  sync_status: ErgoOfflineSyncStatus;
  error_message?: string | null;
  server_id?: string | null;
  pdf_path?: string | null;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
};

export type ErgoOfflineEmpresa = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
};

export type ErgoOfflineContrato = {
  id: string;
  empresa_id: string;
  numero_contrato: string | null;
  nome_contratante: string | null;
};

export type ErgoOfflineSetor = {
  id: string;
  empresa_id: string;
  contrato_id: string;
  nome_setor: string;
  ghe_ges: string | null;
};

export type ErgoOfflineFuncao = {
  id: string;
  setor_id: string;
  nome_funcao: string;
};

export type ErgoOfflineContext = {
  id: "context";
  prepared_at: string;
  device_id: string;
  empresas: ErgoOfflineEmpresa[];
  contratos: ErgoOfflineContrato[];
  setores: ErgoOfflineSetor[];
  funcoes: ErgoOfflineFuncao[];
};

type StoreName = "avaliacoes" | "context";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("avaliacoes")) {
        const store = db.createObjectStore("avaliacoes", { keyPath: "client_id" });
        store.createIndex("by_ferramenta", "ferramenta", { unique: false });
        store.createIndex("by_sync", "sync_status", { unique: false });
        store.createIndex("by_server", "server_id", { unique: false });
      }
      if (!db.objectStoreNames.contains("context")) {
        db.createObjectStore("context", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Falha ao abrir IndexedDB ergonomia"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Falha na transação IndexedDB"));
    tx.onabort = () => reject(tx.error || new Error("Transação IndexedDB abortada"));
  });
}

export function getOrCreateErgoDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev_ephemeral_${Date.now()}`;
  }
}

export function getErgoDeviceLabel(): string {
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

export function newErgoClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `ergo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getErgoModoPreferido(): ErgoModo {
  try {
    return localStorage.getItem(MODE_KEY) === "offline" ? "offline" : "online";
  } catch {
    return "online";
  }
}

export function setErgoModoPreferido(modo: ErgoModo): void {
  try {
    localStorage.setItem(MODE_KEY, modo);
  } catch {
    /* ignore */
  }
}

export function getErgoPreparedAt(): string | null {
  try {
    return localStorage.getItem(PREP_KEY);
  } catch {
    return null;
  }
}

export function setErgoPreparedAt(iso: string): void {
  try {
    localStorage.setItem(PREP_KEY, iso);
  } catch {
    /* ignore */
  }
}

export async function saveErgoOffline(avaliacao: ErgoOfflineAvaliacao): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readwrite");
    tx.objectStore("avaliacoes").put(avaliacao);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function getErgoOffline(clientId: string): Promise<ErgoOfflineAvaliacao | null> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readonly");
    const req = tx.objectStore("avaliacoes").get(clientId);
    const row = await new Promise<ErgoOfflineAvaliacao | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return row || null;
  } finally {
    db.close();
  }
}

export async function listErgoOffline(filter?: {
  ferramenta?: FerramentaTipo | string;
  statuses?: ErgoOfflineSyncStatus[];
}): Promise<ErgoOfflineAvaliacao[]> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readonly");
    const req = tx.objectStore("avaliacoes").getAll();
    const all = await new Promise<ErgoOfflineAvaliacao[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as ErgoOfflineAvaliacao[]) || []);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return all
      .filter((item) => {
        if (filter?.ferramenta && item.ferramenta !== filter.ferramenta) return false;
        if (filter?.statuses && !filter.statuses.includes(item.sync_status)) return false;
        return true;
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  } finally {
    db.close();
  }
}

export async function countErgoOfflinePending(ferramenta?: string): Promise<{
  pending: number;
  error: number;
  draft: number;
  synced: number;
}> {
  const all = await listErgoOffline(ferramenta ? { ferramenta } : undefined);
  return {
    pending: all.filter((i) => i.sync_status === "pending" || i.sync_status === "syncing").length,
    error: all.filter((i) => i.sync_status === "error").length,
    draft: all.filter((i) => i.sync_status === "draft").length,
    synced: all.filter((i) => i.sync_status === "synced").length,
  };
}

export async function updateErgoOffline(
  clientId: string,
  patch: Partial<ErgoOfflineAvaliacao>,
): Promise<ErgoOfflineAvaliacao | null> {
  const current = await getErgoOffline(clientId);
  if (!current) return null;
  const next: ErgoOfflineAvaliacao = {
    ...current,
    ...patch,
    client_id: current.client_id,
    updated_at: patch.updated_at || new Date().toISOString(),
  };
  await saveErgoOffline(next);
  return next;
}

export async function deleteErgoOffline(clientId: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readwrite");
    tx.objectStore("avaliacoes").delete(clientId);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function saveErgoOfflineContext(ctx: ErgoOfflineContext): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("context", "readwrite");
    tx.objectStore("context").put(ctx);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function getErgoOfflineContext(): Promise<ErgoOfflineContext | null> {
  const db = await openDb();
  try {
    const tx = db.transaction("context", "readonly");
    const req = tx.objectStore("context").get("context");
    const row = await new Promise<ErgoOfflineContext | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return row || null;
  } finally {
    db.close();
  }
}

export function isErgoOfflineNow(): boolean {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine || getErgoModoPreferido() === "offline";
}
