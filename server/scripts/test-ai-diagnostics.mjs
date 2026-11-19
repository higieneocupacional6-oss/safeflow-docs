/**
 * Testa listagem, ping e contingência sem subir o HTTP server.
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { listarModelosOficiais, testarProvedor, testarFallback, classificarErroHttp, modeloCorresponde } =
  await import(pathToFileURL(path.join(root, "src/ai/diagnostics.ts")).href);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// classificar erros
assert(classificarErroHttp(404, "model does not exist").code === "model_not_found", "404 model");
assert(classificarErroHttp(429, "rate limit").httpStatus === 429, "429");
assert(classificarErroHttp(401, "invalid api key").code === "invalid_key", "401");
assert(classificarErroHttp(504, "timeout").code === "timeout", "timeout");
assert(modeloCorresponde("groq", "llama-3.3-70b-versatile", "meta-llama/llama-3.3-70b-versatile"), "alias groq");

const results = {};

for (const provider of ["gemini", "groq", "openrouter"]) {
  console.log(`--- ping ${provider} ---`);
  const ping = await testarProvedor(provider);
  console.log({
    ok: ping.ok,
    httpStatus: ping.httpStatus,
    code: ping.code,
    model: ping.model,
    ms: ping.latencyMs,
    message: ping.message.slice(0, 160),
  });
  assert(ping.ok, `${provider} ping deve passar`);
  assert(ping.latencyMs < 20_000, `${provider} ping deve ser ágil (<20s), foi ${ping.latencyMs}ms`);
  results[provider] = { ping };
}

console.log("\n--- fallback chain ---");
const fb = await testarFallback();
console.log({
  ok: fb.ok,
  httpStatus: fb.httpStatus,
  ms: fb.latencyMs,
  steps: fb.steps.map((s) => `${s.step}:${s.ok ? "ok" : "FAIL"}:${s.code || ""}`),
});

assert(fb.ok, "Fallback deve passar");

console.log("\nALL DIAGNOSTIC TESTS PASSED");
console.log(JSON.stringify({
  gemini: { model: results.gemini.ping.model, ms: results.gemini.ping.latencyMs },
  groq: { model: results.groq.ping.model, ms: results.groq.ping.latencyMs },
  openrouter: { model: results.openrouter.ping.model, ms: results.openrouter.ping.latencyMs },
  fallback: fb.ok,
}, null, 2));
