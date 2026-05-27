# BRD — Booking & Service Discovery

**SRS:** REQ-007 to REQ-014 · **Sprints:** 2, 3

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-007 | Auto-detect Provider GPS on registration and periodically | ⏳ Sprint 5 |
| REQ-008 | Resident can book for a location different from their home | ⏳ Sprint 3 |
| REQ-009 | Resident manually enters service address (house/flat/road/area) | ⏳ Sprint 3 |
| REQ-010 | Resident uploads photos/videos of the issue | ⏳ Sprint 3 |
| REQ-011 | Resident records a voice note describing the issue | ⏳ Sprint 4 |
| REQ-012 | Voice-to-Text converts voice notes to searchable text | ⏳ Sprint 4 |
| REQ-013 | Text-to-Voice: Provider presses button to hear job description aloud | ⏳ Sprint 4 |
| REQ-014 | Resident sets an estimated budget for the job | ⏳ Sprint 3 |

## Location Design

Two distinct location concepts in a booking:
1. **Resident home location** — stored at registration (`users.area`). Used for account, not necessarily for the job.
2. **Service address** — entered at booking time. This is where the provider must go.

Service address is free-form (house, flat, road, area/neighbourhood text) plus optional GPS coordinates. Providers navigate using this address, not the resident's registered location.

REQ-007 (provider GPS tracking) runs periodically in background (Sprint 5 — `expo-location` background task). Stored in `users.area` and used for job feed proximity sorting.

## Booking Flow

```
Resident selects category
  └─→ If category.requires_area = true → prompt for square footage (REQ-006)
Resident describes issue
  ├─→ Text description
  ├─→ Photo/video upload (REQ-010)
  └─→ Voice note (REQ-011) → Speech-to-Text transcript stored (REQ-012)
Resident enters service address (REQ-009)
  └─→ Can use current GPS or manual entry (REQ-008)
Resident sets estimated budget (REQ-014)
Job posted → status = PENDING
```

## Media Storage (REQ-010, REQ-011)

All media (photos, videos, voice notes, NID photos) go through `storage.service.ts` (pluggable interface). Phase 1: local disk `./uploads/`. Phase 2: AWS S3 Mumbai region.

Files stored with UUID filenames to prevent enumeration. NID photos access-controlled (admin only).

Voice notes stored as audio files. The transcript (Speech-to-Text output) is stored as text in `jobs.description` alongside the original voice note URL.

## Text-to-Voice (REQ-013)

Provider job detail screen has a "Read Aloud" button using `expo-speech`. Reads: job description, service address, and estimated budget. Priority: Bengali text (default). Requires TTS language pack check at runtime.

## Category Discovery (Sprint 2)

```
GET /api/v2/categories          # All active categories (with icon, requires_area flag)
GET /api/v2/providers?category=<id>&lat=<lat>&lng=<lng>&radius=<km>
```

Provider listing sorted by distance (PostGIS). Future: filter by rating, availability.
