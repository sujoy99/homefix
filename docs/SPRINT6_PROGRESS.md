# Sprint 6 — Reviews, Notifications, Real-time & In-App Communication — Progress Tracker

> **Backend Branch:** `feature/sprint-6-backend`
> **Mobile Branch:** `feature/sprint-6-mobile`
> **Last updated:** 2026-06-07
> **Tests:** 312/312 backend passing (51 new) · 246/246 mobile (HF-050: 15 + HF-051: 11 + HF-052: 17 + HF-053: 14 + HF-102: 49 + HF-103: 15 + pre-S6: 125) passing · **Sprint 6 COMPLETE ✅ (backend + mobile)**

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
| HF-051 | Push notification setup (expo-notifications, deep linking) | ✅ Done | — |
| HF-052 | Notification center (bell icon, badge, read/unread) | ✅ Done | — |
| HF-053 | Provider location tracking (background GPS) | ✅ Done | — |
| HF-102 | In-app chat screen (text/image/voice, WebSocket + poll fallback) | ✅ Done | — |
| HF-103 | In-app voice call (Jitsi via expo-web-browser) | ✅ Done | — |

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

### ✅ HF-051 — Push Notification Setup (expo-notifications, deep linking)

**Architecture:**
- `expo-notifications ~0.32` + `expo-device ~8.0` installed (added to `package.json`)
- `Notifications.setNotificationHandler({...})` called at module level in `app/_layout.tsx` — controls foreground notification display
- `notificationService` — `registerDeviceToken(token)` → POST `/v2/users/me/device-token`; `unregisterDeviceToken()` → DELETE same endpoint
- `usePushNotifications` hook (in `hooks/`) — requests permissions, gets native FCM token via `getDevicePushTokenAsync()`, registers with backend on every login, sets up `addNotificationResponseReceivedListener` for deep-link navigation
- Hook mounted in `app/(app)/_layout.tsx` — only runs when authenticated; re-runs on every login
- `authStore.logout()` calls `apiClient.delete('/v2/users/me/device-token')` directly (NOT via `notificationService`) to avoid `authStore → notificationService → apiClient → authStore` circular import
- Deep-link routing: `JOB_ACCEPTED`, `JOB_COMPLETED`, `PAYMENT_RECEIVED`, `NEW_MESSAGE` → all navigate to `/(app)/booking/job/${data.jobId}`
- Simulator guard: `Device.isDevice` checked before calling `getDevicePushTokenAsync()` — silently skips on simulators
- Cancelled guard: `if (finalStatus !== 'granted' || cancelled) return` before token fetch — prevents unmounted hook from polluting test mock counts

- [x] `expo-notifications ~0.32.17` + `expo-device ~8.0.10` added to `package.json` via `npx expo install`
- [x] `services/notification.service.ts` — `registerDeviceToken`, `unregisterDeviceToken`
- [x] `hooks/usePushNotifications.ts` — permissions, token, registration, deep-link listener, cleanup
- [x] `app/_layout.tsx` — `setNotificationHandler` at module level (all imports first)
- [x] `app/(app)/_layout.tsx` — `usePushNotifications()` call + `booking/job/review/[id]` Stack.Screen added
- [x] `store/authStore.ts` — `apiClient.delete('/v2/users/me/device-token')` in `logout()` (fire-and-forget)
- [x] `app.json` — `expo-notifications` plugin added
- [x] `tests/services/notification.service.test.ts` — 8 cases: register posts correct body, resolves void, 401/500 rejections; unregister sends DELETE, resolves void, 401/404 rejections
- [x] `tests/hooks/usePushNotifications.test.ts` — 7 cases: registers when granted, requests+registers, denied (no token call), non-device skip, tap→navigate, no jobId→no nav, unmount removes listener
- [x] All 151 mobile tests passing (0 regressions)

---

### ✅ HF-052 — Notification Center (bell icon, badge, read/unread)

**Architecture:**
- `notificationService.getNotifications(page, limit)` → GET `/v2/users/me/notifications?page=&limit=`; returns `{ items, pagination, unread_count }`
- `notificationService.markAsRead(id)` → PATCH `/v2/users/me/notifications/:id/read`; returns updated notification
- `useNotificationStore` (Zustand, no persist) — `notifications[]`, `unreadCount`, `page`, `hasMore`, `loading`, `fetchNotifications(reset?)`, `markAsRead(id)`
- `app/(app)/(tabs)/notifications.tsx` — FlatList with pull-to-refresh, "load more" footer, relative timestamps, unread dot + highlight
- Bell tab in `tabs/_layout.tsx` — hidden for admin, shows red badge with count when `unreadCount > 0`
- Tap notification: marks as read, navigates to `/(app)/booking/job/:id` if `data.jobId` present
- `AppNotification` + `NotificationListResult` types exported from `notification.service.ts`
- `relativeTime()` helper: just now / Xm ago / Xh ago / Xd ago

- [x] `services/notification.service.ts` — `getNotifications`, `markAsRead`, `AppNotification`, `NotificationListResult` types
- [x] `store/notificationStore.ts` — Zustand, `fetchNotifications` (reset/append), `markAsRead` with optimistic unreadCount decrement
- [x] `app/(app)/(tabs)/notifications.tsx` — list screen with relative time, unread UI, load more, pull-to-refresh
- [x] `app/(app)/(tabs)/_layout.tsx` — Bell tab + red badge; tab hidden for admin role
- [x] `i18n/locales/en.json` + `i18n/locales/bn.json` — `notifications` section (13 keys each)
- [x] `tests/services/notification.service.test.ts` — 7 new cases: getNotifications (default params, custom params, response shape, 401); markAsRead (PATCH URL, returns updated, 404)
- [x] `tests/store/notificationStore.test.ts` — 10 cases: initial state, fetch sets data, reset clears, append load-more, hasMore false, loading resets on error, skip during loading, markAsRead replaces item, decrements unread, no-op when already read
- [x] All 168 mobile tests passing (17 new, 0 regressions)

---

### ✅ HF-053 — Provider Location Tracking (Background GPS)

**Architecture:**
- `locationService.updateMyLocation(lat, lon)` → `PUT /v2/providers/me/location`
- `locationService.getProviderLocation(jobId)` → `GET /v2/jobs/:id/provider-location` → `{ latitude, longitude }`
- `useLocationTracking(enabled)` hook — uses `expo-location`'s `watchPositionAsync` (foreground) with 15 s / 20 m thresholds; requests foreground permissions on first run; stops automatically on unmount or when `enabled` toggles off
- Hook mounted in job detail screen: `useLocationTracking(isProvider && job.status === ACTIVE && job.provider_id === userId)` — fires before early returns so hook rules are respected
- Resident location card: `useQuery(['provider-location', id], ..., { refetchInterval: 15_000, retry: false })` — shows `lat/lon` coordinates when available, "Waiting..." otherwise; only rendered when `isResident && isActive`
- 4 i18n keys added to `location_tracking` namespace (en + bn)

- [x] `services/location.service.ts` — `updateMyLocation`, `getProviderLocation`, `ProviderLocation` type
- [x] `hooks/useLocationTracking.ts` — foreground GPS watcher, permission request, 15 s throttle, cleanup on unmount
- [x] `app/(app)/booking/job/[id].tsx` — `useLocationTracking` hook call + resident location card with polling
- [x] `i18n/locales/en.json` + `i18n/locales/bn.json` — `location_tracking` section (4 keys each)
- [x] `tests/services/location.service.test.ts` — 8 cases: updateMyLocation (PUT body, resolves void, 401, 403); getProviderLocation (GET URL, response shape, 403, 404)
- [x] `tests/hooks/useLocationTracking.test.ts` — 6 cases: disabled no-op, starts when granted, requests+starts, denied no watch, calls updateMyLocation on position, removes watcher on unmount
- [x] All 182/182 mobile tests passing (14 new, 0 regressions)

---

### ✅ HF-103 — In-App Voice Call (Jitsi via expo-web-browser)

**Architecture:**
- `services/call.service.ts` — `createRoom(jobId)` → `POST /v2/jobs/:id/call/room`; `buildCallUrl(config)` → constructs Jitsi URL (`${serverUrl}/${roomName}?jwt=${token}`, falls back to `meet.jit.si`)
- `hooks/useVoiceCall.ts` — `startCall()` + `isCallLoading` state; calls `createRoom`, builds URL, opens via `expo-web-browser` (`openBrowserAsync`); shows error toast on any failure
- `app/(app)/booking/job/[id].tsx` — phone icon (`Phone` from lucide) in header alongside chat icon; both visible when job is ACTIVE and user is a participant; `isCallLoading` dims the icon and disables the press
- `expo-web-browser` used instead of `@jitsi/react-native-sdk` — native SDK incompatible with Expo managed workflow; in-app browser provides equivalent UX and returns to app after call
- Backend `RoomConfig.provider` field preserved for future SDK selection at runtime (Phase 2 Agora)
- No DB migration — purely frontend + API consumption

**Test coverage (15 tests):**
- `tests/services/call.service.test.ts` — 8 cases: `createRoom` (correct URL, returns body, rejects); `buildCallUrl` (serverUrl+no token, serverUrl+token, fallback to meet.jit.si, fallback+token, agora provider)
- `tests/hooks/useVoiceCall.test.ts` — 7 cases: initial `isCallLoading` false; `startCall` calls `createRoom` with jobId; calls `buildCallUrl` with config; opens browser with built URL; `isCallLoading` true-in-flight/false-after; error toast + reset on `createRoom` throw; error toast + reset on `openBrowserAsync` throw

- [x] `expo-web-browser` installed (`npx expo install expo-web-browser`)
- [x] `mobile/services/call.service.ts` — `createRoom`, `buildCallUrl`, `RoomConfig` type
- [x] `mobile/hooks/useVoiceCall.ts` — `startCall`, `isCallLoading`
- [x] `mobile/app/(app)/booking/job/[id].tsx` — `Phone` icon in header + `useVoiceCall` wired
- [x] `mobile/i18n/locales/en.json` + `bn.json` — `call` namespace (3 keys each)
- [x] All 15 tests passing (0 regressions)
- [x] 246/246 total mobile tests passing

---

### ✅ HF-102 — In-App Chat Screen (text + image + voice)

**Architecture:**
- `services/message.service.ts` — `list(jobId, before?)`, `send(jobId, content, type)`, `uploadImage(asset)`; `MessageType = 'text' | 'image' | 'audio'`
- `hooks/useChat.ts` — Socket.IO real-time (`io(SERVER_ROOT, { path: '/socket.io', transports: ['websocket'] })`); 3-second timeout before polling fallback kicks in; deduplicates messages by id; exposes `sendText`, `sendImage`, `sendAudio`, `loadMore`, `refresh`, `isConnected`
- `app/(app)/booking/job/chat/[id].tsx` — inverted FlatList (newest at bottom); `RecordMode = 'idle' | 'recording' | 'uploading'`; `AudioBubble` inline component with expo-av playback (play/pause, progress bar); header shows Wifi/WifiOff connection indicator
- `app/(app)/booking/job/[id].tsx` — chat icon in header (`MessageCircle`) when job is ACTIVE and user is a participant
- Audio upload reuses `messageService.uploadImage` with synthetic asset `{ uri, fileName, mimeType }`
- Backend: `message.types.ts` + `message.schema.ts` extended with `'audio'` type — no DB migration (varchar(20), no CHECK constraint)
- Voice note UX: compact inline recorder (not full VoiceRecorder component) — mic button in input bar → timer/pulse dot → stop-and-send or cancel

**Test coverage (49 tests):**
- `tests/services/message.service.test.ts` — 9 cases: list (default limit, cursor, next_cursor); send (text/image/audio, full object return); uploadImage (multipart post, url return, mime fallback)
- `tests/hooks/useChat.test.ts` — 14 cases: initial load, messages, hasMore; socket connect/disconnect/message/dedup; sendText/sendImage/sendAudio; loadMore (with cursor, no-op); cleanup (leave_job + disconnect)
- `tests/screens/chat.test.tsx` — 26 cases: loading/empty states, header; connection indicator; text/image/audio/load-more bubbles; text input send flow; image attach (open picker, upload, cancel, permission denied); voice recording (start→show stop/cancel, permission denied, cancel→idle, stop→upload+sendAudio→idle)

- [x] `backend/src/modules/messages/message.types.ts` — `'audio'` added to `MessageType`
- [x] `backend/src/modules/messages/message.schema.ts` — Zod enum extended to `['text', 'image', 'audio']`
- [x] `mobile/services/message.service.ts` — `list`, `send`, `uploadImage`, `MessageType`, `Message`, `MessageListResult`
- [x] `mobile/hooks/useChat.ts` — Socket.IO + polling fallback, `sendText`, `sendImage`, `sendAudio`, `loadMore`
- [x] `mobile/app/(app)/booking/job/chat/[id].tsx` — full chat screen + AudioBubble
- [x] `mobile/app/(app)/booking/job/[id].tsx` — chat icon in header
- [x] `mobile/i18n/locales/en.json` + `bn.json` — `chat` namespace (17 keys each)
- [x] All 49 mobile tests passing (0 regressions)

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
