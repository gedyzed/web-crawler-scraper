# SpiderGo

SpiderGo is a full-stack web crawler and scraper platform with:

- A Go backend API (Gin + GORM + Redis)
- A React frontend dashboard (Vite + TypeScript)
- A Next.js documentation site


## Monorepo Structure

- `Backend`: API, auth, crawler/scraper services, repositories
- `Frontend`: dashboard web app
- `Docs/spider-go`: docs website

## Prerequisites

Install these before running locally :

- Go 1.24+
- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis 7+

## 1. Clone and Install Dependencies

```bash
git clone https://github.com/gedyzed/web-crawler-scraper.git
cd web-crawler-scraper

# backend deps
cd Backend && go mod download && cd ..

# frontend deps
cd Frontend && npm install && cd ..

# docs deps
cd Docs/spider-go && npm install && cd ../..
```

## 2. Start Local PostgreSQL and Redis

If you already have them running, skip this section.

Example using Docker:

```bash
docker run -d --name spidergo-postgres \
	-e POSTGRES_USER=postgres \
	-e POSTGRES_PASSWORD=postgres \
	-e POSTGRES_DB=spidergo \
	-p 5432:5432 postgres:16

docker run -d --name spidergo-redis \
	-p 6379:6379 redis:7
```

## 3. Configure Backend

Backend reads `Backend/config.yaml` and also allows overrides from environment variables / `.env`.

Important:

- Do not put real secrets in committed YAML.
- Keep secrets in local `.env` or deployment secret manager.

Minimum values to set for local run:

- `db.dns`
- `redis.address`
- `jwt_config.access_key`
- `jwt_config.refresh_key`
- `email.username`
- `email.api_key`

Example local `.env` (in `Backend/.env`):

```env
APP_PORT=8080
APP_DOMAIN=localhost
APP_SECURE_COOKIES=false

DB_DNS=postgres://postgres:postgres@localhost:5432/spidergo?sslmode=disable

REDIS_ADDRESS=localhost:6379
REDIS_PASSWORD=

JWT_CONFIG_ACCESS_KEY=change-me-access-key
JWT_CONFIG_REFRESH_KEY=change-me-refresh-key

GOOGLE_OAUTH_CLIENT_ID=replace-me
GOOGLE_OAUTH_CLIENT_SECRET=replace-me
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:8080/auth/google/callback
GOOGLE_OAUTH_USER_URL=https://www.googleapis.com/oauth2/v3/userinfo

GITHUB_OAUTH_CLIENT_ID=replace-me
GITHUB_OAUTH_CLIENT_SECRET=replace-me
GITHUB_OAUTH_REDIRECT_URL=http://localhost:8080/auth/github/callback
GITHUB_OAUTH_USER_URL=https://api.github.com/user

EMAIL_USERNAME=replace-me
EMAIL_API_KEY=replace-me
```

## 4. Apply Database Migrations

Use any SQL migration runner you prefer. The repository includes SQL files in `Backend/migrations`.

Quick local option with `psql`:

```bash

psql "postgres://postgres:postgres@localhost:5432/spidergo?sslmode=disable" \
	-f Backend/migrations/20260407000100_bootstrap_current_schema.up.sql
```

## 5. Run the Apps

Open 3 terminals from repository root.

Terminal 1 - Backend:

```bash
cd Backend
go run ./Delivery
```

Terminal 2 - Frontend:

```bash
cd Frontend
export VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

Terminal 3 - Docs:

```bash
cd Docs/spider-go
npm run dev
```

## 6. Access URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Docs: `http://localhost:3000`

## Running Tests

Backend:

```bash
cd Backend
go test ./...
```

## Deployment Notes

- Frontend includes Vercel config in Frontend/vercel.json
- Docs site is configured as a standalone Next.js project inside Docs/spider-go
- Backend ships with a Dockerfile in Backend/Dockerfile
