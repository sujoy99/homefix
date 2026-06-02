# Sprint 6 Backend — Manual & Automated Test Guide

**Sprint:** Sprint 6 — Reviews, Notifications, Real-time & In-App Communication  
**Tickets:** HF-047 · HF-048 · HF-049 · HF-100 · HF-101  
**Branch:** `feature/sprint-6-backend`  
**Last Updated:** 2026-06-03

---

## Automated Test Results

**Run command (inside Docker):**
```bash
docker exec homefix_backend npm test -- --runInBand
```

Or locally if node_modules are in sync:
```bash
cd backend && npm test -- --forceExit
```

**Result: 312/312 PASSED ✅** (22 suites)

> **Known intermittent:** `storage.test.ts` occasionally fails when run as part of the full suite due to a pre-existing multer cross-contamination issue. It **always passes in isolation** (`--testPathPattern=storage`). Not caused by Sprint 6 code — do not attempt to fix.

| Test Suite | Tests | Status |
|---|---|---|
| `auth.test.ts` | 18 | ✅ |
| `rbac.test.ts` | 7 | ✅ |
| `categories.test.ts` | 8 | ✅ |
| `users.test.ts` | (count) | ✅ |
| `providers.test.ts` | 13 | ✅ |
| `admin/provider-approval.test.ts` | 10 | ✅ |
| `jobs.test.ts` | 27 | ✅ |
| `storage.test.ts` | 8 | ✅ (intermittent in full suite) |
| `payment.schema.test.ts` | 6 | ✅ |
| `manual.gateway.test.ts` | 8 | ✅ |
| `payment.service.test.ts` | 5 | ✅ |
| `commission.service.test.ts` | 7 | ✅ |
| `commission.rules.test.ts` | 17 | ✅ |
| `payment.submit.test.ts` | 12 | ✅ |
| `payment.verify.test.ts` | 12 | ✅ |
| `wallet.test.ts` | 31 | ✅ |
| `revenue.test.ts` | 17 | ✅ |
| `profile-completion.test.ts` | 14 | ✅ |
| **`review.test.ts`** | **13** | ✅ **new (HF-047)** |
| **`notification.test.ts`** | **13** | ✅ **new (HF-048)** |
| **`messages.test.ts`** | **16** | ✅ **new (HF-100)** |
| **`calls.test.ts`** | **9** | ✅ **new (HF-101)** |

---

## Setup

```bash
make up        # first time / after dependency changes
make start     # day-to-day
make migrate
make seed

# Seed accounts
Admin:    00000000000 / Admin@1234
Provider: 01711223344 / Provider@1234
Resident: 01811223344 / Resident@1234
```

---

## HF-047 — Review & Rating Module

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/jobs/:jobId/review` | Resident | Submit star rating + optional comment. Job must be PAID. One per job. |
| GET | `/api/v2/providers/:providerId/reviews` | Public | Paginated list of provider reviews. |

### Manual Test Cases

#### TC-047-01: Resident submits review for a PAID job
```http
POST /api/v2/jobs/<paid_job_id>/review
Authorization: Bearer <resident_token>
Content-Type: application/json

{ "rating": 5, "comment": "Excellent work, very professional!" }
```
**Expected:** `201`, review created. Provider's `avg_rating` and `review_count` updated.

---

#### TC-047-02: Job not PAID → 400
Submit review for an `ACTIVE` or `AWAITING_PAYMENT` job.  
**Expected:** `400`, `error_code: "REVIEW_NOT_ALLOWED"`.

---

#### TC-047-03: Resident doesn't own job → 403
Submit review as a different resident than the job owner.  
**Expected:** `403`.

---

#### TC-047-04: Duplicate review → 409
Submit a second review for the same job.  
**Expected:** `409`, `error_code: "REVIEW_ALREADY_EXISTS"`.

---

#### TC-047-05: Rating out of range → 400
```json
{ "rating": 6 }
```
**Expected:** `400`, Zod validation error.

---

#### TC-047-06: Provider tries to submit review → 403
**Expected:** `403`.

---

#### TC-047-07: List provider reviews (public)
```http
GET /api/v2/providers/<provider_id>/reviews?page=1&limit=10
```
**Expected:** `200`, `{ items: [...], pagination: { page, limit, total, totalPages } }`.

---

#### DB Verification
```sql
SELECT avg_rating, review_count FROM users WHERE id = '<provider_id>';
-- After 1 review of rating=5: avg_rating=5.0, review_count=1
-- After 2nd review of rating=3: avg_rating=4.0, review_count=2

SELECT * FROM reviews WHERE job_id = '<job_id>';
```

---

## HF-048 — Push Notification Service (FCM)

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/users/me/device-token` | Any (auth) | Register FCM device token |
| DELETE | `/api/v2/users/me/device-token` | Any (auth) | Unregister device token |
| GET | `/api/v2/users/me/notifications` | Any (auth) | Paginated notification list + unread_count |
| PATCH | `/api/v2/users/me/notifications/:id/read` | Any (auth) | Mark notification as read |

### Manual Test Cases

#### TC-048-01: Register device token
```http
POST /api/v2/users/me/device-token
Authorization: Bearer <any_token>
Content-Type: application/json

{ "token": "fcm-test-token-abc123", "platform": "android" }
```
**Expected:** `200`. Row upserted in `device_tokens`.

---

#### TC-048-02: Notification created when provider accepts job
Accept a job as provider. Then:
```http
GET /api/v2/users/me/notifications
Authorization: Bearer <resident_token>
```
**Expected:** `200`, notification with `type: "JOB_ACCEPTED"` in list. `unread_count >= 1`.

---

#### TC-048-03: Mark notification as read
```http
PATCH /api/v2/users/me/notifications/<notification_id>/read
Authorization: Bearer <resident_token>
```
**Expected:** `200`. `is_read: true`. `unread_count` decrements on next GET.

---

#### TC-048-04: FCM config absent → stub (no crash)
When `FCM_SERVICE_ACCOUNT_JSON` is not set (development), the stub provider logs but does not throw. All DB operations still complete.

---

#### Notification Triggers

| Event | Recipient | Type |
|-------|-----------|------|
| Provider accepts job | Resident | `JOB_ACCEPTED` |
| Provider marks work done | Resident | `JOB_COMPLETED` |
| Admin verifies payment | Provider | `PAYMENT_RECEIVED` |
| Resident sends message | Provider | `NEW_MESSAGE` |
| Provider sends message | Resident | `NEW_MESSAGE` |

---

## HF-049 — Provider Background GPS Tracking

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| PUT | `/api/v2/providers/me/location` | Provider | Update provider's current GPS location |
| GET | `/api/v2/jobs/:id/provider-location` | Resident | Fetch provider's current location for an ACTIVE job |

### Manual Test Cases

#### TC-049-01: Provider updates location
```http
PUT /api/v2/providers/me/location
Authorization: Bearer <provider_token>
Content-Type: application/json

{ "latitude": 23.8103, "longitude": 90.4125 }
```
**Expected:** `200`. `users.area` PostGIS point updated.

---

#### TC-049-02: Resident tracks provider for active job
```http
GET /api/v2/jobs/<active_job_id>/provider-location
Authorization: Bearer <resident_token>
```
**Expected:** `200`, `{ latitude: 23.8103, longitude: 90.4125 }`.

---

#### TC-049-03: Provider hasn't pinged yet → 404
Before the provider calls PUT /location on an active job.  
**Expected:** `404`.

---

#### TC-049-04: Resident tries to update location → 403
```http
PUT /api/v2/providers/me/location
Authorization: Bearer <resident_token>
```
**Expected:** `403`.

---

#### TC-049-05: Job not ACTIVE → 400
GET provider-location for a PENDING job.  
**Expected:** `400`.

---

## HF-100 — In-App Job Messaging

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/jobs/:id/messages` | Resident or assigned Provider | Send message. Job must be ACTIVE. |
| GET | `/api/v2/jobs/:id/messages` | Resident or assigned Provider | List messages, cursor-paginated (newest first). |

### Manual Test Cases

#### TC-100-01: Resident sends a message
```http
POST /api/v2/jobs/<active_job_id>/messages
Authorization: Bearer <resident_token>
Content-Type: application/json

{ "content": "Will you be there by 10am?", "type": "text" }
```
**Expected:** `201`, `{ id, job_id, sender_id, content, type, created_at }`.

---

#### TC-100-02: Provider sends a message
Same endpoint with `<provider_token>`.  
**Expected:** `201`.

---

#### TC-100-03: Non-participant → 403
Send message as a different resident or a non-assigned provider.  
**Expected:** `403`, `error_code: "JOB_ACCESS_DENIED"`.

---

#### TC-100-04: Job not ACTIVE → 400
Send message to a PENDING or AWAITING_PAYMENT job.  
**Expected:** `400`, `error_code: "MESSAGING_NOT_AVAILABLE"`.

---

#### TC-100-05: Empty content → 400
```json
{ "content": "" }
```
**Expected:** `400`, Zod validation error.

---

#### TC-100-06: List messages (descending, newest first)
```http
GET /api/v2/jobs/<active_job_id>/messages?limit=20
Authorization: Bearer <resident_token>
```
**Expected:** `200`, `{ items: [...], next_cursor: null|"<uuid>" }`. Items ordered newest first.

---

#### TC-100-07: Cursor pagination
1. Send 10 messages, call GET with `limit=5` → get first 5 + `next_cursor`.
2. Call GET with `limit=5&before=<next_cursor>` → get next 5.
3. `next_cursor` is `null` on last page.

---

#### Socket.IO (manual integration test)
Connect two browser tabs to `ws://localhost:4000` with Socket.IO client. Both emit `join_job` with the same job ID. Send a message via REST — both tabs should receive the `message` event in real time.

---

## HF-101 — Pluggable VoIP Call Service (Jitsi Phase 1)

### API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/v2/jobs/:id/call/room` | Resident or assigned Provider | Create/get call room config. Job must be ACTIVE. |

### Manual Test Cases

#### TC-101-01: Resident creates call room for active job
```http
POST /api/v2/jobs/<active_job_id>/call/room
Authorization: Bearer <resident_token>
```
**Expected:** `201`:
```json
{
  "provider": "jitsi",
  "roomName": "homefix-job-<job_id>",
  "serverUrl": "https://meet.jit.si"
}
```
Token field absent (no `JITSI_APP_SECRET` set in dev).

---

#### TC-101-02: Provider creates call room — same room name (idempotent)
```http
POST /api/v2/jobs/<active_job_id>/call/room
Authorization: Bearer <provider_token>
```
**Expected:** `201`, same `roomName` as TC-101-01.

---

#### TC-101-03: Calling twice returns the same room
Two requests from the same user → identical `roomName` and `serverUrl`.  
**Expected:** Idempotent — no state created on backend.

---

#### TC-101-04: Job not ACTIVE → 400
```http
POST /api/v2/jobs/<pending_job_id>/call/room
Authorization: Bearer <resident_token>
```
**Expected:** `400`, `error_code: "CALL_NOT_AVAILABLE"`.

---

#### TC-101-05: Non-participant → 403
**Expected:** `403`, `error_code: "JOB_ACCESS_DENIED"`.

---

#### TC-101-06: With JWT auth enabled (production)
Set env vars:
```env
JITSI_SERVER_URL=https://meet.yourserver.com
JITSI_APP_ID=homefix
JITSI_APP_SECRET=your-secret
```
**Expected:** Response includes `token` field (JWT). Decode it:
```bash
# Decode (without verification) — check payload
echo "<token>" | cut -d. -f2 | base64 -d 2>/dev/null | python3 -m json.tool
```
JWT payload should contain:
```json
{
  "context": { "user": { "id": "<user_id>" } },
  "aud": "jitsi",
  "iss": "homefix",
  "sub": "meet.yourserver.com",
  "room": "homefix-job-<job_id>",
  "exp": <2 hours from now>
}
```

---

#### TC-101-07: Join the call (end-to-end)
1. Both resident and provider call `POST /call/room` → same `roomName`.
2. Open `https://meet.jit.si/homefix-job-<job_id>` in two browser tabs.
3. Audio/video call established — backend not in media path.

---

## Production Jitsi Setup

See `docs/brd/VOIP_CALLS.md` for the full self-hosted Jitsi deployment guide.

**Quick summary:**
- Install Jitsi on a Ubuntu 22.04 VPS (2+ vCPU, 4 GB RAM minimum for voice-only)
- Enable JWT auth: set `JITSI_APP_ID` + `JITSI_APP_SECRET` matching your `jitsi.conf`
- Point `JITSI_SERVER_URL` at your server
- For high traffic: add JVB nodes behind a load balancer (Jitsi Octo cascade)

---

## Error Code Reference (Sprint 6 Backend)

| Code | HTTP | Trigger |
|------|------|---------|
| `REVIEW_NOT_ALLOWED` | 400 | Job not in PAID status |
| `REVIEW_ALREADY_EXISTS` | 409 | Second review for same job |
| `NOTIFICATION_NOT_FOUND` | 404 | Notification ID not found or belongs to different user |
| `MESSAGING_NOT_AVAILABLE` | 400 | Job not ACTIVE (send or list messages) |
| `CALL_NOT_AVAILABLE` | 400 | Job not ACTIVE (create call room) |
| `JOB_ACCESS_DENIED` | 403 | Caller is not a job participant (messaging or calls) |
