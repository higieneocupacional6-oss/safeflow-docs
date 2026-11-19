/**
 * Upload em partes do Portal Clientes — chunks em disco, montagem final no bucket.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env.js";

const CHUNK_ROOT = () => path.resolve(env.dataDir, "_portal-chunks");

export type PortalUploadSession = {
  uploadId: string;
  filename: string;
  size: number;
  contentType: string;
  totalChunks: number;
  received: Set<number>;
  createdAt: number;
};

const sessions = new Map<string, PortalUploadSession>();

function sessionDir(uploadId: string) {
  return path.join(CHUNK_ROOT(), uploadId);
}

export async function initPortalUpload(opts: {
  filename: string;
  size: number;
  contentType?: string;
  totalChunks: number;
  resumeUploadId?: string | null;
}): Promise<PortalUploadSession> {
  await fs.mkdir(CHUNK_ROOT(), { recursive: true });

  if (opts.resumeUploadId && sessions.has(opts.resumeUploadId)) {
    const existing = sessions.get(opts.resumeUploadId)!;
    return existing;
  }

  // Retomada: sessão ainda no disco após reinício do processo
  if (opts.resumeUploadId) {
    const dir = sessionDir(opts.resumeUploadId);
    try {
      const metaRaw = await fs.readFile(path.join(dir, "meta.json"), "utf8");
      const meta = JSON.parse(metaRaw) as Omit<PortalUploadSession, "received"> & { received: number[] };
      const received = new Set<number>(meta.received || []);
      const session: PortalUploadSession = {
        uploadId: opts.resumeUploadId,
        filename: meta.filename || opts.filename,
        size: meta.size || opts.size,
        contentType: meta.contentType || opts.contentType || "application/octet-stream",
        totalChunks: meta.totalChunks || opts.totalChunks,
        received,
        createdAt: meta.createdAt || Date.now(),
      };
      sessions.set(session.uploadId, session);
      return session;
    } catch {
      /* cria nova */
    }
  }

  const uploadId = crypto.randomUUID().replace(/-/g, "");
  const session: PortalUploadSession = {
    uploadId,
    filename: opts.filename,
    size: opts.size,
    contentType: opts.contentType || "application/octet-stream",
    totalChunks: opts.totalChunks,
    received: new Set(),
    createdAt: Date.now(),
  };
  await fs.mkdir(sessionDir(uploadId), { recursive: true });
  await persistMeta(session);
  sessions.set(uploadId, session);
  return session;
}

async function persistMeta(session: PortalUploadSession) {
  const payload = {
    uploadId: session.uploadId,
    filename: session.filename,
    size: session.size,
    contentType: session.contentType,
    totalChunks: session.totalChunks,
    received: [...session.received],
    createdAt: session.createdAt,
  };
  await fs.writeFile(path.join(sessionDir(session.uploadId), "meta.json"), JSON.stringify(payload));
}

export async function savePortalChunk(
  uploadId: string,
  index: number,
  data: Buffer,
): Promise<{ received: number; totalChunks: number }> {
  const session = sessions.get(uploadId);
  if (!session) {
    // tenta recuperar do disco
    const recovered = await initPortalUpload({
      filename: "unknown",
      size: 0,
      totalChunks: 0,
      resumeUploadId: uploadId,
    });
    if (recovered.uploadId !== uploadId || recovered.totalChunks <= 0) {
      throw Object.assign(new Error("Sessão de upload não encontrada. Reinicie o envio."), { status: 404 });
    }
  }
  const current = sessions.get(uploadId)!;
  if (index < 0 || index >= current.totalChunks) {
    throw Object.assign(new Error("Índice de parte inválido."), { status: 400 });
  }
  const partPath = path.join(sessionDir(uploadId), `part-${index}`);
  await fs.writeFile(partPath, data);
  current.received.add(index);
  await persistMeta(current);
  return { received: current.received.size, totalChunks: current.totalChunks };
}

export async function assemblePortalUpload(uploadId: string): Promise<{
  buffer: Buffer;
  filename: string;
  contentType: string;
  size: number;
}> {
  const session = sessions.get(uploadId) || (await initPortalUpload({
    filename: "unknown",
    size: 0,
    totalChunks: 0,
    resumeUploadId: uploadId,
  }));
  if (!session || session.totalChunks <= 0) {
    throw Object.assign(new Error("Sessão de upload não encontrada."), { status: 404 });
  }
  if (session.received.size !== session.totalChunks) {
    throw Object.assign(
      new Error(`Upload incompleto: ${session.received.size}/${session.totalChunks} partes.`),
      { status: 400 },
    );
  }
  const parts: Buffer[] = [];
  for (let i = 0; i < session.totalChunks; i++) {
    parts.push(await fs.readFile(path.join(sessionDir(uploadId), `part-${i}`)));
  }
  const buffer = Buffer.concat(parts);
  return {
    buffer,
    filename: session.filename,
    contentType: session.contentType,
    size: buffer.length,
  };
}

export async function abortPortalUpload(uploadId: string): Promise<void> {
  sessions.delete(uploadId);
  await fs.rm(sessionDir(uploadId), { recursive: true, force: true });
}

/** Limpa sessões de chunk com mais de 48h. */
export async function cleanupStalePortalChunks(maxAgeMs = 48 * 60 * 60 * 1000): Promise<number> {
  await fs.mkdir(CHUNK_ROOT(), { recursive: true });
  let removed = 0;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(CHUNK_ROOT());
  } catch {
    return 0;
  }
  const now = Date.now();
  for (const name of entries) {
    const dir = path.join(CHUNK_ROOT(), name);
    try {
      const metaRaw = await fs.readFile(path.join(dir, "meta.json"), "utf8");
      const meta = JSON.parse(metaRaw) as { createdAt?: number };
      if ((meta.createdAt || 0) + maxAgeMs < now) {
        await fs.rm(dir, { recursive: true, force: true });
        sessions.delete(name);
        removed += 1;
      }
    } catch {
      /* ignore */
    }
  }
  return removed;
}
