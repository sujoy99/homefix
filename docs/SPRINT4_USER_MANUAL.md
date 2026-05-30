# HomeFix — Sprint 4 Mobile: User Manual

> **Sprint:** Sprint 4 — Voice & Accessibility  
> **Covers:** HF-042 · HF-044 · HF-045 · HF-046  
> **Audience:** QA, Product Owner, Business Stakeholder  
> **Last updated:** 2026-05-30

---

## What This Sprint Delivers

Sprint 4 makes HomeFix **voice-first and screen-reader ready**, addressing two user groups that are poorly served by text-only flows:

- **Low-literacy residents** — can describe a problem by recording a voice note instead of typing
- **Provider workers** — can have a job's description and address read aloud, hands-free on a job site

| Feature | Who benefits | SRS requirement |
|---------|-------------|-----------------|
| Voice note recording in booking | Residents | REQ-011 |
| Voice note playback on job detail | Providers | REQ-011 |
| "Read Aloud" text-to-speech | Providers | REQ-013 |
| Accessibility audit — screen reader, contrast, touch targets | All users | Non-functional |

---

## Part 1 — Environment Setup

### Start the backend

```bash
# From repo root
make start       # Start containers (backend + DB)
make migrate     # Ensure all migrations are applied
```

### Start the mobile app

```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<your-windows-wifi-ip> npx expo start --host lan
# Scan QR code with Expo Go (Android) or press 'i' for iOS simulator
```

### Seed accounts

| Role | Mobile | Password | Name |
|------|--------|----------|------|
| **Resident** | `01811223344` | `Resident@1234` | Fatema Begum |
| **Provider (approved)** | `01711223344` | `Provider@1234` | Rahim Uddin — Plumbing skill |
| **Admin** | `00000000000` | `Admin@1234` | — |

---

## Part 2 — Screen-by-Screen Checklist

Mark each item ✅ Pass or ❌ Fail with a note.

---

### Screen 1 — Voice Note Recording in Booking Flow (HF-042)

> **Who:** Resident  
> **Navigate:** Home → any category → Book Now → Step 2 "Describe Issue"  
> **What to check:** A microphone button is always visible on Step 2; residents can record, preview, and delete a voice note before submitting.

#### Idle state (mic button)

| # | Action | Expected |
|---|--------|----------|
| 1 | Booking Step 2 loads | Label "Voice Note (optional)" visible above mic button |
| 2 | Mic button appearance | Teal circular button with microphone icon (48 × 48 px) |
| 3 | Status hint below button | "Tap the mic to record" (en) / "মাইক্রোফোন বোতামে চাপ দিয়ে রেকর্ড করুন" (bn) |

#### Recording state

| # | Action | Expected |
|---|--------|----------|
| 4 | Tap mic button (first time — OS prompt) | Microphone permission dialog appears |
| 5 | Grant permission | Recording starts immediately |
| 6 | Mic button changes | Red stop button replaces mic button |
| 7 | Live timer | `MM:SS` counter starts counting up (e.g. `00:01`, `00:02`…) |
| 8 | Red blinking dot | Small red dot pulses next to timer |
| 9 | Status text | "Recording..." (en) / "রেকর্ডিং চলছে..." (bn) |
| 10 | Tap stop button | Recording stops |

#### Recorded state (playback controls)

| # | Action | Expected |
|---|--------|----------|
| 11 | After stopping | Play button (outline circle), timer showing recorded duration, trash icon visible |
| 12 | Status text | "Recording saved — submit to attach" (en) / "রেকর্ডিং সম্পন্ন — পাঠাতে সাবমিট করুন" (bn) |
| 13 | Tap play | Audio plays back; button swaps to pause icon |
| 14 | Tap pause | Audio pauses; button swaps back to play icon |
| 15 | Audio completes naturally | Button automatically resets to play |
| 16 | Tap trash icon | Voice note deleted; returns to idle mic button; status resets to hint |

#### Submitting with a voice note

| # | Action | Expected |
|---|--------|----------|
| 17 | Record voice note → complete all 5 steps → tap "Post Job" | Job created; then voice note uploaded separately |
| 18 | Success (both upload OK) | Green toast "Job Posted!"; navigates to Bookings tab |
| 19 | Job post OK but voice upload fails | Green toast still shown (job exists); separate red toast: "Job posted but voice note could not be uploaded." |
| 20 | Delete recording → Post Job | No voice note upload attempted; `voice_note_url` is null on backend |
| 21 | Mic permission permanently denied | Mic button visible but tapping it silently does nothing; resident can still submit without a voice note |

---

### Screen 2 — Voice Note Playback in Provider Job Detail (HF-045)

> **Who:** Provider  
> **Navigate:** Jobs tab → tap a job that a resident posted with a voice note → scroll to Description card  
> **What to check:** A compact audio player strip appears beneath the written description; absent when no voice note was recorded.

| # | Action | Expected |
|---|--------|----------|
| 1 | Job has a voice note | "Voice Note" label with mic icon and a player strip visible inside the description card |
| 2 | Player strip appearance | Teal play button (left) · teal progress bar (centre) · time counter (right) |
| 3 | Tap play | Audio plays; button swaps to pause icon; progress bar fills left-to-right |
| 4 | Tap pause | Audio pauses; button reverts to play; bar stays at current position |
| 5 | Tap play again | Resumes from paused position |
| 6 | Audio completes | Button resets to play; progress bar returns to zero; time shows `00:00 / MM:SS` |
| 7 | Time counter during playback | Shows `position / duration`, e.g. `00:04 / 00:12` |
| 8 | Navigate away mid-play | Audio stops; sound unloaded on unmount; no ghost audio |
| 9 | Job has no voice note | Player strip not shown; no extra whitespace; no crash |

---

### Screen 3 — "Read Aloud" Text-to-Speech for Providers (HF-044)

> **Who:** Provider  
> **Navigate:** Jobs tab → tap a job → scroll to Description card  
> **What to check:** A "Read Aloud" button lets providers listen to the job description and service address, hands-free.

| # | Action | Expected |
|---|--------|----------|
| 1 | Provider opens job detail | "পড়ে শোনান" (bn) / "Read Aloud" (en) pill button visible below description |
| 2 | Button appearance | Teal outline pill with speaker icon + label; minimum 36 px height |
| 3 | Tap "Read Aloud" | Device speaks the full job description, followed by each address line |
| 4 | Button while speaking | Swaps to "পড়া বন্ধ করুন" / "Stop Reading" with muted-speaker icon; teal background fill |
| 5 | Tap "Stop Reading" | Speech stops immediately; button resets to idle |
| 6 | TTS completes naturally | Button resets to idle automatically |
| 7 | App language = English | Speaks in English (`en-US`); button shows "Read Aloud" |
| 8 | App language = Bengali | Speaks in Bengali (`bn-BD`); button shows "পড়ে শোনান" |
| 9 | Navigate away while speaking | TTS stops on screen unmount; no continued speech in background |
| 10 | Resident user opens same job | Read Aloud button not shown (provider-only feature) |
| 11 | Admin user opens job | Read Aloud button not shown |
| 12 | Very long description (200+ chars) | Full text spoken without truncation |

**What is read aloud:**
- `job.description` (the written description the resident typed or voice-to-text captured)
- Service address parts: house, road, area — joined with `. ` pause between each

---

### Screen 4 — Accessibility (HF-046)

> **Who:** All users — tested with TalkBack (Android) or VoiceOver (iOS)  
> **What to check:** Every interactive element has a screen-reader label; all touch targets meet the 48 px minimum; no text clipping at large font scale.

#### Screen-reader labels (TalkBack / VoiceOver)

Enable TalkBack (Android: Settings → Accessibility → TalkBack) or VoiceOver (iOS: Settings → Accessibility → VoiceOver), then navigate through each screen.

| Screen | Element | Expected announcement |
|--------|---------|----------------------|
| Login | Show/hide password toggle | "Show password" / "Hide password" (toggles) |
| Login | Language globe button | "English" or "বাংলা" (current language) |
| Onboarding | "Get Started" button | "Get Started, button" |
| Booking Step 2 | Mic button | "Record voice note, button" + hint "Tap the mic to record" |
| Booking Step 3 | "Add Photos" button | "Add Photos, button" + hint |
| Booking Step 3 | Remove photo ✕ | "Remove photo 1, button" (index-aware) |
| Booking Step 4 | Map marker | Announces drag hint |
| Job detail | Photo thumbnails | "Photo 1, button" + "Double-tap to view full screen" hint |
| Job detail | Read Aloud button | "Read Aloud, button" + "Reads job description and address aloud" hint |
| Job detail | Voice note play | "Play voice note, button" / "Pause voice note, button" |
| Category list | Category chips | Category name + "tab" role + selected/unselected state |
| Service picker | Service checkboxes | Service name + "checkbox" role + checked/unchecked state |
| Any screen | Back arrow | "Back, button" |
| All buttons | Any `<Button>` component | Button title announced; no "unlabelled" |

#### Touch targets

| Element | Minimum tap size | Check method |
|---------|-----------------|--------------|
| All `<Button>` components | 48 × 48 px (via `minHeight`) | Visual inspection / Measure tool |
| Back arrows | 48 × 48 px (hitSlop) | Tap near edge of icon — activates |
| Camera badge (profile/registration) | 48 px effective (hitSlop 10) | Tap near edge |
| Remove photo ✕ | 48 px effective (hitSlop 16) | Tap near edge |
| Mic button (VoiceRecorder) | 48 × 48 px (explicit dimensions) | Visual inspection |
| Tab bar items | Native tab bar — 48 px+ | Platform default |

#### Font scale (1.5×)

Enable: Android Settings → Accessibility → Font Size → Largest

| Screen | Check |
|--------|-------|
| Booking buttons ("Next", "Post Job") | Button height grows; text not clipped |
| Bengali labels | Multi-line where needed; no truncation |
| Job detail description | Text wraps; no overflow behind other elements |
| VoiceRecorder row | Buttons and timer wrap onto second line if needed; no overlap |

---

## Part 3 — End-to-End Flows

### Flow A — Resident posts job with voice note; Provider listens and reads aloud

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Resident | Home → Plumbing → Book Now → Step 2 | Mic button visible |
| 2 | Resident | Tap mic → speak 10 s → stop | Recorded state; timer shows `00:10` |
| 3 | Resident | Tap play | Hears recording back |
| 4 | Resident | Fill description, address, budget → Post Job | Green toast; voice note uploaded |
| 5 | Provider | Jobs tab → tap new Plumbing job | Job detail opens |
| 6 | Provider | Scroll to Description | Voice Note player visible; also Read Aloud button |
| 7 | Provider | Tap play on voice note player | Hears resident's voice note |
| 8 | Provider | Tap "Read Aloud" | Hears description + address spoken in Bengali (or English per app language) |
| 9 | Provider | Tap "Stop Reading" | Speech stops; button resets |

---

### Flow B — Accessibility navigation (screen reader)

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Tester | Enable TalkBack; open HomeFix | TalkBack announces app name |
| 2 | Tester | Navigate to Login | Fields announced with labels; password field announces "hide/show password" toggle |
| 3 | Tester | Navigate to Booking Step 2 | Mic button announced: "Record voice note, button" + hint |
| 4 | Tester | Tap mic (TalkBack double-tap) | Recording starts; stop button announced: "Stop recording, button" |
| 5 | Tester | Stop → listen to play button | "Play voice note, button" announced |
| 6 | Tester | Navigate to provider job detail | Photo thumbnails announced: "Photo 1, button"; Read Aloud button announced with hint |
| 7 | Tester | Activate Read Aloud (double-tap) | TTS reads description aloud; button becomes "Stop Reading" |

---

### Flow C — Delete recording before submit

| # | Who | Action | Expected |
|---|-----|--------|----------|
| 1 | Resident | Booking Step 2 → tap mic → record 5 s → stop | Recorded state |
| 2 | Resident | Tap trash icon | Returns to idle mic button; recording gone |
| 3 | Resident | Complete booking → Post Job | No voice upload attempted; `voice_note_url` null on job record |

---

## Part 4 — Language Check (Bilingual)

Switch language to Bengali (বাংলা) via Profile → Language and verify:

| Screen | Bengali strings to verify |
|--------|--------------------------|
| Booking Step 2 — mic button area | "ভয়েস নোট (ঐচ্ছিক)" label; "মাইক্রোফোন বোতামে চাপ দিয়ে রেকর্ড করুন" hint |
| Booking Step 2 — recording | "রেকর্ডিং চলছে..." status |
| Booking Step 2 — recorded | "রেকর্ডিং সম্পন্ন — পাঠাতে সাবমিট করুন" status |
| Job detail — voice player | "ভয়েস নোট" label |
| Job detail — Read Aloud | "পড়ে শোনান" button; "পড়া বন্ধ করুন" while speaking |
| Job detail — photos | "ছবি ১" accessibility label on first thumbnail |

---

## Part 5 — Known Limitations (Sprint 4)

| What you see | Why | Fixed in |
|---|---|---|
| No automatic transcription of voice note to text | Voice-to-Text (REQ-012, HF-043) deferred — requires Whisper backend infrastructure decision | Future sprint |
| No push notification when provider accepts | Push notifications (Sprint 5, HF-048) | Sprint 5 |
| No payment after "Awaiting Payment" | Payment module (Sprint 6, HF-059) | Sprint 6 |
| TalkBack focus order on complex multi-step forms may not be perfect on all Android versions | Android TalkBack traversal varies by OEM; comprehensive traversal fix is Sprint 8 (HF-082) | Sprint 8 |

---

## Part 6 — Bug Report Template

When reporting a bug, include:

1. **Screen + row number** — e.g. "Screen 1, row 12"
2. **What you did** — exact taps and inputs
3. **Expected result** — from the "Expected" column
4. **What actually happened** — describe, screenshot, or screen recording
5. **Device + OS** — e.g. Samsung Galaxy A54, Android 14
6. **Language** — Bengali or English
7. **Role** — Resident / Provider / Admin
8. **Accessibility mode** — TalkBack on/off, font scale
