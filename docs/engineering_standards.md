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
│   │   ├── commission.ts       # PLATFORM_COMMISSION_RATE = 0.20
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

## 9. Testing Strategy (Sprint 8)

| Layer | Tool | Coverage Target |
|---|---|---|
| Backend unit | Jest | Services, utils: 80% |
| Backend integration | Supertest | All API endpoints |
| Mobile E2E | Maestro | Critical flows: auth, booking, payment |
| Shared | Jest | Validation schemas: 100% |

---

> These standards will be enforced from Sprint 0 onwards. Any deviation must be documented with rationale.
