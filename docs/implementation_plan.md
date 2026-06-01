# HomeFix — Full-Stack Implementation Plan

> **Version:** 3.8  
> **Prepared by:** Sr. Software Engineer  
> **Date:** 2026-04-19  
> **Last Updated:** 2026-05-30  
> **Methodology:** Agile (Sprint-based, ticket-level breakdown)  
> **Inputs:** SRS v1.0 + Architecture decisions + Post-Sprint-1 code review

---

## Status Tracker

| Sprint | Status | Started | Completed |
|---|---|---|---|
| Sprint 0 — Foundation | ✅ Completed | 2026-04-19 | 2026-05-27 |
| Sprint 1 — Auth Screens | ✅ Completed | 2026-04-19 | 2026-05-28 |
| Sprint 1 Hardening — Code Review Fixes | ✅ Completed | 2026-05-28 | 2026-05-28 |
| Sprint 2 — Home + Categories | ✅ Completed | 2026-05-29 | 2026-05-29 |
| Sprint 3 — Booking + Jobs | ✅ Completed | 2026-05-29 | 2026-05-30 |
| Sprint 4 — Voice + Accessibility | ✅ Done | 2026-05-30 | 2026-05-30 |
| Sprint 5 — Payments + Wallet | ✅ Complete | `feature/sprint-5-mobile` | 2026-05-31 |
| Sprint 6 — Reviews + Notifications + In-App Communication | ⏳ Not Started | — | — |
| Sprint 7 — Web + Admin | ⏳ Not Started | — | — |
| Sprint 8 — Production Readiness | ⏳ Not Started | — | — |

---

## Current Focus

> **This section is the single source of truth for "what's next". Update it every time a ticket is completed.**

**Active Sprint:** Sprint 6 — Reviews, Notifications, Real-time & In-App Communication  
**Sprint Status:** ⏳ Not Started — Ready to begin (Sprint 5 fully complete ✅)  
**Git Branch Convention:** `feature/sprint-6-backend` then `feature/sprint-6-mobile`

### Next Ticket Per Platform

| Platform | Next Ticket | Title | Blocked By |
|----------|-------------|-------|------------|
| 🖥 Backend | HF-048 | Push notification service (FCM) | — |
| 📱 Mobile | HF-050 | Review & rating screen (star + text, post-payment only) | — |
| 🌐 Web | — | Sprint 7 (not started) | Sprints 2–6 |

### How to Pick Up Work

1. **Choose a platform** — if both backend and mobile are available, ask which to start first
2. **Work tickets top-to-bottom** within the chosen platform's section in the sprint
3. **When a ticket is done:** mark it ✅ in the sprint table, update "Next Ticket" in this table, then ask for a commit
4. **When a sprint is done:** mark it ✅ in the Status Tracker above, set the next sprint as Active, and refresh this table with its first tickets

---

### 📝 Strategic Mandate: Mobile Responsiveness
> [!IMPORTANT]
> All mobile screens MUST be fully responsive and accessibility-compliant:
> - Use `KeyboardAvoidingView` + `ScrollView` with `flexGrow: 1` to ensure inputs/buttons are reachable on small devices.
> - No fixed heights for containers; use padding and flexible spacing.
> - Touch targets must be 48px+ for accessibility.

---

## 1. System Overview

HomeFix is a **geo-located home services marketplace** for Bangladesh connecting:
- **Residents** — homeowners/tenants needing repairs
- **Providers** — verified skilled workers (plumbers, electricians, painters, etc.)
- **Admin** — platform operators managing verification, revenue, service catalog

### Key Differentiators (from SRS)
- **Voice-first accessibility** — Voice notes, Text-to-Speech for low-literacy providers
- **Area-based pricing** — Services like painting require sq. footage input
- **Localized payments** — bKash, Nagad with manual Transaction ID
- **Configurable platform commission** — default 20%, admin-adjustable per category or promotion
- **Escrow-style flow** — Payment only after "Awaiting Payment" status

---

## 2. Confirmed Architecture Decisions

| # | Decision | Answer |
|---|---|---|
| 1 | SRS | Full SRS v1.0 — all 26 REQs captured |
| 2 | Locale | Bengali (`bn`) default, English (`en`) secondary. Currency: ৳ (Taka) |
| 3 | Payment Gateway | **Pluggable interface** now → SSLCommerz later |
| 4 | File Storage | **Pluggable interface** — local disk now → AWS S3 later |
| 5 | Deployment | Railway + Supabase + Vercel + EAS Build (finalized at deploy time) |
| 6 | Design | No external reference. Custom design — clean, icon-heavy, accessibility-first |

---

## 3. Architecture

### 3.1 Project Structure (Monorepo)

```
homefix/
├── packages/
│   └── shared/              ← Shared code across all apps
│       ├── types/           # UserRole, ErrorCode, JobStatus, PaymentStatus
│       ├── validation/      # Zod schemas (registration, login, booking)
│       ├── constants/       # Commission rates, status machines
│       └── i18n/            # bn.json, en.json translation files
├── backend/                 ← Existing (Node + Express + TypeScript)
├── mobile/                  ← React Native + Expo
├── web/                     ← Next.js 15
└── docs/                    ← Project documentation (this file)
```

### 3.2 Mobile Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Expo SDK 53+ | Single codebase, OTA updates |
| Navigation | Expo Router v4 | File-based, deep linking built-in |
| State Management | Zustand | Lightweight, TypeScript-first |
| API Layer | Axios + TanStack Query | Caching, auto-retry, offline |
| Auth Storage | expo-secure-store | Encrypted token storage |
| Forms | React Hook Form + Zod | Shared validation with backend |
| Localization | i18next + react-i18next | Lazy loading, Bengali default |
| Maps | react-native-maps | Service discovery |
| Voice | expo-av (recording) + expo-speech (TTS) | Accessibility features |
| Animations | react-native-reanimated | 60fps native animations |
| Push Notifications | expo-notifications (FCM) | Firebase under the hood |

### 3.3 Web Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR/SSG, SEO, API routes |
| State Management | Zustand | Shared patterns with mobile |
| API Layer | Axios + TanStack Query | Same as mobile |
| Styling | Vanilla CSS + CSS Modules | Maximum control |
| Localization | next-intl | SSR-compatible i18n |
| Auth | Cookie-based (httpOnly) | More secure for web |

### 3.4 Backend Stack (Existing)

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 + TypeScript |
| Database | PostgreSQL + PostGIS |
| ORM | Objection.js + Knex |
| Validation | Zod v4 |
| Auth | JWT (access + refresh, rotation, reuse detection) |
| Logger | Winston (daily rotation, masking) |
| Docs | Swagger/OpenAPI |

### 3.5 Pluggable Interfaces

Two core services are designed with pluggable interfaces for future scaling:

#### File Storage
```
modules/storage/
├── storage.interface.ts      ← Abstract contract (save, get, delete)
├── providers/
│   ├── local.storage.ts      ← Phase 1: Local disk (./uploads/)
│   └── s3.storage.ts         ← Phase 2: AWS S3 (when ready)
└── storage.service.ts        ← Uses interface, gateway-agnostic
```

#### Payment Gateway
```
modules/payments/
├── payment.interface.ts      ← Abstract contract
├── gateways/
│   ├── manual.gateway.ts     ← Phase 1: Manual TxID entry (bKash/Nagad)
│   └── sslcommerz.gateway.ts ← Phase 2: SSLCommerz (when subscribed)
├── payment.service.ts        ← Uses interface, gateway-agnostic
└── wallet/                   ← Provider wallet + commission ledger
```

### 3.6 Design System

- **Style:** Clean, warm, icon-heavy, accessibility-first
- **Inspired by:** Pathao, Urban Company, Grab
- **Primary Color:** Warm Teal `#0D9488`
- **Accent Color:** Amber `#F59E0B`
- **Background:** Off-white `#FAFAF9` (light) / Charcoal `#1C1917` (dark)
- **Touch targets:** 48px+ minimum (accessibility)
- **Voice CTA:** Always visible microphone button
- **Max 3 taps** to book a service
- **App size target:** < 15MB (Bangladesh market)

### 3.7 Deployment (To Be Finalized)

| Layer | Recommended Service | Region | Notes |
|---|---|---|---|
| Backend API | Railway | Singapore | ~50ms latency to Dhaka |
| Database | Supabase (PostgreSQL + PostGIS) | Singapore | Managed, free tier |
| File Storage | Local disk → AWS S3 (later) | — → Mumbai | Pluggable interface |
| Redis Cache | Upstash (serverless) | Singapore | Pay-per-use |
| Mobile App | EAS Build → Play Store + App Store | — | Android-first (85% BD market) |
| Web + Admin | Vercel | Global CDN | Auto-deploy from Git |
| Push Notifications | Firebase FCM | — | Free, unlimited |

---

## 4. Backend Code Review

### Existing Strengths ✅

- Excellent layered architecture (controller → service → repository)
- Bank-grade JWT security (rotation, reuse detection, device tracking)
- Clean TypeScript types with strict mode
- Proper DB transactions for data consistency
- Comprehensive error code system with frontend action mapping
- Zod v4 validation with discriminated unions
- Winston logger with sensitive data masking

### Issues to Fix (Incrementally)

| # | Issue | File | Severity | Sprint |
|---|---|---|---|---|
| 1 | Missing `await` on `AuthRepository.createUser()` | `auth.seed.ts:74` | 🔴 Bug | S1 |
| 2 | V1 in-memory stores still active | `user.store.ts`, `token.store.ts` | 🟡 Cleanup | S8 |
| 3 | `findByEmail` searches in-memory Map, not DB | `auth.repository.ts:27-32` | 🟡 Inconsistent | S8 |
| 4 | Duplicate function names | `auth.jwt.ts` | 🟡 Cleanup | S1 |
| 5 | `common/` directory is empty | `src/common/` | 🟢 Remove | S0 |
| 6 | CORS allows all origins | `app.ts:38` | 🔴 Security | S1 |
| 7 | `nodeEnv` type cast incorrect | `env.ts:17` | 🟡 Type safety | S1 |
| 8 | Production knex config is empty | `knexfile.ts:35-37` | 🔴 Deploy blocker | S8 |
| 9 | No test framework configured | — | 🟡 Quality | S8 |

---

## 5. Sprint Breakdown

---

### 🏁 Sprint 0 — Foundation & Project Setup

**Goal:** Monorepo, shared packages, Expo app scaffold, design system, i18n.

#### Shared:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-001 | Monorepo restructure (npm workspaces) | ✅ | 4h |
| HF-002 | Shared types (UserRole, UserStatus, ErrorCode, JobStatus, PaymentStatus) | ✅ | 3h |
| HF-003 | Shared Zod schemas (registration, login) | ✅ | 3h |
| HF-004 | Shared constants (DEFAULT_COMMISSION_RATE, status machines) | ✅ | 2h |
| HF-009 | Test infrastructure (Backend) — Jest + ts-jest config, test DB setup, Supertest harness, model factory helpers | ✅ | 4h |
| HF-009B | Test infrastructure (Mobile) — Jest + RNTL config inside Expo, mock setup for `expo-secure-store` / Axios, shared factory helpers | ✅ | 3h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-005 | Expo project init + Expo Router setup | ✅ | 4h |
| HF-006 | Design system — theme, colors, typography, spacing, dark mode | ✅ | 8h |
| HF-007 | Base components — Button, Input, Text, Card, Screen, Icon | ✅ | 8h |
| HF-008 | i18n setup — Bengali default, English secondary, language switcher | ✅ | 4h |
| HF-010 | Secure auth storage (expo-secure-store) | ✅ | 3h |
| HF-011 | Navigation scaffold — (auth) group + (app) group + root auth check | ✅ | 4h |

**Deliverable:** Running Expo app with design system, bilingual i18n, API client, navigation skeleton.

---

### 🔐 Sprint 1 — Authentication Screens

**Goal:** Complete auth flow — register, login, token management, logout.

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-020 | Backend fix: `await` in seed + CORS restriction + consolidate duplicate functions | ✅ | 4h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-012 | Splash + Onboarding carousel (3 slides, "Get Started" CTA) | ✅ | 6h |
| HF-013 | Registration — Resident (multi-step: name+mobile+NID → location → email+password) | ✅ | 10h |
| HF-014 | Registration — Provider (extends resident: NID photo upload, profile photo) | ✅ | 6h |
| HF-015 | Login screen (mobile/email + password, device ID generation) | ✅ | 6h |
| HF-016 | Auth Zustand store (user, tokens, isAuthenticated, login/logout/refresh) | ✅ | 6h |
| HF-017 | Token refresh Axios interceptor (401 → refresh → retry, SESSION_EXPIRED → logout) | ✅ | 6h |
| HF-018 | Logout flow + "Logout all devices" | ✅ | 3h |
| HF-019 | Pending approval screen (provider after registration) | ✅ | 3h |

#### Shared:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-020B | Type Stabilization: Resolve all `tsc` errors across backend, mobile, and shared | ✅ | 8h |

#### Sprint 1 Bug Fixes:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-020C | Language toggle (Globe button) missing in Registration + Onboarding screens — all auth screens must be bilingual | ✅ | 2h |
| HF-020D | API errors show raw axios error or English backend message — map `error_code` to localized i18n messages for duplicate mobile/NID/email, invalid credentials, locked account | ✅ | 3h |
| HF-020E | Registration location step UX: auto-detect GPS on step entry, show interactive `react-native-maps` map with draggable marker, tap-to-relocate support, provider future booking addresses also need this | ✅ | 5h |

**Deliverable:** Full auth flow — register, login, pending state, auto-refresh, logout. **Stabilized. Bilingual. Localized errors. Interactive map.**

---

### 🔧 Sprint 1 Hardening — Code Review Fixes

**Goal:** Resolve all critical bugs, security gaps, and structural issues found in the post-Sprint-1 code review before Sprint 2 features are built on top of them. Tickets are grouped by blocking priority — do not start Group 2 until Group 1 is complete; do not start Sprint 2 until Group 2 is complete.

> **Source:** Post-Sprint-1 review conducted 2026-05-28. C# = critical, D# = design, Q# = quality, M# = minor as classified in the review.

---

#### Group 1 — Sprint 2 Blockers (must be done first)

##### Backend:

| Ticket | Title | Review Ref | Status | Est. |
|---|---|---|---|---|
| HF-085 | Strip `authAccounts` + `password_hash` from login response — add mapper identical to register | C2 | ✅ | 1h |
| HF-087 | Call `process.exit(1)` in `uncaughtException` and `unhandledRejection` handlers | C3 | ✅ | 0.5h |
| HF-092 | Add `@homefix/shared` as backend dependency; replace local `UserRole`, `UserStatus`, `AuthMethod` enums with imports from shared package | D6 | ✅ | 3h |

##### Mobile:

| Ticket | Title | Review Ref | Status | Est. |
|---|---|---|---|---|
| HF-086 | Fix token refresh interceptor: correct URL to `/v2/auth/refresh`; destructure from `response.data.body` | C1 | ✅ | 1h |
| HF-088 | Persist `hasSeenOnboarding` flag to `AsyncStorage` in `completeOnboarding()`; read it back in `hydrate()` | C4 | ✅ | 1h |
| HF-089 | Decode JWT payload in `hydrate()` to restore `user` object — fixes null `user.role` / `user.fullName` on cold start | D5 | ✅ | 2h |
| HF-090 | Create `mobile/services/auth.service.ts` with `register()` and `login()`; remove direct `apiClient` calls from `register.tsx` | D4 | ✅ | 2h |

##### Shared:

| Ticket | Title | Review Ref | Status | Est. |
|---|---|---|---|---|
| HF-091 | Align NID regex: change `packages/shared` from `/^[0-9]{10,17}$/` to `/^[0-9]{10}$/` to match backend (or decide on format and update both) | D8 | ✅ | 1h |

---

#### Group 2 — Before Sprint 2 Sensitive Routes Go Live

##### Backend:

| Ticket | Title | Review Ref | Status | Est. |
|---|---|---|---|---|
| HF-093 | **Partial — different approach chosen.** Instead of a DB query per request, implemented an in-memory `InvalidationStore` (`invalidation.store.ts`): `logoutAll` records `userId → timestamp`; `authGuard` rejects tokens whose `iat` predates that timestamp (O(1), no DB). Trade-off: does not survive server restarts; single-instance only. **DB-backed version check still needed** before multi-instance deploy. | D1 | ⚠️ | 3h |
| HF-094 | Add auth-specific rate limiter (10 req / 15 min per IP) applied only to `POST /auth/login` and `POST /auth/register` | D7 | ✅ | 2h |
| HF-095 | Make `CORS_ORIGIN` required (use `required()` helper); remove `'*'` default; update all `.env.*` files | C6 | ✅ | 1h |

---

#### Group 3 — Code Quality (can overlap Sprint 2)

##### Backend:

| Ticket | Title | Review Ref | Status | Est. |
|---|---|---|---|---|
| HF-096 | Delete dead code: `token.store.ts`, v1 `AuthController` (if no active v1 routes), `StoredRefreshToken` type, `UserResgistration` / `CreateUserInput` types, `sanitizeUser()` no-op, `AdminController` dead import in `auth.route.v2.ts` | D2, D3, Q2, M6, M7, Q5 | ✅ | 2h |
| HF-097 | Fix misc quality: replace `'pending'`/`'active'` string literals with `UserStatus` enum in `ensureUserIsActive()`; fix copy-paste comment on rate limiter block in `app.ts`; fix Swagger `facebood` typo | Q3, Q4, M5 | ✅ | 1h |

##### Mobile:

| Ticket | Title | Review Ref | Status | Est. |
|---|---|---|---|---|
| HF-098 | Fix `register.tsx`: replace native `<Text>` with design-system `<Text>` component; remove `handleSubmit(onSubmit as any)` casts by typing `onSubmit` as `SubmitHandler<UserRegistrationPayload>`; replace hardcoded `device-id-123` with `expo-device` identifier | Q4, Q6, M1 | ✅ | 2h |
| HF-099 | Fix `validate` middleware: align `FieldError` to emit one `message: string` per field (first error wins); update mobile `apiError.ts` parser to read field errors correctly; fix `authStore.login` typed as `any` | Q1, Q7 | ✅ | 2h |

> **Note on C5 (photo upload stores `file://` URI):** Covered by **HF-024** (Sprint 2 — file storage pluggable interface). Ensure `register.tsx` upload flow is wired to the storage service before Sprint 2 ships.

---

**Deliverable:** Zero critical bugs. Auth flow works end-to-end (refresh, cold start). No sensitive data leaking in responses. Shared enums are the single source of truth. Sprint 2 can be built on a clean foundation.

---

### 🏠 Sprint 2 — Home, Navigation & Service Catalog

**Goal:** Main app shell, service categories, provider profiles.

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-021 | Service categories module (CRUD, `requires_area` flag per REQ-006) | ✅ | 6h |
| HF-022 | Provider profile + skills module (link to categories, availability, pricing) | ✅ | 8h |
| HF-023 | Provider approval API (admin: list pending, approve, reject — REQ-003) | ✅ | 6h |
| HF-024 | File storage — pluggable interface (local disk now, S3 later) | ✅ | 6h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-025 | Tab navigation (Resident: Home/Bookings/Profile, Provider: Home/Jobs/Profile) | ✅ | 4h |
| HF-026 | Resident home screen (category grid with icons, search bar, "near you" section) | ✅ | 8h |
| HF-027 | Category listing — providers filtered by category, distance, rating | ✅ | 6h |
| HF-028 | Provider detail screen (skills, rating, reviews, "Book Now" CTA) | ✅ | 6h |
| HF-029 | Provider home screen (dashboard: active jobs, earnings, availability toggle) | ✅ | 6h |
| HF-030 | Profile screen (view/edit, photo upload, location update, language pref) | ✅ | 6h |

**Deliverable:** Main app with category browsing, provider discovery, profiles.

#### Sprint 2 Bug Fixes & Enhancements:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-014B | Registration — Provider: NID requires **front AND back** photo; both validated before Step 5 | ✅ | 2h |
| HF-014C | Camera policy: NID photos use `launchCameraAsync` by default (`camera_only`); admin-configurable via `platform_settings.nid_photo_source` | ✅ | 3h |
| HF-030A | Profile — My Services: rebuilt as multi-select bottom-sheet modal (checkbox list, primary badge, at-least-one validation, Edit pencil button) | ✅ | 4h |
| HF-030B | Profile — Logout: redesigned from outline button to red card-row matching InfoRow pattern (red icon + chevron) | ✅ | 1h |
| HF-030C | Toast notification system: animated colored banner (red=error, green=success, blue=info) replaces `Alert.alert()` for all non-confirmation messages app-wide | ✅ | 3h |
| HF-030D | Platform Settings: `platform_settings` table + `GET /v2/config/public` (no auth); `PlatformSettingKey` + `NidPhotoSource` enums in `packages/shared` document all valid values; admin updates via direct DB or future admin API (Sprint 6) | ✅ | 4h |

---

### 📋 Sprint 3 — Booking & Job Lifecycle

**Goal:** Full booking flow per SRS: `Pending → Active → Awaiting Payment → Paid`

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-031 | Job/Booking module — state machine (REQ-015 to REQ-018) | ✅ | 10h |
| HF-032 | Location-based provider search (PostGIS — REQ-007,008) | ✅ | 6h |
| HF-033 | Job media storage (photos, videos, voice notes — REQ-010) | ✅ | 4h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-034 | Create booking flow (category → describe → photos → address → date → budget) | ✅ | 10h |
| HF-035 | Area input — conditional sq. footage when `requires_area` (REQ-006) | ✅ | 3h |
| HF-036 | Service address input — separate from home address (REQ-008,009) | ✅ | 4h |
| HF-037 | Resident bookings list (Upcoming, Active, Awaiting Payment, Completed) | ✅ | 6h |
| HF-038 | Provider job feed — available jobs by trade, sorted by distance (REQ-015) | ✅ | 6h |
| HF-039 | Job accept/reject for provider (REQ-016) | ✅ | 4h |
| HF-040 | Job status tracking card (real-time updates) | ✅ | 6h |
| HF-041 | Provider marks "Work Complete" → Awaiting Payment (REQ-017) | ✅ | 3h |

**Deliverable:** End-to-end booking flow with status machine.

#### Sprint 3 Bug Fixes & Enhancements:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-026A | Resident home "Available Providers" section: cap display to 3 cards; "See all (N) →" link navigates to new `AllProvidersScreen` (`/(app)/providers`) with full list, name search bar, and category filter chips | ✅ | 3h |
| HF-036A | Booking address step map enhancements: (1) reverse geocoding — dragging marker auto-fills Area field via `expo-location.reverseGeocodeAsync`; (2) forward geocoding "Find on Map" button — Nominatim/OSM 3-tier fallback (road+area → area-only → road-only, `countrycodes=bd`); (3) "Use my home address" shortcut — prefills map from user's registered home coordinates and reverse-geocodes to fill Area | ✅ | 4h |
| HF-033A | Bug — `resolveMediaUrl` crashes when `media_urls` contains non-string items (stale DB rows with `{ url, key }` object shape); add `typeof` guard + object `.url` fallback so old records degrade to empty image instead of throwing | ✅ | 1h |
| HF-039A | Job detail — "Not Interested" button redesign: replaced full-height 56 px ghost button with a small centred muted text link below Accept; Accept Job remains the sole prominent CTA; dismiss link disabled while accept is in-flight | ✅ | 1h |
| HF-040A | Job detail — photo fullscreen viewer: tap any thumbnail → fullscreen modal with pinch-to-zoom, double-tap zoom toggle, swipe left/right between images, swipe-down to dismiss (`react-native-image-viewing`) | ✅ | 2h |
| HF-040B | Bug — `ImageViewing` mounted unconditionally caused crash on jobs without photos (`images=[]` + `imageIndex=0`); now conditionally rendered only when `media_urls.length > 0` | ✅ | 0.5h |
| HF-038A | Bug — `ProviderJobCard` had nested `TouchableOpacity` (outer card + inner Button); on Android nested touchables clip inner content causing Bengali multi-word labels to truncate; replaced inner Button with styled `View` — outer card touchable handles navigation | ✅ | 1h |
| HF-038B | Bug — `alignItems: 'center'` on column containers (CTA View, Button base) causes Yoga to compute child Text width at minimum-content-width (longest single word) instead of full container width; multi-word Bengali labels wrap and only first word is visible; fixed by using `alignItems: 'stretch'` (default) on all button/CTA containers — `textAlign: 'center'` handles visual centering | ✅ | 1h |
| HF-038C | Bug — `Button` had fixed `height: 44 / 56`; Bengali Unicode glyphs with stacking diacritics (matras) are taller than Latin at same font size and were vertically clipped; replaced with `minHeight + paddingVertical` so buttons grow to fit any script | ✅ | 0.5h |
| HF-038D | UI — Budget icon changed from `DollarSign` to `Banknote` in `ProviderJobCard` (job feed) and job detail screen; more appropriate for Taka (৳) amounts in Bangladesh context | ✅ | 0.5h |

---

### 🎙️ Sprint 4 — Voice & Accessibility (Differentiator)

**Goal:** Voice-first features per SRS REQ-011, 012, 013.

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-042 | Voice note recording in booking (expo-av — REQ-011) | ✅ | 6h |
| HF-043 | Voice-to-Text / Speech-to-Text (REQ-012) | 🔮 Future | 6h |
| HF-044 | Text-to-Voice — "Read aloud" button for providers (REQ-013) | ✅ | 4h |
| HF-045 | Voice note playback in provider job view | ✅ | 3h |
| HF-046 | Accessibility audit — large fonts, high contrast, screen reader | ✅ | 4h |

**Deliverable:** Full voice accessibility — record, transcribe, read aloud.

---

### 💳 Sprint 5 — Payments & Wallet

**Goal:** Full payment flow — bKash/Nagad TxID entry, configurable commission engine, provider wallet. Unlocks `PAID` job status required by Sprint 6 reviews.

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-054 | Payment interface (pluggable strategy pattern) | ✅ | 4h |
| HF-055 | Manual gateway (bKash/Nagad — TxID entry — REQ-019,020) | ✅ | 6h |
| HF-056 | Commission engine — configurable rate from `commission_rules` table (REQ-021) | ✅ | 6h |
| HF-056B | Admin commission rules API — CRUD + `/preview` endpoint | ✅ | 4h |
| HF-057 | Provider wallet/ledger — 80% credit on payment + withdrawal flow with full audit trail (REQ-022) | ✅ | 8h |
| HF-057B | Profile completion API — computed endpoint + `PROFILE_INCOMPLETE` guard on job accept + withdraw | ✅ | 4h |
| HF-057C | Withdrawal flow hardening — available-balance validation (balance minus pending sum prevents over-request), `GET /providers/wallet/withdrawals` endpoint for provider's own history, admin `listAll()` enriched with provider name, MFS account, wallet balance, and `total_pending_paisa` subquery per wallet | ✅ | 4h |
| HF-058 | Admin revenue dashboard API (REQ-023) | ✅ | 4h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-058B | Admin revenue dashboard mobile screen (totals, period chart, rule breakdown, per-job list) | ✅ | 4h |
| HF-058C | Admin payment verification screen (list SUBMITTED payments, verify action) | ✅ | 4h |
| HF-058D | Admin revenue financial summary card — 6 at-a-glance stats: total payments entered, verify-pending payments, platform revenue, provider wallet balances, provider withdrawn total, provider withdrawal pending total | ✅ | 3h |
| HF-059 | Payment screen (method selection, TxID input, order summary, merchant number) | ✅ | 8h |
| HF-059B | Profile completion card on Profile screen (both roles) + persistent banner on Provider home | ✅ | 4h |
| HF-060 | Provider wallet screen (balance, earnings, commission breakdown, withdrawal request) | ✅ | 6h |
| HF-060B | Withdrawal end-to-end mobile — admin `admin/withdrawals.tsx` screen (list all requests, complete/reject modals with proper bottom sheets, wallet balance + total-pending breakdown per row, pending count badge on revenue CTAs), provider wallet screen withdrawal history section with status badges, available-balance shown in withdraw modal when pending requests exist | ✅ | 6h |
| HF-061 | Payment receipt + completion flow | ✅ | 3h |
| HF-061B | Provider profile edit screen — bio, hourly rate, experience years, profile photo, home location (GPS). Profile completion card updates in real time after save. Name and mobile are read-only. | ✅ | 4h |

**Deliverable:** Full payment flow with wallet + commission system. Profile completion enforcement. Admin revenue dashboard. First sprint to produce PAID jobs end-to-end.

#### Sprint 5 Enhancements & Polish

| Ticket | Title | Status | Est. |
|--------|-------|--------|------|
| HF-060C | Provider withdrawal MFS account selector — multi-account providers see account picker in withdraw modal; backend validates `mfs_account_id` ownership; falls back to primary when not supplied; `requestWithdrawalSchema` updated with optional `mfs_account_id: uuid` | ✅ | 2h |
| HF-060D | Date + time display — transaction history (provider), withdrawal history (provider), admin withdrawal dashboard: date format upgraded from date-only to 12-hour datetime (`3 Jun 2026, 10:45 AM`) for clarity | ✅ | 0.5h |
| HF-060E | Admin "Complete Withdrawal" TxID input auto-uppercases on keystroke (`autoCapitalize="characters"` + `toUpperCase()` transform) | ✅ | 0.25h |

---

### ⭐ Sprint 6 — Reviews, Notifications, Real-time & In-App Communication

**Goal:** Reviews (gated on PAID — now testable), push notifications, GPS tracking, and a private resident↔provider communication channel so no personal phone numbers are ever shared.

> **Ordering note:** Moved after Sprint 5 (Payments) because REQ-024 requires `job.status = PAID` before a review can be submitted. Reviews are fully testable end-to-end only once the payment flow exists.

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-047 | Review & rating module (post-payment only — REQ-024,025,026) | ✅ | 6h |
| HF-048 | Push notification service (FCM) | ⏳ | 8h |
| HF-049 | Provider background GPS tracking API (REQ-007) | ⏳ | 4h |
| HF-100 | In-app messaging — `job_messages` table; `POST /v2/jobs/:id/messages`; `GET /v2/jobs/:id/messages` (cursor-paginated); WebSocket room per job (Socket.IO); push notification to recipient when backgrounded | ⏳ | 10h |
| HF-101 | Pluggable VoIP call service — `call.interface.ts` contract; Phase 1: `jitsi.provider.ts` (self-hosted Jitsi Meet, free); Phase 2: `agora.provider.ts` (swap in later); `POST /v2/jobs/:id/call/room` returns `{ provider, roomName, serverUrl?, token? }` | ⏳ | 8h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-050 | Review & rating screen (star + text, post-payment only) | ⏳ | 6h |
| HF-051 | Push notification setup (expo-notifications, deep linking) | ⏳ | 6h |
| HF-052 | Notification center (bell icon, badge, read/unread) | ⏳ | 6h |
| HF-053 | Provider location tracking (background GPS) | ⏳ | 6h |
| HF-102 | In-app chat screen — per-job messaging (ACTIVE status only); bubble UI (sent/received), image attachment, real-time WebSocket with 5 s poll fallback; chat icon on job detail; no phone numbers exposed | ⏳ | 10h |
| HF-103 | In-app voice call — `@jitsi/react-native-sdk` (Phase 1, self-hosted, free); call room opened from job detail; provider-agnostic (reads `provider` field from API response to select SDK at runtime); graceful "call unavailable" state if server unreachable | ⏳ | 8h |

**Deliverable:** Reviews (fully testable end-to-end), notifications, GPS tracking, private messaging + voice call for active jobs.

#### Communication Channel Architecture

```
modules/calls/
├── call.interface.ts       ← Contract: createRoom(jobId) → RoomConfig, endRoom(roomId)
├── call.service.ts         ← Provider-agnostic; reads CALL_PROVIDER env var
└── providers/
    ├── jitsi.provider.ts   ← Phase 1 (default): self-hosted Jitsi Meet (FREE)
    └── agora.provider.ts   ← Phase 2: Agora RTC (swap in by changing CALL_PROVIDER=agora)
```

```typescript
// RoomConfig returned to mobile — mobile picks the right SDK based on provider field
type RoomConfig = {
  provider: 'jitsi' | 'agora';
  roomName: string;
  serverUrl?: string;   // Jitsi: e.g. https://meet.homefix.app
  token?: string;       // Both: JWT room token (Jitsi) or RTC token (Agora)
};
```

| Concern | Decision |
|---------|---------|
| Phase 1 default | Self-hosted Jitsi Meet — **completely free**, full control |
| Phase 2 migration | Change `CALL_PROVIDER=agora` in env; no mobile code change needed |
| Mobile SDK | `@jitsi/react-native-sdk` (Phase 1) / `agora-rn-sdk` (Phase 2) — loaded conditionally |
| Messages storage | `job_messages(id, job_id, sender_id, content, type, created_at)` |
| Access control | Only job participants (resident + assigned provider) can access thread/room |
| Trigger | Chat + call icons visible on job detail when `status = ACTIVE` |
| Push | FCM notification on new message (backgrounded) + incoming call |

---

### 🌐 Sprint 7 — Web App & Admin Panel

**Goal:** Next.js web app for residents/providers + admin panel.

#### Web:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-062 | Next.js project init + shared package imports | ⏳ | 4h |
| HF-063 | Web design system (CSS custom properties, responsive, dark mode) | ⏳ | 8h |
| HF-064 | Web auth pages (login, register, cookie-based auth) | ⏳ | 8h |
| HF-065 | Web landing page (marketing, SEO, download CTA) | ⏳ | 8h |
| HF-066 | Web resident dashboard (browse, book, manage) | ⏳ | 10h |
| HF-067 | Web provider dashboard (jobs, wallet, profile) | ⏳ | 8h |

#### Web (Admin Panel):

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-068 | Admin panel — provider verification (approve/reject + NID preview) | ⏳ | 8h |
| HF-068B | **Mobile admin screen upgrade** — expand minimal Approvals tab to show provider detail with NID photo, profile photo, location map, and registration data before approve/reject. Must mirror HF-068 web panel scope. Currently only shows name/mobile/email. | ✅ | 4h |
| HF-069 | Admin panel — service category management (CRUD, requires_area) | ⏳ | 6h |
| HF-070 | Admin panel — revenue dashboard (total revenue, commission breakdown by rule) | ⏳ | 6h |
| HF-071 | Admin panel — user management (list, search, status change) | ⏳ | 6h |
| HF-071B | Admin panel — commission rules management (set global/category/promotion rates) | ⏳ | 6h |

**Deliverable:** Full web app + admin panel.

---

### 🚀 Sprint 8 — Production Readiness

**Goal:** Performance, security hardening, testing, and deployment.

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-072 | Redis cache (sessions, rate limiting, categories) | ⏳ | 6h |
| HF-073 | Cron jobs (token cleanup, expired sessions, expired commission promotions) | ⏳ | 4h |
| HF-074 | V1 cleanup (remove in-memory stores, consolidate V2) | ⏳ | 4h |
| HF-075 | Production knex config + env setup | ⏳ | 3h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-076 | Performance (lazy loading, image optimization, < 15MB) | ⏳ | 6h |
| HF-077 | Offline data layer (cache categories, bookings, profile with MMKV/WatermelonDB) | ⏳ | 8h |
| HF-078 | Offline operation queue (queue mutations when offline, auto-sync on reconnect) | ⏳ | 8h |
| HF-079 | Sync conflict resolution + connectivity status UI (banner, retry, queue indicator) | ⏳ | 6h |

#### Shared:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-080 | E2E Testing (Jest/Supertest for API, Maestro for mobile) | ⏳ | 10h |
| HF-081 | CI/CD Pipeline (GitHub Actions → lint → test → build → deploy) | ⏳ | 8h |
| HF-082 | Security audit (OWASP, NID encryption, CORS) | ⏳ | 6h |
| HF-083 | Deployment execution (all services) | ⏳ | 8h |
| HF-084 | Documentation (API docs, developer guide, deployment runbook) | ⏳ | 6h |

---

## 6. Sprint Flow

```
Sprint 0: Foundation
    └──> Sprint 1: Auth Screens
           └──> Sprint 2: Home + Categories
                  └──> Sprint 3: Booking + Jobs
                         └──> Sprint 4: Voice + Accessibility
                                └──> Sprint 5: Payments + Wallet
                                       └──> Sprint 6: Reviews + Notifications + In-App Communication
                                              └──> Sprint 7: Web + Admin
                                                     └──> Sprint 8: Production
```

---

## 7. SRS Requirement Traceability Matrix

Every SRS requirement mapped to its implementing ticket(s):

| REQ | Description | Sprint | Ticket(s) |
|---|---|---|---|
| REQ-001 | Register via Phone + NID | S1 | HF-013, HF-014 |
| REQ-002 | Resident area during registration | S1 | HF-013 |
| REQ-003 | Provider NID upload + pending verification | S1, S2 | HF-014, HF-023 |
| REQ-004 | Role-based login | S1 | HF-015 |
| REQ-005 | Admin add/edit/delete categories | S2, S7 | HF-021, HF-069 |
| REQ-006 | Service "Requires Area" flag | S2, S3 | HF-021, HF-035 |
| REQ-007 | Provider GPS auto-detect | S6 | HF-049, HF-053 |
| REQ-008 | Book for different location | S3 | HF-036 |
| REQ-009 | Manual service address entry | S3 | HF-036 |
| REQ-010 | Upload photos/videos of issue | S3 | HF-034, HF-033 |
| REQ-011 | Voice note recording | S4 | HF-042 |
| REQ-012 | Voice-to-Text | S4 | HF-043 |
| REQ-013 | Text-to-Voice for providers | S4 | HF-044 |
| REQ-014 | Set estimated budget | S3 | HF-034 |
| REQ-015 | Provider job feed by trade | S3 | HF-038 |
| REQ-016 | Provider accepts → Active | S3 | HF-039 |
| REQ-017 | Provider finishes → Awaiting Payment | S3 | HF-041 |
| REQ-018 | Can't pay until Awaiting Payment | S5 | HF-059 |
| REQ-019 | Multiple payment methods | S5 | HF-054, HF-059 |
| REQ-020 | MFS Transaction ID input | S5 | HF-055, HF-059 |
| REQ-021 | 20% platform commission | S5 | HF-056 |
| REQ-022 | 80% to provider wallet | S5 | HF-057 |
| REQ-023 | Admin revenue dashboard | S5, S7 | HF-058, HF-070 |
| REQ-024 | Rating after payment only | S6 | HF-047, HF-050 |
| REQ-025 | Aggregate provider rating | S6 | HF-047 |
| REQ-026 | Rating on completed job cards | S6 | HF-050 |

---

## 8. Change Log

| Date | Version | Changes |
|---|---|---|
| 2026-04-19 | 1.0 | Initial plan created |
| 2026-04-19 | 2.0 | Full SRS incorporated, all decisions confirmed, file storage made pluggable, deployment plan added, 82 tickets across 9 sprints |
| 2026-05-26 | 3.0 | All sprints segregated by platform (Backend / Mobile / Web / Shared). Commission engine made configurable — added HF-056B (admin commission rules API) and HF-071B (admin commission UI). HF-073 extended for expired promotion cleanup. |
| 2026-05-28 | 3.1 | Sprint 1 closed. Current Focus updated to Sprint 2. Backend: UniqueViolationError handling moved from global error handler to repository layer via `db-error-map.ts` (scales cleanly as more tables/constraints are added). |
| 2026-05-28 | 3.2 | Post-Sprint-1 code review completed. Sprint 1 Hardening sprint added (HF-085 to HF-099, 15 tickets). Current Focus updated to Sprint 1 Hardening. Sprint 2 blocked until Group 1 + Group 2 hardening tickets are complete. Total tickets: 96. |
| 2026-05-29 | 3.4 | Sprint 2 mobile complete + QA bug fixes (availability toggle, tab bar structure, provider skills flow, admin approval screen). HF-068B added: mobile admin screen must be upgraded in Sprint 7 alongside HF-068 web panel to include provider detail view with NID/photo attachments before approve/reject. |
| 2026-05-28 | 3.3 | Sprint 2 backend complete (HF-021 to HF-024). Added fully DB-driven RBAC system (roles, permissions, role_permissions tables; admin API; PermissionCache; docs/RBAC.md). param() utility added to @utils for Express 5 route param access. 67 tests passing across 6 suites. |
| 2026-05-30 | 3.5 | Sprint 3 enhancements + bug fixes: HF-026A (AllProvidersScreen with search + category filter, capped home section); HF-036A (address step reverse/forward geocoding + home shortcut); HF-033A (resolveMediaUrl crash fix for non-string media_urls); HF-039A (Not Interested redesigned as text link); HF-040A (photo fullscreen viewer with pinch-to-zoom); HF-040B (ImageViewing crash on jobs without photos). Total sprint 3 tickets: 14. |
| 2026-05-30 | 3.6 | Sprint 3 closed. Additional polish tickets: HF-038A (nested TouchableOpacity Android content-clip fix); HF-038B (Yoga min-content-width Bengali truncation fix via alignItems:stretch); HF-038C (Button fixed height → minHeight+paddingVertical for complex scripts); HF-038D (DollarSign → Banknote icon). Sprint 3 total: 18 tickets. Sprint 4 opened — next ticket HF-042. |
| 2026-05-30 | 3.8 | Sprint order rebalanced: Sprint 5 ↔ Sprint 6 swapped. Payments + Wallet moved to Sprint 5 (was 6) so PAID job status is available before Sprint 6 (was 5) reviews are built. REQ-018–023 now S5; REQ-024–026 now S6; REQ-007 (GPS) now S6. SRS traceability matrix and Sprint Flow updated accordingly. |
| 2026-05-31 | 3.9 | Sprint 5 post-ship hardening. HF-057C: available-balance validation (blocks over-requesting when pending withdrawals exist), `GET /providers/wallet/withdrawals` endpoint, admin list enriched with provider name + MFS account + wallet balance + total_pending_paisa subquery. HF-060B: full withdrawal admin screen (list, complete/reject bottom-sheet modals, balance breakdown per row), provider wallet withdrawal history section, available-balance shown in withdraw modal, pending count badges on revenue CTAs. |
| 2026-05-31 | 4.0 | Sprint 5 UX polish. HF-058D: admin revenue financial summary card (6 at-a-glance metrics: total payments, verify-pending, platform revenue, provider wallets, provider withdrawn, pending withdrawals) rendered above the revenue hero card. HF-060C: provider withdrawal MFS account selector — multi-account providers choose which MFS account to receive funds; backend validates ownership; backend schema updated. HF-060D: date+time format upgrade to 12-hour clock across transaction history, withdrawal history, and admin withdrawal dashboard. HF-060E: admin "Complete Withdrawal" TxID auto-uppercase. |
| 2026-06-01 | 4.1 | Sprint 6 opened. HF-047: Review & rating module — `reviews` table (UNIQUE job_id), `avg_rating`/`review_count` on `users`, atomic aggregate update in transaction, `POST /v2/jobs/:id/review` (resident, PAID gate), `GET /v2/providers/:id/reviews` (public, paginated). 13 new tests, 261/261 passing. |
| 2026-05-30 | 3.7 | Sprint 4 closed. HF-042 (VoiceRecorder, expo-av); HF-045 (VoiceNotePlayer, expo-av); HF-044 (ReadAloudButton, expo-speech, REQ-013); HF-046 (accessibility audit — 30+ touchables labelled, 48px targets, WCAG AA verified, font-scale clean). HF-043 (Voice-to-Text) deferred — requires Whisper backend. 50/50 tests. Docs: TESTING_SPRINT4_MOBILE.md + SPRINT4_USER_MANUAL.md. Current Focus updated to Sprint 5. |

---

> See **## Current Focus** at the top of this file for the active sprint and next ticket per platform.
