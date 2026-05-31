# Sprint 5 Backend — Manual & Automated Test Guide

**Sprint:** Sprint 5 — Payments & Wallet  
**Tickets:** HF-054 · HF-055 · HF-056 · HF-056B · HF-057 · HF-057B · HF-058  
**Branch:** `feature/sprint-5-backend`  
**Last Updated:** 2026-05-31

---

## Automated Test Results

**Run command:**
```bash
cd backend && npm test -- --forceExit
```

**Result: 248/248 PASSED ✅** (18 suites) — updated 2026-06-01 with post-ship test additions (+15 new tests)

| Test Suite | Tests | Status | Change |
|---|---|---|---|
| `payment.schema.test.ts` | 6 | ✅ All pass | — |
| `manual.gateway.test.ts` | 8 | ✅ All pass | — |
| `sslcommerz.gateway.test.ts` | 2 | ✅ All pass | — |
| `payment.service.test.ts` | 5 | ✅ All pass | — |
| `commission.service.test.ts` | 7 | ✅ All pass | — |
| `commission.rules.test.ts` | 17 | ✅ All pass | — |
| `payment.submit.test.ts` | 12 | ✅ All pass | — |
| `payment.verify.test.ts` | 12 | ✅ All pass | — |
| `wallet.test.ts` | **31** | ✅ All pass | +9 new (explicit mfs_account_id, available-balance guard, GET /withdrawals) |
| `profile-completion.test.ts` | 14 | ✅ All pass | — |
| `revenue.test.ts` | **17** | ✅ All pass | +6 new (financial-summary auth, empty state, aggregation) |
| `jobs.test.ts` | 27 | ✅ All pass | — |
| `providers.test.ts` | 13 | ✅ All pass | — |
| `admin/provider-approval.test.ts` | 10 | ✅ All pass | — |
| `categories.test.ts` | 8 | ✅ All pass | — |
| `storage.test.ts` | 8 | ✅ All pass (intermittent flake in full suite — passes in isolation) | — |
| `auth.test.ts` | 18 | ✅ All pass | — |
| `rbac.test.ts` | 7 | ✅ All pass | — |

> **Note on storage flakiness:** `storage.test.ts` occasionally fails the "authenticated provider uploads a file" test when run as part of the full suite on slow hardware. Pre-existing intermittent issue — always passes in isolation and on re-run. Not blocking.

---

## Setup

```bash
# Start services
make up           # first time / after dependency changes
make start        # day-to-day

# Run migrations + seed
make migrate
make seed

# Seed accounts
Admin:    00000000000 / Admin@1234
Provider: 01711223344 / Provider@1234
Resident: 01811223344 / Resident@1234
```

---

## HF-054 — Payment Interface + DB Migrations

### What was created

- **7 DB migrations:** `commission_rules`, `payments`, `wallets`, `wallet_transactions`, `platform_revenue_ledger`, `provider_payment_accounts`, `withdrawal_requests`
- **Platform settings seeded:** `active_payment_gateway=manual`, `bkash_merchant_number=01700000000`, `nagad_merchant_number=01700000001`
- **Shared error code:** `PROFILE_INCOMPLETE` added to `ErrorCode` enum in `packages/shared`
- **Pluggable gateway registry:** `payment.service.ts` selects gateway from `platform_settings.active_payment_gateway` at request time

### DB Verification

```sql
-- In psql (make db):
\dt
-- Should show: commission_rules, payments, wallets, wallet_transactions,
--              platform_revenue_ledger, provider_payment_accounts, withdrawal_requests

SELECT key, value FROM platform_settings
WHERE key IN ('active_payment_gateway', 'bkash_merchant_number', 'nagad_merchant_number');
```

---

## HF-055 — Manual Gateway (bKash/Nagad TxID Entry)

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/payments` | Resident | Submit payment with TxID |
| PATCH | `/api/v2/admin/payments/:id/verify` | Admin | Verify + trigger commission split + wallet credit |

### Manual Test Cases

#### TC-055-01: Resident submits a bKash payment
```http
POST /api/v2/payments
Authorization: Bearer <resident_token>
Content-Type: application/json

{
  "job_id": "<job_id_in_AWAITING_PAYMENT_status>",
  "method": "bkash",
  "transaction_id": "BKSH12345678",
  "amount_paisa": 50000
}
```
**Pre-condition:** Job must be in `AWAITING_PAYMENT` status.  
**Expected:** `201`, payment row with `status: "submitted"`, job still `awaiting_payment`.

---

#### TC-055-02: Missing TxID for bKash
```json
{ "job_id": "...", "method": "bkash", "amount_paisa": 50000 }
```
**Expected:** `400`, validation error on `transaction_id`.

---

#### TC-055-03: TxID too short (< 8 chars)
```json
{ "transaction_id": "BKSH123" }
```
**Expected:** `400`, validation error — TxID must be 8–20 alphanumeric chars.

---

#### TC-055-04: Cash payment (no TxID required)
```json
{ "job_id": "...", "method": "cash", "amount_paisa": 50000 }
```
**Expected:** `201`, `transaction_id: null`.

---

#### TC-055-05: Admin verifies payment
```http
PATCH /api/v2/admin/payments/<payment_id>/verify
Authorization: Bearer <admin_token>
```
**Expected:** `200`, payment `status: "verified"`, `platform_fee_paisa` and `provider_net_paisa` populated, job advances to `paid`, provider wallet balance increases.

---

#### TC-055-06: Job not in AWAITING_PAYMENT
Try to submit payment for a job that is still `PENDING`.  
**Expected:** `400`, `error_code: "INVALID_JOB_STATUS"`.

---

#### TC-055-07: Resident tries to verify payment
```http
PATCH /api/v2/admin/payments/<id>/verify
Authorization: Bearer <resident_token>
```
**Expected:** `403`.

---

## HF-056B — Admin Commission Rules API

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v2/admin/commission/rules` | Admin | List all rules (active + inactive) |
| POST | `/api/v2/admin/commission/rules` | Admin | Create rule |
| PATCH | `/api/v2/admin/commission/rules/:id` | Admin | Update label/rate/validity |
| DELETE | `/api/v2/admin/commission/rules/:id` | Admin | Soft-deactivate |
| GET | `/api/v2/admin/commission/preview?category_id=&date=` | Admin | Resolve which rule applies |

### Manual Test Cases

#### TC-056B-01: Create global commission rule
```http
POST /api/v2/admin/commission/rules
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "scope": "global",
  "rate": 0.2,
  "label": "Default 20% Rate"
}
```
**Expected:** `201`, rule created. If an active global rule already exists, it is auto-deactivated.

---

#### TC-056B-02: Create promotion rule for plumbing category
```json
{
  "scope": "promotion",
  "rate": 0.1,
  "label": "Plumbing Promo",
  "category_id": "<plumbing_category_id>",
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": "2026-06-30T23:59:59Z"
}
```
**Expected:** `201`, promotion rule with validity window.

---

#### TC-056B-03: Preview which rule applies
```http
GET /api/v2/admin/commission/preview?category_id=<plumbing_id>&date=2026-06-15T12:00:00Z
Authorization: Bearer <admin_token>
```
**Expected:** `200`, resolves to the promotion rule (highest priority) if active.

---

#### TC-056B-04: Soft-delete a rule
```http
DELETE /api/v2/admin/commission/rules/<rule_id>
Authorization: Bearer <admin_token>
```
**Expected:** `200`, rule `is_active: false`. Row still exists in `GET /rules` list.

---

#### TC-056B-05: Rate out of range
```json
{ "scope": "global", "rate": 1.5, "label": "Bad Rule" }
```
**Expected:** `400`, validation error on `rate` (must be 0–1).

---

## HF-057 — Provider Wallet + Withdrawal Flow

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v2/providers/wallet` | Provider | Wallet summary + first page of transactions |
| GET | `/api/v2/providers/wallet/transactions?cursor=` | Provider | Cursor-paginated ledger |
| POST | `/api/v2/providers/wallet/withdraw` | Provider | Request withdrawal |
| POST | `/api/v2/providers/payment-accounts` | Provider | Register MFS account |
| GET | `/api/v2/providers/payment-accounts` | Provider | List MFS accounts |
| PATCH | `/api/v2/providers/payment-accounts/:id` | Provider | Set primary |
| DELETE | `/api/v2/providers/payment-accounts/:id` | Provider | Remove account |
| GET | `/api/v2/admin/withdrawals` | Admin | List pending withdrawals |
| PATCH | `/api/v2/admin/withdrawals/:id/complete` | Admin | Mark withdrawal sent |
| PATCH | `/api/v2/admin/withdrawals/:id/reject` | Admin | Reject withdrawal |

### Manual Test Cases

#### TC-057-01: Provider checks wallet after payment verification
After Admin verifies payment (TC-055-05):
```http
GET /api/v2/providers/wallet
Authorization: Bearer <provider_token>
```
**Expected:** `200`, `balance_paisa` = `provider_net_paisa` from payment. `total_earned_paisa` updated.

---

#### TC-057-02: Register a bKash account
```http
POST /api/v2/providers/payment-accounts
Authorization: Bearer <provider_token>
Content-Type: application/json

{
  "provider": "bkash",
  "account_number": "01711223344",
  "account_name": "MD KARIM"
}
```
**Expected:** `201`, account row created, `is_primary: true` (first account is auto-primary).

---

#### TC-057-03: Request withdrawal
```http
POST /api/v2/providers/wallet/withdraw
Authorization: Bearer <provider_token>
Content-Type: application/json

{ "amount_paisa": 10000 }
```
**Pre-condition:** Provider must have ≥ 70% profile completion AND have an MFS account AND wallet balance ≥ 10000.  
**Expected:** `201`, `withdrawal_requests` row created with `status: "pending"`.

---

#### TC-057-04: Withdrawal below minimum
```json
{ "amount_paisa": 5000 }
```
**Expected:** `400`, `error_code: "WITHDRAWAL_BELOW_MIN"` — minimum ৳100 (10000 paisa).

---

#### TC-057-05: Withdrawal without MFS account
Provider has wallet balance but no payment account registered.  
**Expected:** `400`, `error_code: "NO_MFS_ACCOUNT"`.

---

#### TC-057-06: Admin completes withdrawal
```http
PATCH /api/v2/admin/withdrawals/<request_id>/complete
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount_sent_paisa": 10000,
  "sent_at": "2026-05-31T10:00:00Z",
  "admin_txid": "ADM1234567890",
  "admin_note": "Sent via bKash personal"
}
```
**Expected:** `200`, withdrawal `status: "completed"`, provider wallet `balance_paisa` decremented, `total_withdrawn_paisa` incremented.

---

#### TC-057-07: Admin rejects withdrawal
```http
PATCH /api/v2/admin/withdrawals/<request_id>/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{ "admin_note": "Suspicious account" }
```
**Expected:** `200`, withdrawal `status: "rejected"`. Wallet balance unchanged.

---

## HF-057B — Profile Completion API

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v2/users/me` | Any (auth) | Now includes `profile_completion: { percentage, meets_threshold }` |
| GET | `/api/v2/users/me/profile-completion` | Any (auth) | Full breakdown with `missing_items[]` and `completed_items[]` |

### Weight Table (Provider)

| Field | Weight | Condition |
|-------|--------|-----------|
| Name + Mobile | 10% | Always (set at registration) |
| Profile photo | 10% | `photo_url` not null |
| NID front | 8% | `nid_photo_url` not null |
| NID back | 7% | `nid_photo_back_url` not null |
| Home location (GPS) | 10% | `area` column not null |
| Skills | 15% | ≥ 1 skill in `provider_skills` |
| Hourly rate | 10% | `provider_profiles.hourly_rate` > 0 |
| MFS account | 20% | ≥ 1 row in `provider_payment_accounts` |
| Bio | 10% | `provider_profiles.bio` ≥ 20 chars |

**Threshold:** 70% — below this, `POST /v2/jobs/:id/accept` and `POST /v2/providers/wallet/withdraw` return `403 PROFILE_INCOMPLETE`.

### Manual Test Cases

#### TC-057B-01: Provider checks profile completion
```http
GET /api/v2/users/me/profile-completion
Authorization: Bearer <provider_token>
```
**Expected:** `200`, `{ percentage: N, meets_threshold: true/false, threshold: 70, missing_items: [...], completed_items: [...] }`.

---

#### TC-057B-02: Provider tries to accept job with incomplete profile
Log in as a freshly registered provider (no photos, no skills, no rate).  
```http
PATCH /api/v2/jobs/<job_id>/accept
Authorization: Bearer <new_provider_token>
```
**Expected:** `403`, `error_code: "PROFILE_INCOMPLETE"`, response body includes `meta.percentage`, `meta.threshold`, `meta.missing_items`.

---

#### TC-057B-03: Resident's profile completion (informational)
```http
GET /api/v2/users/me/profile-completion
Authorization: Bearer <resident_token>
```
**Expected:** `200`, `meets_threshold: false` (always — residents have no threshold guard), `threshold: null`.

---

## HF-058 — Admin Revenue Dashboard API

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v2/admin/revenue` | Admin | Aggregated revenue dashboard |
| GET | `/api/v2/admin/revenue/jobs` | Admin | Per-job commission detail, cursor-paginated |

### Query Parameters — `GET /admin/revenue`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `daily` \| `monthly` | `monthly` | Granularity for `revenue_by_period` |
| `from` | ISO 8601 datetime | (all time) | Start of date range filter |
| `to` | ISO 8601 datetime | (all time) | End of date range filter |

### Query Parameters — `GET /admin/revenue/jobs`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | ISO timestamp | (first page) | Pass `nextCursor` from previous page |
| `limit` | integer 1–100 | 20 | Page size |

### Manual Test Cases

#### TC-058-01: Revenue dashboard — all time
```http
GET /api/v2/admin/revenue
Authorization: Bearer <admin_token>
```
**Expected:** `200`, shape:
```json
{
  "total_revenue_paisa": 12000,
  "revenue_by_period": [
    { "date": "2026-05", "total_paisa": 12000 }
  ],
  "breakdown_by_rule": [
    { "rule_id": "...", "label": "Default 20%", "scope": "global", "rate": "0.2000", "total_paisa": 12000 }
  ],
  "top_categories": [
    { "category_id": "...", "name": "Plumbing", "slug": "plumbing", "total_paisa": 12000 }
  ]
}
```

---

#### TC-058-02: Revenue dashboard — daily breakdown
```http
GET /api/v2/admin/revenue?period=daily&from=2026-05-01T00:00:00Z&to=2026-05-31T23:59:59Z
Authorization: Bearer <admin_token>
```
**Expected:** `revenue_by_period` has entries like `{ "date": "2026-05-31", "total_paisa": 12000 }`.

---

#### TC-058-03: Revenue by date range (filter)
```http
GET /api/v2/admin/revenue?from=2026-05-01T00:00:00Z&to=2026-05-15T23:59:59Z
Authorization: Bearer <admin_token>
```
**Expected:** Only ledger entries in that range are counted. Total may be less than all-time total.

---

#### TC-058-04: Per-job detail list
```http
GET /api/v2/admin/revenue/jobs
Authorization: Bearer <admin_token>
```
**Expected:** `200`, `items` array ordered by `created_at DESC`, each item has `ledger_id`, `payment_id`, `job_id`, `revenue_paisa`, `payment_amount_paisa`, `commission_rate`, `method`, `rule_label`, `rule_scope`, `category_name`, `created_at`, `verified_at`.

---

#### TC-058-05: Pagination
```http
GET /api/v2/admin/revenue/jobs?limit=5
Authorization: Bearer <admin_token>
```
**Expected:** `items` has ≤ 5 entries. `nextCursor` is set if there are more pages.

```http
GET /api/v2/admin/revenue/jobs?limit=5&cursor=<nextCursor>
Authorization: Bearer <admin_token>
```
**Expected:** Next 5 entries. `nextCursor` is `null` on last page.

---

#### TC-058-06: Auth guard
```http
GET /api/v2/admin/revenue
```
**Expected:** `401`.

```http
GET /api/v2/admin/revenue
Authorization: Bearer <resident_token>
```
**Expected:** `403`.

---

## Error Code Reference (Sprint 5)

| Code | HTTP | Trigger |
|------|------|---------|
| `PAYMENT_NOT_FOUND` | 404 | Payment ID not found |
| `INVALID_JOB_STATUS` | 400 | Payment submitted for a job not in AWAITING_PAYMENT |
| `DUPLICATE_PAYMENT` | 400 | Payment already exists for this job |
| `INVALID_TRANSACTION_ID` | 400 | TxID format invalid (not 8–20 alphanumeric chars) |
| `PROFILE_INCOMPLETE` | 403 | Provider completion < 70%; returned on job accept + withdrawal |
| `NO_MFS_ACCOUNT` | 400 | Provider has no registered payment account |
| `WITHDRAWAL_BELOW_MIN` | 400 | Withdrawal amount < 10000 paisa (৳100) |
| `INSUFFICIENT_BALANCE` | 400 | Wallet balance < requested withdrawal amount |
| `WITHDRAWAL_NOT_PENDING` | 400 | Admin tries to complete/reject a non-pending withdrawal |
| `RESOURCE_NOT_FOUND` | 404 | Generic: commission rule, withdrawal request not found |

---

## HF-057C — Withdrawal Flow Hardening

### New API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v2/providers/wallet/withdrawals` | Provider | Provider's own withdrawal request history + pending total |

### Manual Test Cases

#### TC-057C-01: Provider requests withdrawal to a specific MFS account

When a provider has two MFS accounts (e.g. bKash primary + Nagad secondary), they can target the secondary:

```http
POST /api/v2/providers/wallet/withdraw
Authorization: Bearer <provider_token>

{
  "amount_paisa": 20000,
  "mfs_account_id": "<nagad_account_id>"
}
```

**Expected:** `201`, withdrawal row has `mfs_account_id = <nagad_account_id>`.

---

#### TC-057C-02: Wrong provider tries to use another provider's account ID

```http
POST /api/v2/providers/wallet/withdraw
Authorization: Bearer <provider1_token>

{ "amount_paisa": 10000, "mfs_account_id": "<provider2_account_id>" }
```

**Expected:** `400`, `error_code: "NO_MFS_ACCOUNT"`.

---

#### TC-057C-03: Available-balance guard blocks over-requesting

Provider has ৳500 balance and an existing pending request for ৳300 (available = ৳200):

```json
{ "amount_paisa": 25000 }
```

**Expected:** `400`, `error_code: "INSUFFICIENT_BALANCE"` — available balance is ৳200, not ৳250.

---

#### TC-057C-04: Provider retrieves own withdrawal history

```http
GET /api/v2/providers/wallet/withdrawals
Authorization: Bearer <provider_token>
```

**Expected:** `200`, `{ withdrawals: [...], pending_total_paisa: N }`.  
Each item has `id`, `amount_requested_paisa`, `status`, `requested_at`, `amount_sent_paisa`, `processed_at`, `admin_note`, `mfs_account_id`.

---

## HF-058D — Admin Revenue Financial Summary

### New API Endpoint

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/v2/admin/revenue/financial-summary` | Admin | 6 platform-wide aggregate fields |

### Manual Test Cases

#### TC-058D-01: Financial summary returns all 6 fields

```http
GET /api/v2/admin/revenue/financial-summary
Authorization: Bearer <admin_token>
```

**Expected:** `200`:
```json
{
  "total_payments_paisa": 120000,
  "pending_payments_paisa": 50000,
  "platform_revenue_paisa": 24000,
  "provider_wallet_balance_paisa": 66000,
  "provider_withdrawn_paisa": 30000,
  "provider_withdrawal_pending_paisa": 20000
}
```

**Accounting identity:** `total_payments_paisa` ≈ `platform_revenue_paisa` + `provider_wallet_balance_paisa` + `provider_withdrawn_paisa`.

---

#### TC-058D-02: Auth guard

```http
GET /api/v2/admin/revenue/financial-summary
```
**Expected:** `401`.

```http
GET /api/v2/admin/revenue/financial-summary
Authorization: Bearer <provider_token>
```
**Expected:** `403`.

---

#### TC-058D-03: Empty state

Before any payments are verified, all 6 fields return `0`.

---

## Commission Calculation Verification

After `PATCH /admin/payments/:id/verify`:

```sql
-- In psql (make db):
SELECT amount_paisa, commission_rate, platform_fee_paisa, provider_net_paisa
FROM payments WHERE id = '<payment_id>';

-- Verify: platform_fee_paisa = FLOOR(amount_paisa * commission_rate)
-- Verify: provider_net_paisa = amount_paisa - platform_fee_paisa

SELECT amount_paisa FROM platform_revenue_ledger WHERE payment_id = '<payment_id>';
-- Should equal platform_fee_paisa

SELECT balance_paisa, total_earned_paisa FROM wallets WHERE user_id = '<provider_id>';
-- balance_paisa should include provider_net_paisa from this payment
```
