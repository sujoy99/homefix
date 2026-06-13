# BRD — In-App Chat Messaging (HF-100 / HF-102)

**SRS:** REQ-xxx (private resident↔provider communication — no personal phone numbers exposed)  
**Backend ticket:** HF-100 — `job_messages` table · REST API · Socket.IO  
**Mobile ticket:** HF-102 — Chat screen (text/image/voice, WebSocket + poll fallback)  
**Last Updated:** 2026-06-13

---

## Business Rules

| Rule | Detail |
|------|--------|
| Participants only | Only the resident who created the job and the assigned provider can read or send messages |
| ACTIVE gate | Chat is only available while `job.status = ACTIVE`. Both endpoints return `400 MESSAGING_NOT_AVAILABLE` otherwise |
| No phone numbers | In-app chat replaces direct phone contact — no personal numbers ever transmitted |
| 1 thread per job | Messages are keyed by `job_id` — a job has exactly one thread, accessed by both participants |
| Message content limit | 1–2,000 characters (enforced by Zod schema on both send and upload paths) |
| Image/audio via upload | Attachments are uploaded to the job media endpoint first; the resulting URL is sent as the message `content` |

---

## Database

### `job_messages` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | `gen_random_uuid()` default |
| `job_id` | `UUID` FK → `jobs.id` | `ON DELETE CASCADE` |
| `sender_id` | `UUID` FK → `users.id` | `ON DELETE CASCADE` |
| `content` | `TEXT` | Raw string for text; media URL for image/audio |
| `type` | `VARCHAR(20)` | `'text'` (default) \| `'image'` \| `'audio'` |
| `created_at` | `TIMESTAMPTZ` | `now()` default |

**Index:** `idx_job_messages_job_id ON job_messages (job_id, created_at DESC)` — optimises the standard "latest messages in a thread" query.

---

## API Contract

### `POST /api/v2/jobs/:id/messages`

**Auth:** Bearer token  
**Roles:** Resident (job owner) or Provider (assigned to job)  
**Guards:** Job must exist + caller must be participant + job must be ACTIVE

**Request body:**
```json
{
  "content": "On my way, 10 minutes.",
  "type": "text"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `content` | `string` | Yes | 1–2000 chars. For image/audio, pass the upload URL |
| `type` | `"text" \| "image" \| "audio"` | No | Default `"text"` |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "sender_id": "uuid",
    "content": "On my way, 10 minutes.",
    "type": "text",
    "created_at": "2026-06-13T10:00:00Z"
  }
}
```

**Side-effects after successful insert:**
1. `emitToJob(jobId, 'message', message)` — broadcasts to all Socket.IO clients in `job:{jobId}` room
2. `notificationService.send(...)` to the other participant — fire-and-forget, never blocks the response

---

### `GET /api/v2/jobs/:id/messages`

**Auth:** Bearer token  
**Roles:** Resident or Provider (same participant guard)  
**Guards:** Job must be ACTIVE

**Query parameters:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `limit` | `integer` | `50` | Max `100` |
| `before` | `UUID` | — | Cursor — returns messages **older** than this message ID |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "items": [ ...messages... ],
    "next_cursor": "uuid-of-oldest-message-in-page"
  }
}
```

- `items` are sorted **newest-first** (`created_at DESC`)
- `next_cursor` is the `id` of the last item in `items`; `null` when no older messages remain
- Mobile renders the list with `inverted={true}` on `FlatList` so newest messages appear at the bottom

**Errors:**

| Code | HTTP | Condition |
|------|------|-----------|
| `MESSAGING_NOT_AVAILABLE` | 400 | Job is not ACTIVE |
| `JOB_ACCESS_DENIED` | 403 | Caller is not a participant |
| `RESOURCE_NOT_FOUND` | 404 | Job not found |

---

## Real-Time Architecture

```
Mobile (resident)          Backend API + Socket.IO        Mobile (provider)
      │                           │                              │
      │  connect to /socket.io ──►│                              │
      │  emit join_job(jobId) ───►│ room: job:{jobId}            │
      │                           │◄── connect + join_job ───────│
      │                           │                              │
      │  POST /messages ─────────►│                              │
      │                           │ emitToJob(jobId, 'message')  │
      │◄── socket event 'message'─│──────────────────────────────►│
      │                           │ push notification →          │
      │                           │ FCM → provider's phone       │
```

### Socket.IO server config (`src/lib/socket.ts`)

```typescript
initSocket(httpServer);       // call once at app startup — attaches to existing HTTP server
emitToJob(jobId, event, data) // utility used by MessageService.send()
```

- **Path:** `/socket.io`
- **CORS:** `origin: '*'` in development (restrict in production)
- **Events client → server:** `join_job(jobId: string)`, `leave_job(jobId: string)`
- **Events server → client:** `message` — payload is the full `Message` object

### Mobile Socket.IO client (`hooks/useChat.ts`)

```typescript
const socket = io(SERVER_ROOT, {
  path: '/socket.io',
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 2_000,
});
```

| Event | Action |
|-------|--------|
| `connect` | Set `isConnected = true`, stop polling, emit `join_job(jobId)` |
| `disconnect` | Set `isConnected = false`, start 5s polling |
| `connect_error` | Same as disconnect |
| `message` | Append new message to top of list (de-duplicated by `id`) |

On unmount: emit `leave_job(jobId)`, `socket.disconnect()`, clear poll timer.

---

## Polling Fallback

When Socket.IO cannot connect (the 3-second connect timeout fires before `connect` event), or after a `disconnect`/`connect_error`, the `useChat` hook starts **5-second HTTP polling**:

```
GET /api/v2/jobs/:id/messages   (every 5s)
  → diff new IDs vs. existing → prepend novel messages
```

Polling stops immediately when the socket reconnects. This ensures message delivery in low-connectivity environments without requiring WebSocket support.

**Constant:** `POLL_INTERVAL_MS = 5_000` in `mobile/hooks/useChat.ts`.

---

## Message Types and Upload Flow

| `type` | `content` field | How it's sent |
|--------|-----------------|---------------|
| `text` | Raw message string | Direct to `POST /messages` |
| `image` | CDN/storage URL | Upload image to job media endpoint → get URL → `POST /messages` with `type: "image"` |
| `audio` | CDN/storage URL | Record with `expo-av` → upload to job media endpoint → get URL → `POST /messages` with `type: "audio"` |

The backend stores the URL verbatim. Mobile resolves it at display time using `resolveMediaUrl(url)` from `@/utils/media` — handles both relative paths (`/uploads/...`) and absolute URLs (S3).

---

## Push Notification

When a message is sent, the backend fires a push to the other participant (fire-and-forget — never blocks the API response):

```typescript
notificationService.send({
  userId: recipientId,
  type: NotificationType.NEW_MESSAGE,
  title: { en: 'New message', bn: 'নতুন বার্তা' },
  body: { en: content.slice(0, 100), bn: content.slice(0, 100) },
  data: { jobId, messageId: message.id },
});
```

**Mobile handling of `NEW_MESSAGE` push:**

| Context | Behaviour |
|---------|-----------|
| App foregrounded | `usePushNotifications` foreground listener fires `fetchNotifications(true)` — refreshes notification badge. No alert shown (user is already active). |
| App backgrounded / killed | OS delivers push banner. Tapping it → app opens → `usePushNotifications` response listener routes to `/(app)/booking/job/chat/${jobId}` |
| Notification tab tap | `handlePress` in `notifications.tsx` routes `NEW_MESSAGE` type to `/(app)/booking/job/chat/${jobId}` |

---

## Optimistic UI

The sender sees their own message **immediately** after `POST /messages` returns — `appendMessage(msg)` is called with the server response before the socket echo arrives. When the socket echo comes, the de-duplication check (`prev.some(m => m.id === msg.id)`) prevents a duplicate.

---

## Web Integration (Sprint 7)

The web chat feature can use the **same REST API and Socket.IO server** with no backend changes:

```javascript
// Web Socket.IO client (browser native WebSocket)
import { io } from 'socket.io-client';
const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  path: '/socket.io',
  transports: ['websocket'],
});
socket.emit('join_job', jobId);
socket.on('message', (msg) => { /* append to thread */ });
```

- No server changes needed — the existing `CORS: origin: '*'` allows web browser connections in dev (restrict to your domain in production)
- The `GET /messages` cursor pagination and `POST /messages` endpoints are already documented above — no new endpoints needed
- Web can choose to skip polling fallback and just reconnect on disconnect, or implement the same 5s poll as mobile

---

## Environment Variables

No dedicated env vars for the messaging module. Socket.IO attaches to the same HTTP server as Express — no separate port. The backend's `initSocket(server)` call in `app.ts` is the only wiring needed.

For production, restrict Socket.IO CORS:

```typescript
io = new SocketIOServer(server, {
  cors: {
    origin: ['https://app.homefix.com.bd', 'https://homefix.com.bd'],
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
});
```

---

## Testing

- `backend/__tests__/messages/` — integration tests covering send, list, access guard, ACTIVE gate
- `mobile/tests/hooks/useChat.test.ts` — unit tests for `useChat` hook (Socket.IO mocked)
- Push notifications only fire on physical devices — use two phones sharing an active job for end-to-end testing
