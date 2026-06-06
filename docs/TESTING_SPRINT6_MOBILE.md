# HomeFix — Sprint 6 Mobile Test Report

> **Sprint:** Sprint 6 — Reviews, Notifications, Real-time & In-App Communication (Mobile)
> **Date:** 2026-06-06
> **Branch:** `feature/sprint-6-mobile`
> **Platform:** Mobile (Expo SDK 54 · React Native · Jest + RNTL)

---

## Automated Test Results

```
Test Suites: 26 passed, 26 total
Tests:       246 passed, 246 total
Snapshots:   0 total
```

### Run command

```bash
cd mobile
npm test -- --no-coverage        # full suite
# OR run an individual suite:
npm test -- --testPathPattern="tests/services/call.service" --no-coverage
npm test -- --testPathPattern="tests/hooks/useVoiceCall" --no-coverage
npm test -- --testPathPattern="tests/screens/chat" --no-coverage
```

### Suite breakdown

| Suite | File | Tests | Ticket | Result |
|-------|------|-------|--------|--------|
| Review service | `tests/services/review.service.test.ts` | **10** | HF-050 | ✅ Pass |
| Review store | `tests/store/reviewStore.test.ts` | **5** | HF-050 | ✅ Pass |
| Notification service | `tests/services/notification.service.test.ts` | **15** | HF-051 + HF-052 | ✅ Pass |
| Push notification hook | `tests/hooks/usePushNotifications.test.ts` | **7** | HF-051 | ✅ Pass |
| Notification store | `tests/store/notificationStore.test.ts` | **10** | HF-052 | ✅ Pass |
| Location service | `tests/services/location.service.test.ts` | **8** | HF-053 | ✅ Pass |
| Location tracking hook | `tests/hooks/useLocationTracking.test.ts` | **6** | HF-053 | ✅ Pass |
| Message service | `tests/services/message.service.test.ts` | **9** | HF-102 | ✅ Pass |
| useChat hook | `tests/hooks/useChat.test.ts` | **14** | HF-102 | ✅ Pass |
| Chat screen | `tests/screens/chat.test.tsx` | **26** | HF-102 | ✅ Pass |
| Call service | `tests/services/call.service.test.ts` | **8** | HF-103 | ✅ Pass |
| useVoiceCall hook | `tests/hooks/useVoiceCall.test.ts` | **7** | HF-103 | ✅ Pass |
| Payment service | `tests/services/payment.service.test.ts` | 14 | pre-S6 | ✅ Pass |
| Admin service | `tests/services/admin.service.test.ts` | 6 | pre-S6 | ✅ Pass |
| Payment screen | `tests/screens/payment.test.tsx` | 9 | pre-S6 | ✅ Pass |
| Wallet screen | `tests/screens/wallet.test.tsx` | 14 | pre-S6 | ✅ Pass |
| Revenue screen | `tests/screens/revenue.test.tsx` | 14 | pre-S6 | ✅ Pass |
| Admin Withdrawals screen | `tests/screens/withdrawals.test.tsx` | 13 | pre-S6 | ✅ Pass |
| Job service | `tests/services/job.service.test.ts` | 9 | pre-S6 | ✅ Pass |
| Bookings screen | `tests/screens/bookings.test.tsx` | 7 | pre-S6 | ✅ Pass |
| Auth store | `tests/store/authStore.test.ts` | 3 | pre-S6 | ✅ Pass |
| JobCard component | `tests/components/JobCard.test.tsx` | 8 | pre-S6 | ✅ Pass |
| ProviderJobCard component | `tests/components/ProviderJobCard.test.tsx` | 7 | pre-S6 | ✅ Pass |
| VoiceRecorder component | `tests/components/VoiceRecorder.test.tsx` | 6 | pre-S6 | ✅ Pass |
| VoiceNotePlayer component | `tests/components/VoiceNotePlayer.test.tsx` | 4 | pre-S6 | ✅ Pass |
| ReadAloudButton component | `tests/components/ReadAloudButton.test.tsx` | 6 | pre-S6 | ✅ Pass |

Sprint 6 total mobile: **246 tests / 26 suites** (+125 new from Sprint 6 tickets; 121 carried from Sprints 1–5).

---

## Test Coverage by Ticket

### HF-050 — Review & Rating Screen

**Services / stores:** `review.service.ts`, `reviewStore.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `submitReview` posts with rating + comment | ✅ |
| 2 | `submitReview` trims whitespace from comment | ✅ |
| 3 | `submitReview` omits comment when blank | ✅ |
| 4 | `submitReview` with no comment (optional) | ✅ |
| 5 | `submitReview` → 400 REVIEW_NOT_ALLOWED propagates | ✅ |
| 6 | `submitReview` → 409 REVIEW_ALREADY_EXISTS propagates | ✅ |
| 7 | `submitReview` → 401 propagates | ✅ |
| 8 | `getProviderReviews` uses default page + limit | ✅ |
| 9 | `getProviderReviews` uses custom params | ✅ |
| 10 | `getProviderReviews` returns empty array | ✅ |
| 11 | Store initial state: `hasReviewed` returns false | ✅ |
| 12 | `markJobReviewed` → `hasReviewed` returns true | ✅ |
| 13 | Jobs reviewed in isolation (no cross-job bleed) | ✅ |
| 14 | `markJobReviewed` is idempotent | ✅ |
| 15 | Multiple jobs tracked independently | ✅ |

---

### HF-051 — Push Notification Setup

**Service/hook:** `notification.service.ts` (register/unregister cases), `usePushNotifications.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `registerDeviceToken` POSTs correct body | ✅ |
| 2 | `registerDeviceToken` resolves void | ✅ |
| 3 | `registerDeviceToken` → 401 propagates | ✅ |
| 4 | `registerDeviceToken` → 500 propagates | ✅ |
| 5 | `unregisterDeviceToken` sends DELETE | ✅ |
| 6 | `unregisterDeviceToken` resolves void | ✅ |
| 7 | `unregisterDeviceToken` → 401 propagates | ✅ |
| 8 | `unregisterDeviceToken` → 404 propagates | ✅ |
| 9 | Hook registers when permission already granted | ✅ |
| 10 | Hook requests permission then registers | ✅ |
| 11 | Hook denied → never calls `getDevicePushTokenAsync` | ✅ |
| 12 | Non-device (simulator) → skips token fetch | ✅ |
| 13 | Tap notification → navigates to job detail | ✅ |
| 14 | Notification without `jobId` → no navigation | ✅ |
| 15 | Unmount removes notification response listener | ✅ |

---

### HF-052 — Notification Center

**Service/store:** `notification.service.ts` (list/read cases), `notificationStore.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `getNotifications` uses default page + limit | ✅ |
| 2 | `getNotifications` uses custom params | ✅ |
| 3 | `getNotifications` response includes `unread_count` | ✅ |
| 4 | `getNotifications` → 401 propagates | ✅ |
| 5 | `markAsRead` sends PATCH to correct URL | ✅ |
| 6 | `markAsRead` returns updated notification | ✅ |
| 7 | `markAsRead` → 404 propagates | ✅ |
| 8 | Store initial state | ✅ |
| 9 | `fetchNotifications` populates notifications + unreadCount | ✅ |
| 10 | `fetchNotifications(reset=true)` clears previous data | ✅ |
| 11 | Load-more appends older results | ✅ |
| 12 | `hasMore` false when pagination ends | ✅ |
| 13 | Loading guard prevents concurrent fetches | ✅ |
| 14 | `markAsRead` replaces item in list | ✅ |
| 15 | `markAsRead` decrements `unreadCount` | ✅ |
| 16 | `markAsRead` no-op when already read | ✅ |
| 17 | Fetch error resets `isLoading` to false | ✅ |

---

### HF-053 — Provider Location Tracking

**Service/hook:** `location.service.ts`, `useLocationTracking.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `updateMyLocation` sends PUT with lat/lon | ✅ |
| 2 | `updateMyLocation` resolves void | ✅ |
| 3 | `updateMyLocation` → 401 propagates | ✅ |
| 4 | `updateMyLocation` → 403 propagates | ✅ |
| 5 | `getProviderLocation` calls correct URL | ✅ |
| 6 | `getProviderLocation` returns lat/lon shape | ✅ |
| 7 | `getProviderLocation` → 403 propagates | ✅ |
| 8 | `getProviderLocation` → 404 propagates | ✅ |
| 9 | Hook disabled → no watch started | ✅ |
| 10 | Hook enabled + granted → starts watch | ✅ |
| 11 | Hook requests permission then watches | ✅ |
| 12 | Permission denied → no watch started | ✅ |
| 13 | Position update → calls `updateMyLocation` | ✅ |
| 14 | Unmount → removes location watcher | ✅ |

---

### HF-102 — In-App Chat Screen (text + image + voice)

**Service/hook/screen:** `message.service.ts`, `useChat.ts`, `chat/[id].tsx`

| # | Test | Result |
|---|------|--------|
| 1 | `list` fetches with default limit=50 | ✅ |
| 2 | `list` appends `before` cursor | ✅ |
| 3 | `list` returns `next_cursor` when more exist | ✅ |
| 4 | `send` posts text message | ✅ |
| 5 | `send` posts image message | ✅ |
| 6 | `send` posts audio message | ✅ |
| 7 | `send` returns full message object | ✅ |
| 8 | `uploadImage` POSTs multipart and returns URL | ✅ |
| 9 | `uploadImage` falls back to audio/mp4 mime type | ✅ |
| 10 | `useChat` starts loading, then false after list resolves | ✅ |
| 11 | `useChat` populates messages from initial list | ✅ |
| 12 | `useChat` sets `hasMore` true from cursor | ✅ |
| 13 | `useChat` sets `hasMore` false when null | ✅ |
| 14 | Socket connect → `join_job` emitted + `isConnected` true | ✅ |
| 15 | Socket disconnect → `isConnected` false | ✅ |
| 16 | Socket `message` event → message appended | ✅ |
| 17 | Duplicate socket message deduplicates | ✅ |
| 18 | `sendText` calls service with type=text | ✅ |
| 19 | `sendText` sets `isSending` true then false | ✅ |
| 20 | `sendImage` calls service with type=image | ✅ |
| 21 | `sendAudio` calls service with type=audio | ✅ |
| 22 | `loadMore` fetches with cursor and appends | ✅ |
| 23 | `loadMore` no-op when `hasMore` false | ✅ |
| 24 | Unmount → `leave_job` emitted + socket disconnected | ✅ |
| 25 | Screen shows loading indicator while `isLoading` | ✅ |
| 26 | Screen shows empty state when no messages | ✅ |
| 27 | Screen shows back button + title | ✅ |
| 28 | Back button calls `router.back()` | ✅ |
| 29 | Wifi icon rendered when connected | ✅ |
| 30 | WifiOff icon rendered when disconnected | ✅ |
| 31 | Text bubble renders message content | ✅ |
| 32 | Received bubble (from other user) | ✅ |
| 33 | Image bubble renders Image component | ✅ |
| 34 | Audio bubble renders play button | ✅ |
| 35 | Load-more button shown when `hasMore` | ✅ |
| 36 | Load-more button calls `loadMore` | ✅ |
| 37 | Mic button shown when input empty | ✅ |
| 38 | Send button shown when text typed | ✅ |
| 39 | Send → calls `sendText` trimmed + clears input | ✅ |
| 40 | Send button disabled when `isSending` | ✅ |
| 41 | Attach button opens image picker | ✅ |
| 42 | Selected image → `uploadImage` + `sendImage` | ✅ |
| 43 | Picker cancelled → no upload | ✅ |
| 44 | Media permission denied → error toast | ✅ |
| 45 | Mic press → stop + cancel buttons visible | ✅ |
| 46 | Mic press, permission denied → error toast | ✅ |
| 47 | Cancel recording → returns to idle | ✅ |
| 48 | Stop → `stopAndUnloadAsync` + upload + `sendAudio` + idle | ✅ |

---

### HF-103 — In-App Voice Call (Jitsi via expo-web-browser)

**Service/hook:** `call.service.ts`, `useVoiceCall.ts`

| # | Test | Result |
|---|------|--------|
| 1 | `createRoom` POSTs to `/v2/jobs/:id/call/room` | ✅ |
| 2 | `createRoom` returns `RoomConfig` body | ✅ |
| 3 | `createRoom` rejects on API error | ✅ |
| 4 | `buildCallUrl` — serverUrl + roomName, no token | ✅ |
| 5 | `buildCallUrl` — appends `?jwt=` when token present | ✅ |
| 6 | `buildCallUrl` — falls back to `meet.jit.si` | ✅ |
| 7 | `buildCallUrl` — fallback + token | ✅ |
| 8 | `buildCallUrl` — agora provider (provider-agnostic URL) | ✅ |
| 9 | Hook initial state: `isCallLoading` false | ✅ |
| 10 | `startCall` passes `jobId` to `createRoom` | ✅ |
| 11 | `startCall` passes config to `buildCallUrl` | ✅ |
| 12 | `startCall` opens browser with built URL | ✅ |
| 13 | `isCallLoading` true in flight, false after success | ✅ |
| 14 | Error toast + `isCallLoading` reset on `createRoom` throw | ✅ |
| 15 | Error toast + `isCallLoading` reset on `openBrowserAsync` throw | ✅ |

---

## Key Testing Gotchas

### Jest mock factory scope — `mock` prefix required
Variables referenced inside `jest.mock()` factory must use the `mock` prefix:
```typescript
let mockChatHookOverrides = {};  // ✅ — "mock" prefix is exempt from Jest's scope restriction
jest.mock('../../hooks/useChat', () => ({
  useChat: () => ({ ...mockChatHookDefaults, ...mockChatHookOverrides }),
}));
```

### socket.io-client — set mock return value in `beforeEach`, not factory
```typescript
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
const mockIo: jest.Mock = require('socket.io-client').io;
beforeEach(() => { mockIo.mockReturnValue(makeMockSocket()); });
```
The factory runs before `const`/`let` declarations are initialized — setting `mockReturnValue` inside the factory produces `undefined`.

### `clearAllMocks()` does NOT clear implementations
Set all mock defaults in `beforeEach`. Implementations survive `clearAllMocks`.

### ActivityIndicator query
```typescript
// ✅ — query by type, not testID
screen.UNSAFE_queryByType(require('react-native').ActivityIndicator)
```
