import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "../server/node_modules/pg/lib/index.js";
import dotenv from "../server/node_modules/dotenv/lib/main.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "server", ".env") });

const sqlPath = path.join(root, "server", "migrations", "005_psico_offline_client_id.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Garante schema private se o ambiente já tiver as wrappers públicas.
  await pool.query("CREATE SCHEMA IF NOT EXISTS private");
  await pool.query(sql);
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='psico_respostas' AND column_name='offline_client_id'
  `);
  console.log("offline_client_id:", cols.rows.length ? "ok" : "missing");
  console.log("OK psico offline migration");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
