import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { isAllowedOrigin } from "./config/origins.js";
import { attachAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { createSpaMiddleware } from "./middleware/spa.js";
import { adminDatabaseRouter } from "./routes/adminDatabase.js";
import { aiRouter } from "./routes/ai.js";
import { aiDiagnosticsRouter } from "./routes/aiDiagnostics.js";
import { authRouter } from "./routes/auth.js";
import { dataRouter } from "./routes/data.js";
import { filesRouter } from "./routes/files.js";
import { healthRouter } from "./routes/health.js";
import { cleanupPortalClientesExpired, portalClientesRouter } from "./routes/portalClientes.js";
import { rpcRouter } from "./routes/rpc.js";
import { usersRouter } from "./routes/users.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Sem Origin = mesma origem / ferramentas locais.
        callback(null, !origin || isAllowedOrigin(origin));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "25mb" }));
  app.use(cookieParser());
  app.use(attachAuth);
  app.use(healthRouter);
  app.use(authRouter);
  app.use(dataRouter);
  app.use(rpcRouter);
  app.use(filesRouter);
  app.use(portalClientesRouter);
  app.use(usersRouter);
  app.use(aiRouter);
  app.use(aiDiagnosticsRouter);
  app.use(adminDatabaseRouter);

  // Retenção Portal Clientes: 1 ano e 10 meses + limpeza de chunks órfãos
  void cleanupPortalClientesExpired().catch(() => {});
  setInterval(() => {
    void cleanupPortalClientesExpired().catch(() => {});
  }, 6 * 60 * 60 * 1000);
  for (const middleware of createSpaMiddleware()) {
    app.use(middleware);
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
