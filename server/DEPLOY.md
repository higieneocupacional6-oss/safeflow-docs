# Deploy SegCRM na VPS

## Requisitos

- Node.js 20+
- PostgreSQL 15 com o banco `segcrm`
- Reverse proxy com HTTPS (Nginx ou Caddy)

## Desenvolvimento local

O frontend (Vite :3080) **não substitui** a API. Sem o Express em :4000 o app mostra “SegCRM offline”.

```bash
# Terminal 1 — API + PostgreSQL segcrm (server/.env)
npm run dev:api

# Terminal 2 — UI
npm run dev

# Ou os dois juntos:
npm run dev:full
```

Health checks: `GET /health` (processo), `GET /health/ready` (API + banco), `GET /health/database`.

## Preparação (VPS)

```bash
cd /opt/safeflow-docs
npm install
cd server && npm install && cd ..
cp server/.env.example server/.env
# Edite server/.env com PG*, CORS_ORIGIN (URL pública HTTPS), COOKIE_SECURE=true, DATA_DIR
# Em desenvolvimento o servidor já aceita localhost em qualquer porta do Vite.
```

Aplique as migrações de autenticação se ainda não estiverem no `segcrm`:

```bash
# via psql ou cliente PostgreSQL, na ordem:
# server/migrations/002_auth_schema.sql
# server/migrations/003_auth_uid_shim.sql
```

A `003` faz `auth.uid()` ler o usuário da API (`app.current_user_id`), necessário para DEFAULTs/triggers herdados do Supabase (no banco atual o DEFAULT de `ficha_tecnica_resultados.created_by` ainda é `auth.uid()`).

Defina as senhas iniciais (não invente senhas no código):

```bash
cd server
SEGCRM_PASSWORD='...' npm run set-password -- --email usuario@empresa.com
unset SEGCRM_PASSWORD
```

## Build e start

Na raiz (gera `dist/` + compila o server):

```bash
npm run build:vps
npm run start:vps
```

Equivalente manual:

```bash
npm run build
cd server
npm run build
NODE_ENV=production npm run start
```

O Express escuta em `HOST:PORT` e serve:
- API em `/api`, `/health`, `/admin`
- SPA em `FRONTEND_DIST` (padrão `../dist`)

## Nginx (exemplo)

```nginx
server {
  listen 443 ssl;
  server_name app.seudominio.com;
  # ssl_certificate ...;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Dados de arquivo

Copie os objetos do Storage do Supabase para `DATA_DIR`, mantendo o caminho relativo por bucket
(ex.: `DATA_DIR/templates/...`, `DATA_DIR/documentos-upload/...`).
