import type { Pool } from "pg";

const tableName = /^[a-z_][a-z0-9_]*$/;

export type PublicCatalog = {
  database: string;
  version: string;
  schema: "public";
  tableCount: number;
  rowCount: number;
  tables: { name: string; rows: number }[];
};

/** Leitura do catálogo. Não devolve host, usuário, senha nem conteúdo das linhas. */
export const readPublicCatalog = async (pool: Pool): Promise<PublicCatalog> => {
  const info = await pool.query<{ database: string; version: string }>(
    "SELECT current_database() AS database, current_setting('server_version') AS version",
  );
  const names = await pool.query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
  );

  const tables: { name: string; rows: number }[] = [];
  for (const item of names.rows) {
    const name = item.table_name;
    if (!tableName.test(name)) continue;
    const count = await pool.query<{ n: number }>(`SELECT count(*)::int AS n FROM public.${name}`);
    tables.push({ name, rows: count.rows[0].n });
  }

  return {
    database: info.rows[0].database,
    version: info.rows[0].version,
    schema: "public",
    tableCount: tables.length,
    rowCount: tables.reduce((sum, table) => sum + table.rows, 0),
    tables,
  };
};
