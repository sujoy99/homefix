# BRD — Payment System & Wallet

**SRS:** REQ-019 to REQ-023 · **Sprint:** 5 (backend) + 5 (mobile)
**Last updated:** 2026-05-30

---

## How HomeFix Makes Money — Escrow Flow

HomeFix must sit **in the middle of the money**. If the Resident pays the Provider directly, the platform can never enforce commission collection. The solution is an escrow model: Resident pays HomeFix, HomeFix splits and credits the Provider wallet, Provider withdraws later.

```
Resident                  HomeFix                    Provider
   │                         │                           │
   │  Job complete            │                           │
   │  status = AWAITING_      │                           │
   │  PAYMENT                 │                           │
   │                          │                           │
   │  App shows HomeFix's     │                           │
   │  own bKash merchant      │                           │
   │  number (from            │                           │
   │  platform_settings)      │                           │
   │                          │                           │
   │──Sends ৳1,000 ──────────▶│  HomeFix holds it in      │
   │                          │  their merchant account   │
   │                          │                           │
   │  Enters TxID in app      │                           │
   │                          │                           │
   │                     Admin checks bKash               │
   │                     dashboard, confirms              │
   │                     ৳1,000 received,                 │
   │                     clicks "Verify"                  │
   │                          │                           │
   │                     System splits                    │
   │                     (single DB transaction):         │
   │                     Platform keeps ৳200 (20%)        │
   │                     Credits ৳800 to provider         │
   │                     wallet (DB record = IOU)         │
   │                          │                           │
   │  Job → PAID              │                           │
   │                          │  Provider sees ৳800 in    │
   │                          │  wallet, requests          │
   │                          │  withdrawal               │
   │                          │                           │
   │                     Admin sees request:              │
   │                     "Owe ৳800 to Karim,              │
   │                     bKash: 01711223344"              │
   │                     Admin sends ৳800 via             │
   │                     their own bKash app              │
   │                     Records: amount sent,            │
   │                     date, their own TxID             │
   │                     → full audit trail               │
   │                          │                           │
   │                          │  Withdrawal marked        │
   │                          │  "completed"              │
   │                          │  Provider balance → ৳0    │
```

**Key design decisions from this flow:**

| Decision | Detail |
|----------|--------|
| Resident pays HomeFix | Resident sends to HomeFix bKash merchant number (shown in app from `platform_settings.bkash_merchant_number`) |
| TxID entry | Resident enters TxID in app after sending; Admin verifies against their bKash dashboard |
| Job status | Stays `AWAITING_PAYMENT` until Admin verifies; advances to `PAID` only on Admin verify |
| Commission split | Happens atomically inside Admin verify transaction — never as a separate step |
| Provider wallet | DB-only balance (IOU); becomes real cash on Admin withdrawal payout |
| Provider MFS account | Stored in `provider_payment_accounts` table; required before first withdrawal |
| Cash jobs | No TxID, no merchant account; Admin verifies cash receipt directly with provider; same commission split applies |

---

## Commission Versioning (DB-Driven)

Commission rates are **fully DB-driven with versioned history**. No rate is ever hardcoded. Every payment permanently records the exact rule that applied at the moment of payment.

### Why Versioning Matters

```
Timeline example:
──────────────────────────────────────────────────────────────────▶ time
  Jan 1         Mar 15            Apr 10         Apr 14
  Global 20%    Plumbing          Eid promo       Eid promo
  created       category 15%      10% (3 days)    expires
  (default)     override          created         → falls back to
                created                           category 15%
```

- A payment made on Apr 11 locks `commission_rate = 0.1000` on its row — permanently
- A payment made on Apr 15 locks `commission_rate = 0.1500` — the promotion is gone
- Admin changing the global rate on May 1 has **zero effect** on any prior payment
- The audit trail (`commission_rule_id` FK on every payment) always shows which rule applied and why

### Rate Resolution at Payment Time

```
resolveRate(category_id, payment_date):
  1. Active promotion  WHERE scope='promotion' AND category_id=? AND NOW() BETWEEN valid_from AND valid_until
  2. Category override WHERE scope='category'  AND category_id=? AND is_active=true
  3. Global default    WHERE scope='global'    AND is_active=true
  → First match wins; result locked onto payments row immediately
```

### Gateway Selection (DB-Driven)

The active payment gateway is read from `platform_settings` at runtime — no code change or redeploy needed to switch:

```
platform_settings
  key:   'active_payment_gateway'
  value: 'manual'          ← Phase 1 (bKash/Nagad TxID)
                             later: 'sslcommerz'
```

`payment.service.ts` reads this key at request time, instantiates the correct gateway from a registry map, and no other file is ever aware of which gateway is active.

---

## Provider MFS Account (Required for Withdrawals)

Providers must register an MFS account so Admin knows where to send withdrawal payouts.

```
provider_payment_accounts
  id (UUID PK)
  user_id (FK → users)
  mfs_type: bkash | nagad | bank
  account_number (VARCHAR — bKash/Nagad mobile number or bank account)
  account_name   (VARCHAR — account holder name, for Admin to verify)
  is_primary     (BOOLEAN — one primary per provider; Admin sends to this by default)
  created_at, updated_at
```

- Provider adds/edits this in their Profile screen
- Admin sees this automatically on the withdrawal request screen — no manual lookup needed
- A provider without a registered MFS account **cannot request withdrawal** (API returns `400`)

---

## Withdrawal Flow (Full Audit Trail)

The Admin needs a complete record of every payout: what was owed, what was actually sent, when, to which account, and the Admin's own bKash TxID as proof.

```
Provider                          HomeFix Admin
   │                                   │
   │  Wallet balance: ৳800 available   │
   │  Clicks "Request Withdrawal"      │
   │  Amount: ৳800 (min ৳100)          │
   │  MFS account pre-filled from      │
   │  their registered account         │
   │                                   │
   │                             withdrawal_requests row
   │                             created: status = pending
   │                             amount_requested = ৳800
   │                             mfs_account_id = Karim's bKash
   │                                   │
   │                             Admin dashboard shows:
   │                             ┌─────────────────────────┐
   │                             │ WITHDRAWAL REQUEST       │
   │                             │ Provider: Karim          │
   │                             │ Amount owed: ৳800        │
   │                             │ Send to: bKash           │
   │                             │ Account: 01711223344     │
   │                             │ Account name: Md. Karim  │
   │                             ├─────────────────────────┤
   │                             │ [Admin fills in:]        │
   │                             │ Amount actually sent: _  │
   │                             │ Sent at (date/time):  _  │
   │                             │ Admin TxID (bKash):   _  │
   │                             │ Note (optional):      _  │
   │                             │ [Mark as Sent]           │
   │                             └─────────────────────────┘
   │                                   │
   │                             System on "Mark as Sent":
   │                             - wallet.balance -= amount_sent
   │                             - wallet.total_withdrawn += amount_sent
   │                             - wallet_transactions INSERT (type=withdrawal)
   │                             - withdrawal_requests.status = completed
   │                             - All fields locked for audit
   │                                   │
   │  Balance updates                  │
   │  Withdrawal shows as              │
   │  "Completed" in history           │
```

### Withdrawal Requests Table

```
withdrawal_requests
  id (UUID PK)
  wallet_id              (FK → wallets)
  provider_id            (FK → users)
  mfs_account_id         (FK → provider_payment_accounts — snapshot of account at request time)
  amount_requested_paisa (INT — what the provider asked for)
  status: pending | completed | rejected
  requested_at           (TIMESTAMPTZ)

  -- Admin fills these in on "Mark as Sent":
  amount_sent_paisa      (INT, nullable — what Admin actually sent; may differ from requested)
  sent_at                (TIMESTAMPTZ, nullable)
  admin_txid             (VARCHAR, nullable — Admin's own bKash/Nagad TxID as proof of transfer)
  processed_by_admin_id  (FK → users, nullable)
  admin_note             (TEXT, nullable — reason for rejection or partial payment)
  processed_at           (TIMESTAMPTZ, nullable)
```

**Why `amount_sent_paisa` can differ from `amount_requested_paisa`:**
- Admin may partially pay (e.g., provider owes platform a separate fee)
- Admin may reject the request with a note
- System deducts only `amount_sent_paisa` from wallet balance — the difference stays as available balance

---

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-019 | Multiple payment methods: Card, bKash, Nagad, Bank Transfer, Cash | ⏳ Sprint 6 |
| REQ-020 | MFS/Bank transfers require manual Transaction ID entry | ⏳ Sprint 6 |
| REQ-021 | Platform commission deducted from job total (SRS default: 20%, configurable) | ⏳ Sprint 6 |
| REQ-022 | Remainder credited to Provider wallet (100% − commission rate) | ⏳ Sprint 6 |
| REQ-023 | Admin revenue dashboard shows accumulated platform fees | ⏳ Sprint 6 / Sprint 7 |

## Commission Design

The commission rate is **not hardcoded** — it is resolved at payment time from the `commission_rules` table and locked onto the `payments` row for permanent auditability.

### Rate Resolution Order (highest priority first)

```
1. Active promotion for this specific job's category  (time-limited, e.g. "Eid discount")
2. Category-level override                            (e.g. Plumbing = 15%, Painting = 25%)
3. Global platform default                            (initially 20%, admin-editable)
```

If no rule matches, the global default is used. The rate in effect **at the moment of payment** is what applies — later admin changes do not retroactively affect existing payments.

### Commission Flow

```
Resident pays ৳1,000  |  Effective commission rate = R% (resolved above)
        │
        ├─→ Platform fee  = ৳1,000 × R          → platform_revenue_ledger
        │
        └─→ Provider net  = ৳1,000 × (1 − R)    → provider_wallet.balance
```

Both ledger writes happen in a **single DB transaction** with the payment confirmation. Partial writes are not acceptable.

Currency: always store as integer **paisa** (1 taka = 100 paisa) to avoid floating-point errors. Display as ৳ (Taka) in UI.

## Commission Rules Data Model

```
commission_rules
  id (UUID PK)
  scope: global | category | promotion
  category_id (FK → service_categories, nullable — only for scope=category|promotion)
  rate (DECIMAL 5,4 — e.g. 0.2000 = 20%, 0.1500 = 15%)
  label (VARCHAR — e.g. "Eid Special 2026", "Default Rate")
  is_active (BOOLEAN)
  valid_from (TIMESTAMPTZ, nullable — null = always active from creation)
  valid_until (TIMESTAMPTZ, nullable — null = no expiry)
  created_by_admin_id (FK → users)
  created_at, updated_at
```

Rules:
- Only **one active `global` rule** at a time. Creating a new global rule deactivates the previous one.
- Multiple `category` rules can coexist (one per category). Category rules override the global rate.
- `promotion` rules are time-limited and override both global and category rates while active.
- `rate` must be between 0.0000 and 1.0000 (0%–100%).

## Payments Data Model

```
payments
  id (UUID PK)
  job_id (FK → jobs, UNIQUE)
  resident_id (FK → users)
  provider_id (FK → users)
  amount_paisa (INT — total job value paid by resident to HomeFix merchant account)
  commission_rate (DECIMAL 5,4 — rate locked at time of Admin verify, from commission_rules)
  commission_rule_id (FK → commission_rules — audit trail, which rule applied)
  platform_fee_paisa (INT — floor(amount_paisa × commission_rate))
  provider_net_paisa (INT — amount_paisa − platform_fee_paisa)
  method: bkash | nagad | bank | cash | card
  transaction_id (VARCHAR, nullable — Resident's TxID for MFS/bank; null for cash)
  status: pending | verified | failed
  created_at
  verified_at (TIMESTAMPTZ, nullable)
  verified_by_admin_id (FK → users, nullable)

commission_rules
  id (UUID PK)
  scope: global | category | promotion
  category_id (FK → service_categories, nullable — only for scope=category|promotion)
  rate (DECIMAL 5,4 — e.g. 0.2000 = 20%, 0.1500 = 15%)
  label (VARCHAR — e.g. "Eid Special 2026", "Default Rate")
  is_active (BOOLEAN)
  valid_from (TIMESTAMPTZ, nullable — null = effective immediately)
  valid_until (TIMESTAMPTZ, nullable — null = no expiry)
  created_by_admin_id (FK → users)
  created_at, updated_at

wallets (one per provider)
  id (UUID PK)
  user_id (FK → users, UNIQUE)
  balance_paisa (INT — current available balance = earned − withdrawn)
  total_earned_paisa (INT — lifetime credits)
  total_withdrawn_paisa (INT — lifetime withdrawals paid out)
  updated_at

wallet_transactions
  id (UUID PK)
  wallet_id (FK → wallets)
  type: credit | withdrawal
  amount_paisa (INT)
  reference_id (UUID — job_id for credit, withdrawal_request_id for withdrawal)
  created_at

platform_revenue_ledger
  id (UUID PK)
  payment_id (FK → payments)
  commission_rule_id (FK → commission_rules)
  amount_paisa (INT — platform_fee_paisa at time of payment)
  created_at

provider_payment_accounts
  id (UUID PK)
  user_id (FK → users)
  mfs_type: bkash | nagad | bank
  account_number (VARCHAR)
  account_name (VARCHAR — for Admin verification)
  is_primary (BOOLEAN)
  created_at, updated_at

withdrawal_requests
  id (UUID PK)
  wallet_id (FK → wallets)
  provider_id (FK → users)
  mfs_account_id (FK → provider_payment_accounts)
  amount_requested_paisa (INT)
  status: pending | completed | rejected
  requested_at (TIMESTAMPTZ)
  -- Admin fills on "Mark as Sent":
  amount_sent_paisa (INT, nullable)
  sent_at (TIMESTAMPTZ, nullable)
  admin_txid (VARCHAR, nullable — Admin's own bKash TxID as proof)
  processed_by_admin_id (FK → users, nullable)
  admin_note (TEXT, nullable)
  processed_at (TIMESTAMPTZ, nullable)
```

## Payment Methods (REQ-019, REQ-020)

| Method | Phase | TxID Required | Gateway |
|--------|-------|--------------|---------|
| bKash | Phase 1 | Yes (manual entry) | `manual.gateway.ts` |
| Nagad | Phase 1 | Yes (manual entry) | `manual.gateway.ts` |
| Bank Transfer | Phase 1 | Yes (manual entry) | `manual.gateway.ts` |
| Cash | Phase 1 | No | No gateway — status update only |
| Card | Phase 2 | No (online) | `sslcommerz.gateway.ts` |

Phase 1 flow for MFS:
1. Resident initiates payment, selects bKash/Nagad
2. App shows **HomeFix's merchant bKash/Nagad number** (from `platform_settings.bkash_merchant_number` / `platform_settings.nagad_merchant_number`)
3. Resident sends money manually via their MFS app to that number
4. Resident enters their Transaction ID into HomeFix; job stays `AWAITING_PAYMENT`
5. Admin checks their bKash dashboard, confirms receipt, clicks "Verify" in admin panel
6. System atomically: resolves commission rate → records payment → credits provider wallet → writes platform ledger → advances job to `PAID`

## Admin Commission Management (Sprint 6 — HF-056)

Admin panel endpoints:

```
GET    /api/v2/admin/commission/rules          # List all rules (active + inactive)
POST   /api/v2/admin/commission/rules          # Create new rule (global / category / promotion)
PATCH  /api/v2/admin/commission/rules/:id      # Edit label, valid_from, valid_until, rate
DELETE /api/v2/admin/commission/rules/:id      # Deactivate rule (never hard-delete)
GET    /api/v2/admin/commission/preview?category_id=&date=   # Resolve what rate would apply
```

The `/preview` endpoint lets the admin simulate which rule will be active for a given category on a given date before publishing it.

## Admin Revenue Dashboard (REQ-023)

Aggregates from `platform_revenue_ledger` joined with `commission_rules`:
- Total revenue (all time)
- Revenue by period (daily/monthly chart)
- Breakdown by commission rule (shows impact of promotional rates)
- Top-earning service categories
- Commission per job

Implemented in Sprint 7 as part of the admin panel (HF-058 backend + HF-070 web).

## Pluggable Gateway Interface

```typescript
interface PaymentGateway {
  processPayment(data: PaymentData): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<VerificationResult>;
}
```

`payment.service.ts` reads `platform_settings.active_payment_gateway` from DB at request time and selects the gateway from a registry map — never reference a gateway directly outside `payment.service.ts`.

```
Gateway registry (in payment.service.ts):
  'manual'      → manual.gateway.ts      (Phase 1 — bKash/Nagad TxID)
  'sslcommerz'  → sslcommerz.gateway.ts  (Phase 2 — card/online)
```

Switching from Phase 1 to Phase 2: Admin updates `platform_settings.active_payment_gateway = 'sslcommerz'` — no code change, no redeploy required.
