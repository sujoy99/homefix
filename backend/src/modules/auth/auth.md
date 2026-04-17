# 🔐 Auth & Registration Module — Technical Documentation

## 📌 Overview

This module implements a **production-grade authentication and registration system** with a focus on:

* Security (JWT, rotation, reuse detection)
* Scalability (DB-backed sessions)
* Extensibility (OTP, OAuth ready)
* Auditability (device + IP tracking)

---

# 🏗️ Architecture Summary

## Core Components

| Layer      | Responsibility                      |
| ---------- | ----------------------------------- |
| Controller | Request handling                    |
| Service    | Business logic                      |
| Repository | DB interaction                      |
| Models     | ORM mapping (Objection.js)          |
| JWT Utils  | Token generation/verification       |
| Middleware | Request context (client info, auth) |

---

# 👤 User & Auth Model Design

## `users`

* Stores identity
* Fields: `id`, `mobile`, `email`, `role`, `status`, etc.
* Supports:

  * Resident / Provider / Admin
  * Admin approval (`pending`, `active`)

---

## `auth_accounts`

* Authentication methods per user
* Supports:

  * `password`
  * `otp` (future)
  * `google` (future)

Key fields:

* `password_hash`
* `failed_attempts`
* `lock_until`
* `refresh_token_version`

---

## `auth_refresh_tokens`

* Session storage (device-based)

Key fields:

* `device_id`
* `ip_address`
* `user_agent`
* `is_revoked`
* `expires_at`

---

# 🔑 Authentication Features

---

## ✅ 1. Login (Password-based)

### Flow

1. Identify user (mobile/email)
2. Validate status (admin approval)
3. Validate password
4. Detect new device
5. Reset failed attempts
6. Generate tokens
7. Store refresh token

---

## 🔐 2. JWT Design

### Access Token

* Short-lived
* Contains:

  * `sub` (userId)
  * `mobile`
  * `role`
  * `status`
  * `tokenVersion`
  * `deviceId`

---

### Refresh Token

* Long-lived
* Contains:

  * `tokenId`
  * `deviceId`
  * `tokenVersion`

---

## 🔁 3. Refresh Token Rotation (CRITICAL)

Flow:

```text
Old token → revoked
New token → issued
```

✔ Prevents replay attacks
✔ Enables session tracking

---

## 🚨 4. Token Reuse Detection

```ts
if (storedToken.is_revoked) → attack
```

### Action:

* Invalidate all sessions
* Force re-login

---

## 🔄 5. Session Versioning

* `refresh_token_version` in `auth_accounts`
* Used for:

  * Logout all devices
  * Global session invalidation

---

## 🔐 6. Account Lock Mechanism

* Tracks `failed_attempts`
* Locks account after threshold
* Auto unlock via `lock_until`

---

# 📱 Device & Security Tracking

---

## ✅ Stored per session

* `device_id`
* `ip_address`
* `user_agent`

---

## 🔍 New Device Detection

```ts
isNewDevice(userId, deviceId, userAgent)
```

Used for:

* logging
* future alert system

---

## 🚨 Suspicious Activity Detection

Signals:

* IP change
* User-Agent change

Action:

* log only (current)
* future: notify / risk scoring

---

# 🔐 Security Model

---

## Strong Signals (Trusted)

* Token reuse
* Token version mismatch

---

## Weak Signals (Informational)

* IP change
* User-Agent change
* New device

---

## Security Philosophy

```text
Prevent → Detect → Respond
```

---

# 🔄 API Summary

---

## Auth APIs

### POST `/auth/login`

* login user
* returns access + refresh token

---

### POST `/auth/refresh`

* rotates refresh token
* returns new tokens

---

### POST `/auth/logout`

* revoke current session

---

### POST `/auth/logout-all`

* revoke all sessions
* rotate token version

---

# ⚙️ Middleware

---

## `clientInfoMiddleware`

Captures:

* IP (`x-forwarded-for`)
* User-Agent

Attached to:

```ts
req.clientInfo
```

---

## Auth Guard

Injects:

```ts
req.user = {
  id,
  mobile,
  role,
  status
}
```

---

# ⚡ Performance Considerations

✔ Minimal DB calls
✔ Indexed queries (`user_id`, `device_id`)
✔ Avoid unnecessary joins
✔ Separate concerns (auth vs session)

---

# 🧪 Edge Cases Handled

* Invalid credentials
* Locked account
* Token reuse
* Expired token
* Missing auth method
* User status not active

---

# 📈 Scalability Readiness

✔ DB-backed sessions
✔ Multi-device support
✔ Stateless access tokens
✔ Horizontal scaling ready

---

# 🚧 Improvement Checklist (Next Phase)

---

## 🔐 Security Enhancements

* [ ] Add OTP login flow
* [ ] Add Google OAuth integration
* [ ] Add email notification on new device
* [ ] Add suspicious activity alerts
* [ ] Add rate limit per IP/device
* [ ] Add brute-force protection escalation

---

## 📱 Session Management

* [ ] List active sessions API
* [ ] Revoke specific device
* [ ] Show login history

---

## 🧠 Risk Engine (Advanced)

* [ ] Geo-location detection
* [ ] Device fingerprinting
* [ ] Risk scoring system

---

## 🧹 Maintenance

* [ ] Cron job to clean expired tokens

```sql
DELETE FROM auth_refresh_tokens WHERE expires_at < NOW();
```

---

## ⚡ Performance

* [ ] Add Redis cache (sessions / rate limit)
* [ ] Optimize heavy queries
* [ ] Add connection pooling tuning

---

## 📊 Observability

* [ ] Structured logging (winston/pino)
* [ ] Audit logs for auth events
* [ ] Metrics (login success/failure)

---

# 🧠 Design Strengths

✔ Clean separation of concerns
✔ Extensible authentication model
✔ Strong security foundation
✔ Real-world scalable design

---

# 🏁 Final Assessment

This module is:

```text
✔ Production-ready (mid-large scale)
✔ Security-aware
✔ Extensible for future auth methods
```

---

# 🧾 Suggested Git Commit Message

```bash
feat(auth): implement production-grade authentication system with JWT rotation, session tracking, and security enhancements

- add user & auth_accounts schema with multi-auth support
- implement login with mobile/email identifier
- add refresh token rotation and reuse detection
- introduce auth_refresh_tokens for session tracking
- implement device-based login tracking (deviceId, IP, user-agent)
- add account lock mechanism for failed login attempts
- integrate clientInfo middleware for request metadata
- add logout and logout-all session invalidation
- ensure transactional consistency for login flow
- prepare structure for OTP and OAuth (Google) integration

security:
- prevent token replay attacks via rotation
- detect refresh token reuse and invalidate sessions
- introduce anomaly detection (IP / user-agent changes)

chore:
- improve type safety with strict TypeScript settings
- refactor service layer for clarity and maintainability
```

---

# 🚀 Next Recommended Step

👉 Build **Session Management API (device list + revoke)**
👉 Then implement **Admin Approval Workflow**

---
