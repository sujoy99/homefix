# HomeFix — Sprint 5 Mobile: User Manual

> **Sprint:** Sprint 5 — Payments & Wallet (Mobile)
> **Covers:** HF-058B · HF-059 · HF-059B · HF-060 · HF-061
> **Audience:** QA, Product Owner, Business Stakeholder
> **Last updated:** 2026-05-31

---

## What This Sprint Delivers

Sprint 5 closes the payment loop end-to-end and gives each role their own financial view.

| Feature | Who benefits | SRS requirement |
|---------|-------------|-----------------|
| Payment screen — bKash/Nagad TxID entry | Residents | REQ-019, REQ-020 |
| Payment receipt | Residents | REQ-019 |
| Provider wallet — balance, earnings, withdrawal | Providers | REQ-022 |
| Profile completion card + provider banner | Both (providers gated) | REQ-017B |
| Admin revenue dashboard | Admin | REQ-023 |

---

## Part 1 — Environment Setup

### Start the backend

```bash
# From repo root
make start       # Start containers (backend + DB)
make migrate     # Ensure all migrations are applied
```

### Start the mobile app

```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<your-windows-wifi-ip> npx expo start --host lan
# Scan QR code with Expo Go (Android) or press 'i' for iOS simulator
```

### Seed accounts

| Role | Mobile | Password | Name |
|------|--------|----------|------|
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — Plumbing skill |
| **Admin** | `00000000000` | `Admin@1234` | — |

### Create a testable AWAITING_PAYMENT job

To test the payment flow, you need a job in `AWAITING_PAYMENT` status:

1. Log in as **Resident** → Book a Plumbing job
2. Log in as **Provider** → Jobs tab → Accept the job
3. Log in as **Provider** → Jobs tab → Tap the active job → "Mark Work Complete"
4. The job is now in `AWAITING_PAYMENT` — the Resident can pay

---

## Part 2 — Screen-by-Screen Checklist

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Pay Now CTA on Job Detail (HF-059)

> **Who:** Resident
> **Navigate:** Bookings tab → "Awaiting Payment" tab → tap the job

| # | Action | Expected |
|---|--------|----------|
| 1 | Job detail opens for an AWAITING_PAYMENT job | Status stepper shows "Work Complete" as current step |
| 2 | Footer button | "Pay Now" (green/primary) button visible at bottom |
| 3 | Jobs in other statuses (PENDING, ACTIVE, PAID) | No "Pay Now" button |

---

### Screen 2 — Payment Screen (HF-059)

> **Who:** Resident
> **Navigate:** Job Detail → "Pay Now"

#### Order summary card

| # | Action | Expected |
|---|--------|----------|
| 1 | Screen loads | Order Summary card shows service category name |
| 2 | Estimated budget | Budget shown as ৳ amount if set; amount field pre-filled |

#### Method selection

| # | Action | Expected |
|---|--------|----------|
| 3 | 5 method cards visible | bKash · Nagad · Card · Bank Transfer · Cash |
| 4 | Tap bKash | Card highlighted with bKash pink border; ✓ check icon appears |
| 5 | Tap Nagad | Nagad card highlighted (orange); bKash deselects |
| 6 | Tap Cash | Cash card highlighted (green); cash note text appears |

#### TxID input (bKash / Nagad / Bank Transfer)

| # | Action | Expected |
|---|--------|----------|
| 7 | Select bKash | "Transaction ID" input appears |
| 8 | Hint text | "Enter the transaction ID from your bKash/Nagad app" |
| 9 | Select Cash or Card | TxID input disappears entirely |

#### Validation

| # | Action | Expected |
|---|--------|----------|
| 10 | Tap Submit with no method selected | Button is disabled (greyed out) |
| 11 | Select bKash, leave TxID empty, tap Submit | "Transaction ID is required" error under the field |
| 12 | Enter TxID `abc` (< 8 chars) and tap Submit | "Transaction ID must be 8–20 alphanumeric characters" error |
| 13 | Enter TxID `TXN12345678` (valid) | No error |
| 14 | Leave amount blank, tap Submit | "Amount is required" error |

#### Successful submission

| # | Action | Expected |
|---|--------|----------|
| 15 | Valid bKash payment + valid TxID + valid amount → Submit | Loading spinner; navigates to Receipt screen |
| 16 | Valid cash payment + valid amount → Submit | Navigates to Receipt screen without TxID requirement |

---

### Screen 3 — Payment Receipt (HF-061)

> **Who:** Resident
> **Reached by:** Payment screen → Submit (success)

| # | Action | Expected |
|---|--------|----------|
| 1 | Success animation | Green ✓ circle icon with "Payment Submitted!" title |
| 2 | Receipt card | Payment ID (short), method, amount, status "Submitted — awaiting verification" |
| 3 | What happens next card | Explanation that admin will verify shortly |
| 4 | "Back to Bookings" CTA | Navigates to Bookings tab |
| 5 | Cannot go back to payment screen | Back navigation goes to Bookings, not payment form |

---

### Screen 4 — Profile Completion Card (HF-059B)

> **Who:** Resident and Provider
> **Navigate:** Profile tab

| # | Action | Expected |
|---|--------|----------|
| 1 | Profile tab loads (incomplete profile) | Completion card visible at top of screen |
| 2 | Progress bar | Filled proportionally (e.g. 60% = bar ~60% full) |
| 3 | Percentage label | "Your profile is 60% complete" |
| 4 | Missing items list | Red ○ dots next to each missing field name |
| 5 | Completed items | Green ✓ dots next to completed fields |
| 6 | Profile 100% complete | Card hidden entirely |

### Provider Home — Profile Completion Banner (HF-059B)

> **Who:** Provider (< 70% profile completion)
> **Navigate:** Home tab (Provider)

| # | Action | Expected |
|---|--------|----------|
| 7 | Home screen loads with incomplete profile | Yellow banner below greeting: "Complete your profile to accept jobs" |
| 8 | Banner sub-text | "You're {{X}}% complete — {{N}} items remaining" |
| 9 | Tap banner | Navigates to Profile tab |
| 10 | Provider at ≥ 70% completion | Banner hidden |

---

### Screen 5 — Provider Wallet (HF-060)

> **Who:** Provider
> **Navigate:** Wallet tab (only visible to providers)

#### Balance card

| # | Action | Expected |
|---|--------|----------|
| 1 | Wallet tab visible in bottom nav (Provider only) | Tab shown with wallet icon |
| 2 | Balance card loads | Available Balance in large ৳ text |
| 3 | Stats row | Total Earned and Total Withdrawn shown side by side |
| 4 | Admin and Resident | No Wallet tab visible |

#### Commission info

| # | Action | Expected |
|---|--------|----------|
| 5 | Info card | "HomeFix deducts a platform fee from each payment. The remaining amount (usually 80%) is credited to your wallet." |

#### Payout accounts

| # | Action | Expected |
|---|--------|----------|
| 6 | No accounts yet | "Add a payment account before withdrawing" shown |
| 7 | Tap "+ Add Account" | Bottom sheet opens: type picker, account number, account name |
| 8 | Type picker | bKash / Nagad / Bank options |
| 9 | Fill form and Save | New account appears with ★ Primary badge |
| 10 | Add second account | Second account shown with "Set as Primary" link |
| 11 | Tap "Set as Primary" on second account | Second account gets ★; first loses it |
| 12 | Tap trash icon on non-primary account | Confirm dialog → "Remove this payout account?" → removes |
| 13 | Cannot remove primary account | Trash icon not shown on primary account |

#### Transaction history

| # | Action | Expected |
|---|--------|----------|
| 14 | Credits shown | Green dot · "Payment Received" · +৳ amount |
| 15 | Withdrawals shown | Red dot · "Withdrawal" · -৳ amount |
| 16 | No transactions | "No transactions yet" caption |

#### Withdrawal request

| # | Action | Expected |
|---|--------|----------|
| 17 | Tap "Request Withdrawal" with no MFS account | Error "Add a payment account before withdrawing" |
| 18 | Tap "Request Withdrawal" with balance ৳80, enter ৳50 (< ৳100 min) | Error "Minimum withdrawal is ৳100" |
| 19 | Enter amount exceeding balance | Error "Insufficient balance" |
| 20 | Enter valid amount (≥ ৳100, ≤ balance) + active MFS account | Success toast "Withdrawal request submitted. You will be paid within 1-2 business days." |

#### Pull-to-refresh

| # | Action | Expected |
|---|--------|----------|
| 21 | Pull down on wallet screen | Balance and transactions reload |

---

### Screen 6 — Admin Revenue Dashboard (HF-058B)

> **Who:** Admin
> **Navigate:** Revenue tab (only visible to admin)

#### Total revenue hero

| # | Action | Expected |
|---|--------|----------|
| 1 | Revenue tab visible (Admin only) | Tab shown with trending-up icon |
| 2 | Hero card | "Total Revenue" label with ৳ total in large text |

#### Period chart

| # | Action | Expected |
|---|--------|----------|
| 3 | "Revenue by Period" section | Horizontal bar rows with date labels and ৳ amounts |
| 4 | Toggle is "Monthly" by default | Bars show monthly aggregation |
| 5 | Tap "Daily" toggle | Bars update to daily breakdown |
| 6 | Tap "Monthly" toggle | Returns to monthly |
| 7 | No data | "No period data" caption shown |

#### Commission breakdown

| # | Action | Expected |
|---|--------|----------|
| 8 | "Commission Breakdown" section | Rule label, scope (Global/Category/Promotion), rate %, and ৳ total |
| 9 | Multiple rules | Each rule on separate row |
| 10 | No rules | "No commission rules" caption |

#### Top categories

| # | Action | Expected |
|---|--------|----------|
| 11 | "Top Categories" section | #1, #2, #3… ranking with category name and ৳ total |
| 12 | No categories | "No category data" caption |

#### Per-job detail

| # | Action | Expected |
|---|--------|----------|
| 13 | "Per-Job Detail" row | Collapsed by default with chevron → icon |
| 14 | Tap to expand | Shows per-job rows: category, date, method, rate, payment amount, +commission |
| 15 | Tap to collapse | Hides per-job rows |
| 16 | No jobs | "No job revenue yet" caption |

#### Pull-to-refresh

| # | Action | Expected |
|---|--------|----------|
| 17 | Pull down | Revenue dashboard reloads |

---

## Part 3 — Bilingual Check

| Screen | Key | Bengali (bn) | English (en) |
|--------|-----|-------------|-------------|
| Payment | Select method label | পেমেন্ট পদ্ধতি বেছে নিন | Select Payment Method |
| Payment | bKash | বিকাশ | bKash |
| Payment | TxID label | ট্রানজেকশন আইডি | Transaction ID |
| Payment | Submit button | পেমেন্ট জমা দিন | Submit Payment |
| Receipt | Title | পেমেন্ট রসিদ | Payment Receipt |
| Receipt | Done CTA | বুকিংয়ে ফিরুন | Back to Bookings |
| Wallet | Tab label | ওয়ালেট | Wallet |
| Wallet | Balance | উপলব্ধ ব্যালেন্স | Available Balance |
| Wallet | Withdraw button | উত্তোলনের অনুরোধ | Request Withdrawal |
| Revenue | Tab label | রাজস্ব | Revenue |
| Revenue | Total | মোট রাজস্ব | Total Revenue |
| Profile | Completion title | আপনার প্রোফাইল {{percentage}}% সম্পন্ন | Your profile is {{percentage}}% complete |

---

## Part 4 — End-to-End Payment Flow Walkthrough

This verifies the complete happy path across all 3 roles.

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Resident | Post a plumbing job | Job appears in Bookings → Upcoming |
| 2 | Provider | Accept the job | Job moves to Bookings → Active for Resident |
| 3 | Provider | Mark Work Complete on job detail | Job moves to AWAITING_PAYMENT |
| 4 | Resident | Bookings → "Awaiting Payment" tab | Job appears |
| 5 | Resident | Tap job → "Pay Now" | Payment screen opens |
| 6 | Resident | Select bKash, enter TxID, enter amount, Submit | Receipt screen shown |
| 7 | Admin | Backend `PATCH /v2/admin/payments/:id/verify` (API) | Job moves to PAID; Provider wallet credited |
| 8 | Provider | Wallet tab | Balance increased by 80% of payment amount |
| 9 | Admin | Revenue tab | Total revenue increased by 20% of payment amount |
