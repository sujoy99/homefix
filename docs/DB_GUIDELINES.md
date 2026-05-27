# HomeFix — Database Guidelines

## PostgreSQL Extensions

All required extensions are enabled in the first migration (`20260101000000_enable_extensions.ts`) so they are available in every environment — Docker and non-Docker alike.

| Extension | Purpose |
|-----------|---------|
| `postgis` | `GEOGRAPHY(Point, 4326)` columns and spatial queries |
| `pgcrypto` | `gen_random_uuid()` for primary keys |
| `pg_trgm` | Fuzzy text search on provider names and categories (Sprint 2–3) |

The Docker init script (`docker/init/01_enable_postgis.sql`) also runs `CREATE EXTENSION IF NOT EXISTS postgis` on first postgres container boot — this is belt-and-suspenders for the Docker case and does not affect direct `npm run migrate:latest` runs.

**Never add `CREATE EXTENSION` calls inside table-creation migrations.** Put any new extension requirements in `20260101000000_enable_extensions.ts`.

## Migration Rules

- **File naming:** Knex auto-generates a timestamp prefix — `knex migrate:make <name>`. Name the migration after what it creates/alters: `create_jobs_table`, `add_requires_area_to_categories`, `alter_users_add_short_code`.
- **Never edit** a migration that has been committed and run in any environment. Create a new migration instead.
- **Extension:** `ts` (configured in `knexfile.ts`)
- **Migration location:** `src/db/migrations/`

## Objection.js Model Conventions

```typescript
export class Job extends Model {
  static tableName = 'jobs';       // snake_case table name
  
  // Declare ALL columns as class properties with ! assertion
  id!: string;
  status!: JobStatus;
  created_at!: string;
  
  static relationMappings = {
    // Always use require() for circular relation imports
    resident: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: { from: 'jobs.resident_id', to: 'users.id' },
    },
  };
}
```

- Use `require()` inside `relationMappings` to avoid circular import issues
- Column names match DB column names exactly (snake_case)
- No business logic in models — only `tableName` and `relationMappings`

## Transaction Pattern

Multi-table writes always use a transaction:

```typescript
import { transaction } from 'objection';

// Preferred: use Model.knex() from any bound model
const result = await transaction(User.knex(), async (trx) => {
  const user = await User.query(trx).insert(userData);
  const auth = await AuthAccount.query(trx).insert({ user_id: user.id });
  return { user, auth };
});
```

Pass `trx` to every query inside the transaction. Never mix transactional and non-transactional queries for the same logical write.

## PostGIS Columns

The `users.area` column is `geometry(Point, 4326)`. Rules:

```typescript
// INSERT — always use ST_SetSRID(ST_MakePoint(lng, lat), 4326)
// Note: longitude FIRST, latitude SECOND (PostGIS convention)
area: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [data.longitude, data.latitude])

// SELECT nearby providers (radius in meters)
User.query()
  .whereRaw('ST_DWithin(area::geography, ST_MakePoint(?, ?)::geography, ?)', [lng, lat, radiusMeters])
  .orderByRaw('ST_Distance(area::geography, ST_MakePoint(?, ?)::geography)', [lng, lat])
```

Never store lat/lon as plain floats in the area column — always use the geometry type.

## Index Requirements

Every foreign key column must have an index. For geo-queries, `area` columns need a GiST index:

```typescript
// In migration
table.index('user_id');                             // FK index
table.specificType('area', 'geometry(Point, 4326)');
knex.raw('CREATE INDEX ON users USING GIST (area)'); // Geo index
```

Compound indexes for common filter patterns (e.g., `[user_id, is_revoked]` on `auth_refresh_tokens`).

## Naming Conventions

| Object | Convention | Example |
|--------|-----------|---------|
| Table | plural snake_case | `auth_refresh_tokens` |
| Column | snake_case | `refresh_token_version` |
| FK | `<table_singular>_id` | `user_id`, `job_id` |
| Index | Knex auto-names, or `idx_<table>_<column>` | `idx_jobs_status` |
| Migration | `<timestamp>_<verb>_<object>.ts` | `20260216_create_users_table.ts` |

## Primary Keys

All tables use UUID primary keys generated in PostgreSQL:

```typescript
table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
```

## Soft Deletes

Not implemented yet. When needed, add `deleted_at TIMESTAMPTZ NULL` and filter in repositories — never delete rows for auditable data (jobs, payments, users).
