# HF-100 In-app Messaging — Session Checkpoint

> Resume point for when session limit refills.

## Status: ~70% complete — type-check NOT yet run

---

## What was done

### 1. socket.io installed
- Already present in `backend/package.json` at `^4.8.3`
- Installed in Docker container via `docker exec homefix_backend npm install socket.io`

### 2. DB migration created & run
- File: `backend/src/db/migrations/20260601000003_create_job_messages.ts`
- Creates `job_messages(id, job_id, sender_id, content, type, created_at)` with FK cascade
- Index: `idx_job_messages_job_id ON job_messages (job_id, created_at DESC)`
- Migration ran successfully: "Batch 4 run: 1 migrations"

### 3. Socket singleton created
- File: `backend/src/lib/socket.ts`
- Exports: `initSocket(server: HttpServer)`, `emitToJob(jobId, event, data)`
- `emitToJob` is a safe no-op when `io` is null (i.e., in tests where server is not started)
- Clients join rooms via `socket.on('join_job', jobId)` — room name: `job:{jobId}`

### 4. `@lib` alias added
- `backend/tsconfig.json` → added `"@lib/*": ["./src/lib/*"]`
- `backend/jest.config.js` → added `'^@lib/(.*)$': '<rootDir>/src/lib/$1'`

### 5. Full messages module created
All 8 files under `backend/src/modules/messages/`:
- `message.model.ts` — Objection.js model for `job_messages`
- `message.types.ts` — `MessageType`, `Message`, `CreateMessageInput`, `MessageListQuery`
- `message.schema.ts` — Zod: `sendMessageSchema`, `listMessagesSchema`
- `message.dto.ts` — `SendMessageDTO`, `MessageListDTO`
- `message.repository.ts` — `create()`, `list()` (cursor via `before` UUID)
- `message.service.ts` — `send()` + `list()` with participant check + ACTIVE guard + emit + push
- `message.controller.ts` — `send()` → 201, `list()` → 200
- `message.route.ts` — `POST /jobs/:id/messages`, `GET /jobs/:id/messages`

### 6. server.ts updated
- Now uses `http.createServer(app)` + `initSocket(httpServer)` before `.listen()`

### 7. Routes registered
- `backend/src/routes/v2/index.ts` → added `router.use('/', messageRouter)`

### 8. Error code added
- `backend/src/errors/error-code.ts` → added `MESSAGING_NOT_AVAILABLE = 'MESSAGING_NOT_AVAILABLE'`

### 9. truncateAll updated
- `backend/tests/helpers/db.ts` → added `DELETE FROM job_messages` as the very first delete

---

## What is NOT done yet

1. **Type-check** — `npm run type-check` was NOT run (user interrupted). Run it first thing.
2. **Integration tests** — File not created yet. See spec below.
3. **Test factory** — `backend/tests/factories/message.factory.ts` not created yet.
4. **Commit** — Nothing committed for HF-100 yet.

---

## Resume instructions

### Step 1 — Run type-check inside container
```bash
cd /home/sujoy/projects/homefix/backend && npm run type-check
```
Fix any errors (likely none serious).

### Step 2 — Create message factory
File: `backend/tests/factories/message.factory.ts`
```typescript
import { getTestDb } from '../helpers/db';

export interface FactoryMessageResult {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
}

export async function createMessage(opts: {
  job_id: string;
  sender_id: string;
  content?: string;
  type?: string;
}): Promise<FactoryMessageResult> {
  const db = getTestDb();
  const [row] = await db('job_messages')
    .insert({
      job_id: opts.job_id,
      sender_id: opts.sender_id,
      content: opts.content ?? 'Test message content',
      type: opts.type ?? 'text',
    })
    .returning(['id', 'job_id', 'sender_id', 'content', 'type', 'created_at']);
  return row as FactoryMessageResult;
}
```

### Step 3 — Create integration tests
File: `backend/tests/modules/messages/messages.test.ts`

Test the following describe blocks:

**`POST /api/v2/jobs/:id/messages (HF-100)`**
1. 201 — resident sends a message to active job → returns message object
2. 201 — provider sends a message to active job → returns message object
3. 400 — job is PENDING (not ACTIVE) → MESSAGING_NOT_AVAILABLE
4. 403 — different resident (non-participant) → JOB_ACCESS_DENIED
5. 403 — provider not assigned to job → JOB_ACCESS_DENIED
6. 401 — no token
7. 400 — empty content (fails Zod)
8. 404 — non-existent job UUID

**`GET /api/v2/jobs/:id/messages (HF-100)`**
1. 200 — returns empty list + null next_cursor when no messages
2. 200 — returns messages in DESC order
3. 200 — cursor pagination: `before` param returns older messages only
4. 200 — next_cursor is null when fewer messages than limit
5. 200 — next_cursor is set when messages == limit
6. 403 — non-participant → JOB_ACCESS_DENIED
7. 401 — no token
8. 400 — job is not ACTIVE

### Step 4 — Run tests
```bash
docker exec homefix_backend npm test -- --testPathPattern=messages --runInBand
```

### Step 5 — Run all tests
```bash
docker exec homefix_backend npm test --runInBand
```

### Step 6 — Commit
```
feat(messaging): HF-100 — in-app job messaging (job_messages, Socket.IO, cursor pagination)
```

### Step 7 — Update docs/implementation_plan.md
- Mark HF-100 ✅ in sprint table
- Update "Next Ticket" for Backend from HF-100 → HF-101

---

## Key design decisions
- Access control: **only job participants** (resident + assigned provider) can send/read
- Status gate: job must be **ACTIVE** to message (both send and list)
- Socket.IO: `emitToJob` is no-op when `io` is null — safe in tests
- Push: fire-and-forget via `notificationService.send().catch()` — uses existing `NEW_MESSAGE` type
- Cursor pagination: `before` = message UUID cursor, returns older messages (DESC order)
- `next_cursor` = last item's `id` when `items.length === limit`, else `null`
- Module lives in `src/modules/messages/`, routes mounted at `/` in v2 index

---

## File list (all new/modified)

### New files
- `backend/src/db/migrations/20260601000003_create_job_messages.ts`
- `backend/src/lib/socket.ts`
- `backend/src/modules/messages/message.model.ts`
- `backend/src/modules/messages/message.types.ts`
- `backend/src/modules/messages/message.schema.ts`
- `backend/src/modules/messages/message.dto.ts`
- `backend/src/modules/messages/message.repository.ts`
- `backend/src/modules/messages/message.service.ts`
- `backend/src/modules/messages/message.controller.ts`
- `backend/src/modules/messages/message.route.ts`

### Modified files
- `backend/tsconfig.json` — added `@lib/*` alias
- `backend/jest.config.js` — added `@lib/*` moduleNameMapper
- `backend/src/server.ts` — http.createServer + initSocket
- `backend/src/routes/v2/index.ts` — registered messageRouter
- `backend/src/errors/error-code.ts` — added MESSAGING_NOT_AVAILABLE
- `backend/tests/helpers/db.ts` — DELETE FROM job_messages first in truncateAll
