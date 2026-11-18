import { Router } from "express";
import { downloadObject, listObjects, removeObjects, uploadObject } from "../files/storage.js";
import { asyncHandler, requireAuth, requirePasswordCurrent } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const filesRouter = Router();

filesRouter.get(
  "/api/files/:bucket/list",
  requireAuth,
  requirePasswordCurrent,
  asyncHandler(async (req, res) => {
    const prefix = typeof req.query.prefix === "string" ? req.query.prefix : "";
    const data = await listObjects(req.params.bucket, prefix);
    res.status(200).json({ data });
  }),
);

filesRouter.get(
  "/api/files/:bucket/download",
  requireAuth,
  requirePasswordCurrent,
  asyncHandler(async (req, res) => {
    const objectPath = typeof req.query.path === "string" ? req.query.path : "";
    if (!objectPath) {
      res.status(400).json({ error: "Informe path." });
      return;
    }
    try {
      const file = await downloadObject(req.params.bucket, objectPath);
      res.status(200).type("application/octet-stream").send(file.data);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : "Arquivo não encontrado." });
    }
  }),
);

filesRouter.post(
  "/api/files/:bucket/upload",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const objectPath = typeof req.body?.path === "string" ? req.body.path : "";
    const contentBase64 = typeof req.body?.contentBase64 === "string" ? req.body.contentBase64 : "";
    const upsert = Boolean(req.body?.upsert);
    if (!objectPath || !contentBase64) {
      res.status(400).json({ error: "Informe path e contentBase64." });
      return;
    }
    try {
      const buffer = Buffer.from(contentBase64, "base64");
      const uploaded = await uploadObject(req.params.bucket, objectPath, buffer, { upsert });
      res.status(200).json({ data: uploaded });
    } catch (error) {
      const status = typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 400;
      res.status(status).json({ error: error instanceof Error ? error.message : "Falha no upload." });
    }
  }),
);

filesRouter.post(
  "/api/files/:bucket/remove",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const paths = Array.isArray(req.body?.paths) ? req.body.paths.filter((p: unknown) => typeof p === "string") : [];
    await removeObjects(req.params.bucket, paths);
    res.status(200).json({ ok: true });
  }),
);
