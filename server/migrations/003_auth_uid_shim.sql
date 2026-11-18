-- Liga a identidade da API Express aos DEFAULTs/triggers que usam auth.uid().
-- Não destrutivo: cria app.current_user_id e reescreve auth.uid para lê-la.

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  SELECT COALESCE(
    app.current_user_id(),
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  )
$$;

COMMENT ON FUNCTION app.current_user_id() IS
  'UUID do usuário autenticado na API Express (SET LOCAL app.current_user_id).';
COMMENT ON FUNCTION auth.uid() IS
  'Compatibilidade SegCRM: prioriza app.current_user_id(); mantém fallback JWT legado.';
