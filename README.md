<p align="center">
  <img src="stokely-frontend/src/assets/kindling/kindling-shield.png" alt="Kindling Shield mascot" width="220" />
</p>

<h1 align="center">Stokely</h1>

<p align="center" style="margin-top: 1.1rem;"><strong>Build your streaks. Stoke your momentum.</strong></p>

<p align="center">
  <a href="https://github.com/ismailmohammad/kuhabit/actions/workflows/prod-ci-cd.yml"><img src="https://github.com/ismailmohammad/kuhabit/actions/workflows/prod-ci-cd.yml/badge.svg?branch=main" alt="Prod CI/CD" /></a>
  <img src="https://img.shields.io/badge/Playwright-E2E%20Smoke-45BA63?logo=playwright&logoColor=white" alt="Playwright E2E" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Go-1.25%2B-00ADD8?logo=go&logoColor=white" alt="Go 1.25+" />
  <img src="https://img.shields.io/badge/React%20%2B%20TypeScript-Frontend-3178C6?logo=react&logoColor=white" alt="React + TypeScript" />
</p>

Stokely is a full-stack habit tracker for building good habits and curbing bad ones, with optional account-wide end-to-end encryption (E2EE), streak mechanics, and device-level reminder notifications.

Live: [stokely.quest](https://stokely.quest)

This was mainly built to test the workflow with Codex/Claude to build an all around application incorporating testing, devops, and security practices to be further enhanced and developed on future projects but also serve as a personal tool as I found reminders on phones lacking in some areas despite some offering encryption and hope others may find some use in it too.

---

## Demo

This section is intentionally left as a placeholder so you can add your latest media.

- TODO: Add short product walkthrough video/GIF
- TODO: Add onboarding + E2EE flow demo
- TODO: Add habit creation/completion flow demo

---

## Screenshots

This section is intentionally left as a placeholder so you can add up-to-date images.

- TODO: Landing page screenshot
- TODO: Dashboard (daily + calendar views) screenshot
- TODO: Settings + E2EE vault screenshot
- TODO: Mobile notification screenshot

---

## Current Feature Set

- Habit CRUD with recurrence schedules (`daily`, weekdays, weekends, custom day combos)
- Completion logging by date with streak calculations
- Streak freezes + achievements
- Optional push reminder notifications per device
- Account sessions management (list active sessions, revoke individual sessions, logout others)
- Email verification + password reset flows
- Optional Daily Spark toggle
- Optional account-wide E2EE:
  - passphrase-derived key (PBKDF2 + AES-GCM)
  - encrypted habit names/notes
  - vault lock/unlock behavior on client
  - passphrase change and disable flows

## Security & Privacy Posture (Current)

- Server-side session auth with CSRF protection on mutating requests
- Session cookie hardening controls (`COOKIE_SECURE`, `COOKIE_SAMESITE`, host-only cookie support)
- Optional encrypted session payload key (`SESSION_ENCRYPTION_KEY`)
- Privacy minimization:
  - legacy raw session/push metadata scrubbed at startup
  - session persistence avoids storing raw IP/user-agent values
- SQL injection guard script included
- Automated security scans in test workflow (`gosec`, `govulncheck`, `npm audit`)

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | styled-components + CSS |
| Backend | Go + Gin + GORM |
| Auth | Cookie-backed sessions |
| Database | PostgreSQL (Supabase-compatible) |
| Push | Web Push (VAPID) + service worker |
| Reverse proxy / TLS | Caddy |
| Containers | Docker / Docker Compose |

## Architecture

```text
Browser
  └── Caddy (TLS + routing)
        └── Frontend container (Vite/nginx build output)
              └── /api/* -> Go backend
                            └── PostgreSQL
```

In local frontend development, Vite proxies `/api` to the backend.

---

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Go 1.25+
- PostgreSQL (or Supabase project)

### Setup

1. Copy `.env.example` to `.env` and fill values.
2. Start backend:

```bash
cd backend
go run .
```

3. Start frontend:

```bash
cd stokely-frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`, backend to `http://localhost:9090`.

---

## Testing & Quality Gates

### Backend

```bash
cd backend
go test ./...
```

```bash
./scripts/check-sql-injection-guard.sh
```

```bash
cd backend
$(go env GOPATH)/bin/gosec ./...
$(go env GOPATH)/bin/govulncheck ./...
```

### Frontend

```bash
cd stokely-frontend
npm run build
npm run test:run
```

### End-to-End (Playwright)

```bash
cd stokely-frontend
npm run test:e2e
```

### Dependency Audit

```bash
cd stokely-frontend
npm audit --omit=dev
```

---

## Deployment

Thiss is due to the current VM limitation. With enough RAM and CPU, ideally build on the machine or through Github Actions/other CI tooling

Build and push images:

```bash
./deploy.sh
```

Run production compose on server:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Environment Variables

See `.env.example` for the complete list.

### Required

| Variable | Description |
|---|---|
| `DB_DSN` | PostgreSQL connection string |
| `SESSION_SECRET` | 32+ char session signing secret |
| `FRONTEND_ORIGIN` | Allowed frontend origin |
| `COOKIE_SECURE` | `true` in production |

### Session/Cookie Hardening

| Variable | Description |
|---|---|
| `SESSION_ENCRYPTION_KEY` | Base64 key (16/24/32 byte decoded) for encrypted session payloads |
| `COOKIE_DOMAIN` | Optional cookie domain (leave empty for host-only) |
| `COOKIE_SAMESITE` | `lax` / `strict` / `none` |

### Push Notifications (Optional)

| Variable | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | Public VAPID key |
| `VAPID_PRIVATE_KEY` | Private VAPID key |
| `VAPID_EMAIL` | Contact email / subscriber subject |

---

## Notes

- E2EE passphrases are not recoverable by the server.
- If data was encrypted with an old/unknown key layer, it may not be recoverable.
- Privacy Policy is available in-app from the landing page.
