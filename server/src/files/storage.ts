import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { isFileBucket, type FileBucket } from "../db/tables.js";

const resolveSafe = (bucket: FileBucket, objectPath: string) => {
  const normalized = objectPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) throw new Error("Caminho inválido.");
  const root = path.resolve(env.dataDir, bucket);
  const full = path.resolve(root, normalized);
  if (!full.startsWith(root + path.sep) && full !== root) throw new Error("Caminho fora do bucket.");
  return { root, full, relative: normalized };
};

export const ensureDataDir = async () => {
  await fs.mkdir(env.dataDir, { recursive: true });
};

export const uploadObject = async (
  bucketName: string,
  objectPath: string,
  data: Buffer,
  options?: { upsert?: boolean },
) => {
  if (!isFileBucket(bucketName)) throw new Error("Bucket inválido.");
  const { root, full, relative } = resolveSafe(bucketName, objectPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  if (!options?.upsert) {
    try {
      await fs.access(full);
      throw Object.assign(new Error("Arquivo já existe."), { status: 409 });
    } catch (error) {
      if ((error as { status?: number }).status === 409) throw error;
    }
  }
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(full, data);
  return { path: relative };
};

export const downloadObject = async (bucketName: string, objectPath: string) => {
  if (!isFileBucket(bucketName)) throw new Error("Bucket inválido.");
  const { full, relative } = resolveSafe(bucketName, objectPath);
  const data = await fs.readFile(full);
  return { data, path: relative };
};

export const removeObjects = async (bucketName: string, paths: string[]) => {
  if (!isFileBucket(bucketName)) throw new Error("Bucket inválido.");
  for (const objectPath of paths) {
    const { full } = resolveSafe(bucketName, objectPath);
    await fs.rm(full, { force: true });
  }
};

export const listObjects = async (bucketName: string, prefix = "") => {
  if (!isFileBucket(bucketName)) throw new Error("Bucket inválido.");
  const { full } = resolveSafe(bucketName, prefix || ".");
  const base = prefix ? full : path.resolve(env.dataDir, bucketName);
  await fs.mkdir(path.resolve(env.dataDir, bucketName), { recursive: true });
  let entries: string[] = [];
  try {
    entries = await fs.readdir(base);
  } catch {
    return [];
  }
  const out = [];
  for (const name of entries) {
    const stat = await fs.stat(path.join(base, name));
    out.push({
      name,
      id: name,
      updated_at: stat.mtime.toISOString(),
      created_at: stat.birthtime.toISOString(),
      metadata: { size: stat.size },
    });
  }
  return out;
};
