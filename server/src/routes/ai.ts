import { Router } from "express";
import type { Response } from "express";
import { gerarJsonEstruturado } from "../ai/gemini.js";
import { AI_FUNCTIONS, buildPedido } from "../ai/handlers/index.js";
import { env } from "../config/env.js";
import { asyncHandler, requireAuth, requirePasswordCurrent } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const aiRouter = Router();

const writeNdjson = (res: Response, obj: unknown) => {
  res.write(`${JSON.stringify(obj)}\n`);
};

aiRouter.post(
  "/api/ai/:funcao",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const funcao = req.params.funcao;
    if (!AI_FUNCTIONS.has(funcao)) {
      res.status(404).json({ error: "Função de IA não encontrada." });
      return;
    }
    if (!env.geminiApiKey) {
      res.status(503).json({ error: "GEMINI_API_KEY não configurada no servidor." });
      return;
    }

    // NDJSON: pings periódicos + um único result|error final (contrato do aiEdgeStream).
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders?.();
    writeNdjson(res, { type: "ping" });
    const ping = setInterval(() => {
      try {
        writeNdjson(res, { type: "ping" });
      } catch { /* conexão fechada */ }
    }, 10_000);

    const abort = new AbortController();
    req.on("close", () => abort.abort());

    try {
      let pedido;
      try {
        pedido = await buildPedido(funcao, req.body);
      } catch (e) {
        const status = (e as any)?.status || 400;
        const error = e instanceof Error ? e.message : "Pedido de geração inválido.";
        // Erros de validação ainda vão no envelope NDJSON para o cliente ler.
        writeNdjson(res, { type: "error", error, retryable: false, status });
        return;
      }

      const result = await gerarJsonEstruturado(pedido, abort.signal);
      if (!result.ok) {
        writeNdjson(res, {
          type: "error",
          error: result.error,
          retryable: result.retryable ?? false,
        });
        return;
      }

      // `output` é o contrato legado das edge functions; `data` permanece por compatibilidade.
      writeNdjson(res, { type: "result", output: result.output, data: result.output });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      console.error("AI route error", (error as Error)?.message || error);
      writeNdjson(res, {
        type: "error",
        error: error instanceof Error ? error.message : "Falha na geração",
        retryable: true,
      });
    } finally {
      clearInterval(ping);
      if (!res.writableEnded) res.end();
    }
  }),
);
