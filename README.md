# SpiderGo - Web Crawler and Scraper

SpiderGo is a full-stack web crawler and scraper platform with:

- A Go backend API (Gin + GORM + Redis)
- A React frontend dashboard (Vite + TypeScript)
- A Next.js documentation site


## Monorepo Structure

- Backend: API, auth, crawling/scraping services, and data layer
- Frontend: User-facing dashboard app
- Docs/spider-go: Documentation site

## Tech Stack

- Backend: Go, Gin, GORM, PostgreSQL, Redis, OAuth (Google/GitHub), JWT
- Frontend: React, Vite, TypeScript, Redux Toolkit
- Docs: Next.js + @farming-labs/docs

## Prerequisites

- Go 1.24+
- Node.js 20+
- npm or pnpm
- PostgreSQL
- Redis

## Quick Start

### 1. Start Backend

From Backend:

```bash
go mod download
go run ./Delivery
```

Default backend port is configured in Backend/config.yaml.

### 2. Start Frontend

From Frontend:

```bash
npm install
npm run dev
```

### 3. Start Docs Site

From Docs/spider-go:

```bash
npm install
npm run dev
```

## Backend Configuration

Primary backend config is in Backend/config.yaml.

You should configure at least:

- app.domain
- db.dns
- redis.address and redis.password
- jwt_config.access_key and jwt_config.refresh_key
- google_oauth and github_oauth credentials
- email.api_key

## Backend API Route Groups

- auth: registration, login, OAuth, verification, password reset
- auth/me: authenticated profile endpoint
- auth/api-keys: create/list/revoke API keys
- trial: unauthenticated trial crawl/scrape
- v1: API-key-protected crawl/scrape/history
- crawl, scrape, history: authenticated user operations

## Running Tests

From Backend:

```bash
go test ./...
```

## Deployment Notes

- Frontend includes Vercel config in Frontend/vercel.json
- Docs site is configured as a standalone Next.js project inside Docs/spider-go
- Backend ships with a Dockerfile in Backend/Dockerfile
