# HomeFix — Deployment Guide

## Docker Dev Environment

Three services defined in `docker-compose.yml`:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgis/postgis:16-3.5 | 5432 | Primary database (PostGIS enabled via `docker/init/01_enable_postgis.sql`) |
| `backend` | built from `backend/Dockerfile.dev` | 4000 | Express API (hot reload) |

### First-Time Setup

```bash
# 1. Env file must exist (Docker reads it via env_file)
cp backend/.env.sample backend/.env.development

# 2. Build images and start — migrations run automatically before the server boots
make up
```

> `make up` runs `npm run migrate:latest` inside the backend container before starting nodemon. On a fresh DB this applies all migrations. On subsequent restarts it is a no-op (already up-to-date).

```bash
# Only needed after pulling new migrations without restarting the container
make migrate
```

### Makefile Commands

| Command | What it does |
|---------|-------------|
| `make up` | Build images + start all services (foreground logs) — use on first run or after dependency changes |
| `make start` | Start existing images without rebuilding — use for day-to-day restarts |
| `make down` | Stop and remove containers |
| `make restart` | Restart only the backend container |
| `make logs` | Tail backend container logs |
| `make db` | Open psql shell inside the postgres container |
| `make migrate` | Run `knex migrate:latest` inside the backend container |
| `make seed` | Run DB seeds inside the backend container |
| `make shell` | Open a shell inside the backend container |
| `make clean` | Remove containers + **all named volumes** (destroys DB data) |

### How Hot Reload Works

The entire monorepo root is mounted at `/app` inside the container. Named Docker volumes shadow the host's `node_modules` (both root and `backend/`) so that Linux-compiled native binaries (bcrypt) are used instead of the host OS binaries.

Nodemon watches `src/**/*.ts` and restarts when files change.

### DB_HOST Override

`docker-compose.yml` sets `DB_HOST: postgres` in the `environment:` section. This overrides the `DB_HOST=localhost` in `.env.development` because dotenv does not overwrite pre-set environment variables.

## Environment Files

| File | Used when |
|------|----------|
| `.env.development` | Local dev (both Docker and direct `npm run dev`) |
| `.env.test` | Test runs |
| `.env.production` | Production server |

The app loads `.env.${NODE_ENV}` on startup (see `src/config/env.ts`). Never commit `.env.*` files (except `.env.sample`).

## Mobile Dev (Expo Go on Physical Device)

### One-time WSL2 setup (already done on this machine)

WSL2's mirrored networking mode is enabled in `C:\Users\ACER\.wslconfig`. This makes WSL2 share the Windows host network directly — your phone on WiFi can reach WSL2 services without any port forwarding.

If setting up on a **new machine**, add this to `C:\Users\<username>\.wslconfig` on Windows:

```ini
[wsl2]
networkingMode=mirrored
```

Then run `wsl --shutdown` in Windows cmd/PowerShell and reopen WSL2. This is permanent — no repeat setup needed after reboots.

### Start Expo

Find your Windows WiFi IP (run `ipconfig` in Windows cmd, look for the Wi-Fi adapter IPv4 — e.g. `192.168.0.102`). Then:

```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<windows-wifi-ip> npx expo start --host lan
```

| Client | How to connect |
|--------|---------------|
| Expo Go (phone, same WiFi) | Scan QR code printed in terminal |
| Windows browser | `http://localhost:8081` |
| Other devices on same WiFi | `http://<windows-wifi-ip>:8081` |

> The mobile API client auto-detects the backend URL from Expo's `hostUri`, so `http://<windows-wifi-ip>:4000/api` is used automatically — no manual config needed.

## Production Targets (Planned — Sprint 8)

| Component | Target | Region |
|-----------|--------|--------|
| Backend API | Railway | Singapore (low latency to Dhaka) |
| PostgreSQL | Supabase (managed) | Singapore |
| File storage | AWS S3 | Mumbai region |
| Redis | Upstash (serverless) | Singapore |
| Mobile app | EAS Build → Google Play + App Store | — |
| Web + Admin | Vercel | CDN (global) |
| Push notifications | Firebase FCM | — |

Production deployment runbook will be written as part of HF-083 (Sprint 8).
