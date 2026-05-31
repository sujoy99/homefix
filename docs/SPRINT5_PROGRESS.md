# Sprint 5 — Payments & Wallet — Progress Tracker

> **Backend Branch:** `feature/sprint-5-backend` (merged to master)
> **Mobile Branch:** `feature/sprint-5-mobile`
> **Last updated:** 2026-05-31
> **Tests:** 121/121 mobile passing (+31 post-ship) · 248/248 backend passing (+15 post-ship) · All TypeScript checks passing (both platforms)

---

## Ticket Status

### Backend

| Ticket | Title | Status | Commit |
|--------|-------|--------|--------|
| HF-054 | Payment interface — pluggable strategy pattern | ✅ Done | — |
| HF-055 | Manual gateway — bKash/Nagad TxID entry | ✅ Done | 4bbd53b |
| HF-056 | Commission engine — configurable rate from `commission_rules` | ✅ Done | — |
| HF-056B | Admin commission rules API — CRUD + `/preview` | ✅ Done | — |
| HF-057 | Provider wallet/ledger — 80% credit on payment + withdrawal flow | ✅ Done | — |
| HF-057B | Profile completion API — computed endpoint + `PROFILE_INCOMPLETE` guard | ✅ Done | — |
| HF-058 | Admin revenue dashboard API | ✅ Done | — |

### Mobile

| Ticket | Title | Status | Commit |
|--------|-------|--------|--------|
| HF-058B | Admin revenue dashboard mobile screen | ✅ Done | — |
| HF-058C | Admin payment verification screen — list SUBMITTED payments, one-tap verify | ✅ Done | — |
| HF-058D | Admin revenue financial summary card — 6 at-a-glance stats (total payments, verify pending, platform revenue, provider wallet balances, provider withdrawn, pending withdrawals) | ✅ Done | — |
| HF-068B | Admin provider detail screen — NID front/back fullscreen, skills, approve/reject (pulled forward from Sprint 7) | ✅ Done | — |
| HF-059 | Payment screen — method selection, merchant number card, TxID input (uppercase), order summary | ✅ Done | — |
| HF-059B | Profile completion card (Profile screen, both roles) + Provider home banner | ✅ Done | — |
| HF-060 | Provider wallet screen — balance, earnings, commission breakdown | ✅ Done | — |
| HF-060B | Withdrawal end-to-end mobile — admin `admin/withdrawals.tsx` screen (list all requests, complete/reject bottom-sheet modals, wallet balance + total-pending breakdown per row, pending count badge on revenue CTAs); provider wallet withdrawal history section with status badges; available-balance shown in withdraw modal when pending requests exist | ✅ Done | — |
| HF-060C | Provider withdrawal MFS account selector — multi-account providers see account picker dropdown in withdraw modal; backend validates `mfs_account_id` ownership; falls back to primary account when not supplied | ✅ Done | — |
| HF-061 | Payment receipt + completion flow | ✅ Done | — |
| HF-061B | Provider profile edit screen — bio, hourly rate, experience years, profile photo, home location (GPS) | ✅ Done | — |

### Bug Fixes & UX Polish

| Bug / Enhancement | Description | Status |
|-------------------|-------------|--------|
| Double-payment UX | `payment_status` embedded in job responses; job detail replaces Pay Now with "submitted" banner; JobCard shows green "Payment Submitted" badge | ✅ Done |
| Merchant number missing | `config.service.ts` was not unwrapping API response body; DB not seeded; both fixed | ✅ Done |
| TxID auto-uppercase (payment screen) | Resident payment TxID input calls `.toUpperCase()` on each keystroke | ✅ Done |
| TxID auto-uppercase (admin complete modal) | Admin "Complete Withdrawal" txid input: `autoCapitalize="characters"` + `onChangeText` forces uppercase | ✅ Done |
| Date + time display | Transaction history, withdrawal request list, and admin withdrawal dashboard now show date **and** time in 12-hour format (`3 Jun 2026, 10:45 AM`) instead of date-only | ✅ Done |
| Backend `mfs_account_id` optional field | `requestWithdrawalSchema` accepts optional `mfs_account_id: uuid`; service validates ownership against requesting user | ✅ Done |

---

## Detailed Step Checklist

### ⏳ HF-054 — Payment Interface (Pluggable Strategy Pattern)

Mirrors the `storage.interface.ts` pattern already in the codebase.

- [ ] Create `backend/src/modules/payments/` directory structure
- [ ] `payment.interface.ts` — abstract contract:
  ```ts
  interface PaymentGateway {
    processPayment(data: PaymentData): Promise<PaymentResult>;
    verifyPayment(transactionId: string): Promise<VerificationResult>;
  }
  ```
- [ ] `payment.types.ts` — `PaymentData`, `PaymentResult`, `VerificationResult`, `PaymentMethod` enum (`bkash | nagad | bank | cash | card`)
- [ ] `payment.service.ts` — gateway-agnostic service; selects gateway based on `method`; never references a gateway directly
- [ ] `gateways/` subdirectory with `manual.gateway.ts` stub (filled in HF-055) and `sslcommerz.gateway.ts` Phase 2 stub
- [ ] Gateway registry map in `payment.service.ts` — reads `platform_settings.active_payment_gateway` from DB at request time to select gateway; never hardcoded
- [ ] Add `bkash_merchant_number` and `nagad_merchant_number` keys to `PlatformSettingKey` enum in `packages/shared`; seed values in `platform_settings` table
- [ ] DB migrations — one file per table (7 tables total):
  1. `commission_rules` — must exist before `payments` (FK dependency)
  2. `payments` — FK to `jobs`, `users`, `commission_rules`
  3. `wallets` — one per provider
  4. `wallet_transactions` — credit/withdrawal ledger
  5. `platform_revenue_ledger` — platform fee per payment
  6. `provider_payment_accounts` — provider MFS account for withdrawal payouts
  7. `withdrawal_requests` — full audit trail of every payout
  - All money as `integer` (paisa); 1 taka = 100 paisa — no floats
  - `commission_rules.rate` as `DECIMAL(5,4)` (e.g. 0.2000 = 20%)
  - `payments.status`: `pending | verified | failed`
- [ ] Shared types: add `PaymentStatus`, `PaymentMethod`, `WithdrawalStatus` enums to `packages/shared/src/types/`
- [ ] Register payments router in `backend/src/app.ts`
- [ ] Type-check passes (`npm run type-check`)

---

### ⏳ HF-055 — Manual Gateway — bKash/Nagad TxID Entry (REQ-019, REQ-020)

- [ ] `gateways/manual.gateway.ts` — implements `PaymentGateway`:
  - `processPayment()` validates TxID format (alphanumeric, 8–20 chars); inserts `payments` row with `status = pending`
  - `verifyPayment()` stub — returns `{ verified: false }` (admin marks verified in Phase 1)
- [ ] `POST /v2/payments` — Resident-only; job must be `AWAITING_PAYMENT`; body: `{ job_id, method, transaction_id?, amount_paisa }`
  - Zod schema: `transaction_id` required when method is `bkash | nagad | bank`
  - Response: `payment` row + job with current status
- [ ] `PATCH /v2/admin/payments/:id/verify` — Admin-only; triggers commission split + wallet credit (calls HF-056 + HF-057 atomically)
- [ ] Job status guard: `POST /v2/payments` returns `400` if `job.status !== AWAITING_PAYMENT`
- [ ] Swagger docs for both endpoints
- [ ] Unit tests — TxID format validation, method→gateway routing, job status guard, admin verify flow

---

### ⏳ HF-056 — Commission Engine (REQ-021)

Rate resolution order (highest priority first):
1. Active `promotion` rule for job's category (time-limited)
2. Active `category` rule override
3. Active `global` rule (platform default)

- [ ] `commission/commission.service.ts` — `resolveRate(categoryId, paymentDate)`:
  - Queries `commission_rules` with priority order; returns `{ rate, commission_rule_id }`
  - Falls back to global default if no rule matches
- [ ] `applyCommission(paymentId, trx)` — runs inside the **same DB transaction** as payment verification:
  - `platform_fee_paisa = Math.floor(amount_paisa × rate)`
  - `provider_net_paisa = amount_paisa − platform_fee_paisa`
  - Updates `payments` row with locked `commission_rate`, `commission_rule_id`, `platform_fee_paisa`, `provider_net_paisa`, `status = verified`
  - Inserts `platform_revenue_ledger` row
  - Calls `wallet.service.creditWallet()` within same transaction
- [ ] Seed migration: insert default global rule `{ scope: 'global', rate: 0.2000, label: 'Default Rate', is_active: true }`
- [ ] Only one active `global` rule at a time enforced at DB level (partial unique index) + service layer
- [ ] Unit tests — rate resolution priority order, promotion overrides category, paisa math (floor not round), single-transaction guarantee

---

### ⏳ HF-056B — Admin Commission Rules API — CRUD + `/preview`

- [ ] `GET /v2/admin/commission/rules` — list all rules (active + inactive), admin-only
- [ ] `POST /v2/admin/commission/rules` — create rule; validates:
  - `rate` between 0.0000 and 1.0000
  - `category_id` required when `scope = category | promotion`
  - `valid_from / valid_until` required for `scope = promotion`
  - Auto-deactivates current active `global` rule when new global rule is created
- [ ] `PATCH /v2/admin/commission/rules/:id` — edit `label`, `rate`, `valid_from`, `valid_until` only; `scope` is immutable after creation
- [ ] `DELETE /v2/admin/commission/rules/:id` — soft-deactivate only (`is_active = false`); never hard-delete (audit trail)
- [ ] `GET /v2/admin/commission/preview?category_id=&date=` — resolve which rule would apply; returns `{ rate, rule_id, label }`
- [ ] Swagger docs for all endpoints
- [ ] Integration tests — create/deactivate global rule, preview resolution for different scopes

---

### ⏳ HF-057 — Provider Wallet/Ledger (REQ-022)

- [ ] `wallet/wallet.service.ts`:
  - `creditWallet(userId, amountPaisa, jobId, trx)` — upserts `wallets` row; inserts `wallet_transactions` credit row; **must accept a Knex transaction object** and run inside it
  - `getWalletWithHistory(userId)` — returns `{ balance_paisa, total_earned_paisa, total_withdrawn_paisa, transactions[] }`
- [ ] Auto-create `wallets` row lazily on first credit (upsert pattern)
- [ ] `GET /v2/providers/wallet` — Provider-only; returns wallet summary + first page of transactions
- [ ] `GET /v2/providers/wallet/transactions` — cursor-paginated ledger (20 per page)
- [ ] `POST /v2/providers/wallet/withdraw` — Provider-only; creates `withdrawal_requests` row (status=pending); requires registered `provider_payment_accounts` row, else `400`; min amount ৳100 (10000 paisa)
- [ ] `GET /v2/admin/withdrawals` — Admin-only; list pending withdrawal requests with provider name, amount, MFS account details
- [ ] `PATCH /v2/admin/withdrawals/:id/complete` — Admin-only; body: `{ amount_sent_paisa, sent_at, admin_txid, admin_note? }`; deducts `amount_sent_paisa` from wallet balance; inserts `wallet_transactions` withdrawal row; marks request completed
- [ ] `PATCH /v2/admin/withdrawals/:id/reject` — Admin-only; body: `{ admin_note }`; marks rejected; no balance change
- [ ] Provider MFS account endpoints: `POST /v2/providers/payment-accounts`, `GET /v2/providers/payment-accounts`, `PATCH /v2/providers/payment-accounts/:id` (set primary), `DELETE /v2/providers/payment-accounts/:id`
- [ ] Swagger docs
- [ ] Integration test — full payment verify flow: wallet balance increases by `provider_net_paisa`, `platform_revenue_ledger` increases by `platform_fee_paisa`, both in the same transaction (rollback on failure leaves both unchanged)
- [ ] Integration test — withdrawal complete: `amount_sent_paisa` deducted from balance, `total_withdrawn_paisa` increased, `wallet_transactions` row inserted

---

### ⏳ HF-057B — Profile Completion API + Action Guards

See `docs/brd/PROFILE_COMPLETION.md` for full field weights and UI spec.

- [ ] `profile-completion.service.ts` — `compute(userId, role)`:
  - Single joined query covering all relevant tables (`users`, `provider_skills`, `provider_payment_accounts`, etc.)
  - Returns `{ percentage, meets_threshold, threshold, missing_items[], completed_items[] }`
  - Role-aware: Provider uses 9-field weight table (threshold 70%); Resident uses 5-field table (threshold null / informational)
- [ ] `GET /v2/users/me/profile-completion` — full breakdown with item list (used by Profile screen)
- [ ] Embed `profile_completion: { percentage, meets_threshold }` summary in `GET /v2/users/me` response (used by Home screen — no extra request)
- [ ] `PROFILE_INCOMPLETE` guard on `POST /v2/jobs/:id/accept`:
  - If Provider completion < 70%, return `403 PROFILE_INCOMPLETE` with `{ percentage, threshold, missing_items[] }`
  - Logged at `warn` level: `"Provider {id} blocked: profile {pct}% < threshold"`
- [ ] `PROFILE_INCOMPLETE` guard on `POST /v2/providers/wallet/withdraw` (same logic)
- [ ] Add `PROFILE_INCOMPLETE` to shared `ErrorCode` enum in `packages/shared`
- [ ] i18n: all `missing_items[].label_key` values under `profile.completion.*` in `bn.json` + `en.json` (mobile consumes these)
- [ ] Unit tests — correct % for Provider with various field combinations, threshold boundary (69% blocked / 70% allowed), Resident always passes threshold

---

### ⏳ HF-058 — Admin Revenue Dashboard API (REQ-023)

- [ ] `GET /v2/admin/revenue` — Admin-only; aggregates from `platform_revenue_ledger` joined with `commission_rules`:
  - `total_revenue_paisa` (all time)
  - `revenue_by_period[]` — daily/monthly breakdown (`?period=daily|monthly&from=&to=`)
  - `breakdown_by_rule[]` — total per commission rule with label (shows promotion impact)
  - `top_categories[]` — top 5 earning categories by revenue
- [ ] `GET /v2/admin/revenue/jobs` — per-job commission detail, cursor-paginated
- [ ] Swagger docs
- [ ] Test — aggregation returns correct totals against known seed data

---

## Key Constraints (from BRD & SESSION_CONTEXT)

| Constraint | Detail |
|-----------|--------|
| Atomic transaction | Wallet credit + commission ledger write + `payments.status = verified` in **one DB transaction** |
| No hardcoded 20% | Commission rate always read from `commission_rules` at payment time; locked onto `payments` row |
| Paisa storage | All monetary values stored as integer paisa; display as ৳ in UI |
| TxID format | Alphanumeric, 8–20 chars; validate format only — do NOT verify with bKash/Nagad API (Phase 1) |
| Rate locking | `commission_rate` + `commission_rule_id` locked at time of payment; later admin changes are non-retroactive |
| Pluggable gateway | `payment.service.ts` selects gateway by method — no direct gateway imports outside this file |
| Phase 1 only | Manual TxID; `sslcommerz.gateway.ts` is a Phase 2 stub |
| Admin verify flow | Resident submits TxID → `payments.status = pending` → Admin verifies → commission engine runs → wallet credited |
| Shared enums | `PaymentStatus`, `PaymentMethod` must live in `packages/shared` — never duplicate in backend or mobile |

---

## Files to Create This Sprint

### Backend

| File | Purpose |
|------|---------|
| `backend/src/modules/payments/payment.interface.ts` | Abstract gateway contract |
| `backend/src/modules/payments/payment.types.ts` | PaymentData, PaymentResult, PaymentMethod |
| `backend/src/modules/payments/payment.service.ts` | Gateway-agnostic orchestrator |
| `backend/src/modules/payments/payment.controller.ts` | POST /v2/payments, PATCH /v2/admin/payments/:id/verify |
| `backend/src/modules/payments/payment.route.ts` | Route registration |
| `backend/src/modules/payments/payment.dto.ts` | Zod schemas |
| `backend/src/modules/payments/gateways/manual.gateway.ts` | Phase 1 bKash/Nagad TxID gateway |
| `backend/src/modules/payments/gateways/sslcommerz.gateway.ts` | Phase 2 stub only |
| `backend/src/modules/payments/commission/commission.service.ts` | Rate resolution + applyCommission() |
| `backend/src/modules/payments/commission/commission.controller.ts` | Admin CRUD + /preview |
| `backend/src/modules/payments/commission/commission.route.ts` | Route registration |
| `backend/src/modules/payments/wallet/wallet.service.ts` | creditWallet(), getWalletWithHistory(), withdraw() |
| `backend/src/modules/payments/wallet/wallet.controller.ts` | GET /v2/providers/wallet, POST /v2/providers/wallet/withdraw |
| `backend/src/modules/payments/wallet/wallet.route.ts` | Route registration |
| `backend/src/modules/payments/wallet/withdrawal.controller.ts` | GET+PATCH /v2/admin/withdrawals |
| `backend/src/modules/payments/wallet/mfs-account.controller.ts` | CRUD /v2/providers/payment-accounts |
| `backend/src/modules/payments/revenue/revenue.controller.ts` | GET /v2/admin/revenue |
| `backend/src/modules/payments/revenue/revenue.route.ts` | Route registration |
| `backend/src/modules/users/profile-completion.service.ts` | compute() — live profile completion scorer |
| `backend/migrations/<ts1>_create_commission_rules.ts` | commission_rules table |
| `backend/migrations/<ts2>_create_payments.ts` | payments table |
| `backend/migrations/<ts3>_create_wallets.ts` | wallets table |
| `backend/migrations/<ts4>_create_wallet_transactions.ts` | wallet_transactions table |
| `backend/migrations/<ts5>_create_platform_revenue_ledger.ts` | platform_revenue_ledger table |
| `backend/migrations/<ts6>_create_provider_payment_accounts.ts` | provider_payment_accounts table |
| `backend/migrations/<ts7>_create_withdrawal_requests.ts` | withdrawal_requests table |
| `packages/shared/src/types/payment.types.ts` | PaymentStatus, PaymentMethod, WithdrawalStatus enums |

### Mobile (on `feature/sprint-5-mobile`)

| File | Purpose |
|------|---------|
| `mobile/app/(app)/booking/payment/[id].tsx` | HF-059 — Payment screen |
| `mobile/app/(app)/booking/receipt/[id].tsx` | HF-061 — Receipt + completion |
| `mobile/app/(app)/wallet/index.tsx` | HF-060 — Provider wallet screen |
| `mobile/services/payment.service.ts` | API calls — payments module |
| `mobile/services/wallet.service.ts` | API calls — wallet module |
| `mobile/components/shared/ProfileCompletionCard.tsx` | Progress bar + missing items list (HF-059B) |
| `mobile/components/shared/ProfileIncompleteBanner.tsx` | Persistent yellow banner for Provider home (HF-059B) |
| `mobile/tests/screens/PaymentScreen.test.tsx` | HF-059 tests |
| `mobile/tests/screens/WalletScreen.test.tsx` | HF-060 tests |
| `mobile/tests/screens/ReceiptScreen.test.tsx` | HF-061 tests |
| `mobile/tests/components/ProfileCompletionCard.test.tsx` | HF-059B tests |

### Modified (Backend Branch)

| File | Change |
|------|--------|
| `backend/src/app.ts` | Register payments, commission, wallet, revenue routes |
| `packages/shared/src/types/index.ts` | Export PaymentStatus, PaymentMethod |

---

## Resuming This Session

**Step 1 — Paste `docs/SESSION_CONTEXT.md` as your first message.**

**Step 2 — Then add this block:**

> Sprint 5 is in progress on `feature/sprint-5-backend`. See `docs/SPRINT5_PROGRESS.md` for full ticket status and step checklists.
>
> **What is already done:**
> - HF-054 ✅ — payment interface, gateway registry, 7 DB migrations (`commission_rules`, `payments`, `wallets`, `wallet_transactions`, `platform_revenue_ledger`, `provider_payment_accounts`, `withdrawal_requests`), platform settings seeded (`active_payment_gateway=manual`, `bkash_merchant_number`, `nagad_merchant_number`), `PROFILE_INCOMPLETE` error code added, `paymentRouter` registered in v2 routes.
>
> **Next task: HF-055** — Manual gateway implementation (bKash/Nagad TxID entry). Start it.
>
> **Test pattern for every backend ticket:**
> Implement → unit tests → integration tests → `npm run type-check` (zero errors) → `npm test` (100% pass) → commit.
> Never commit without tests passing. Full detail in `docs/engineering_standards.md` § "Within-Ticket Test Order".

**Step 3 — Confirm the branch:**
```bash
git checkout feature/sprint-5-backend
```
