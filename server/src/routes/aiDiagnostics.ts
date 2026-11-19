import { Router } from "express";
import {
  listarModelosOficiais,
  listDiagnosticHistory,
  statusProvedores,
  testarFallback,
  testarProvedor,
  type AiProviderId,
} from "../ai/diagnostics.js";
import { asyncHandler, requireAuth, requirePasswordCurrent, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const aiDiagnosticsRouter = Router();

const adminOnly = [requireAuth, requirePasswordCurrent, requireRole("admin")] as const;

const providers = new Set<AiProviderId>(["gemini", "groq", "openrouter"]);

function parseProvider(raw: string | undefined): AiProviderId | null {
  const p = String(raw || "").toLowerCase() as AiProviderId;
  return providers.has(p) ? p : null;
}

aiDiagnosticsRouter.get(
  "/api/ai-diagnostics/status",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...statusProvedores() });
  }),
);

aiDiagnosticsRouter.get(
  "/api/ai-diagnostics/history",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json({ ok: true, entries: listDiagnosticHistory(limit) });
  }),
);

aiDiagnosticsRouter.get(
  "/api/ai-diagnostics/models/:provider",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const provider = parseProvider(req.params.provider);
    if (!provider) {
      res.status(400).json({ error: "Provedor inválido. Use gemini, groq ou openrouter.", code: "invalid_request" });
      return;
    }
    const result = await listarModelosOficiais(provider, req.authUser?.id);
    // Lista bem-sucedida (mesmo com modelo descontinuado) → 200; falha de API → código específico.
    res.status(result.httpStatus || (result.ok ? 200 : 502)).json(result);
  }),
);

aiDiagnosticsRouter.post(
  "/api/ai-diagnostics/test/:provider",
  ...adminOnly,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const provider = parseProvider(req.params.provider);
    if (!provider) {
      res.status(400).json({ error: "Provedor inválido. Use gemini, groq ou openrouter.", code: "invalid_request" });
      return;
    }
    const result = await testarProvedor(provider, req.authUser?.id);
    res.status(result.httpStatus || (result.ok ? 200 : 502)).json(result);
  }),
);

aiDiagnosticsRouter.post(
  "/api/ai-diagnostics/test-fallback",
  ...adminOnly,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const result = await testarFallback(req.authUser?.id);
    res.status(result.httpStatus || (result.ok ? 200 : 502)).json(result);
  }),
);
