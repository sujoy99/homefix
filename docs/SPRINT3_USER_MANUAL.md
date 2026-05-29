# HomeFix — Sprint 3 Mobile: Manual Test Guide

> **Sprint:** Sprint 3 — Booking & Job Lifecycle  
> **Covers:** HF-034 · HF-035 · HF-036 · HF-037 · HF-038 · HF-039 · HF-040 · HF-041  
> **Audience:** QA, Product Owner, Business Stakeholder  
> **Status:** 🚧 Template — to be completed when mobile tickets are implemented  
> **Last updated:** 2026-05-29

---

## Part 1 — Environment Setup

See [SPRINT2_USER_MANUAL.md](SPRINT2_USER_MANUAL.md) Part 1 for backend start, mobile start, and seed instructions. The commands are the same.

**Additional requirement for Sprint 3:** The backend Sprint 3 branch must be running (or merged to master). Run `make migrate` to apply the jobs table migration before testing.

### Seed Test Accounts

| Role | Mobile | Password | Notes |
|------|--------|----------|-------|
| **Admin** | `00000000000` | `Admin@1234` | — |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — has Plumbing skill |
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |

---

## Part 2 — Test Checklist by Screen

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Create Booking Flow (HF-034 + HF-035 + HF-036)

> **What to check:** Resident taps a category, fills in the job details across multiple steps, and submits a booking.  
> **Navigate:** Resident Home → tap a category → tap "Book Now"

#### Step 1A: Category + Square Footage (HF-035)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Tap "Book Now" on Provider Detail or category card | Booking flow opens | |
| 2 | Category is pre-selected | Category name shown and cannot be changed on this screen | |
| 3 | Category is "Painting" (`requires_area`) | A "Square Footage" numeric field appears | |
| 4 | Category is "Plumbing" (no `requires_area`) | No square footage field | |
| 5 | Leave square footage empty for Painting → Next | **Red toast**: "Square footage is required for this service" | |
| 6 | Fill square footage with a valid number → Next | Proceeds to next step | |

#### Step 1B: Describe the Problem (HF-034)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Text description field shown | Placeholder: "Describe the problem..." | |
| 2 | Type a description (10+ characters) | Character count shown; no error | |
| 3 | Try to proceed with < 10 characters | **Red toast**: "Description must be at least 10 characters" | |
| 4 | Type a description and tap Next | Proceeds to photo step | |

#### Step 1C: Upload Photos (HF-034)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | "Add Photos" button visible | Camera/gallery icon with hint text | |
| 2 | Tap "Add Photos" | Photo picker or camera opens | |
| 3 | Select 2 photos | Thumbnails shown in a row | |
| 4 | Tap X on a photo thumbnail | Photo removed | |
| 5 | Try to add 11 photos after 10 selected | **Red toast**: "Maximum 10 photos allowed" | |
| 6 | Photos are optional | Can skip to next step without selecting any | |

#### Step 1D: Service Address (HF-036)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Address form shown | House, Flat (optional), Road, Area fields | |
| 2 | "Use Current Location" option | GPS auto-fills the Area field | |
| 3 | Leave "House" empty → Next | **Red toast**: "House/building number is required" | |
| 4 | Leave "Road" empty → Next | **Red toast**: "Road is required" | |
| 5 | Fill all required fields → Next | Proceeds | |
| 6 | Address can differ from registered home | Allowed — this is where the provider must go (REQ-008) | |

#### Step 1E: Date & Budget (HF-034)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Date picker shown | Defaults to today or tomorrow | |
| 2 | Select a past date | **Red toast**: "Date must be today or in the future" | |
| 3 | Budget field shown | Numeric input with "৳" symbol, labelled "Estimated Budget" | |
| 4 | Leave budget empty | Allowed — budget is optional | |
| 5 | Enter a valid budget | ৳ symbol shows; positive number required | |

#### Step 1F: Review & Confirm

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Review screen shows summary | Category, description, address, budget, photos listed | |
| 2 | Tap "Confirm Booking" | Job created; **Green toast**: "Booking submitted!" | |
| 3 | Redirected to Bookings tab | New job at top with "Pending" badge | |
| 4 | No network → tap Confirm | **Red toast**: "Could not submit booking. Check your connection." | |

---

### Screen 2 — Resident Bookings List (HF-037)

> **What to check:** Resident sees all their bookings, sorted by status with tab filters.  
> **Navigate:** Resident → "Bookings" tab (second tab in bottom bar)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Bookings tab opens | Tabs: Upcoming · Active · Awaiting Payment · Completed | |
| 2 | New submitted job appears | Under "Upcoming" tab with "Pending" badge (amber colour) | |
| 3 | Active job (provider accepted) | Under "Active" tab with blue badge | |
| 4 | Awaiting payment job | Under "Awaiting Payment" tab with orange badge | |
| 5 | Paid job | Under "Completed" tab with green badge | |
| 6 | Tab badge count | Each tab shows a count of jobs | |
| 7 | Job card shows | Category name, area, date, status badge | |
| 8 | Tap a job card | Job detail / status tracking screen opens | |
| 9 | No jobs in a tab | "No bookings here yet" empty state shown | |
| 10 | Pull to refresh | List updates from server | |
| 11 | Language Bengali | All labels and badges in Bengali | |

---

### Screen 3 — Job Status Tracking Card (HF-040)

> **What to check:** Resident can track job status in real time after a provider accepts.  
> **Navigate:** Bookings tab → tap any job card

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Status tracking screen opens | Shows current status with a step indicator bar | |
| 2 | Status: Pending | "Looking for a provider…" message | |
| 3 | Status: Active | Provider name visible; "On the way!" or equivalent | |
| 4 | Status: Awaiting Payment | "Work completed — please pay" banner | |
| 5 | Step indicator | Pending → Active → Awaiting Payment → Paid (4 steps) | |
| 6 | Job description shown | Resident's original problem description | |
| 7 | Service address shown | Address entered at booking time | |
| 8 | Budget shown | "Estimated Budget: ৳ X,XXX" | |
| 9 | Photos shown | Uploaded photos in a horizontal scroll row | |
| 10 | Pull to refresh | Status updates from server | |

---

### Screen 4 — Provider Job Feed (HF-038)

> **What to check:** Provider sees available jobs that match their skills, sorted by distance.  
> **Navigate:** Login as Provider → "Jobs" tab (middle tab)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Jobs tab loads | "Available Jobs" heading shown | |
| 2 | Jobs match provider's skill category | Rahim (Plumbing) only sees Plumbing jobs | |
| 3 | Jobs sorted by distance | Nearest service address appears first | |
| 4 | Job card shows | Category, area name, time since posted, estimated budget | |
| 5 | Budget formatted | "৳ 1,500" — ৳ symbol prefix | |
| 6 | No budget specified | "Budget not specified" shown | |
| 7 | Feed is empty | "No available jobs in your area" empty state | |
| 8 | Accepted/Active jobs hidden | Only PENDING jobs appear in the feed | |
| 9 | Pull to refresh | Feed updates from server | |
| 10 | Language Bengali | Feed in Bengali | |

---

### Screen 5 — Provider Accepts a Job (HF-039)

> **What to check:** Provider taps a job, reviews the details, and accepts it.  
> **Navigate:** Provider → Jobs tab → tap a job card

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Job detail screen opens | Full description, photos, address, budget shown | |
| 2 | "Accept Job" button shown | Prominent CTA at the bottom | |
| 3 | Tap "Accept Job" | **Confirmation dialog**: "Accept this job? You will be assigned as the provider." | |
| 4 | Tap "Cancel" in dialog | Dialog closes; job unchanged | |
| 5 | Tap "Accept" in dialog | Status → Active; **Green toast**: "Job accepted!" | |
| 6 | Job removed from feed | Feed refreshes; this job no longer visible | |
| 7 | No network → tap Accept | **Red toast**: "Could not accept job. Try again." | |

---

### Screen 6 — Provider Marks Work Complete (HF-041)

> **What to check:** After completing the work, provider marks the job as done. Resident status updates to "Awaiting Payment".  
> **Navigate:** Provider → Jobs tab → Active Jobs section → tap an active job

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Active job shown | "Mark Work Complete" button visible | |
| 2 | Tap "Mark Work Complete" | **Confirmation dialog**: "Mark work as done? Resident will be prompted to pay." | |
| 3 | Tap "Cancel" | Dialog closes; job still Active | |
| 4 | Tap "Confirm" | Status → Awaiting Payment; **Green toast**: "Work marked as complete!" | |
| 5 | Resident view updates | Resident's Bookings tab shows job under "Awaiting Payment" | |
| 6 | "Mark Complete" button hidden | Cannot be tapped again once done | |
| 7 | No network → tap Confirm | **Red toast**: "Could not update job. Try again." | |

---

## Part 3 — Cross-Screen Flows

### Flow A — Full Booking Lifecycle (Resident + Provider)

| # | Who | Step | Expected Result |
|---|-----|------|-----------------|
| 1 | Resident | Login → Home → tap Plumbing → Book Now | Booking flow starts |
| 2 | Resident | Fill description, photos, address, budget → Confirm | **Green toast** "Booking submitted!"; appears in Bookings tab as Pending |
| 3 | Provider | Login → Jobs tab | New Plumbing job visible in feed |
| 4 | Provider | Tap job → Accept → Confirm | Job moves to Active; removed from feed |
| 5 | Resident | Bookings → Active tab | Job shown as Active; provider name visible |
| 6 | Provider | Active job → Mark Complete → Confirm | Status → Awaiting Payment |
| 7 | Resident | Bookings → Awaiting Payment tab | Job shown; "Work completed — please pay" banner |

---

### Flow B — Painting Job (requires_area)

| # | Who | Step | Expected Result |
|---|-----|------|-----------------|
| 1 | Resident | Book a Painting job | Square footage field appears |
| 2 | Resident | Skip square footage → Next | Red toast error |
| 3 | Resident | Enter 350 sq. ft. → submit | Job created successfully |
| 4 | Provider | View job detail | "350 sq. ft." shown on the job card |

---

### Flow C — Service Address Separate from Home

| # | Who | Step | Expected Result |
|---|-----|------|-----------------|
| 1 | Resident | Enter an address different from their registered home | Allowed — no warning |
| 2 | Provider | View job in feed | Service address (not resident's home) shown |
| 3 | Provider | Jobs sorted by service address proximity | Jobs closest to the work location appear first |

---

## Part 4 — Known Limitations (This Sprint)

| What you see | Why | When fixed |
|---|---|---|
| No payment option after "Awaiting Payment" | Payment module is Sprint 6 (HF-056) | Sprint 6 |
| No push notification when provider accepts | Sprint 5 (HF-048) | Sprint 5 |
| Voice note recording not available | Sprint 4 (HF-042) | Sprint 4 |
| Voice note playback shows placeholder | Sprint 4 (HF-045) | Sprint 4 |
| Provider dashboard stats still placeholders | Live stats come from job data this sprint | Sprint 3 |

---

## Part 5 — Reporting a Bug

When reporting a bug from this checklist, include:

1. **Screen + Step number** — e.g. "Screen 1, Step 1D, row 3"
2. **What you did** — exact taps/inputs
3. **What you expected** — from the "Expected Result" column
4. **What actually happened** — describe, screenshot, or screen recording
5. **Device + OS** — e.g. Samsung Galaxy A54, Android 14
6. **Language** — Bengali or English when the bug occurred
7. **Role** — Admin / Provider / Resident
