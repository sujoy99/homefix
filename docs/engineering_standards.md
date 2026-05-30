# HomeFix — Engineering Standards & Coding Guidelines

> **Version:** 1.0  
> **Date:** 2026-04-19  
> **Applies to:** Backend, Mobile (React Native), Web (Next.js), Shared Packages

---

## 1. Code Quality Principles

1. **Clean Code** — Every function does ONE thing. Name it so clearly that comments are unnecessary.
2. **No Magic Values** — All constants live in shared constants. No hardcoded strings/numbers in logic.
3. **Fail Fast** — Validate at the boundary (controller/screen), trust data inside services.
4. **Separation of Concerns** — UI knows nothing about HTTP. Services know nothing about Express. Repositories know nothing about business rules.
5. **Type Safety** — No `any` unless absolutely necessary (and must be commented why). Strict TypeScript mode everywhere.
6. **DRY but not WET** — Share logic through shared packages. Don't abstract prematurely.
7. **Explicit over Implicit** — Prefer named exports. Prefer explicit types over inference for public APIs.

---

## 2. Project Structure Standards

### 2.1 Backend (Existing Pattern — Maintained)

```
backend/src/
├── config/          # Environment, DB, Swagger config
├── db/
│   ├── migrations/  # Knex migrations (timestamped)
│   └── seeds/       # Seed data
├── errors/          # AppError, ErrorCode, error handler
├── http/            # Response contracts (HttpResponse)
├── logger/          # Winston logger setup
├── middlewares/     # Cross-cutting: auth, validation, rate-limit
├── modules/         # ⭐ Business domains (feature-based)
│   ├── auth/
│   │   ├── auth.controller.ts   # HTTP layer (req/res only)
│   │   ├── auth.service.ts      # Business logic (no HTTP)
│   │   ├── auth.repository.ts   # Data access (no business logic)
│   │   ├── auth.model.ts        # ORM model (Objection.js)
│   │   ├── auth.schema.ts       # Zod validation
│   │   ├── auth.dto.ts          # Data transfer types
│   │   ├── auth.types.ts        # Domain types
│   │   └── auth.route.ts        # Route definitions + Swagger
│   ├── users/
│   ├── jobs/
│   ├── categories/
│   ├── payments/
│   ├── reviews/
│   └── storage/     # Pluggable file storage
├── routes/          # Version-based route registration
├── types/           # Express augmentation, global types
└── utils/           # Pure utility functions
```

**Rule:** Every module follows `controller → service → repository → model` pattern.

### 2.2 Mobile (React Native + Expo)

```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout (providers, theme)
│   ├── (auth)/             # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   └── (app)/              # App group (authenticated)
│       ├── _layout.tsx     # Tab navigator
│       ├── (home)/
│       ├── (bookings)/
│       └── (profile)/
├── components/             # Reusable UI components
│   ├── ui/                 # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Text.tsx
│   │   ├── Card.tsx
│   │   └── Screen.tsx
│   ├── forms/              # Form-specific components
│   └── shared/             # Domain-specific shared components
├── hooks/                  # Custom React hooks
├── services/               # API service layer
│   ├── api.ts              # Axios instance + interceptors
│   ├── auth.service.ts     # Auth API calls
│   ├── jobs.service.ts
│   └── ...
├── stores/                 # Zustand stores
│   ├── auth.store.ts
│   ├── app.store.ts
│   └── ...
├── lib/                    # Utilities, helpers
│   ├── storage.ts          # SecureStore wrapper
│   ├── device.ts           # Device info helper
│   └── format.ts           # Currency, date formatters
├── i18n/                   # Localization config
│   ├── index.ts
│   ├── bn.json
│   └── en.json
├── theme/                  # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
├── constants/              # App constants
└── types/                  # TypeScript types
```

**Rules:**
- Screens live in `app/` (Expo Router convention)
- Components are **stateless** where possible — state lives in stores/hooks
- Every API call goes through `services/` — screens never call Axios directly
- No inline styles — use theme tokens

### 2.3 Shared Package

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.types.ts       # UserRole, UserStatus
│   │   ├── auth.types.ts       # ErrorCode, JwtPayload
│   │   ├── job.types.ts        # JobStatus, BookingRequest
│   │   └── payment.types.ts    # PaymentMethod, PaymentStatus
│   ├── validation/
│   │   ├── auth.schema.ts      # Registration, login schemas
│   │   └── job.schema.ts       # Booking schemas
│   ├── constants/
│   │   ├── commission.ts       # DEFAULT_COMMISSION_RATE = 0.20 (fallback only — live rate resolved from DB at payment time)
│   │   ├── status.ts           # Status machine definitions
│   │   └── roles.ts            # Role-permission mappings
│   └── index.ts                # Barrel exports
├── package.json
└── tsconfig.json
```

---

## 3. Naming Conventions

### 3.1 Files

| Type | Convention | Example |
|---|---|---|
| Component | PascalCase | `Button.tsx`, `JobCard.tsx` |
| Screen | camelCase (Expo Router) | `login.tsx`, `[id].tsx` |
| Service | camelCase + `.service` | `auth.service.ts` |
| Store | camelCase + `.store` | `auth.store.ts` |
| Hook | camelCase + `use` prefix | `useAuth.ts` |
| Type | camelCase + `.types` | `user.types.ts` |
| Schema | camelCase + `.schema` | `auth.schema.ts` |
| Test | same name + `.test` | `auth.service.test.ts` |
| Constants | camelCase | `commission.ts` |

### 3.2 Variables & Functions

```typescript
// ✅ Good
const isAuthenticated = true;
const userRole = UserRole.RESIDENT;
function calculateCommission(amount: number): number { ... }
async function fetchProvidersByCategory(categoryId: string): Promise<Provider[]> { ... }

// ❌ Bad
const auth = true;           // Too vague
const r = UserRole.RESIDENT; // Single letter
function calc(a: number) {}  // Abbreviated
```

### 3.3 Types & Interfaces

```typescript
// Types for data shapes
type User = { id: string; name: string; };
type CreateJobRequest = { ... };

// Enums for fixed sets
enum UserRole { RESIDENT = 'resident', PROVIDER = 'provider', ADMIN = 'admin' }
enum JobStatus { PENDING = 'pending', ACTIVE = 'active' }

// Interfaces for contracts/behaviors
interface StorageProvider { save(file: Buffer): Promise<string>; }
interface PaymentGateway { processPayment(data: PaymentData): Promise<PaymentResult>; }
```

---

## 4. Error Handling Standards

### Backend
- All errors extend `AppError`
- Every error has an `ErrorCode` enum value
- Controller never throws — uses `asyncHandler` wrapper
- Service throws domain errors — controller catches nothing
- Global error handler formats all responses consistently

### Mobile
- API errors mapped to user-friendly messages via `ErrorCode`
- Network errors show offline state / retry UI
- Form validation errors shown inline per field
- Unexpected errors logged + generic toast

---

## 5. API Contract Standards

### Request
```
POST /api/v2/auth/login
Content-Type: application/json
Authorization: Bearer <access_token>  (when required)

{
  "method": "password",
  "mobile": "01712345678",
  "password": "Password@123",
  "deviceId": "android-device-1"
}
```

### Success Response
```json
{
  "http_code": 200,
  "message": "Login successful",
  "body": { ... }
}
```

### Error Response
```json
{
  "http_code": 401,
  "error_code": "INVALID_CREDENTIALS",
  "message": "Invalid credentials",
  "body": null
}
```

### Paginated Response
```json
{
  "http_code": 200,
  "message": "Success",
  "body": {
    "items": [],
    "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
  }
}
```

---

## 6. Git Conventions

### Branch Naming
```
feature/HF-001-monorepo-setup
bugfix/HF-020-seed-await
hotfix/cors-origin-restriction
```

### Commit Messages (Conventional Commits)
```
feat(auth): implement refresh token rotation
fix(seed): add missing await on createUser
refactor(auth): consolidate duplicate JWT functions
chore(deps): update expo to SDK 53
docs(plan): update sprint 0 status
```

### PR Checklist
- [ ] Types are strict (no `any`)
- [ ] Error cases handled
- [ ] Bilingual strings added (bn + en)
- [ ] Mobile: tested on Android
- [ ] API: Swagger docs updated
- [ ] No hardcoded values

---

## 7. Performance Standards

### Mobile
- **App bundle:** < 15MB
- **Screen load:** < 300ms (perceived)
- **API calls:** Show skeleton/shimmer while loading
- **Images:** Lazy load + progressive, cached
- **Lists:** Virtualized (FlatList with keyExtractor)
- **Animations:** 60fps (Reanimated, not Animated API)

### Backend
- **API response:** < 200ms (p95)
- **DB queries:** Indexed, no N+1
- **Pagination:** Cursor-based for feeds, offset for admin
- **Connection pool:** min 2, max 10

---

## 8. Security Standards

### Backend
- Helmet headers on all responses
- CORS restricted to known origins
- Rate limiting (global + per-route)
- bcrypt cost factor 12 for passwords
- JWT: short-lived access (5-15min), refresh rotation
- Input validation at controller boundary (Zod)
- No sensitive data in logs (masking enabled)
- SQL injection prevention (parameterized queries via Knex)

### Mobile
- Tokens in encrypted SecureStore (never AsyncStorage)
- No sensitive data in Redux/Zustand persist
- Certificate pinning (production)
- Biometric gate for sensitive operations

---

## 9. Testing Strategy

Tests are written **alongside code in every sprint** — not deferred to Sprint 8. Sprint 8 (HF-080) only adds E2E test suites and CI integration.

### Within-Ticket Test Order (mandatory sequence)

Every backend ticket follows this exact sequence before committing:

```
1. Implement code
2. Write unit tests   (pure logic — no DB, no HTTP)
3. Write integration tests (multi-table writes, state-machine guards, API error codes)
4. npm run type-check  → must be zero errors
5. npm test -- --testPathPattern="<module>" --forceExit  → must be 100% pass
6. Commit
```

**What gets unit tests vs integration tests:**

| Scenario | Test type | Example |
|----------|-----------|---------|
| Rate resolution priority (promotion > category > global) | Unit | `commission.service.test.ts` |
| Paisa arithmetic (floor, not round) | Unit | `commission.service.test.ts` |
| TxID format validation | Unit | `payment.schema.test.ts` |
| Gateway selection from platform_settings | Unit (mock DB) | `payment.service.test.ts` |
| Atomic DB write (wallet + ledger + status in one trx) | Integration | `payment.service.test.ts` |
| Job status guard (accept blocked below 70% profile) | Integration | `job.service.test.ts` |
| API error codes (401, 403, 400 per endpoint) | Integration | `payment.controller.test.ts` |

**What does NOT need automated tests:**
- Simple getter endpoints with no business logic (e.g. `GET /v2/admin/revenue` aggregation) — covered by manual QA
- Trivial CRUD with no side effects — covered by integration test of the main flow that uses it

| Layer | Tool | When | Coverage Target |
|---|---|---|---|
| Backend unit | Jest + ts-jest | Every sprint, per new service | Services + utils: 80% |
| Backend integration | Supertest | Every sprint, per new route | All API endpoints: success + 401 + validation |
| Shared (packages/shared) | Jest | Per new schema or utility | Zod schemas + utils: 100% branch |
| Mobile unit | Jest + ts-jest | Every sprint, per new service function | Service layer: happy path + error states |
| Mobile component | React Native Testing Library | Every sprint, per interactive screen | Primary user action per screen |
| Web component | React Testing Library | Sprint 7+, per client component | Primary user action per component |
| Web / Mobile E2E | Playwright (web) · Maestro (mobile) | Sprint 8 (HF-080) | Auth, booking, payment flows |

### Test File Location

```
backend/src/modules/auth/
├── auth.service.ts
├── auth.service.test.ts       ← unit tests live next to the file
├── auth.controller.test.ts    ← integration tests (Supertest)
└── ...
```

### Infrastructure Setup

**HF-009 — Backend** (set up before Sprint 2 begins):
- `jest.config.ts` with `ts-jest` and path alias support
- Separate `.env.test` pointing to a dedicated test database
- `beforeAll` / `afterAll` hooks to run migrations + truncate tables between tests
- Factory helpers (e.g. `createTestUser()`) in `src/test/factories/`

**HF-009B — Mobile** (set up before Sprint 2 mobile tickets begin):
- `jest.config.ts` inside `mobile/` with `ts-jest` + Expo preset
- Mocks for `expo-secure-store`, `expo-router`, and Axios (`mobile/__mocks__/`)
- Factory helpers for common test data (e.g. `mockAuthState()`) in `mobile/__tests__/factories/`

**Web** (set up as first task in Sprint 7, HF-062):
- Playwright config pointing at local dev server for E2E
- `jest.config.ts` + `@testing-library/react` for component tests
- MSW (Mock Service Worker) for API mocking in component tests

---

## 9. Sprint Test Completion Standard

> **Every sprint MUST have all automated tests passing before the branch is merged to master.**

### Rule

No sprint is "done" until:
1. All new automated tests for that sprint are written and **pass 100%**
2. Existing tests from previous sprints still pass (no regressions)
3. A `TESTING_SPRINT<N>_<PLATFORM>.md` test guide is written

### Backend (per sprint)

```bash
# Run only the new sprint's tests
npm test -- --testPathPattern="<module>" --forceExit

# Run the full backend suite (regression check)
npm test -- --forceExit
```

Checklist before merge:
- [ ] Integration tests cover all new endpoints (happy path + each error code)
- [ ] New factory helpers added to `tests/factories/`
- [ ] `tests/helpers/db.ts::truncateAll` updated with any new tables
- [ ] TypeScript type-check passes: `npm run type-check`

### Mobile (per sprint)

```bash
cd mobile && npx jest --forceExit
```

Checklist before merge:
- [ ] Store tests cover state transitions
- [ ] Service layer tests mock the API client
- [ ] No `console.error` output from failing renders

### What "passing tests" means

| Signal | Interpretation |
|--------|----------------|
| `Tests: N passed, N total` | ✅ Ship it |
| Any `✕` in output | ❌ Do not merge — fix first |
| Type-check error | ❌ Do not merge — fix first |
| Test suite times out | ❌ Investigate DB connection / lock issues |

### Automated test report format

Each sprint produces a `docs/TESTING_SPRINT<N>_<PLATFORM>.md` with:
- Automated test result table (passed/failed counts)
- Manual test cases for flows that can't be automated (file upload golden path, map UI)
- Error code reference for new codes introduced in that sprint
- Setup instructions (migrations, seeds, env)

**Document naming convention (two files per sprint):**
- `docs/SPRINT<N>_USER_MANUAL.md` — Screen-by-screen guide for QA/business stakeholders; step-by-step with result checkboxes
- `docs/TESTING_SPRINT<N>_BACKEND.md` — Backend automated test results + API-level manual cases + error code reference
- `docs/TESTING_SPRINT<N>_MOBILE.md` — Mobile automated test results + mobile error code mapping

**Reference files:** `docs/SPRINT1_USER_MANUAL.md`, `docs/SPRINT2_USER_MANUAL.md`, `docs/SPRINT3_USER_MANUAL.md`, `docs/TESTING_SPRINT3_BACKEND.md`, `docs/TESTING_SPRINT3_MOBILE.md`

---

> These standards will be enforced from Sprint 0 onwards. Any deviation must be documented with rationale.
