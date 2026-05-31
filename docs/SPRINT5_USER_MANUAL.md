# HomeFix — Sprint 5 Mobile: User Manual

> **Sprint:** Sprint 5 — Payments & Wallet (Mobile)
> **Covers:** HF-058B · HF-058C · HF-058D · HF-059 · HF-059B · HF-060 · HF-060B · HF-060C · HF-061 · HF-061B · HF-068B (pulled forward from Sprint 7)
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
| Provider withdrawal MFS account selector — choose payout account when multiple exist | Providers | REQ-022 |
| Provider wallet withdrawal history — past requests with status badges | Providers | REQ-022 |
| Profile completion card + provider banner | Both (providers gated) | REQ-017B |
| Admin revenue dashboard | Admin | REQ-023 |
| Admin revenue financial summary — 6 at-a-glance platform metrics | Admin | REQ-023 |
| Admin withdrawal dashboard — complete or reject provider payouts | Admin | REQ-022 |
| Admin payment verification screen — list + one-tap verify | Admin | REQ-020 |
| Double-payment protection — submitted banner + badge | Residents | REQ-019 |

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
| 2 | Footer button (no payment yet submitted) | "Pay Now" (green/primary) button visible at bottom |
| 3 | Jobs in other statuses (PENDING, ACTIVE, PAID) | No "Pay Now" button |
| 4 | Tap "Pay Now", submit payment, navigate back to job detail | Pay Now button is **gone** — replaced by yellow banner: "Payment submitted — awaiting admin verification" |
| 5 | Bookings tab → "Awaiting Payment" tab after submitting payment | JobCard shows green **"Payment Submitted"** badge instead of "Awaiting Payment" — prevents accidental re-payment |

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

#### Merchant instruction card (bKash / Nagad)

| # | Action | Expected |
|---|--------|----------|
| 7 | Select bKash | Yellow instruction card appears: "Step 1: Send Money" |
| 8 | Merchant number row | HomeFix bKash merchant number shown in large selectable text (e.g. `01700000000`) |
| 9 | Label above number | "bKash Merchant Number" |
| 10 | Once amount is filled | "Step 2: Enter the transaction ID from your bKash app below" appears |
| 11 | Select Nagad | Card updates to show Nagad merchant number |
| 12 | Select Bank Transfer | No merchant card (no merchant number for this method) |
| 13 | Select Cash or Card | Merchant card disappears entirely |
| 14 | Config loading | "Loading merchant details…" shown briefly until config resolves |

> **How to use:** Resident opens their bKash/Nagad app → Send Money → enters the merchant number shown → completes the transfer → copies the transaction ID → pastes it in the TxID field below.

#### TxID input (bKash / Nagad / Bank Transfer)

| # | Action | Expected |
|---|--------|----------|
| 15 | Select bKash | "Transaction ID" input appears below merchant card |
| 16 | Hint text | "Enter the transaction ID from your bKash/Nagad app" |
| 17 | Select Cash or Card | TxID input disappears entirely |

#### Validation

| # | Action | Expected |
|---|--------|----------|
| 18 | Tap Submit with no method selected | Button is disabled (greyed out) |
| 19 | Select bKash, leave TxID empty, tap Submit | "Transaction ID is required" error under the field |
| 20 | Enter TxID `abc` (< 8 chars) and tap Submit | "Transaction ID must be 8–20 alphanumeric characters" error |
| 21 | Enter TxID `TXN12345678` (valid) | No error |
| 22 | Leave amount blank, tap Submit | "Amount is required" error |

#### Successful submission

| # | Action | Expected |
|---|--------|----------|
| 23 | Valid bKash payment + valid TxID + valid amount → Submit | Loading spinner; navigates to Receipt screen |
| 24 | Valid cash payment + valid amount → Submit | Navigates to Receipt screen without TxID requirement |

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

#### Withdrawal modal — MFS account selector (HF-060C)

| # | Action | Expected |
|---|--------|----------|
| 21 | Provider has only 1 MFS account | Modal shows amount input only; primary account is used automatically |
| 22 | Provider has 2+ MFS accounts | "Send to Account" section appears above the amount input |
| 23 | Account picker shows | Dropdown list with account type + last-4 digits; primary account pre-selected |
| 24 | Tap a different account | Selection updates; that account will receive the payout |
| 25 | Dismiss modal and reopen | Picker resets to the primary account |

> **Note on available balance:** When a pending withdrawal request already exists, the available balance shown in the modal is the wallet balance **minus** the sum of pending requests — preventing over-requesting.

#### Withdrawal history (HF-060B)

> **Appears below the transaction history section.**

| # | Action | Expected |
|---|--------|----------|
| 26 | At least one withdrawal request exists | "Withdrawal Requests" section visible |
| 27 | Pending request | Orange "Pending" badge; shows requested date+time, amount, MFS account |
| 28 | Completed request | Green "Completed" badge; shows sent date+time, amount sent |
| 29 | Rejected request | Red "Rejected" badge; shows processed date+time, admin note if provided |
| 30 | No withdrawal requests | Section hidden |

#### Pull-to-refresh

| # | Action | Expected |
|---|--------|----------|
| 31 | Pull down on wallet screen | Balance, transactions, and withdrawal history reload |

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

### Screen 7 — Admin Payment Verification (HF-058C)

> **Who:** Admin
> **Navigate:** Revenue tab → "Verify Pending Payments" card (yellow) at top

#### Entry point

| # | Action | Expected |
|---|--------|----------|
| 1 | Revenue tab loads as Admin | Yellow card "Verify Pending Payments →" visible at top of screen |
| 2 | No payments pending | Yellow card is still shown (entry point always visible) |
| 3 | Tap the card | Navigates to Admin Payments screen |

#### Pending payment list

| # | Action | Expected |
|---|--------|----------|
| 4 | Screen loads with pending payments | Header row: "X payments awaiting verification" |
| 5 | Each row shows: job title or category | Bold title, category name below |
| 6 | Amount badge | ৳ amount next to Banknote icon in primary colour |
| 7 | Resident info | "Resident: {name} · {mobile}" |
| 8 | Method + TxID | Method icon (bKash pink / Nagad orange / Card / Bank / Cash) + method name + "· TxID: {id}" if provided |
| 9 | Submitted timestamp | Clock icon + "3 Jun 2026, 10:45" format |
| 10 | Pull-to-refresh | List reloads |

#### Verify action

| # | Action | Expected |
|---|--------|----------|
| 11 | Tap "Verify" button on a row | Button shows "Verifying…" and is disabled |
| 12 | Verification succeeds | Row disappears; success toast "Payment verified successfully" |
| 13 | Verification fails (network error) | Error toast "Could not verify payment. Please try again." |
| 14 | After verify: Revenue dashboard | Total revenue increased by the commission amount |
| 15 | After verify: Provider wallet | Provider wallet balance credited with 80% of payment |
| 16 | After verify: Job status | Job moves to PAID status |

#### Empty state

| # | Action | Expected |
|---|--------|----------|
| 17 | All payments verified | Large green ✓ icon, "All caught up!" title, "No pending payments to verify" |

---

### Screen 8 — Admin Provider Verification Detail (HF-068B)

> **Who:** Admin
> **Navigate:** Approvals tab (home tab for admin) → tap any pending provider card

> **Note:** This ticket was originally scheduled for Sprint 7 (Web + Admin) but pulled forward and built in Sprint 5 mobile because the admin needed a way to review NID documents before approving.

#### Entry point — Approvals list

| # | Action | Expected |
|---|--------|----------|
| 1 | Approvals tab loads | List of pending providers; each card shows profile photo (or placeholder), name, mobile, email, registration date |
| 2 | Card shows chevron → and "Tap to review documents →" hint | No inline Approve/Reject buttons on the list card |
| 3 | Tap a provider card | Navigates to Provider Verification detail screen |
| 4 | Pull-to-refresh | List reloads |
| 5 | No pending providers | Green ✓ icon, "All caught up!" message |

#### Provider detail screen

| # | Action | Expected |
|---|--------|----------|
| 6 | Screen loads | Header "Provider Verification" with back arrow |
| 7 | Profile section | Circular profile photo (or placeholder icon), full name, registration date |
| 8 | Contact info rows | Mobile number, email (if set), NID number — each with icon |
| 9 | Bio row | Bio text shown if provider has filled it in |

#### NID document review

| # | Action | Expected |
|---|--------|----------|
| 10 | "NID Documents" section | "NID Front" and "NID Back" side-by-side cards |
| 11 | Photo uploaded | Thumbnail image displayed with zoom icon badge |
| 12 | Photo not uploaded | Grey placeholder with "Not uploaded" caption |
| 13 | Tap a photo thumbnail | Full-screen modal opens with the image in full resolution |
| 14 | Tap × or back in fullscreen | Modal closes, returns to detail screen |

#### Skills section

| # | Action | Expected |
|---|--------|----------|
| 15 | "Registered Skills" section | Chips for each category skill the provider registered |
| 16 | Bengali language active | Category name shown in Bengali (`category_name_bn`) |
| 17 | No skills registered | "No skills registered yet." caption |

#### Approve / Reject

| # | Action | Expected |
|---|--------|----------|
| 18 | Footer visible | "Reject" (red) and "Approve" (green) buttons side-by-side — only shown when `status = pending` |
| 19 | Tap "Approve" | Confirmation dialog: "Approve {{name}}? They will be able to log in and receive bookings." |
| 20 | Confirm Approve | Success toast; navigates back to Approvals list; provider removed from pending list |
| 21 | Tap "Reject" | Confirmation dialog (destructive style): "Reject {{name}}? Their account will be deactivated." |
| 22 | Confirm Reject | Success toast; navigates back; provider removed from pending list |
| 23 | Provider already approved/rejected | No footer buttons (status is no longer pending) |
| 24 | Network error on approve/reject | Error toast; user stays on detail screen |

---

### Screen 9 — Admin Withdrawal Dashboard (HF-060B)

> **Who:** Admin
> **Navigate:** Revenue tab → "Withdrawal Requests" button (or via pending count badge)

#### Entry point

| # | Action | Expected |
|---|--------|----------|
| 1 | Revenue tab loads as Admin | "Withdrawal Requests" card/button visible; shows pending count badge if any pending |
| 2 | Tap the card | Navigates to Admin Withdrawals screen |

#### Withdrawal list

| # | Action | Expected |
|---|--------|----------|
| 3 | Screen loads with pending withdrawals | Header: pending count badge; list of withdrawal rows |
| 4 | Each row — provider info | Provider full name + mobile number |
| 5 | Each row — MFS account | MFS type (bKash/Nagad/Bank) + account number + account name |
| 6 | Each row — amount | Requested amount in ৳ |
| 7 | Each row — requested time | Requested date and time in 12-hour format (e.g. `3 Jun 2026, 10:45 AM`) |
| 8 | Each row — wallet info | Wallet balance and total pending amount shown so admin knows available funds |
| 9 | Pull-to-refresh | List reloads |

#### Complete withdrawal

| # | Action | Expected |
|---|--------|----------|
| 10 | Tap "Complete" on a row | Bottom-sheet modal opens |
| 11 | Modal fields | Amount Sent (pre-filled with requested amount), Sent At (date/time picker), Transaction ID, Admin Note (optional) |
| 12 | Type in Transaction ID | Characters are automatically forced to UPPERCASE on each keystroke |
| 13 | Tap Submit with empty TxID | Validation error shown |
| 14 | Tap Submit with valid data | Row disappears from pending list; success toast |
| 15 | Provider wallet | Balance deducted by `amount_sent_paisa`; withdrawal history shows "Completed" |

#### Reject withdrawal

| # | Action | Expected |
|---|--------|----------|
| 16 | Tap "Reject" on a row | Confirmation bottom-sheet opens |
| 17 | Submit rejection (with or without note) | Row disappears; success toast; provider balance unchanged |
| 18 | Provider wallet | Withdrawal history shows "Rejected" badge; balance unchanged |

#### Empty state

| # | Action | Expected |
|---|--------|----------|
| 19 | No pending withdrawals | Empty state shown; Revenue tab badge disappears |

---

### Screen 10 — Admin Revenue Financial Summary (HF-058D)

> **Who:** Admin
> **Navigate:** Revenue tab — Financial Overview card appears **above** the revenue hero card

#### Overview card

| # | Action | Expected |
|---|--------|----------|
| 1 | Revenue tab loads | "Financial Overview" card visible at the very top of the screen |
| 2 | Card layout | 3 rows × 2 stat tiles; all values in ৳ format |
| 3 | Row 1: Total Payments | Highlighted with primary-color border — sum of all **verified** payment amounts entered into the platform |
| 4 | Row 1: Verify Pending | Sum of **submitted** (not yet verified) payments; tile turns orange/warning when value > 0 |
| 5 | Row 2: Platform Revenue | Sum of all platform commission credits (from `platform_revenue_ledger`); shown in green |
| 6 | Row 2: Provider Wallets | Sum of all current provider wallet balances (money held in the system) |
| 7 | Row 3: Provider Withdrawn | Total money successfully paid out to providers (completed withdrawals) |
| 8 | Row 3: Pending Withdrawal | Total money providers have requested but not yet been paid; tile turns orange when value > 0 |
| 9 | Data refresh | Pull-to-refresh on Revenue tab reloads financial summary along with all other data |

> **Financial accounting check:** Total Payments = Platform Revenue + Provider Wallets + Provider Withdrawn (all money that entered the platform is accounted for).

---

## Part 3 — Bilingual Check

| Screen | Key | Bengali (bn) | English (en) |
|--------|-----|-------------|-------------|
| Payment | Select method label | পেমেন্ট পদ্ধতি বেছে নিন | Select Payment Method |
| Payment | bKash | বিকাশ | bKash |
| Payment | TxID label | ট্রানজেকশন আইডি | Transaction ID |
| Payment | Merchant card title | ধাপ ১: টাকা পাঠান | Step 1: Send Money |
| Payment | Merchant number label | বিকাশ মার্চেন্ট নম্বর | bKash Merchant Number |
| Payment | Step 2 instruction | ধাপ ২: আপনার বিকাশ অ্যাপ থেকে ট্রানজেকশন আইডি নিচে লিখুন | Step 2: Enter the transaction ID from your bKash app below |
| Payment | Submit button | পেমেন্ট জমা দিন | Submit Payment |
| Receipt | Title | পেমেন্ট রসিদ | Payment Receipt |
| Receipt | Done CTA | বুকিংয়ে ফিরুন | Back to Bookings |
| Wallet | Tab label | ওয়ালেট | Wallet |
| Wallet | Balance | উপলব্ধ ব্যালেন্স | Available Balance |
| Wallet | Withdraw button | উত্তোলনের অনুরোধ | Request Withdrawal |
| Revenue | Tab label | রাজস্ব | Revenue |
| Revenue | Total | মোট রাজস্ব | Total Revenue |
| Revenue | Verify CTA | মুলতুবি পেমেন্ট যাচাই করুন | Verify Pending Payments |
| Bookings | Payment submitted badge | পেমেন্ট জমা দেওয়া হয়েছে | Payment Submitted |
| Job detail | Submitted banner | পেমেন্ট জমা দেওয়া হয়েছে — অ্যাডমিন যাচাইয়ের অপেক্ষায় | Payment submitted — awaiting admin verification |
| Admin payments | Screen title | পেমেন্ট যাচাইকরণ | Payment Verification |
| Admin payments | Resident label | বাসিন্দা | Resident |
| Admin payments | Verify button | যাচাই করুন | Verify |
| Admin payments | Verifying state | যাচাই করা হচ্ছে… | Verifying… |
| Admin payments | Pending count | {{count}}টি পেমেন্ট যাচাইয়ের অপেক্ষায় | {{count}} payments awaiting verification |
| Admin payments | Empty title | সব শেষ! | All caught up! |
| Admin payments | Empty desc | যাচাই করার মতো কোনো পেমেন্ট নেই | No pending payments to verify |
| Provider verification | Screen title | প্রোভাইডার যাচাইকরণ | Provider Verification |
| Provider verification | Tap hint | নথি যাচাই করতে ট্যাপ করুন → | Tap to review documents → |
| Provider verification | NID section title | জাতীয় পরিচয়পত্রের ছবি | NID Documents |
| Provider verification | NID front label | এনআইডি সামনে | NID Front |
| Provider verification | NID back label | এনআইডি পিছনে | NID Back |
| Provider verification | No photo | আপলোড করা হয়নি | Not uploaded |
| Provider verification | Skills section | নিবন্ধিত দক্ষতা | Registered Skills |
| Profile | Completion title | আপনার প্রোফাইল {{percentage}}% সম্পন্ন | Your profile is {{percentage}}% complete |
| Wallet | Withdraw account label | অ্যাকাউন্টে পাঠান | Send to Account |
| Revenue (financial) | Card title | আর্থিক সারসংক্ষেপ | Financial Overview |
| Revenue (financial) | Total payments | মোট প্রবেশকৃত অর্থ | Total Payments Entered |
| Revenue (financial) | Verify pending | যাচাই বাকি পেমেন্ট | Verify Pending |
| Revenue (financial) | Platform revenue | প্ল্যাটফর্ম রাজস্ব | Platform Revenue |
| Revenue (financial) | Provider wallets | প্রোভাইডার ব্যালেন্স | Provider Wallets |
| Revenue (financial) | Provider withdrawn | প্রোভাইডার উত্তোলন | Provider Withdrawn |
| Revenue (financial) | Pending withdrawal | উত্তোলন অপেক্ষায় | Pending Withdrawal |

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
| 7 | Admin | Revenue tab → "Verify Pending Payments" → tap Verify on the row | Job moves to PAID; Provider wallet credited; row disappears from list |
| 8 | Provider | Wallet tab | Balance increased by 80% of payment amount |
| 9 | Admin | Revenue tab | Financial Overview card: Total Payments and Platform Revenue updated |
| 10 | Admin | Revenue tab | Total Revenue hero card updated |

---

## Part 5 — End-to-End Withdrawal Flow Walkthrough

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Provider | Wallet tab → "+ Add Account" | Add a bKash MFS account |
| 2 | Provider | (Optional) Add a second MFS account | Second account appears with "Set as Primary" link |
| 3 | Provider | Tap "Request Withdrawal" | Modal opens; if 2+ accounts, account picker shown |
| 4 | Provider | (Multi-account) Select desired payout account | Account picker highlights chosen account |
| 5 | Provider | Enter amount ≥ ৳100 and ≤ available balance → Submit | Success toast; withdrawal history shows "Pending" row |
| 6 | Admin | Revenue tab | Pending count badge on "Withdrawal Requests" button |
| 7 | Admin | Tap "Withdrawal Requests" | Admin Withdrawals screen opens; provider row visible |
| 8 | Admin | Tap "Complete" on the row | Modal opens pre-filled with requested amount |
| 9 | Admin | Enter Transaction ID (auto-uppercased), confirm sent date → Submit | Row removed from pending list; success toast |
| 10 | Provider | Wallet tab | Balance deducted; withdrawal history row shows "Completed" badge |
| 11 | Admin | Revenue tab → Financial Overview | Provider Withdrawn amount increased; Provider Wallets decreased |
