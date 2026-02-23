<div align="center">
  <img src="Frontend/public/spidergo-logo.png" alt="SpiderGo Logo" width="96" />
  <h1>SpiderGo</h1>
  <p><strong>Open-source web crawler &amp; scraper — turn any website into structured data.</strong></p>
  <p>
    <a href="#features">Features</a> ·
    <a href="#tech-stack">Tech Stack</a> ·
    <a href="#getting-started">Getting Started</a> ·
    <a href="#configuration">Configuration</a> ·
    <a href="#api-reference">API Reference</a> ·
    <a href="#project-structure">Project Structure</a>
  </p>
</div>

---

## Overview

SpiderGo is a full-stack web crawling and scraping platform. Give it a seed URL and it will:

- **Crawl** entire websites using a concurrent BFS traversal, following links up to a configurable depth and page limit.
- **Scrape** individual pages, extracting titles, meta descriptions, readable text, and e-commerce product data (names, prices, images) from JSON-LD, CSS selectors, and Open Graph tags.
- Deliver all results as clean, structured **JSON**.

The backend is written in **Go** and exposes a REST API. The frontend is a **React / TypeScript** single-page application with a dashboard, interactive demo, and job history viewer.

---

## Features

### Backend
| Feature | Details |
|---|---|
| 🕷 Concurrent BFS crawling | Goroutine-per-page at each BFS level; configurable max depth & page cap |
| 🔍 Smart scraping | Extracts title, description, text content, links, and response metadata |
| 🛒 E-commerce extraction | JSON-LD schema.org, CSS selector, and Open Graph strategies; auto-deduplication |
| 🔐 JWT authentication | HttpOnly cookie-based access & refresh tokens with configurable TTLs |
| 🔑 OAuth 2.0 | Google and GitHub OAuth login / registration |
| 🛑 Rate limiting | Redis-backed per-IP rate limiter (default: 5 requests / minute) |
| ⚡ Redis caching | Crawl results cached for 4 hours to avoid redundant work |
| 📧 Email service | SMTP email integration (verification, password reset) |
| 🏗 Clean Architecture | Domain → Repository → Usecase → Delivery layers |
| 📋 Structured logging | JSON logs via logrus with configurable debug / info level |

### Frontend
| Feature | Details |
|---|---|
| 🖥 Interactive demo | Live scrape / crawl demo on the landing page |
| 🌗 Dark / light mode | System-aware theme with manual toggle |
| 📊 Dashboard | Submit new crawl or scrape jobs with real-time feedback |
| 📜 Job history | Browse past jobs with full request / response inspection |
| ⚙️ Configurable jobs | Set max pages, depth, allowed patterns, denied patterns |
| 👤 Profile & settings | User profile management |
| 🔒 Auth flows | Login, signup, email verification, forgot password, OAuth |

---

## Tech Stack

### Backend
- **Language:** Go 1.24
- **HTTP framework:** [Gin](https://github.com/gin-gonic/gin)
- **ORM / Database:** [GORM](https://gorm.io) + PostgreSQL
- **Cache:** [Redis](https://github.com/redis/go-redis)
- **Crawler engine:** [Colly](https://github.com/gocolly/colly)
- **HTML parser:** [go-readability](https://github.com/go-shiori/go-readability)
- **Authentication:** [golang-jwt/jwt](https://github.com/golang-jwt/jwt) + [golang.org/x/oauth2](https://pkg.go.dev/golang.org/x/oauth2)
- **Config:** [Viper](https://github.com/spf13/viper)
- **Logging:** [Logrus](https://github.com/sirupsen/logrus)

### Frontend
- **Language:** TypeScript + React 19
- **Build tool:** [Vite](https://vitejs.dev)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **UI components:** [shadcn/ui](https://ui.shadcn.com) (Radix UI)
- **State management:** [Redux Toolkit](https://redux-toolkit.js.org)
- **Router:** [React Router v7](https://reactrouter.com)
- **Icons:** [Lucide React](https://lucide.dev)

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|---|---|
| Go | 1.24 |
| Node.js | 18 |
| npm | 9 |
| PostgreSQL | 14 |
| Redis | 6 |

---

### Backend setup

```bash
# 1. Navigate to the backend directory
cd Backend

# 2. Install Go dependencies
go mod download

# 3. Create your config file (see Configuration section below)
cp Infrastrucuture/config/config.example.yaml Infrastrucuture/config/config.yaml
# Edit config.yaml with your database, Redis, JWT, OAuth and email credentials

# 4. Run the server
go run Delivery/main.go
```

The API will start on the port defined in your config (default: `8080`).

---

### Frontend setup

```bash
# 1. Navigate to the frontend directory
cd Frontend

# 2. Install dependencies
npm install

# 3. (Optional) Create a .env file for the API base URL
echo "VITE_API_URL=http://localhost:8080" > .env

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

To create a production build:

```bash
npm run build
# Output is in the dist/ directory
```

---

## Configuration

The backend is configured via `Backend/Infrastrucuture/config/config.yaml`. The following environment variables override their YAML counterparts:

| Env variable | YAML key | Description |
|---|---|---|
| `DB_DNS` | `db.dns` | PostgreSQL connection string |
| `PORT` | `app.port` | HTTP server port |

### Example `config.yaml`

```yaml
app:
  name: "SpiderGo"
  port: "8080"
  env: "development"
  debug: false
  domain: "localhost"
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
  refresh_ttl: 168h   # 7 days

security:
  min_entropy_bits: 30

email:
  stmp_host: "smtp.gmail.com"
  stmp_port: 587
  username: "you@gmail.com"
  app_password: "your-app-password"

google_oauth:
  client_id: "your-google-client-id"
  client_secret: "your-google-client-secret"
  redirect_url: "http://localhost:8080/auth/oauth/google-callback"
  scopes: ["openid", "email", "profile"]
  user_url: "https://www.googleapis.com/oauth2/v2/userinfo"

github_oauth:
  client_id: "your-github-client-id"
  client_secret: "your-github-client-secret"
  redirect_url: "http://localhost:8080/auth/oauth/github-callback"
  scopes: ["read:user", "user:email"]
  user_url: "https://api.github.com/user"

crawler:
  max_depth: 3
  max_pages: 50
  allowed_domains: []
  allowed_paths: []
  denied_patterns:
    - "logout"
    - "login"
```

---

## API Reference

All endpoints are prefixed with the server root (e.g. `http://localhost:8080`).  
Protected routes require a valid `access_token` cookie (set automatically on login).

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login with email & password |
| `GET` | `/auth/oauth?provider={google\|github}` | Redirect to OAuth provider |
| `GET` | `/auth/oauth/google-callback` | Google OAuth callback |
| `GET` | `/auth/oauth/github-callback` | GitHub OAuth callback |
| `POST` | `/auth/refresh` | Refresh the access token |

#### `POST /auth/register`
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```

#### `POST /auth/login`
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```
On success, sets `access_token` and `refresh_token` as HttpOnly cookies.

---

### Crawler & Scraper *(requires authentication)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/crawl` | BFS-crawl a website |
| `GET` | `/scrape` | Scrape a single page |

Both endpoints accept the same JSON body:

```json
{
  "url": "https://example.com"
}
```

The crawl depth and page cap are taken from server-side configuration.  
The scrape endpoint always uses `depth: 1` (single page).

#### Example crawl response
```json
{
  "message": {
    "CRID": "550e8400-e29b-41d4-a716-446655440000",
    "UserID": "abc123",
    "Pages": [
      {
        "PageID": "...",
        "URL": "https://example.com",
        "Title": "Example Domain",
        "MetaDescription": "This domain is for use in illustrative examples.",
        "StatusCode": 200,
        "ResponseTimeMS": 124,
        "ContentType": "text/html; charset=UTF-8",
        "FetchedAt": "2026-02-20T08:30:00Z",
        "Links": [...],
        "Products": []
      }
    ]
  }
}
```

---

## Project Structure

```
web-crawler-scraper/
├── Backend/
│   ├── Delivery/
│   │   ├── main.go                     # Entry point; wires up all layers
│   │   ├── Route/
│   │   │   └── route.go                # Route definitions
│   │   └── controller/
│   │       ├── auth_controller.go      # Register, login, OAuth, token refresh
│   │       ├── crawler_controller.go   # Crawl endpoint
│   │       └── scrape_controller.go    # Scrape endpoint
│   ├── Domain/                         # Core business entities & interfaces
│   │   ├── user.go
│   │   ├── crawler.go
│   │   ├── result.go                   # CrawlerResult, Page, Product, Link
│   │   ├── interfaces.go
│   │   └── ...
│   ├── Usecase/                        # Application business logic
│   │   ├── auth_usecase.go
│   │   ├── crawler_usecase.go
│   │   └── scraper_usecase.go
│   ├── Repository/                     # Database access (GORM)
│   │   ├── user_repo.go
│   │   ├── result_repo.go
│   │   ├── session_repo.go
│   │   └── token_repo.go
│   ├── Infrastrucuture/
│   │   ├── config/
│   │   │   └── config.go               # Config loading (Viper)
│   │   ├── crawler_service.go/
│   │   │   ├── crawl.go                # BFS crawler with Redis caching
│   │   │   └── scraper.go              # Colly-based scraper + product extraction
│   │   ├── middleware/
│   │   │   └── middleware.go           # JWT auth middleware
│   │   ├── oauth/
│   │   │   ├── google.go
│   │   │   └── oauth_service.go
│   │   ├── db.go                       # PostgreSQL connection
│   │   ├── redis.go                    # Redis client + rate limiter
│   │   ├── jwt_service.go
│   │   ├── password_service.go
│   │   └── email_service.go
│   ├── go.mod
│   └── go.sum
│
└── Frontend/
    ├── src/
    │   ├── App.tsx                     # Route definitions
    │   ├── main.tsx                    # React entry point
    │   ├── pages/
    │   │   ├── landing.tsx             # Public landing page with live demo
    │   │   ├── login.tsx
    │   │   ├── signup.tsx
    │   │   ├── forgot-password.tsx
    │   │   ├── verify-email.tsx
    │   │   ├── update-password.tsx
    │   │   └── dashboard/
    │   │       ├── dashboard.tsx       # New job submission
    │   │       ├── history.tsx         # Job history & request/response viewer
    │   │       ├── profile.tsx
    │   │       └── settings.tsx
    │   ├── components/
    │   │   ├── dashboard-layout.tsx
    │   │   ├── app-sidebar.tsx
    │   │   ├── ThemeProvider.tsx
    │   │   ├── ThemeToggle.tsx
    │   │   └── ui/                     # shadcn/ui component library
    │   └── store/
    │       ├── store.ts                # Redux store
    │       ├── authSlice.ts            # Auth state & async thunks
    │       └── dashboardSlice.ts       # Job/crawler state & async thunks
    ├── public/
    ├── package.json
    └── vite.config.js
```

---

## License

This project is open source. See the repository for license details.
