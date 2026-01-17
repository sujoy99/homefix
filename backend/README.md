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
PORT=3000
LOG_LEVEL=debug
LOG_DIR=logs
LOG_RETENTION_DAYS=3
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
  "message": "Internal server error",
  "body": null
}
```
---
## Health Check API
``` bash
GET /health
```

