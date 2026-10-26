# Bootstrap schema notes

## What this is

`migrations/20260414000000_bootstrap_complete_schema.sql` bootstraps a **complete empty** SafeFlow public schema (47 tables matching `src/integrations/supabase/types.ts`), plus enums, `private` schema helpers, RLS policies, storage buckets/policies, indexes, triggers, RPCs, and grants.

It is intended for **fresh** Supabase projects. It does **not** seed business data.

Do **not** apply this file to a production database that already has the historical migration chain unless you know what you are doing.

## How it was built

Authoritative inputs:

1. `_bootstrap_inventory_tables.md` — every column from `types.ts`
2. `_bootstrap_inventory_migrations.md` — CREATE TABLE SQL, latest function bodies, final RLS/storage policies, indexes, triggers, grants
3. `src/integrations/supabase/types.ts` — Relationships / FK graph and Insert optionality

Timestamp `20260414000000` sorts **before** the existing dated migrations so a fresh `supabase db` history can run bootstrap first.

## Applying on a fresh project

1. Apply `20260414000000_bootstrap_complete_schema.sql` first.
2. Subsequent timestamped migrations may **partially overlap** (re-create types, tables, policies, or functions that already exist).
3. For a project that already ran this bootstrap, **skip or adapt** overlapping historical migrations (e.g. wrap in `IF NOT EXISTS`, drop conflicting policies before recreate, or mark them as applied without re-running DDL).
4. Prefer the bootstrap’s **final** RPC bodies and hardened authenticated policies over older migration copies.

## Known fixes baked into bootstrap

| Issue | Bootstrap behavior |
| --- | --- |
| `update_modified_column` (legacy name) | All triggers use `public.update_updated_at_column()` |
| Open “Anyone can …” RLS | Final authenticated / admin patterns (esp. hardening from `20260418023326_…`) |
| Missing historical `CREATE TABLE` | Reconstructed from `types.ts` + `ALTER … ADD COLUMN` history |

## Tables reconstructed without a historical CREATE

These appear in live `types.ts` and in later migrations as `ALTER` / policies only:

- `equipamentos_ho`
- `tecnicas_amostragem`
- `unidades`
- `ltcat_avaliacoes`

## Tables present in old migrations but **skipped** (absent from `types.ts`)

- `exames_catalogo` (superseded by `exames_cadastro`)
- `esocial_exames`
- `pcmso_setor_exames`

Their policies/indexes/triggers are not included.

## Storage buckets (9)

| Bucket | Public | Notes |
| --- | --- | --- |
| `templates` | yes | INSERT present in history |
| `aet-imagens` | **no** | History had `public = true`; bootstrap follows “templates public, others private” |
| `documentos-upload` | no | |
| `certificados-calibracao` | no | Policy-only in history (no INSERT) |
| `ergonomia-relatorios` | no | Policy-only in history |
| `ia-conhecimento` | no | Policy-only in history |
| `psico-base-tecnica` | no | Policy-only in history |
| `formulario-aep-base` | no | App “Base” bucket (APR-ERGO / AEP refs); not in historical migrations |
| `formularios-aep` | no | Filled AEP form storage; not in historical migrations |

## Assumptions / ambiguities

1. **Column types** for reconstructed tables: uuid / timestamptz / date / jsonb / bigint `row_version` inferred from `types.ts` hints + migration CREATE/ALTER where available. Date-only fields (`data_*` without `_at`) use `date`.
2. **Defaults**: `gen_random_uuid()`, `now()`, `row_version = 1`, `current_step = 0`, empty `jsonb` (`{}` / `[]`), `status = 'rascunho'` where NOT NULL and Insert-optional in types.
3. **ON DELETE** FK actions: heuristic from migrations (e.g. `empresa_id` / `documento_id` / child LTCAT rows → CASCADE; many `contrato_id` → SET NULL). Not every historical ON DELETE clause was preserved verbatim.
4. **CHECK constraints** (e.g. `ltcat_avaliacoes.tipo_documento IN (…)`, audit `action IN (…)`) are **not** fully re-emitted; app + RPCs already enforce many of these.
5. **`aet-imagens` publicity**: forced private in bootstrap despite an older public INSERT.
6. **App-only buckets** `formulario-aep-base` and `formularios-aep` were added from client usage (`BUCKET_FORM_AEP_BASE`, FormularioAepPreencher) even though no historical migration INSERT’d them. Authenticated CRUD policies mirror other private buckets.
7. **Grants**: function GRANT/REVOKE follow the latest security migrations (including private schema wrappers). Some intermediate GRANT lines remain in chronological inventory order; the **last** statements for each object win.
8. **Idempotency**: `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION` / `DROP TRIGGER IF EXISTS` are used where practical. `CREATE POLICY` is **not** idempotent—bootstrap expects a clean database.
9. **Auth trigger**: `on_auth_user_created` on `auth.users` → `handle_new_user()` (requires Supabase Auth schema). `profiles.user_id` / `user_roles.(user_id, role)` uniqueness match the original auth migration.
10. Regenerator script (optional): `_generate_bootstrap.mjs` — re-run only if inventories change; review diffs carefully.

## Counts (bootstrap snapshot)

- Tables CREATE’d: **47**
- Functions / RPCs: **17** signatures (public + private wrappers)
- Storage buckets: **9**
- RLS enabled on all 47 public tables
- Final table + storage policies included from migration inventory (skipping obsolete tables)
