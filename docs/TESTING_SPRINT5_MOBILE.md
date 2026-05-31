# HomeFix — Sprint 5 Mobile Test Report

> **Sprint:** Sprint 5 — Payments & Wallet (Mobile)
> **Date:** 2026-05-31
> **Branch:** `feature/sprint-5-mobile`
> **Platform:** Mobile (Expo SDK 53 · React Native · Jest + RNTL)

---

## Automated Test Results

```
Test Suites: 12 passed, 12 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        ~5.2 s
```

### Run command

```bash
npx jest --no-coverage --forceExit
```

### Suite breakdown

| Suite | File | Tests | Result |
|-------|------|-------|--------|
| Payment service | `tests/services/payment.service.test.ts` | 11 | ✅ Pass (new) |
| Payment screen | `tests/screens/payment.test.tsx` | 9 | ✅ Pass (new) |
| Wallet screen | `tests/screens/wallet.test.tsx` | 9 | ✅ Pass (new) |
| Revenue screen | `tests/screens/revenue.test.tsx` | 10 | ✅ Pass (new) |
| Job service | `tests/services/job.service.test.ts` | 9 | ✅ Pass (regression) |
| Bookings screen | `tests/screens/bookings.test.tsx` | 7 | ✅ Pass (regression) |
| JobCard component | `tests/components/JobCard.test.tsx` | 8 | ✅ Pass (regression) |
| ProviderJobCard component | `tests/components/ProviderJobCard.test.tsx` | 7 | ✅ Pass (regression) |
| VoiceRecorder component | `tests/components/VoiceRecorder.test.tsx` | 6 | ✅ Pass (regression) |
| VoiceNotePlayer component | `tests/components/VoiceNotePlayer.test.tsx` | 4 | ✅ Pass (regression) |
| ReadAloudButton component | `tests/components/ReadAloudButton.test.tsx` | 6 | ✅ Pass (regression) |
| Auth store | `tests/store/authStore.test.ts` | 3 | ✅ Pass (regression) |

Sprint 5 added **39 new tests** (net: 51 → 90). All prior Sprint 4 suites continue to pass.

---

## Test Coverage by Ticket

### HF-059 — Payment Screen (PaymentMethod, TxID, Order Summary)

**Screen:** `app/(app)/payment/[jobId].tsx`

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Renders order summary and method selection after loading | Screen | ✅ |
| 2 | Shows labels for all 5 payment methods (bKash, Nagad, Card, Bank, Cash) | Screen | ✅ |
| 3 | Shows TxID input when bKash is selected | Screen | ✅ |
| 4 | Does not show TxID input for cash method | Screen | ✅ |
| 5 | Prefills amount from job's estimated budget | Screen | ✅ |
| 6 | Shows `txid_required` error when bKash submitted with no TxID | Screen | ✅ |
| 7 | Shows `txid_invalid` error for short/invalid TxID (< 8 chars) | Screen | ✅ |
| 8 | Submits cash payment with valid amount to `paymentService.submitPayment` | Screen | ✅ |
| 9 | Submits bKash payment with valid TxID (`TXN12345678`) | Screen | ✅ |
| 10 | Shows error toast on API failure | Screen | ✅ |

**Mock strategy:** `jobService.getJobById` and `paymentService.submitPayment` mocked at module level. `expo-router` mock returns `{ jobId: 'job-awaiting' }`. Job built with `buildJob({ status: JobStatus.AWAITING_PAYMENT })`.

---

### HF-059B — Profile Completion Card + Provider Banner

**Component:** `components/shared/ProfileCompletionCard.tsx`

Tested indirectly via the screens that mount it. The `ProfileCompletionCard` renders only when `data.percentage < 100`. The `ProfileCompletionBanner` renders only when `!data.meets_threshold`. Both are hidden when the query hasn't resolved.

---

### HF-060 — Provider Wallet Screen

**Screen:** `app/(app)/(tabs)/wallet.tsx`

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Shows wallet balance after loading | Screen | ✅ |
| 2 | Displays credit and withdrawal transaction rows | Screen | ✅ |
| 3 | Shows payout accounts section | Screen | ✅ |
| 4 | Shows primary badge on primary account | Screen | ✅ |
| 5 | Shows empty state when no transactions exist | Screen | ✅ |
| 6 | Shows empty accounts message when no accounts | Screen | ✅ |
| 7 | Shows error state when wallet fails to load | Screen | ✅ |
| 8 | Opens withdraw modal on button press | Screen | ✅ |
| 9 | Shows commission info card | Screen | ✅ |

**Mock strategy:** `paymentService.getWallet` and `paymentService.listMfsAccounts` mocked. Wallet response built inline with known paisa values.

---

### HF-058B — Admin Revenue Dashboard Screen

**Screen:** `app/(app)/(tabs)/revenue.tsx`

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Shows total revenue after loading | Screen | ✅ |
| 2 | Renders period chart section | Screen | ✅ |
| 3 | Renders rule breakdown section with rule label | Screen | ✅ |
| 4 | Renders top categories (Plumbing, Electrical) | Screen | ✅ |
| 5 | Loads per-job detail on expand (calls getRevenueJobs) | Screen | ✅ |
| 6 | Shows monthly/daily toggle buttons | Screen | ✅ |
| 7 | Switches to daily period and re-fetches dashboard | Screen | ✅ |
| 8 | Shows empty state for no period data | Screen | ✅ |
| 9 | Shows empty state for no rule data | Screen | ✅ |
| 10 | Shows error state on load failure | Screen | ✅ |

**Mock strategy:** `adminService.getRevenueDashboard` and `adminService.getRevenueJobs` mocked at module level with known fixture data.

---

### payment.service.ts Unit Tests

**File:** `tests/services/payment.service.test.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `submitPayment` posts to `/v2/payments` and returns payment | ✅ |
| 2 | `submitPayment` omits `transaction_id` for cash method | ✅ |
| 3 | `submitPayment` rejects on API error | ✅ |
| 4 | `getWallet` fetches from `/v2/providers/wallet` | ✅ |
| 5 | `getWallet` returns transactions array | ✅ |
| 6 | `requestWithdrawal` posts to `/v2/providers/wallet/withdraw` | ✅ |
| 7 | `requestWithdrawal` rejects on insufficient balance | ✅ |
| 8 | `listMfsAccounts` fetches from `/v2/providers/payment-accounts` | ✅ |
| 9 | `addMfsAccount` posts to `/v2/providers/payment-accounts` | ✅ |
| 10 | `deleteMfsAccount` calls DELETE on the account id | ✅ |
| 11 | `getProfileCompletion` fetches from `/v2/users/me/profile-completion` | ✅ |

---

## Manual Test Cases (not automatable)

### HF-059 — Payment Screen (device required)

| # | Action | Expected |
|---|--------|----------|
| 1 | Resident: Open a job in `AWAITING_PAYMENT` state from Bookings tab | "Pay Now" button visible at bottom of job detail |
| 2 | Tap "Pay Now" | Payment screen opens with order summary showing category and budget |
| 3 | Select bKash | TxID input appears below method grid |
| 4 | Enter invalid TxID (e.g. `abc`) and tap Submit | Error "Transaction ID must be 8–20 alphanumeric characters" shown |
| 5 | Enter valid TxID (e.g. `TXN12345678`) and tap Submit | Receipt screen opens with payment details |
| 6 | Select Cash | TxID input disappears; cash note shown |
| 7 | Leave amount blank and tap Submit | "Amount is required" error shown |
| 8 | Bengali locale | All labels, method names, and errors display in Bengali |

### HF-060 — Provider Wallet Screen (device required)

| # | Action | Expected |
|---|--------|----------|
| 1 | Provider: Tap Wallet tab | Balance, total earned, total withdrawn displayed |
| 2 | Tap "Request Withdrawal" with no MFS account | Error "Add a payment account before withdrawing" shown |
| 3 | Tap "+ Add Account" | Bottom sheet opens with type picker, account number, account name fields |
| 4 | Add bKash account | Account appears with ★ Primary badge (first account is auto-primary) |
| 5 | Tap "Request Withdrawal" with ৳50 | Error "Minimum withdrawal is ৳100" shown |
| 6 | Tap "Request Withdrawal" with valid amount (e.g. ৳200) | Success toast shown |
| 7 | Pull to refresh | Balance and transactions reload |

### HF-058B — Admin Revenue Dashboard (device required)

| # | Action | Expected |
|---|--------|----------|
| 1 | Admin: Tap Revenue tab | Total revenue hero card visible |
| 2 | Default period is Monthly | Period bars show monthly aggregation |
| 3 | Tap "Daily" toggle | Dashboard re-fetches with `period=daily`; bars update |
| 4 | View rule breakdown | Commission rule labels, scope, rate, and total revenue shown |
| 5 | View top categories | Ranked list with ৳ total per category |
| 6 | Tap "Per-Job Detail" section | Expands to show per-job commission rows |
| 7 | Pull to refresh | All sections reload |

---

## Known Limitations

| Item | Detail |
|------|--------|
| Payment verification | Admin payment verification is backend-only (no mobile admin verify screen). Admin must use the API or wait for Sprint 7 web panel. |
| Withdrawal processing | Admin payout approval is backend-only (same as above). |
| No real MFS integration | Phase 1: manual TxID entry only. bKash/Nagad API integration is Phase 2. |
| Profile completion banner | Shown only to providers who have not yet reached 70% profile completion threshold. |
