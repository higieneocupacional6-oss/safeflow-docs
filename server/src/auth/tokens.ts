import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const createOpaqueToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};
