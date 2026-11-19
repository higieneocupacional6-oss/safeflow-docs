/**
 * Portal Clientes — URLs públicas, upload em partes e frases motivacionais.
 */
import { apiRequest } from "@/lib/apiClient";
import { publicAppBaseUrl, resolvePublicAppBaseUrl } from "@/lib/psicoLink";

export const PORTAL_CHUNK_SIZE = 1024 * 1024; // 1 MiB por parte (seguro sob limite JSON 25mb)

export const FRASES_MOTIVACIONAIS = [
  "Cuidar das pessoas é o melhor investimento de qualquer organização.",
  "Segurança e saúde no trabalho começam com informação clara e acessível.",
  "Cada documento bem organizado aproxima a empresa de um ambiente mais seguro.",
  "Prevenir é valorizar quem faz o trabalho acontecer todos os dias.",
  "Transparência e responsabilidade fortalecem a cultura de SST.",
  "Um ambiente saudável impulsiona produtividade e bem-estar.",
  "Conhecimento compartilhado protege vidas e fortalece equipes.",
  "A excelência em SST se constrói com consistência e cuidado contínuo.",
  "Quando a informação chega certo, a prevenção acontece de verdade.",
  "Empresas que cuidam das pessoas prosperam com mais confiança.",
] as const;

export function fraseMotivacionalDoAcesso(seed?: string): string {
  const base = seed || `${Date.now()}_${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  return FRASES_MOTIVACIONAIS[hash % FRASES_MOTIVACIONAIS.length];
}

const PRIVATE_LAN =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/i;
const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

/** Evita https:// em IP privado (Vite/dev sem TLS → “resposta inválida”). */
export function forceHttpForPrivateLan(url: string): string {
  try {
    const u = new URL(url);
    if (PRIVATE_LAN.test(u.hostname) && u.protocol === "https:") {
      u.protocol = "http:";
      return u.origin;
    }
    return u.origin;
  } catch {
    return String(url || "").replace(/\/$/, "");
  }
}

export function publicPortalUrl(token: string, baseUrl = publicAppBaseUrl()) {
  const base = forceHttpForPrivateLan(baseUrl).replace(/\/$/, "");
  const path = `/p/${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

export async function resolvePublicPortalUrl(token: string): Promise<string> {
  // Se o admin já está no IP LAN via http, o link deve usar a mesma origem.
  if (typeof window !== "undefined" && window.location?.origin) {
    const host = window.location.hostname;
    if (PRIVATE_LAN.test(host) || (!LOOPBACK.test(host) && window.location.protocol === "http:")) {
      return publicPortalUrl(token, window.location.origin);
    }
  }
  const base = forceHttpForPrivateLan(await resolvePublicAppBaseUrl());
  return publicPortalUrl(token, base);
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export type PortalUploadProgress = {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

async function fileToChunks(file: File, chunkSize = PORTAL_CHUNK_SIZE): Promise<Blob[]> {
  const parts: Blob[] = [];
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    parts.push(file.slice(offset, Math.min(offset + chunkSize, file.size)));
  }
  return parts.length ? parts : [file.slice(0, 0)];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || "");
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(blob);
  });
}

/** Envia um arquivo em partes com retomada automática de partes já recebidas. */
export async function uploadPortalArquivoEmPartes(opts: {
  file: File;
  linkId: string;
  contratoId: string;
  onProgress?: (p: PortalUploadProgress) => void;
  signal?: AbortSignal;
}): Promise<{ id: string; nome_original: string; tamanho_bytes: number }> {
  const { file, linkId, contratoId, onProgress, signal } = opts;
  const chunks = await fileToChunks(file);
  const totalChunks = chunks.length;

  const report = (partial: Partial<PortalUploadProgress>) => {
    onProgress?.({
      fileName: file.name,
      loaded: 0,
      total: file.size || 1,
      percent: 0,
      status: "uploading",
      ...partial,
    });
  };

  report({ status: "uploading", loaded: 0, percent: 0 });

  const init = await apiRequest<{
    data: { uploadId: string; received: number[]; totalChunks: number };
  }>("/api/portal-clientes/upload/init", {
    method: "POST",
    csrf: true,
    body: {
      filename: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      totalChunks,
    },
  });

  const uploadId = init.data.uploadId;
  const already = new Set(init.data.received || []);
  let loaded = 0;

  try {
    for (let index = 0; index < totalChunks; index++) {
      if (signal?.aborted) throw new Error("Envio cancelado.");
      const part = chunks[index];
      if (already.has(index)) {
        loaded += part.size;
        report({
          loaded,
          percent: Math.min(99, Math.round((loaded / (file.size || 1)) * 100)),
          status: "uploading",
        });
        continue;
      }

      let attempt = 0;
      while (true) {
        attempt += 1;
        try {
          const contentBase64 = await blobToBase64(part);
          await apiRequest("/api/portal-clientes/upload/chunk", {
            method: "POST",
            csrf: true,
            body: { uploadId, index, contentBase64 },
          });
          break;
        } catch (error) {
          if (attempt >= 3) throw error;
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }

      loaded += part.size;
      report({
        loaded,
        percent: Math.min(99, Math.round((loaded / (file.size || 1)) * 100)),
        status: "uploading",
      });
    }

    const completed = await apiRequest<{
      data: { id: string; nome_original: string; tamanho_bytes: number };
    }>("/api/portal-clientes/upload/complete", {
      method: "POST",
      csrf: true,
      body: { uploadId, linkId, contratoId },
    });

    report({ loaded: file.size, percent: 100, status: "done" });
    return completed.data;
  } catch (error) {
    report({
      status: "error",
      error: error instanceof Error ? error.message : "Falha no upload",
      percent: Math.round((loaded / (file.size || 1)) * 100),
      loaded,
    });
    throw error;
  }
}

export async function criarPortalLink(opts: {
  empresaId: string;
  dataReferencia?: string | null;
  observacoes?: string | null;
}): Promise<{ id: string; token: string; created_at: string; retained_until: string }> {
  const result = await apiRequest<{
    data: { id: string; token: string; created_at: string; retained_until: string };
  }>("/api/portal-clientes/links", {
    method: "POST",
    csrf: true,
    body: {
      empresaId: opts.empresaId,
      dataReferencia: opts.dataReferencia || null,
      observacoes: opts.observacoes || null,
    },
  });
  return result.data;
}

export async function invalidarPortalLink(linkId: string): Promise<void> {
  await apiRequest(`/api/portal-clientes/links/${encodeURIComponent(linkId)}/invalidate`, {
    method: "POST",
    csrf: true,
    body: {},
  });
}

export async function excluirPortalArquivo(arquivoId: string): Promise<void> {
  await apiRequest(`/api/portal-clientes/arquivos/${encodeURIComponent(arquivoId)}/delete`, {
    method: "POST",
    csrf: true,
    body: {},
  });
}

export type PortalPublicoPayload = {
  link_id: string;
  token: string;
  empresa_id: string;
  empresa_nome: string;
  empresa_razao: string;
  data_referencia: string | null;
  observacoes: string | null;
  created_at: string;
  retained_until: string;
  contratos: Array<{
    id: string;
    numero_contrato: string | null;
    nome_contratante: string | null;
    arquivos: Array<{
      id: string;
      nome: string;
      tamanho_bytes: number;
      content_type: string | null;
      created_at: string;
    }>;
  }>;
};

export async function carregarPortalPublico(token: string): Promise<PortalPublicoPayload> {
  const result = await fetch(`/api/portal-clientes/public/${encodeURIComponent(token)}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const json = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(json?.error || "Portal indisponível.");
  }
  return json.data as PortalPublicoPayload;
}

export function urlDownloadPortalArquivo(token: string, arquivoId: string): string {
  return `/api/portal-clientes/public/${encodeURIComponent(token)}/download/${encodeURIComponent(arquivoId)}`;
}

/** Download autenticado (painel admin). */
export function urlDownloadPortalArquivoAdmin(arquivoId: string): string {
  return `/api/portal-clientes/arquivos/${encodeURIComponent(arquivoId)}/download`;
}
