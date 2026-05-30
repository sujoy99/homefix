# BRD — Profile Completion System

**Sprint:** 5 (backend computed endpoint + mobile UI)
**Last updated:** 2026-05-30
**Tickets:** HF-057B (backend) · HF-059B (mobile)

---

## Purpose

Profile completion serves two goals:

1. **Quality signal** — ensures Providers have the minimum information set up before they can operate on the platform (accept jobs, receive payouts).
2. **Trust signal** — both Residents and Providers see their own completion so they understand what HomeFix expects from them.

---

## Provider Profile Completion

### Fields and Weights

| Field | Weight | How Fulfilled | Notes |
|-------|--------|---------------|-------|
| Name + Mobile | 10% | Registration step 1 | Always filled after registration |
| Profile photo | 10% | Registration / Profile edit | Check `profile_photo_url IS NOT NULL` |
| NID front photo | 8% | Registration step 4 | Check `nid_front_url IS NOT NULL` |
| NID back photo | 7% | Registration step 4 | Check `nid_back_url IS NOT NULL` |
| Home location (GPS) | 10% | Registration step 2 | Check `latitude IS NOT NULL AND longitude IS NOT NULL` |
| Skills (min 1) | 15% | Registration step 5 / Profile edit | Check `provider_skills count ≥ 1` |
| Hourly rate set | 10% | Profile edit | Check `hourly_rate IS NOT NULL AND hourly_rate > 0` |
| MFS payment account | 20% | Profile edit (post-approval) | Check `provider_payment_accounts count ≥ 1` |
| Bio / about | 10% | Profile edit | Check `bio IS NOT NULL AND LENGTH(bio) ≥ 20` |
| **Total** | **100%** | | |

### Minimum Threshold: 70%

A Provider at 70% has completed: name, mobile, photo, NID, location, skills, and rate. The only optional items below 70% are: MFS account (20%) and bio (10%). However, the MFS account is intentionally worth 20% so that a Provider **cannot reach 70% without it** if they skip any registration field.

**What 70% means in practice:**
- Registration fills: name + mobile (10) + photo (10) + NID front+back (15) + location (10) + skills (15) = **60%**
- Provider must add at least one of: rate (10%) or MFS account (20%) to reach 70%
- To withdraw, they need MFS account (20%) → they must also have rate set (10%) to hit 70%, which is reasonable

### Actions Gated by Threshold

| Action | Below 70% | At or Above 70% |
|--------|-----------|-----------------|
| Browse job feed | ✅ Allowed | ✅ Allowed |
| Accept a job | ❌ Blocked — error toast + redirect to Profile | ✅ Allowed |
| Request withdrawal | ❌ Blocked — API returns `403` with `PROFILE_INCOMPLETE` error code | ✅ Allowed |
| Mark work complete | ✅ Allowed (if already accepted before threshold enforcement) | ✅ Allowed |

### Persistent In-App Notification (Provider)

When a Provider's completion is below 70%, they see a **persistent yellow banner** on both their Home screen and Profile screen:

```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Complete your profile to accept jobs             │
│     You're 60% complete — 2 items remaining         │
│     [Complete now →]                                │
└─────────────────────────────────────────────────────┘
```

- Banner appears at the top of the Provider Home screen (above job feed) and Profile screen
- Tapping "Complete now →" scrolls to the Profile screen completion card
- Banner disappears the moment completion reaches 70% (re-computed on each screen load)
- This is an **in-app UI element**, not a push notification

---

## Resident Profile Completion

### Fields and Weights

| Field | Weight | How Fulfilled | Notes |
|-------|--------|---------------|-------|
| Name + Mobile | 20% | Registration step 1 | Always filled after registration |
| Profile photo | 20% | Profile edit | Check `profile_photo_url IS NOT NULL` |
| Home location (GPS) | 20% | Registration step 2 | Check `latitude IS NOT NULL AND longitude IS NOT NULL` |
| Email address | 20% | Registration step 3 | Check `email IS NOT NULL` |
| Home area / address text | 20% | Registration step 2 | Check `address IS NOT NULL AND LENGTH(address) ≥ 5` |
| **Total** | **100%** | | |

### Threshold: Informational Only

- No action is gated for Residents
- Completion percentage is shown as a progress bar on their Profile screen
- "Complete your profile" CTA lists the missing items
- No persistent banner on Resident Home screen (does not block their workflow)

---

## API Design

### Endpoint

```
GET /v2/users/me/profile-completion
Authorization: Bearer <token>

Response 200:
{
  "percentage": 60,
  "meets_threshold": false,           // always false for Resident (no threshold action)
  "threshold": 70,                    // null for Resident
  "missing_items": [
    { "key": "mfs_account",   "label_key": "profile.completion.mfs_account",   "weight": 20 },
    { "key": "bio",           "label_key": "profile.completion.bio",            "weight": 10 },
    { "key": "hourly_rate",   "label_key": "profile.completion.hourly_rate",    "weight": 10 }
  ],
  "completed_items": [
    { "key": "name_mobile",   "label_key": "profile.completion.name_mobile",   "weight": 10 },
    { "key": "profile_photo", "label_key": "profile.completion.profile_photo", "weight": 10 },
    ...
  ]
}
```

- Computed live from the current DB state — no stored column, no trigger
- Called once per Profile screen mount and once per Provider Home screen mount
- Also embedded in `GET /v2/users/me` response as `profile_completion: { percentage, meets_threshold }` (summary only — no item list) so the home screen does not need a second request

### Error Response When Action Gated

When a Provider below 70% calls `POST /v2/jobs/:id/accept` or `POST /v2/providers/wallet/withdraw`:

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_INCOMPLETE",
    "message": "Complete your profile to perform this action",
    "meta": {
      "percentage": 60,
      "threshold": 70,
      "missing_items": ["mfs_account", "hourly_rate"]
    }
  }
}
```

Mobile reads `PROFILE_INCOMPLETE` error code and shows a toast + navigates to Profile screen.

---

## UI — Profile Completion Card

Shown at the **top of the Profile tab screen** for both Providers and Residents.

```
┌──────────────────────────────────────────────────────┐
│  Your profile is 60% complete                        │
│  ████████████░░░░░░░░  60%                           │
│                                                      │
│  Missing:                                            │
│  ○  MFS payment account  (+20%)                      │
│  ○  Hourly rate           (+10%)                     │
│  ○  Bio / about           (+10%)                     │
│                                                      │
│  [Complete your profile]                             │
└──────────────────────────────────────────────────────┘
```

- Progress bar uses the primary teal color (`#0D9488`) for filled portion
- Missing items listed with their weight so the Provider knows the impact
- Tapping an item deep-links to the relevant edit section within the profile screen
- Card is hidden entirely once Provider reaches 100% (or once Resident reaches 100%)
- Card remains visible but with no action-gate messaging for Residents below 100%

---

## Implementation Notes

- **Computed live** — `profileCompletionService.compute(userId, role)` queries all relevant tables in a single joined query; no stored column or trigger needed. Profile updates are infrequent; this adds negligible latency.
- **No caching** — Always reflect the live state. A Provider who just added their MFS account must immediately see their banner disappear.
- **i18n keys** — all `missing_items[].label_key` values map to both `bn.json` and `en.json` under the `profile.completion.*` namespace.
- **Role-aware** — the same endpoint returns role-appropriate fields. Backend reads `user.role` from the JWT and applies the correct weight table.

---

## New Tickets

| Ticket | Platform | Title | Sprint |
|--------|----------|-------|--------|
| HF-057B | Backend | Profile completion API — computed endpoint + `PROFILE_INCOMPLETE` guard on accept-job and withdraw | 5 |
| HF-059B | Mobile | Profile completion card on Profile screen (both roles) + persistent Provider home banner + `PROFILE_INCOMPLETE` error handling | 5 |
