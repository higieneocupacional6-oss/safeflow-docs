import fs from "node:fs";
import path from "node:path";
import type { RequestHandler } from "express";
import express from "express";
import { env } from "../config/env.js";

const apiPrefixes = ["/api", "/health", "/admin"];

const isApiPath = (urlPath: string) =>
  apiPrefixes.some((prefix) => urlPath === prefix || urlPath.startsWith(`${prefix}/`));

export const createSpaMiddleware = (): RequestHandler[] => {
  const dist = env.frontendDist;
  const indexHtml = path.join(dist, "index.html");
  const hasDist = fs.existsSync(indexHtml);

  if (!hasDist) {
    const missing: RequestHandler = (req, res, next) => {
      if (isApiPath(req.path)) {
        next();
        return;
      }
      res.status(503).json({
        error: "Frontend ainda não foi gerado. Execute npm run build na raiz do projeto.",
        frontendDist: dist,
      });
    };
    return [missing];
  }

  const staticFiles = express.static(dist, {
    index: false,
    fallthrough: true,
    maxAge: env.nodeEnv === "production" ? "1h" : 0,
  });

  const spaFallback: RequestHandler = (req, res, next) => {
    if (isApiPath(req.path)) {
      next();
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    res.sendFile(indexHtml, (error) => {
      if (error) next(error);
    });
  };

  return [staticFiles, spaFallback];
};
