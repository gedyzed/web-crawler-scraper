# SpiderGo — Web Crawler & Scraper

A full-stack web application that lets authenticated users crawl and scrape websites. The **backend** is a Go REST API built with [Gin](https://github.com/gin-gonic/gin), backed by PostgreSQL, Redis, and JWT-based authentication (including Google & GitHub OAuth). The **frontend** is a React + Vite single-page application styled with Tailwind CSS.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Crawler](#crawler)
  - [Scraper](#scraper)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)

---

## Features

- **User Authentication** — register, login, JWT-based sessions, refresh tokens, and OAuth via Google & GitHub
- **Web Crawler** — depth-first crawl starting from a seed URL, discovering internal links, page metadata, and response metrics
- **Web Scraper** — single-page content extraction including title, text, links, and product data
- **Rate Limiting** — Redis-backed per-user rate limiter
- **Result History** — all crawl and scrape results are persisted per user in PostgreSQL
- **Responsive Dashboard** — React SPA with history, profile, and settings views

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Go 1.24 |
| HTTP framework | Gin |
| ORM | GORM (PostgreSQL via pgx) |
| Cache / Rate limiting | Redis |
| Authentication | JWT (`golang-jwt/jwt`), OAuth 2.0 |
| Crawler engine | Colly |
| Content extraction | go-readability |
| Config | Viper (YAML) |
| Frontend | React 19, Vite, Tailwind CSS, Redux Toolkit, React Router v7 |

---

## Project Structure

```
.
├── Backend/
│   ├── Delivery/
│   │   ├── controller/        # HTTP handlers (auth, crawler, scraper)
│   │   ├── Route/             # Gin route registration
│   │   └── main.go            # Application entry point
│   ├── Domain/                # Core types and interfaces
│   ├── Infrastrucuture/       # DB, Redis, JWT, OAuth, crawler service, config
│   ├── Repository/            # GORM data-access layer
│   ├── Usecase/               # Business logic
│   ├── go.mod
│   └── config.yaml            # App configuration (see below)
└── Frontend/
    ├── src/
    │   ├── pages/             # Route-level React components
    │   ├── components/        # Shared UI components
    │   ├── store/             # Redux store & slices
    │   └── hooks/             # Custom React hooks
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Go | 1.24 |
| Node.js | 18 |
| PostgreSQL | 14 |
| Redis | 6 |

---

## Getting Started

### Backend

1. **Clone the repository**

   ```bash
   git clone https://github.com/gedyzed/web-crawler-scraper.git
   cd web-crawler-scraper/Backend
   ```

2. **Create a configuration file**

   Copy or create `Backend/config.yaml` (see [Environment Variables](#environment-variables) for all keys):

   ```yaml
   app:
     name: SpiderGo
     port: "8080"
     domain: localhost
     debug: true
     secure_cookies: false

   db:
     dns: "host=localhost user=postgres password=secret dbname=spidergo port=5432 sslmode=disable"

   redis:
     address: "localhost:6379"
     password: ""
     db: 0

   jwt_config:
     access_key: "your-access-secret"
     refresh_key: "your-refresh-secret"
     access_ttl: 15m
     refresh_ttl: 168h

   security:
     min_entropy_bits: 30

   google_oauth:
     client_id: ""
     client_secret: ""
     redirect_url: "http://localhost:8080/auth/oauth/google-callback"
     user_url: "https://www.googleapis.com/oauth2/v2/userinfo"

   github_oauth:
     client_id: ""
     client_secret: ""
     redirect_url: "http://localhost:8080/auth/oauth/github-callback"
     user_url: "https://api.github.com/user"

   crawler:
     max_depth: 3
     max_pages: 50
   ```

3. **Install dependencies and run**

   ```bash
   go mod download
   go run Delivery/main.go
   ```

   The API will be available at `http://localhost:8080`.

4. **Optional — live reload with Air**

   ```bash
   go install github.com/air-verse/air@latest
   air
   ```

---

### Frontend

1. **Navigate to the frontend directory**

   ```bash
   cd web-crawler-scraper/Frontend
   ```

2. **Create the environment file**

   ```env
   # Frontend/.env
   VITE_API_BASE_URL=http://localhost:8080
   ```

3. **Install dependencies and start the dev server**

   ```bash
   npm install
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

4. **Build for production**

   ```bash
   npm run build      # output in dist/
   npm run preview    # serve the production build locally
   ```

---

## API Reference

All endpoints are prefixed with the host, e.g. `http://localhost:8080`.  
Protected routes require a valid `access_token` cookie (set automatically on login).

---

### Authentication

#### `POST /auth/register`

Register a new user account.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "message": "User Registered Successfully. PLease Verify Email" }` |
| `400 Bad Request` | `{ "error": "<reason>" }` |

---

#### `POST /auth/login`

Authenticate with email and password. Sets `access_token` and `refresh_token_local` HTTP-only cookies.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "message": "welcome to homepage" }` |
| `400 Bad Request` | `{ "error": "Invalid Email or Password" }` |

---

#### `GET /auth/oauth?provider=google`

Initiate an OAuth 2.0 login flow. Redirects the browser to the provider's consent screen.

**Query parameters**

| Parameter | Values | Required |
|---|---|---|
| `provider` | `google`, `github` | ✓ |

---

#### `GET /auth/oauth/google-callback`

OAuth callback for Google. Called automatically by Google after the user grants consent. Sets session cookies and returns the session object.

---

#### `GET /auth/oauth/github-callback`

OAuth callback for GitHub. Behaves identically to the Google callback.

---

#### `POST /auth/refresh`

Exchange the `refresh_token_local` cookie for a new `access_token`. Silently rotates the refresh token when nearing expiry.

**Responses**

| Status | Body |
|---|---|
| `200 OK` | *(cookies updated, no body)* |
| `400 Bad Request` | `{ "error": "Invalid refresh token" }` |

---

### Crawler

> **Authentication required** — `access_token` cookie must be present.

#### `GET /crawl`

Start a depth-limited web crawl from a seed URL. Discovers pages, links, metadata, and response timing for each page visited.

**Request body**

```json
{
  "URL": "https://example.com"
}
```

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "message": <CrawlerResult> }` |
| `400 Bad Request` | `{ "error": "Seed URL is not provided" }` |
| `401 Unauthorized` | `{ "error": "..." }` |

**`CrawlerResult` schema**

```json
{
  "CRID": "uuid",
  "Pages": [
    {
      "PageID": "uuid",
      "URL": "https://example.com",
      "ParentURL": "",
      "Depth": 0,
      "StatusCode": 200,
      "ContentType": "text/html",
      "ResponseTimeMS": 142,
      "FetchedAt": "2024-01-01T00:00:00Z",
      "Title": "Example Domain",
      "MetaDescription": "...",
      "TextContent": "...",
      "Links": [{ "URL": "https://example.com/page", "Type": "internal" }],
      "Products": []
    }
  ]
}
```

> **Note:** Crawl depth and maximum number of pages are controlled by the `crawler.max_depth` and `crawler.max_pages` configuration values.

---

### Scraper

> **Authentication required** — `access_token` cookie must be present.

#### `GET /scrape`

Fetch and extract the content of a single page (depth is fixed at 1).

**Request body**

```json
{
  "URL": "https://example.com/product-page"
}
```

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "message": <CrawlerResult> }` |
| `400 Bad Request` | `{ "error": "Seed URL is not provided" }` |
| `401 Unauthorized` | `{ "error": "..." }` |

The response shape is the same `CrawlerResult` as the crawler, but always contains a single page. The `Products` array is populated when structured product data (name, price, image, etc.) is detected on the page.

---

## Environment Variables

The backend reads configuration from `Backend/config.yaml`. The most important fields are listed below.

| Key | Description |
|---|---|
| `app.port` | Port the API listens on (env override: `PORT`) |
| `app.domain` | Cookie domain |
| `app.secure_cookies` | Set `true` in production (HTTPS only) |
| `db.dns` | PostgreSQL connection string (env override: `DB_DNS`) |
| `redis.address` | Redis address (`host:port`) |
| `jwt_config.access_key` | Secret used to sign access tokens |
| `jwt_config.refresh_key` | Secret used to sign refresh tokens |
| `jwt_config.access_ttl` | Access token lifetime (e.g. `15m`) |
| `jwt_config.refresh_ttl` | Refresh token lifetime (e.g. `168h`) |
| `google_oauth.client_id` | Google OAuth client ID |
| `google_oauth.client_secret` | Google OAuth client secret |
| `github_oauth.client_id` | GitHub OAuth app client ID |
| `github_oauth.client_secret` | GitHub OAuth app client secret |
| `crawler.max_depth` | Maximum link-follow depth for the crawler |
| `crawler.max_pages` | Maximum number of pages per crawl job |
| `security.min_entropy_bits` | Minimum password entropy (default `30`) |

The frontend reads a single variable from `Frontend/.env`:

| Key | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |

---

## Architecture Overview

```
┌──────────────────────────────────────────┐
│                 Frontend                 │
│   React + Vite + Redux + React Router    │
│  (Landing / Login / Signup / Dashboard)  │
└────────────────────┬─────────────────────┘
                     │ HTTP (REST)
┌────────────────────▼─────────────────────┐
│               Backend (Gin)              │
│                                          │
│  Delivery layer  (controllers + routes)  │
│  Usecase layer   (business logic)        │
│  Repository layer(GORM data access)      │
│  Infrastructure  (JWT, OAuth, Redis,     │
│                   Colly crawler,         │
│                   go-readability)        │
└──────────┬───────────────────────────────┘
           │
  ┌────────┴────────┐
  │                 │
  ▼                 ▼
PostgreSQL         Redis
(users, results,  (sessions,
 history)          rate limiting)
```
