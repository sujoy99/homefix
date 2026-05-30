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

### What Has Been Built (Sprints 0–4)

**Sprint 0 — Foundation:** Docker + PostgreSQL + PostGIS, Knex migrations, Express 5 skeleton, Winston logging, JWT infrastructure, shared package scaffold.

**Sprint 1 — Auth:**
- Backend: user registration + login (password method), JWT access/refresh tokens, device tracking, admin approval flow, RBAC permission cache.
- Mobile: Onboarding carousel, Login (mobile/email tabs), 5-step Provider registration (basic info → location → password → documents → skills), Resident 3-step registration, pending approval screen, Zustand auth store, token refresh interceptor.
- Fixes: GPS map picker (step 2), language toggle on all auth screens, localized API error codes, provider skills at registration, test infra (jest-expo v54).

**Sprint 2 — Home + Categories:**
- Backend: Service categories module (CRUD + `requires_area`), Provider profile + skills, Provider approval API, File storage (local disk, S3-ready).
- Mobile: Stack+Tabs navigation (Resident: Home/Bookings/Profile, Provider: Home/Jobs/Profile, Admin: Approvals/Profile), Resident home screen (category grid, search, available providers capped to 3 + AllProvidersScreen with search + category filter), Category listing (sort by rating/experience/rate), Provider detail screen, Provider dashboard (availability toggle), Profile screen.
- Enhancements: My Services multi-select modal, logout as red card-row, **Toast notification system** (red=error, green=success — replaces Alert.alert for all non-confirmation messages), NID front + back photo, camera-only policy, **Platform Settings** module (`GET /v2/config/public`, `platform_settings` table).

**Sprint 3 — Booking & Job Lifecycle:**
- Backend: Job/Booking module — full state machine (`PENDING → ACTIVE → AWAITING_PAYMENT → PAID`), PostGIS distance-sorted provider feed, Job media + voice note storage endpoints.
- Mobile: 5-step booking wizard (category → describe → photos+area → address+map → budget+review), Resident bookings list (4 tabs: Upcoming/Active/Awaiting Payment/Completed), Provider job feed (distance-sorted, skills-filtered, My Active Jobs section pinned above feed), Job detail + 4-step status stepper, Provider accept job (concurrent-safe), Provider marks work complete.
- Enhancements: Service address step with interactive map — reverse geocoding (marker drag → auto-fill Area), forward geocoding "Find on Map" (Nominatim/OSM 3-tier fallback), "Use my home address" shortcut. Photo fullscreen viewer with pinch-to-zoom (`react-native-image-viewing`). "Not Interested" redesigned as small text link.
- Bug fixes: `resolveMediaUrl` crash on non-string media_urls; Android nested-TouchableOpacity content clip; Yoga `alignItems:center` Bengali text truncation; Button fixed-height Bengali glyph clip → `minHeight + paddingVertical`; `DollarSign` → `Banknote` icon for Taka amounts.
- Test docs: `docs/TESTING_SPRINT3_MOBILE.md`, `docs/SPRINT3_USER_MANUAL.md`.

**Sprint 4 — Voice & Accessibility (mobile-only):**
- `VoiceRecorder` component (`expo-av`) — idle → recording (live timer + red dot) → recorded (play/pause/delete); always visible on booking Step 2; uploads to `PATCH /v2/jobs/:id/voice-note` on submit (best-effort, separate try/catch).
- `VoiceNotePlayer` component (`expo-av`) — play/pause toggle, progress bar, `position / duration` time display; shown in provider job detail when `voice_note_url` is present.
- `ReadAloudButton` component (`expo-speech`) — speaks `job.description + address parts` aloud; language-aware (`bn-BD` / `en-US`); provider-only (REQ-013); stops on unmount.
- HF-043 (Voice-to-Text) deferred — requires Whisper backend decision. Use OpenAI Whisper API or Groq (free) when ready; machine (i3-10110U, 6 GB RAM, 2 GB VRAM) is **not** suitable for self-hosted Whisper-small.
- Accessibility audit (HF-046): `accessibilityRole` + `accessibilityLabel` on 30+ touchables app-wide; `accessibilityHint` on mic, GPS, photo picker, thumbnails; touch targets ≥ 48 px; WCAG AA contrast verified; font scale 1.5× clean.
- 50/50 tests passing (8 suites). Test docs: `docs/TESTING_SPRINT4_MOBILE.md`, `docs/SPRINT4_USER_MANUAL.md`.

**Seed accounts (always available after `make seed`):**

| Role | Mobile | Password |
|------|--------|----------|
| Admin | `00000000000` | `Admin@1234` |
| Provider (active, Plumbing skill) | `01711223344` | `Provider@1234` |
| Resident (active) | `01811223344` | `Resident@1234` |

---

### Current Sprint

**Sprint:** Sprint 5 — Payments + Wallet  
**Status:** ⏳ Not Started  
**Branch convention:** `feature/sprint-5-mobile`  
**Active git branch:** `feature/sprint-4-mobile` (merge to master before starting Sprint 5)

> **Why Payments before Reviews:** Reviews (Sprint 6) require `job.status = PAID` per REQ-024. Sprint 5 delivers the payment flow so Sprint 6 reviews are fully testable end-to-end without DB workarounds.

**Backend tickets (start here — mobile payment screen depends on these):**
- HF-054 ⏳ Payment interface — pluggable strategy pattern (`payment.interface.ts`); Phase 1: manual TxID gateway; Phase 2: SSLCommerz (same pattern as file storage)
- HF-055 ⏳ Manual gateway — bKash/Nagad TxID entry (REQ-019, REQ-020); validates TxID format; marks job PAID; triggers commission split
- HF-056 ⏳ Commission engine — reads configurable rate from `commission_rules` table (REQ-021); default 20%; per-category and promotion overrides supported
- HF-056B ⏳ Admin commission rules API — CRUD endpoints + `/preview` to calculate net payout before applying
- HF-057 ⏳ Provider wallet/ledger — credits 80% of job amount on payment (REQ-022); ledger table for audit trail
- HF-058 ⏳ Admin revenue dashboard API — total revenue, commission by rule breakdown (REQ-023)

**Mobile tickets:**
- HF-059 ⏳ Payment screen — method selection (bKash / Nagad), TxID input, order summary card with commission breakdown; only accessible when `job.status = AWAITING_PAYMENT`
- HF-060 ⏳ Provider wallet screen — current balance, earnings history, commission breakdown per job
- HF-061 ⏳ Payment receipt + completion flow — success screen after payment; stepper advances to PAID; "Rate your provider →" CTA wired up for Sprint 6

**Key constraints for Sprint 5:**
- Payment gateway must be a pluggable interface — `payment.interface.ts` contract identical to `storage.interface.ts` pattern already in codebase
- Commission rate comes from `commission_rules` table — never hardcode 20% in application logic
- Wallet credit and commission debit must happen in the **same DB transaction** as the status change to PAID
- TxID is user-entered (manual MFS flow) — validate format but do not verify with the payment provider (Phase 1)
- All new UI strings need both `bn.json` and `en.json` keys
- Read `docs/brd/PAYMENT_SYSTEM.md` before implementing any payment logic

---

### Architecture Decisions Already Made

- **Navigation:** Expo Router Stack+Tabs — `(app)/_layout.tsx` is a Stack, `(app)/(tabs)/_layout.tsx` is Tabs. Detail screens (`category/[id]`, `provider/[id]`, `booking/job/[id]`) live at the Stack level to avoid ghost tabs.
- **Toast system:** `store/toastStore.ts` + `utils/toast.ts` + `components/ui/Toast.tsx`. Always use `toast.error()` / `toast.success()` for notifications. Only use `Alert.alert()` for confirmations (Cancel/Confirm dialogs).
- **Platform settings:** Admin-controlled via `platform_settings` table. All valid keys and values are in `packages/shared/src/constants/platform-settings.ts`.
- **API client:** All service files import from `@/api/client` (NOT `./api` or relative paths).
- **Error messages:** All Zod error message keys must be wrapped in `t()` before display. Keys follow the pattern `validation.*` or `auth.*` and map to both `bn.json` and `en.json`.
- **DB migrations:** Always create additive migrations (never edit existing ones). Use `hasColumn` / `hasTable` guards when a column might already exist.
- **Job state machine:** `PENDING → ACTIVE → AWAITING_PAYMENT → PAID` (also `CANCELLED`). Transitions validated via `isValidJobTransition()` from `@homefix/shared`. State changes always use a DB transaction.
- **Media URLs:** Always resolve via `resolveMediaUrl(url)` from `@/utils/media` — handles both relative paths (`/uploads/...`) and absolute URLs (S3). Never construct upload URLs manually in components.
- **Buttons / i18n:** Never use fixed `height` on button containers — use `minHeight + paddingVertical` so Bengali and other complex-script labels are never clipped. Never use `alignItems: 'center'` on a column container that holds a `Text` child — use default `stretch` + `textAlign: 'center'` on the Text.
- **Nested touchables:** Never put a `Button` (TouchableOpacity) inside another `TouchableOpacity` for the same action — Android clips the inner content. Use a styled `View` for the inner CTA instead.
- **Budget icon:** Use `Banknote` (not `DollarSign`) for money amounts — appropriate for Taka (৳) context.

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
