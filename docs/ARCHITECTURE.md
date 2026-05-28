# HomeFix — System Architecture

## System Overview

HomeFix is a three-sided marketplace:

```
Resident ──books──> Job ──assigned──> Provider
                     │
                  Admin (verifies providers, manages catalog, views revenue)
```

Core domains: **Auth/Identity · Users · Service Categories · Jobs · Payments · Wallet · Reviews · Notifications · Storage**

## Request Lifecycle (Backend)

```
HTTP Request
  → Helmet (security headers)
  → Rate Limiter (global)
  → CORS
  → JSON Body Parser
  → requestId (UUID per request)
  → requestLogger (Winston)
  → Route match (/api/v1 | /api/v2)
      → validate(zodSchema)   [if route uses it]
      → authGuard             [if protected]
      → permissionGuard(...)  [if RBAC required]
      → asyncHandler(controller)
          → Service (business logic)
              → Repository (Objection.js queries)
          → HttpResponse.success/paginated
  → errorHandler (catches AppError + DB errors → HttpResponse.error)
```

## Job State Machine (REQ-015 to REQ-018)

```
PENDING  ──provider accepts──> ACTIVE  ──provider marks done──> AWAITING_PAYMENT  ──resident pays──> PAID
           (REQ-016)                       (REQ-017)                                  (REQ-018,019)
```

State transitions are server-enforced. Invalid transitions return 400. Payment API rejects if status ≠ `AWAITING_PAYMENT`.

## Authentication Flow

```
Registration
  └─> users table (identity) + auth_accounts table (credentials/method)
      └─> provider status = PENDING (requires admin approval)

Login (password method)
  └─> verify password → check account lock → detect new device
      └─> TRANSACTION: mark login success + store refresh token
          └─> return access_token (short-lived) + refresh_token (long-lived, DB-stored)

Protected Request
  └─> authGuard: verify JWT signature → check status=active → attach req.user
      (no DB call — stateless)

Token Refresh
  └─> verify refresh JWT → load from DB → check revoked/expired/version
      └─> TRANSACTION: revoke old token + issue new refresh token
          └─> return new access_token + new refresh_token

Reuse Attack
  └─> revoked token presented → invalidate ALL sessions for user → force re-login
```

## Domain Model

```
users (1) ──────────── (*) auth_accounts      (one per auth method: password/otp/google)
users (1) ──────────── (*) auth_refresh_tokens (one per device session)
users (1) ──────────── (*) jobs               (as resident: created_by)
users (1) ──────────── (*) jobs               (as provider: assigned_to)
jobs  (1) ──────────── (1) payments
jobs  (1) ──────────── (1) reviews
service_categories (1) ─── (*) jobs
users (1) ──────────── (1) wallets            (providers only)
wallets (1) ─────────── (*) wallet_transactions
```

Key fields:
- `users.area` — PostGIS `geometry(Point, 4326)` for geo-queries
- `users.status` — `pending | active | inactive` (provider = pending until admin approves)
- `auth_accounts.refresh_token_version` — UUID rotated on logout-all; version mismatch = invalid session
- `auth_refresh_tokens.is_revoked` — revoked on use (rotation) or logout
- `service_categories.requires_area` — when true, booking flow prompts for sq. footage

## Pluggable Interfaces

### File Storage

```
modules/storage/
├── storage.interface.ts        # save(file): Promise<string>, delete(key): Promise<void>
├── providers/
│   ├── local.storage.ts        # Phase 1: ./uploads/ (Docker volume)
│   └── s3.storage.ts           # Phase 2: AWS S3 (swap without changing callers)
└── storage.service.ts          # Injects correct provider via env flag
```

NID photos and job media go through this interface. Never reference a storage provider directly outside `storage.service.ts`.

### Payment Gateway

```
modules/payments/
├── payment.interface.ts        # processPayment(data): Promise<PaymentResult>
├── gateways/
│   ├── manual.gateway.ts       # Phase 1: bKash/Nagad manual TxID entry
│   └── sslcommerz.gateway.ts   # Phase 2: SSLCommerz card/MFS integration
├── payment.service.ts          # Commission engine (rate resolved from DB, not hardcoded)
└── wallet/                     # Provider balance ledger
```

## Commission Engine (REQ-021 to REQ-023)

The commission rate is resolved at payment time from the `commission_rules` table — it is **not a constant**. Resolution priority: active promotion for the job's category → category-level override → global platform default (initially 20%).

```
Job total: ৳1,000  |  Effective rate R = resolved from commission_rules
  Platform fee (R%):   ৳1,000 × R      → platform_revenue_ledger + commission_rule_id recorded
  Provider net ((1−R)%): ৳1,000 × (1−R) → provider wallet balance
```

The resolved `commission_rate` and `commission_rule_id` are locked onto the `payments` row at write time. Admin rate changes never retroactively affect past payments. See [docs/brd/PAYMENT_SYSTEM.md](brd/PAYMENT_SYSTEM.md) for the full `commission_rules` data model and admin management API.

## Geo-Location (PostGIS)

Provider locations stored as `geometry(Point, 4326)`. Job discovery queries use `ST_DWithin` for radius search and `ST_Distance` for sorting by proximity. Always pass `(longitude, latitude)` order to `ST_MakePoint`.

## Real-time (Sprint 5)

WebSocket via `ws` or Socket.IO. Events:
- `job:status_changed` → resident + provider
- `job:assigned` → resident (provider accepted)
- `payment:confirmed` → provider (wallet credited)
- `notification:new` → user (push via FCM as fallback)

## Caching Strategy (Sprint 8)

Redis (Upstash) targets:
- Service categories (rarely change) — TTL 1 hour
- Provider profiles for job feed — TTL 5 min
- Rate-limit counters (per IP/user)
- Session revocation blacklist (future access token invalidation)
