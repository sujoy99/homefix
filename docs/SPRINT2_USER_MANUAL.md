# HomeFix — Sprint 2 Mobile: Manual Test Guide

> **Sprint:** Sprint 2 — Home, Navigation & Service Catalog  
> **Covers:** HF-025 · HF-026 · HF-027 · HF-028 · HF-029 · HF-030  
> **Also covers:** HF-030A (My Services modal) · HF-030B (Logout redesign) · HF-030C (Toast system) · HF-030D (Platform Settings) · HF-014B (NID front+back) · HF-014C (Camera policy)  
> **Audience:** QA, Product Owner, Business Stakeholder  
> **Last updated:** 2026-05-29

---

## Part 1 — Environment Setup

See [TESTING_SPRINT1_MOBILE.md](TESTING_SPRINT1_MOBILE.md) Part 1 for backend start, mobile start, and seed instructions. The commands are the same.

### Seed Test Accounts

| Role | Mobile | Password | Notes |
|------|--------|----------|-------|
| **Admin** | `00000000000` | `Admin@1234` | Or Email: `admin@example.com` / `Admin@1234` |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — active, has skills seeded |
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |

---

## Part 2 — Test Checklist by Screen

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Resident Home Screen (HF-026)

> **What to check:** After login as Resident, the home screen shows categories, search bar, and available providers.

**Navigate:** Login as Resident (`01811223344` / `Resident@1234`)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Lands on Home tab after login | Resident Home screen shown (not Provider dashboard) | |
| 2 | Greeting text | "Hi, [Name] 👋" with user's full name | |
| 3 | Subtitle | "What do you need help with today?" | |
| 4 | Search bar visible | Placeholder "Search services..." | |
| 5 | Type in search bar | Category list filters in real time | |
| 6 | Clear search | Full category grid restored | |
| 7 | "Services" section | Grid of service categories from the database | |
| 8 | Category card shows name | Category name in current app language | |
| 9 | "Available Providers" section | Approved providers listed (Rahim Uddin visible) | |
| 10 | Provider card shows name, rating, rate | Correct data from DB | |
| 11 | Switch to Bengali | All labels and category names update | |

---

### Screen 2 — Category Listing Screen (HF-027)

> **What to check:** Tapping a category shows a filtered list of providers with sort options.

**Navigate:** Resident Home → tap any category card

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Category screen opens | Slides over the tab bar (no tab bar visible) | |
| 2 | Screen title | Category name shown in header | |
| 3 | Provider count | "N Providers" shown below title | |
| 4 | Sort chips visible | "Top Rated" · "Most Experienced" · "Lowest Rate" | |
| 5 | "Top Rated" chip active by default | Providers sorted by rating (highest first) | |
| 6 | Tap "Most Experienced" chip | List re-sorts by years of experience | |
| 7 | Tap "Lowest Rate" chip | List re-sorts by hourly rate ascending | |
| 8 | Provider card | Shows: name, availability badge, rating, experience, rate | |
| 9 | Provider is in this category | Only providers with this category as a skill are shown | |
| 10 | Category has no providers | "No providers available for this category yet" message shown | |
| 11 | Tap Back / swipe back | Returns to Resident Home | |

---

### Screen 3 — Provider Detail Screen (HF-028)

> **What to check:** Tapping a provider card shows their full profile with skills, ratings, and a booking CTA.

**Navigate:** Category Listing → tap a provider card

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Provider detail screen opens | Slides over category screen | |
| 2 | Hero card | Provider name, availability status, avatar initial | |
| 3 | Stats bar | Rating / Years Experience / Hourly Rate | |
| 4 | "Book Now" button visible | Yellow/amber CTA button at bottom | |
| 5 | Tap "Book Now" | Alert: "Booking flow coming in Sprint 3" | |
| 6 | "About" section | Bio text shown (or empty if not set) | |
| 7 | "Skills & Services" section | Category chips shown for provider's skills | |
| 8 | Primary skill highlighted | First skill shown with bolder weight | |
| 9 | "Reviews" section | "Reviews coming soon (HF-050)" placeholder | |
| 10 | Tap Back | Returns to category listing | |

---

### Screen 4 — Provider Home Screen / Dashboard (HF-029)

> **What to check:** Provider dashboard shows availability toggle, stats, and placeholder sections.

**Navigate:** Login as Provider (`01711223344` / `Provider@1234`)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Lands on Provider Dashboard after login | Not resident home screen | |
| 2 | Tab bar shows | Home · Jobs · Profile (no Bookings tab) | |
| 3 | Dashboard subtitle | "Here's your dashboard" | |
| 4 | Availability toggle visible | Shows "Availability" label + current status | |
| 5 | Provider is currently available | Toggle is ON; "You are visible to residents" | |
| 6 | Tap toggle to go offline | Toggle turns OFF; "You are hidden from residents" | |
| 7 | Tap toggle again | Toggle turns back ON; visible again | |
| 8 | Toggle failure (no network) | **Red toast banner**: "Could not update availability. Try again." | |
| 9 | Stats cards | Active Jobs · Rating · My Rate placeholders visible | |
| 10 | "Active Jobs" section | Placeholder: "Active jobs will appear here" | |
| 11 | "Earnings" section | Placeholder: "Earnings breakdown coming soon" | |

---

### Screen 5 — Profile Screen (HF-030 + HF-030A + HF-030B)

> **What to check:** Profile screen shows personal info, My Services (provider only), preferences, and logout.

---

#### 5A — Personal Info (all roles)

**Navigate:** Any role → Profile tab (rightmost tab)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Profile tab loads | Avatar circle with name initial, user's full name, role label | |
| 2 | "Personal Information" card | Full Name · Mobile · Email (if set) · Location rows | |
| 3 | Tap Full Name row (ChevronRight visible) | Alert: "Profile editing coming soon (HF-030)" | |
| 4 | Tap Location row | Alert: "Location update coming soon" | |
| 5 | Mobile row | No chevron (read-only) | |
| 6 | Camera icon on avatar | Small camera badge bottom-right of avatar | |
| 7 | Tap camera icon | Alert: "Photo upload coming soon" | |

---

#### 5B — My Services section (provider only, HF-030A)

**Navigate:** Login as Provider → Profile tab

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | "My Services" card visible | Only shown for providers | |
| 2 | Current skills listed | Category name + "Primary" badge on first skill | |
| 3 | "Edit" button (Pencil icon) top-right of card | Visible and tappable | |
| 4 | Tap "Edit" button | Bottom-sheet modal slides up from bottom | |
| 5 | Modal title | "Select Services" | |
| 6 | Modal hint | "Pick at least one service you offer" | |
| 7 | Checklist shows all categories | One row per active category | |
| 8 | Currently assigned categories pre-checked | Checkbox filled with primary color and checkmark | |
| 9 | Tap an unchecked category | Checkbox fills (adds to selection) | |
| 10 | Tap a checked category | Checkbox empties (removes from selection) | |
| 11 | Deselect all categories → tap Save | **Red toast banner**: "Please select at least one service" — modal stays open | |
| 12 | Select 1+ categories → tap Save | Modal closes; My Services list updates immediately | |
| 13 | Tap Cancel | Modal closes; no changes saved | |
| 14 | Provider with no services | "No services yet. Tap Edit to add." in muted text | |
| 15 | Language Bengali | Category names shown in Bengali where available | |

---

#### 5C — Preferences

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | "Preferences" card visible | Language toggle + Dark Mode switch | |
| 2 | Tap Language toggle | App language switches Bengali ↔ English instantly | |
| 3 | Dark Mode switch | Toggle works (UI not fully dark — placeholder) | |

---

#### 5D — Logout button (HF-030B)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Logout appears as a card row | Red icon (LogOut), "Log Out" text in red, chevron arrow | |
| 2 | Style matches InfoRow pattern | Same card and row height as Personal Information rows | |
| 3 | Tap logout row | **Native confirmation dialog** (not a toast): "Are you sure you want to log out?" | |
| 4 | Tap "Cancel" in dialog | Dialog closes, stays on Profile | |
| 5 | Tap "Log Out" in dialog | Logs out → redirects to Login screen | |

---

### Screen 6 — Admin Approvals Screen (HF-025 + HF-023)

> **What to check:** Admin sees Approvals tab instead of Home, with pending provider list and approve/reject actions.

**Navigate:** Login as Admin (`00000000000` / `Admin@1234`)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Tab bar | Only **2 tabs**: "Approvals" (ShieldCheck icon) + "Profile" | |
| 2 | Approvals tab loads | "Pending Approvals" title | |
| 3 | Empty state | "All caught up!" with green checkmark if no pending providers | |
| 4 | Pending provider row | Name · Mobile · Email · Registration date | |
| 5 | Approve button (green) | Confirmation dialog: "Approve [Name]? They will be able to log in..." | |
| 6 | Confirm Approve | Provider removed from list; provider can now log in | |
| 7 | Reject button (red) | Confirmation dialog with destructive style | |
| 8 | Confirm Reject | Provider removed from list; provider account inactive | |
| 9 | Pull to refresh | Pending list refreshes | |

---

## Part 3 — Toast Notification System (HF-030C)

> **What to check:** Errors appear as **red animated banners** — not plain black OS dialogs.  
> Success messages appear **green**. Confirmations still use native OS dialogs.

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | Any API error (login, register, toggle) | **Red banner** slides in from top of screen | |
| 2 | Banner auto-dismisses | Disappears after ~3 seconds without user action | |
| 3 | Validation error in registration | **Red banner** shown; screen does NOT navigate away | |
| 4 | Toggle availability fails | **Red banner**: "Could not update availability. Try again." | |
| 5 | Skill save fails | **Red banner** with localized error | |
| 6 | Logout confirmation | **Native OS dialog** with Cancel/Log Out buttons — NOT a toast | |
| 7 | Admin approve/reject confirmation | **Native OS dialog** — NOT a toast | |
| 8 | Language Bengali | Toast message text in Bengali | |
| 9 | Two quick errors back-to-back | Second banner replaces first (no stacking) | |

---

## Part 4 — Platform Settings (HF-030D / Admin-Configurable)

> **What to check:** `nid_photo_source` platform setting controls NID photo capture method.

### Default setting: `camera_only`

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Provider registration → Step 4 | — | |
| 2 | Tap "NID Photo (Front Side)" | **Camera** opens — not gallery | |
| 3 | Tap "NID Photo (Back Side)" | **Camera** opens — not gallery | |
| 4 | Tap "Profile Photo" | **Gallery** opens (always gallery for profile photo) | |

### To test `camera_and_gallery` (requires DB access):

```sql
UPDATE platform_settings SET value = 'camera_and_gallery' WHERE key = 'nid_photo_source';
```

After changing: restart backend, open provider registration Step 4 — NID photos should now open the gallery.

### To check all valid values:

Open `packages/shared/src/constants/platform-settings.ts` — every setting key and all its valid values are documented there.

---

## Part 5 — Cross-Screen Flows

### Flow A — Resident discovers and views a provider

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Login as Resident | Resident Home screen |
| 2 | Tap a category (e.g. Plumbing) | Category listing opens, tab bar hidden |
| 3 | Sort by "Lowest Rate" | Providers re-sort |
| 4 | Tap a provider card | Provider detail slides in |
| 5 | View provider skills | Category chips shown |
| 6 | Tap "Book Now" | Sprint 3 placeholder message |
| 7 | Tap back twice | Returns to Resident Home |

### Flow B — Provider manages services in Profile

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Login as Provider | Provider Dashboard |
| 2 | Go to Profile tab | Profile screen |
| 3 | Tap "Edit" in My Services | Bottom-sheet modal slides up |
| 4 | Deselect all → Save | Red toast: at least one required |
| 5 | Select 2 services → Save | Modal closes; new list shown |
| 6 | Verify in category listing | Provider appears under newly added category (next app load) |

### Flow C — Full provider onboarding + approval + login

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Register new provider (all 5 steps including NID front + back via camera) | Pending Approval screen |
| 2 | Login as Admin → Approvals tab | New provider in pending list |
| 3 | Tap Approve → confirm | Provider removed from list |
| 4 | Provider logs in | Provider Dashboard (not pending screen) |
| 5 | Provider checks Profile → My Services | Skills from registration shown with Primary badge |
| 6 | Provider opens My Services modal, adds a new category | New category appears in list |

---

## Part 6 — Known Limitations

| What you see | Why | When fixed |
|---|---|---|
| Photo uploads store a local `file://` URI | File upload storage wired in Sprint 3 | Sprint 3 (HF-033) |
| "Book Now" shows a placeholder message | Booking flow is Sprint 3 (HF-034) | Sprint 3 |
| Admin approval shows name/mobile/email only — no NID photos | Full provider detail view with NID/profile photos deferred to Sprint 7 alongside web admin panel (HF-068B) | Sprint 7 |
| Dark mode toggle has no visual effect | Dark mode theme deferred | Sprint 7 |
| Reviews section shows "coming soon" | Review system is Sprint 5 (HF-050) | Sprint 5 |
| Provider dashboard stats show placeholder data | Live stats require booking data (Sprint 3) | Sprint 3 |

---

## Part 7 — Reporting a Bug

When reporting a bug from this checklist, include:

1. **Test case number** — e.g. "Screen 5B, step 11"
2. **What you did** — exact steps
3. **What you expected** — from the "Expected Result" column
4. **What actually happened** — describe or screenshot
5. **Device + OS** — e.g. Samsung Galaxy A54, Android 14
6. **Language** — Bengali or English when the bug occurred
7. **Role** — Admin / Provider / Resident
