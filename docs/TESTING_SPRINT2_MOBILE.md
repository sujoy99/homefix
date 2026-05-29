# HomeFix — Sprint 2 Mobile: Manual Test Guide

> **Sprint:** Sprint 2 — Home, Navigation & Service Catalog  
> **Covers:** HF-025 · HF-026 · HF-027 · HF-028 · HF-029 · HF-030  
> **Audience:** QA, Product Owner, Business Stakeholder  
> **Last updated:** 2026-05-29 (v2 — bug fixes: availability toggle, extra tabs, provider skills flow)

---

## Part 1 — Environment Setup

### Step 1 — Find your Windows WiFi IP

Open **Command Prompt** (or PowerShell) on Windows and run:

```
ipconfig
```

Look for the **Wi-Fi adapter** section. Copy the **IPv4 Address** — e.g. `192.168.0.102`.  
You will use this IP in every command below. Write it down.

---

### Step 2 — Start the backend

Open a **WSL2 terminal** and run from the repo root:

```bash
# First time only (builds images, runs migrations, starts server)
make up

# Every time after the first
make start
```

Wait until you see:
```
backend  | HomeFix API running on port 4000
```

If the category grid is empty when you test, run this **once** to load seed data:

```bash
make seed
```

> Seed loads: 10 service categories (Bengali + English), roles, permissions, and the default admin user.

---

### Step 3 — Start the mobile app

Open a **second WSL2 terminal** and run:

```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<your-windows-wifi-ip> npx expo start --host lan
```

Replace `<your-windows-wifi-ip>` with the IP you found in Step 1. Example:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.102 npx expo start --host lan
```

A QR code will appear in the terminal.

---

### Step 4 — Open the app on your phone

1. Install **Expo Go** from the Play Store or App Store
2. Make sure your phone is on the **same WiFi network** as your Windows machine
3. Open Expo Go → **Scan QR code** → point at the terminal QR
4. The app will load on your phone

> **Alternative:** Open `http://localhost:8081` in a browser on Windows to test on a web browser.

---

### Test accounts

All accounts below are created by `make seed` and are ready to use immediately:

| Role | Mobile | Password | Notes |
|------|--------|----------|-------|
| **Admin** | `00000000000` | `Admin@1234` | Use Email tab: `admin@example.com` |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — has profile + 2 skills, available |
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |

> **To register new accounts:** Select role on the Register screen. Provider registration includes a **Step 5: My Services** where you pick your service categories before submitting.  
> New providers land on "Pending Approval" after registration. Use the Admin account + DB tools to approve them, or use the pre-seeded provider above.

---

## Part 2 — Test Checklist by Screen

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Tab Navigation Bar (HF-025)

> **What to check:** The bottom bar shows the correct tabs for each role.

**As a Resident:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Log in as Resident | Bottom bar appears with 3 tabs | |
| 2 | Check tab labels | **Home · Bookings · Profile** (in the active language) | |
| 3 | Tap **Home** | Highlighted blue, shows home screen | |
| 4 | Tap **Bookings** | Highlighted blue, shows bookings placeholder | |
| 5 | Tap **Profile** | Highlighted blue, shows profile screen | |
| 6 | "Jobs" tab | Must **not** be visible for a Resident | |

**As a Provider:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 7 | Log in as approved Provider | Bottom bar appears with 3 tabs | |
| 8 | Check tab labels | **Home · Jobs · Profile** | |
| 9 | "Bookings" tab | Must **not** be visible for a Provider | |

**Language check:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 10 | Go to Profile → toggle language to Bengali | Tab labels switch to বাংলা: **হোম · বুকিং · প্রোফাইল** | |
| 11 | Toggle back to English | Labels switch back to English | |

---

### Screen 2 — Resident Home Screen (HF-026)

> **What to check:** The main discovery screen for Residents.

**Navigate:** Log in as Resident → **Home tab**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Open Home tab | Personalised greeting "Hi, [Your Name] 👋" | |
| 2 | Category grid | Shows service cards in a 3-column grid with icons | |
| 3 | Category icons | Each category has a relevant icon (water drop = plumbing, bolt = electrical, etc.) | |
| 4 | Search bar | Placeholder text "Search services..." visible | |
| 5 | Type "plumb" in search | Grid filters to show only Plumbing | |
| 6 | Type in Bengali "প্লাম" | Grid filters by Bengali name (if category has Bengali name) | |
| 7 | Clear the search | All categories return | |
| 8 | "Available Providers" section | Shows up to 5 providers with name, star rating, experience | |
| 9 | No providers in DB | Section shows "No providers available right now" | |
| 10 | Tap a category card | Navigates to Category Listing screen | |
| 11 | Tap a provider card | Navigates to Provider Detail screen | |

---

### Screen 3 — Category Listing Screen (HF-027)

> **What to check:** List of providers for a specific service category.

**Navigate:** Home → tap any category (e.g. Plumbing)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Header | Shows the tapped category name (e.g. "Plumbing") | |
| 2 | Back button | Returns to Home screen | |
| 3 | Provider list | Shows only providers who offer this category | |
| 4 | Provider card info | Name, star rating, years of experience, hourly rate, review count | |
| 5 | Hourly rate missing | Shows "Negotiable" instead of a rate | |
| 6 | "Top Rated" sort chip | Default active chip (blue); list sorted highest rating first | |
| 7 | Tap "Most Experienced" | Chip turns blue, list re-sorts by most years of experience first | |
| 8 | Tap "Lowest Rate" | List re-sorts by cheapest hourly rate first | |
| 9 | No providers for category | Shows "No providers available for this category yet" | |
| 10 | Tap a provider | Navigates to Provider Detail screen | |

---

### Screen 4 — Provider Detail Screen (HF-028)

> **What to check:** Full public profile of a provider, and the Book Now button.

**Navigate:** Any provider card → Provider Detail

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Header | "Provider Profile" title + back button | |
| 2 | Avatar | Large circle with provider's name initial | |
| 3 | Name & rating | Provider's full name + star rating + review count | |
| 4 | Available badge | Green "Available now" badge (only if provider is currently available) | |
| 5 | Stats bar | 3 blocks: Years Experience · Hourly Rate · Total Reviews | |
| 6 | About section | Provider's bio text (hidden if no bio entered) | |
| 7 | Skills & Services | Chips showing all categories the provider offers (e.g. "Plumbing", "General Repair") | |
| 8 | Reviews section | Shows "Reviews coming soon" placeholder | |
| 9 | "Book Now" button | Amber/yellow button fixed at bottom of screen | |
| 10 | Tap "Book Now" | Alert appears: "Booking flow coming in Sprint 3" | |
| 11 | Back button | Returns to previous screen | |
| 12 | Scroll | Bio, skills, reviews all accessible by scrolling | |

---

### Screen 5 — Provider Home / Dashboard (HF-029)

> **What to check:** The dashboard a Provider sees when they tap the Home tab.

**Navigate:** Log in as approved Provider → **Home tab**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Home tab content | Shows **dashboard** (not the category grid that Residents see) | |
| 2 | Greeting | "Hi, [Provider Name] 👋" | |
| 3 | Subtitle | "Here's your dashboard" | |
| 4 | Availability card | Shows a Switch (toggle) with label "Availability" | |
| 5 | Availability status text | ON → "You are visible to residents" / OFF → "You are hidden from residents" | |
| 6 | Flip the toggle ON | Switch moves to ON, status text updates, saved to server | |
| 7 | Flip the toggle OFF | Switch moves to OFF, status text updates, saved to server | |
| 8 | Stat card — Active Jobs | Shows "0" (no jobs yet — Sprint 3) | |
| 9 | Stat card — Rating | Shows the provider's star rating from the database | |
| 10 | Stat card — My Rate | Shows the hourly rate, or "—" if not set | |
| 11 | Active Jobs section | Shows "Active jobs will appear here" + HF-038 placeholder | |
| 12 | Earnings section | Shows "Earnings breakdown coming soon" + HF-060 placeholder | |
| 13 | Verify toggle persists | Flip toggle, go to another tab and back — toggle is still in the position you set | |

---

### Screen 6 — Profile Screen (HF-030)

> **What to check:** Profile screen available to both Residents and Providers.

**Navigate:** **Profile tab** (bottom navigation)

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Avatar | Large circle with your name's first letter | |
| 2 | Camera button | Small amber camera icon overlays the avatar | |
| 3 | Tap camera button | Alert: "Photo upload coming soon" | |
| 4 | Name displayed | Your full name below the avatar | |
| 5 | Role displayed | "Resident" or "Service Provider" below your name | |
| 6 | Personal Info card | Shows: Full Name · Mobile Number · Email (if set) · Location | |
| 7 | Tap Full Name row | Alert: "Profile editing coming soon (HF-030)" | |
| 8 | Mobile number | Read-only — no tap action | |
| 9 | Tap Location row | Alert: "Location update coming soon" | |
| 10 | Language toggle | Shows current language, tapping switches the whole app | |
| 11 | Toggle to Bengali | **Every screen**, **every label** in the app switches to Bengali | |
| 12 | Toggle back to English | Full app switches back to English | |
| 13 | Dark mode switch | Switch is present but toggles only the UI control (full theme in Sprint 8) | |
| 14 | Log Out button | "Log Out" button with arrow icon, at the bottom | |
| 15 | Tap Log Out | **Confirmation dialog** appears: "Are you sure you want to log out?" | |
| 16 | Tap "Cancel" in dialog | Dialog closes, user stays on Profile | |
| 17 | Tap "Log Out" in dialog | App logs out and returns to Login screen | |

---

---

### Screen 7 — Provider Registration: Step 5 Skills Picker (Bug Fix c)

> **What to check:** When registering as a Provider, step 5 lets you select which services you offer. These are saved immediately when the account is created.

**Navigate:** Register → Select "Service Provider" → complete Steps 1–4 → arrives at Step 5

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Reach Step 5 | Screen titled "My Services" with a grid of service category chips | |
| 2 | No selection, tap "Complete" | Error alert: "Please select at least one service" | |
| 3 | Tap "Plumbing" chip | Chip gets a blue border + checkmark, highlighted background | |
| 4 | Tap "Electrical" chip | Second chip also selected | |
| 5 | Tap a selected chip again | Chip deselects (border goes grey) | |
| 6 | Select 1+ categories, tap "Complete" | Registration submits, lands on Pending Approval screen | |
| 7 | After admin approves + provider logs in → Profile tab | "My Services" card shows the categories selected at registration | |
| 8 | Progress bar | Shows 5 steps for Provider (5 / 5 on last step) | |

---

### Screen 8 — Provider Profile: My Services Management (Bug Fix c)

> **What to check:** Approved providers can add and remove service categories from their Profile tab.

**Navigate:** Log in as Provider (01711223344) → **Profile tab** → scroll to "My Services" section

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Profile tab | "My Services" card appears (providers only — residents don't see this) | |
| 2 | Pre-seeded provider | Shows 2 skill chips from seed (first one has ★ = primary) | |
| 3 | Tap **+** button | Alert appears: "Add a Service" with list of categories not yet added | |
| 4 | Tap a category in the alert | New skill chip appears immediately | |
| 5 | Tap **+** when all categories added | Alert: "You have already added all available service categories" | |
| 6 | Tap **X** on a chip | Chip disappears (skill removed) | |
| 7 | After adding/removing, go to Home → search category | Provider now appears / disappears in that category's listing | |
| 8 | Primary skill chip | Shown with filled blue background + ★ symbol | |

---

### Screen 9 — Tab Bar: No Extra Tabs (Bug Fix b)

> **What to check:** Only the correct tabs appear — no `category/[id]` or `provider/[id]` visible.

**Navigate:** Log in as either role → check the bottom tab bar

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Log in as Resident | Tab bar shows exactly 3 tabs: Home · Bookings · Profile | |
| 2 | Log in as Provider | Tab bar shows exactly 3 tabs: Home · Jobs · Profile | |
| 3 | No extra tabs | No "category [id]" or "provider [id]" tab visible | |

---

### Screen 10 — Availability Toggle (Bug Fix a)

> **What to check:** Provider can flip availability ON/OFF and it saves correctly.

**Navigate:** Log in as Provider (01711223344) → **Home tab**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Home tab | Availability card shows current status + Switch control | |
| 2 | Toggle is ON | Text: "You are visible to residents" | |
| 3 | Flip toggle OFF | Switch moves to OFF, text changes to "You are hidden from residents" | |
| 4 | Go to another tab and back | Toggle stays OFF (persisted to server) | |
| 5 | Log out and log back in | Toggle shows the last saved state | |
| 6 | While OFF: open Resident app (01811223344), go to Home | Provider does not appear in "Available Providers" section | |
| 7 | Flip toggle back ON | Provider reappears in Resident's home screen after refresh | |
| 8 | New provider (no profile yet) | Toggle still works — profile auto-created on first toggle | |

---

## Part 3 — Cross-Screen Flows

These tests span multiple screens and verify the full user journey.

### Flow A — Resident discovers and views a provider

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in as Resident | Lands on Home tab with category grid |
| 2 | Tap "Electrical" category | Goes to Electrical providers list |
| 3 | Tap "Most Experienced" sort | List re-sorts |
| 4 | Tap first provider | Goes to Provider Detail |
| 5 | Scroll down | Skills, bio, reviews placeholder visible |
| 6 | Tap "Book Now" | Alert: coming in Sprint 3 |
| 7 | Press back | Returns to Electrical listing |
| 8 | Press back again | Returns to Home |

### Flow B — Provider manages availability

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in as Provider | Lands on Provider Dashboard |
| 2 | Note the availability toggle state | ON or OFF |
| 3 | Flip the toggle | State changes + saved to backend |
| 4 | Navigate to Profile tab | Profile loads |
| 5 | Navigate back to Home tab | Toggle is still in the position you set |

### Flow C — Language switch mid-session

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in as Resident (app in Bengali) | All text in Bengali |
| 2 | Go to Profile → toggle to English | Entire app switches instantly |
| 3 | Go back to Home | Greeting, search bar, category names — all in English |
| 4 | Open Category Listing | Sort chips, labels — in English |
| 5 | Toggle back to Bengali on Profile | App switches back |

### Flow D — Logout and re-login

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to Profile tab | Profile screen visible |
| 2 | Tap "Log Out" | Confirmation dialog appears |
| 3 | Confirm logout | Returns to Login screen |
| 4 | Log back in | Returns to the correct Home screen for your role |

---

## Part 4 — Known Placeholders (Not Bugs)

These items are **intentionally incomplete** — they are built in later sprints.

| What you see | This is expected | Built in |
|---|---|---|
| "Book Now" shows a coming-soon alert | Booking flow not built yet | Sprint 3 (HF-034) |
| Active Jobs shows placeholder text | Job feed not built yet | Sprint 3 (HF-038) |
| Bookings tab shows placeholder | Booking list not built yet | Sprint 3 (HF-037) |
| Jobs tab shows placeholder | Provider job feed not built yet | Sprint 3 (HF-038) |
| Reviews says "coming soon" | Reviews module not built yet | Sprint 5 (HF-050) |
| Earnings shows placeholder | Wallet/payments not built yet | Sprint 6 (HF-060) |
| Dark mode switch has no effect | Full theme switching in Sprint 8 | Sprint 8 |
| Photo upload shows "coming soon" | File upload wired in Sprint 3 | Sprint 3 (HF-033) |
| Location update shows "coming soon" | Full edit form in Sprint 3 | Sprint 3 |
| Admin sees dashboard with pending list, not category grid | Admin has a dedicated minimal dashboard | ✅ Built |
| Provider name shows "—" on dashboard | `full_name` not joined in `/me/profile` response yet | Sprint 3 |
| Category listing empty for new provider | Provider must add skills via Profile → My Services first | ✅ Now available |

---

## Part 5 — Reporting a Bug

When reporting a bug from this checklist, please include:

1. **Test case number** — e.g. "Screen 3, step 7"
2. **What you did** — exact steps
3. **What you expected** — from the "Expected Result" column
4. **What actually happened** — describe or screenshot
5. **Device + OS** — e.g. Samsung Galaxy A54, Android 14
6. **Language** — Bengali or English when the bug occurred
