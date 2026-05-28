# HomeFix — API Guidelines

## Versioning Policy

- `/api/v1` — legacy, do not add new endpoints here
- `/api/v2` — active version, all new features go here
- When a breaking change is needed, create a `/api/v3` route file and keep v2 working

## Response Envelope

Every response — success or error — uses this shape:

```typescript
// Success
{
  "http_code": 200,
  "message": "Login successful",
  "body": { ...data }
}

// Created
{
  "http_code": 201,
  "message": "User registered successfully",
  "body": { ...data }
}

// Paginated
{
  "http_code": 200,
  "message": "Success",
  "body": {
    "items": [...],
    "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
  }
}

// Error
{
  "http_code": 401,
  "error_code": "INVALID_CREDENTIALS",
  "message": "Invalid credentials",
  "body": null
}

// Validation error
{
  "http_code": 400,
  "error_code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "body": null,
  "errors": [
    { "field": "mobile", "message": "Mobile must be 11 digits" }
  ]
}
```

## Error Codes for Frontend

The `error_code` field maps to a specific frontend action. Frontend should switch on `error_code`, not `message` (messages can change).

| error_code | Frontend action |
|------------|----------------|
| `TOKEN_EXPIRED` | Auto-refresh token, retry request |
| `SESSION_EXPIRED` | Force logout, redirect to login |
| `REFRESH_TOKEN_REUSED` | Force logout (security alert) |
| `ACCOUNT_NOT_APPROVED` | Show "pending approval" screen |
| `ACCOUNT_LOCKED` | Show lockout message with retry time |
| `VALIDATION_ERROR` | Show field errors inline |
| `ALREADY_EXISTS` | Show duplicate field message |
| `RESOURCE_NOT_FOUND` | Show 404 UI |

## Route Validation

Every mutation route (POST/PUT/PATCH) must use the `validate()` middleware with a Zod schema:

```typescript
// Route file
router.post('/register', validate(userRegistrationSchema), asyncHandler(controller.register));

// Schema file — always wrap in { body: z.object({...}) }
export const userRegistrationSchema = z.object({
  body: z.object({
    full_name: z.string().min(3),
    mobile: z.string().regex(/^[0-9]{11}$/),
  })
});
```

The schema keys `body`, `query`, `params` match the Express request properties validated.

## Swagger Annotations

Every route must have an `@openapi` JSDoc comment. Required fields:

```typescript
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: One-line description
 *     tags: [Auth]          ← must match a defined tag
 *     requestBody:          ← for mutations
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             ...
 *     responses:
 *       200:
 *         description: Success case
 *       400:
 *         description: Validation error
 *       401:
 *         description: Auth error
 */
```

Reference shared schemas with `$ref: '#/components/schemas/ApiErrorResponse'` and `$ref: '#/components/schemas/ApiSuccessResponse'` where appropriate.

## Pagination

Use offset-based pagination for admin list endpoints, cursor-based for provider job feeds (high-volume, append-only). Query params: `page` (1-indexed), `limit` (default 10, max 100).

## Rate Limiting

Global rate limiter is in `src/middlewares/rate-limiter.ts`. Auth endpoints (login, register) must also have a per-IP rate limiter to prevent brute force.
