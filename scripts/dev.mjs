/**
 * Sobe API (Express :4000) e frontend (Vite :3080) juntos no desenvolvimento.
 * Uso: npm run dev:full
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

const children = [];

const start = (name, command, args, cwd) => {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWin,
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    console.log(`[${name}] encerrou (code=${code}, signal=${signal ?? ""})`);
    for (const other of children) {
      if (other !== child && !other.killed) other.kill("SIGTERM");
    }
    process.exit(code ?? 1);
  });
  children.push(child);
};

start("api", isWin ? "npm.cmd" : "npm", ["run", "dev"], path.join(root, "server"));
start("web", isWin ? "npm.cmd" : "npm", ["run", "dev"], root);

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
