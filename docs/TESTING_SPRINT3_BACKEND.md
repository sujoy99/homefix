# Sprint 3 Backend — Manual & Automated Test Guide

**Sprint:** Sprint 3 — Booking & Job Lifecycle  
**Tickets:** HF-031, HF-032, HF-033  
**Branch:** `feature/sprint-3-backend`  
**Last Updated:** 2026-05-29

---

## Automated Test Results

**Run command:**
```bash
cd backend && npm test -- --testPathPattern="jobs" --forceExit
```

**Result: 39/39 PASSED ✅** (32.983s)

| Test Suite | Tests | Status |
|---|---|---|
| POST /api/v2/jobs | 7 | ✅ All pass |
| GET /api/v2/jobs | 3 | ✅ All pass |
| GET /api/v2/jobs/:id | 3 | ✅ All pass |
| GET /api/v2/jobs/feed | 5 | ✅ All pass |
| PATCH /api/v2/jobs/:id/accept | 6 | ✅ All pass |
| PATCH /api/v2/jobs/:id/complete | 3 | ✅ All pass |
| GET /api/v2/providers/available (HF-032) | 5 | ✅ All pass |
| GET /api/v2/jobs/feed?lat&lon (HF-032) | 1 | ✅ All pass |
| POST /api/v2/jobs/:id/media (HF-033) | 4 | ✅ All pass |
| PATCH /api/v2/jobs/:id/voice-note (HF-033) | 2 | ✅ All pass |

---

## Setup

```bash
# Start services
make up           # first time / after dependency changes
make start        # day-to-day

# Run migrations + seed
make migrate
make seed

# Seed accounts
Admin:    00000000000 / Admin@1234
Provider: 01711223344 / Provider@1234
Resident: 01811223344 / Resident@1234
```

---

## HF-031 — Job/Booking State Machine

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/jobs` | Resident | Create a job |
| GET | `/api/v2/jobs` | Resident | My jobs list |
| GET | `/api/v2/jobs/feed` | Provider | Available jobs by skill |
| GET | `/api/v2/jobs/:id` | Any (auth) | Job detail |
| PATCH | `/api/v2/jobs/:id/accept` | Provider | Accept → ACTIVE |
| PATCH | `/api/v2/jobs/:id/complete` | Provider | Mark done → AWAITING_PAYMENT |

### State Machine

```
PENDING → ACTIVE → AWAITING_PAYMENT
```
Any other transition returns `400 INVALID_STATE_TRANSITION`.

### Manual Test Cases

#### TC-031-01: Resident creates a standard job
```http
POST /api/v2/jobs
Authorization: Bearer <resident_token>
Content-Type: application/json

{
  "category_id": "<plumbing_category_id>",
  "description": "My kitchen sink is leaking, water is damaging the cabinet",
  "service_address": { "house": "12A", "road": "Mirpur Road", "area": "Mirpur-10" },
  "estimated_budget": 1500,
  "service_lat": 23.8103,
  "service_lon": 90.4125
}
```
**Expected:** `201` with `status: "pending"` and `resident_id` matching logged-in user.

---

#### TC-031-02: Painting job (requires_area) — with square_footage
```json
{
  "category_id": "<painting_category_id>",
  "description": "Need to paint 3 rooms, walls and ceiling",
  "service_address": { "house": "5B", "road": "Dhanmondi 27", "area": "Dhanmondi" },
  "square_footage": 650
}
```
**Expected:** `201`, `square_footage` present in response.

---

#### TC-031-03: Painting job — missing square_footage
Same as above but omit `square_footage`.  
**Expected:** `400`, `error_code: "SQUARE_FOOTAGE_REQUIRED"`.

---

#### TC-031-04: Provider accepts a job
```http
PATCH /api/v2/jobs/<job_id>/accept
Authorization: Bearer <provider_token>
```
**Pre-condition:** Provider must have Plumbing skill and be ACTIVE.  
**Expected:** `200`, `status: "active"`, `provider_id` set.

---

#### TC-031-05: Provider marks job complete
```http
PATCH /api/v2/jobs/<job_id>/complete
Authorization: Bearer <provider_token>
```
**Pre-condition:** Job must be ACTIVE and this provider must be assigned.  
**Expected:** `200`, `status: "awaiting_payment"`.

---

#### TC-031-06: Invalid state transition
Try to accept an already ACTIVE job.  
**Expected:** `400`, `error_code: "INVALID_STATE_TRANSITION"`.

---

#### TC-031-07: Provider without matching skill tries to accept
Log in as a provider who has no Plumbing skill, try to accept a plumbing job.  
**Expected:** `403`, `error_code: "PROVIDER_NOT_ELIGIBLE"`.

---

#### TC-031-08: Wrong role guard
Log in as resident, try `GET /api/v2/jobs/feed`.  
**Expected:** `403`.  
Log in as provider, try `POST /api/v2/jobs`.  
**Expected:** `403`.

---

## HF-032 — Location-Based Provider Search

### API Changes
- `GET /api/v2/providers/available` — now accepts `lat`, `lon`, `radius` (km, default 10), `category` query params
- `GET /api/v2/jobs/feed` — now accepts `lat`, `lon` query params to sort by distance

### Manual Test Cases

#### TC-032-01: Providers sorted by distance
```http
GET /api/v2/providers/available?lat=23.8103&lon=90.4125&radius=10
```
**Expected:** `200`, providers sorted nearest first (Dhaka providers appear before distant ones).

#### TC-032-02: No providers in search radius
```http
GET /api/v2/providers/available?lat=22.3569&lon=91.7832&radius=1
```
(Chittagong, 1km radius)  
**Expected:** `200`, empty array (all test providers are seeded in Dhaka).

#### TC-032-03: Filter by category
```http
GET /api/v2/providers/available?lat=23.8103&lon=90.4125&radius=10&category=<plumbing_id>
```
**Expected:** Only providers with Plumbing skill returned.

#### TC-032-04: Missing lon with lat
```http
GET /api/v2/providers/available?lat=23.8103
```
**Expected:** `400` — "lat and lon must both be provided or both omitted".

#### TC-032-05: Job feed geo-sorted
```http
GET /api/v2/jobs/feed?lat=23.8103&lon=90.4125
Authorization: Bearer <provider_token>
```
**Expected:** Jobs sorted by `service_location` distance. Jobs without lat/lon appear last.

---

## HF-033 — Job Media Storage

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/jobs/:id/media` | Resident (owner) | Upload photos/videos (max 10) |
| PATCH | `/api/v2/jobs/:id/voice-note` | Resident (owner) | Upload voice note |

### Manual Test Cases

#### TC-033-01: Upload photos to a job
```bash
curl -X POST http://localhost:3000/api/v2/jobs/<job_id>/media \
  -H "Authorization: Bearer <resident_token>" \
  -F "files=@/path/to/photo1.jpg" \
  -F "files=@/path/to/photo2.jpg"
```
**Expected:** `200`, `media_urls` array contains 2 new URLs. Files appear under `backend/uploads/`.

#### TC-033-02: Non-owner tries to upload
Log in as a different resident and try to upload to someone else's job.  
**Expected:** `403`, `error_code: "JOB_ACCESS_DENIED"`.

#### TC-033-03: No files attached
```bash
curl -X POST http://localhost:3000/api/v2/jobs/<job_id>/media \
  -H "Authorization: Bearer <resident_token>"
```
**Expected:** `400`.

#### TC-033-04: Upload voice note
```bash
curl -X PATCH http://localhost:3000/api/v2/jobs/<job_id>/voice-note \
  -H "Authorization: Bearer <resident_token>" \
  -F "file=@/path/to/voice.mp3"
```
**Expected:** `200`, `voice_note_url` set in job response.

#### TC-033-05: Exceed 10-file limit
If a job already has 8 photos, try to upload 4 more.  
**Expected:** `400` — "Cannot upload more than 10 media files per job (already has 8)".

---

## DB Migration Verification

After `make migrate`, confirm the jobs table:

```sql
\d jobs
```

Key checks:
- `service_location` column is a `GENERATED ALWAYS` geography column
- `idx_jobs_service_location` GiST index exists
- `idx_jobs_status`, `idx_jobs_resident_id`, `idx_jobs_provider_id`, `idx_jobs_category_id` indexes exist

---

## Error Code Reference

| Code | HTTP | Trigger |
|------|------|---------|
| `SQUARE_FOOTAGE_REQUIRED` | 400 | Job created for a `requires_area` category without `square_footage` |
| `INVALID_STATE_TRANSITION` | 400 | Attempted state change not in `JOB_STATUS_TRANSITIONS` |
| `PROVIDER_NOT_ELIGIBLE` | 403 | Provider missing skill or account not ACTIVE |
| `JOB_ACCESS_DENIED` | 403 | Provider/resident attempting action on a job they don't own |
| `RESOURCE_NOT_FOUND` | 404 | Job or category not found |
