# HomeFix — RBAC (Role-Based Access Control)

> **Version:** 1.0  
> **Date:** 2026-05-28  
> **Applies to:** Backend (`backend/`)

---

## Overview

HomeFix uses a **fully DB-driven RBAC system**. Which roles have which permissions is stored in the database and managed by the admin through the API (and eventually the admin panel UI in Sprint 7). No server restart is required to change role-permission assignments.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  DB Tables (source of truth)                                          │
│                                                                        │
│  roles               permissions           role_permissions           │
│  ┌──────────────┐    ┌───────────────┐    ┌────────────────────────┐  │
│  │ id (UUID) PK │    │ id (UUID) PK  │    │ id (UUID) PK           │  │
│  │ name         │◄───│               │    │ role_id  FK → roles    │  │
│  │ description  │    │ code (unique) │◄───│ permission_id FK→ perms│  │
│  └──────────────┘    │ description   │    │ UNIQUE(role_id, perm_id)│  │
│                       └───────────────┘    └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
         │  loaded at startup
         ▼
┌──────────────────────┐
│  PermissionCache     │  (in-memory, Map<UserRole, Set<Permission>>)
│  permission.cache.ts │  ← zero DB hit on every request
└──────────────────────┘
         │  checked on every guarded request
         ▼
┌──────────────────────┐
│  permissionGuard()   │  middleware in rbac.guard.ts
│  rbac.guard.ts       │  → permissionCache.has(req.user.role, perm)
└──────────────────────┘
```

---

## Key Files

| File | Role |
|------|------|
| `src/modules/auth/permissions.ts` | TypeScript `Permission` enum — compile-time type safety for permission codes |
| `src/modules/auth/roles.ts` | `DEFAULT_ROLE_PERMISSIONS` — **documentation only**, not used at runtime; mirrors DB seed data |
| `src/modules/auth/role.model.ts` | Objection model for `roles` table |
| `src/modules/auth/permission.model.ts` | Objection model for `permissions` table |
| `src/modules/auth/role_permission.model.ts` | Objection model for `role_permissions` junction table |
| `src/modules/auth/role_permission.repository.ts` | FK-based queries; `findAll()` used by cache, `assign()`/`revoke()` used by admin API |
| `src/modules/auth/permission.cache.ts` | Singleton in-memory cache — loaded from DB at startup |
| `src/modules/auth/rbac.guard.ts` | `permissionGuard(...perms)` middleware |
| `src/modules/auth/rbac.service.ts` | Business logic for role/permission management |
| `src/modules/auth/rbac.controller.ts` | HTTP layer for admin RBAC API |
| `src/modules/auth/rbac.route.ts` | `/api/v2/admin/rbac/...` routes |
| `src/db/migrations/20260528000004_create_roles_permissions_tables.ts` | Creates all 3 tables + seeds default data |

---

## DB Seed Defaults

Seeded in migration `20260528000004`. These are the defaults; admin can change assignments via API.

| Role | Default Permissions |
|------|---------------------|
| `admin` | USER_READ, USER_WRITE, ADMIN_DASHBOARD_VIEW, SETTINGS_MANAGE, JOB_READ, JOB_WRITE, CATEGORY_READ, CATEGORY_WRITE, PROVIDER_MANAGE, FILE_UPLOAD |
| `provider` | JOB_READ, JOB_WRITE, FILE_UPLOAD |
| `resident` | JOB_READ, FILE_UPLOAD |

---

## Startup Flow

```
server.ts bootstrap()
  └─→ import '@config/db'           ← binds Objection ORM to PostgreSQL knex instance
  └─→ permissionCache.loadFromDb()  ← JOINs role_permissions + roles + permissions
                                      builds Map<UserRole, Set<Permission>> in memory
                                      logs: "[PermissionCache] Loaded N mappings from DB"
```

If `loadFromDb()` throws (e.g. DB unreachable), the process crashes — this is intentional. A server that can't enforce permissions should not start.

---

## Request Flow (permission-guarded route)

```
Incoming request
  └─→ authGuard                        ← verifies JWT, attaches req.user: JwtPayload
       └─→ permissionGuard(Permission.CATEGORY_WRITE)
                └─→ permissionCache.has(req.user.role, 'CATEGORY_WRITE')
                         ← pure in-memory lookup, O(1), zero DB hit
                         └─→ true  → next()
                         └─→ false → 403 INSUFFICIENT_PERMISSION
```

---

## Admin API — Manage Role Permissions

All endpoints require: `Authorization: Bearer <admin-access-token>` + `SETTINGS_MANAGE` permission.

### List all roles with their permissions
```
GET /api/v2/admin/rbac/roles
→ 200 [{ id, name, permissions: ["JOB_READ", "FILE_UPLOAD", ...] }]
```

### List all available permission codes
```
GET /api/v2/admin/rbac/permissions
→ 200 [{ id, code, description }]
```

### Assign a permission to a role
```
POST /api/v2/admin/rbac/roles/:role/permissions
Body: { "permission_code": "JOB_WRITE" }

:role  → "resident" | "provider" | "admin"
→ 200  Permission assigned (cache auto-refreshed)
→ 400  Invalid role or unknown permission code
```

### Revoke a permission from a role
```
DELETE /api/v2/admin/rbac/roles/:role/permissions/:code

→ 200  Permission revoked (cache auto-refreshed)
→ 404  Mapping not found
→ 400  Invalid role or permission code
```

### Force-refresh permission cache
```
POST /api/v2/admin/rbac/refresh
→ 200  Permission cache refreshed
       (use after direct DB edits or bulk migrations)
```

---

## Developer Workflow — Adding a New Permission

When a new feature requires a new permission:

**Step 1 — Add to the TypeScript enum** (`permissions.ts`):
```typescript
export enum Permission {
  // ... existing
  BOOKING_MANAGE = 'BOOKING_MANAGE',  // ← add here
}
```

**Step 2 — Add a DB migration** to insert it into the `permissions` table:
```typescript
// new migration file
export async function up(knex: Knex) {
  await knex('permissions').insert({
    code: 'BOOKING_MANAGE',
    description: 'Create, update, cancel bookings',
  });
}
```

**Step 3 — Guard your route** with the new permission:
```typescript
router.post('/bookings', authGuard, permissionGuard(Permission.BOOKING_MANAGE), ...);
```

**Step 4 — Admin assigns the permission** to the appropriate role(s) via the admin panel UI (or directly via API). No server restart needed.

> **Why both enum AND DB?**  
> The TypeScript enum catches typos at compile time and lets IDEs auto-complete permission codes.  
> The DB table is the runtime source of truth — admin can change assignments without touching code.  
> Every valid permission code must exist in **both** the enum and the `permissions` table.

---

## How the Cache Works in Tests

`server.ts` is not loaded during tests (only `app.ts` is). The permission cache must be explicitly loaded before test suites run.

This is handled in `tests/setup.ts` (registered in `jest.config.js` → `setupFilesAfterEnv`):
```typescript
import '../src/app'; // triggers @config/db → Model.knex() binding
import { permissionCache } from '../src/modules/auth/permission.cache';

beforeAll(async () => {
  await permissionCache.loadFromDb(); // loads seeded role_permissions from test DB
});
```

The `role_permissions` table is **never truncated** between tests (it's static seed data). The `permissionCache` singleton is shared across all test files in the same Jest worker.

---

## Sprint 7 — Admin Panel UI

The admin panel (Sprint 7, ticket HF-071B) will provide a UI for:
- Viewing current role-permission assignments
- Assigning / revoking permissions from roles
- The UI calls the endpoints documented above
- Changes take effect immediately (cache auto-refreshes on each assign/revoke)

---

## Security Notes

- Only users with `SETTINGS_MANAGE` permission (admin role by default) can access RBAC management endpoints
- `permissionGuard` is always paired with `authGuard` — `authGuard` verifies the JWT, `permissionGuard` checks the role
- Revoking a permission takes effect on the **next request** — existing access tokens are NOT invalidated mid-flight (access tokens are short-lived, 5–15 min)
- The `admin` role always has `SETTINGS_MANAGE` — this is seeded and should never be revoked (it would lock out the ability to manage permissions)
