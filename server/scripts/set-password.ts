/**
 * Define a senha inicial de um usuário já existente em app.users.
 * Não imprime a senha. Exige confirmação tipada.
 *
 * Uso:
 *   npx tsx scripts/set-password.ts --email usuario@empresa.com
 * A senha é lida do prompt (stdin oculto não disponível no PowerShell simples),
 * então prefira:
 *   $env:SEGcrm_PASSWORD='...'; npx tsx scripts/set-password.ts --email ...
 * e remova a variável em seguida.
 */
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { setInitialPassword } from "../src/auth/service.js";
import { closePool } from "../src/db/pool.js";

const emailArg = process.argv.find((arg) => arg.startsWith("--email="))?.slice("--email=".length)
  ?? process.argv[process.argv.indexOf("--email") + 1];

if (!emailArg) {
  console.error("Informe --email do usuário.");
  process.exit(1);
}

const readPassword = async () => {
  if (process.env.SEGCRM_PASSWORD) return process.env.SEGCRM_PASSWORD;
  const rl = readline.createInterface({ input, output });
  try {
    const password = await rl.question("Nova senha inicial: ");
    const confirm = await rl.question("Confirme a senha: ");
    if (password !== confirm) throw new Error("As senhas não coincidem.");
    return password;
  } finally {
    rl.close();
  }
};

try {
  const password = await readPassword();
  const user = await setInitialPassword(emailArg, password);
  console.log(`Senha inicial definida para ${user.email}. must_change_password=true.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha ao definir senha.");
  process.exitCode = 1;
} finally {
  await closePool();
}
