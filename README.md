# HomeFix Platform — One Stop Home Services Solution

HomeFix is a **geo-located home services marketplace** for Bangladesh, connecting residents with verified service providers (plumbers, electricians, painters, etc.).

## Monorepo Structure

```
homefix/
├── packages/
│   └── shared/          # Shared types, validation, constants
├── backend/             # Node.js + Express + TypeScript API
├── mobile/              # React Native + Expo (Android & iOS)
├── web/                 # Next.js 15 (Web App + Admin Panel)
└── docs/                # Project documentation
    ├── implementation_plan.md
    └── engineering_standards.md
```

## Quick Start

```bash
# Prerequisites: Node.js 20+, npm, PostgreSQL

# Install all dependencies (workspaces)
npm install

# Run backend
npm run backend:dev

# Run mobile app
npm run mobile:dev

# Run web app
npm run web:dev
```

## Documentation

| Document | Description |
|---|---|
| [Implementation Plan](docs/implementation_plan.md) | Sprint breakdown, tickets, SRS traceability |
| [Engineering Standards](docs/engineering_standards.md) | Coding style, project structure, conventions |
| [Backend README](backend/README.md) | Backend-specific setup and API docs |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20+, Express 5, TypeScript, PostgreSQL, Objection.js |
| Mobile | React Native, Expo SDK 53+, Expo Router |
| Web | Next.js 15, App Router |
| Shared | TypeScript, Zod v4 |
| Auth | JWT (access + refresh rotation), RBAC |
| i18n | Bengali (default) + English |

## Team

**HomeFIX IT TEAM**

## License

ISC
