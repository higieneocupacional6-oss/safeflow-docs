import type { Pool, PoolClient } from "pg";
import { setAppUserContext } from "../auth/service.js";
import { isJsonbColumn, toJsonbParam } from "./jsonColumns.js";
import { isPublicTable } from "./tables.js";

export type FilterOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "in"
  | "is"
  | "contains";

export type QueryFilter = {
  column: string;
  op: FilterOp;
  value: unknown;
};

export type QueryRequest = {
  table: string;
  action: "select" | "insert" | "update" | "delete" | "upsert";
  select?: string;
  filters?: QueryFilter[];
  data?: Record<string, unknown> | Record<string, unknown>[];
  order?: { column: string; ascending?: boolean }[];
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
  onConflict?: string;
  ignoreDuplicates?: boolean;
  returning?: string;
};

type ParsedSelect = {
  columns: string[];
  embeds: Array<{
    name: string;
    inner: boolean;
    select: ParsedSelect;
  }>;
};

const ident = /^[a-z_][a-z0-9_]*$/i;

const quoteIdent = (name: string) => {
  if (!ident.test(name)) throw new Error(`Identificador inválido: ${name}`);
  return `"${name}"`;
};

/** Filho → FK apontando para o pai. */
const HAS_MANY: Record<string, Record<string, string>> = {
  setores: { funcoes: "setor_id" },
  equipamentos_ho: { equipamentos_ho_registros: "equipamento_id" },
  epi_epc: { epi_epc_riscos: "epi_epc_id" },
};

/** Embed → FK no registro pai. */
const BELONGS_TO_FK: Record<string, string> = {
  empresas: "empresa_id",
  contratos: "contrato_id",
  setores: "setor_id",
  riscos: "risco_id",
  funcoes: "funcao_id",
};

const splitTopLevel = (input: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseSelectString = (raw?: string): ParsedSelect => {
  if (!raw || raw.trim() === "*") return { columns: ["*"], embeds: [] };
  const parts = splitTopLevel(raw);
  const columns: string[] = [];
  const embeds: ParsedSelect["embeds"] = [];
  for (const part of parts) {
    const embedMatch = part.match(/^([a-z_][a-z0-9_]*)(!inner)?\((.*)\)$/i);
    if (embedMatch) {
      embeds.push({
        name: embedMatch[1],
        inner: Boolean(embedMatch[2]),
        select: parseSelectString(embedMatch[3] || "*"),
      });
      continue;
    }
    if (part === "*") {
      columns.push("*");
      continue;
    }
    // PostgREST alias: "objeto:escopo_contrato" → coluna escopo_contrato
    const aliasMatch = part.match(/^([a-z_][a-z0-9_]*):([a-z_][a-z0-9_]*)$/i);
    if (aliasMatch) {
      columns.push(aliasMatch[2]);
      continue;
    }
    if (!ident.test(part)) throw new Error(`Coluna inválida no select: ${part}`);
    columns.push(part);
  }
  if (!columns.length) columns.push("*");
  return { columns, embeds };
};

/** Garante id/FKs necessários para montar embeds (has-many/belongs-to). */
const ensureEmbedKeys = (tableName: string, parsed: ParsedSelect): ParsedSelect => {
  if (!parsed.embeds.length || parsed.columns.includes("*")) return parsed;
  const columns = [...parsed.columns];
  if (!columns.includes("id")) columns.unshift("id");
  for (const embed of parsed.embeds) {
    if (HAS_MANY[tableName]?.[embed.name]) continue;
    const fk = BELONGS_TO_FK[embed.name];
    if (fk && !columns.includes(fk)) columns.push(fk);
  }
  return { ...parsed, columns };
};

const sqlColumns = (columns: string[]) => {
  if (columns.includes("*")) return "*";
  return columns.map(quoteIdent).join(", ");
};

const applyFilters = (
  filters: QueryFilter[] | undefined,
  params: unknown[],
  tableName?: string,
) => {
  if (!filters?.length) return "";
  const parts: string[] = [];
  for (const filter of filters) {
    if (!ident.test(filter.column)) throw new Error(`Coluna inválida: ${filter.column}`);
    const col = quoteIdent(filter.column);
    if (filter.op === "in") {
      const values = Array.isArray(filter.value) ? filter.value : [];
      if (!values.length) {
        parts.push("FALSE");
        continue;
      }
      const placeholders = values.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      parts.push(`${col} IN (${placeholders.join(", ")})`);
      continue;
    }
    if (filter.op === "is") {
      if (filter.value === null) parts.push(`${col} IS NULL`);
      else if (filter.value === true) parts.push(`${col} IS TRUE`);
      else if (filter.value === false) parts.push(`${col} IS FALSE`);
      else throw new Error("Operador is aceita null, true ou false.");
      continue;
    }
    if (filter.op === "contains") {
      const asJsonb = Boolean(tableName && isJsonbColumn(tableName, filter.column));
      if (Array.isArray(filter.value)) {
        if (asJsonb) {
          params.push(toJsonbParam(filter.value));
          parts.push(`${col} @> $${params.length}::jsonb`);
        } else {
          // text[] / uuid[] etc.
          params.push(filter.value);
          parts.push(`${col} @> $${params.length}`);
        }
      } else if (filter.value && typeof filter.value === "object") {
        params.push(toJsonbParam(filter.value));
        parts.push(`${col} @> $${params.length}::jsonb`);
      } else {
        throw new Error("contains exige objeto ou array.");
      }
      continue;
    }
    const sqlOp =
      filter.op === "eq" ? "=" :
      filter.op === "neq" ? "<>" :
      filter.op === "gt" ? ">" :
      filter.op === "gte" ? ">=" :
      filter.op === "lt" ? "<" :
      filter.op === "lte" ? "<=" :
      filter.op === "like" ? "LIKE" :
      filter.op === "ilike" ? "ILIKE" : null;
    if (!sqlOp) throw new Error(`Operador inválido: ${filter.op}`);
    if (filter.value === undefined) {
      throw new Error(`Filtro ${filter.column} sem valor.`);
    }
    if (tableName && isJsonbColumn(tableName, filter.column)) {
      params.push(toJsonbParam(filter.value));
      parts.push(`${col} ${sqlOp} $${params.length}::jsonb`);
    } else {
      params.push(filter.value);
      parts.push(`${col} ${sqlOp} $${params.length}`);
    }
  }
  return parts.length ? ` WHERE ${parts.join(" AND ")}` : "";
};

/** Bind de valor tipado: jsonb nunca usa serialização de array do node-pg. */
const pushColumnValue = (
  params: unknown[],
  tableName: string,
  column: string,
  value: unknown,
  userId: string | null,
): string => {
  if ((column === "created_by" || column === "user_id") && value == null && userId) {
    params.push(userId);
    return `$${params.length}`;
  }
  if (isJsonbColumn(tableName, column)) {
    try {
      params.push(toJsonbParam(value));
    } catch {
      throw new Error(`Valor JSON inválido na coluna ${tableName}.${column}.`);
    }
    return `$${params.length}::jsonb`;
  }
  params.push(value ?? null);
  return `$${params.length}`;
};

const validIds = (ids: string[]) => [...new Set(ids.filter((id) => UUID_RE.test(id)))];

const loadByIds = async (
  client: PoolClient,
  table: string,
  columns: string[],
  ids: string[],
) => {
  const clean = validIds(ids);
  if (!clean.length) return [] as Record<string, unknown>[];
  if (!isPublicTable(table)) throw new Error(`Tabela embutida não permitida: ${table}`);
  const params: unknown[] = [];
  const placeholders = clean.map((id) => {
    params.push(id);
    return `$${params.length}`;
  });
  const sql = `SELECT ${sqlColumns(columns.includes("*") ? ["*"] : ["id", ...columns.filter((c) => c !== "id")])}
    FROM public.${quoteIdent(table)} WHERE "id" IN (${placeholders.join(", ")})`;
  return (await client.query(sql, params)).rows as Record<string, unknown>[];
};

const loadByFk = async (
  client: PoolClient,
  table: string,
  columns: string[],
  fk: string,
  parentIds: string[],
) => {
  const clean = validIds(parentIds);
  if (!clean.length) return [] as Record<string, unknown>[];
  if (!isPublicTable(table)) throw new Error(`Tabela embutida não permitida: ${table}`);
  const params: unknown[] = [];
  const placeholders = clean.map((id) => {
    params.push(id);
    return `$${params.length}`;
  });
  const selectCols = columns.includes("*")
    ? "*"
    : sqlColumns([...new Set(["id", fk, ...columns.filter((c) => c !== "id" && c !== fk)])]);
  const sql = `SELECT ${selectCols} FROM public.${quoteIdent(table)}
    WHERE ${quoteIdent(fk)} IN (${placeholders.join(", ")})`;
  return (await client.query(sql, params)).rows as Record<string, unknown>[];
};

const attachEmbeds = async (
  client: PoolClient,
  parentTable: string,
  rows: Record<string, unknown>[],
  embeds: ParsedSelect["embeds"],
): Promise<Record<string, unknown>[]> => {
  if (!embeds.length || !rows.length) return rows;
  let working = rows;

  for (const embed of embeds) {
    const hasManyFk = HAS_MANY[parentTable]?.[embed.name];
    if (hasManyFk) {
      const parentIds = working.map((row) => String(row.id ?? "")).filter((id) => UUID_RE.test(id));
      const children = await loadByFk(
        client,
        embed.name,
        embed.select.columns,
        hasManyFk,
        parentIds,
      );
      const nestedChildren = await attachEmbeds(client, embed.name, children, embed.select.embeds);
      const byParent = new Map<string, Record<string, unknown>[]>();
      for (const child of nestedChildren) {
        const key = String(child[hasManyFk] ?? "");
        if (!byParent.has(key)) byParent.set(key, []);
        byParent.get(key)!.push(child);
      }
      working = working.map((row) => ({
        ...row,
        [embed.name]: byParent.get(String(row.id)) ?? [],
      }));
      if (embed.inner) {
        working = working.filter((row) => Array.isArray(row[embed.name]) && (row[embed.name] as unknown[]).length > 0);
      }
      continue;
    }

    const fk = BELONGS_TO_FK[embed.name];
    if (!fk) throw new Error(`Relação embutida não suportada: ${parentTable}.${embed.name}`);
    const relatedIds = [...new Set(
      working.map((row) => row[fk]).filter((value): value is string => typeof value === "string" && value.length > 0),
    )];
    const related = await loadByIds(client, embed.name, embed.select.columns, relatedIds);
    const nestedRelated = await attachEmbeds(client, embed.name, related, embed.select.embeds);
    const byId = new Map(nestedRelated.map((row) => [String(row.id), row]));
    working = working.map((row) => ({
      ...row,
      [embed.name]: byId.get(String(row[fk] ?? "")) ?? null,
    }));
    if (embed.inner) {
      working = working.filter((row) => row[embed.name] != null);
    }
  }

  return working;
};

/** Tabelas com created_by NOT NULL (DEFAULT app.current_user_id()). */
const TABLES_REQUIRE_CREATED_BY = new Set(["ficha_tecnica_resultados"]);

/** Tabelas com user_id NOT NULL do ator autenticado. */
const TABLES_REQUIRE_USER_ID = new Set(["psico_base_tecnica", "ergonomia_avaliacoes"]);

/**
 * Nunca envia created_by/user_id nulos (isso anula o DEFAULT do PostgreSQL).
 * Usa exclusivamente o UUID da sessão autenticada — sem inventar identidade.
 */
const applyActorDefaults = (
  tableName: string,
  row: Record<string, unknown>,
  userId: string | null,
): Record<string, unknown> => {
  const next: Record<string, unknown> = { ...row };

  // NULL explícito sobrescreve DEFAULT; remove para não forçar null.
  if (next.created_by == null) delete next.created_by;
  if (Object.prototype.hasOwnProperty.call(next, "user_id") && next.user_id == null) {
    delete next.user_id;
  }

  const needsCreatedBy = TABLES_REQUIRE_CREATED_BY.has(tableName);
  const needsUserId = TABLES_REQUIRE_USER_ID.has(tableName);

  if ((needsCreatedBy || needsUserId) && !userId) {
    throw Object.assign(new Error("Autenticação obrigatória para gravar este registro."), {
      status: 401,
    });
  }

  if (needsCreatedBy && userId) next.created_by = userId;
  if (needsUserId && userId && next.user_id == null) next.user_id = userId;

  // Cliente enviou created_by: null (ex.: user?.id ausente) → troca pelo ator da sessão.
  if (userId && Object.prototype.hasOwnProperty.call(row, "created_by") && row.created_by == null) {
    next.created_by = userId;
  }

  return next;
};

const alignRowColumns = (
  rows: Record<string, unknown>[],
  columns: string[],
  userId: string | null,
) => {
  for (const row of rows) {
    for (const column of columns) {
      if (column in row) continue;
      if ((column === "created_by" || column === "user_id") && userId) {
        row[column] = userId;
      } else {
        row[column] = null;
      }
    }
  }
};

export const runTableQuery = async (
  pool: Pool,
  request: QueryRequest,
  userId: string | null,
) => {
  if (!isPublicTable(request.table)) throw new Error("Tabela não permitida.");
  const table = quoteIdent(request.table);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setAppUserContext(client, userId);
    const result = await execute(client, request.table, table, request, userId);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const execute = async (
  client: PoolClient,
  tableName: string,
  table: string,
  request: QueryRequest,
  userId: string | null,
) => {
  const params: unknown[] = [];
  const parsed = ensureEmbedKeys(
    tableName,
    parseSelectString(request.returning ?? request.select ?? "*"),
  );
  const returning = sqlColumns(parsed.columns);

  if (request.action === "select") {
    let sql = `SELECT ${returning} FROM public.${table}`;
    sql += applyFilters(request.filters, params, tableName);
    if (request.order?.length) {
      const orderSql = request.order.map((item) => {
        if (!ident.test(item.column)) throw new Error(`Coluna inválida: ${item.column}`);
        return `${quoteIdent(item.column)} ${item.ascending === false ? "DESC" : "ASC"}`;
      });
      sql += ` ORDER BY ${orderSql.join(", ")}`;
    }
    if (request.limit && Number.isInteger(request.limit) && request.limit > 0) {
      params.push(request.limit);
      sql += ` LIMIT $${params.length}`;
    }
    let rows = (await client.query(sql, params)).rows as Record<string, unknown>[];
    rows = await attachEmbeds(client, tableName, rows, parsed.embeds);
    if (request.single) {
      if (rows.length !== 1) throw Object.assign(new Error("Resultado único esperado."), { status: 406 });
      return { data: rows[0], count: 1 };
    }
    if (request.maybeSingle) {
      if (rows.length > 1) throw Object.assign(new Error("Mais de um resultado."), { status: 406 });
      return { data: rows[0] ?? null, count: rows.length };
    }
    return { data: rows, count: rows.length };
  }

  if (request.action === "insert") {
    const rawRows = Array.isArray(request.data) ? request.data : [request.data ?? {}];
    if (!rawRows.length) return { data: [], count: 0 };
    const rows = rawRows.map((row) => applyActorDefaults(tableName, row ?? {}, userId));
    const columns = Object.keys(rows[0] ?? {}).filter((key) => ident.test(key));
    if (!columns.length) throw new Error("Nenhuma coluna para inserir.");
    alignRowColumns(rows, columns, userId);
    const valuesSql = rows.map((row) => {
      const placeholders = columns.map((column) =>
        pushColumnValue(params, tableName, column, row[column], userId),
      );
      return `(${placeholders.join(", ")})`;
    });
    const sql = `INSERT INTO public.${table} (${columns.map(quoteIdent).join(", ")})
      VALUES ${valuesSql.join(", ")} RETURNING ${returning === "*" ? "*" : returning}`;
    const inserted = (await client.query(sql, params)).rows;
    if (request.single || request.maybeSingle) return { data: inserted[0] ?? null, count: inserted.length };
    return { data: inserted, count: inserted.length };
  }

  if (request.action === "update") {
    const patch = { ...((!Array.isArray(request.data) ? request.data : null) ?? {}) };
    // Não permitir apagar created_by com NULL (reserva a autoria original).
    if (patch.created_by == null) delete patch.created_by;
    const columns = Object.keys(patch).filter((key) => ident.test(key));
    if (!columns.length) throw new Error("Nenhuma coluna para atualizar.");
    const sets = columns.map((column) => {
      const placeholder = pushColumnValue(params, tableName, column, patch[column], userId);
      return `${quoteIdent(column)} = ${placeholder}`;
    });
    let sql = `UPDATE public.${table} SET ${sets.join(", ")}`;
    sql += applyFilters(request.filters, params, tableName);
    sql += ` RETURNING ${returning === "*" ? "*" : returning}`;
    const updated = (await client.query(sql, params)).rows;
    if (request.single || request.maybeSingle) return { data: updated[0] ?? null, count: updated.length };
    return { data: updated, count: updated.length };
  }

  if (request.action === "delete") {
    let sql = `DELETE FROM public.${table}`;
    sql += applyFilters(request.filters, params, tableName);
    sql += ` RETURNING ${returning === "*" ? "*" : returning}`;
    const deleted = (await client.query(sql, params)).rows;
    if (request.single || request.maybeSingle) return { data: deleted[0] ?? null, count: deleted.length };
    return { data: deleted, count: deleted.length };
  }

  if (request.action === "upsert") {
    const rawRows = Array.isArray(request.data) ? request.data : [request.data ?? {}];
    if (!rawRows.length) return { data: [], count: 0 };
    const rows = rawRows.map((row) => applyActorDefaults(tableName, row ?? {}, userId));
    const columns = Object.keys(rows[0] ?? {}).filter((key) => ident.test(key));
    if (!columns.length) throw new Error("Nenhuma coluna para upsert.");
    alignRowColumns(rows, columns, userId);
    const conflict = (request.onConflict ?? "id")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!conflict.every((name) => ident.test(name))) throw new Error("onConflict inválido.");
    const valuesSql = rows.map((row) => {
      const placeholders = columns.map((column) =>
        pushColumnValue(params, tableName, column, row[column], userId),
      );
      return `(${placeholders.join(", ")})`;
    });
    const conflictSql = conflict.map(quoteIdent).join(", ");
    let onConflictSql: string;
    if (request.ignoreDuplicates) {
      onConflictSql = `ON CONFLICT (${conflictSql}) DO NOTHING`;
    } else {
      const updates = columns
        .filter((column) => !conflict.includes(column))
        .map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`);
      onConflictSql = `ON CONFLICT (${conflictSql}) DO UPDATE SET ${
        updates.length
          ? updates.join(", ")
          : `${quoteIdent(conflict[0])} = EXCLUDED.${quoteIdent(conflict[0])}`
      }`;
    }
    const sql = `INSERT INTO public.${table} (${columns.map(quoteIdent).join(", ")})
      VALUES ${valuesSql.join(", ")}
      ${onConflictSql}
      RETURNING ${returning === "*" ? "*" : returning}`;
    const upserted = (await client.query(sql, params)).rows;
    if (request.single || request.maybeSingle) return { data: upserted[0] ?? null, count: upserted.length };
    return { data: upserted, count: upserted.length };
  }

  throw new Error("Ação inválida.");
};
