import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "../server/node_modules/pg/lib/index.js";
import dotenv from "../server/node_modules/dotenv/lib/main.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "server", ".env") });

const sqlPath = path.join(root, "server", "migrations", "004_documento_validade_por_tipo.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await pool.query(sql);
  const r = await pool.query(
    "select tipo, count(*)::int as n, count(data_validade)::int as com_val from documentos group by tipo order by tipo",
  );
  console.log(JSON.stringify(r.rows, null, 2));
  console.log("OK migration applied");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
