import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { adminDatabaseRouter } from "./routes/adminDatabase.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(healthRouter);
  app.use(authRouter);
  app.use(adminDatabaseRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
