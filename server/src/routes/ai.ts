import { Router } from "express";
import { env } from "../config/env.js";
import { asyncHandler, requireAuth, requirePasswordCurrent } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

export const aiRouter = Router();

const FUNCTIONS = new Set([
  "aep-generate",
  "aet-generate",
  "apr-ergo-generate",
  "apr-ergo-plano-generate",
  "formulario-aep-generate",
  "psico-generate",
  "aet-vale-generate",
  "aet-vale-plano-generate",
  "aet-vale-foto-analyze",
]);

aiRouter.post(
  "/api/ai/:funcao",
  requireAuth,
  requirePasswordCurrent,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const funcao = req.params.funcao;
    if (!FUNCTIONS.has(funcao)) {
      res.status(404).json({ error: "Função de IA não encontrada." });
      return;
    }
    if (!env.geminiApiKey) {
      res.status(503).json({ error: "GEMINI_API_KEY não configurada no servidor." });
      return;
    }

    // Resposta NDJSON compatível com o consumidor atual (ping + result/error).
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.write(`${JSON.stringify({ type: "ping" })}\n`);

    try {
      const body = req.body ?? {};
      const prompt = typeof body.relato === "string"
        ? body.relato
        : JSON.stringify(body).slice(0, 12000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        res.write(`${JSON.stringify({ type: "error", error: `Gemini HTTP ${response.status}` })}\n`);
        console.error("Gemini:", detail.slice(0, 500));
        res.end();
        return;
      }
      const payload = await response.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      let parsed: unknown = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { texto: text };
      }
      res.write(`${JSON.stringify({ type: "result", data: parsed })}\n`);
      res.end();
    } catch (error) {
      res.write(
        `${JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Falha na geração",
        })}\n`,
      );
      res.end();
    }
  }),
);
