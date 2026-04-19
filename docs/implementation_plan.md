# HomeFix — Full-Stack Implementation Plan

> **Version:** 2.0  
> **Prepared by:** Sr. Software Engineer  
> **Date:** 2026-04-19  
> **Last Updated:** 2026-04-19  
> **Methodology:** Agile (Sprint-based, ticket-level breakdown)  
> **Inputs:** SRS v1.0 + Architecture decisions

---

## Status Tracker

| Sprint | Status | Started | Completed |
|---|---|---|---|
| Sprint 0 — Foundation | ✅ Completed | 2026-04-19 | 2026-04-19 |
| Sprint 1 — Auth Screens | 🏗️ In Progress | 2026-04-19 | — |
| Sprint 2 — Home + Categories | ⏳ Not Started | — | — |
| Sprint 3 — Booking + Jobs | ⏳ Not Started | — | — |
| Sprint 4 — Voice + Accessibility | ⏳ Not Started | — | — |
| Sprint 5 — Reviews + Notifications | ⏳ Not Started | — | — |
| Sprint 6 — Payments + Wallet | ⏳ Not Started | — | — |
| Sprint 7 — Web + Admin | ⏳ Not Started | — | — |
| Sprint 8 — Production Readiness | ⏳ Not Started | — | — |

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
- **20% platform commission** with provider wallet system
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

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-001 | Monorepo restructure (npm workspaces) | ✅ | 4h |
| HF-002 | Shared types (UserRole, UserStatus, ErrorCode, JobStatus, PaymentStatus) | ✅ | 3h |
| HF-003 | Shared Zod schemas (registration, login) | ✅ | 3h |
| HF-004 | Shared constants (commission %, status machines) | ✅ | 2h |
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

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-012 | Splash + Onboarding carousel (3 slides, "Get Started" CTA) | ⏳ | 6h |
| HF-013 | Registration — Resident (multi-step: name+mobile+NID → location → email+password) | ⏳ | 10h |
| HF-014 | Registration — Provider (extends resident: NID photo upload, profile photo) | ⏳ | 6h |
| HF-015 | Login screen (mobile/email + password, device ID generation) | ⏳ | 6h |
| HF-016 | Auth Zustand store (user, tokens, isAuthenticated, login/logout/refresh) | ⏳ | 6h |
| HF-017 | Token refresh Axios interceptor (401 → refresh → retry, SESSION_EXPIRED → logout) | ⏳ | 6h |
| HF-018 | Logout flow + "Logout all devices" | ⏳ | 3h |
| HF-019 | Pending approval screen (provider after registration) | ⏳ | 3h |
| HF-020 | Backend fix: `await` in seed + CORS restriction + consolidate duplicate functions | ⏳ | 4h |

**Deliverable:** Full auth flow — register, login, pending state, auto-refresh, logout.

---

### 🏠 Sprint 2 — Home, Navigation & Service Catalog

**Goal:** Main app shell, service categories, provider profiles.

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-021 | Service categories module (CRUD, `requires_area` flag per REQ-006) | ⏳ | 6h |
| HF-022 | Provider profile + skills module (link to categories, availability, pricing) | ⏳ | 8h |
| HF-023 | Provider approval API (admin: list pending, approve, reject — REQ-003) | ⏳ | 6h |
| HF-024 | File storage — pluggable interface (local disk now, S3 later) | ⏳ | 6h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-025 | Tab navigation (Resident: Home/Bookings/Profile, Provider: Home/Jobs/Profile) | ⏳ | 4h |
| HF-026 | Resident home screen (category grid with icons, search bar, "near you" section) | ⏳ | 8h |
| HF-027 | Category listing — providers filtered by category, distance, rating | ⏳ | 6h |
| HF-028 | Provider detail screen (skills, rating, reviews, "Book Now" CTA) | ⏳ | 6h |
| HF-029 | Provider home screen (dashboard: active jobs, earnings, availability toggle) | ⏳ | 6h |
| HF-030 | Profile screen (view/edit, photo upload, location update, language pref) | ⏳ | 6h |

**Deliverable:** Main app with category browsing, provider discovery, profiles.

---

### 📋 Sprint 3 — Booking & Job Lifecycle

**Goal:** Full booking flow per SRS: `Pending → Active → Awaiting Payment → Paid`

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-031 | Job/Booking module — state machine (REQ-015 to REQ-018) | ⏳ | 10h |
| HF-032 | Location-based provider search (PostGIS — REQ-007,008) | ⏳ | 6h |
| HF-033 | Job media storage (photos, videos, voice notes — REQ-010) | ⏳ | 4h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-034 | Create booking flow (category → describe → photos → address → date → budget) | ⏳ | 10h |
| HF-035 | Area input — conditional sq. footage when `requires_area` (REQ-006) | ⏳ | 3h |
| HF-036 | Service address input — separate from home address (REQ-008,009) | ⏳ | 4h |
| HF-037 | Resident bookings list (Upcoming, Active, Awaiting Payment, Completed) | ⏳ | 6h |
| HF-038 | Provider job feed — available jobs by trade, sorted by distance (REQ-015) | ⏳ | 6h |
| HF-039 | Job accept/reject for provider (REQ-016) | ⏳ | 4h |
| HF-040 | Job status tracking card (real-time updates) | ⏳ | 6h |
| HF-041 | Provider marks "Work Complete" → Awaiting Payment (REQ-017) | ⏳ | 3h |

**Deliverable:** End-to-end booking flow with status machine.

---

### 🎙️ Sprint 4 — Voice & Accessibility (Differentiator)

**Goal:** Voice-first features per SRS REQ-011, 012, 013.

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-042 | Voice note recording in booking (expo-av — REQ-011) | ⏳ | 6h |
| HF-043 | Voice-to-Text / Speech-to-Text (REQ-012) | ⏳ | 6h |
| HF-044 | Text-to-Voice — "Read aloud" button for providers (REQ-013) | ⏳ | 4h |
| HF-045 | Voice note playback in provider job view | ⏳ | 3h |
| HF-046 | Accessibility audit — large fonts, high contrast, screen reader | ⏳ | 4h |

**Deliverable:** Full voice accessibility — record, transcribe, read aloud.

---

### ⭐ Sprint 5 — Reviews, Notifications & Real-time

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-047 | Review & rating module (post-payment only — REQ-024,025,026) | ⏳ | 6h |
| HF-048 | Push notification service (FCM) | ⏳ | 8h |
| HF-049 | Provider background GPS tracking API (REQ-007) | ⏳ | 4h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-050 | Review & rating screen (star + text, post-payment only) | ⏳ | 6h |
| HF-051 | Push notification setup (expo-notifications, deep linking) | ⏳ | 6h |
| HF-052 | Notification center (bell icon, badge, read/unread) | ⏳ | 6h |
| HF-053 | Provider location tracking (background GPS) | ⏳ | 6h |

**Deliverable:** Reviews, push notifications, provider GPS tracking.

---

### 💳 Sprint 6 — Payments & Wallet

#### Backend:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-054 | Payment interface (pluggable strategy pattern) | ⏳ | 4h |
| HF-055 | Manual gateway (bKash/Nagad — TxID entry — REQ-019,020) | ⏳ | 6h |
| HF-056 | Commission engine (20% platform fee — REQ-021) | ⏳ | 4h |
| HF-057 | Provider wallet/ledger (80% credit — REQ-022) | ⏳ | 6h |
| HF-058 | Admin revenue dashboard API (REQ-023) | ⏳ | 4h |

#### Mobile:

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-059 | Payment screen (method selection, TxID input, order summary) | ⏳ | 8h |
| HF-060 | Provider wallet screen (balance, earnings, commission breakdown) | ⏳ | 6h |
| HF-061 | Payment receipt + completion flow | ⏳ | 3h |

**Deliverable:** Full payment flow with wallet + commission system.

---

### 🌐 Sprint 7 — Web App & Admin Panel

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-062 | Next.js project init + shared package imports | ⏳ | 4h |
| HF-063 | Web design system (CSS custom properties, responsive, dark mode) | ⏳ | 8h |
| HF-064 | Web auth pages (login, register, cookie-based auth) | ⏳ | 8h |
| HF-065 | Web landing page (marketing, SEO, download CTA) | ⏳ | 8h |
| HF-066 | Web resident dashboard (browse, book, manage) | ⏳ | 10h |
| HF-067 | Web provider dashboard (jobs, wallet, profile) | ⏳ | 8h |
| HF-068 | Admin panel — provider verification (approve/reject + NID preview) | ⏳ | 8h |
| HF-069 | Admin panel — service category management (CRUD, requires_area) | ⏳ | 6h |
| HF-070 | Admin panel — revenue dashboard (total revenue, commission) | ⏳ | 6h |
| HF-071 | Admin panel — user management (list, search, status change) | ⏳ | 6h |

**Deliverable:** Full web app + admin panel.

---

### 🚀 Sprint 8 — Production Readiness

| Ticket | Title | Status | Est. |
|---|---|---|---|
| HF-072 | Backend — Redis cache (sessions, rate limiting, categories) | ⏳ | 6h |
| HF-073 | Backend — Cron jobs (token cleanup, expired sessions) | ⏳ | 4h |
| HF-074 | Backend — V1 cleanup (remove in-memory stores, consolidate V2) | ⏳ | 4h |
| HF-075 | Backend — Production knex config + env setup | ⏳ | 3h |
| HF-076 | Mobile — Performance (lazy loading, image optimization, < 15MB) | ⏳ | 6h |
| HF-077 | Mobile — Offline data layer (cache categories, bookings, profile with MMKV/WatermelonDB) | ⏳ | 8h |
| HF-078 | Mobile — Offline operation queue (queue mutations when offline, auto-sync on reconnect) | ⏳ | 8h |
| HF-079 | Mobile — Sync conflict resolution + connectivity status UI (banner, retry, queue indicator) | ⏳ | 6h |
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
                                └──> Sprint 5: Reviews + Notifications
                                       └──> Sprint 6: Payments + Wallet
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
| REQ-007 | Provider GPS auto-detect | S5 | HF-049, HF-053 |
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
| REQ-018 | Can't pay until Awaiting Payment | S6 | HF-059 |
| REQ-019 | Multiple payment methods | S6 | HF-054, HF-059 |
| REQ-020 | MFS Transaction ID input | S6 | HF-055, HF-059 |
| REQ-021 | 20% platform commission | S6 | HF-056 |
| REQ-022 | 80% to provider wallet | S6 | HF-057 |
| REQ-023 | Admin revenue dashboard | S6, S7 | HF-058, HF-070 |
| REQ-024 | Rating after payment only | S5 | HF-047, HF-050 |
| REQ-025 | Aggregate provider rating | S5 | HF-047 |
| REQ-026 | Rating on completed job cards | S5 | HF-050 |

---

## 8. Change Log

| Date | Version | Changes |
|---|---|---|
| 2026-04-19 | 1.0 | Initial plan created |
| 2026-04-19 | 2.0 | Full SRS incorporated, all decisions confirmed, file storage made pluggable, deployment plan added, 82 tickets across 9 sprints |

---

> **Next Step:** Sprint 0, Ticket HF-001 — Monorepo restructure
