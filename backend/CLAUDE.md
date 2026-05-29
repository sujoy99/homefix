# CLAUDE.md — Backend

This file provides backend-specific guidance. See root [CLAUDE.md](../CLAUDE.md) for global rules.

## Layer Pattern

Every module under `src/modules/<name>/` must follow this strict layering:

```
Route → Controller → Service → Repository → Model (DB)
```

- **Controller** — only reads `req`, calls service, calls `HttpResponse`. No business logic.
- **Service** — business logic only. No `req`/`res`. No Knex calls directly.
- **Repository** — all DB queries via Objection.js. No business rules.
- **Model** — Objection.js `tableName` + `relationMappings` only.
- **Schema** — Zod validation schemas used by `validate()` middleware.

## Adding a New Module

Checklist for every new domain (e.g., `jobs`, `categories`):

1. Create `src/modules/<name>/` with: `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.model.ts`, `*.schema.ts`, `*.dto.ts`, `*.types.ts`
2. Register the router in `src/routes/v2/index.ts`
3. Add a DB migration in `src/db/migrations/`
4. Add any new `ErrorCode` entries to `src/errors/error-code.ts`
5. Wrap controller methods with `asyncHandler` from `src/utils/async-handler.ts`
6. Add OpenAPI JSDoc comments to every route

## Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@config/*` | `src/config/*` |
| `@utils` | `src/utils/index.ts` |
| `@utils/*` | `src/utils/*` |
| `@modules/*` | `src/modules/*` |
| `@errors/*` | `src/errors/*` |
| `@http/*` | `src/http/*` |
| `@logger/*` | `src/logger/*` |
| `@middlewares/*` | `src/middlewares/*` |
| `@routes/*` | `src/routes/*` |

## Response Pattern

Always use `HttpResponse` — never call `res.json()` directly.

```typescript
// Success (200)
HttpResponse.success(res, data, 'Message');

// Created (201)
HttpResponse.success(res, data, 'Created', 201);

// Paginated
HttpResponse.paginated(res, items, page, limit, total);

// Error (throw from service — let errorHandler catch it)
throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'User not found');
throw new ValidationError(ErrorCode.VALIDATION_ERROR, 'Invalid input', fieldErrors);
```

## Error Pattern

Throw `AppError` subclasses from `src/errors/http-errors.ts`. The global `errorHandler` catches them all. Controllers never try/catch — wrap them with `asyncHandler`.

```typescript
// ✅ Good — throw from service
throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS, 'Invalid credentials');

// ❌ Bad — manual res.status() in controller
res.status(401).json({ message: 'Invalid' });
```

UniqueViolationError from Knex is automatically mapped in `errorHandler` — no manual catch needed.

## Auth Guards

```typescript
// Require valid access token → attaches req.user: JwtPayload
router.get('/profile', authGuard, asyncHandler(controller));

// Require token + specific permissions
router.get('/admin', authGuard, permissionGuard(Permission.ADMIN_DASHBOARD_VIEW), asyncHandler(controller));
```

`authGuard` is stateless (no DB call). `permissionGuard` checks `ROLE_PERMISSIONS[role]` in memory.

## Database Patterns

```typescript
// Single insert
const user = await User.query().insert(data);

// Transaction (always use for multi-table writes)
const result = await transaction(User.knex(), async (trx) => {
  const user = await User.query(trx).insert(userData);
  const auth = await AuthAccount.query(trx).insert({ user_id: user.id });
  return { user, auth };
});

// Eager load relations
const user = await User.query().findById(id).withGraphFetched('authAccounts');
```

## Transaction & Rollback Rules

**Rule:** Any service method that writes to **more than one table** — or that is a critical state transition (status machine) — MUST use an Objection.js transaction. The `asyncHandler` + global `errorHandler` provide the try-catch; transaction rollback is automatic on throw.

**Repository pattern** — accept an optional `trx` on every write method so the caller can compose them into one transaction:

```typescript
// ✅ Repository method — accepts optional trx
import { TransactionOrKnex } from 'objection';

static async create(data: CreateInput, trx?: TransactionOrKnex): Promise<MyModel> {
  return MyModel.query(trx).insertAndFetch(payload);
}

static async updateStatus(id: string, status: string, trx?: TransactionOrKnex): Promise<MyModel | undefined> {
  return MyModel.query(trx).patchAndFetchById(id, { status });
}
```

**Service pattern** — own the transaction boundary:

```typescript
// ✅ Service method — wraps multi-table writes in a transaction
import { transaction } from 'objection';
import { MyModel } from './my.model';

static async doSomething(data: Input): Promise<Result> {
  // Validation / guards BEFORE the transaction (avoids holding locks)
  const related = await OtherRepository.findById(data.related_id);
  if (!related) throw new NotFoundError(...);

  return transaction(MyModel.knex(), async (trx) => {
    const record = await MyRepository.create(data, trx);
    await AnotherRepository.create({ record_id: record.id, ... }, trx);
    return record;
  });
}
```

**When to use a transaction:**
- Writing to 2+ tables in a single operation
- Critical state-machine transitions (job status, payment status)
- Any "create + link" pattern (e.g., job + media records)

**When NOT to use a transaction:**
- Read-only queries (even across multiple tables)
- Single-table writes with no related side effects

## Environment Variables

Required variables (throw at startup if missing) use `required()` from `@utils/env-handler`. Optional ones use `process.env.X ?? 'default'`. All env config is in `src/config/env.ts` — never read `process.env` directly outside of that file.

```typescript
// ✅ Good
import { env } from '@config/env';
env.jwtAccessSecret;

// ❌ Bad
process.env.JWT_ACCESS_SECRET;
```

## Forbidden Patterns

- No `res.json()` / `res.status()` calls — use `HttpResponse`
- No `try/catch` in controllers — use `asyncHandler` wrapper
- No business logic in repositories
- No Knex calls in services — use repository methods
- No `process.env` reads outside `src/config/env.ts`
- Never store plain passwords — always `bcrypt.hash(password, 12)`
- No `any` type without a comment explaining why
