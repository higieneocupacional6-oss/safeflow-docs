-- Autenticação própria do SegCRM.
-- Não altera profiles, user_roles nem tabelas de negócio.
-- Não inventa senhas. password_hash permanece nulo até o procedimento de senha inicial.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;

-- Lido pela API via SET LOCAL app.current_user_id (ver setAppUserContext).
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE TABLE IF NOT EXISTS app.users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  password_hash text,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS app.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip inet,
  CONSTRAINT app_sessions_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app.sessions (user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON app.sessions (expires_at);

CREATE TABLE IF NOT EXISTS app.login_attempts (
  id bigserial PRIMARY KEY,
  email_normalized text NOT NULL,
  ip inet,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_login_attempts_email_created_idx
  ON app.login_attempts (email_normalized, created_at DESC);
CREATE INDEX IF NOT EXISTS app_login_attempts_ip_created_idx
  ON app.login_attempts (ip, created_at DESC);

-- Preserva os UUIDs atuais de profiles.user_id. Não grava senha.
INSERT INTO app.users (id, email, password_hash, must_change_password)
SELECT p.user_id, lower(btrim(p.email)), NULL, true
FROM public.profiles p
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    updated_at = now();
