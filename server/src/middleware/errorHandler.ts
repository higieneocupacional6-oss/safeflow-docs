import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
};

/** Resposta genérica. Detalhe de banco ou credencial fica só no log do servidor. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const detail = error instanceof Error ? error.message : "erro sem mensagem";
  console.error("Erro na API:", detail);
  res.status(500).json({ error: "Falha interna do servidor." });
};
