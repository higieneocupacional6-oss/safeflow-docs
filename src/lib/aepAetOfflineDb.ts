/**
 * IndexedDB — Formulário AEP/AET offline (PWA).
 * Avaliações locais preservam textos/fotos e só marcam synced após confirmação do servidor.
 */

import type { AepAetDados } from "@/lib/aepAetFormulario";

const DB_NAME = "segdoc-aep-aet-offline";
const DB_VERSION = 1;
const DEVICE_KEY = "segdoc-aep-aet-device-id";
const DEVICE_LABEL_KEY = "segdoc-aep-aet-device-label";
const MODE_KEY = "segdoc-aep-aet-mode";

export type AepAetModo = "online" | "offline";
export type AepAetOfflineSyncStatus = "pending" | "syncing" | "synced" | "error";

export type AepAetOfflineAvaliacao = {
  /** Identificador único desta avaliação neste dispositivo. */
  client_id: string;
  device_id: string;
  device_label: string;
  empresa_id: string;
  empresa_nome: string;
  contrato_id: string;
  contrato_nome: string;
  setor_id: string;
  setor_nome: string;
  funcao_id: string;
  funcao_nome: string;
  /** ID no servidor após sync (ou se abriu registro online). */
  server_id: string | null;
  status_doc: string;
  dados: AepAetDados;
  sync_status: AepAetOfflineSyncStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
  /** Preferência de modo neste registro. */
  preferred_mode?: AepAetModo;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("avaliacoes")) {
        const store = db.createObjectStore("avaliacoes", { keyPath: "client_id" });
        store.createIndex("by_contrato", "contrato_id", { unique: false });
        store.createIndex("by_empresa", "empresa_id", { unique: false });
        store.createIndex("by_server", "server_id", { unique: false });
        store.createIndex("by_sync", "sync_status", { unique: false });
        store.createIndex("by_funcao", "funcao_id", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Falha ao abrir IndexedDB AEP/AET"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Falha na transação IndexedDB"));
    tx.onabort = () => reject(tx.error || new Error("Transação IndexedDB abortada"));
  });
}

export function getOrCreateAepAetDeviceId(): string {
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

export function getAepAetDeviceLabel(): string {
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

export function newAepAetClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `aepaet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAepAetModoPreferido(): AepAetModo {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === "offline" ? "offline" : "online";
  } catch {
    return "online";
  }
}

export function setAepAetModoPreferido(modo: AepAetModo): void {
  try {
    localStorage.setItem(MODE_KEY, modo);
  } catch {
    /* ignore */
  }
}

export async function saveAepAetOffline(avaliacao: AepAetOfflineAvaliacao): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readwrite");
    tx.objectStore("avaliacoes").put(avaliacao);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function getAepAetOffline(clientId: string): Promise<AepAetOfflineAvaliacao | null> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readonly");
    const req = tx.objectStore("avaliacoes").get(clientId);
    const row = await new Promise<AepAetOfflineAvaliacao | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return row || null;
  } finally {
    db.close();
  }
}

export async function getAepAetOfflineByServerId(serverId: string): Promise<AepAetOfflineAvaliacao | null> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readonly");
    const idx = tx.objectStore("avaliacoes").index("by_server");
    const req = idx.getAll(serverId);
    const rows = await new Promise<AepAetOfflineAvaliacao[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as AepAetOfflineAvaliacao[]) || []);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return rows.find((r) => r.server_id === serverId) || null;
  } finally {
    db.close();
  }
}

export async function listAepAetOffline(filter?: {
  empresaId?: string;
  contratoId?: string;
  statuses?: AepAetOfflineSyncStatus[];
}): Promise<AepAetOfflineAvaliacao[]> {
  const db = await openDb();
  try {
    const tx = db.transaction("avaliacoes", "readonly");
    const req = tx.objectStore("avaliacoes").getAll();
    const all = await new Promise<AepAetOfflineAvaliacao[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as AepAetOfflineAvaliacao[]) || []);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return all.filter((item) => {
      if (filter?.empresaId && item.empresa_id !== filter.empresaId) return false;
      if (filter?.contratoId && item.contrato_id !== filter.contratoId) return false;
      if (filter?.statuses && !filter.statuses.includes(item.sync_status)) return false;
      return true;
    });
  } finally {
    db.close();
  }
}

export async function countAepAetOfflinePending(contratoId: string): Promise<{
  pending: number;
  error: number;
  synced: number;
}> {
  const all = await listAepAetOffline({ contratoId });
  return {
    pending: all.filter((i) => i.sync_status === "pending" || i.sync_status === "syncing").length,
    error: all.filter((i) => i.sync_status === "error").length,
    synced: all.filter((i) => i.sync_status === "synced").length,
  };
}

export async function updateAepAetOffline(
  clientId: string,
  patch: Partial<AepAetOfflineAvaliacao>,
): Promise<AepAetOfflineAvaliacao | null> {
  const current = await getAepAetOffline(clientId);
  if (!current) return null;
  const next: AepAetOfflineAvaliacao = {
    ...current,
    ...patch,
    client_id: current.client_id,
    updated_at: patch.updated_at || new Date().toISOString(),
  };
  await saveAepAetOffline(next);
  return next;
}

/** Upsert local a partir de um registro do servidor (espelho / modo offline). */
export async function upsertAepAetOfflineFromServer(args: {
  serverId: string;
  empresaId: string;
  empresaNome: string;
  contratoId: string;
  contratoNome: string;
  setorId: string;
  setorNome: string;
  funcaoId: string;
  funcaoNome: string;
  statusDoc: string;
  dados: AepAetDados;
  preferredMode?: AepAetModo;
  markPending?: boolean;
}): Promise<AepAetOfflineAvaliacao> {
  const existing = await getAepAetOfflineByServerId(args.serverId);
  const now = new Date().toISOString();
  const device_id = getOrCreateAepAetDeviceId();
  const device_label = getAepAetDeviceLabel();
  const row: AepAetOfflineAvaliacao = {
    client_id: existing?.client_id || newAepAetClientId(),
    device_id: existing?.device_id || device_id,
    device_label: existing?.device_label || device_label,
    empresa_id: args.empresaId,
    empresa_nome: args.empresaNome,
    contrato_id: args.contratoId,
    contrato_nome: args.contratoNome,
    setor_id: args.setorId,
    setor_nome: args.setorNome,
    funcao_id: args.funcaoId,
    funcao_nome: args.funcaoNome,
    server_id: args.serverId,
    status_doc: args.statusDoc,
    dados: args.dados,
    sync_status: args.markPending ? "pending" : existing?.sync_status === "pending" ? "pending" : "synced",
    error_message: args.markPending ? null : existing?.error_message ?? null,
    created_at: existing?.created_at || now,
    updated_at: now,
    synced_at: args.markPending ? existing?.synced_at ?? null : now,
    preferred_mode: args.preferredMode ?? existing?.preferred_mode ?? "offline",
  };
  await saveAepAetOffline(row);
  return row;
}

export async function createAepAetOfflineNovo(args: {
  empresaId: string;
  empresaNome: string;
  contratoId: string;
  contratoNome: string;
  setorId: string;
  setorNome: string;
  funcaoId: string;
  funcaoNome: string;
  dados: AepAetDados;
}): Promise<AepAetOfflineAvaliacao> {
  const now = new Date().toISOString();
  const row: AepAetOfflineAvaliacao = {
    client_id: newAepAetClientId(),
    device_id: getOrCreateAepAetDeviceId(),
    device_label: getAepAetDeviceLabel(),
    empresa_id: args.empresaId,
    empresa_nome: args.empresaNome,
    contrato_id: args.contratoId,
    contrato_nome: args.contratoNome,
    setor_id: args.setorId,
    setor_nome: args.setorNome,
    funcao_id: args.funcaoId,
    funcao_nome: args.funcaoNome,
    server_id: null,
    status_doc: "rascunho",
    dados: args.dados,
    sync_status: "pending",
    error_message: null,
    created_at: now,
    updated_at: now,
    synced_at: null,
    preferred_mode: "offline",
  };
  await saveAepAetOffline(row);
  return row;
}
