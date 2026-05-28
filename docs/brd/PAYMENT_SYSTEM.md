# BRD — Payment System & Wallet

**SRS:** REQ-019 to REQ-023 · **Sprint:** 6

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
  amount_paisa (INT — total job value paid by resident)
  commission_rate (DECIMAL 5,4 — rate locked at time of payment, from commission_rules)
  commission_rule_id (FK → commission_rules — audit trail)
  platform_fee_paisa (INT — amount_paisa × commission_rate, rounded down)
  provider_net_paisa (INT — amount_paisa − platform_fee_paisa)
  method: bkash | nagad | bank | cash | card
  transaction_id (nullable — for MFS/bank manual entry)
  status: pending | verified | failed
  verified_at (nullable)
  verified_by_admin_id (nullable)

wallets (one per provider)
  id (UUID PK)
  user_id (FK → users, UNIQUE)
  balance_paisa (INT)
  total_earned_paisa (INT)
  total_withdrawn_paisa (INT)

wallet_transactions
  id (UUID PK)
  wallet_id (FK → wallets)
  type: credit | debit | withdrawal
  amount_paisa (INT)
  reference_id (job_id or withdrawal_id)
  created_at

platform_revenue_ledger
  id (UUID PK)
  payment_id (FK → payments)
  commission_rule_id (FK → commission_rules)
  amount_paisa (INT)
  created_at
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
2. Resident sends money manually via their MFS app
3. Resident enters the Transaction ID into HomeFix
4. Admin marks payment verified → commission engine resolves rate → ledger writes run in transaction

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

`payment.service.ts` selects the gateway based on `method` — never reference a gateway directly outside of `payment.service.ts`.
