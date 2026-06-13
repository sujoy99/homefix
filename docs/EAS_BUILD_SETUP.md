# EAS Build Setup — HomeFix Mobile

End-to-end guide for building and submitting the HomeFix Expo app with EAS Build.

---

## Prerequisites

| Requirement | Version / Notes |
|-------------|-----------------|
| Node.js | 20 LTS |
| Expo CLI | `npx expo` (no global install needed) |
| EAS CLI | `npm install -g eas-cli` |
| Expo account | [expo.dev](https://expo.dev) — free tier is enough for builds |
| Apple account | Required only for iOS builds / App Store submit |
| Google Play account | Required only for Android submit |

---

## 1. One-time Setup

### 1.1 Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login           # authenticates with your Expo account
```

### 1.2 Link the project to Expo

Run once from `mobile/`:

```bash
cd mobile
eas build:configure    # creates / updates eas.json and sets expo.extra.eas.projectId in app.config.js
```

> **What this does:** EAS creates a project record on expo.dev and writes the `projectId` UUID into your config. Commit the resulting `eas.json` changes.

### 1.3 After `eas build:configure`, add `projectId` to `app.config.js`

The CLI injects the project ID into `app.json`. Since we use `app.config.js`, move it there:

```js
// mobile/app.config.js  (extra block added by EAS — keep it)
module.exports = {
  ...base.expo,
  extra: {
    eas: { projectId: '<YOUR_PROJECT_ID_UUID>' },
  },
  // ... rest of config
};
```

---

## 2. Google Maps API Key

`react-native-maps` on **iOS uses Apple Maps (MapKit) by default** — no API key needed. A Google Maps key on iOS is only required if you pass `provider={PROVIDER_GOOGLE}` to `MapView`; we don't, so iOS is key-free.

**Android always uses Google Maps** and crashes without a key. The key is injected at native build time via the `react-native-maps` Expo plugin in `app.config.js`.

### 2.1 Create the Android key

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **API key**
3. Enable **Maps SDK for Android** for the key
4. Restrict the key by **Android app** → add package `com.homefix.mobile`

> **Note:** You can use a single unrestricted key during development. Use a restricted key for production.

### 2.2 Store the Android key as an EAS secret

Never commit the API key to git. Store it as an EAS environment secret:

```bash
# From the mobile/ directory (or repo root with --scope project)
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_ANDROID_KEY_HERE"
```

EAS injects this as `process.env.GOOGLE_MAPS_API_KEY` during the build. `app.config.js` picks it up:

```js
[
  'react-native-maps',
  {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    // iOS: no key needed — MapView uses Apple Maps (MapKit) by default
  },
],
```

### 2.3 Local development (without a key)

`MapView` renders with a **"For development purposes only"** watermark when the key is empty — the app does **not** crash. An `MapErrorBoundary` in `LocationPicker.native.tsx` catches any native exception and shows a graceful fallback UI, so address entry still works via GPS or manual typing.

To test with a real key locally, create `mobile/.env.local`:

```
GOOGLE_MAPS_API_KEY=AIza...
```

Then run a dev build (not Expo Go — Expo Go uses its own key):

```bash
eas build --profile development --platform android
```

---

## 3. Build Profiles

`eas.json` defines three profiles:

| Profile | Use | Distribution | Notes |
|---------|-----|--------------|-------|
| `development` | Internal testing with dev client | Internal (APK/IPA) | Enables fast refresh, debugger |
| `preview` | QA / stakeholder review | Internal (APK/IPA) | Production JS, no debugger |
| `production` | App Store / Play Store | Store | Auto-increments build number |

### 3.1 Current `eas.json`

```json
{
  "cli": { "version": ">= 20.1.0", "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "autoIncrement": true }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.2 Recommended additions

Add `env` blocks to pass extra secrets per profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_ENV": "preview" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "APP_ENV": "production" }
    }
  }
}
```

---

## 4. Running Builds

All commands run from `mobile/`.

### 4.1 Development build (installs dev client on device)

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios

# Both platforms at once
eas build --profile development --platform all
```

After the build completes, scan the QR code on expo.dev to install the APK/IPA directly on your device.

> **You only need to rebuild when native code changes** — new package with native modules, new permission, or a plugin config change. For JS-only changes, just restart Metro and reload.

See **Section 4A** for how to connect the installed APK to Metro on any network.

---

## 4A. Connecting the Dev Client APK to Metro (Any Network)

This section explains how to do daily development after the APK is installed. You need this every time you sit down to test — no new EAS build required.

### How it works

The development APK is a shell — it contains no JavaScript. Every time you open it, it connects to Metro running on your computer to download the JS bundle live. This is what enables fast refresh.

```
[Android Phone]  ──WiFi──►  [Metro on your computer :8081]  ──►  JS bundle
```

Both the phone and the computer **must be on the same WiFi network**.

---

### Step 1 — Find your computer's LAN IP

This IP changes whenever you join a different WiFi network. Find it fresh each time.

**On WSL2 (mirrored networking mode — HomeFix dev setup):**

```bash
ip addr show eth2 | grep "inet "
# or simpler:
hostname -I | awk '{print $1}'
```

**On Windows PowerShell:**

```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
```

**On macOS / Linux:**

```bash
ipconfig getifaddr en0    # macOS (en1 for Ethernet)
ip route get 1 | awk '{print $7}'  # Linux
```

You'll get something like `192.168.X.X` or `10.X.X.X`. Use this IP in the next step.

---

### Step 2 — Allow port 8081 through Windows Firewall (one-time per machine)

Run once in **PowerShell as Administrator**. It persists across reboots and WiFi changes:

```powershell
New-NetFirewallRule -DisplayName "Metro Bundler 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

Verify it exists later with:

```powershell
Get-NetFirewallRule -DisplayName "Metro Bundler 8081"
```

---

### Step 3 — Start Metro with your current IP

Always run from `mobile/` — Metro must start from the project directory, not the repo root.

```bash
cd /home/sujoy/projects/homefix/mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_LAN_IP> npx expo start --host lan --dev-client
```

Replace `<YOUR_LAN_IP>` with the IP from Step 1. Example:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.55 npx expo start --host lan --dev-client
```

Metro will print a QR code and a URL like:

```
exp+homefix://expo-development-client/?url=http%3A%2F%2F192.168.1.55%3A8081
```

---

### Step 4 — Connect the APK to Metro

1. Open the installed **HomeFix dev APK** on your phone
2. You will see the **expo-dev-client launcher screen** (not your app yet — this is normal)
3. Tap the **camera / QR icon** on that screen
4. Scan the QR code printed in your **Metro terminal** (not the EAS build QR — that was for downloading the APK)
5. Your app loads within ~30 seconds (first bundle is slow; subsequent ones are fast)

> **If you see a shake-menu "Change Bundle Location" instead of the launcher:** The app connected to a previous server. Shake the phone → Change Bundle Location → enter `http://<YOUR_LAN_IP>:8081`

---

### Step 5 — Verify Metro is serving correctly

If the app fails to load, run this from WSL2 to confirm Metro is healthy:

```bash
curl http://127.0.0.1:8081/status
# Expected: packager-status:running
```

If Metro returns an error when bundling (not just a network error), check the Metro terminal for the specific module that failed.

---

### WSL2 — portproxy (only needed if NOT in mirrored networking mode)

HomeFix dev uses WSL2 **mirrored networking** (`networkingMode=mirrored` in `.wslconfig`), which gives WSL2 the same IP as Windows. **Portproxy is not needed in this setup.**

If you are on a machine where WSL2 uses NAT mode (WSL2 has a private `172.x.x.x` IP), you need to forward port 8081 from Windows to WSL2. Run in **PowerShell as Administrator**:

```powershell
# Find WSL2 IP first
wsl hostname -I

# Then forward (replace 172.x.x.x with actual WSL2 IP)
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=172.x.x.x
```

This rule is lost on reboot. Re-run it if Metro was working before but stopped after a restart.

---

### Quick-start checklist (every dev session)

- [ ] Phone and computer on **same WiFi**
- [ ] Find current LAN IP (`hostname -I | awk '{print $1}'`)
- [ ] Start Metro from `mobile/`: `REACT_NATIVE_PACKAGER_HOSTNAME=<IP> npx expo start --host lan --dev-client`
- [ ] Open APK → launcher screen → scan Metro QR
- [ ] App loads ✓

---

### 4.2 Preview build (QA / internal distribution)

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

Share the install link from expo.dev with testers. No TestFlight or Play Store needed.

> ⚠️ **Known issue — `EXPO_PUBLIC_API_URL` not yet implemented (Sprint 8)**
>
> Preview builds do **not** have Metro running, so `Constants.expoConfig?.hostUri` is `undefined` in `mobile/api/client.ts`. The API client falls back to `"localhost"`, which on a physical phone points to the phone itself — all API calls fail.
>
> **Fix required before preview builds are usable:**
>
> 1. Update `mobile/api/client.ts` to prefer an env var:
>    ```typescript
>    const localhost = debuggerHost?.split(':')[0];
>    export const SERVER_ROOT =
>      process.env.EXPO_PUBLIC_API_URL ??
>      (Platform.OS === 'web' ? 'http://localhost:4000' : `http://${localhost}:4000`);
>    ```
> 2. Set `EXPO_PUBLIC_API_URL` to a publicly reachable backend URL:
>    - **Local backend exposed via ngrok:** `ngrok http 4000` → use the `https://xxxx.ngrok.io` URL
>    - **Deployed backend (Railway etc.):** use the deployment URL directly
> 3. Add to `mobile/.env` (Expo reads `.env` automatically since SDK 49 — never commit to git):
>    ```
>    EXPO_PUBLIC_API_URL=https://xxxx.ngrok.io
>    ```
> 4. For EAS builds, store as an EAS build env var in `eas.json` under the `preview` profile's `env` block.
>
> **Until this is done, preview builds can only be tested against a deployed backend.**
> Tracked as Sprint 8 ticket HF-075B.

### 4.3 Production build

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

> `autoIncrement: true` bumps the build number automatically on expo.dev — no manual version management needed.

### 4.4 Local builds (offline / debugging native issues)

```bash
eas build --profile development --platform android --local
```

Requires Android SDK + Gradle locally. Output is an `.apk` in `mobile/`.

---

## 5. Android Signing

### 5.1 Let EAS manage the keystore (recommended)

On the first Android production build, EAS prompts:

```
Generate a new Android Keystore? (Y/n)
```

Choose **Y**. EAS stores the keystore securely on expo.dev. You never touch the `.jks` file.

### 5.2 Bring your own keystore

If you already have a keystore (e.g., from a previous Play Store upload):

```bash
eas credentials --platform android
# → Keystore → Upload
```

---

## 6. iOS Signing

EAS automates provisioning profiles and certificates through Apple's API.

### 6.1 One-time Apple credentials setup

```bash
eas credentials --platform ios
```

EAS will:
1. Log in to your Apple Developer account (prompts for Apple ID + password / App Store Connect API key)
2. Create / fetch a **Distribution Certificate**
3. Create / fetch a **Provisioning Profile** for `com.homefix.mobile`

### 6.2 App Store Connect API key (non-interactive builds / CI)

Create an API key at [App Store Connect → Users → Integrations](https://appstoreconnect.apple.com/access/api):

- Role: **App Manager** or **Developer**
- Download the `.p8` file

Store as EAS secrets:

```bash
eas secret:create --scope project --name APPLE_API_KEY_ID        --value "XXXXXXXXXX"
eas secret:create --scope project --name APPLE_API_KEY_ISSUER_ID --value "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# The .p8 file content (multi-line) — paste or pipe
eas secret:create --scope project --name APPLE_API_PRIVATE_KEY   --value "$(cat AuthKey_XXXXXXXXXX.p8)"
```

---

## 7. Submitting to Stores

### 7.1 Google Play

1. Create the app manually in Play Console first (EAS cannot create it)
2. Download a **Service Account JSON** key from Google Play Console → Setup → API access
3. Store as an EAS secret:
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY --value "$(cat service-account.json)"
   ```
4. Update `eas.json` submit block:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "$GOOGLE_SERVICE_ACCOUNT_KEY",
         "track": "internal"
       }
     }
   }
   ```
5. Submit:
   ```bash
   eas submit --platform android --profile production
   ```

### 7.2 App Store

```bash
eas submit --platform ios --profile production
```

EAS uses the Apple credentials stored in step 6. The build is submitted to **TestFlight** first; promote to App Review from App Store Connect.

### 7.3 Submit immediately after build

```bash
eas build --profile production --platform all --auto-submit
```

---

## 8. Over-the-Air (OTA) Updates

For JS-only changes (no native code changes), use EAS Update to push without a store release:

### 8.1 Configure

Add to `app.config.js`:

```js
runtimeVersion: { policy: 'appVersion' },
updates: {
  url: 'https://u.expo.dev/<YOUR_PROJECT_ID>',
},
```

### 8.2 Push an update

```bash
eas update --branch production --message "Fix: map fallback for missing API key"
```

Clients running the matching `runtimeVersion` download the update silently on next launch.

> **Rule:** If you change native code (add a plugin, change permissions, upgrade a native package), you **must** cut a new EAS build — OTA updates cannot deliver native changes.

---

## 9. CI / CD (GitHub Actions example)

```yaml
# .github/workflows/eas-build.yml
name: EAS Build
on:
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g eas-cli
      - run: npm ci
        working-directory: mobile
      - name: EAS Build (preview)
        working-directory: mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}   # Create at expo.dev → Account Settings → Access Tokens
        run: eas build --profile preview --platform android --non-interactive
```

---

## 10. Secrets Reference

### 10.1 List secrets

```bash
# From mobile/ directory
eas env:list                   # new command (recommended)
eas secret:list                # deprecated alias — still works
```

`eas env:list` shows all secrets scoped to the project and your account. Secrets stored here are injected as environment variables at EAS build time — they are never exposed in the APK or in logs.

---

### 10.2 Add a secret

```bash
# Generic form
eas secret:create --scope project --name <SECRET_NAME> --value "<value>"

# For file-based secrets (JSON, plist) — read from file so shell doesn't mangle special chars
eas secret:create --scope project --name <SECRET_NAME> --value "$(cat path/to/file)"
```

`--scope project` — available to all builds for this project (recommended).  
`--scope account` — available to all projects under your Expo account.

> **Note:** `eas secret:create` is the stable command for setting secrets. `eas env:create` is the newer equivalent — both work. Use `secret:create` until the env commands are fully stable.

---

### 10.3 Update an existing secret

EAS does not support editing a secret value in place. Delete and recreate:

```bash
eas secret:delete --name <SECRET_NAME>
eas secret:create --scope project --name <SECRET_NAME> --value "<new value>"
```

---

### 10.4 HomeFix secrets — full reference

| Secret name | Scope | Where used in build | How to set |
|-------------|-------|---------------------|-----------|
| `GOOGLE_MAPS_API_KEY` | project | `app.config.js` → `withGoogleMapsAndroid` plugin injects into `AndroidManifest.xml` | `eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "AIza..."` |
| `GOOGLE_SERVICES_JSON` | project | `app.config.js` `android.googleServicesFile` → links Android app to Firebase project (`homefix-cd142`); enables FCM token registration | `eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value "$(cat mobile/google-services.json)"` |
| `GOOGLE_SERVICE_INFO_PLIST` | project | iOS push notifications (future) — `app.config.js` iOS block | `eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --value "$(cat GoogleService-Info.plist)"` |
| `EXPO_TOKEN` | account | CI/CD authentication for non-interactive EAS builds | expo.dev → Account Settings → Access Tokens → Create |
| `APPLE_API_KEY_ID` | project | iOS non-interactive App Store submission | From Apple Developer → Keys |
| `APPLE_API_KEY_ISSUER_ID` | project | iOS non-interactive App Store submission | From Apple Developer → Keys |
| `APPLE_API_PRIVATE_KEY` | project | iOS non-interactive App Store submission | `.p8` file contents |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | project | Android Play Store submission via `eas submit` | Google Play Console → Service Accounts |

> **`FCM_SERVICE_ACCOUNT_JSON` is a backend secret — not an EAS secret.** It goes in `backend/.env.development` (local) or your Railway/production env vars. See [docs/PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md).

---

### 10.5 Current status

Run from `mobile/` to see what is already configured:

```bash
eas env:list
```

Expected for a fully working Android dev build:

| Secret | Status |
|--------|--------|
| `GOOGLE_MAPS_API_KEY` | ✅ Set |
| `GOOGLE_SERVICES_JSON` | ⚠️ Set this next (see command below) |

**Set `GOOGLE_SERVICES_JSON` now** (required for FCM push in EAS builds):

```bash
cd /home/sujoy/projects/homefix/mobile
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value "$(cat google-services.json)"
```

Then rebuild:

```bash
eas build --profile development --platform android
```

---

## 11. Troubleshooting

### Push notifications not arriving

**Cause (most common):** `FCM_SERVICE_ACCOUNT_JSON` is missing from the backend environment, so the backend is using the no-op `StubPushProvider`.

**Fix:**
1. Add `FCM_SERVICE_ACCOUNT_JSON` to `backend/.env.development` (full service account JSON on one line).
2. Restart the backend: `make down && make start`.
3. Full setup guide: [docs/PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md).

Other causes and fixes:

| Symptom | Fix |
|---------|-----|
| Backend logs `[CallService] push failed` | Regenerate service account key in Firebase Console |
| Notification arrives, tap does nothing | Check `data.jobId` is included in the notification payload |
| Backend logs "FCM send OK" but push never arrives | `google-services.json` missing from EAS build — `getDevicePushTokenAsync()` returned a token from Expo's shared Firebase project; backend service account can't deliver to it. Fix: place `google-services.json` in `mobile/`, verify `android.googleServicesFile` in `app.config.js`, run new EAS build. |
| Tapping `NEW_MESSAGE` notification opens job detail instead of chat | Old APK before routing fix. Tap should open `/(app)/booking/job/chat/:id`. |
| Permission denied on device | Settings → Apps → HomeFix → Notifications → Allow |
| Works on Android, not iOS | iOS Firebase setup not yet done — see [PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md) |

> Push notifications only work on physical devices — they do not fire on simulators or emulators.

---

### "Unable to load script" / blank screen in dev client

**Cause (most common):** Metro is not running, or was started from the wrong directory.

**Fix:**
1. Stop any running Metro process (`Ctrl+C`).
2. Restart Metro from `mobile/` — **not** the repo root:
   ```bash
   cd /home/sujoy/projects/homefix/mobile
   REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_LAN_IP> npx expo start --host lan --dev-client
   ```
3. Verify Metro is healthy: `curl http://127.0.0.1:8081/status` → should return `packager-status:running`

If Metro returns a bundle error (not a network error), check the Metro terminal for the failing module name.

---

### `can't find ViewManager 'RNSVGPath'` (or any ViewManager) in dev client

**Cause:** The APK is missing a native module that the JS bundle expects. This happens when:
- A package was added to `mobile/package.json` *after* the APK was built, or
- A package is hoisted to the workspace root `node_modules` by npm and Metro can bundle it, but EAS never compiled its native code because it wasn't in `mobile/package.json`.

**Fix:**
1. Install the missing package: `npx expo install <package-name>` (from `mobile/`)
2. Run a new EAS build: `eas build --profile development --platform android`
3. Install the new APK — the old APK cannot load the new native module

**Known packages that must be explicit in `mobile/package.json`** even though they come in transitively via `react-native-reanimated`:

| Package | Why needed |
|---|---|
| `react-native-worklets` | Peer dependency of reanimated v4; required for worklets JS execution engine |
| `react-native-svg` | Imported by reanimated v4's CSS animation helpers; ViewManager `RNSVGPath` |

---

### EAS build fails: `A problem occurred evaluating project ':react-native-reanimated'`

**Cause:** `react-native-worklets` peer dependency was missing from `mobile/package.json`.

**Fix:**
```bash
cd mobile
npx expo install react-native-worklets
eas build --profile development --platform android
```

---

### `java.net.SocketTimeoutException` on device (can't reach Metro)

The phone cannot reach Metro on your computer. Work through this checklist:

1. **Same network?** Phone and computer must be on the same WiFi. A phone on mobile data won't reach Metro.
2. **Correct IP?** Find it fresh: `hostname -I | awk '{print $1}'` in WSL2. The IP changes each time you join a new network.
3. **Firewall?** Run once in PowerShell as Admin:
   ```powershell
   New-NetFirewallRule -DisplayName "Metro Bundler 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
   ```
4. **WSL2 portproxy lost after reboot?** (NAT mode only — not needed in mirrored mode)
   ```powershell
   netsh interface portproxy show all   # check if rule exists
   netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=127.0.0.1
   ```
5. **Test from phone browser:** Open `http://<YOUR_LAN_IP>:8081/status` in Chrome on the phone. If it shows `packager-status:running`, Metro is reachable and the issue is in the dev client connection. If it times out, the firewall or network is blocking it.

---

### 429 Too Many Requests on login during development

The auth rate limiter (100 requests / 15 min in dev) was exhausted during repeated testing. Fix: restart the backend Docker container to reset the in-memory counter:

```bash
make down && make start
```

---

### Map crashes on Android (`MapView` / Google Maps SDK)

**Cause:** `GOOGLE_MAPS_API_KEY` not set or `react-native-maps` plugin missing from `app.config.js`.

**Fix:**
1. Verify the plugin is present in `app.config.js` (it is — see the `react-native-maps` entry).
2. Add the EAS secret: `eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIza..."`.
3. Trigger a new build — OTA update is not enough (this is a native config change).

The `MapErrorBoundary` in `LocationPicker.native.tsx` prevents a crash in the meantime and shows a fallback UI.

---

### `eas build:configure` fails with "project not found"

Run `eas login` first and make sure you're in the `mobile/` directory.

### Build fails with "Missing credentials"

Run `eas credentials --platform android` (or `ios`) to generate / upload signing assets.

### iOS build stuck on "Waiting for build"

Free Expo accounts share a build queue. Upgrade to EAS Production plan for priority queue access, or use `--local` to build on your machine.

### `autoIncrement` not working

`appVersionSource: "remote"` in `eas.json` is required. This tells EAS to track the build number on expo.dev rather than reading it from `app.json`.
