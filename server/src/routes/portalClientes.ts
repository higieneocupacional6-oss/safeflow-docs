/**
 * Portal Clientes — upload em partes (autenticado) + download público por token.
 */
import { Router } from "express";
import crypto from "node:crypto";
import { getPool } from "../db/pool.js";
import { downloadObject, removeObjects, uploadObject } from "../files/storage.js";
import {
  abortPortalUpload,
  assemblePortalUpload,
  cleanupStalePortalChunks,
  initPortalUpload,
  savePortalChunk,
} from "../files/portalChunks.js";
import {
  asyncHandler,
  requireAuth,
  requirePasswordCurrent,
} from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const portalClientesRouter = Router();

const BUCKET = "portal-clientes";
const RETENTION_MONTHS = 22;

function safeFilename(name: string): string {
  return name.replace(/[^\w.\-()+\sÀ-ÿ]/gi, "_").replace(/\s+/g, " ").trim().slice(0, 180) || "arquivo";
}

function newShortToken(): string {
  return crypto.randomBytes(6).toString("hex");
}

function retainedUntilFrom(now = new Date()): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() + RETENTION_MONTHS);
  return d;
}

/** Limpeza de links expirados (1a10m) + chunks órfãos. */
export async function cleanupPortalClientesExpired(): Promise<{ links: number; chunks: number }> {
  const pool = getPool();
  let links = 0;
  if (pool) {
    const expired = await pool.query(
      `select id from portal_clientes_links where retained_until < now()`,
    );
    for (const row of expired.rows) {
      const files = await pool.query(
        `select storage_path from portal_clientes_arquivos where link_id = $1`,
        [row.id],
      );
      const paths = files.rows.map((f: { storage_path: string }) => f.storage_path).filter(Boolean);
      if (paths.length) {
        try {
          await removeObjects(BUCKET, paths);
        } catch {
          /* continua apagando o registro */
        }
      }
      await pool.query(`delete from portal_clientes_links where id = $1`, [row.id]);
      links += 1;
    }
  }
  const chunks = await cleanupStalePortalChunks();
  return { links, chunks };
}

// ---- Upload autenticado (multipart) ----

portalClientesRouter.post(
  "/api/portal-clientes/upload/init",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const filename = typeof req.body?.filename === "string" ? req.body.filename : "";
    const size = Number(req.body?.size || 0);
    const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "application/octet-stream";
    const totalChunks = Number(req.body?.totalChunks || 0);
    const resumeUploadId = typeof req.body?.uploadId === "string" ? req.body.uploadId : null;
    if (!filename || size < 0 || totalChunks < 1) {
      res.status(400).json({ error: "Informe filename, size e totalChunks." });
      return;
    }
    const session = await initPortalUpload({
      filename: safeFilename(filename),
      size,
      contentType,
      totalChunks,
      resumeUploadId,
    });
    res.status(200).json({
      data: {
        uploadId: session.uploadId,
        received: [...session.received],
        totalChunks: session.totalChunks,
      },
    });
  }),
);

portalClientesRouter.post(
  "/api/portal-clientes/upload/chunk",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const uploadId = typeof req.body?.uploadId === "string" ? req.body.uploadId : "";
    const index = Number(req.body?.index);
    const contentBase64 = typeof req.body?.contentBase64 === "string" ? req.body.contentBase64 : "";
    if (!uploadId || !Number.isInteger(index) || !contentBase64) {
      res.status(400).json({ error: "Informe uploadId, index e contentBase64." });
      return;
    }
    try {
      const buffer = Buffer.from(contentBase64, "base64");
      const progress = await savePortalChunk(uploadId, index, buffer);
      res.status(200).json({ data: progress });
    } catch (error) {
      const status = typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 400;
      res.status(status).json({ error: error instanceof Error ? error.message : "Falha no chunk." });
    }
  }),
);

portalClientesRouter.post(
  "/api/portal-clientes/upload/complete",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const uploadId = typeof req.body?.uploadId === "string" ? req.body.uploadId : "";
    const linkId = typeof req.body?.linkId === "string" ? req.body.linkId : "";
    const contratoId = typeof req.body?.contratoId === "string" ? req.body.contratoId : "";
    if (!uploadId || !linkId || !contratoId) {
      res.status(400).json({ error: "Informe uploadId, linkId e contratoId." });
      return;
    }

    const linkQ = await pool.query(
      `select l.id, l.empresa_id from portal_clientes_links l where l.id = $1 and l.ativo = true`,
      [linkId],
    );
    const link = linkQ.rows[0];
    if (!link) {
      res.status(404).json({ error: "Link do portal não encontrado." });
      return;
    }
    const ctrQ = await pool.query(
      `select id from contratos where id = $1 and empresa_id = $2`,
      [contratoId, link.empresa_id],
    );
    if (!ctrQ.rows[0]) {
      res.status(400).json({ error: "Contrato não pertence à empresa do link." });
      return;
    }

    try {
      const assembled = await assemblePortalUpload(uploadId);
      const arquivoId = crypto.randomUUID();
      const storagePath = `${link.empresa_id}/${linkId}/${arquivoId}_${safeFilename(assembled.filename)}`;
      await uploadObject(BUCKET, storagePath, assembled.buffer, { upsert: true });
      const ins = await pool.query(
        `insert into portal_clientes_arquivos
          (id, link_id, contrato_id, nome_original, storage_path, tamanho_bytes, content_type)
         values ($1,$2,$3,$4,$5,$6,$7)
         returning id, nome_original, tamanho_bytes, content_type, created_at`,
        [
          arquivoId,
          linkId,
          contratoId,
          assembled.filename,
          storagePath,
          assembled.size,
          assembled.contentType,
        ],
      );
      await abortPortalUpload(uploadId);
      res.status(200).json({ data: ins.rows[0] });
    } catch (error) {
      const status = typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 400;
      res.status(status).json({ error: error instanceof Error ? error.message : "Falha ao finalizar upload." });
    }
  }),
);

portalClientesRouter.post(
  "/api/portal-clientes/upload/abort",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const uploadId = typeof req.body?.uploadId === "string" ? req.body.uploadId : "";
    if (uploadId) await abortPortalUpload(uploadId);
    res.status(200).json({ ok: true });
  }),
);

/** Cria o registro do link (antes dos uploads) e devolve token curto. */
portalClientesRouter.post(
  "/api/portal-clientes/links",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const empresaId = typeof req.body?.empresaId === "string" ? req.body.empresaId : "";
    const dataReferencia = typeof req.body?.dataReferencia === "string" ? req.body.dataReferencia : null;
    const observacoes = typeof req.body?.observacoes === "string" ? req.body.observacoes : null;
    if (!empresaId) {
      res.status(400).json({ error: "Informe a empresa." });
      return;
    }
    const emp = await pool.query(`select id from empresas where id = $1`, [empresaId]);
    if (!emp.rows[0]) {
      res.status(404).json({ error: "Empresa não encontrada." });
      return;
    }
    const token = newShortToken();
    const now = new Date();
    const retained = retainedUntilFrom(now);
    const ins = await pool.query(
      `insert into portal_clientes_links
        (token, empresa_id, data_referencia, observacoes, created_by, created_at, retained_until, ativo)
       values ($1,$2,$3,$4,$5,$6,$7,true)
       returning id, token, empresa_id, data_referencia, observacoes, created_at, retained_until`,
      [
        token,
        empresaId,
        dataReferencia || null,
        observacoes,
        req.authUser?.id || null,
        now.toISOString(),
        retained.toISOString(),
      ],
    );
    res.status(200).json({ data: ins.rows[0] });
  }),
);

/** Invalida o link (deixa de abrir no portal público). */
portalClientesRouter.post(
  "/api/portal-clientes/links/:id/invalidate",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const id = String(req.params.id || "").trim();
    const upd = await pool.query(
      `update portal_clientes_links set ativo = false where id = $1 returning id, token, ativo`,
      [id],
    );
    if (!upd.rows[0]) {
      res.status(404).json({ error: "Link não encontrado." });
      return;
    }
    res.status(200).json({ data: upd.rows[0] });
  }),
);

/** Download autenticado (admin) — funciona mesmo com link invalidado. */
portalClientesRouter.get(
  "/api/portal-clientes/arquivos/:id/download",
  requireAuth,
  requirePasswordCurrent,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const id = String(req.params.id || "").trim();
    const q = await pool.query(
      `select id, storage_path, nome_original, content_type from portal_clientes_arquivos where id = $1`,
      [id],
    );
    const row = q.rows[0];
    if (!row?.storage_path) {
      res.status(404).json({ error: "Arquivo não encontrado." });
      return;
    }
    try {
      const file = await downloadObject(BUCKET, row.storage_path);
      const filename = encodeURIComponent(row.nome_original || "arquivo");
      res.setHeader("Content-Type", row.content_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.status(200).send(file.data);
    } catch {
      res.status(404).json({ error: "Arquivo indisponível no armazenamento." });
    }
  }),
);

/** Remove arquivo do portal (storage + registro) — some imediatamente do link público. */
portalClientesRouter.post(
  "/api/portal-clientes/arquivos/:id/delete",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const id = String(req.params.id || "").trim();
    const q = await pool.query(
      `select id, storage_path, link_id from portal_clientes_arquivos where id = $1`,
      [id],
    );
    const row = q.rows[0];
    if (!row) {
      res.status(404).json({ error: "Arquivo não encontrado." });
      return;
    }
    try {
      if (row.storage_path) await removeObjects(BUCKET, [row.storage_path]);
    } catch {
      /* remove registro mesmo se o arquivo já não existir */
    }
    await pool.query(`delete from portal_clientes_arquivos where id = $1`, [id]);
    res.status(200).json({ ok: true, data: { id, link_id: row.link_id } });
  }),
);

// ---- Público (sem auth) — isolamento pelo token ----

portalClientesRouter.get(
  "/api/portal-clientes/public/:token",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const token = String(req.params.token || "").trim();
    if (!token) {
      res.status(400).json({ error: "Token inválido." });
      return;
    }
    const result = await pool.query(`select public.portal_get_public_link($1) as result`, [token]);
    const data = result.rows[0]?.result;
    if (data?.error) {
      res.status(404).json({ error: data.error });
      return;
    }
    res.status(200).json({ data });
  }),
);

portalClientesRouter.get(
  "/api/portal-clientes/public/:token/download/:arquivoId",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "Banco não configurado." });
      return;
    }
    const token = String(req.params.token || "").trim();
    const arquivoId = String(req.params.arquivoId || "").trim();
    const q = await pool.query(
      `select a.storage_path, a.nome_original, a.content_type, l.empresa_id, l.retained_until, l.ativo
       from portal_clientes_arquivos a
       join portal_clientes_links l on l.id = a.link_id
       where l.token = $1 and a.id = $2`,
      [token, arquivoId],
    );
    const row = q.rows[0];
    if (!row || !row.ativo) {
      res.status(404).json({ error: "Arquivo não encontrado neste portal." });
      return;
    }
    if (new Date(row.retained_until) < new Date()) {
      res.status(410).json({ error: "Este portal expirou." });
      return;
    }
    try {
      const file = await downloadObject(BUCKET, row.storage_path);
      const filename = encodeURIComponent(row.nome_original || "arquivo");
      res.setHeader("Content-Type", row.content_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.status(200).send(file.data);
    } catch {
      res.status(404).json({ error: "Arquivo indisponível no armazenamento." });
    }
  }),
);
