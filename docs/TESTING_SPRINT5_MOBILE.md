# HomeFix — Sprint 5 Mobile Test Report

> **Sprint:** Sprint 5 — Payments & Wallet (Mobile)
> **Date:** 2026-05-31 (updated 2026-06-01 with post-ship test additions)
> **Branch:** `feature/sprint-5-mobile`
> **Platform:** Mobile (Expo SDK 53 · React Native · Jest + RNTL)

---

## Automated Test Results

```
Test Suites: 14 passed, 14 total
Tests:       121 passed, 121 total
Snapshots:   0 total
```

> Note: run each suite individually for reliable timing — the combined run triggers resource pressure causing timeouts. `npx jest <file> --forceExit` per suite.

### Run command

```bash
npx jest --no-coverage --forceExit   # all suites (may be slow)
# OR run individually for speed:
npx jest tests/screens/wallet.test.tsx --forceExit
npx jest tests/screens/revenue.test.tsx --forceExit
npx jest tests/screens/withdrawals.test.tsx --forceExit
npx jest tests/services/admin.service.test.ts --forceExit
```

### Suite breakdown

| Suite | File | Tests | Result | Change |
|-------|------|-------|--------|--------|
| Payment service | `tests/services/payment.service.test.ts` | **14** | ✅ Pass | +3 new (requestWithdrawal payload, getMyWithdrawals) |
| Admin service | `tests/services/admin.service.test.ts` | **6** | ✅ Pass | new file (getFinancialSummary, completeWithdrawal, rejectWithdrawal) |
| Payment screen | `tests/screens/payment.test.tsx` | 9 | ✅ Pass | — |
| Wallet screen | `tests/screens/wallet.test.tsx` | **14** | ✅ Pass | +5 new (withdrawal history, MFS account picker, requestWithdrawal payload) |
| Revenue screen | `tests/screens/revenue.test.tsx` | **14** | ✅ Pass | +4 new (financial summary card, all 6 stat labels, failure state, called on load) |
| Admin Withdrawals screen | `tests/screens/withdrawals.test.tsx` | **13** | ✅ Pass | new file |
| Job service | `tests/services/job.service.test.ts` | 9 | ✅ Pass | — |
| Bookings screen | `tests/screens/bookings.test.tsx` | 7 | ✅ Pass | — |
| JobCard component | `tests/components/JobCard.test.tsx` | 8 | ✅ Pass | — |
| ProviderJobCard component | `tests/components/ProviderJobCard.test.tsx` | 7 | ✅ Pass | — |
| VoiceRecorder component | `tests/components/VoiceRecorder.test.tsx` | 6 | ✅ Pass | — |
| VoiceNotePlayer component | `tests/components/VoiceNotePlayer.test.tsx` | 4 | ✅ Pass | — |
| ReadAloudButton component | `tests/components/ReadAloudButton.test.tsx` | 6 | ✅ Pass | — |
| Auth store | `tests/store/authStore.test.ts` | 3 | ✅ Pass | — |

Sprint 5 total mobile: **121 tests / 14 suites** (+31 from post-ship hardening; original sprint added 39 for 90 total, now extended to 121).

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

**Mock strategy:** `paymentService.getWallet`, `paymentService.listMfsAccounts`, and `paymentService.getMyWithdrawals` mocked. Wallet response built inline with known paisa values.

**Post-ship additions (HF-060B/C — withdrawal history + MFS account picker):**

| # | Test | Type | Result |
|---|------|------|--------|
| 10 | Shows pending withdrawal request in history section | Screen | ✅ |
| 11 | Shows empty withdrawal history when no requests | Screen | ✅ |
| 12 | Does NOT show account picker when provider has only one MFS account | Screen | ✅ |
| 13 | Shows account picker when provider has two or more MFS accounts | Screen | ✅ |
| 14 | Calls `requestWithdrawal` with both `amount_paisa` and `mfs_account_id` | Screen | ✅ |

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

**Mock strategy:** `adminService.getRevenueDashboard`, `adminService.getRevenueJobs`, `adminService.getFinancialSummary`, and `adminService.listWithdrawals` mocked at module level.

**Post-ship additions (HF-058D — financial summary card):**

| # | Test | Type | Result |
|---|------|------|--------|
| 11 | Renders financial summary card with title when data is available | Screen | ✅ |
| 12 | Renders all 6 financial stat tile labels | Screen | ✅ |
| 13 | Does not render financial summary card when the query fails | Screen | ✅ |
| 14 | Calls `getFinancialSummary` on load | Screen | ✅ |

---

### HF-060B — Admin Withdrawal Dashboard Screen (new)

**Screen:** `app/(app)/admin/withdrawals.tsx`  
**File:** `tests/screens/withdrawals.test.tsx`

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Shows the screen title | Screen | ✅ |
| 2 | Renders provider name and pending status badge | Screen | ✅ |
| 3 | Shows pending count badge when pending requests exist | Screen | ✅ |
| 4 | Does not show pending count badge when no pending requests | Screen | ✅ |
| 5 | Shows Complete and Reject action buttons on pending items | Screen | ✅ |
| 6 | Does not show action buttons on completed items | Screen | ✅ |
| 7 | Does not show action buttons on rejected items | Screen | ✅ |
| 8 | Opens the Complete modal when Complete button is pressed | Screen | ✅ |
| 9 | Opens the Reject modal when Reject button is pressed | Screen | ✅ |
| 10 | TxID input in Complete modal forces text to uppercase | Screen | ✅ |
| 11 | Complete modal shows validation error when TxID is empty | Screen | ✅ |
| 12 | Shows empty state when no withdrawal requests exist | Screen | ✅ |
| 13 | Shows error state when the list fails to load | Screen | ✅ |

**Mock strategy:** `adminService.listWithdrawals`, `completeWithdrawal`, `rejectWithdrawal` mocked. `expo-router.useRouter` mocked. Fixtures: `pendingItem`, `completedItem`, `rejectedItem` built with known fields.

---

### admin.service.ts Unit Tests (new)

**File:** `tests/services/admin.service.test.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `getFinancialSummary` calls `GET /v2/admin/revenue/financial-summary` | ✅ |
| 2 | `getFinancialSummary` returns all 6 numeric fields from the response body | ✅ |
| 3 | `getFinancialSummary` rejects when the request fails | ✅ |
| 4 | `completeWithdrawal` patches the correct URL with full payload | ✅ |
| 5 | `completeWithdrawal` rejects on API error | ✅ |
| 6 | `rejectWithdrawal` patches the reject URL with `admin_note` | ✅ |

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
| 6 | `requestWithdrawal` posts full `{ amount_paisa, mfs_account_id }` payload | ✅ |
| 7 | `requestWithdrawal` sends the secondary account id when a non-primary account is chosen | ✅ |
| 8 | `requestWithdrawal` rejects on insufficient balance | ✅ |
| 9 | `getMyWithdrawals` fetches from `/v2/providers/wallet/withdrawals` | ✅ |
| 10 | `getMyWithdrawals` returns empty list and zero pending total | ✅ |
| 11 | `listMfsAccounts` fetches from `/v2/providers/payment-accounts` | ✅ |
| 12 | `addMfsAccount` posts to `/v2/providers/payment-accounts` | ✅ |
| 13 | `deleteMfsAccount` calls DELETE on the account id | ✅ |
| 14 | `getProfileCompletion` fetches from `/v2/users/me/profile-completion` | ✅ |

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

### HF-060B — Admin Withdrawal Dashboard (device required)

| # | Action | Expected |
|---|--------|----------|
| 1 | Admin: Tap Revenue tab | "Withdrawal Requests" button visible; pending badge shown if any pending |
| 2 | Tap "Withdrawal Requests" | Admin Withdrawals screen opens |
| 3 | Pending row | Provider name, MFS type + account number, amount, date+time (12-hour) |
| 4 | Tap "Complete" | Bottom-sheet modal opens pre-filled with requested amount |
| 5 | Type in Transaction ID | Characters auto-uppercase on each keystroke |
| 6 | Submit with empty TxID | Error "Transaction ID is required" appears |
| 7 | Submit with valid amount + TxID | Row removed from list; success toast |
| 8 | Tap "Reject" | Reject modal opens; submit requires non-empty admin note |

### HF-058D — Admin Revenue Financial Summary (device required)

| # | Action | Expected |
|---|--------|----------|
| 1 | Admin: Tap Revenue tab | "Financial Overview" card visible above the revenue hero card |
| 2 | Card shows 6 tiles in 3 rows | Row 1: Total Payments / Verify Pending; Row 2: Platform Revenue / Provider Wallets; Row 3: Provider Withdrawn / Pending Withdrawal |
| 3 | Total Payments tile | Highlighted with primary-color border |
| 4 | Verify Pending tile | Orange tint when value > 0 |
| 5 | Pending Withdrawal tile | Orange tint when value > 0 |

---

## Known Limitations

| Item | Detail |
|------|--------|
| No real MFS integration | Phase 1: manual TxID entry only. bKash/Nagad API integration is Phase 2. |
| Profile completion banner | Shown only to providers who have not yet reached 70% profile completion threshold. |
