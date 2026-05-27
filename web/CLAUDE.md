# CLAUDE.md — Web

This file provides web-specific guidance. See root [CLAUDE.md](../CLAUDE.md) for global rules.

> **Status:** Sprint 7 (not started). This file will be expanded when Sprint 7 begins.

## Planned Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| State | Zustand (same pattern as mobile) |
| Server state | TanStack Query |
| Styling | Vanilla CSS + CSS Modules |
| Auth | Cookie-based (httpOnly) — differs from mobile |
| i18n | next-intl (SSR-compatible) |
| API | Shared Axios patterns from `packages/shared/` |

## Key Differences from Mobile

- Auth uses **httpOnly cookies** (not SecureStore) — more secure for web
- SSR/SSG available via Next.js — use for public pages (landing, provider profiles)
- Admin panel lives here (Sprint 7: HF-068 to HF-071)

## Admin Panel Scope (Sprint 7)

- Provider verification (approve/reject + NID photo preview)
- Service category management (CRUD, `requires_area` flag)
- Revenue dashboard (total platform commissions)
- User management (list, search, status change)
