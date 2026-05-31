# Contributing to HomeFix

> Read [CLAUDE.md](CLAUDE.md) before writing any code.
> All conventions below are expected in every PR.

---

## Quick Start

### Backend + Database (Docker)

```bash
cp backend/.env.sample backend/.env.development   # first time only
ln -sf backend/.env.development .env              # first time only — repo-root symlink for docker compose

make up       # Start Postgres + backend — migrations run automatically before server boots
make seed     # First time only — populates roles, permissions, categories, admin user
make restart  # After seeding — reloads the RBAC permission cache (otherwise all protected routes return 403)
make logs     # Tail backend logs
make db       # Open psql shell
make shell    # Shell into backend container
make clean    # Wipe containers + volumes (fresh start)
```

> **Always use `make` commands — never `docker compose up` directly.** The Makefile passes the correct `--env-file` so the postgres container gets `DB_NAME=homefix`. Running `docker compose` raw without the env file creates a `postgres` database instead of `homefix` and your data becomes unreachable. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full explanation.

### Mobile (Expo)

```bash
cd mobile
npm install
npx expo start          # Start Expo dev server
npx expo start --android
npx expo start --ios
```

### Web (Next.js — Sprint 7)

```bash
cd web
npm install
npm run dev             # http://localhost:3000
```

### Type Checking (all platforms)

```bash
npm run type-check --workspace=backend
npm run type-check --workspace=mobile
npm run type-check --workspace=web
# or from root:
npm run type-check --workspaces --if-present
```

---

## Branching & Commits

- Branch from `master`; name: `feature/HF-<N>-<slug>` or `bugfix/HF-<N>-<slug>`.
- Every commit references its ticket: `feat(auth): add refresh token rotation (HF-016)`.
- Conventional Commits: `feat | fix | refactor | chore | docs`.
- One logical change per commit. Open a PR against `master`.

Full conventions: [docs/engineering_standards.md §6](docs/engineering_standards.md).

---

## Definition of Done

A ticket is **Done** only when **all applicable** boxes are checked:

### All Platforms
- [ ] `tsc --noEmit` passes with zero errors.
- [ ] No `any` types without an explanatory comment.
- [ ] Ticket marked ✅ in [docs/implementation_plan.md](docs/implementation_plan.md) and **Current Focus** table updated.
- [ ] New environment variables added to `.env.sample` with a placeholder value.
- [ ] New logic in `packages/shared/` (Zod schemas, utils) has Jest unit tests with 100% branch coverage.

### Backend
- [ ] New module follows `route → controller → service → repository → model` — no layer skipped.
- [ ] Every new API endpoint has an `@openapi` JSDoc comment visible in Swagger (`/docs`).
- [ ] Every new DB table/column has a Knex migration with a working `down()` rollback.
- [ ] Protected routes use `authGuard` (and `permissionGuard` if RBAC applies).
- [ ] No `process.env` reads outside `src/config/env.ts`.
- [ ] New service has unit tests (Jest) covering the happy path and key error branches.
- [ ] New API routes have integration tests (Supertest) covering: success, 401 unauthenticated, and validation failure.

### Mobile
- [ ] Screen tested at small device size (≤ 375px wide).
- [ ] `KeyboardAvoidingView` + `ScrollView` used on all forms.
- [ ] Touch targets ≥ 48px.
- [ ] No inline style literals — theme tokens used throughout.
- [ ] Auth tokens stored in `expo-secure-store` only — never `AsyncStorage`.
- [ ] API calls go through `services/` — no direct Axios calls in screens.
- [ ] New service functions have Jest unit tests (mocked API layer) covering happy path and error states.
- [ ] New screens with user interaction have React Native Testing Library tests covering the primary user action.

### Web
- [ ] Responsive verified at 375 / 768 / 1440 px breakpoints.
- [ ] Light + dark mode verified.
- [ ] Auth uses httpOnly cookies — no tokens in localStorage.
- [ ] SSR-safe: no `window`/`document` access in server components.
- [ ] New client components with user interaction have React Testing Library tests covering the primary user action.
- [ ] Critical user flows (auth, booking, payment) covered by Playwright E2E tests added or updated.

### All User-Facing Work (Mobile + Web)
- [ ] Both `bn` (Bengali default) and `en` translation keys added for every new string.
- [ ] Currency displayed as ৳ (Taka) — stored as integer paisa internally.

---

## Adding a New Backend Module

Every new domain (e.g. `jobs`, `categories`) needs these files under `backend/src/modules/<name>/`:

```
*.route.ts        ← Router + @openapi JSDoc
*.controller.ts   ← HTTP only (req/res) — no business logic
*.service.ts      ← Business logic — no Express, no Knex
*.repository.ts   ← DB queries via Objection.js — no business logic
*.model.ts        ← Objection.js tableName + relationMappings
*.schema.ts       ← Zod validation schemas
*.dto.ts          ← Request/response transfer types
*.types.ts        ← Domain types
```

Register the router in `backend/src/routes/v2/index.ts`.
Add new error codes to `backend/src/errors/error-code.ts`.

Full patterns: [backend/CLAUDE.md](backend/CLAUDE.md).

---

## Adding a New Mobile Screen

Screens live in `mobile/app/` (Expo Router file-based routing). For each new screen:

1. Create the file at the right route path: `app/(app)/(bookings)/[id].tsx`
2. Keep the screen component thin — state in Zustand stores, server data via TanStack Query
3. API calls go through `mobile/services/<domain>.service.ts`
4. Use design tokens from `mobile/theme/` — no inline style literals
5. Add i18n keys to `mobile/i18n/bn.json` and `mobile/i18n/en.json`

Full patterns: [mobile/CLAUDE.md](mobile/CLAUDE.md).

---

## Adding a New Web Page / Admin Feature

> Web development begins in Sprint 7. This section will be expanded then.

Pages live in `web/app/` (Next.js App Router). Key rules:
- Use Server Components by default; opt into `'use client'` only when needed
- Admin panel routes go under `web/app/admin/`
- Auth uses httpOnly cookies — see [web/CLAUDE.md](web/CLAUDE.md)

---

## Database Migrations

```bash
# Create a new migration (from backend/)
npm run migrate:make -- <describe_change>

# Apply (inside Docker)
make migrate

# Apply (outside Docker, from backend/)
npm run migrate:latest
```

Every migration must:
- Have a working `down()` rollback
- Never be edited after being committed — create a new one instead
- Put PostGIS geometry columns with a `CREATE INDEX … USING GIST` in the same migration

Full rules: [docs/DB_GUIDELINES.md](docs/DB_GUIDELINES.md).

---

## i18n

- Never hardcode user-facing strings — use `t('key')` in mobile/web.
- Every key in `i18n/en.json` must also exist in `i18n/bn.json` (Bengali is the default locale).
- Currency always displays as ৳ (Taka); amounts stored as integer paisa.

---

## Security Checklist

Before any PR touching auth, payments, or user data:

- [ ] No sensitive fields (`password_hash`, NID, token) returned in API responses.
- [ ] New protected routes use `authGuard` (and `permissionGuard` for RBAC).
- [ ] Input validated at the controller boundary via `validate(zodSchema)`.
- [ ] Mobile: tokens in `expo-secure-store` only, not in Zustand persist or logs.

Full rules: [docs/SECURITY_RULES.md](docs/SECURITY_RULES.md).

---

## Questions?

Open an issue or start a discussion. Do not push directly to `master`.
See [docs/SESSION_CONTEXT.md](docs/SESSION_CONTEXT.md) for the current sprint and active tickets.
