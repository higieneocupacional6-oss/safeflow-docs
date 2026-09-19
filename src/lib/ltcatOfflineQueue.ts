import type { LtcatIncrementalChanges, LtcatSerializedEvaluation } from "@/lib/ltcatPersistence";

const DB_NAME = "segdoc-ltcat-sync";
const STORE_NAME = "pending-saves";
const DB_VERSION = 1;

export type LtcatPendingOperation = {
  key: string;
  revision: string;
  userId: string;
  documentId: string;
  empresaId: string;
  tipoDocumento: "ltcat" | "insalubridade" | "periculosidade";
  tipoDocLabel: string;
  expectedVersion: number;
  createDocument: boolean;
  documentPatch: Record<string, unknown>;
  changes: LtcatIncrementalChanges;
  evaluations: LtcatSerializedEvaluation[];
  snapshot: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  nextAttemptAt: number;
  conflict?: boolean;
};

export interface LtcatQueueStorage {
  get(key: string): Promise<LtcatPendingOperation | null>;
  put(operation: LtcatPendingOperation): Promise<void>;
  removeIfRevision(key: string, revision: string): Promise<boolean>;
  listForUser(userId: string): Promise<LtcatPendingOperation[]>;
}

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") {
    reject(new Error("Armazenamento local seguro indisponível."));
    return;
  }
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
      store.createIndex("userId", "userId", { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("Falha ao abrir a fila local."));
});

const requestResult = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("Falha ao acessar a fila local."));
});

export const createIndexedDbLtcatQueue = (): LtcatQueueStorage => ({
  async get(key) {
    const db = await openDatabase();
    try {
      const transaction = db.transaction(STORE_NAME, "readonly");
      return (await requestResult(transaction.objectStore(STORE_NAME).get(key))) || null;
    } finally {
      db.close();
    }
  },
  async put(operation) {
    const db = await openDatabase();
    try {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      await requestResult(transaction.objectStore(STORE_NAME).put(operation));
    } finally {
      db.close();
    }
  },
  async removeIfRevision(key, revision) {
    const db = await openDatabase();
    try {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const current = await requestResult<LtcatPendingOperation | undefined>(store.get(key));
      if (!current || current.revision !== revision) return false;
      await requestResult(store.delete(key));
      return true;
    } finally {
      db.close();
    }
  },
  async listForUser(userId) {
    const db = await openDatabase();
    try {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const index = transaction.objectStore(STORE_NAME).index("userId");
      const rows = await requestResult<LtcatPendingOperation[]>(index.getAll(userId));
      return rows.sort((a, b) => a.createdAt - b.createdAt);
    } finally {
      db.close();
    }
  },
});

export const pendingOperationKey = (userId: string, tipo: string, documentId: string) =>
  `${userId}:${tipo}:${documentId}`;

export const createPendingOperation = (
  input: Omit<LtcatPendingOperation, "key" | "revision" | "createdAt" | "updatedAt" | "attempts" | "nextAttemptAt">,
  previous?: LtcatPendingOperation | null,
  now = Date.now(),
): LtcatPendingOperation => ({
  ...input,
  key: pendingOperationKey(input.userId, input.tipoDocumento, input.documentId),
  revision: crypto.randomUUID(),
  createdAt: previous?.createdAt ?? now,
  updatedAt: now,
  attempts: 0,
  nextAttemptAt: now,
  conflict: false,
});

export const retryDelayMs = (attempt: number, random = Math.random) => {
  const base = Math.min(60_000, 1_000 * 2 ** Math.max(0, attempt));
  return Math.round(base * (0.85 + random() * 0.3));
};

export const isVersionConflictMessage = (message: string) =>
  /alterações mais recentes|conflito de versão/i.test(message);

export const isTransientSaveError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "");
  return !isVersionConflictMessage(message) &&
    /fetch|network|rede|offline|timeout|tempo esgotado|temporar|503|502|504|api indisponível/i.test(message);
};

export const createMemoryLtcatQueue = (): LtcatQueueStorage => {
  const rows = new Map<string, LtcatPendingOperation>();
  return {
    async get(key) { return rows.get(key) || null; },
    async put(operation) { rows.set(operation.key, structuredClone(operation)); },
    async removeIfRevision(key, revision) {
      if (rows.get(key)?.revision !== revision) return false;
      rows.delete(key);
      return true;
    },
    async listForUser(userId) {
      return Array.from(rows.values()).filter((row) => row.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
    },
  };
};