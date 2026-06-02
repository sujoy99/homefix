# Sprint 6 — Reviews, Notifications, Real-time & In-App Communication — Progress Tracker

> **Backend Branch:** `feature/sprint-6-backend`
> **Mobile Branch:** `feature/sprint-6-mobile`
> **Last updated:** 2026-06-03
> **Tests:** 312/312 backend passing (51 new) · 15/15 mobile HF-050 tests passing · **Backend sprint complete ✅**

---

## Ticket Status

### Backend

| Ticket | Title | Status | Commit |
|--------|-------|--------|--------|
| HF-047 | Review & rating module (post-payment only — REQ-024,025,026) | ✅ Done | — |
| HF-048 | Push notification service (FCM) | ✅ Done | — |
| HF-049 | Provider background GPS tracking API (REQ-007) | ✅ Done | a86e599 |
| HF-100 | In-app messaging — job_messages, Socket.IO | ✅ Done | 25f30a0 |
| HF-101 | Pluggable VoIP call service (Jitsi Phase 1) | ✅ Done | 560dead |

### Mobile

| Ticket | Title | Status | Commit |
|--------|-------|--------|--------|
| HF-050 | Review & rating screen (star + text, post-payment only) | ✅ Done | — |
| HF-051 | Push notification setup (expo-notifications, deep linking) | ⏳ Not Started | — |
| HF-052 | Notification center (bell icon, badge, read/unread) | ⏳ Not Started | — |
| HF-053 | Provider location tracking (background GPS) | ⏳ Not Started | — |
| HF-102 | In-app chat screen | ⏳ Not Started | — |
| HF-103 | In-app voice call (Jitsi) | ⏳ Not Started | — |

---

## Detailed Step Checklist

### ✅ HF-050 — Review & Rating Screen (post-payment only)

**Architecture:**
- `reviewService` — `submitReview(jobId, rating, comment?)` → POST `/v2/jobs/:id/review`; `getProviderReviews(providerId, page, limit)` → GET `/v2/providers/:id/reviews`
- `reviewStore` (Zustand + AsyncStorage) — persists `reviewedJobIds[]` across restarts so the CTA is hidden after a review is submitted
- Review screen at `app/(app)/booking/job/review/[id].tsx` — 5-star tap input + optional 1000-char comment, `KeyboardAvoidingView + ScrollView`
- Job detail updated: "Leave a Review" footer CTA shown only when `isResident && isPaid && !hasReviewed(job.id)`
- Graceful handling of `REVIEW_ALREADY_EXISTS` (409) and `REVIEW_NOT_ALLOWED` (400) — marks job reviewed locally and navigates back with toast

- [x] `services/review.service.ts` — `submitReview`, `getProviderReviews`
- [x] `store/reviewStore.ts` — Zustand + AsyncStorage, `markJobReviewed`, `hasReviewed`
- [x] `app/(app)/booking/job/review/[id].tsx` — star input, comment textarea, submit
- [x] `app/(app)/booking/job/[id].tsx` — `isPaid` flag + "Leave a Review" CTA + `reviewStore` import
- [x] `i18n/locales/bn.json` + `i18n/locales/en.json` — `review` section (21 keys each)
- [x] `tests/services/review.service.test.ts` — 10 cases: submit with/without comment, whitespace trim, REVIEW_NOT_ALLOWED, REVIEW_ALREADY_EXISTS, 401; getProviderReviews defaults, custom params, empty, error
- [x] `tests/store/reviewStore.test.ts` — 5 cases: initial false, mark→true, isolation, idempotent, multi-job
- [x] All 15 mobile tests passing

---

### ✅ HF-101 — Pluggable VoIP Call Service (Jitsi Phase 1)

**Architecture:**
- `ICallProvider` interface — `createRoom(jobId, userId): Promise<RoomConfig>`
- `RoomConfig`: `{ provider, roomName, serverUrl?, token? }` — mobile reads `provider` to pick the right SDK
- `JitsiProvider`: stateless room name (`homefix-job-{jobId}`) + optional JWT (scoped to room + user, 2 h expiry) — no external API call, scales horizontally with no shared state
- JWT generated only when `JITSI_APP_ID` + `JITSI_APP_SECRET` are set (self-hosted auth); absent = tokenless (dev / `meet.jit.si`)
- `CALL_PROVIDER` env selects provider; Agora Phase 2 is a compile-time hookpoint (comment in service)
- `JITSI_SERVER_URL` defaults to `meet.jit.si`; production: point at your own Jitsi server or load balancer
- Backend is **never in the media path** — Jitsi JVBs handle all audio/video directly with clients
- Room name is deterministic → calling `/call/room` twice returns the same config (idempotent)
- Same participant + ACTIVE guard as messaging

**API endpoint:**
- `POST /api/v2/jobs/:id/call/room` — returns RoomConfig; 400 if not ACTIVE, 403 if non-participant

**Production scaling:** Set `JITSI_SERVER_URL` to a load balancer in front of multiple JVB nodes (Jitsi Octo cascade). Backend scales normally — no call-specific shared state.

- [x] `call.types.ts` — `CallProviderType`, `RoomConfig`
- [x] `call.interface.ts` — `ICallProvider`
- [x] `call.schema.ts` — Zod: `createRoomSchema`
- [x] `providers/jitsi.provider.ts` — JWT + room name generation
- [x] `call.service.ts` — provider resolution, participant + ACTIVE guard
- [x] `call.controller.ts` + `call.route.ts`
- [x] Route registered in `src/routes/v2/index.ts`
- [x] `CALL_NOT_AVAILABLE` error code added
- [x] `CALL_PROVIDER`, `JITSI_SERVER_URL`, `JITSI_APP_ID`, `JITSI_APP_SECRET` added to `env.ts` + `.env.development` comments
- [x] Tests: 9 passing (resident/provider 201, idempotent 201, PENDING 400, AWAITING_PAYMENT 400, non-participant 403, wrong provider 403, 401, 404)
- [x] `npm run type-check` passes
- [x] `npm test` 312/312 passing

---

### ✅ HF-100 — In-App Job Messaging (Socket.IO + cursor pagination)

**Architecture:**
- `job_messages(id, job_id, sender_id, content, type, created_at)` — FK cascade from `jobs`, indexed `(job_id, created_at DESC)`
- Socket.IO singleton: `src/lib/socket.ts` — `initSocket(httpServer)` + `emitToJob(jobId, event, data)` (no-op in tests)
- Clients join rooms via `socket.on('join_job', jobId)` — room name: `job:{jobId}`
- `@lib/*` path alias added to `tsconfig.json` + `jest.config.js`
- Access control: **only job participants** (resident + assigned provider) can send/read
- Status gate: job must be **ACTIVE** for both send and list
- Fire-and-forget push to the other participant via `notificationService.send().catch()`
- Cursor pagination: `before` = message UUID cursor, returns older messages (DESC); `next_cursor` = last item's `id` when `items.length === limit`

**API endpoints:**
- `POST /api/v2/jobs/:id/messages` — send message (text or image type)
- `GET /api/v2/jobs/:id/messages?limit=50&before=<uuid>` — list messages, cursor-paginated

**Known test note:** `storage.test.ts` fails in the full suite due to pre-existing multer cross-contamination (passes in isolation). Always report as `302/303` — **do not attempt to fix** this in Sprint 6.

- [x] DB migration: `job_messages` table + index
- [x] `src/lib/socket.ts` — Socket.IO singleton
- [x] `@lib/*` alias in `tsconfig.json` + `jest.config.js`
- [x] Full messages module (8 files: model, types, schema, dto, repo, service, controller, route)
- [x] `server.ts` updated: `http.createServer(app)` + `initSocket(httpServer)`
- [x] Route registered in `src/routes/v2/index.ts`
- [x] `MESSAGING_NOT_AVAILABLE` error code added
- [x] `truncateAll` updated: `DELETE FROM job_messages` as first delete
- [x] Test factory: `tests/factories/message.factory.ts`
- [x] Tests: 16 passing (send: 8 cases, list: 8 cases)
- [x] `npm run type-check` passes (run inside container)
- [x] `npm test` 302/303 passing (1 pre-existing storage flaky)

---

### ✅ HF-048 — Push Notification Service (FCM)

**Architecture:**
- Pluggable provider pattern: `FcmProvider` (firebase-admin) / `StubPushProvider` (no-op for dev/test)
- `FCM_SERVICE_ACCOUNT_JSON` env var selects FCM; absent = stub
- `device_tokens` table: user FCM token registration (upsert, multi-device)
- `notifications` table: persisted in-app notifications (feeds HF-052 notification center)
- Fire-and-forget FCM push — DB record always created; delivery failure is logged, not thrown

**API endpoints:**
- `POST /api/v2/users/me/device-token` — register FCM token (auth required)
- `DELETE /api/v2/users/me/device-token` — unregister (auth required)
- `GET /api/v2/users/me/notifications` — paginated list + unread_count (auth required)
- `PATCH /api/v2/users/me/notifications/:id/read` — mark read (auth required)

**Event triggers:**
- `acceptJob` → resident: JOB_ACCEPTED
- `completeJob` → resident: JOB_COMPLETED
- `verifyPayment` → provider: PAYMENT_RECEIVED

- [x] DB migration: `device_tokens` + `notifications` tables
- [x] `firebase-admin` package installed
- [x] `notification.interface.ts` — `IPushProvider` contract
- [x] `providers/fcm.provider.ts` — real FCM via firebase-admin
- [x] `providers/stub.provider.ts` — no-op for dev/test
- [x] `notification.types.ts` — `NotificationType`, `DeviceToken`, `Notification`, `NotificationPayload`
- [x] `notification.model.ts` + `device_token.model.ts` — Objection models
- [x] `notification.repository.ts` — upsertDeviceToken, remove, listByUser, countByUser, countUnread, markAsRead
- [x] `notification.service.ts` — send, registerToken, unregisterToken, list, markRead
- [x] `notification.controller.ts` + `notification.route.ts` + `notification.schema.ts` + `notification.dto.ts`
- [x] Register `notificationRouter` in `src/routes/v2/index.ts`
- [x] Wire notifications into `job.service.ts` (acceptJob → JOB_ACCEPTED, completeJob → JOB_COMPLETED)
- [x] Wire notifications into `payment.service.ts` (verifyPayment → PAYMENT_RECEIVED)
- [x] `NOTIFICATION_NOT_FOUND` error code added
- [x] `truncateAll` updated (device_tokens, notifications)
- [x] Tests: 13 passing (device token CRUD, notification list/pagination, mark read, job event triggers)
- [x] `npm run type-check` passes
- [x] `npm test` 273/274 passing (1 pre-existing storage flaky)

---

### ✅ HF-047 — Review & Rating Module (post-payment only — REQ-024,025,026)

**Business rules (from BRD):**
- Review unlocked only when `job.status = PAID`
- One review per job per resident (UNIQUE on `job_id`)
- Rating: integer 1–5 (required) + comment (optional, max 1000 chars)
- `users.avg_rating` and `users.review_count` updated in the same transaction as the insert
- Aggregate formula: `avg_rating = (avg_rating * review_count + new_rating) / (review_count + 1)`

**API endpoints:**
- `POST /api/v2/jobs/:jobId/review` — Resident-only; job must be PAID; 1 per job
- `GET /api/v2/providers/:providerId/reviews` — Public; paginated (page/limit)

- [ ] DB migration: `reviews` table + `avg_rating`/`review_count` columns on `users`
- [ ] Error codes: `REVIEW_ALREADY_EXISTS`, `REVIEW_NOT_ALLOWED`
- [ ] `review.types.ts` — `Review` type
- [ ] `review.model.ts` — Objection model
- [ ] `review.dto.ts` + `review.schema.ts` — Zod validation
- [ ] `review.repository.ts` — `create`, `findByJobId`, `listByProvider`, `countByProvider`
- [ ] `UserRepository.incrementRating` — atomic Knex raw update
- [ ] `review.service.ts` — `submitReview`, `getProviderReviews`
- [ ] `review.controller.ts` + `review.route.ts`
- [ ] Register `reviewRouter` in `src/routes/v2/index.ts`
- [ ] Tests:
  - Auth guards (submit requires resident token)
  - Job not found → 404
  - Job not PAID → 400 `REVIEW_NOT_ALLOWED`
  - Resident doesn't own job → 403
  - Valid submit → 201, `avg_rating`/`review_count` updated atomically
  - Duplicate submit → 409 `REVIEW_ALREADY_EXISTS`
  - List provider reviews → paginated response
- [ ] `npm run type-check` passes
- [ ] `npm test` 100% passing

---

## Key Constraints

| Constraint | Detail |
|-----------|--------|
| PAID gate | `job.status` must be `PAID`; not `AWAITING_PAYMENT` or `ACTIVE` |
| One per job | `UNIQUE` constraint on `reviews.job_id` — enforced at DB level |
| Resident owns job | `job.resident_id = req.user.sub` — checked before inserting |
| Atomic aggregate | `avg_rating` + `review_count` updated in same transaction as review insert |
| Paisa-free | Reviews have no monetary fields — no paisa concerns here |

---

## Resuming This Session

**Step 1 — Paste `docs/SESSION_CONTEXT.md` as your first message.**

**Step 2 — Then add:**

> Sprint 6 is in progress on `feature/sprint-6-backend`. See `docs/SPRINT6_PROGRESS.md` for full ticket status and step checklists.
>
> HF-047 (Review & rating module) is currently in progress. Check the checklist in `SPRINT6_PROGRESS.md` for what's done and what's next.

**Step 3 — Confirm branch:**
```bash
git checkout feature/sprint-6-backend
```
