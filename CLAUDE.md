# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is HomeFix

Geo-located home services marketplace for Bangladesh. Connects **Residents** (homeowners/tenants) with verified **Providers** (plumbers, electricians, painters, etc.) for service requests. An **Admin** manages verifications, service catalog, and revenue. Key differentiators: voice-first accessibility, localized MFS payments (bKash/Nagad), configurable platform commission with provider wallet (default 20%, admin-adjustable per category or promotion), area-based pricing for services like painting.

Full SRS is in `Homefix.pdf`. Domain summaries are in `docs/brd/`.

## Workspace Map

| Directory | Stack | Sprint Status |
|-----------|-------|--------------|
| `backend/` | Node 20 · Express 5 · TypeScript · PostgreSQL + PostGIS | Active (S0–S8) |
| `mobile/` | Expo SDK 53 · React Native · Expo Router v4 | Sprint 1 complete |
| `web/` | Next.js 15 App Router | Sprint 7 (not started) |
| `packages/shared/` | Shared Zod schemas · types · constants · i18n | Active |

## Commands

```bash
# Backend (run from backend/)
npm run dev             # Hot reload dev server — loads .env.development
npm run type-check      # TypeScript check without emit
npm run migrate:latest  # Run pending DB migrations
npm run migrate:make    # Create a new migration file

# Docker (run from repo root)
make up       # Build images and start all services (use after dependency changes)
make start    # Start existing images without rebuilding (day-to-day use)
make down     # Stop services
make logs     # Tail backend logs
make migrate  # Run migrations inside container
make db       # Open psql shell (homefix DB)
make shell    # Shell into backend container
make clean    # Remove containers and all named volumes
```

## Key Documentation

| File | Purpose |
|------|---------|
| [docs/implementation_plan.md](docs/implementation_plan.md) | Sprint roadmap · 82 tickets · status tracking · SRS traceability |
| [docs/engineering_standards.md](docs/engineering_standards.md) | Naming conventions · code quality · git conventions · testing strategy |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design · domain model · job state machine · auth flow |
| [docs/API_GUIDELINES.md](docs/API_GUIDELINES.md) | API contract · versioning policy · Swagger rules |
| [docs/DB_GUIDELINES.md](docs/DB_GUIDELINES.md) | Migration patterns · Objection.js · PostGIS · transactions |
| [docs/SECURITY_RULES.md](docs/SECURITY_RULES.md) | Auth guards · JWT lifecycle · forbidden patterns |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker dev setup · environment management |
| [docs/SESSION_CONTEXT.md](docs/SESSION_CONTEXT.md) | Prompt template to paste at the start of a new session |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Quick start · Definition of Done · PR checklist for all platforms |
| [backend/CLAUDE.md](backend/CLAUDE.md) | Backend layer patterns · path aliases · module checklist |
| [mobile/CLAUDE.md](mobile/CLAUDE.md) | Expo Router · Zustand · design tokens · i18n · forbidden patterns |

## Global Rules

- **Commits:** Conventional Commits — `feat|fix|refactor|chore|docs(scope): message`
- **Branches:** `feature/HF-XXX-short-description` or `bugfix/HF-XXX-short-description`
- **Bilingual:** Every user-facing string needs both `bn` (default) and `en` keys in i18n files
- **TypeScript:** `strict: true` everywhere — no `any` without an explanatory comment
- **Shared code:** Types, constants, and Zod schemas shared across apps live in `packages/shared/` — never duplicate

## Session Workflow

When starting a new session, paste the content of [docs/SESSION_CONTEXT.md](docs/SESSION_CONTEXT.md). It tells Claude which sprint is active, what to read first, and how to track ticket progress.
