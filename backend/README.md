# HomeFix – Backend Overview

The backend is built with a **clean, modular, and production-ready architecture**.

### Tech Stack

- Node.js (>= 20)
- Express.js
- TypeScript
- Winston Logger
  - Daily log rotation
  - Sensitive data masking
  - Request ID tracing
- Centralized Error Handling
- Standardized API Response Format
- Environment-based Configuration

---

## Prerequisites

- Node.js 20+
- npm
- nvm (recommended)

---

## Environment Setup
```bash
nvm use
npm install
```
---
## Environment Configuration

Create a file inside `backend/`:

### `.env.development`

```env
NODE_ENV=development
PORT=4000

ENABLE_SEED=true
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin@1234

LOG_LEVEL=debug
LOG_DIR=logs
LOG_RETENTION_DAYS=3

JWT_ACCESS_SECRET=super-secret-access
JWT_REFRESH_SECRET=super-secret-refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
---
## Run Backend
#### Development Mode
``` bash
    npm run dev
```
#### Production Mode
``` bash
    npm run build
    npm start
```
---

## Project Structure
```text
homefix/
├── README.md
├── .gitignore
├──  backend
│    ├── README.md
│    ├── docs
│    ├── logs
│    ├── package-lock.json
│    ├── package.json
│    ├── src                               # Application source
│    │   ├── app.ts                        
│    │   ├── config                        # App configuration
│    │   ├── errors                        # Global error handler
│    │   ├── http                          # Response contracts
│    │   ├── logger                        # Observability
│    │   ├── middlewares                   # Cross-cutting concerns
│    │   ├── modules                       # Business domain
│    │   │   └── health
│    │   │       ├── health.controller.ts
│    │   │       ├── health.route.ts
│    │   │       └── health.service.ts
│    │   ├── routes                        # System / platform routes
│    │   ├── server.ts
│    │   ├── types
│    │   └── utils                         # Helper function
│    ├── tsconfig.json
│    └── uploads                           # File storage
├── frontend
└── docs/
```

## Roadmap

| Layer | Responsibility |
|--------|------------|
| `modules/` | Business logic |
| `middlewares/`   | Cross-cutting concerns |
| `config/`  | App configuration |
| `routes/`  | System / platform routes |
| `http/`  | Response contracts |
| `logger/`  | Observability |

## API Response Standard
#### Success Response
``` bash
{
  "http_code": 200,
  "message": "Success",
  "body": {}
}
```
#### Paginated Response
``` bash
{
  "http_code": 200,
  "message": "Success",
  "body": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```
#### Error Response
``` bash
{
  "http_code": 500,
  "error_code": "BAD_REQUEST"
  "message": "Internal server error",
  "body": null
}

```

| ErrorCode      | Frontend Action     |
|----------------|---------------------|
| `AUTH_REQUIRED`     | Redirect to login   |
| `TOKEN_EXPIRED` | Call /auth/refresh  |
| `SESSION_EXPIRED`      | Logout + redirect   |
| `REFRESH_TOKEN_REVOKED`      | Logout everywhere   |
| `INVALID_CREDENTIALS`        | Show error messages |
| `ALREADY_EXISTS`      | Show error messages |
| `INSUFFICIENT_PERMISSION`      | Show 403 page       |
| `RESOURCE_NOT_FOUND`      | Show 404 page       |
---
## Health Check API
``` bash
GET /health
```


## Covered

#### Authentication
```

Access token + refresh token 

Short-lived access token 

Refresh token rotation 

Replay protection

Token revocation

Logout (single device) 

Logout all devices 

Token versioning (global invalidation) 

Per-device session awareness
```

#### Authorization
```
Role-based access (RBAC) 

Permission-based guards 

Route-level protection 

Admin vs user isolation

Swagger-documented access rule
```

#### API & Platform Security
```
Helmet headers

Rate limiting

CORS setup

Request ID tracing

Centralized error handling

No sensitive data leakage

Password hashing (bcrypt)

Timing-safe comparisions
```

