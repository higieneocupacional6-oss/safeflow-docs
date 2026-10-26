# Setup do projeto Supabase (fresh)

## Já feito neste ambiente

- Schema bootstrap (`20260414000000_bootstrap_complete_schema.sql`) aplicado
- 47 tabelas com RLS
- Buckets de storage
- Edge Functions ativas: `manage-users`, `aep-generate`, `aet-generate`, `aet-vale-generate`, `aet-vale-foto-analyze`, `aet-vale-plano-generate`, `apr-ergo-generate`, `formulario-aep-generate`, `psico-generate`
- `.env.local` apontando para `fibqwwdnxymgmlwfmsgm`

## Pendências manuais (você)

### 1. Primeiro usuário admin

1. No Dashboard Supabase → Authentication → Users → **Add user** (email + senha, confirme o email).
2. No SQL Editor (service role), rode:

```sql
SELECT public.bootstrap_promote_admin('seu-email@empresa.com');
```

A função só é executável por `service_role` (não pelo anon/authenticated).

### 2. Segredo de IA

As funções de geração usam `LOVABLE_API_KEY` (gateway Lovable). Em Project Settings → Edge Functions → Secrets, defina:

```
LOVABLE_API_KEY=<sua chave>
```

Sem isso, cadastros/documentos funcionam; geração por IA retorna erro de serviço não configurado.

### 3. Frontend

```bash
npm install
npm run dev
```

Variáveis em `.env.local`:

- `VITE_SUPABASE_URL` = `https://<ref>.supabase.co` (sem `/rest/v1`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` = anon/publishable key

## Nota sobre migrações históricas

As migrações timestampadas em `supabase/migrations/` (exceto o bootstrap) são o histórico do Lovable e **sobrepõem** objetos já criados. Em projeto fresh, use o bootstrap; não reaplique a cadeia antiga sem adaptação.
