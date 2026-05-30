# HomeFix — Sprint 3 Mobile Test Report

> **Sprint:** Sprint 3 — Booking & Job Lifecycle (Mobile)  
> **Date:** 2026-05-30  
> **Branch:** `feature/sprint-3-mobile`  
> **Platform:** Mobile (Expo SDK 54 · React Native · Jest + RNTL)

---

## Automated Test Results

```
Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total
Snapshots:   0 total
```

### Run command

```bash
cd mobile && npx jest --forceExit
```

### Suite breakdown

| Suite | File | Tests | Result |
|-------|------|-------|--------|
| Job service | `tests/services/job.service.test.ts` | 9 | ✅ Pass |
| JobCard component | `tests/components/JobCard.test.tsx` | 8 | ✅ Pass |
| ProviderJobCard component | `tests/components/ProviderJobCard.test.tsx` | 7 | ✅ Pass |
| Bookings screen | `tests/screens/bookings.test.tsx` | 7 | ✅ Pass |
| Auth store (regression) | `tests/store/authStore.test.ts` | 3 | ✅ Pass |

---

## Test Coverage by Ticket

### HF-034 — Create booking flow

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | `createJob` posts to `/v2/jobs` with required fields | Service unit | ✅ |
| 2 | `createJob` includes optional fields (budget, sq footage) | Service unit | ✅ |

**Manual test cases (multi-step wizard — not automatable):**

| Scenario | Steps | Expected |
|----------|-------|----------|
| Happy path | Resident → Home → Book Now → fill all 5 steps → Post Job | Job created, `toast.success("Job Posted!")`, navigates to Bookings tab |
| Category pre-selected | Provider detail → Book Now | Opens on Step 2 with category pre-filled |
| Description too short | Enter < 10 chars → Next | Inline error: "Description must be at least 10 characters" |
| Missing address fields | Leave House or Road empty → Next on Address step | Inline errors per field |
| Photo upload | Add 3 photos → Post Job | Photos uploaded; `media_urls` populated on job record |
| Budget invalid | Enter `-500` as budget | Inline error: "Enter a valid positive amount" |

---

### HF-035 — Area input (conditional sq. footage)

| Scenario | Steps | Expected |
|----------|-------|----------|
| `requires_area = true` category | Select painting/area service | Step 3 shows sq-footage input; omitting it blocks Next with inline error |
| `requires_area = false` category | Select any non-area service | Step 3 shows no sq-footage field |

---

### HF-036 — Service address input

Covered in HF-034 manual cases (Address step).

---

### HF-037 — Resident bookings list

| # | Test | Type | Result |
|---|------|------|--------|
| 3 | Renders 4 status tabs | Screen | ✅ |
| 4 | Shows empty state when no PENDING jobs | Screen | ✅ |
| 5 | Renders PENDING job card on Upcoming tab | Screen | ✅ |
| 6 | Shows job count badge on each tab | Screen | ✅ |
| 7 | Switching to Active tab hides Pending jobs | Screen | ✅ |
| 8 | Completed tab shows PAID jobs | Screen | ✅ |
| 9 | New Booking FAB calls `router.push` | Screen | ✅ |

**Manual test cases:**

| Scenario | Steps | Expected |
|----------|-------|----------|
| Pull to refresh | Pull down on any tab | Spinner → list reloads from API |
| Tap a job card | Tap any card | Navigates to job detail screen |
| Empty state CTA | Upcoming tab with no jobs → tap "New Booking" | Opens booking flow |

---

### HF-038 — Provider job feed

| # | Test | Type | Result |
|---|------|------|--------|
| 10 | `getProviderFeed` passes lat/lon to `/v2/jobs/feed` | Service unit | ✅ |
| 11 | `getProviderFeed` works without location params | Service unit | ✅ |
| 12 | Description preview truncated to 100 chars | Component | ✅ |
| 13 | Distance badge shown when distanceKm ≥ 1 | Component | ✅ |
| 14 | "Nearby" shown when distanceKm < 1 | Component | ✅ |
| 15 | `budget_tbd` when no budget | Component | ✅ |
| 16 | `onPress` called when View Job tapped | Component | ✅ |

**Manual test cases:**

| Scenario | Steps | Expected |
|----------|-------|----------|
| Location granted | Open Jobs tab as Provider → grant permission | Feed sorted by distance; distance badges visible |
| Location denied | Deny location permission | Warning banner shown; feed loads without distance sort; tap banner re-requests |
| Empty feed | No matching PENDING jobs for provider's trade | Empty state: "No jobs available" |

---

### HF-039 — Job accept/reject

| # | Test | Type | Result |
|---|------|------|--------|
| 17 | `acceptJob` patches `/v2/jobs/:id/accept` | Service unit | ✅ |
| 18 | `acceptJob` propagates `INVALID_STATE_TRANSITION` | Service unit | ✅ |

**Manual test cases:**

| Scenario | Steps | Expected |
|----------|-------|----------|
| Accept happy path | Provider → View Job → Accept Job | `toast.success`, navigates back, job gone from feed |
| Concurrent accept | Two providers tap Accept simultaneously | Second: `toast.error("This job was just taken by another provider.")` → navigates back |
| Not Interested | Tap Not Interested | Navigates back; no API call |
| Already-taken banner | View a non-pending job not assigned to you | Warning banner; no Accept footer |

---

### HF-040 — Job status tracking card

**Manual test cases:**

| Scenario | Steps | Expected |
|----------|-------|----------|
| PENDING job | Resident opens Upcoming job | Stepper: "Posted" pulsing dot; steps 2–4 greyed |
| ACTIVE job | Open after provider accepts | Stepper: "Posted" ✓, "Provider Found" pulsing; provider card visible |
| AWAITING_PAYMENT | Provider marks complete; resident opens | Stepper: steps 1–2 ✓, "Work Complete" pulsing |
| PAID | After payment (Sprint 6) | All 4 steps ✓ green |
| Auto-refresh | Leave detail screen open | Status updates within 10 s when provider acts |

---

### HF-041 — Provider marks Work Complete

| # | Test | Type | Result |
|---|------|------|--------|
| 19 | `completeJob` patches `/v2/jobs/:id/complete` | Service unit | ✅ |

**Manual test cases:**

| Scenario | Steps | Expected |
|----------|-------|----------|
| Mark complete | Provider opens ACTIVE own job → Mark Work Complete | `toast.success`, stepper advances to AWAITING_PAYMENT |
| Button hidden post-complete | Provider views AWAITING_PAYMENT job | "Mark Work Complete" not shown |
| Double-tap guard | Tap button twice rapidly | Button disabled during first in-flight request |

---

## Component tests — `JobCard`

| # | Test | Result |
|---|------|--------|
| 20 | Renders job title | ✅ |
| 21 | Renders category chip | ✅ |
| 22 | Status badge — PENDING | ✅ |
| 23 | Status badge — ACTIVE | ✅ |
| 24 | Status badge — PAID | ✅ |
| 25 | Renders formatted budget (৳1500) | ✅ |
| 26 | Renders `budget_tbd` fallback | ✅ |
| 27 | Calls `onPress` when tapped | ✅ |

---

## Error Code Reference

| error_code | Trigger | Mobile handling |
|------------|---------|-----------------|
| `SQUARE_FOOTAGE_REQUIRED` | `POST /v2/jobs` — area service without sq footage | Inline field error on booking Step 3 |
| `INVALID_STATE_TRANSITION` | Accept/complete on wrong status | `toast.error` + cache invalidation; navigates back |
| `PROVIDER_NOT_ELIGIBLE` | Accept when provider not approved | `toast.error` |
| `JOB_ACCESS_DENIED` | Fetch job owned by another user | `toast.error` |

---

## Setup

```bash
# Start backend
make start && make migrate

# Run all mobile tests
cd mobile && npx jest --forceExit

# Type-check
cd mobile && npx tsc --noEmit --ignoreDeprecations 5.0
# Note: 1 pre-existing hint in Toast.tsx (duplicate elevation key) — not a blocker
```

### Seed accounts

| Role | Mobile | Password |
|------|--------|----------|
| Resident | `01811223344` | `Resident@1234` |
| Provider (approved) | `01711223344` | `Provider@1234` |
| Admin | `00000000000` | `Admin@1234` |
