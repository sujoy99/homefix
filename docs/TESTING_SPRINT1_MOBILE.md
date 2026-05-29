# HomeFix — Sprint 1 Mobile: Manual Test Guide

> **Sprint:** Sprint 1 — Authentication Screens  
> **Covers:** HF-012 · HF-013 · HF-014 · HF-015 · HF-016 · HF-017 · HF-018 · HF-019  
> **Also covers:** HF-020C (language toggle) · HF-020D (localized errors) · HF-020E (GPS map)  
> **Provider skills step added in Sprint 2 bug fix**  
> **Audience:** QA, Product Owner, Business Stakeholder  
> **Last updated:** 2026-05-29

---

## Part 1 — Environment Setup

### Step 1 — Find your Windows WiFi IP

Open **Command Prompt** (or PowerShell) on Windows and run:

```
ipconfig
```

Look for the **Wi-Fi adapter** section. Copy the **IPv4 Address** — e.g. `192.168.0.102`.

---

### Step 2 — Start the backend

Open a **WSL2 terminal** and run from the repo root:

```bash
# First time only
make up

# Every time after the first
make start
```

Wait until you see:
```
backend  | HomeFix API started {"env":"development","port":4000}
```

Then seed reference data (run **once** on a fresh database):

```bash
make seed
```

---

### Step 3 — Start the mobile app

Open a **second WSL2 terminal**:

```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<your-windows-wifi-ip> npx expo start --host lan
```

Example:
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.102 npx expo start --host lan
```

Open **Expo Go** on your phone (same WiFi) and scan the QR code.

---

### Seed Test Accounts

| Role | Mobile | Password | Notes |
|------|--------|----------|-------|
| **Admin** | `00000000000` | `Admin@1234` | Use Email tab: `admin@example.com` / `Admin@1234` |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — status active, has skills |
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |

---

## Part 2 — Test Checklist by Screen

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Splash & Onboarding Carousel (HF-012)

> **What to check:** First-time users see onboarding before the login screen.

**Navigate:** Fresh install or cleared app data → app opens

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | App opens for the first time | Splash screen shown briefly, then Onboarding screen | |
| 2 | Onboarding shows 3 slides | Slide 1: "Expert Services at Your Doorstep" | |
| 3 | Swipe or tap "Next" | Advances to slide 2: "Hassle-free Booking" | |
| 4 | Tap "Next" again | Advances to slide 3: "Secure & Local Payments" | |
| 5 | Slide 3 shows "Get Started" button | "Get Started" CTA is visible | |
| 6 | Tap "Skip" on slide 1 or 2 | Jumps directly to Login screen | |
| 7 | Tap "Get Started" on slide 3 | Goes to Login screen | |
| 8 | Reopen app after completing onboarding | Goes directly to Login (onboarding not shown again) | |
| 9 | Language toggle | Globe icon visible on onboarding; tapping switches Bengali ↔ English | |

---

### Screen 2 — Login Screen (HF-015)

> **What to check:** Users can log in with mobile number or email.

**Navigate:** Login screen (after onboarding or after logout)

**With Mobile tab:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Login screen loads | "Mobile" and "Email" tabs visible at top | |
| 2 | "Mobile" tab active by default | Mobile number input shown | |
| 3 | Enter `01811223344` + `Resident@1234` → tap Login | Logs in, lands on Resident Home screen | |
| 4 | Enter `01711223344` + `Provider@1234` → tap Login | Logs in, lands on Provider Dashboard | |
| 5 | Enter `00000000000` + `Admin@1234` → tap Login | Logs in (Admin sees Resident-style home) | |
| 6 | Wrong password → tap Login | Error: "Incorrect mobile number or password" | |
| 7 | Wrong mobile (not 11 digits) → tap Login | Inline validation error on the field | |
| 8 | Empty fields → tap Login | Inline validation error | |

**With Email tab:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 9 | Tap "Email" tab | Email input appears instead of mobile | |
| 10 | Enter `admin@example.com` + `Admin@1234` → Login | Logs in successfully | |
| 11 | Invalid email format | Inline validation error | |

**Language:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 12 | Globe icon top-right | Visible on Login screen | |
| 13 | Tap Globe → switch to Bengali | All labels switch to Bengali | |
| 14 | Tap Globe → switch back to English | All labels switch back | |

---

### Screen 3 — Registration: Resident (HF-013)

> **What to check:** 3-step registration for residents.

**Navigate:** Login screen → "Register Now" → select "Resident"

**Step 1 — Basic Info:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Step 1 screen loads | Fields: Full Name, Mobile Number, NID Number | |
| 2 | Progress bar shows 1/3 | Correct step count for residents | |
| 3 | Leave Full Name empty → tap Next | Inline error: "Full name is required" | |
| 4 | Enter name < 3 chars → tap Next | Error: "Name must be at least 3 characters" | |
| 5 | Mobile not 11 digits → tap Next | Error: "Enter a valid 11-digit mobile number" | |
| 6 | NID not 10 digits → tap Next | Error: "Enter a valid NID" | |
| 7 | Fill valid values → tap Next | Advances to Step 2 | |

**Step 2 — Location:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 8 | Step 2 loads | Interactive map displayed | |
| 9 | Allow location permission | Map pans to current GPS position, marker placed | |
| 10 | Drag the marker | Marker moves; coordinates update | |
| 11 | Tap the map | Marker jumps to tapped position | |
| 12 | Tap "Use Current Location" button | Map re-centers to GPS position | |
| 13 | Tap Next without placing marker | Error: "Please select your location" | |
| 14 | Marker placed → tap Next | Advances to Step 3 | |

**Step 3 — Auth (Password):**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 15 | Step 3 shows email + password fields | Email is optional | |
| 16 | Password < 8 chars → tap Complete | Error: "Password must be at least 8 characters" | |
| 17 | Password without uppercase → tap Complete | Error: password complexity rule | |
| 18 | Invalid email format → tap Complete | Error: "Enter a valid email address" | |
| 19 | Valid password (no email) → tap Complete | Registration succeeds → redirects to Login | |
| 20 | Duplicate mobile number | Error: "This mobile number is already registered" | |
| 21 | Duplicate NID | Error: "This NID is already registered" | |
| 22 | Duplicate email | Error: "This email address is already registered" | |

---

### Screen 4 — Registration: Provider (HF-014 + Sprint 2 Skills Fix)

> **What to check:** Provider registration has 5 steps — same as resident but adds Documents (step 4) and My Services (step 5).

**Navigate:** Login screen → "Register Now" → select "Service Provider"

**Steps 1–3:** Same as Resident registration above.

**Step 4 — Documents:**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Step 4 screen loads | Upload areas for "Profile Photo" and "NID Photo" | |
| 2 | Progress bar shows 4/5 | 5-step progress for providers | |
| 3 | Tap "Profile Photo" area | Photo picker opens | |
| 4 | Select a photo | Photo thumbnail appears in upload area | |
| 5 | Tap "NID Photo" area | Photo picker opens | |
| 6 | Select NID photo | Thumbnail appears | |
| 7 | Tap Next without NID photo | Error: "NID photo is required for providers" | |
| 8 | NID photo selected → tap Next | Advances to Step 5 | |

**Step 5 — My Services (skills selection):**

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 9 | Step 5 screen loads | Title "My Services", grid of category chips from the database | |
| 10 | Progress bar shows 5/5 | Final step | |
| 11 | All chips unselected initially | No chip highlighted | |
| 12 | Tap "Plumbing" | Chip gets blue border + checkmark icon | |
| 13 | Tap "Electrical" | Second chip also selected | |
| 14 | Tap "Plumbing" again | Chip deselects (goes back to grey border) | |
| 15 | Tap "Complete" with nothing selected | Error: "Please select at least one service" | |
| 16 | Select 1+ categories → tap "Complete" | Submits registration → lands on Pending Approval screen | |
| 17 | Categories in both Bengali and English | Matches current app language setting | |

---

### Screen 5 — Pending Approval Screen (HF-019)

> **What to check:** Providers who just registered see a waiting screen.

**Navigate:** Complete provider registration → automatic redirect

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | After registration | "Application Submitted!" screen shown | |
| 2 | Message | Explains review takes 24-48 hours | |
| 3 | No login access yet | Provider cannot navigate to the main app from here | |
| 4 | Provider tries to log in before approval | Login still redirects to pending screen (status is PENDING) | |

---

### Screen 6 — Auth State: Token Refresh & Cold Start (HF-016, HF-017)

> **What to check:** The app restores session after being closed and refreshes tokens silently.

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Log in as Resident | Successfully reaches Home screen | |
| 2 | Close and reopen the app | App re-opens directly on Home screen (no re-login needed) | |
| 3 | User name appears on Home | Name from the JWT is restored correctly (not blank) | |
| 4 | Role is correct | Resident sees Resident home, Provider sees Provider dashboard | |
| 5 | Access token expires (5 min) | App automatically refreshes token in background — no logout | |
| 6 | Invalid refresh token | App logs out and redirects to Login | |

---

### Screen 7 — Logout (HF-018)

> **What to check:** Log out clears session and returns to Login.

**Navigate:** Any screen → Profile tab → Log Out

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Tap "Log Out" button | Confirmation dialog: "Are you sure you want to log out?" | |
| 2 | Tap "Cancel" | Dialog closes, stays on Profile | |
| 3 | Tap "Log Out" in dialog | Logs out, returns to Login screen | |
| 4 | Reopen app after logout | Shows Login screen (not the main app) | |
| 5 | Log out clears tokens | Logging back in requires full credentials | |

---

## Part 3 — Error Handling (HF-020D)

> **What to check:** API errors show user-friendly localized messages, not raw technical errors.

| # | Scenario | Expected Error Message | Result |
|---|----------|----------------------|--------|
| 1 | Login with unregistered mobile | "Incorrect mobile number or password" | |
| 2 | Register with existing mobile | "This mobile number is already registered" | |
| 3 | Register with existing NID | "This NID is already registered" | |
| 4 | Register with existing email | "This email address is already registered" | |
| 5 | Login with pending provider | "Your account has not been approved yet" | |
| 6 | Backend unreachable | "An error occurred" (generic fallback) | |
| 7 | Switch to Bengali before login error | Error message appears in Bengali | |

---

## Part 4 — Cross-Screen Flows

### Flow A — New Resident registers and logs in

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open app → Onboarding → Get Started | Reaches Login |
| 2 | Tap "Register Now" → select "Resident" | Registration starts |
| 3 | Complete Steps 1, 2, 3 | Account created → redirects to Login |
| 4 | Log in with new credentials | Lands on Resident Home screen |
| 5 | Category grid loads | Service categories visible |

### Flow B — New Provider registers, gets approved, adds more skills

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Register as Provider → complete all 5 steps | Lands on Pending Approval |
| 2 | Admin approves provider (DB or admin API) | Provider status becomes active |
| 3 | Provider logs in | Lands on Provider Dashboard |
| 4 | Go to Profile tab | "My Services" section shows categories selected at registration |
| 5 | Tap + to add another service | Alert picker shows remaining categories |
| 6 | Select a new category | New chip appears in My Services |
| 7 | Go to Home tab | Dashboard loads with updated profile |

### Flow C — Language switch during registration

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Start registration in Bengali | All labels in Bengali |
| 2 | Tap Globe icon → switch to English | All labels switch instantly |
| 3 | Continue registration in English | Form accepts input normally |
| 4 | Complete registration | Account created regardless of language |

---

---

## Part 5 — Approving a Provider (In-App Admin Screen)

When a provider registers, their status is **Pending**. An admin must approve them before they can access the main app.

### How to approve from the mobile app

1. Log in with the admin account: **Mobile** `00000000000` / **Password** `Admin@1234`  
   *(or Email tab: `admin@example.com` / `Admin@1234`)*

2. You land on the **Admin Dashboard** — not the resident home screen

3. The **"Pending Approvals"** list shows all providers awaiting review:
   - Provider name, mobile number, email, registration date

4. Tap **Approve** (green button) → confirmation dialog → confirm  
   Provider status changes to Active immediately

5. Tap **Reject** (red button) → confirmation dialog → confirm  
   Provider status changes to Inactive

6. The list auto-refreshes after each action. Pull down to refresh manually.

7. When the list is empty: **"All caught up!"** message with a green checkmark.

### Admin tab bar

When admin is logged in, the tab bar shows only **Home** (Admin Dashboard) and **Profile**. Bookings and Jobs tabs are hidden — those are resident/provider-specific.

### Test checklist — Admin Dashboard

| # | Step | Expected Result | Result |
|---|------|-----------------|--------|
| 1 | Log in as admin (`00000000000` / `Admin@1234`) | Lands on Admin Dashboard, not category grid | |
| 2 | Tab bar | Shows only 2 tabs: Home · Profile | |
| 3 | Dashboard title | "Admin Dashboard" with subtitle | |
| 4 | Pending list empty | "All caught up!" message with green checkmark | |
| 5 | Register a new provider (different device/account) | New row appears in pending list | |
| 6 | Tap Approve | Confirmation dialog: "Approve [Name]? They will be able to log in..." | |
| 7 | Confirm Approve | Provider removed from list; provider can now log in | |
| 8 | Register another provider → Reject | Confirmation dialog with destructive style; provider cannot log in | |
| 9 | Pull down on list | Refreshes pending list | |
| 10 | Approved provider logs in | Lands on Provider Dashboard (not pending screen) | |

---

## Part 6 — Known Limitations

| What you see | Why | When fixed |
|---|---|---|
| Provider name shows "—" on dashboard after login | `full_name` not returned by `/me/profile` response yet | Sprint 3 |
| Photo uploads store a local file URI, not a real URL | File upload service wired in Sprint 3 | Sprint 3 (HF-033) |
| Admin can only approve/reject — no other admin features | Full admin panel (categories, revenue, users) is the Sprint 7 web app | Sprint 7 |

---

## Part 6 — Reporting a Bug

When reporting a bug from this checklist, include:

1. **Test case number** — e.g. "Screen 3, step 7"
2. **What you did** — exact steps
3. **What you expected** — from the "Expected Result" column
4. **What actually happened** — describe or screenshot
5. **Device + OS** — e.g. Samsung Galaxy A54, Android 14
6. **Language** — Bengali or English when the bug occurred
