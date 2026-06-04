# HomeFix — Session Context

> **How to use:** Copy everything below the line and paste it as your first message when starting a new Claude Code session. Update the "Current Sprint" section before each sprint.

---

## Paste This at the Start of a New Session

---

I'm working on **HomeFix** — a geo-located home services marketplace for Bangladesh. Monorepo: `backend/` (Node 20 + Express + TypeScript + PostgreSQL + PostGIS), `mobile/` (Expo SDK 54 + React Native + Expo Router v4), `web/` (Next.js 15, Sprint 7), `packages/shared/` (shared types/schemas/constants).

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

**Sprint 5 — Payments & Wallet:**
- Backend: Payment interface (pluggable gateway pattern), Manual bKash/Nagad gateway (TxID entry, REQ-019/020), Commission engine (rate priority: promotion > category > global; locked at verify time, REQ-021), Provider wallet/ledger (80% credit on payment verify, REQ-022), Provider MFS account management (bKash/Nagad/Bank), Admin payment verification (atomic: wallet credit + ledger + payment status + job PAID in one transaction), Admin withdrawal flow (complete/reject with audit trail), Admin revenue dashboard API (totals, period breakdown, rule breakdown, top categories, per-job cursor-paginated, REQ-023), Profile completion API (`compute()` + `PROFILE_INCOMPLETE` guard on job accept + withdraw), Financial summary endpoint (6 platform-wide aggregates: verified payments, pending payments, platform revenue, provider wallets, withdrawn, pending withdrawal).
- Mobile: Payment screen (merchant number from `/config/public`, TxID input auto-uppercase, order summary), Payment receipt, Provider wallet screen (balance/earnings/withdrawal history with status badges, MFS account management, withdrawal modal with multi-account picker, available-balance guard displayed), Admin revenue dashboard (period bar chart, rule breakdown, top categories, per-job list, financial summary card with 6 stat tiles), Admin payment verification screen, Admin withdrawal dashboard (complete/reject bottom-sheet modals, TxID auto-uppercase, wallet balance breakdown per row), Provider profile edit screen (bio, rate, GPS, photo), Profile completion card (both roles) + provider home banner.
- HF-068B (Sprint 7 pulled forward): Mobile admin provider detail screen with NID front/back fullscreen viewer, skills, approve/reject.
- Tests: **248 backend** (18 suites, +15 new); **121 mobile** (14 suites, +31 new). Test docs: `docs/TESTING_SPRINT5_BACKEND.md`, `docs/TESTING_SPRINT5_MOBILE.md`, `docs/SPRINT5_USER_MANUAL.md`.

**Seed accounts (always available after `make seed`):**

| Role | Mobile | Password |
|------|--------|----------|
| Admin | `00000000000` | `Admin@1234` |
| Provider (active, Plumbing skill) | `01711223344` | `Provider@1234` |
| Resident (active) | `01811223344` | `Resident@1234` |

---

### Current Sprint

**Sprint:** Sprint 6 — Reviews, Notifications, Real-time & In-App Communication  
**Status:** ⏳ In Progress — Backend ✅ complete · Mobile 2/6 done (HF-050 ✅ HF-051 ✅)  
**Backend branch:** `feature/sprint-6-backend` ✅ complete (312/312 tests)  
**Mobile branch:** `feature/sprint-6-mobile` (active — 26/26 tests, 151/151 full suite)

> **Sprint 6 backend complete:** All 5 backend tickets shipped. See `docs/TESTING_SPRINT6_BACKEND.md` for test counts.  
> **Sprint 6 plan:** See `docs/implementation_plan.md` § Sprint 6 and `docs/SPRINT6_PROGRESS.md` for full ticket status + step checklists.  
> **Jitsi self-hosting guide:** `docs/brd/VOIP_CALLS.md` — deployment, JWT config, JVB scaling, Phase 2 (Agora) migration path.

**Sprint 6 backend APIs (already shipped — mobile consumes these):**

| Endpoint | Ticket | Notes |
|----------|--------|-------|
| `POST /api/v2/jobs/:id/review` | HF-047 | Resident only; job must be PAID; 1 per job |
| `GET /api/v2/providers/:id/reviews` | HF-047 | Public; paginated |
| `POST /api/v2/users/me/device-token` | HF-048 | Register FCM token; call on every login |
| `DELETE /api/v2/users/me/device-token` | HF-048 | Unregister on logout |
| `GET /api/v2/users/me/notifications` | HF-048 | Paginated list + `unread_count` |
| `PATCH /api/v2/users/me/notifications/:id/read` | HF-048 | Mark read |
| `PUT /api/v2/providers/me/location` | HF-049 | Provider GPS update; body `{ latitude, longitude }` |
| `GET /api/v2/jobs/:id/provider-location` | HF-049 | Resident tracks provider; job must be ACTIVE |
| `POST /api/v2/jobs/:id/messages` | HF-100 | Send message; body `{ content, type? }`; ACTIVE only |
| `GET /api/v2/jobs/:id/messages` | HF-100 | Cursor-paginated (`limit`, `before` UUID); ACTIVE only |
| `POST /api/v2/jobs/:id/call/room` | HF-101 | Returns `{ provider, roomName, serverUrl, token? }`; ACTIVE only; idempotent |

**Sprint 6 mobile tickets — status:**
- HF-050 ✅ Review & rating screen — star input (1–5) + optional comment, post-payment only; commit `119ac58`
- HF-051 ✅ Push notification setup — `expo-notifications ~0.32`, `expo-device ~8.0`; FCM token registration on login/logout; deep-link routing; commit `3357472`
- HF-052 ⏳ **← NEXT** Notification center — bell icon in tab bar with badge (`unread_count`), `GET /users/me/notifications` list, tap marks as read (`PATCH .../:id/read`), empty state
- HF-053 ⏳ Provider location tracking — `expo-location` background task, 30 s interval, low accuracy, `PUT /providers/me/location`; resident job detail shows live provider pin when ACTIVE
- HF-102 ⏳ In-app chat screen — per-job (ACTIVE only), bubble UI, `POST/GET /jobs/:id/messages`, Socket.IO real-time + 5 s poll fallback, no phone numbers
- HF-103 ⏳ In-app voice call — `@jitsi/react-native-sdk` Phase 1; `POST /jobs/:id/call/room`; reads `provider` field; graceful error if unreachable

**Key constraints for Sprint 6 mobile:**
- **Reviews gated on PAID:** Show review button / screen only when `job.status === PAID`. One review per job — hide button after successful submission.
- **Messages only on ACTIVE:** Chat icon and screen available only while job is ACTIVE. After `AWAITING_PAYMENT` transition, hide or show read-only history.
- **No phone numbers in chat:** Display `sender_id === currentUser.id ? 'You' : providerName/residentName`. Never show phone numbers.
- **Call provider is pluggable:** Read `provider` field from `/call/room` response. If `provider === 'jitsi'`, use `@jitsi/react-native-sdk`. Show graceful error if `serverUrl` is unreachable.
- **FCM token registration:** Call `POST /users/me/device-token` immediately after every successful login (token can rotate). Call `DELETE /users/me/device-token` on logout.
- **Socket.IO auth:** Connect with `{ auth: { token: accessToken } }`. Join room via `socket.emit('join_job', jobId)`. Leave on unmount.
- **Background GPS (provider only):** Use `expo-location` task manager API. Battery-aware: `accuracy: Location.Accuracy.Low`, `timeInterval: 30000`, `distanceInterval: 50`. Stop task when job leaves ACTIVE state.
- **Bilingual always:** Every user-facing string needs both `bn` (default) and `en` keys.

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
- **Payment gateway:** Pluggable — `payment.interface.ts` (mirrors `storage.interface.ts`). Gateway selected at request time from `platform_settings.active_payment_gateway` via `ConfigService.getSetting()`. Registry in `payment.service.ts`. Never import a gateway directly outside that file.
- **Money storage:** Always integer paisa (1 taka = 100 paisa). `Math.floor()` for platform fee. Display as ৳. All 5 payment tables use `integer` columns for monetary values.
- **Commission rule resolution:** `commission.service.resolveRate(categoryId, date)` — promotion > category > global. Rate + `commission_rule_id` locked onto `payments` row at verify time. Never read the rate from anywhere else.
- **Payment atomic transaction:** wallet credit + `platform_revenue_ledger` insert + `payments` status→`completed` + job status→`PAID` happen in a single Objection.js `transaction()` call inside the Admin verify handler.
- **Profile completion:** Computed live by `profile-completion.service.compute(userId, role)` — no stored column. Provider threshold 70%; below threshold blocks job accept (`POST /v2/jobs/:id/accept`) and withdrawal (`POST /v2/providers/wallet/withdraw`) with `PROFILE_INCOMPLETE` error code. Resident threshold is informational only.
- **Domain reference additions (Sprint 5):** `docs/brd/PAYMENT_SYSTEM.md` (escrow flow, commission versioning, withdrawal audit trail) · `docs/brd/PROFILE_COMPLETION.md` (field weights, thresholds, guards)

**Sprint 6 — Reviews, Notifications, Real-time (backend ✅ complete, mobile 2/6 done):**
- Backend: Reviews module (PAID gate, aggregate rating update, REQ-024/025/026), Push notification service (FCM, pluggable provider, device token management, 4 REST endpoints), Provider GPS tracking (`PUT /providers/me/location`, `GET /jobs/:id/provider-location`), In-app messaging (`job_messages` table, Socket.IO rooms, cursor pagination, fire-and-forget push), Pluggable VoIP (Jitsi Phase 1, stateless JWT room creation, CALL_PROVIDER env, Agora Phase 2 hookpoint).
- Tests: **312 backend** (22 suites, +51 new) · **26 mobile** (HF-050: 15 + HF-051: 11). Test docs: `docs/TESTING_SPRINT6_BACKEND.md`. VoIP self-hosting guide: `docs/brd/VOIP_CALLS.md`.

**Sprint 6 mobile — architectural decisions made so far:**
- `reviewStore` (Zustand + AsyncStorage persist) tracks `reviewedJobIds[]` — hides "Leave a Review" CTA after submission across app restarts. On `REVIEW_ALREADY_EXISTS` 409, marks job reviewed locally and navigates back.
- `usePushNotifications` hook in `hooks/` — mounted in `app/(app)/_layout.tsx` (authenticated shell only). Registers FCM token on every mount (= every login). `Notifications.setNotificationHandler` at module level in `app/_layout.tsx` for foreground display.
- **Circular import rule:** `authStore.ts` must NOT import `notificationService` — `apiClient` already imports `authStore`, creating a cycle. Instead, `authStore.logout()` calls `apiClient.delete('/v2/users/me/device-token')` directly.
- `expo-notifications ~0.32.17` + `expo-device ~8.0.10` added to `mobile/package.json` via `npx expo install`.
- `app.json` — `expo-notifications` plugin added with `icon` + `color` config.

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
9. **Tests within each ticket (mandatory sequence — never skip):**
   ```
   Implement → unit tests → integration tests → type-check (zero errors) → tests pass 100% → commit
   ```
   - Unit tests: pure logic (rate resolution, paisa math, format validation, gateway selection)
   - Integration tests: multi-table writes, state-machine guards, API error codes (401/403/400)
   - Simple getter endpoints with no business logic: manual QA only, no automated test required
   - Full detail in `docs/engineering_standards.md` § "Within-Ticket Test Order"

---

### Domain Reference

| Domain | BRD file | SRS REQs | Sprint |
|--------|----------|---------|--------|
| Auth & Identity | `docs/brd/AUTH_IDENTITY.md` | REQ-001 to 004 | S1 |
| Job Lifecycle | `docs/brd/JOB_LIFECYCLE.md` | REQ-015 to 018 | S3 |
| Payment & Commission | `docs/brd/PAYMENT_SYSTEM.md` | REQ-019 to 023 | S5 ✅ |
| Booking & Discovery | `docs/brd/BOOKING_DISCOVERY.md` | REQ-007 to 014 | S2–S3 |
| Accessibility | `docs/brd/ACCESSIBILITY.md` | REQ-011 to 013 | S4 |
| Review System | `docs/brd/REVIEW_SYSTEM.md` | REQ-024 to 026 | S6 ✅ backend |
| Profile Completion | `docs/brd/PROFILE_COMPLETION.md` | (cross-cutting) | S5 ✅ |
| VoIP Calls | `docs/brd/VOIP_CALLS.md` | (in-app communication) | **S6 ← active** |

---

*Update the "Current Sprint" section above at the start of each new sprint.*
