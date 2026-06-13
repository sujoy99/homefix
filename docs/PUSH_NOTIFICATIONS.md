# Push Notifications — HomeFix

HomeFix uses **Firebase Cloud Messaging (FCM)** for all push notifications — job updates, new chat messages, and incoming call alerts. FCM is **free** with no message limits.

---

## How it works end-to-end

```
App launch
  → usePushNotifications()
  → getDevicePushTokenAsync()   ← native device token
  → POST /v2/users/me/device-token  (stored in device_tokens table)

Backend event (job accepted, message, call started)
  → NotificationService.send()
  → FcmProvider (firebase-admin)
  → FCM servers
  → phone OS
  → push notification
```

The backend auto-selects the push provider at startup:

| Condition | Provider | Effect |
|-----------|----------|--------|
| `FCM_SERVICE_ACCOUNT_JSON` env var is set | `FcmProvider` | Real FCM pushes |
| Env var missing | `StubPushProvider` | Pushes silently dropped (no error) |

---

## Notification types

| `type` | When sent | Mobile behavior |
|--------|-----------|-----------------|
| `JOB_ACCEPTED` | Provider accepts a job | Tap → opens job detail |
| `JOB_COMPLETED` | Job marked complete | Tap → opens job detail |
| `JOB_CANCELLED` | Job cancelled | Tap → opens job detail |
| `PAYMENT_RECEIVED` | Payment processed | Tap → opens job detail |
| `NEW_MESSAGE` | Chat message received | Tap → opens chat screen for that job |
| `CALL_STARTED` | Other participant starts a call | Foreground: in-app alert with "Join" button; Background/killed: tap → opens Jitsi call URL |

---

## Android Setup (active)

### Step 1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → name it (e.g., `homefix-prod`) → disable Google Analytics → Create
3. Click the **Android** icon → register app with package name `com.homefix.mobile`

### Step 2 — Generate a service account key

1. Firebase Console → Project Settings (gear icon) → **Service accounts** tab
2. Click **Generate new private key** → confirm
3. A JSON file downloads — **this is a secret, never commit it to git**

### Step 3 — Set the backend environment variable

Paste the entire service account JSON (as a single line) into `backend/.env.development`:

```bash
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"firebase-adminsdk-...@....iam.gserviceaccount.com",...}
```

> **Multi-line keys:** The `private_key` field contains `\n` escape sequences. Keep them as literal `\n` (backslash + n), not real newlines, when the JSON is on a single line.

### Step 4 — Verify the backend picked up FCM

```bash
make down && make start && make logs
```

Look for a log line confirming FCM is active. If you see `stub`, the env var is missing or malformed.

### Step 5 — Wire `google-services.json` into the Android app

`google-services.json` is a **native build-time file** that links the Android app to your Firebase project. Without it, `getDevicePushTokenAsync()` returns a token registered with Expo's shared Firebase project — not yours — so your backend FCM service account cannot deliver to those tokens.

1. Download `google-services.json` from Firebase Console → Project Settings → Your apps → Android
2. Place the file at `mobile/google-services.json`
3. Verify `app.config.js` contains:
   ```js
   android: {
     ...base.expo.android,
     googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
   },
   ```
4. **Run a new EAS build** — this is a native change; OTA update is not sufficient:
   ```bash
   cd mobile
   eas build --profile development --platform android
   ```
5. Install the new APK and re-login. The token registered this time will belong to your Firebase project.

> For EAS production builds, store the file as an EAS secret instead:
> ```bash
> eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value "$(cat mobile/google-services.json)"
> ```
> Then `app.config.js` picks it up automatically via `process.env.GOOGLE_SERVICES_JSON`.

---

## iOS Setup (future phase — not yet active)

**Cost:** Free. The APNs key is a free credential from your Apple Developer account. You need an Apple Developer Program membership ($99/year) to publish to the App Store, but you likely already have or plan to have one.

iOS push requires an extra bridge because `getDevicePushTokenAsync()` on iOS returns an **APNs device token**, not an FCM token. The Firebase iOS SDK converts it, but must be compiled into the IPA.

### Step 1 — Create an APNs Key (free)

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Keys**
2. Click **+** → name it (e.g., `HomeFix APNs Key`) → check **Apple Push Notifications service (APNs)** → Continue → Register
3. **Download the `.p8` file once** — Apple only lets you download it once. Store it securely.
4. Note the **Key ID** (10-character string) and your **Team ID** (shown in the top-right of the developer portal)

### Step 2 — Upload APNs key to Firebase

1. Firebase Console → Project Settings → **Cloud Messaging** tab
2. Under **Apple app configuration**, click **Upload** for APNs Authentication Key
3. Upload the `.p8` file, enter the **Key ID** and **Team ID**

### Step 3 — Add an iOS app to Firebase

1. In Firebase Console, click **Add app** → iOS icon
2. Bundle ID: `com.homefix.mobile`
3. Download `GoogleService-Info.plist`

### Step 4 — Wire `GoogleService-Info.plist` into EAS

Store the file content as an EAS secret and reference it in `app.config.js` so EAS bundles it into the IPA:

```bash
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --value "$(cat GoogleService-Info.plist)"
```

Then in `app.config.js`, add the `@react-native-firebase/app` plugin (requires installing `@react-native-firebase/app` and `@react-native-firebase/messaging`).

### Step 5 — New EAS build required

This is a native change — a new IPA build is required. OTA update is not enough.

Once the Firebase iOS SDK is linked, `getDevicePushTokenAsync()` on iOS will return a proper FCM registration token and the existing `FcmProvider` backend code works without modification.

---

## Testing

1. Use **two physical devices** — push notifications do not fire on simulators or emulators.
2. Log in with different accounts (one resident, one provider) who share an active job.
3. Have the provider tap **Start Call** — the resident's phone should receive a push notification within 1–3 seconds.

### If pushes are not arriving

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Backend logs show `[CallService] push failed` | FCM credentials wrong or expired | Regenerate service account key in Firebase Console |
| No backend log at all | `FCM_SERVICE_ACCOUNT_JSON` missing | Set env var and restart: `make down && make start` |
| Backend sends OK, phone receives nothing | Notification permission denied on phone | Settings → Apps → HomeFix → Notifications → Allow |
| Works on Android, not iOS | iOS phase not yet set up | See iOS setup above |
| Notification arrives but tapping does nothing | `data.jobId` missing in payload | Check `CallService.send()` — `data` must include `jobId` |
| Backend logs "FCM send OK" but push never arrives on device | `google-services.json` missing from EAS build — token belongs to Expo's Firebase project, not yours | Add `google-services.json` to `mobile/`, wire `android.googleServicesFile` in `app.config.js`, run new EAS build |
| Tapping `NEW_MESSAGE` opens job detail instead of chat | Old app build before routing fix | Ensure app is on latest build; tap should route to `/(app)/booking/job/chat/:id` |

---

## Secrets Reference

| Secret | Scope | How to set |
|--------|-------|-----------|
| `FCM_SERVICE_ACCOUNT_JSON` | Backend `.env.development` / production env | Paste full service account JSON (single line) |
| `GOOGLE_SERVICE_INFO_PLIST` | EAS (iOS phase only) | `eas secret:create --name GOOGLE_SERVICE_INFO_PLIST --value "$(cat GoogleService-Info.plist)"` |
