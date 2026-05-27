# HomeFix — Security Rules

## JWT Lifecycle

| Token | Lifetime | Storage | Rotation |
|-------|---------|---------|---------|
| Access token | 5–15 min | Mobile: memory/Zustand. Web: memory only | On every refresh |
| Refresh token | 7 days | DB (`auth_refresh_tokens`) + Mobile: SecureStore | On every use (rotation) |

Access tokens are **stateless** — verified by signature only (`authGuard` makes no DB calls). This means a stolen access token is valid until expiry. Short lifetime (5–15 min) is the mitigation.

## Token Rotation Rules

1. Every `/auth/refresh` call **revokes the old token and issues a new one** atomically in a DB transaction.
2. If a **revoked** refresh token is presented → **all sessions for that user are immediately invalidated** (reuse attack detected). See `AuthService.refresh()`.
3. `logoutAll` rotates `auth_accounts.refresh_token_version` — any issued token with an old version becomes invalid at next refresh.

## Auth Guard Usage

```typescript
// Require authentication
router.get('/me', authGuard, asyncHandler(handler));

// Require authentication + permission
router.delete('/users/:id', authGuard, permissionGuard(Permission.USER_WRITE), asyncHandler(handler));

// Public route — no guard
router.post('/auth/login', validate(loginSchema), asyncHandler(handler));
```

`authGuard` attaches `req.user: JwtPayload`. After `authGuard`, `req.user` is guaranteed to exist — no null checks needed.

## RBAC Permissions

Permissions are defined in `src/modules/auth/permissions.ts` and mapped to roles in `src/modules/auth/roles.ts`. Add to both files when creating new permissions.

| Role | Permissions |
|------|------------|
| `resident` | `JOB_READ` |
| `provider` | `JOB_READ`, `JOB_WRITE` |
| `admin` | All permissions |

Admin accounts are **seeded only** — never exposed through the public registration API. The registration schema explicitly rejects `role: admin`.

## Account Lock

- 5 consecutive failed login attempts → account locked for 15 minutes (`lock_until`)
- Reset on successful login (`failed_attempts = 0, lock_until = null`)
- Do not reveal lock status in the error message until the lock is applied (prevents enumeration)

## Input Validation Rules

- All request bodies validated with Zod at the controller boundary via `validate()` middleware
- Never trust `req.body` in services — validation is done before the controller is called
- Mobile number: 11 digits (`/^[0-9]{11}$/`)
- NID: 10 digits (`/^[0-9]{10}$/`)
- Password: 8–128 chars, must include uppercase, lowercase, digit, and special character

## Sensitive Data Rules

- Passwords: `bcrypt.hash(password, 12)` — cost factor 12
- NID images: stored via `storage.service.ts` (path encrypted at rest in production S3)
- Log masking: Winston logger masks `password`, `token`, `nid`, `authorization` fields — see `src/logger/log-mask.ts`
- JWT secrets must use `required()` in `env.ts` — startup fails if missing
- `req.user` contains only `{ sub, mobile, role, status, tokenVersion, deviceId }` — no password hash, no NID

## HTTP Security Headers

Helmet is applied globally in `app.ts` before all other middleware. Do not disable or override Helmet defaults without documenting why.

## CORS

`CORS_ORIGIN` env var controls allowed origins. In production, this must be set to the exact frontend domain — never `*`. Default `*` in `.env.sample` is development-only.

## Forbidden Patterns

- Never log `req.body` directly — use the masked logger
- Never return `password_hash` or NID data in API responses
- Never use `jwt.decode()` for access control — only `jwt.verify()`
- Never share JWT access secret and refresh secret — they are separate keys
- Never skip `authGuard` on routes that modify user data
- Never allow `role: admin` in the public registration endpoint
