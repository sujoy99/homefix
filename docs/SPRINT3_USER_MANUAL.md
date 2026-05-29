# HomeFix — Sprint 3 Mobile: User Manual

> **Sprint:** Sprint 3 — Booking & Job Lifecycle  
> **Covers:** HF-034 · HF-035 · HF-036 · HF-037 · HF-038 · HF-039 · HF-040 · HF-041  
> **Audience:** QA, Product Owner, Business Stakeholder  
> **Last updated:** 2026-05-30

---

## Part 1 — Environment Setup

### Start the backend

```bash
# From repo root
make start       # Start containers (backend + DB)
make migrate     # Apply jobs table migration (required for Sprint 3)
```

### Start the mobile app

```bash
cd mobile
npx expo start
# Scan QR code with Expo Go (Android) or press 'i' for iOS simulator
```

### Seed accounts

| Role | Mobile | Password | Name |
|------|--------|----------|------|
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — Plumbing skill |
| **Admin** | `00000000000` | `Admin@1234` | — |

---

## Part 2 — Screen-by-Screen Checklist

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Create Booking Flow (HF-034 · HF-035 · HF-036)

> **Who:** Resident  
> **Navigate:** Home screen → tap any category card → tap "Book Now" on any provider  
> **OR:** Home → "Near you" provider card → "Book Now"  
> **What to check:** 5-step wizard with a progress bar at the top and "Step X of 5" label.

#### Step 1 — Select Service (Category)

| # | Action | Expected |
|---|--------|----------|
| 1 | Booking flow opens | Screen title "New Booking", progress bar at 20%, chip label "Select Service" |
| 2 | Coming from provider detail | The provider's primary category is pre-selected (highlighted with blue tick) |
| 3 | Tap a different category | New category highlighted; old one deselected |
| 4 | Tap Next without selecting any | Red inline error: "Please select a service category" |
| 5 | Tap Next with a category selected | Moves to Step 2 |
| 6 | Tap ← back arrow | Returns to previous screen |

#### Step 2 — Describe Issue

| # | Action | Expected |
|---|--------|----------|
| 1 | Step label | "Describe Issue"; progress bar at 40% |
| 2 | Optional title field | Labelled "Job Title (optional)"; can be left empty |
| 3 | Description field | Required; placeholder "Describe the problem in detail (at least 10 characters)..." |
| 4 | Tap Next with empty description | Red inline error: "Description is required" |
| 5 | Tap Next with 5-character description | Red inline error: "Description must be at least 10 characters" |
| 6 | Valid description (10+ chars) → Next | Moves to Step 3 |

#### Step 3 — Photos & Details

| # | Action | Expected |
|---|--------|----------|
| 1 | Step label | "Photos & Details"; progress bar at 60% |
| **For area-based services (e.g. Painting):** | | |
| 2 | Square footage input appears | Labelled "Area (square feet)" with red asterisk |
| 3 | Tap Next with empty sq footage | Red inline error: "Square footage is required for this service" |
| 4 | Enter non-numeric value | Red inline error: "Enter a valid positive number" |
| 5 | Enter valid sq footage → Next | Proceeds |
| **For all services:** | | |
| 6 | "Add Photos (optional)" button visible | Dashed border button with camera icon |
| 7 | Tap Add Photos | Photo gallery opens; multi-select allowed |
| 8 | Select 3 photos | Thumbnails appear in a horizontal row |
| 9 | Tap ✕ on a thumbnail | Photo removed from selection |
| 10 | Photos are optional | Can tap Next without selecting any photos |
| 11 | Max 5 photos | After 5 selected, "Add Photos" button disappears |
| 12 | Non-area service | No square footage field; only photo picker shown |

#### Step 4 — Service Address

| # | Action | Expected |
|---|--------|----------|
| 1 | Step label | "Service Address"; progress bar at 80% |
| 2 | Four fields shown | House/Building *(required)*, Flat/Floor *(optional)*, Road/Street *(required)*, Area/Neighbourhood *(required)* |
| 3 | Tap Next with House empty | Red inline error: "House/building is required" |
| 4 | Tap Next with Road empty | Red inline error: "Road/street is required" |
| 5 | Tap Next with Area empty | Red inline error: "Area is required" |
| 6 | Fill all required fields → Next | Moves to Step 5 |
| 7 | Address differs from registered home | Allowed — this is where the provider will go (REQ-008) |
| 8 | Flat field left empty | No error — it is optional |

#### Step 5 — Budget & Review

| # | Action | Expected |
|---|--------|----------|
| 1 | Step label | "Budget & Review"; progress bar at 100% |
| 2 | Budget field | Labelled "Estimated Budget (৳) — optional"; numeric keyboard |
| 3 | Enter negative or zero budget | Red inline error: "Enter a valid positive amount" |
| 4 | Leave budget empty | Allowed — budget is optional |
| 5 | Review summary card shown | Lists: Service, Description, Address, Photos count, Budget |
| 6 | Budget not entered | Shows "Not specified" in review |
| 7 | Tap "Post Job" | Loading spinner on button; API call made |
| 8 | Success | Green toast: "Job Posted!"; navigates to Bookings tab |
| 9 | Network error | Red toast: "Could not post job. Please try again." |
| 10 | Press Back from Step 5 | Returns to Step 4; all entered data preserved |

---

### Screen 2 — Resident Bookings List (HF-037)

> **Who:** Resident  
> **Navigate:** Bottom tab bar → "Bookings" (calendar icon)  
> **What to check:** Four status tabs filter jobs; the "+" FAB launches a new booking.

| # | Action | Expected |
|---|--------|----------|
| 1 | Bookings tab opens | Header: "My Bookings" + blue "+" circle (FAB) at top right |
| 2 | Four filter chips below header | "Upcoming" · "Active" · "Awaiting Payment" · "Completed" |
| 3 | Tab shows count | Each tab with jobs shows "(N)" suffix, e.g. "Upcoming (2)" |
| 4 | Newly posted job | Appears in "Upcoming" tab with amber "Pending" badge |
| 5 | Accepted job | Appears in "Active" tab with blue "Active" badge |
| 6 | Work-complete job | Appears in "Awaiting Payment" tab with purple badge |
| 7 | Paid job | Appears in "Completed" tab with green "Paid" badge |
| 8 | Cancelled job | Appears in "Completed" tab with grey "Cancelled" badge |
| 9 | Job card content | Shows: job title (or category if no title), category chip, service address, budget (৳ or "Not set"), posted date |
| 10 | Switch to tab with 0 jobs | Empty state illustration + descriptive text |
| 11 | "Upcoming" empty state | Shows "New Booking" button inside empty state |
| 12 | Tap "+" FAB | Opens booking flow |
| 13 | Tap a job card | Opens job detail / status tracking screen |
| 14 | Pull down to refresh | Spinner shown; list reloads from API |
| 15 | Bengali language | All tab labels and badges in Bengali |

---

### Screen 3 — Job Status Tracking (HF-040)

> **Who:** Resident  
> **Navigate:** Bookings tab → tap any job card  
> **What to check:** Visual 4-step stepper tracks job progress in real time.

| # | Action | Expected |
|---|--------|----------|
| 1 | Detail screen opens | Title "Job Detail"; back arrow top-left |
| 2 | Status stepper visible | Card labelled "Job Status" at top of scroll |
| 3 | PENDING job | "Posted" step: pulsing blue dot; steps 2–4 greyed out |
| 4 | ACTIVE job | "Posted" step: green ✓ with green connector; "Provider Found" step: pulsing blue dot |
| 5 | AWAITING_PAYMENT job | Steps 1–2 green ✓; "Work Complete" pulsing |
| 6 | PAID job | All 4 steps green ✓ |
| 7 | Provider card (once accepted) | Section "Assigned Provider" with provider name and rating |
| 8 | Job info sections | Category chip, Description, Service Address, Budget, Sq Footage (if set) |
| 9 | Photos section | Horizontal scrollable photo row (only shown if photos were uploaded) |
| 10 | Auto-refresh | Status stepper updates automatically within 10 seconds when provider accepts or marks complete — no manual pull needed |
| 11 | No provider footer | Resident sees no action buttons on this screen |

---

### Screen 4 — Provider Job Feed (HF-038)

> **Who:** Provider  
> **Navigate:** Login as Provider → "Jobs" tab (briefcase icon)  
> **What to check:** Feed shows matching PENDING jobs sorted by distance from provider's location.

| # | Action | Expected |
|---|--------|----------|
| 1 | First launch | Location permission prompt appears |
| 2 | Grant permission | Feed loads; each card shows distance badge (e.g. "3.2 km away") |
| 3 | Job within 1 km | Distance badge shows "Nearby" instead of a number |
| 4 | Deny permission | Yellow banner: "Enable location for distance sorting"; feed still loads (sorted by date instead) |
| 5 | Tap yellow banner | Permission dialog re-appears |
| 6 | Jobs match provider's trade | Rahim (Plumbing) sees only Plumbing jobs |
| 7 | Only PENDING jobs visible | Already-accepted jobs do not appear |
| 8 | Job card content | Category chip, description preview (first 100 chars + "…"), distance badge, address, budget, posted date, "View Job" button |
| 9 | No budget | Shows "Not specified" |
| 10 | Feed empty | Empty state: "No jobs available" with explanation text |
| 11 | Pull to refresh | Feed reloads |

---

### Screen 5 — Provider Job Detail & Accept (HF-039)

> **Who:** Provider  
> **Navigate:** Jobs tab → tap a job card or "View Job" button  
> **What to check:** Provider reviews job details and accepts without a confirmation dialog.

| # | Action | Expected |
|---|--------|----------|
| 1 | Detail screen opens | Full job info: category, description, address, budget, sq footage, photos |
| 2 | "Accept Job" button | Amber/secondary button at bottom; "Not Interested" ghost button below it |
| 3 | Tap "Accept Job" | Button shows brief loading state → green toast: "Job accepted! Check your active jobs." → navigates back to feed |
| 4 | Job removed from feed | Feed refreshes; accepted job no longer visible |
| 5 | Tap "Not Interested" | Navigates back to feed; no API call; job stays in feed |
| 6 | Concurrent accept (two providers) | Second provider sees red toast: "This job was just taken by another provider." → navigates back; job gone from their feed |
| 7 | Network error | Red toast: "Could not accept job. Please try again." |
| 8 | Non-pending job (already taken) | Warning banner at top: "This job is no longer available — Another provider accepted this job before you." No Accept button shown. |

---

### Screen 6 — Provider Marks Work Complete (HF-041)

> **Who:** Provider  
> **Navigate:** Jobs tab → tap an active job you own  
> **What to check:** Provider marks work done; status moves to Awaiting Payment.

| # | Action | Expected |
|---|--------|----------|
| 1 | Open an ACTIVE job you accepted | "Mark Work Complete" amber button at bottom |
| 2 | Tap "Mark Work Complete" | Button shows "Marking..." (disabled) → green toast: "Job marked as complete. Resident has been notified." |
| 3 | After marking | Button disappears; status stepper shows AWAITING_PAYMENT |
| 4 | Resident's Bookings tab | Job moves to "Awaiting Payment" tab within 10 s |
| 5 | Network error | Red toast: "Could not mark job complete. Please try again." |
| 6 | Job not yours (different provider_id) | "Mark Work Complete" button not shown |
| 7 | Job is PENDING (not yet active) | "Mark Work Complete" button not shown; Accept button shown instead |

---

## Part 3 — End-to-End Flows

### Flow A — Full Job Lifecycle

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Resident | Home → tap Plumbing → Book Now on any provider | Booking flow opens; Plumbing pre-selected |
| 2 | Resident | Fill description, address, budget → tap "Post Job" | Green toast "Job Posted!"; Bookings tab shows job as Upcoming |
| 3 | Provider | Jobs tab | New Plumbing job appears in feed with distance badge |
| 4 | Provider | Tap job → Accept Job | Green toast "Job accepted!"; job removed from feed |
| 5 | Resident | Bookings → Active tab | Job listed as Active; provider name card visible on detail screen |
| 6 | Provider | Active job detail → Mark Work Complete | Green toast; status → Awaiting Payment |
| 7 | Resident | Bookings → Awaiting Payment tab | Job listed; stepper shows 3 of 4 steps complete |

---

### Flow B — Painting Job (requires_area)

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Resident | Book a Painting job | Step 3 shows "Area (square feet)" required field |
| 2 | Resident | Leave sq footage blank → Next | Red inline error: "Square footage is required for this service" |
| 3 | Resident | Enter 350 → complete booking | Job created with sq footage = 350 |
| 4 | Provider | View job in feed | "350 sq ft" shown in job detail stats row |

---

### Flow C — Service Address Different from Home (REQ-008)

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Resident | Enter address different from registered home | No warning; address accepted |
| 2 | Provider | View job detail | Service address (booking address) shown — not the resident's registered home |

---

### Flow D — Concurrent Accept (Race Condition)

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Provider A | Opens a PENDING job → tap Accept Job | Job accepted; status → Active |
| 2 | Provider B | Had same job open and also taps Accept Job | Red toast: "This job was just taken by another provider." → navigates back; job gone from feed |
| 3 | Backend | Only one `PATCH /v2/jobs/:id/accept` succeeds | State machine ensures atomicity; no duplicate active assignments |

---

## Part 4 — Language Check (Bilingual)

Switch language to Bengali (বাংলা) via Profile → Language and verify:

| Screen | Key strings to verify in Bengali |
|--------|----------------------------------|
| Booking flow | Step labels, field labels, error messages, "কাজ পোস্ট করুন" (Post Job) |
| Bookings tab | Tab names: "আসন্ন", "সক্রিয়", "পেমেন্ট বাকি", "সম্পন্ন" |
| Job detail | "কাজের স্ট্যাটাস", step labels, "কাজ গ্রহণ করুন", "কাজ সম্পন্ন হিসেবে চিহ্নিত করুন" |
| Provider feed | "উপলব্ধ কাজ", distance labels, "কাজ দেখুন" |

---

## Part 5 — Known Limitations (Sprint 3)

| What you see | Why | Fixed in |
|---|---|---|
| No payment option after "Awaiting Payment" | Payment module (Sprint 6, HF-059) | Sprint 6 |
| No push notification when provider accepts | Push notifications (Sprint 5, HF-048) | Sprint 5 |
| Voice note button missing | Voice features (Sprint 4, HF-042) | Sprint 4 |
| Provider home dashboard stats are placeholders | Live stats come from job data; dashboard wired in Sprint 3 | Sprint 3 ✅ |
| Status stepper uses 10 s polling, not instant | WebSocket/push real-time (Sprint 5) | Sprint 5 |

---

## Part 6 — Bug Report Template

When reporting a bug, include:

1. **Screen + row number** — e.g. "Screen 3, row 4"
2. **What you did** — exact taps and inputs
3. **Expected result** — from the "Expected" column
4. **What actually happened** — describe, screenshot, or screen recording
5. **Device + OS** — e.g. Samsung Galaxy A54, Android 14
6. **Language** — Bengali or English
7. **Role** — Resident / Provider / Admin
