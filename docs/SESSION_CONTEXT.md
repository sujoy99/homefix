# HomeFix — Session Context

> **How to use:** Copy everything below the line and paste it as your first message when starting a new Claude Code session. Update the "Current Sprint" section before each sprint.

---

## Paste This at the Start of a New Session

---

I'm working on **HomeFix** — a geo-located home services marketplace for Bangladesh. Monorepo: `backend/` (Node 20 + Express + TypeScript + PostgreSQL + PostGIS), `mobile/` (Expo SDK 53 + React Native + Expo Router v4), `web/` (Next.js 15, Sprint 7), `packages/shared/` (shared types/schemas/constants).

### Read these files first (in order):

1. `CLAUDE.md` — repo overview, commands, global rules
2. `docs/implementation_plan.md` — all tickets, sprint status, SRS traceability
3. `docs/engineering_standards.md` — naming, structure, code quality rules

**For backend work also read:**
- `backend/CLAUDE.md` — layer patterns, path aliases, error/response patterns
- `docs/SECURITY_RULES.md` — auth guards, JWT rules, forbidden patterns
- `docs/DB_GUIDELINES.md` — migrations, Objection.js, PostGIS

**For mobile work also read:**
- `mobile/CLAUDE.md` — Expo Router, Zustand, design tokens, forbidden patterns
- `docs/API_GUIDELINES.md` — response envelope, error codes, Swagger rules

**For architecture/system questions read:**
- `docs/ARCHITECTURE.md` — domain model, job state machine, auth flow, platform settings, toast system

---

### What Has Been Built (Sprints 0–2)

**Sprint 0 — Foundation:** Docker + PostgreSQL + PostGIS, Knex migrations, Express 5 skeleton, Winston logging, JWT infrastructure, shared package scaffold.

**Sprint 1 — Auth:**
- Backend: user registration + login (password method), JWT access/refresh tokens, device tracking, admin approval flow, RBAC permission cache.
- Mobile: Onboarding carousel, Login (mobile/email tabs), 5-step Provider registration (basic info → location → password → documents → skills), Resident 3-step registration, pending approval screen, Zustand auth store, token refresh interceptor.
- Fixes: GPS map picker (step 2), language toggle on all auth screens, localized API error codes, provider skills at registration, test infra (jest-expo v54).

**Sprint 2 — Home + Categories:**
- Backend: Service categories module (CRUD + `requires_area`), Provider profile + skills, Provider approval API, File storage (local disk, S3-ready).
- Mobile: Stack+Tabs navigation (Resident: Home/Bookings/Profile, Provider: Home/Jobs/Profile, Admin: Approvals/Profile), Resident home screen (category grid, search, available providers), Category listing (sort by rating/experience/rate), Provider detail screen, Provider dashboard (availability toggle), Profile screen.
- Enhancements: My Services multi-select modal (bottom-sheet, primary badge), logout redesigned as red card-row, **Toast notification system** (red=error, green=success — replaces Alert.alert for all non-confirmation messages), NID front + back photo upload (both required), camera-only policy for NID (admin-configurable), **Platform Settings** module (`GET /v2/config/public`, `platform_settings` table, `PlatformSettingKey` + `NidPhotoSource` enums in `packages/shared`).
- Test docs: `docs/TESTING_SPRINT1_MOBILE.md`, `docs/TESTING_SPRINT2_MOBILE.md`.

**Seed accounts (always available after `make seed`):**

| Role | Mobile | Password |
|------|--------|----------|
| Admin | `00000000000` | `Admin@1234` |
| Provider (active) | `01711223344` | `Provider@1234` |
| Resident (active) | `01811223344` | `Resident@1234` |

---

### Current Sprint

**Sprint:** Sprint 3 — Booking & Job Lifecycle  
**Status:** ⏳ Not Started  
**Branch convention:** `feature/HF-XXX-short-description`  
**Active git branch:** `feature/sprint-2-mobile` (Sprint 2 work — merge to master before starting Sprint 3)

**Backend tickets (start here):**
- HF-031 ⏳ Job/Booking module — state machine (`Pending → Active → Awaiting Payment → Paid`, REQ-015 to REQ-018)
- HF-032 ⏳ Location-based provider search (PostGIS `ST_DWithin` + `ST_Distance`, REQ-007,008)
- HF-033 ⏳ Job media storage (photos, videos, voice notes — REQ-010)

**Mobile tickets (after backend HF-031 is done):**
- HF-034 ⏳ Create booking flow (category → describe → photos → address → date → budget)
- HF-035 ⏳ Area input — conditional sq. footage when `requires_area` (REQ-006)
- HF-036 ⏳ Service address input — separate from home address (REQ-008,009)
- HF-037 ⏳ Resident bookings list (Upcoming, Active, Awaiting Payment, Completed)
- HF-038 ⏳ Provider job feed — available jobs by trade, sorted by distance (REQ-015)
- HF-039 ⏳ Job accept/reject for provider (REQ-016)
- HF-040 ⏳ Job status tracking card (real-time updates)
- HF-041 ⏳ Provider marks "Work Complete" → Awaiting Payment (REQ-017)

**Known deferred items to keep in mind during Sprint 3:**
- Photo uploads currently store `file://` URIs (not real URLs) — wiring to storage service is HF-033
- Provider dashboard stats are placeholders — live stats need booking data
- `GET /v2/config/public` must be available at backend start (migration + seed already run on dev DB)

---

### Architecture Decisions Already Made

- **Navigation:** Expo Router Stack+Tabs — `(app)/_layout.tsx` is a Stack, `(app)/(tabs)/_layout.tsx` is Tabs. Detail screens (`category/[id]`, `provider/[id]`) live at the Stack level to avoid ghost tabs.
- **Toast system:** `store/toastStore.ts` + `utils/toast.ts` + `components/ui/Toast.tsx`. Always use `toast.error()` / `toast.success()` for notifications. Use `Alert.alert()` only for confirmations (Cancel/Confirm dialogs).
- **Platform settings:** Admin-controlled via `platform_settings` table. All valid keys and values are in `packages/shared/src/constants/platform-settings.ts`.
- **API client:** All service files import from `@/api/client` (NOT `./api` or relative paths).
- **Error messages:** All Zod error message keys must be wrapped in `t()` before display. Keys follow the pattern `validation.*` or `auth.*` and map to both `bn.json` and `en.json`.
- **DB migrations:** Always create additive migrations (never edit existing ones). Use `hasColumn` / `hasTable` guards when a column might already exist from a base migration update.

---

### Session Workflow Rules

Follow these rules for every session:

1. **Platform selection:** When I have backend and mobile tasks, ask me: "Which platform do we tackle first — backend or mobile?"
2. **Starting a ticket:** When I say "start HF-XXX", look it up in `docs/implementation_plan.md`. Confirm the requirements, then ask: "Ready to start HF-XXX: [title]. Any clarifications before I begin?"
3. **Completing a ticket:** When code is written, type-checked, and functionally tested, ask: "HF-XXX looks complete. Shall I commit this? Suggested message: `feat(scope): description`"
4. **After commit:** Mark the ticket ✅ in its sprint table in `docs/implementation_plan.md`. Update the **Next Ticket** row for that platform in the **## Current Focus** table. Then ask: "Next pending ticket is HF-YYY: [title]. Shall we start it, or switch to a different platform?"
5. **Rule checks:** Before implementing auth-related code, check `docs/SECURITY_RULES.md`. Before adding DB columns/tables, check `docs/DB_GUIDELINES.md`. Before adding API endpoints, check `docs/API_GUIDELINES.md`.
6. **No guessing SRS:** If a business rule is unclear, check `docs/brd/<domain>.md` or ask me before implementing.
7. **Bilingual always:** Every user-facing string needs both `bn` (Bengali, default) and `en` keys in `mobile/i18n/locales/`.
8. **Toast over Alert:** Use `toast.error()` / `toast.success()` from `@/utils/toast` for all notifications. Only use `Alert.alert()` for confirmations that need Cancel/Confirm buttons.

---

### Domain Reference

| Domain | BRD file | SRS REQs |
|--------|----------|---------|
| Auth & Identity | `docs/brd/AUTH_IDENTITY.md` | REQ-001 to 004 |
| Job Lifecycle | `docs/brd/JOB_LIFECYCLE.md` | REQ-015 to 018 |
| Payment & Commission | `docs/brd/PAYMENT_SYSTEM.md` | REQ-019 to 023 |
| Booking & Discovery | `docs/brd/BOOKING_DISCOVERY.md` | REQ-007 to 014 |
| Accessibility | `docs/brd/ACCESSIBILITY.md` | REQ-011 to 013 |
| Review System | `docs/brd/REVIEW_SYSTEM.md` | REQ-024 to 026 |

---

*Update the "Current Sprint" section above at the start of each new sprint.*
