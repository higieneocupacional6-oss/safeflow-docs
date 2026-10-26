#!/usr/bin/env node
/**
 * Assemble 20260414000000_bootstrap_complete_schema.sql from inventories.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tablesInv = fs.readFileSync(path.join(__dirname, '_bootstrap_inventory_tables.md'), 'utf8');
const migInv = fs.readFileSync(path.join(__dirname, '_bootstrap_inventory_migrations.md'), 'utf8');
const typesPath = path.join(__dirname, '../src/integrations/supabase/types.ts');
const typesSrc = fs.readFileSync(typesPath, 'utf8');

// --- Parse table names from tables inventory summary ---
const tableNames = [...tablesInv.matchAll(/^- ([a-z0-9_]+)$/gm)]
  .map(m => m[1])
  .filter((n, i, a) => a.indexOf(n) === i && !['Tables:', 'Functions', 'Enums:'].includes(n));
// Better: from "## Summary" section
const summaryMatch = tablesInv.match(/### Table names\n\n([\s\S]*?)\n\n---/);
const TABLES = summaryMatch
  ? summaryMatch[1].split('\n').map(l => l.replace(/^- /, '').trim()).filter(Boolean)
  : [];

console.error('Tables from inventory:', TABLES.length, TABLES.join(', '));

// --- Parse each table block from tables inventory ---
function parseTablesInventory(md) {
  const map = new Map();
  const parts = md.split(/\n## /).slice(1);
  for (const part of parts) {
    const name = part.match(/^([a-z0-9_]+)\n/)?.[1];
    if (!name || !TABLES.includes(name)) continue;
    const cols = [];
    const fks = [];
    const lines = part.split('\n');
    let inFk = false;
    for (const line of lines) {
      if (line.startsWith('FKs:')) {
        inFk = true;
        continue;
      }
      if (inFk) {
        const fm = line.match(/^- (\w+) -> ([.\w]+)\s+\(`([^`]+)`\)/);
        if (fm) fks.push({ column: fm[1], ref: fm[2], name: fm[3] });
        continue;
      }
      // - col: type ...
      const cm = line.match(/^- ([a-z0-9_]+): (.+?) \[required in Insert:/);
      if (cm) {
        cols.push({ name: cm[1], spec: cm[2].trim(), raw: line });
      }
    }
    map.set(name, { cols, fks });
  }
  return map;
}

const invTables = parseTablesInventory(tablesInv);

// --- Extract Relationships from types.ts for accurate FKs ---
function extractTypesTables(src) {
  const result = new Map();
  const norm = src.replace(/\r\n/g, '\n');
  const tablesStart = norm.indexOf('Tables: {');
  const viewsAt = norm.indexOf('Views: {', tablesStart);
  const tablesSection = norm.slice(tablesStart, viewsAt > 0 ? viewsAt : norm.length);

  const headers = [...tablesSection.matchAll(/^      ([a-z0-9_]+): \{/gm)];
  for (let i = 0; i < headers.length; i++) {
    const name = headers[i][1];
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : tablesSection.length;
    const chunk = tablesSection.slice(start, end);

    const rowM = chunk.match(/Row: \{([\s\S]*?)\n        \}/);
    const insertM = chunk.match(/Insert: \{([\s\S]*?)\n        \}/);
    if (!rowM) continue;

    const cols = [];
    for (const line of rowM[1].split('\n')) {
      const cm = line.match(/^\s+([a-z0-9_]+): (.+)$/);
      if (cm) cols.push({ name: cm[1], tsType: cm[2].replace(/;$/, '').trim() });
    }
    const insertOptional = new Set();
    const insertRequired = new Set();
    for (const line of (insertM?.[1] || '').split('\n')) {
      const cm = line.match(/^\s+([a-z0-9_]+)(\?)?: (.+)$/);
      if (cm) {
        if (cm[2]) insertOptional.add(cm[1]);
        else insertRequired.add(cm[1]);
      }
    }
    const fks = [];
    for (const rm of chunk.matchAll(
      /foreignKeyName:\s*"([^"]+)"[\s\S]*?columns:\s*\["([^"]+)"\][\s\S]*?referencedRelation:\s*"([^"]+)"[\s\S]*?referencedColumns:\s*\["([^"]+)"\]/g
    )) {
      fks.push({ name: rm[1], column: rm[2], refTable: rm[3], refColumn: rm[4] });
    }
    result.set(name, { cols, insertOptional, insertRequired, fks });
  }
  return result;
}

const typesTables = extractTypesTables(typesSrc);
console.error('Tables from types.ts:', typesTables.size);

// Enums from types
const enumMatch = typesSrc.match(/app_role:\s*"([^"]+)"\s*\|\s*"([^"]+)"/);
const APP_ROLE = enumMatch ? [enumMatch[1], enumMatch[2]] : ['admin', 'usuario'];

// --- Map TS type + inventory hints → SQL column def ---
function sqlTypeFor(colName, tsType, invSpec) {
  const t = tsType.replace(/\s*\|\s*null/, '').trim();
  const nullable = /\|\s*null/.test(tsType) || (invSpec && invSpec.includes('| null'));

  if (t === 'Database["public"]["Enums"]["app_role"]' || t.includes('app_role')) {
    return { sqlType: 'public.app_role', nullable };
  }
  if (t === 'Json' || t === 'Json | null' || invSpec?.includes('jsonb')) {
    return { sqlType: 'jsonb', nullable };
  }
  if (t === 'boolean') return { sqlType: 'boolean', nullable };
  if (t === 'number') {
    // hints from name / inv
    if (/row_version|current_step|ordem|quantidade|numero|qtd|prazo_meses|validade_meses|mes|ano|dia|percent|dose/i.test(colName)) {
      if (/dose|percent/i.test(colName)) return { sqlType: 'numeric', nullable };
      return { sqlType: 'integer', nullable };
    }
    if (/valor|limite|resultado_numerico|nivel|intensidade|amplitude|frequencia_hz|aceleracao/i.test(colName)) {
      return { sqlType: 'numeric', nullable };
    }
    if (invSpec?.includes('numeric')) return { sqlType: 'numeric', nullable };
    if (invSpec?.includes('integer')) return { sqlType: 'integer', nullable };
    return { sqlType: 'integer', nullable };
  }
  if (t === 'string[]' || t.startsWith('string[]')) return { sqlType: 'text[]', nullable };
  if (t === 'number[]') return { sqlType: 'integer[]', nullable };

  // string
  if (/_id$|_by$|^id$|user_id|empresa_id|contrato_id|documento_id|setor_id|funcao_id|avaliacao_id|risco_id|link_id|pasta_id|equipamento_id|resultado_id|parecer_id|template_id|aet_documento_id|aep_documento_id|pcmso|ficha_tecnica/.test(colName)) {
    // some are not uuid - check inventory
    if (invSpec?.includes('text') && !invSpec.includes('uuid')) return { sqlType: 'text', nullable };
    if (/token|path|nome|email|status|tipo|descricao|codigo|url|hash|slug|conteudo|texto|observ|instruc|cargo|crea|cnpj|telefone|endereco|cidade|estado|cep|rg|cpf|crm|crea|file_|bucket|mime|extensao|unidade|situacao|gfip|ges|tecnica|agente|fonte|medida|epi|epc|parecer|conclusao|metodologia|norma|referencia|ambito|escopo|fiscal|gestor|contrat|razao|fantasia|inscricao|atividade|cnae|grau|numero_doc|revisao|alteracao|responsavel|titulo|assunto|mensagem|corpo|resumo|indicador|fator|dimensao|categoria|classificacao|perfil|matriz|plano|acao|quando|onde|como|porque|quanto|quem|status_envio|publico|privado/.test(colName) && !/_id$|^id$|_by$/.test(colName)) {
      // fall through to text for non-id
    }
    if (/_id$|_by$|^id$/.test(colName) || colName === 'user_id') {
      return { sqlType: 'uuid', nullable };
    }
  }
  if (/_at$|changed_at|certificado_updated_at/.test(colName)) return { sqlType: 'timestamptz', nullable };
  if (/^data_|_data$|data_elaboracao|data_avaliacao|data_inicio|data_fim|data_validade|validade$|data_coleta|data_emissao|data_nascimento|inicio_vigencia|fim_vigencia/.test(colName) && !/_at$/.test(colName)) {
    return { sqlType: 'date', nullable };
  }
  return { sqlType: 'text', nullable };
}

function defaultFor(colName, sqlType, nullable, insertOptional, invSpec) {
  if (colName === 'id' && sqlType === 'uuid') return 'gen_random_uuid()';
  if (colName === 'created_at' || colName === 'updated_at' || colName === 'changed_at') return 'now()';
  if (colName === 'row_version') return '1';
  if (colName === 'current_step') return '0';
  if (colName === 'revisoes' && sqlType === 'jsonb') return "'[]'::jsonb";
  if (colName === 'setores' && sqlType === 'jsonb') return "'[]'::jsonb";
  if (sqlType === 'jsonb' && !nullable && insertOptional) {
    // common empty defaults
    if (/payload|snapshot|dados|conteudo|matriz|resultado|respostas|indicadores|grupos|secoes|config|meta|anotacoes|fotos|acoes|etapas|cronograma|formulario/.test(colName)) {
      return "'{}'::jsonb";
    }
    if (/revisoes|setores|itens|lista|arquivos|funcoes|ids/.test(colName)) return "'[]'::jsonb";
    return "'{}'::jsonb";
  }
  if (sqlType === 'boolean' && !nullable) {
    if (/ativo|ia_ativada|is_padrao|publico|publicado|respondido|anonimo/.test(colName)) {
      // check inv for default hints - ativo often true, is_padrao false
      if (colName === 'ativo') return 'true';
      if (colName === 'is_padrao') return 'false';
      if (colName === 'ia_ativada') return 'false';
      return 'false';
    }
  }
  if (sqlType === 'text' && !nullable && colName === 'status') return "'rascunho'";
  if (sqlType === 'text[]' && !nullable) return "'{}'::text[]";
  if (sqlType === 'integer' && !nullable && insertOptional && colName !== 'row_version' && colName !== 'current_step') {
    return null; // must have app-provided or explicit default from migrations
  }
  return null;
}

function notNull(colName, tsType, insertRequired, insertOptional, sqlType) {
  const tsNullable = /\|\s*null/.test(tsType);
  if (tsNullable) return false;
  // Row says non-null
  return true;
}

// --- Extract CREATE TABLE from migrations inventory ---
function extractSqlBlocks(md, headingPattern) {
  // Find #### `name` ... ```sql ... ```
  const blocks = new Map();
  const re = /#### `([^`]+)`\n\nSource: `([^`]+)`\n\n```sql\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) {
    blocks.set(m[1].replace(/^public\./, ''), { file: m[2], sql: m[3].trim() });
  }
  return blocks;
}

const createTableBlocks = extractSqlBlocks(
  migInv.slice(migInv.indexOf('## 2. CREATE TABLE'), migInv.indexOf('### ALTER TABLE only'))
);

// Extract functions from priority + all sections (latest already in inventory)
function extractFunctions(md) {
  const start = md.indexOf('### All functions');
  const end = md.indexOf('## 4. CREATE POLICY');
  const section = md.slice(start, end);
  const funcs = new Map();
  const re = /#### `([^`]+)`\n\n- Latest: `([^`]+)`(?:\n- Prior:[^\n]*)?\n\n```sql\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(section))) {
    funcs.set(m[1], { file: m[2], sql: m[3].trim() });
  }
  return funcs;
}

const functions = extractFunctions(migInv);
console.error('Functions:', functions.size, [...functions.keys()].join(' | '));

// Policies final
function extractPolicies(md) {
  const start = md.indexOf('## 4. CREATE POLICY');
  const end = md.indexOf('## 5. Storage buckets');
  const section = md.slice(start, end);
  const policies = [];
  const re = /#### Policy `([^`]+)`\n\nSource: `([^`]+)`\n\n```sql\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(section))) {
    // get table from preceding ### Table
    policies.push({ name: m[1], file: m[2], sql: m[3].trim() });
  }
  // Also parse with table context
  const byTable = [];
  const tableChunks = section.split(/### Table `/).slice(1);
  for (const chunk of tableChunks) {
    const table = chunk.match(/^([^`]+)`/)?.[1];
    const re2 = /#### Policy `([^`]+)`\n\nSource: `([^`]+)`\n\n```sql\n([\s\S]*?)```/g;
    let m2;
    while ((m2 = re2.exec(chunk))) {
      byTable.push({ table, name: m2[1], file: m2[2], sql: m2[3].trim() });
    }
  }
  return byTable;
}

const policies = extractPolicies(migInv);
console.error('Policies:', policies.length);

// Indexes
function extractNamedBlocks(md, sectionStart, sectionEnd) {
  const start = md.indexOf(sectionStart);
  const end = md.indexOf(sectionEnd, start + 1);
  const section = md.slice(start, end);
  const items = [];
  const re = /### `([^`]+)`\n\nSource: `([^`]+)`\n\n```sql\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(section))) {
    items.push({ name: m[1], file: m[2], sql: m[3].trim() });
  }
  return items;
}

const indexes = extractNamedBlocks(migInv, '## 7. CREATE INDEX', '## 8. CREATE TRIGGER');
const triggers = extractNamedBlocks(migInv, '## 8. CREATE TRIGGER', '## 9. CREATE SCHEMA');
const grants = (() => {
  const start = migInv.indexOf('## 10. GRANT');
  const end = migInv.indexOf('## Appendix');
  const section = migInv.slice(start, end);
  const items = [];
  const re = /Source: `([^`]+)`(?: \((GRANT|REVOKE)\))?\n\n```sql\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(section))) {
    // skip duplicate "All GRANT" vs functions - take all unique
    items.push({ file: m[1], sql: m[3].trim() });
  }
  // dedupe by sql
  const seen = new Set();
  return items.filter(i => {
    if (seen.has(i.sql)) return false;
    seen.add(i.sql);
    return true;
  });
})();

console.error('Indexes', indexes.length, 'Triggers', triggers.length, 'Grants', grants.length);

// Storage policies
const storagePolicies = policies.filter(p => p.table === 'storage.objects');
const tablePolicies = policies.filter(p => p.table !== 'storage.objects');

// Tables to skip (in migrations but not types)
const SKIP_TABLES = new Set([
  'exames_catalogo',
  'esocial_exames',
  'pcmso_setor_exames',
]);

// --- Build CREATE TABLE from types ---
function buildCreateTable(name, info) {
  const inv = invTables.get(name);
  const lines = [];
  const pkCols = [];

  for (const col of info.cols) {
    const invCol = inv?.cols.find(c => c.name === col.name);
    const { sqlType, nullable: hintNull } = sqlTypeFor(col.name, col.tsType, invCol?.spec);
    const isNull = /\|\s*null/.test(col.tsType);
    const nn = !isNull;
    let def = defaultFor(col.name, sqlType, !nn, info.insertOptional.has(col.name), invCol?.spec);

    // Special cases from migrations / inventory
    if (name === 'aet_instrucoes_usuario' && col.name === 'user_id') {
      // PK is user_id
    }
    if (col.name === 'id' && sqlType === 'uuid') {
      pkCols.push('id');
    }

    // Override ambiguous types from migration CREATE if available
    let type = sqlType;
    // row_version: migrations use bigint
    if (col.name === 'row_version') type = 'bigint';
    if (col.name === 'revisoes' && type === 'jsonb') def = def || "'[]'::jsonb";
    if (col.name === 'setores' && type === 'jsonb' && nn) def = def || "'[]'::jsonb";
    if (col.name === 'status' && type === 'text' && nn && !def) def = "'rascunho'";
    if (col.name === 'current_step' && type === 'integer') def = '0';
    if (col.name === 'ativo' && type === 'boolean' && nn) def = def ?? 'true';
    if (col.name === 'is_padrao' && type === 'boolean') def = def ?? 'false';
    if (col.name === 'ia_ativada' && type === 'boolean') def = def ?? 'false';
    if (col.name === 'instrucoes' && type === 'text' && nn) def = def ?? "''";

    // jsonb NOT NULL without default - ensure default
    if (type === 'jsonb' && nn && !def) {
      def = /revisoes|setores|lista|itens|ids|funcoes|grupos|arquivos|fotos|acoes/.test(col.name)
        ? "'[]'::jsonb"
        : "'{}'::jsonb";
    }

    let line = `  ${col.name} ${type}`;
    if (nn) line += ' NOT NULL';
    if (def) line += ` DEFAULT ${def}`;
    lines.push(line);
  }

  // Primary key
  if (name === 'aet_instrucoes_usuario') {
    lines.push('  PRIMARY KEY (user_id)');
  } else if (pkCols.includes('id')) {
    lines.push('  PRIMARY KEY (id)');
  } else if (info.cols.some(c => c.name === 'id')) {
    lines.push('  PRIMARY KEY (id)');
  }

  return `CREATE TABLE IF NOT EXISTS public.${name} (\n${lines.join(',\n')}\n);`;
}

// Topological sort by FKs
function sortTables(names, typesMap) {
  const pending = new Set(names);
  const ordered = [];
  const inDeg = new Map();
  const deps = new Map();
  for (const n of names) {
    const info = typesMap.get(n);
    const d = new Set();
    for (const fk of info?.fks || []) {
      if (fk.refTable !== n && names.includes(fk.refTable)) d.add(fk.refTable);
    }
    deps.set(n, d);
    inDeg.set(n, d.size);
  }
  // Kahn
  while (ordered.length < names.length) {
    const ready = [...pending].filter(n => inDeg.get(n) === 0).sort();
    if (!ready.length) {
      // cycle or missing - append rest
      const rest = [...pending].sort();
      console.error('FK cycle/missing deps, appending:', rest.join(', '));
      ordered.push(...rest);
      break;
    }
    for (const n of ready) {
      ordered.push(n);
      pending.delete(n);
      for (const m of pending) {
        if (deps.get(m).has(n)) inDeg.set(m, inDeg.get(m) - 1);
      }
    }
  }
  return ordered;
}

const orderedTables = sortTables(TABLES, typesTables);
console.error('Order:', orderedTables.join(' → '));

// Merge migration CREATE defaults/constraints when helpful - prefer types for columns
// Apply known bigint for row_version from migrations
// Apply CHECK constraints from migration ALTER history where critical

// --- Extract auth.users trigger from migrations ---
const handleNewUserTrigger = triggers.find(t => /on_auth_user_created|handle_new_user/i.test(t.sql + t.name));
const allTriggersFiltered = triggers.filter(t => {
  // skip if table not in TYPES (except auth.users)
  const tm = t.sql.match(/ON\s+(?:TABLE\s+)?([a-z0-9_.]+)/i);
  if (!tm) return true;
  const tbl = tm[1].replace(/"/g, '');
  if (tbl.startsWith('auth.')) return true;
  const short = tbl.replace(/^public\./, '');
  if (SKIP_TABLES.has(short)) return false;
  if (short === 'storage.objects') return true;
  return TABLES.includes(short) || tbl.startsWith('public.');
});

const indexesFiltered = indexes.filter(idx => {
  const tm = idx.sql.match(/ON\s+([a-z0-9_.]+)/i);
  if (!tm) return true;
  const short = tm[1].replace(/^public\./, '').replace(/"/g, '');
  if (SKIP_TABLES.has(short)) return false;
  return true;
});

// Policies: only for tables in TYPES + storage
const policiesFiltered = tablePolicies.filter(p => {
  const short = p.table.replace(/^public\./, '');
  if (SKIP_TABLES.has(short)) return false;
  return TABLES.includes(short);
});

// --- Refine column types from migration CREATE SQL when available ---
function parseCreateColumns(sql) {
  const cols = new Map();
  const body = sql.match(/\(([\s\S]*)\)\s*;?\s*$/)?.[1];
  if (!body) return cols;
  // split by comma at depth 0
  let depth = 0;
  let cur = '';
  const parts = [];
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  for (const p of parts) {
    if (/^(PRIMARY|UNIQUE|CONSTRAINT|CHECK|FOREIGN)/i.test(p)) continue;
    const m = p.match(/^([a-z0-9_]+)\s+(.+)$/i);
    if (m) cols.set(m[1], m[2].trim());
  }
  return cols;
}

function buildCreateTableMerged(name, info) {
  const mig = createTableBlocks.get(name) || createTableBlocks.get(`public.${name}`);
  const migCols = mig ? parseCreateColumns(mig.sql) : new Map();
  const inv = invTables.get(name);
  const lines = [];

  for (const col of info.cols) {
    const invCol = inv?.cols.find(c => c.name === col.name);
    let { sqlType } = sqlTypeFor(col.name, col.tsType, invCol?.spec);
    const isNull = /\|\s*null/.test(col.tsType);
    const nn = !isNull;

    // Prefer migration type if present for this column
    if (migCols.has(col.name)) {
      const migDef = migCols.get(col.name);
      // extract type (first tokens until NOT NULL/DEFAULT/REFERENCES/UNIQUE/PRIMARY/CHECK)
      const typeMatch = migDef.match(/^((?:[a-zA-Z_][\w.]*(?:\([^)]*\))?|double precision|timestamp with time zone|timestamp without time zone|character varying(?:\([^)]*\))?)(?:\s*\[\])?)/i);
      if (typeMatch) {
        let mt = typeMatch[1]
          .replace(/timestamp with time zone/i, 'timestamptz')
          .replace(/timestamp without time zone/i, 'timestamp')
          .replace(/character varying/i, 'text')
          .replace(/double precision/i, 'double precision');
        // normalize
        if (/^timestamp$/i.test(mt)) mt = 'timestamptz';
        sqlType = mt;
      }
    }

    // Forced overrides matching types + migrations evolution
    if (col.name === 'row_version') sqlType = 'bigint';
    if (col.name === 'last_modified_by') sqlType = 'uuid';

    let def = defaultFor(col.name, sqlType, !nn, info.insertOptional.has(col.name), invCol?.spec);

    // Pull DEFAULT from migration if present
    if (migCols.has(col.name)) {
      const dm = migCols.get(col.name).match(/DEFAULT\s+((?:'[^']*'::[\w\s]+|'[^']*'|[^\s,]+(?:\([^)]*\))?))/i);
      if (dm) def = dm[1];
    }

    if (col.name === 'row_version') def = '1';
    if (col.name === 'current_step' && /int/i.test(sqlType)) def = def || '0';
    if (col.name === 'revisoes') {
      sqlType = 'jsonb';
      if (nn) def = def || "'[]'::jsonb";
    }
    if (col.name === 'setores' && sqlType === 'jsonb' && nn) def = def || "'[]'::jsonb";
    if (col.name === 'status' && nn && !def) def = "'rascunho'";
    if (col.name === 'id' && /uuid/i.test(sqlType)) def = def || 'gen_random_uuid()';
    if ((col.name === 'created_at' || col.name === 'updated_at') && !def) def = 'now()';
    if (col.name === 'changed_at' && !def) def = 'now()';
    if (sqlType === 'jsonb' && nn && !def) {
      def = /revisoes|setores|lista|itens|ids|funcoes|grupos|arquivos|fotos|acoes/.test(col.name)
        ? "'[]'::jsonb"
        : "'{}'::jsonb";
    }
    if (col.name === 'ativo' && /bool/i.test(sqlType) && nn && def == null) def = 'true';
    if (col.name === 'is_padrao' && /bool/i.test(sqlType) && def == null) def = 'false';
    if (col.name === 'ia_ativada' && /bool/i.test(sqlType) && def == null) def = 'false';
    if (col.name === 'instrucoes' && nn && def == null) def = "''";
    if (col.name === 'role' && sqlType.includes('app_role') && def == null) def = "'usuario'::public.app_role";

    // text[] defaults
    if (sqlType === 'text[]' && nn && !def) def = "'{}'::text[]";

    let line = `  ${col.name} ${sqlType}`;
    if (nn) line += ' NOT NULL';
    if (def) line += ` DEFAULT ${def}`;
    lines.push(line);
  }

  if (name === 'aet_instrucoes_usuario') {
    lines.push('  PRIMARY KEY (user_id)');
  } else if (info.cols.some(c => c.name === 'id')) {
    lines.push('  PRIMARY KEY (id)');
  }

  return `CREATE TABLE IF NOT EXISTS public.${name} (\n${lines.join(',\n')}\n);`;
}

// FK statements after all tables
function buildForeignKeys() {
  const stmts = [];
  for (const name of TABLES) {
    const info = typesTables.get(name);
    if (!info) continue;
    for (const fk of info.fks) {
      // ON DELETE from migrations when known - default mostly SET NULL or CASCADE
      let onDelete = '';
      // Heuristics from AGENTS / migrations
      if (/setor_id/.test(fk.column) && name === 'ltcat_avaliacoes') onDelete = ' ON DELETE CASCADE';
      else if (/funcao_id/.test(fk.column) && name === 'ltcat_avaliacoes') onDelete = ' ON DELETE SET NULL';
      else if (fk.refTable === 'empresas' && /empresa_id/.test(fk.column)) onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'documentos') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'ltcat_avaliacoes') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'contratos') onDelete = ' ON DELETE SET NULL';
      else if (fk.refTable === 'riscos' && name === 'epi_epc_riscos') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'epi_epc' && name === 'epi_epc_riscos') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'ia_conhecimento_pastas') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'psico_avaliacoes') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'psico_links') onDelete = ' ON DELETE CASCADE';
      else if (fk.refTable === 'equipamentos_ho') onDelete = ' ON DELETE CASCADE';

      stmts.push(
        `ALTER TABLE public.${name}\n  DROP CONSTRAINT IF EXISTS ${fk.name};\nALTER TABLE public.${name}\n  ADD CONSTRAINT ${fk.name} FOREIGN KEY (${fk.column}) REFERENCES public.${fk.refTable}(${fk.refColumn})${onDelete};`
      );
    }
  }
  return stmts;
}

// --- Assemble SQL ---
const out = [];
const L = (s = '') => out.push(s);

L(`-- =============================================================================`);
L(`-- BOOTSTRAP: complete empty SafeFlow schema (Postgres 17 / Supabase)`);
L(`-- Generated for fresh projects. See ../BOOTSTRAP_NOTES.md`);
L(`-- Timestamp prefix 20260414000000 places this before historical migrations.`);
L(`-- =============================================================================`);
L();
L(`-- gen_random_uuid() is provided by Supabase (pgcrypto / pg_catalog)`);
L();
L(`CREATE SCHEMA IF NOT EXISTS private;`);
L(`REVOKE ALL ON SCHEMA private FROM PUBLIC;`);
L(`GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;`);
L();
L(`-- Enum`);
L(`DO $$ BEGIN`);
L(`  CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');`);
L(`EXCEPTION WHEN duplicate_object THEN NULL;`);
L(`END $$;`);
L();

function emitFunctions(keys) {
  for (const key of keys) {
    const f = functions.get(key);
    if (!f) {
      console.error('Missing function:', key);
      continue;
    }
    L(`-- ${key} (from ${f.file})`);
    L(f.sql.endsWith(';') ? f.sql : f.sql + ';');
    L();
  }
}

const allFuncOrder = [
  'public.update_updated_at_column()',
  'private.has_role(uuid, app_role)',
  'public.has_role(uuid, app_role)',
  'public.handle_new_user()',
  'private.psico_get_public_link(text)',
  'public.psico_get_public_link(text)',
  'private.psico_submit_resposta(text, jsonb)',
  'public.psico_submit_resposta(text, jsonb)',
  'public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb)',
  'public.update_shared_record(text, uuid, bigint, jsonb)',
  'public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb)',
  'public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text)',
  'public.validate_ficha_tecnica_resultado()',
  'public.preserve_ficha_tecnica_origin()',
  'public.track_shared_change()',
  'public.set_documento_validade()',
  'public.link_ergonomia_to_aet()',
];

L(`-- Shared updated_at helper (no table deps)`);
emitFunctions(['public.update_updated_at_column()']);

L(`-- =============================================================================`);
L(`-- TABLES (${orderedTables.length})`);
L(`-- =============================================================================`);
L();

for (const name of orderedTables) {
  const info = typesTables.get(name);
  if (!info) {
    console.error('MISSING in types.ts:', name);
    continue;
  }
  L(`-- ${name}`);
  L(buildCreateTableMerged(name, info));
  L();
}

L(`-- =============================================================================`);
L(`-- FOREIGN KEYS`);
L(`-- =============================================================================`);
L();
for (const stmt of buildForeignKeys()) {
  L(stmt);
  L();
}

L(`-- =============================================================================`);
L(`-- FUNCTIONS (after tables; before RLS policies / triggers)`);
L(`-- =============================================================================`);
L();
emitFunctions(allFuncOrder.filter(k => k !== 'public.update_updated_at_column()'));
for (const [key, f] of functions) {
  if (allFuncOrder.includes(key)) continue;
  L(`-- ${key} (from ${f.file})`);
  L(f.sql.endsWith(';') ? f.sql : f.sql + ';');
  L();
}

L(`-- =============================================================================`);
L(`-- ROW LEVEL SECURITY`);
L(`-- =============================================================================`);
L();
for (const name of orderedTables) {
  L(`ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;`);
}
L();

L(`-- =============================================================================`);
L(`-- RLS POLICIES (final authenticated patterns)`);
L(`-- =============================================================================`);
L();
for (const p of policiesFiltered) {
  L(`-- ${p.table} / ${p.name}`);
  L(p.sql.endsWith(';') ? p.sql : p.sql + ';');
  L();
}

L(`-- =============================================================================`);
L(`-- STORAGE BUCKETS`);
L(`-- =============================================================================`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('templates', 'templates', true)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('aet-imagens', 'aet-imagens', false)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('documentos-upload', 'documentos-upload', false)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('certificados-calibracao', 'certificados-calibracao', false)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('ergonomia-relatorios', 'ergonomia-relatorios', false)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('ia-conhecimento', 'ia-conhecimento', false)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();
L(`INSERT INTO storage.buckets (id, name, public)`);
L(`VALUES ('psico-base-tecnica', 'psico-base-tecnica', false)`);
L(`ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;`);
L();

L(`-- =============================================================================`);
L(`-- STORAGE POLICIES`);
L(`-- =============================================================================`);
L();
for (const p of storagePolicies) {
  L(`-- ${p.name}`);
  L(p.sql.endsWith(';') ? p.sql : p.sql + ';');
  L();
}

L(`-- =============================================================================`);
L(`-- INDEXES`);
L(`-- =============================================================================`);
L();
for (const idx of indexesFiltered) {
  // Ensure IF NOT EXISTS
  let sql = idx.sql;
  if (!/IF NOT EXISTS/i.test(sql)) {
    sql = sql.replace(/CREATE\s+(UNIQUE\s+)?INDEX\s+/i, (m, u) => `CREATE ${u || ''}INDEX IF NOT EXISTS `);
  }
  // Fix update_modified_column references if any (indexes shouldn't have that)
  L(sql.endsWith(';') ? sql : sql + ';');
  L();
}

L(`-- =============================================================================`);
L(`-- TRIGGERS`);
L(`-- =============================================================================`);
L();
for (const tr of allTriggersFiltered) {
  let sql = tr.sql
    .replace(/update_modified_column/gi, 'update_updated_at_column')
    .replace(/EXECUTE\s+PROCEDURE/gi, 'EXECUTE FUNCTION');
  // Drop + create for idempotency on trigger names
  const nameMatch = sql.match(/TRIGGER\s+([a-z0-9_]+)/i);
  const onMatch = sql.match(/ON\s+([a-z0-9_.]+)/i);
  if (nameMatch && onMatch) {
    L(`DROP TRIGGER IF EXISTS ${nameMatch[1]} ON ${onMatch[1]};`);
  }
  L(sql.endsWith(';') ? sql : sql + ';');
  L();
}

L(`-- =============================================================================`);
L(`-- GRANTS / REVOKES (latest security posture)`);
L(`-- =============================================================================`);
L();
// Prefer later security migration grants - emit unique statements
// Filter to function grants/revokes mostly
for (const g of grants) {
  // Skip grants on skipped tables if any
  if (/exames_catalogo|esocial_exames|pcmso_setor_exames/.test(g.sql)) continue;
  L(g.sql.endsWith(';') ? g.sql : g.sql + ';');
  L();
}

L(`-- =============================================================================`);
L(`-- END BOOTSTRAP`);
L(`-- =============================================================================`);

const outPath = path.join(__dirname, 'migrations', '20260414000000_bootstrap_complete_schema.sql');
const sqlText = out.join('\n');
fs.writeFileSync(outPath, sqlText, 'utf8');

// Verify all 47 tables
const missing = TABLES.filter(t => !sqlText.includes(`CREATE TABLE IF NOT EXISTS public.${t}`));
const created = TABLES.filter(t => sqlText.includes(`CREATE TABLE IF NOT EXISTS public.${t}`));

const summary = {
  outPath,
  bytes: sqlText.length,
  tablesExpected: TABLES.length,
  tablesCreated: created.length,
  missing,
  functions: [...functions.keys()],
  policies: policiesFiltered.length,
  storagePolicies: storagePolicies.length,
  indexes: indexesFiltered.length,
  triggers: allTriggersFiltered.length,
  grants: grants.length,
  buckets: [
    'templates',
    'aet-imagens',
    'documentos-upload',
    'certificados-calibracao',
    'ergonomia-relatorios',
    'ia-conhecimento',
    'psico-base-tecnica',
  ],
};
console.log(JSON.stringify(summary, null, 2));
