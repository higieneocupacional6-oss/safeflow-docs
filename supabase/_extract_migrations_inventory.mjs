#!/usr/bin/env node
/**
 * One-shot extractor: scan supabase/migrations/*.sql → structured inventory MD.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migDir = path.join(__dirname, 'migrations');
const outPath = path.join(__dirname, '_bootstrap_inventory_migrations.md');

const files = fs.readdirSync(migDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

function stripComments(sql) {
  // Keep line structure; remove -- comments and /* */ blocks carefully
  let out = '';
  let i = 0;
  let inLine = false;
  let inBlock = false;
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;
  while (i < sql.length) {
    const c = sql[i];
    const n = sql[i + 1];

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        out += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      out += c;
      i++;
      continue;
    }

    if (inLine) {
      if (c === '\n') {
        inLine = false;
        out += c;
      }
      i++;
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') {
        inBlock = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (inSingle) {
      out += c;
      if (c === "'" && n === "'") {
        out += n;
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      out += c;
      if (c === '"') inDouble = false;
      i++;
      continue;
    }

    // dollar quote start
    if (c === '$') {
      const m = sql.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (m) {
        dollarTag = m[0];
        out += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (c === '-' && n === '-') {
      inLine = true;
      i += 2;
      continue;
    }
    if (c === '/' && n === '*') {
      inBlock = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      out += c;
      i++;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      out += c;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Split SQL into statements, respecting dollar-quotes and strings */
function splitStatements(sql) {
  const stmts = [];
  let cur = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;

  while (i < sql.length) {
    const c = sql[i];
    const n = sql[i + 1];

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        cur += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      cur += c;
      i++;
      continue;
    }

    if (inSingle) {
      cur += c;
      if (c === "'" && n === "'") {
        cur += n;
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      cur += c;
      if (c === '"') inDouble = false;
      i++;
      continue;
    }

    if (c === '$') {
      const m = sql.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (m) {
        dollarTag = m[0];
        cur += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (c === "'") {
      inSingle = true;
      cur += c;
      i++;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      cur += c;
      i++;
      continue;
    }

    if (c === ';') {
      cur += c;
      const t = cur.trim();
      if (t && t !== ';') stmts.push(t);
      cur = '';
      i++;
      continue;
    }

    cur += c;
    i++;
  }
  const t = cur.trim();
  if (t) stmts.push(t);
  return stmts;
}

function normalizeWs(s) {
  return s.replace(/\r\n/g, '\n').trim();
}

function matchCreateType(stmt) {
  const m = stmt.match(/^CREATE\s+TYPE\s+([^\s]+)/i);
  return m ? { name: m[1].replace(/"/g, ''), sql: stmt } : null;
}

function matchCreateTable(stmt) {
  const m = stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
  return m ? { name: m[1].replace(/"/g, ''), sql: stmt } : null;
}

function matchAlterTable(stmt) {
  const m = stmt.match(/^ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([^\s]+)/i);
  if (!m) return null;
  const name = m[1].replace(/"/g, '');
  const cols = [];
  const re = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][\w]*)/gi;
  let cm;
  while ((cm = re.exec(stmt))) cols.push(cm[1]);
  return { name, sql: stmt, addColumns: cols };
}

function matchCreateFunction(stmt) {
  const m = stmt.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([^\s(]+)\s*\(/i);
  if (!m) return null;
  const name = m[1].replace(/"/g, '');
  // signature args until matching ) before RETURNS/LANGUAGE/AS
  const open = stmt.indexOf('(');
  let depth = 0;
  let endArgs = -1;
  let inSingle = false;
  let dollarTag = null;
  for (let i = open; i < stmt.length; i++) {
    const c = stmt[i];
    if (dollarTag) {
      if (stmt.startsWith(dollarTag, i)) {
        i += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }
    if (inSingle) {
      if (c === "'" && stmt[i + 1] === "'") {
        i++;
        continue;
      }
      if (c === "'") inSingle = false;
      continue;
    }
    if (c === '$') {
      const dm = stmt.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (dm) {
        dollarTag = dm[0];
        i += dollarTag.length - 1;
        continue;
      }
    }
    if (c === "'") {
      inSingle = true;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) {
        endArgs = i;
        break;
      }
    }
  }
  const args = endArgs > open ? stmt.slice(open + 1, endArgs) : '';
  const argTypes = args
    .split(',')
    .map(a => a.trim())
    .filter(Boolean)
    .map(a => {
      // strip DEFAULT ...
      const noDef = a.replace(/\s+DEFAULT\s+.+$/i, '').trim();
      const parts = noDef.split(/\s+/);
      let typ;
      // name type [mode]
      if (/^(IN|OUT|INOUT|VARIADIC)$/i.test(parts[0])) {
        typ = parts.slice(2).join(' ') || parts[1];
      } else if (parts.length >= 2) {
        typ = parts.slice(1).join(' ');
      } else {
        typ = parts[0];
      }
      // normalize for stable signature keys across migrations
      return String(typ || '')
        .replace(/"/g, '')
        .replace(/\bpublic\./gi, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    })
    .join(', ');
  const nameNorm = name.replace(/"/g, '');
  const key = `${nameNorm}(${argTypes})`;
  return { name: nameNorm, key, argTypes, sql: stmt };
}

function matchCreatePolicy(stmt) {
  // Quoted names may contain spaces: CREATE POLICY "Authenticated can view X" ON ...
  const m = stmt.match(/^CREATE\s+POLICY\s+(?:"([^"]+)"|([^\s]+))\s+ON\s+([^\s(]+)/i);
  if (!m) return null;
  return { policyName: m[1] || m[2], table: m[3].replace(/"/g, ''), sql: stmt };
}

function matchDropPolicy(stmt) {
  const m = stmt.match(/^DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:"([^"]+)"|([^\s]+))\s+ON\s+([^\s;]+)/i);
  if (!m) return null;
  return { policyName: m[1] || m[2], table: m[3].replace(/"/g, ''), sql: stmt };
}

function matchInsertBucket(stmt) {
  if (!/INSERT\s+INTO\s+storage\.buckets/i.test(stmt)) return null;
  return { sql: stmt };
}

function matchCreateIndex(stmt) {
  const m = stmt.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s]+)/i);
  return m ? { name: m[1].replace(/"/g, ''), sql: stmt } : null;
}

function matchCreateTrigger(stmt) {
  const m = stmt.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([^\s]+)/i);
  return m ? { name: m[1].replace(/"/g, ''), sql: stmt } : null;
}

function matchCreateSchema(stmt) {
  const m = stmt.match(/^CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s;]+)/i);
  return m ? { name: m[1].replace(/"/g, ''), sql: stmt } : null;
}

function matchGrantRevoke(stmt) {
  if (/^(GRANT|REVOKE)\b/i.test(stmt) && /FUNCTION|PROCEDURE|TABLE|SEQUENCE|SCHEMA|ALL\s+PRIVILEGES/i.test(stmt)) {
    return { sql: stmt, kind: /^(GRANT)/i.test(stmt) ? 'GRANT' : 'REVOKE' };
  }
  return null;
}

function matchEnableRls(stmt) {
  const m = stmt.match(/^ALTER\s+TABLE\s+([^\s]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  return m ? { table: m[1].replace(/"/g, ''), sql: stmt } : null;
}

// Collections
const types = new Map(); // name -> {sql, file}
const tablesCreate = new Map();
const altersByTable = new Map(); // name -> [{file, sql, addColumns}]
const functionsLatest = new Map(); // key -> {name, sql, file, history:[]}
const policies = new Map(); // `${table}::${policy}` -> {sql, file, table, policyName}
const policyHistory = [];
const droppedPolicies = [];
const buckets = [];
const storagePolicies = [];
const indexes = new Map();
const triggers = new Map();
const schemas = [];
const grants = [];
const rlsEnabled = [];
const referencedTables = new Set();
const allStmtsByFile = [];

const interestingMissing = [
  'equipamentos_ho',
  'tecnicas_amostragem',
  'unidades',
  'ltcat_avaliacoes',
  'riscos',
  'empresas',
  'documentos',
  'contratos',
  'setores',
  'funcoes',
  'profiles',
  'user_roles',
];

for (const file of files) {
  const raw = fs.readFileSync(path.join(migDir, file), 'utf8');
  const cleaned = stripComments(raw);
  const stmts = splitStatements(cleaned).map(normalizeWs);

  for (const stmt of stmts) {
    const ct = matchCreateType(stmt);
    if (ct) {
      types.set(ct.name, { sql: ct.sql, file });
      continue;
    }
    const ctab = matchCreateTable(stmt);
    if (ctab) {
      tablesCreate.set(ctab.name, { sql: ctab.sql, file });
      referencedTables.add(ctab.name.replace(/^public\./, ''));
      continue;
    }
    const alt = matchAlterTable(stmt);
    if (alt) {
      const short = alt.name.replace(/^public\./, '');
      referencedTables.add(short);
      if (!altersByTable.has(short)) altersByTable.set(short, []);
      altersByTable.get(short).push({ file, sql: alt.sql, addColumns: alt.addColumns });
      const rls = matchEnableRls(stmt);
      if (rls) rlsEnabled.push({ ...rls, file });
      continue;
    }
    const fn = matchCreateFunction(stmt);
    if (fn) {
      const prev = functionsLatest.get(fn.key);
      const hist = prev ? [...prev.history, prev.file] : [];
      functionsLatest.set(fn.key, { name: fn.name, key: fn.key, argTypes: fn.argTypes, sql: fn.sql, file, history: hist });
      continue;
    }
    const pol = matchCreatePolicy(stmt);
    if (pol) {
      const key = `${pol.table}::${pol.policyName}`;
      const entry = { ...pol, file };
      policies.set(key, entry);
      policyHistory.push(entry);
      if (/^storage\.objects$/i.test(pol.table) || pol.table === 'storage.objects') {
        storagePolicies.push(entry);
      }
      continue;
    }
    const dpol = matchDropPolicy(stmt);
    if (dpol) {
      droppedPolicies.push({ ...dpol, file });
      // Remove from current policies map so FINAL set reflects drops
      policies.delete(`${dpol.table}::${dpol.policyName}`);
      continue;
    }
    const bucket = matchInsertBucket(stmt);
    if (bucket) {
      buckets.push({ sql: bucket.sql, file });
      continue;
    }
    const idx = matchCreateIndex(stmt);
    if (idx) {
      indexes.set(idx.name, { sql: idx.sql, file });
      continue;
    }
    const trg = matchCreateTrigger(stmt);
    if (trg) {
      triggers.set(trg.name, { sql: trg.sql, file });
      continue;
    }
    const sch = matchCreateSchema(stmt);
    if (sch) {
      schemas.push({ ...sch, file });
      continue;
    }
    const gr = matchGrantRevoke(stmt);
    if (gr) {
      grants.push({ ...gr, file });
      continue;
    }
  }
}

// Extract bucket names from INSERT + policy bucket_id references
const bucketNamesFromInsert = new Set();
const bucketNamesFromPolicies = new Set();
for (const b of buckets) {
  const m = b.sql.match(/VALUES\s*\(\s*'([^']+)'/i);
  if (m) bucketNamesFromInsert.add(m[1]);
  // multi-line VALUES ('id', 'name', ...)
  for (const x of b.sql.matchAll(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/gi)) {
    bucketNamesFromInsert.add(x[1]);
  }
}
for (const p of [...policies.values(), ...policyHistory]) {
  for (const x of p.sql.matchAll(/bucket_id\s*=\s*'([^']+)'/gi)) {
    bucketNamesFromPolicies.add(x[1]);
  }
}
const bucketNames = new Set([...bucketNamesFromInsert, ...bucketNamesFromPolicies]);
const bucketsMissingInsert = [...bucketNamesFromPolicies].filter(n => !bucketNamesFromInsert.has(n)).sort();

// Tables ALTER'd but never CREATE'd
const createdShort = new Set([...tablesCreate.keys()].map(k => k.replace(/^public\./, '')));
const alterOnly = [...altersByTable.keys()].filter(t => !createdShort.has(t) && !t.startsWith('storage.'));

// Prefer storage policies that remain after drops (already in policies map)
const finalStoragePolicies = [...policies.values()].filter(p =>
  /^storage\.objects$/i.test(p.table) || p.table === 'storage.objects'
);

// Group functions by short name for "latest" highlight of known RPCs
const priorityFns = [
  'has_role',
  'psico_get_public_link',
  'psico_submit_resposta',
  'sync_ltcat_avaliacoes',
  'update_shared_record',
  'save_ltcat_documento_v2',
  'import_ficha_tecnica_resultados',
  'update_updated_at_column',
  'handle_new_user',
  'track_shared_change',
  'validate_ficha_tecnica_resultado',
  'preserve_ficha_tecnica_origin',
  'set_documento_validade',
  'link_ergonomia_to_aet',
];

function shortName(full) {
  return full.replace(/^public\./, '').split('.').pop();
}

function mdFence(sql) {
  return '```sql\n' + sql + '\n```';
}

function section(title, body) {
  return `## ${title}\n\n${body}\n`;
}

let md = '';
md += `# Supabase migrations bootstrap inventory\n\n`;
md += `Generated from \`${files.length}\` files in \`supabase/migrations/\`.\n\n`;
md += `**Counts:**\n`;
md += `- CREATE TYPE / enums: **${types.size}**\n`;
md += `- CREATE TABLE: **${tablesCreate.size}**\n`;
md += `- Tables ALTER'd but never CREATE'd in migrations: **${alterOnly.length}**\n`;
md += `- Functions (distinct signatures, latest body): **${functionsLatest.size}**\n`;
md += `- Policies (final, after DROP POLICY): **${policies.size}**\n`;
md += `- Storage buckets (INSERT): **${buckets.length}** statements / **${bucketNamesFromInsert.size}** names inserted\n`;
md += `- Storage bucket names (INSERT + policy refs): **${bucketNames.size}**\n`;
md += `- Storage object policies (final): **${finalStoragePolicies.length}**\n`;
md += `- Indexes: **${indexes.size}**\n`;
md += `- Triggers: **${triggers.size}**\n`;
md += `- Schemas: **${schemas.length}**\n`;
md += `- GRANT/REVOKE: **${grants.length}**\n\n`;
md += `Migration files (chronological):\n\n`;
for (const f of files) md += `- \`${f}\`\n`;
md += `\n---\n\n`;

// 1. Types
{
  let body = '';
  if (!types.size) body = '_None found._\n';
  for (const [name, v] of [...types.entries()].sort()) {
    body += `### \`${name}\`\n\nSource: \`${v.file}\`\n\n${mdFence(v.sql)}\n\n`;
  }
  md += section('1. CREATE TYPE / enums', body);
}

// 2. Tables
{
  let body = '';
  body += `### CREATE TABLE (${tablesCreate.size})\n\n`;
  for (const [name, v] of [...tablesCreate.entries()].sort()) {
    body += `#### \`${name}\`\n\nSource: \`${v.file}\`\n\n${mdFence(v.sql)}\n\n`;
  }
  body += `### ALTER TABLE only — never CREATE TABLE in migrations (${alterOnly.length})\n\n`;
  body += `These tables are referenced via ALTER (and possibly policies/functions) but have no \`CREATE TABLE\` in this migrations folder.\n\n`;
  for (const t of alterOnly.sort()) {
    const alts = altersByTable.get(t) || [];
    const cols = [...new Set(alts.flatMap(a => a.addColumns))];
    body += `#### \`${t}\`\n\n`;
    body += `- ALTER statements: ${alts.length}\n`;
    if (cols.length) body += `- Columns added via ADD COLUMN: ${cols.map(c => `\`${c}\``).join(', ')}\n`;
    body += `\nEvolution:\n\n`;
    for (const a of alts) {
      body += `<details><summary>${a.file}</summary>\n\n${mdFence(a.sql)}\n\n</details>\n\n`;
    }
  }

  body += `### Highlighted table column evolution (requested)\n\n`;
  for (const t of interestingMissing) {
    const created = [...tablesCreate.keys()].find(k => k.replace(/^public\./, '') === t);
    const alts = altersByTable.get(t) || [];
    body += `#### \`${t}\`\n\n`;
    if (created) {
      body += `- CREATE TABLE in: \`${tablesCreate.get(created).file}\`\n`;
    } else {
      body += `- **No CREATE TABLE** in migrations\n`;
    }
    if (alts.length) {
      const cols = [...new Set(alts.flatMap(a => a.addColumns))];
      body += `- ALTER count: ${alts.length}; ADD COLUMN: ${cols.length ? cols.map(c => `\`${c}\``).join(', ') : '(none parsed)'}\n`;
      for (const a of alts) {
        body += `<details><summary>${a.file}</summary>\n\n${mdFence(a.sql)}\n\n</details>\n\n`;
      }
    } else {
      body += `- No ALTER TABLE found\n\n`;
    }
  }
  md += section('2. CREATE TABLE / ALTER TABLE', body);
}

// 3. Functions
{
  let body = '';
  body += `### Priority RPCs (latest full body)\n\n`;
  for (const pn of priorityFns) {
    const matches = [...functionsLatest.values()].filter(f => shortName(f.name) === pn);
    if (!matches.length) {
      body += `#### \`${pn}\`\n\n_Not found in migrations._\n\n`;
      continue;
    }
    for (const f of matches) {
      body += `#### \`${f.key}\`\n\n`;
      body += `- Latest: \`${f.file}\`\n`;
      if (f.history.length) body += `- Prior versions: ${f.history.map(h => `\`${h}\``).join(', ')}\n`;
      body += `\n${mdFence(f.sql)}\n\n`;
    }
  }

  body += `### All functions — latest version per signature (${functionsLatest.size})\n\n`;
  const byName = [...functionsLatest.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const f of byName) {
    body += `#### \`${f.key}\`\n\n`;
    body += `- Latest: \`${f.file}\`\n`;
    if (f.history.length) body += `- Prior: ${f.history.map(h => `\`${h}\``).join(', ')}\n`;
    body += `\n${mdFence(f.sql)}\n\n`;
  }
  md += section('3. CREATE FUNCTION (latest per signature)', body);
}

// 4. Policies
{
  let body = '';
  body += `Final policy set after applying CREATE/DROP in chronological order (${policies.size}).\n\n`;
  body += `Note: migration \`20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql\` hardened many authenticated policies.\n\n`;

  const byTable = new Map();
  for (const p of policies.values()) {
    if (!byTable.has(p.table)) byTable.set(p.table, []);
    byTable.get(p.table).push(p);
  }
  for (const [table, pols] of [...byTable.entries()].sort()) {
    body += `### Table \`${table}\` (${pols.length} policies)\n\n`;
    for (const p of pols.sort((a, b) => a.policyName.localeCompare(b.policyName))) {
      body += `#### Policy \`${p.policyName}\`\n\nSource: \`${p.file}\`\n\n${mdFence(p.sql)}\n\n`;
    }
  }
  md += section('4. CREATE POLICY (final set)', body);
}

// 5. Buckets
{
  let body = '';
  body += `### All bucket names found (${bucketNames.size})\n\n`;
  body += `From \`INSERT INTO storage.buckets\` (${bucketNamesFromInsert.size}):\n\n`;
  for (const n of [...bucketNamesFromInsert].sort()) body += `- \`${n}\`\n`;
  body += `\nAlso referenced via \`bucket_id\` in storage policies (may lack INSERT in migrations):\n\n`;
  for (const n of [...bucketNamesFromPolicies].sort()) {
    const viaInsert = bucketNamesFromInsert.has(n) ? '' : ' — **no INSERT in migrations**';
    body += `- \`${n}\`${viaInsert}\n`;
  }
  if (bucketsMissingInsert.length) {
    body += `\nBuckets with policies but no migration INSERT: ${bucketsMissingInsert.map(n => `\`${n}\``).join(', ')}\n`;
  }
  body += `\n### INSERT INTO storage.buckets (full)\n\n`;
  for (const b of buckets) {
    body += `Source: \`${b.file}\`\n\n${mdFence(b.sql)}\n\n`;
  }
  md += section('5. Storage buckets', body);
}

// 6. Storage policies
{
  let body = '';
  if (!finalStoragePolicies.length) body = '_None in final set._\n';
  for (const p of finalStoragePolicies.sort((a, b) => a.policyName.localeCompare(b.policyName))) {
    body += `### \`${p.policyName}\`\n\nSource: \`${p.file}\`\n\n${mdFence(p.sql)}\n\n`;
  }
  md += section('6. Storage policies on storage.objects (final)', body);
}

// 7. Indexes
{
  let body = '';
  for (const [name, v] of [...indexes.entries()].sort()) {
    body += `### \`${name}\`\n\nSource: \`${v.file}\`\n\n${mdFence(v.sql)}\n\n`;
  }
  md += section('7. CREATE INDEX', body || '_None._\n');
}

// 8. Triggers
{
  let body = '';
  for (const [name, v] of [...triggers.entries()].sort()) {
    body += `### \`${name}\`\n\nSource: \`${v.file}\`\n\n${mdFence(v.sql)}\n\n`;
  }
  md += section('8. CREATE TRIGGER', body || '_None._\n');
}

// 9. Schemas
{
  let body = '';
  if (!schemas.length) body = '_No CREATE SCHEMA found (including private)._\\n';
  else {
    for (const s of schemas) {
      body += `### \`${s.name}\`\n\nSource: \`${s.file}\`\n\n${mdFence(s.sql)}\n\n`;
    }
  }
  md += section('9. CREATE SCHEMA', body);
}

// 10. GRANT/REVOKE
{
  let body = '';
  const fnGrants = grants.filter(g => /FUNCTION/i.test(g.sql));
  body += `### On functions (${fnGrants.length})\n\n`;
  for (const g of fnGrants) {
    body += `Source: \`${g.file}\`\n\n${mdFence(g.sql)}\n\n`;
  }
  body += `### All GRANT/REVOKE (${grants.length})\n\n`;
  for (const g of grants) {
    body += `Source: \`${g.file}\` (${g.kind})\n\n${mdFence(g.sql)}\n\n`;
  }
  md += section('10. GRANT / REVOKE', body || '_None._\n');
}

// Appendix: RLS enable
{
  let body = '';
  for (const r of rlsEnabled) {
    body += `- \`${r.table}\` — \`${r.file}\`\n`;
  }
  md += section('Appendix A. ENABLE ROW LEVEL SECURITY', body || '_None parsed separately (may be inside ALTER)._\\n');
}

fs.writeFileSync(outPath, md, 'utf8');

const summary = {
  files: files.length,
  types: types.size,
  tables: tablesCreate.size,
  alterOnly: alterOnly.length,
  functions: functionsLatest.size,
  policies: policies.size,
  buckets: bucketNames.size,
  bucketsFromInsert: [...bucketNamesFromInsert].sort(),
  bucketsFromPolicies: [...bucketNamesFromPolicies].sort(),
  bucketsMissingInsert,
  bucketInserts: buckets.length,
  storagePolicies: finalStoragePolicies.length,
  indexes: indexes.size,
  triggers: triggers.size,
  schemas: schemas.length,
  grants: grants.length,
  alterOnlyNames: alterOnly,
  bucketNames: [...bucketNames].sort(),
  functionNames: [...new Set([...functionsLatest.values()].map(f => shortName(f.name)))].sort(),
  priorityFound: priorityFns.map(pn => ({
    name: pn,
    found: [...functionsLatest.values()].filter(f => shortName(f.name) === pn).map(f => ({ key: f.key, file: f.file })),
  })),
  outPath,
  outBytes: fs.statSync(outPath).size,
};

console.log(JSON.stringify(summary, null, 2));
