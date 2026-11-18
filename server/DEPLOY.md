# Deploy SegCRM na VPS

## Requisitos

- Node.js 20+
- PostgreSQL 15 com o banco `segcrm`
- Reverse proxy com HTTPS (Nginx ou Caddy)
- Ferramentas nativas para compilar `argon2` (Linux):

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

Sem `make`/`g++`, o `npm install` em `server/` falha e o TypeScript não encontra `express` / tipagens.

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
cd /var/www/safeflow-docs   # ou o caminho do projeto na VPS
sudo apt-get update && sudo apt-get install -y build-essential python3
npm install
cd server && rm -rf node_modules && npm install && cd ..
cp server/.env.example server/.env
# Edite server/.env com PG*, CORS_ORIGIN (URL pública HTTPS), COOKIE_SECURE=true, DATA_DIR
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
```

### PM2 (recomendado na VPS)

```bash
cd /var/www/safeflow-docs/server
mkdir -p logs
# Confirme PORT=4000 e demais variáveis em server/.env
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
pm2 status
curl -s http://127.0.0.1:4000/health/ready
```

Sem PM2:

```bash
npm run start:vps
# ou: cd server && NODE_ENV=production npm run start:prod
```

O Express escuta em `HOST:PORT` e serve:
- API em `/api`, `/health`, `/admin`
- SPA em `FRONTEND_DIST` (padrão `../dist`)

## Nginx

Arquivo pronto: [`server/nginx/safeflow.segnorte.com.br.conf`](nginx/safeflow.segnorte.com.br.conf)

```bash
sudo cp server/nginx/safeflow.segnorte.com.br.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/safeflow.segnorte.com.br.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d safeflow.segnorte.com.br
```

No `server/.env`: `CORS_ORIGIN=https://safeflow.segnorte.com.br` e `COOKIE_SECURE=true`.

## Dados de arquivo

Copie os objetos do Storage do Supabase para `DATA_DIR`, mantendo o caminho relativo por bucket
(ex.: `DATA_DIR/templates/...`, `DATA_DIR/documentos-upload/...`).
