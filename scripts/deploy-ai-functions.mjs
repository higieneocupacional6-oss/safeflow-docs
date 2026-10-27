/**
 * Publica as Edge Functions de IA no Supabase (JWT continua obrigatório).
 * Não altera secrets nem dados. Requer sessão da CLI, não a chave Gemini.
 *
 * Uso (terminal interativo, não o agente):
 *   npx supabase login
 *   node scripts/deploy-ai-functions.mjs
 *
 * Ou: $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node scripts/deploy-ai-functions.mjs
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REF = process.env.SUPABASE_PROJECT_REF || "fibqwwdnxymgmlwfmsgm";
const FUNCOES = [
  "formulario-aep-generate",
  "apr-ergo-generate",
  "aep-generate",
  "aet-generate",
  "aet-vale-generate",
  "aet-vale-plano-generate",
  "aet-vale-foto-analyze",
  "psico-generate",
];

try {
  execSync("npx supabase projects list -o json", {
    stdio: "pipe",
    env: process.env,
  });
} catch {
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    console.error("A CLI não está autenticada. Rode `npx supabase login` num terminal interativo (TTY) ou defina SUPABASE_ACCESS_TOKEN (token pessoal do dashboard, Account > Access Tokens).");
    process.exit(1);
  }
}

const root = join(process.cwd(), "supabase", "functions");
for (const nome of FUNCOES) {
  const dir = join(root, nome);
  if (!existsSync(dir)) {
    console.error("Pasta ausente:", dir);
    process.exit(1);
  }
  console.log("Publicando", nome, "...");
  // --use-api evita Docker no Windows; JWT permanece verificado no gateway.
  execSync(`npx supabase functions deploy ${nome} --project-ref ${REF} --use-api`, {
    stdio: "inherit",
    env: process.env,
  });
}
console.log("Publicação concluída. O secret GEMINI_API_KEY do projeto não é alterado por este script.");
