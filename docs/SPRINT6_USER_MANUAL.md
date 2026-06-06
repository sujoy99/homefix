# HomeFix — Sprint 6 Mobile: User Manual

> **Sprint:** Sprint 6 — Reviews, Notifications, Real-time & In-App Communication (Mobile)
> **Covers:** HF-050 · HF-051 · HF-052 · HF-053 · HF-102 · HF-103
> **Audience:** QA, Product Owner, Business Stakeholder
> **Last updated:** 2026-06-06

---

## What This Sprint Delivers

Sprint 6 adds real-time communication and feedback capabilities. Residents and Providers can now communicate securely inside the app — no phone number exchange needed.

| Feature | Who benefits | SRS requirement |
|---------|-------------|-----------------|
| Review & rating screen — 1–5 stars + optional comment after payment | Residents | REQ-024, REQ-025, REQ-026 |
| Push notifications — FCM alerts for job accepted/completed/payment received | All users | REQ-027 |
| Notification center — bell icon with badge, unread list, mark-as-read | All users | REQ-027 |
| Provider live location — resident sees provider's GPS position on active job | Residents | REQ-007 |
| In-app chat — text, image, voice note messages per job (ACTIVE only) | Residents + Providers | REQ-028 |
| Voice call — one-tap call via Jitsi (browser-based, no phone number exposure) | Residents + Providers | REQ-029 |

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
REACT_NATIVE_PACKAGER_HOSTNAME=<your-wifi-ip> npx expo start --host lan
# Scan QR code with Expo Go (Android)
```

### Seed accounts

| Role | Mobile | Password |
|------|--------|----------|
| **Resident** | `01811223344` | `Resident@1234` |
| **Provider (approved, Plumbing)** | `01711223344` | `Provider@1234` |
| **Admin** | `00000000000` | `Admin@1234` |

### Create a fully testable job

Sprint 6 features require a job that goes through the full lifecycle:

1. Login as **Resident** → tap **Plumbing** → book a job (any description + address)
2. Login as **Provider** → accept the job from job feed
3. That job is now **ACTIVE** → chat, voice call, and location tracking work at this point
4. Provider marks work complete → job is **AWAITING_PAYMENT**
5. Resident submits bKash/Nagad TxID → job goes to **AWAITING ADMIN VERIFY**
6. Admin verifies payment → job is **PAID** → review CTA appears for Resident

---

## Part 2 — Feature Walkthroughs

### Feature 1 — Review & Rating (HF-050)

**Who:** Resident only, after job is PAID.

**How to test:**
1. Complete the job lifecycle above until the job is **PAID**
2. Open the job detail (Resident)
3. A **"Leave a Review"** button appears at the bottom — press it
4. Rate the provider 1–5 stars by tapping
5. Optionally type a comment (up to 1000 characters)
6. Press **Submit Review**
7. A success toast appears; the review button disappears from job detail
8. Repeat attempts show an error toast (duplicate review blocked)

**Edge cases:**
- Button is hidden if the job is not PAID, or if the user has already reviewed
- Navigating away and back keeps the button hidden (persisted via `reviewStore`)
- Empty comment is accepted; whitespace-only comment is treated as no comment

---

### Feature 2 — Push Notifications (HF-051)

**Who:** All roles.

**How to test (requires a real physical device — Android or iOS):**
1. Login on a real device — FCM token registers automatically on login
2. Trigger an event from another device or the admin panel:
   - Provider accepts a job → **Resident** receives "Job Accepted" notification
   - Provider marks work complete → **Resident** receives "Job Completed" notification
   - Admin verifies payment → **Provider** receives "Payment Received" notification
3. Tap the notification → app opens and navigates directly to the relevant job detail

**Platform notes:**
- **Android:** FCM delivers directly. Works on real Android devices and emulators that have Google Play Services installed.
- **iOS:** FCM routes through APNs (Apple Push Notification Service). Works on real iPhones and iPads. Requires an APNs certificate or APNs auth key configured in Firebase Console.
- **Simulators (both platforms):** Push notifications do not work on iOS Simulator or Android Emulator without Play Services. Always test push on a physical device.

---

### Feature 3 — Notification Center (HF-052)

**Who:** All roles.

**How to test:**
1. Trigger push notifications (see Feature 2)
2. Observe the **bell icon** in the bottom tab bar — a red badge shows the unread count
3. Tap the bell → **Notifications** screen opens
4. Unread notifications are visually highlighted with a blue dot
5. Tap a notification → it is marked read (dot disappears), and the app navigates to the relevant job
6. Pull down to refresh the list
7. When no notifications exist, an empty state is shown
8. Tap any notification with `data.jobId` → routes to `/(app)/booking/job/:id`

**Badge behavior:**
- Badge decrements as notifications are read
- Badge disappears when all are read
- Admin role does not see the Notifications tab (admin uses the dashboard instead)

---

### Feature 4 — Provider Live Location (HF-053)

**Who:** Resident sees provider location; Provider sends location.

**How to test:**
1. Create an ACTIVE job (steps 1–2 from "Create a testable job" above)
2. On the Provider device: the app automatically starts sending GPS every 15 seconds while the job is ACTIVE. No manual action needed.
3. On the Resident device: open the active job detail → scroll to **"Provider Location"** card
4. Latitude and longitude coordinates update every 15 seconds
5. When the provider hasn't sent a location yet: "Waiting for provider location..." is shown

**Edge cases:**
- Provider must grant foreground location permission on first run (a system dialog appears)
- If permission is denied, no location is sent (no error shown to provider)
- Location tracking stops automatically when the job leaves ACTIVE state

---

### Feature 5 — In-App Chat (HF-102)

**Who:** Resident and assigned Provider on an ACTIVE job.

**How to test:**

**Opening chat:**
1. Open an ACTIVE job detail (Resident or Provider)
2. A **chat bubble icon** appears in the top-right header
3. Tap it → Chat screen opens

**Sending a text message:**
1. Type in the text input at the bottom
2. The mic button switches to a send arrow when text is present
3. Press Send → message appears in the bubble list immediately
4. The other participant's device receives it in real-time (WebSocket)

**Sending an image:**
1. Tap the **image icon** (left of input bar)
2. Grant media library permission if prompted
3. Pick an image → it uploads and appears as an image bubble

**Sending a voice note:**
1. Tap the **mic icon** (right of input bar, shown when input is empty)
2. Grant microphone permission if prompted
3. Timer starts and a pulsing red dot appears — speak your message
4. Press **Stop & Send** → recording uploads and appears as an audio bubble
5. Tap the audio bubble's play button to listen
6. Press **Cancel** to discard a recording in progress

**Older messages:**
- Messages load 50 at a time (newest first, displayed at the bottom)
- Tap **"Load older messages"** to fetch the next page

**Connection indicator:**
- Wi-Fi icon (top-right of chat header) = real-time WebSocket connected
- Wi-Fi-Off icon = polling fallback active (messages update every 5 seconds)

**Edge cases:**
- Chat icon is only visible when the job is ACTIVE
- After job completes (AWAITING_PAYMENT/PAID), the chat icon disappears
- No phone numbers are displayed — only the participant's name

---

### Feature 6 — In-App Voice Call (HF-103)

**Who:** Resident and assigned Provider on an ACTIVE job.

---

#### How the call works (technical flow)

1. Both participants tap the **phone icon** in the job detail header
2. The app calls `POST /api/v2/jobs/:id/call/room` → backend returns:
   ```json
   { "provider": "jitsi", "roomName": "homefix-job-<jobId>", "serverUrl": "https://meet.jit.si" }
   ```
3. The app builds the URL: `https://meet.jit.si/homefix-job-<jobId>`
4. The in-app browser opens that URL (Jitsi Meet web app)

The room name is **deterministic** — both Resident and Provider get the exact same URL for the same job. The room is also **idempotent** — pressing the button twice returns the same room, so it is safe to re-enter.

---

#### What you see inside the browser — two possible screens

**Screen A — Pre-join setup (normal, expected)**

Before entering the room, Jitsi shows a preview screen:
```
Your name: [__________]
[Camera / mic preview]
[ Join Meeting ]
```
This is NOT a waiting room. It is just a setup step. Enter a display name and press **Join Meeting** to enter the call. Both participants do this independently.

**Screen B — Lobby (waiting for approval)**

```
Waiting to be admitted...
[ Ask to join ]
```
This appears when the first person who joined has the **Lobby** feature enabled inside Jitsi. The first person (who is automatically the moderator) sees a notification and must press **Admit** to let the second person in.

---

#### Step-by-step for both participants

| Step | Resident | Provider |
|------|----------|----------|
| 1 | Tap phone icon on job detail | Tap phone icon on job detail |
| 2 | Browser opens → Pre-join screen | Browser opens → Pre-join screen |
| 3 | Enter name → **Join Meeting** | Enter name → **Join Meeting** |
| 4 | Inside the room (becomes moderator) | Joins the same room |
| 5 | ✅ Both connected — call starts | ✅ Both connected |

If the second person sees the Lobby screen:
- The first person will see a banner inside the call: **"[Name] wants to join"**
- Press **Admit** → second person enters immediately

---

#### Disable the lobby (for smoother experience)

On the public `meet.jit.si` server, the lobby can turn on automatically. To disable it:

**During a call (first person):**
Inside the Jitsi call → tap the **Shield icon** (Security) → toggle **Lobby** off → the second person enters without waiting.

**For production (self-hosted Jitsi):**
Set `JITSI_SERVER_URL` in the backend `.env.development` to your own Jitsi server where lobby is disabled in Jitsi config. The backend JWT (`JITSI_APP_ID` + `JITSI_APP_SECRET`) can also enforce moderator roles automatically.

---

#### Call URL format

```
# Development (no JWT configured)
https://meet.jit.si/homefix-job-<jobId>

# Production (self-hosted Jitsi + JWT)
https://meet.homefix.app/homefix-job-<jobId>?jwt=<signed-token>
```

---

#### Edge cases

- Phone icon is only visible when the job is **ACTIVE** (same condition as the chat icon)
- If the backend is unreachable, an error toast appears: "Could not start call. Please try again."
- Closing the browser after the call returns to the job detail screen
- Both Phase 1 (Jitsi) and Phase 2 (Agora) are supported — the app reads the `provider` field from the API response and will select the appropriate SDK at runtime (currently always `jitsi`)

---

## Part 3 — Language Toggle

All Sprint 6 features are bilingual. Switch between Bengali and English:

1. Go to **Profile** tab → **Language** toggle
2. All Sprint 6 UI strings switch instantly:
   - Bengali (default): "চ্যাট খুলুন", "কল শুরু করুন", "ভয়েস বার্তা রেকর্ড করুন"
   - English: "Open chat", "Start Call", "Record voice message"

---

## Part 4 — Known Limitations (Sprint 6)

| Limitation | Detail |
|-----------|--------|
| Chat read-only after ACTIVE | Chat icon disappears when job moves to AWAITING_PAYMENT — history is not shown. Sprint 7 may add read-only history view. |
| Push requires physical device | FCM works on real Android + iOS devices. iOS simulators and Android emulators without Play Services cannot receive push. iOS requires APNs key in Firebase Console. |
| Voice call opens in browser | `@jitsi/react-native-sdk` requires bare React Native — using `expo-web-browser` instead for Expo managed compatibility |
| Location on-demand only | Provider location card shows last-known coordinates, not a map pin. Map integration is planned for Sprint 7. |
| Voice-to-text deferred | HF-043 (Whisper STT) deferred — requires server-side Whisper or Groq API decision |

---

## Part 5 — QA Sign-Off Checklist

### HF-050 — Review
- [ ] Review button appears after PAID, hidden before
- [ ] Star tap works 1–5; selected star is visually distinct
- [ ] Submit with comment → success toast + button hidden
- [ ] Submit without comment → success toast
- [ ] Second attempt on same job → error toast (409)
- [ ] Button still hidden after app restart (persisted)
- [ ] Bengali and English strings correct

### HF-051 — Push notifications
- [ ] FCM token registers on login (check backend logs: `PUT /v2/users/me/device-token`)
- [ ] Token unregistered on logout
- [ ] Job accepted notification received on resident device
- [ ] Tapping notification navigates to job detail

### HF-052 — Notification center
- [ ] Bell badge shows correct unread count
- [ ] Badge disappears when all read
- [ ] Tapping notification marks it read + navigates
- [ ] Pull-to-refresh works
- [ ] Empty state shown when no notifications

### HF-053 — Provider location
- [ ] Location card appears on resident's active job detail
- [ ] Coordinates update every ~15 seconds
- [ ] "Waiting..." shown before first update
- [ ] Card disappears after job leaves ACTIVE

### HF-102 — Chat
- [ ] Chat icon in job detail header (ACTIVE only)
- [ ] Text send + real-time receive on other device
- [ ] Image attachment uploads and displays
- [ ] Voice recording → play/pause on audio bubble
- [ ] Cancel recording returns to idle input
- [ ] Load older messages works with 50+ message thread
- [ ] Connection indicator (Wifi/WifiOff) reflects socket state
- [ ] Bengali and English strings correct

### HF-103 — Voice call
- [ ] Phone icon in job detail header (ACTIVE only, alongside chat icon)
- [ ] Tap → in-app browser opens with Jitsi room
- [ ] Both participants join the same room
- [ ] Error toast when backend unreachable
- [ ] Call button disabled during room creation (loading state)
- [ ] Bengali and English strings correct
