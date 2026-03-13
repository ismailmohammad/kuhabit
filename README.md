# Stokely

> Build your streaks. Stoke your momentum.

A full-stack habit tracking app for people who want to build good habits and break bad ones. Track **build** habits (things you want to do more of) and **curb** habits (things you want to eliminate), watch your streaks grow, and earn achievements along the way.

Live at [stokely.quest](https://stokely.quest)

---

## Features

**Build Habits**
Track positive habits you want to reinforce — daily, weekdays, weekends, or any custom combination of days.

**Curb Habits**
Mark negative habits you're working to eliminate. The longer you stay disciplined, the hotter your streak gets.

**Flexible Recurrence**
Set any habit to repeat on a fully custom day schedule: daily, weekdays, weekends, or a specific subset.

**Streaks & Streak Freezes**
Every completed habit day adds to your streak. Miss a day and your streak breaks — unless you have a Streak Freeze. Earn 1 freeze automatically every 7-day milestone. Freezes apply automatically on missed days.

**Achievements**
Unlock milestone badges as your consistency grows across your habit history.

**Daily Spark (Kindling)**
An optional motivational message shown on login to set the tone for the day. Can be toggled in settings.

**Push Notifications**
Optional per-habit reminders via Web Push. Works on desktop and mobile — no app install required.

**Private by Design**
No tracking, no ads, no third-party data sharing. Your habits are yours.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | styled-components + plain CSS |
| Backend | Go + Gin |
| Auth | Session-based (gorilla/sessions cookie store) |
| Database | Supabase (PostgreSQL) via GORM |
| Reverse proxy / SSL | Caddy (automatic Let's Encrypt) |
| Containerization | Docker Compose |
| Hosting | Oracle Cloud Free Tier (A1 ARM) |

### Architecture

```
Browser
  └── Caddy (443/80, auto SSL, security headers)
        └── nginx (serves React SPA)
              └── /api/* → Go backend (:9090)
                            └── Supabase PostgreSQL
```

In development, Vite proxies `/api` directly to `localhost:9090`.

---

## Local Development

Copy `.env.example` to `.env` and fill in your values.

```bash
# Frontend — Vite dev server on :5173, proxies /api → localhost:9090
cd stokely-frontend && npm install && npm run dev

# Backend — requires DB_DSN and SESSION_SECRET in .env
cd backend && go run .
```

TypeScript check: `cd stokely-frontend && ./node_modules/typescript/bin/tsc --noEmit`

SQL injection guard scan (backend query construction patterns):
`./scripts/check-sql-injection-guard.sh`

---

## Production Deployment

Build and push images to Docker Hub (reads `DOCKER_USERNAME` from `.env`):

```bash
./deploy.sh
```

On the server, pull and restart:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### First-time server setup

1. Provision an Oracle Cloud VM (A1.Flex ARM, 2 OCPU / 12 GB recommended)
2. Open ports 80 and 443 in the VCN Security List (Source Port Range: All)
3. Open ports in iptables: `sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT` (same for 443), then `sudo netfilter-persistent save`
4. Install Docker: `curl -fsSL https://get.docker.com | sh`
5. Point your domain's A record to the server IP
6. Clone the repo, create `.env`, run `docker compose -f docker-compose.prod.yml up -d`
7. Caddy obtains the SSL cert automatically via Let's Encrypt

---

## Environment Variables

See `.env.example` for all variables. Required:

| Variable | Description |
|---|---|
| `DB_DSN` | Supabase PostgreSQL connection URI |
| `SESSION_SECRET` | Random 32+ character string (`openssl rand -base64 32`) |
| `FRONTEND_ORIGIN` | Allowed CORS origin (e.g. `https://stokely.quest`) |
| `COOKIE_SECURE` | Set `true` in production (enforces HTTPS-only cookies) |
| `DOCKER_USERNAME` | Docker Hub username for `deploy.sh` |

Cookie/session settings:

| Variable | Description |
|---|---|
| `SESSION_ENCRYPTION_KEY` | Base64 key for encrypted session payloads (decoded length 16/24/32 bytes). Strongly recommended in production (`openssl rand -base64 32`). |
| `COOKIE_DOMAIN` | Leave empty for host-only cookies (recommended). Set only if you intentionally need cross-subdomain cookies. |
| `COOKIE_SAMESITE` | `lax` (recommended), `strict`, or `none`. If `none`, backend requires `COOKIE_SECURE=true`. |

Optional (Web Push notifications):

| Variable | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same as above |
| `VAPID_EMAIL` | Contact email for push service |

### Security Requirements

- Stateful authenticated API requests require a CSRF token (`X-CSRF-Token`) in addition to the session cookie.
- In production, use HTTPS with `COOKIE_SECURE=true`.
- Do not use a short `SESSION_SECRET` (must be 32+ characters).
- Legacy numeric `users.id` schemas are no longer auto-migrated or auto-dropped. Backend fails closed until a manual UUID migration/reset is completed.

---

---

# OBSOLETE — content below has not been updated and will be cleaned up later along with a few more additions to the project.

---

# stokely
Basic habit tracking application leveraging containerization and Kubernetes
## Queue your habits, Cue your habits

# Early Video Demo - Frontend
https://github.com/ismailmohammad/stokely/assets/23105842/e39eee8f-cea9-4dec-a376-7ea75df06d21


# Early Screenshots

![image](https://github.com/ismailmohammad/stokely/assets/23105842/78e2e594-e45b-4b35-b83d-460d515aae3f)
![Screenshot from 2024-05-30 16-30-12](https://github.com/ismailmohammad/stokely/assets/23105842/67fe6903-2d30-49a4-97c3-632135208e6b)
![Screenshot from 2024-05-30 16-30-21](https://github.com/ismailmohammad/stokely/assets/23105842/38ead4da-49ef-4415-86c7-c3d792db05a3)


Basic session authentication

Stack to be used:
- Frontend:
    - React
- Backend:
    - Go
- Database:
    - Postgres/Supabase
- DevOps:
    - Tests with Cypress
    - Containerization
    - Kubernetes
