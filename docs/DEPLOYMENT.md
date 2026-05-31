# HomeFix — Deployment Guide

## Docker Dev Environment

Three services defined in `docker-compose.yml`:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgis/postgis:17-3.5 | 5432 | Primary database (PostGIS enabled via `docker/init/01_enable_postgis.sql`) |
| `backend` | built from `backend/Dockerfile.dev` | 4000 | Express API (hot reload) |

> **Rule: always use `make` commands — never run `docker compose` directly.**
>
> `docker-compose.yml` uses `${DB_NAME}`, `${DB_USER}`, `${DB_PASSWORD}` for the postgres service. These must be resolved from `backend/.env.development`. The Makefile passes `--env-file backend/.env.development` on every call. Running `docker compose up` raw (without make) leaves the vars empty — postgres silently initialises with the default `postgres` database instead of `homefix`, and all your data is unreachable. The compose file now uses `${DB_NAME:?…}` fail-loud syntax and loads `env_file` on the postgres service as a second safety layer, but the make rule is still the right habit.

### First-Time Setup

```bash
# 1. Copy env file
cp backend/.env.sample backend/.env.development
# Fill in DB_NAME, DB_USER, DB_PASSWORD, JWT secrets, DEFAULT_ADMIN_* values

# 2. Create the repo-root .env symlink (one-time — already done on this machine)
#    docker-compose picks this up automatically so 'docker compose up' also works
ln -sf backend/.env.development .env

# 3. Build images and start all services
#    → waits for postgres to be healthy
#    → runs all pending migrations automatically
#    → starts the dev server (nodemon)
make up

# 4. Seed reference data (roles, permissions, categories, admin user)
#    Run this ONCE after the first make up on a fresh database
make seed
```

> **Why two steps?** Migrations are schema changes (DDL — create/alter tables) and run automatically every time the backend container starts. Seeds are reference data (roles, categories, admin user) and must be run explicitly — they are idempotent so running `make seed` more than once is safe.

#### What `make up` does automatically

```
make up
  └─→ Build backend image
  └─→ Start postgres (waits until healthcheck passes)
  └─→ Start backend container:
        npm run migrate:latest   ← applies all pending migrations
        npm run dev              ← starts nodemon hot-reload server
```

Tables are created during `npm run migrate:latest`. No separate `make migrate` needed on the first run.

#### What `make seed` populates

| Seed file | Data |
|-----------|------|
| `01_roles_permissions` | 3 roles (resident, provider, admin) + 10 permission codes + default role→permission assignments |
| `02_categories` | 10 bilingual service categories (English + Bengali, `requires_area` flagged for painting/masonry/cleaning/waterproofing) |
| `03_admin` | Default admin user from `DEFAULT_ADMIN_*` env vars |

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
| `make migrate` | Run `knex migrate:latest` inside the backend container (schema only — no data) |
| `make seed` | Populate reference data: roles, permissions, categories, admin user (idempotent) |
| `make shell` | Open a shell inside the backend container |
| `make clean` | Remove containers + **all named volumes** (destroys DB data) |

### How Hot Reload Works

The entire monorepo root is mounted at `/app` inside the container. Named Docker volumes shadow the host's `node_modules` (both root and `backend/`) so that Linux-compiled native binaries (bcrypt) are used instead of the host OS binaries.

Nodemon watches `src/**/*.ts` and restarts when files change.

### DB_HOST Override

`docker-compose.yml` sets `DB_HOST: postgres` in the `environment:` section of the backend service. This overrides the `DB_HOST=localhost` in `.env.development` because a pre-set env var is never overwritten by `env_file`.

### Root `.env` symlink

A `.env` symlink at the repo root points to `backend/.env.development`:

```
.env  →  backend/.env.development
```

`docker compose` automatically loads `.env` from the working directory. This means both `make up` and a raw `docker compose up` resolve `${DB_NAME}` correctly. The symlink is gitignored (`.env` and `.env.*` are in `.gitignore`). Recreate it on a new machine with:

```bash
ln -sf backend/.env.development .env
```

## Environment Files

| File | Used when |
|------|----------|
| `backend/.env.development` | Local dev (Docker + direct `npm run dev`). Symlinked from `.env` at repo root. |
| `backend/.env.test` | Test runs (`NODE_ENV=test`) |
| `backend/.env.production` | Production server |

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
