# BRD — Review & Rating System

**SRS:** REQ-024 to REQ-026 · **Sprint:** 5

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-024 | Residents can only submit a rating after successful payment | ⏳ Sprint 5 |
| REQ-025 | System calculates an aggregate average rating for each Provider | ⏳ Sprint 5 |
| REQ-026 | Completed job cards display the rating given | ⏳ Sprint 5 |

## Business Rules

- Review is **unlocked** only when `job.status = PAID` — not before
- One review per job per resident — no editing after submission
- Rating: integer 1–5 stars (required) + text comment (optional)
- Aggregate rating stored on `users` (provider) and recalculated on every new review
- Provider's average rating is visible on their profile and in job feed results

## Data Model

```
reviews
  id (UUID PK)
  job_id (FK → jobs, UNIQUE)
  resident_id (FK → users)
  provider_id (FK → users)
  rating (SMALLINT, 1–5)
  comment (TEXT, nullable)
  created_at

users.avg_rating (DECIMAL 2,1, nullable — denormalized for query performance)
users.review_count (INT, default 0)
```

`avg_rating` and `review_count` are updated in the same transaction as the review insert:

```sql
UPDATE users
SET avg_rating = (avg_rating * review_count + new_rating) / (review_count + 1),
    review_count = review_count + 1
WHERE id = provider_id;
```

## API Endpoints (HF-047)

```
POST  /api/v2/jobs/:id/review    # Submit review (resident, job must be PAID)
GET   /api/v2/providers/:id/reviews   # Provider's reviews (paginated)
```

## Display Rules

- Completed job cards show: star rating + reviewer name (first name only)
- Provider profile shows: average stars + total review count
- Job feed shows: provider average rating beside their name
