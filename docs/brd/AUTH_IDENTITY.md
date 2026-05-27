# BRD — Auth & Identity

**SRS:** REQ-001 to REQ-004 · **Sprints:** 1, 2

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-001 | Users register via Phone Number (11 digits) and National ID (10 digits) | ✅ Sprint 1 |
| REQ-002 | Residents provide area (lat/lon) during registration | ✅ Sprint 1 |
| REQ-003 | Providers upload NID photo; account status is `pending` until Admin approves | ✅ Sprint 1 (backend) / Sprint 2 (admin approval API) |
| REQ-004 | Role-based login: `resident`, `provider`, `admin` | ✅ Sprint 1 |

## Business Rules

- Mobile number is the primary unique identifier (NID is secondary unique identifier)
- `RESIDENT` registration → status immediately `ACTIVE`
- `PROVIDER` registration → status = `PENDING` until admin runs approval API (HF-023)
- `ADMIN` accounts are **seeded only** — public registration API explicitly blocks `role: admin`
- Auth methods supported: `password` (active), `otp` (future), `google` (future), `facebook` (future)
- A user can have multiple `auth_accounts` (one per method)
- Password must be 8–128 chars with uppercase, lowercase, digit, special char

## Data Model

```
users
  id (UUID PK)
  short_code (auto-generated, e.g. USR-000001)
  full_name
  mobile (UNIQUE)
  nid (UNIQUE)
  email (nullable)
  role: resident | provider | admin
  status: pending | active | inactive
  area: geometry(Point, 4326)
  photo_url (nullable)
  nid_photo_url (nullable — required for provider)

auth_accounts
  id (UUID PK)
  user_id (FK → users)
  auth_method: password | otp | google | facebook
  password_hash (nullable)
  failed_attempts (default 0)
  lock_until (nullable)
  refresh_token_version (UUID, rotated on logout-all)
  last_login (nullable)
```

## Security Behaviours

- 5 failed logins → account locked 15 minutes
- Locked accounts receive `ACCOUNT_LOCKED` error (not credential error)
- Device tracking: `device_id`, IP, user-agent stored per refresh token session
- New device detection triggers log entry (future: email alert)
- Suspicious refresh (IP/UA change) triggers warning log (future: user notification)

## Admin Approval Flow (REQ-003, HF-023)

```
Provider registers → status = PENDING
Admin GET /admin/providers?status=pending → list pending providers
Admin POST /admin/providers/:id/approve → status = ACTIVE (+ notify provider)
Admin POST /admin/providers/:id/reject → status = INACTIVE + reason stored
```

Providers in `PENDING` state receive `ACCOUNT_NOT_APPROVED` error on login.
