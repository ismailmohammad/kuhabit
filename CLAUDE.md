# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stokely is a full-stack habit tracking app. Users register/login with session auth, then track "build" (positive) and "curb" (negative) habits with flexible daily recurrence. Containerized with Docker Compose.

**Stack:** React 18 + TypeScript + Vite (frontend) · Go + Gin (backend) · Supabase (PostgreSQL) + GORM · Session-based auth (gorilla/sessions via gin-contrib/sessions)

## Commands

### Frontend (`stokely-frontend/`)
```bash
npm run dev       # Start Vite dev server (proxies /api → localhost:9090)
npm run lint      # ESLint (zero-warnings policy)
```
TypeScript is checked via `./node_modules/typescript/bin/tsc --noEmit` (note: `tsc` global not available in this WSL env).

### Backend (`backend/`)
```bash
go run .          # Start server on :9090 (requires MySQL at localhost:3306)
go build ./...    # Compile check
go mod tidy       # Update dependencies after go.mod changes
```

### Docker (root)
```bash
docker compose up --build   # Build and start frontend + backend + MySQL
docker compose down -v      # Stop and remove volumes
```

## Architecture

### Data Flow
Browser → nginx (port 80) → `/api/*` proxied to backend:9090 · static assets served directly from nginx.
In dev, Vite proxies `/api` to `localhost:9090` (see `vite.config.ts`).

### Secrets
Secrets are loaded via environment variables. Copy `.env.example` → `.env` (git-ignored) and fill in values. Docker Compose reads `.env` automatically for `${VAR}` substitution. **Never commit `.env`.**

Required env vars: `DB_DSN` (Supabase PostgreSQL URI), `SESSION_SECRET` (32+ char random string).

### Backend (`backend/`)
Three files:
- `main.go` — Gin setup, CORS, session store, route registration, `getEnv` helper
- `models.go` — GORM models: `User` (username required/unique, email optional nullable, bcrypt password) and `Habit` (UserID FK, name, complete, recurrence, positiveType). `AutoMigrate` runs on startup.
- `handlers.go` — All route handlers + `requireAuth` middleware (reads session userID, loads User into context)

**API routes** (all under `/api`):
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST /habits`, `PUT /habits/:id`, `DELETE /habits/:id` (all require auth)

Session stores `userID` as a string in a gorilla/sessions cookie store.

### Frontend (`stokely-frontend/src/`)
- **`api/api.ts`** — Typed fetch wrapper. All calls use `credentials: 'include'` for cookie sessions. Single source of truth for API shape.
- **`types/habit.d.ts`** — `HabitType` and `UserInfo` interfaces shared across app.
- **`redux/store.ts`** — Single `user` slice storing `UserInfo | null`. Exports `RootState` and `AppDispatch` types.
- **`components/Header.tsx`** — Reads Redux user state; shows Login/Register when logged out, Dashboard/Logout when logged in.
- **`components/Dashboard/Dashboard.tsx`** — Fetches habits from API on mount; also calls `GET /auth/me` to rehydrate Redux user on page refresh. Separates habits into "To Do" / "Completed" sections. Stable logo map prevents icons re-randomizing on re-render.
- **`components/Dashboard/NewHabitModal.tsx`** — Handles both create and edit via `habitToEdit` prop. Recurrence presets: Daily / Weekdays / Weekends / Custom (day checkboxes).
- **`components/Dashboard/Habit.tsx`** — Clicking the cube toggles `complete` (optimistic update with rollback on error).

### Routing
React Router v6 with `createBrowserRouter`. Routes: `/`, `/dashboard`, `/login`, `/register`. The dashboard redirects to `/login` if `GET /auth/me` returns 401.

### Containerization
- `backend/Dockerfile` — Multi-stage Go build → alpine runtime
- `stokely-frontend/Dockerfile` — Multi-stage Node build → nginx:alpine
- `stokely-frontend/nginx.conf` — Serves SPA with `try_files`, proxies `/api/` to `http://backend:9090/api/`
- `docker-compose.yml` — `backend` + `frontend` only (no local DB — Supabase is the external PostgreSQL host)

### Habit Model
`recurrence` is a dash-separated string of 2-letter day codes: `"Su-Mo-Tu-We-Th-Fr-Sa"` (Daily), `"Mo-Tu-We-Th-Fr"` (Weekdays), `"Su-Sa"` (Weekends), or any custom subset. `positiveType: true` = build habit (green cubes); `false` = curb habit (red cubes). `complete` is a user-toggled boolean (no automatic daily reset).

### Styling
Dark-first design (`#121212` background). Styled-components for layout components, plain CSS for card/form/modal details. All layouts are mobile-responsive with media queries at 480px and 720px breakpoints. `clamp()` used for fluid typography.
