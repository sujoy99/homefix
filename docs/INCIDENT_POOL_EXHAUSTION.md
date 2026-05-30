# Incident Report & Lesson Learned — DB Connection Pool Exhaustion

> **Date:** 2026-05-30  
> **Severity:** P1 — Login unavailable for all users  
> **Duration:** Intermittent (minutes); self-recovered after container restart  
> **Root cause:** Knex connection pool exhausted by concurrent polling queries  
> **Status:** Mitigated (see fixes applied); permanent fix pending Sprint 8

---

## What Happened

Users could not log in. The backend responded with HTTP 500 for all endpoints, including `/v2/auth/login`.

**Error in backend logs:**
```
KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.
Are you missing a .transacting(trx) call?
  at Client_PG.acquireConnection
  at WhereInEagerOperation.fetchRelation  ← login's eager-load of authAccounts
```

---

## Root Cause Analysis

### Primary cause — polling × eager loading = pool deadlock

The job detail screen (`booking/job/[id].tsx`) polls `GET /v2/jobs/:id` every **10 seconds** while the screen is open.

Each login request runs `findUserWithAuth()` which uses `.withGraphFetched('authAccounts')`. Objection.js's `WhereInEagerOperation` issues **2 queries** per login:
1. `SELECT ... FROM users WHERE mobile = ?`
2. `SELECT ... FROM auth_accounts WHERE user_id IN (?)`

Each query needs a connection from the pool. The default pool size was **max: 10**.

With the job detail screen open and polling every 10 s:
- 3 users each with the job detail screen open = 3 polls every 10 s
- Each poll = 1 connection held for ~50 ms
- Simultaneous with login attempts = 2 more connections needed
- If enough requests stack up (network latency + DB query time), all 10 connections are in use

**Result:** When a login request needed connection 11, it timed out → 500 for the user.

### Secondary cause — polling interval too aggressive

10 s is appropriate for a real-time game but is **too aggressive for a booking status screen** where the job state only changes when a human takes an action. The real "change rate" is minutes, not seconds.

### Contributing factor — logout interceptor bug

The Axios response interceptor did not include `logout` in the auth-endpoint bypass list:
```typescript
// BUG: regex missing 'logout'
const isAuthEndpoint = /\/auth\/(login|register|refresh)/.test(url);
```

If a user's access token expired **at the moment they tapped Logout**, the interceptor tried to refresh the token. If refresh also failed, it called `logout()` recursively, creating a loop of failing API calls, each holding a connection from the pool.

---

## Impact

| What broke | Why |
|---|---|
| Login for all users | Pool full; login queries timed out |
| Job detail queries | Pool full; 10 s polls timed out too |
| Logout sometimes failed silently | Interceptor loop on expired token |

---

## Fixes Applied (Mitigation)

| Fix | File | What it does |
|---|---|---|
| Pool max 10 → 20 | `knexfile.ts` | Doubles headroom before exhaustion |
| `acquireTimeoutMillis: 8000` | `knexfile.ts` | Returns 500 fast instead of hanging indefinitely |
| Polling 10 s → 30 s | `booking/job/[id].tsx` | Reduces DB pressure by 3× on job detail screens |
| Add `logout` to interceptor bypass | `api/client.ts` | Stops recursive refresh loop on expired token at logout |

---

## Permanent Fix Plan (Sprint 8 — HF-104 to HF-106)

### HF-104 — Real-time via WebSocket (kills polling entirely)

Polling is the wrong pattern for status updates. The correct pattern is **server-push**:

```
Client connects → subscribes to job room →
Backend pushes status change event when it happens
```

Socket.IO (already planned for HF-100 messaging) should also push job status change events. Once WebSocket is live, remove `refetchInterval` entirely from the job detail screen.

Until WebSocket is ready, polling at 30 s is acceptable for an MVP.

### HF-105 — Connection pool monitoring + alerting

Add a metrics endpoint that exposes pool stats:

```typescript
// GET /internal/health
{
  "db_pool_used": 4,
  "db_pool_free": 16,
  "db_pool_waiting": 0
}
```

Alert when `db_pool_free < 3` (e.g. via UptimeRobot or a simple cron check).

### HF-106 — Graceful degradation on pool exhaustion

Instead of a generic 500, return a meaningful error when the pool is exhausted:

```typescript
// In errorHandler middleware
if (err instanceof KnexTimeoutError) {
  return res.status(503).json({
    http_code: 503,
    error_code: 'SERVICE_UNAVAILABLE',
    message: 'Server is busy. Please try again in a few seconds.',
  });
}
```

The mobile app should map `503` → show a "Server busy — tap to retry" banner instead of a generic error toast.

---

## Production Checklist (for this specific failure pattern)

Before going public, verify all of these:

- [ ] **Pool sizing** — set `max` to `(expected_concurrent_users × avg_queries_per_request × 2)`. For 100 concurrent users doing 2 queries each: min 400 connections. Use PgBouncer for large scale (see below).
- [ ] **PgBouncer** — at >50 concurrent users, put PgBouncer in front of PostgreSQL. Knex sees a large virtual pool; PgBouncer multiplexes real connections.
- [ ] **No polling in production** — replace all `refetchInterval` with WebSocket push or long-polling (HF-104).
- [ ] **Eager loading audit** — every `.withGraphFetched()` doubles connection demand. Replace with JOIN queries where the relation is always fetched.
- [ ] **Pool health endpoint** — expose `/internal/health` with pool stats; monitor externally.
- [ ] **Graceful 503** — map `KnexTimeoutError` → HTTP 503 + retry-after header + mobile banner.
- [ ] **Connection leak detection** — enable `debug: true` in Knex during staging and monitor for connections that stay open >5 s.

---

## Architecture Rule Added

> **Rule:** Any screen that auto-refreshes data must use `refetchInterval ≥ 30_000` unless backed by WebSocket push. The job detail screen currently polls at 30 s and will be migrated to WebSocket in HF-104.

---

## References

- [Knex Connection Pool docs](https://knexjs.org/guide/#pool)
- [PgBouncer setup guide](https://www.pgbouncer.org/)
- [Objection.js eager loading](https://vincit.github.io/objection.js/guide/eager-loading.html)
- HF-100 — in-app messaging (WebSocket infrastructure)
- HF-104 — job status real-time via WebSocket (remove polling)
