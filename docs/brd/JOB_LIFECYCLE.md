# BRD — Job Lifecycle

**SRS:** REQ-015 to REQ-018 · **Sprint:** 3

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-015 | Providers see a feed of available jobs matching their trade (category) | ⏳ Sprint 3 |
| REQ-016 | Provider accepting a job changes status to `ACTIVE` | ⏳ Sprint 3 |
| REQ-017 | Provider marking work done changes status to `AWAITING_PAYMENT` | ⏳ Sprint 3 |
| REQ-018 | Resident cannot pay until status is `AWAITING_PAYMENT` | ⏳ Sprint 3 |

## Job State Machine

```
PENDING
  │  Resident posts job (selects category, adds description/photos/voice/address/budget)
  ↓
ACTIVE
  │  Provider accepts job from feed
  ↓
AWAITING_PAYMENT
  │  Provider marks work complete
  ↓
PAID
     Resident pays → commission engine runs → wallet credited
```

Invalid state transitions return `400 BAD_REQUEST`. The service layer enforces transitions — the DB column is the source of truth.

**Cancellation (future):** Resident or Provider can cancel a `PENDING` job. `ACTIVE` cancellation requires a reason and admin review.

## Job Data Model

```
jobs
  id (UUID PK)
  resident_id (FK → users)
  provider_id (FK → users, nullable until accepted)
  category_id (FK → service_categories)
  status: pending | active | awaiting_payment | paid | cancelled
  title (optional — auto-generated from category if not provided)
  description (text)
  voice_note_url (nullable — S3/local path)
  media_urls (JSONB array of photo/video paths)
  service_address (JSONB: house, flat, road, area)
  service_lat / service_lon (where work happens — may differ from resident home)
  estimated_budget (decimal, nullable — REQ-014)
  square_footage (decimal, nullable — when category.requires_area = true)
  created_at, updated_at

service_categories
  id (UUID PK)
  name (bilingual: { bn, en })
  icon_name
  requires_area (boolean — REQ-006)
  is_active (boolean)
  created_by_admin_id
```

## Provider Job Feed (REQ-015)

- Filter by `category_id` matching provider's skills/trades
- Filter by proximity (PostGIS `ST_DWithin`) — jobs within provider's service radius
- Sort by distance (nearest first)
- Only show `status = PENDING` jobs
- Pagination: cursor-based (high-volume, real-time updates)

## Business Rules

- A `PENDING` job with no provider for 24h should re-notify nearby providers (Sprint 5)
- Provider can only accept if their account `status = active` (admin-approved)
- One provider per job (no bidding in MVP)
- Service address (REQ-009) is separate from the resident's registered home location (REQ-008)
- `square_footage` is required at booking time if `service_categories.requires_area = true` (REQ-006)

## API Endpoints (Sprint 3 — HF-031)

```
POST   /api/v2/jobs                    # Resident creates job
GET    /api/v2/jobs/feed               # Provider job feed (auth + role:provider)
PATCH  /api/v2/jobs/:id/accept         # Provider accepts (PENDING → ACTIVE)
PATCH  /api/v2/jobs/:id/complete       # Provider marks done (ACTIVE → AWAITING_PAYMENT)
GET    /api/v2/jobs/:id                # Job detail
GET    /api/v2/jobs                    # Resident's own jobs list
```
