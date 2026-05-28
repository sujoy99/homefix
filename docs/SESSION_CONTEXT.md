# HomeFix — Session Context

> **How to use:** Copy everything below the line and paste it as your first message when starting a new Claude Code session. Update the "Current Sprint" section before each sprint.

---

## Paste This at the Start of a New Session

---

I'm working on **HomeFix** — a geo-located home services marketplace for Bangladesh. Monorepo: `backend/` (Node 20 + Express + TypeScript + PostgreSQL), `mobile/` (Expo + React Native), `web/` (Next.js, Sprint 7), `packages/shared/` (shared types/schemas/constants).

### Read these files first (in order):

1. `CLAUDE.md` — repo overview, commands, global rules
2. `docs/implementation_plan.md` — all 82 tickets, sprint status, SRS traceability
3. `docs/engineering_standards.md` — naming, structure, code quality rules

**For backend work also read:**
- `backend/CLAUDE.md` — layer patterns, path aliases, error/response patterns
- `docs/SECURITY_RULES.md` — auth guards, JWT rules, forbidden patterns
- `docs/DB_GUIDELINES.md` — migrations, Objection.js, PostGIS

**For mobile work also read:**
- `mobile/CLAUDE.md` — Expo Router, Zustand, design tokens, forbidden patterns
- `docs/API_GUIDELINES.md` — response envelope, error codes, Swagger rules

**For architecture/system questions read:**
- `docs/ARCHITECTURE.md` — domain model, job state machine, auth flow, pluggable interfaces

---

### Current Sprint

**Sprint:** Sprint 2 — Home + Navigation + Service Catalog
**Status:** Not started
**Branch convention:** `feature/sprint-2-<ticket-slug>`

**Backend tickets (HF-021 to HF-024):**
- HF-021 ⏳ Service categories module (CRUD, `requires_area` flag)
- HF-022 ⏳ Provider profile + skills module
- HF-023 ⏳ Provider approval API (admin)
- HF-024 ⏳ File storage — pluggable interface (local disk now)

**Mobile tickets (HF-025 to HF-030):**
- HF-025 ⏳ Tab navigation (Resident: Home/Bookings/Profile, Provider: Home/Jobs/Profile)
- HF-026 ⏳ Resident home screen (category grid, search, "near you")
- HF-027 ⏳ Category listing — providers filtered by category, distance, rating
- HF-028 ⏳ Provider detail screen (skills, rating, reviews, "Book Now")
- HF-029 ⏳ Provider home screen (dashboard: active jobs, earnings, availability toggle)
- HF-030 ⏳ Profile screen (view/edit, photo upload, location update)

---

### Session Workflow Rules

Follow these rules for every session:

1. **Platform selection:** When I have backend and mobile tasks, ask me: "Which platform do we tackle first — backend or mobile?"
2. **Starting a ticket:** When I say "start HF-XXX", look it up in `docs/implementation_plan.md`. Confirm the requirements, then ask: "Ready to start HF-XXX: [title]. Any clarifications before I begin?"
3. **Completing a ticket:** When code is written, type-checked, and functionally tested, ask: "HF-XXX looks complete. Shall I commit this? Suggested message: `feat(scope): description`"
4. **After commit:** Mark the ticket ✅ in its sprint table in `docs/implementation_plan.md`. Update the **Next Ticket** row for that platform in the **## Current Focus** table. Then ask: "Next pending ticket is HF-YYY: [title]. Shall we start it, or switch to a different platform?"
5. **Rule checks:** Before implementing auth-related code, check `docs/SECURITY_RULES.md`. Before adding DB columns/tables, check `docs/DB_GUIDELINES.md`. Before adding API endpoints, check `docs/API_GUIDELINES.md`.
6. **No guessing SRS:** If a business rule is unclear, check `docs/brd/<domain>.md` or ask me before implementing.

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
