# Sprint 3 Mobile — Test Report

> **Sprint:** Sprint 3 — Booking & Job Lifecycle  
> **Tickets:** HF-034 to HF-041  
> **Branch:** `feature/sprint-3-mobile`  
> **Status:** 🚧 Pending — mobile tickets not yet implemented  
> **Last Updated:** 2026-05-29

---

## Automated Test Results

**Run command:**
```bash
cd mobile && npx jest --forceExit
```

**Result: Pending ⏳**

> This file will be updated with test results after HF-034 to HF-041 are implemented.

| Suite | Tests | Status |
|-------|-------|--------|
| booking.service.test.ts | — | ⏳ |
| jobStore.test.ts | — | ⏳ |
| bookingFlow.test.ts | — | ⏳ |
| providerFeed.test.ts | — | ⏳ |

---

## Test Scope (to be implemented)

### Service Layer Tests

| File | What it tests |
|------|---------------|
| `mobile/services/job.service.test.ts` | createJob, getMyJobs, getJobById, getProviderFeed, acceptJob, completeJob |
| `mobile/services/media.service.test.ts` | uploadJobMedia, uploadVoiceNote |

### Store Tests

| File | What it tests |
|------|---------------|
| `mobile/store/bookingStore.test.ts` | Booking state transitions, draft job state |
| `mobile/store/jobStore.test.ts` | Provider feed state, active jobs list |

### Component / Screen Tests

| File | What it tests |
|------|---------------|
| `mobile/tests/screens/CreateBookingFlow.test.tsx` | Multi-step form validation (description, address, budget, square footage) |
| `mobile/tests/screens/BookingsList.test.tsx` | Tab filtering, status badge rendering |
| `mobile/tests/screens/ProviderFeed.test.tsx` | Empty state, job card rendering |

---

## Manual Test Reference

For screen-by-screen manual testing instructions, see:
**[SPRINT3_USER_MANUAL.md](SPRINT3_USER_MANUAL.md)** — business stakeholder format, step-by-step with result checkboxes

---

## Known Limitations (deferred to later sprints)

| Feature | Deferred to |
|---------|-------------|
| Payment after "Awaiting Payment" status | Sprint 6 (HF-056) |
| Push notification when provider accepts | Sprint 5 (HF-048) |
| Voice note recording in booking | Sprint 4 (HF-042) |
| Real-time GPS tracking of provider | Sprint 5 (HF-049) |
| Review & rating after payment | Sprint 5 (HF-050) |

---

## Error Code Reference (for mobile error handling)

| Backend Error Code | HTTP | Mobile Display |
|-------------------|------|----------------|
| `SQUARE_FOOTAGE_REQUIRED` | 400 | Show red toast: "Square footage is required for this service" |
| `INVALID_STATE_TRANSITION` | 400 | Show red toast: "This action is no longer available" |
| `PROVIDER_NOT_ELIGIBLE` | 403 | Show red toast: "You are not eligible to accept this job" |
| `JOB_ACCESS_DENIED` | 403 | Show red toast: "You do not have access to this job" |
| `RESOURCE_NOT_FOUND` | 404 | Show red toast: "Job not found" |
