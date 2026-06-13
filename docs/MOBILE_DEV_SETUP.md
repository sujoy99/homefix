# HomeFix — Mobile Dev Setup & Testing Guide

> **Environment:** WSL2 on Windows · Expo SDK 54 · React Native · Expo Go or Dev Build
> **Last updated:** 2026-06-13

---

## New Machine Setup Checklist

Use this section when setting up from scratch. Skip to **Method 1** below once the one-time steps are done.

### Step 1 — Install prerequisites (Windows host)

| Tool | How |
|------|-----|
| Git | [git-scm.com](https://git-scm.com) |
| Docker Desktop | [docker.com](https://www.docker.com/products/docker-desktop/) — includes Docker + Compose |
| WSL2 | `wsl --install` in PowerShell (Admin), then reboot |
| Node 20 LTS | Inside WSL2: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh \| bash && nvm install 20 && nvm use 20` |
| EAS CLI | Inside WSL2: `npm install -g eas-cli` |
| Expo Go app | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779) |

### Step 2 — Enable WSL2 mirrored networking (one-time, eliminates port-forwarding)

Add to `C:\Users\<your-username>\.wslconfig` on Windows:

```ini
[wsl2]
networkingMode=mirrored
```

Then run in PowerShell: `wsl --shutdown`, reopen WSL2. This is permanent — no repeat needed after reboots. With mirrored networking, your phone on WiFi can reach WSL2 services directly at your Windows IP — no `netsh` port proxy needed.

> **If you can't use mirrored networking** (e.g. managed/locked Windows machine), use the `netsh` portproxy approach in Method 2 below instead.

### Step 3 — Clone and install

```bash
git clone <repo-url>
cd homefix
npm install      # installs all workspaces (backend, mobile, packages/shared) in one command
```

### Step 4 — Configure backend secrets

```bash
cp backend/.env.sample backend/.env.development
ln -sf backend/.env.development .env    # repo-root symlink — required for docker compose
```

Fill in `backend/.env.development`:

| Variable | How to get it |
|----------|--------------|
| `JWT_ACCESS_SECRET` | `openssl rand -hex 32` (run in WSL2) |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` |
| `DEFAULT_ADMIN_MOBILE` | e.g. `00000000000` |
| `DEFAULT_ADMIN_PASSWORD` | e.g. `Admin@1234` |
| `DEFAULT_ADMIN_NAME` | e.g. `HomeFix Admin` |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Services → Credentials → Maps SDK for Android key |
| `FCM_SERVICE_ACCOUNT_JSON` | Firebase Console → Project Settings → Service accounts → Generate new private key → paste full JSON as one line. **Omit entirely to use stub provider** (app works, push disabled). |
| `JITSI_*` | Optional — omit for dev (falls back to `meet.jit.si` tokenless) |

### Step 5 — Start the backend

```bash
make up        # builds Docker images, starts postgres, runs all migrations automatically
make seed      # one-time: roles, permissions, service categories, admin user (idempotent)
make restart   # reloads the RBAC permission cache after seeding (otherwise all protected routes return 403)
make logs      # verify backend started and migrations ran cleanly
```

### Step 6 — Run the mobile app

`mobile/google-services.json` is **not committed** to git (contains a Google API key). Copy it from a secure location (team password manager or ask the project lead). Place it at `mobile/google-services.json` — it is only required when doing a local native build. For Expo Go / Metro, it is not needed.

```bash
cd mobile
npx expo start --tunnel     # simplest for first run — works on any network
```

Scan the QR with **Expo Go** on your phone. All features work except FCM push notifications (Expo Go SDK 53+ restriction — see "Testing push notifications" section below).

### Step 7 — EAS login (for cloud builds only)

Only needed when you want to build an APK via EAS:

```bash
eas login       # authenticates with your expo.dev account
```

---

## Updating an Existing Clone (git pull workflow)

Run these every time you pull new commits:

```bash
git pull                  # get latest code
npm install               # update all workspace packages (root + backend + mobile + shared)
```

Then decide what else is needed based on what changed:

| What changed in the pull | Extra step |
|--------------------------|-----------|
| `backend/src/**` only (JS/TS) | Nothing — nodemon hot-reloads automatically |
| `backend/package.json` (new npm package) | `make up` — rebuilds the Docker image with new deps |
| `backend/src/db/migrations/**` (new migration) | `make migrate` |
| `mobile/` JS/TS files only | Restart Metro (`r` in Expo terminal) or it hot-reloads |
| `mobile/package.json` — JS-only package (axios, zustand, etc.) | Restart Metro |
| `mobile/package.json` — native package (new Expo plugin or native module) | New EAS build required — see below |
| `mobile/app.config.js` — plugin or `android`/`ios` block changed | New EAS build required |
| `mobile/google-services.json` changed | New EAS build required |
| `packages/shared/**` | Restart Metro (shared package is symlinked — changes are picked up automatically) |

### Quick check — did native deps change?

```bash
git diff HEAD~1 mobile/package.json mobile/app.config.js mobile/google-services.json
```

If any of those three files changed and the diff includes a new `expo-*` plugin, a new entry in `android`/`ios` config blocks, or a change to `google-services.json` → **you need a new EAS build**.

### Rebuild EAS dev build after native changes

```bash
cd mobile
eas build --profile development --platform android
# Install the new APK on your phone, then start Metro:
npx expo start --dev-client
```

### Run new migrations

```bash
make migrate     # safe to run even if no new migrations — no-op if already applied
```

### Rebuild backend Docker image (new backend packages)

```bash
make down && make up     # full rebuild — use when backend/package.json changed
# OR just:
make up                  # docker compose builds only if image is stale
```

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node 20+ | via nvm in WSL2 (see New Machine Setup above) |
| Docker Desktop for Windows | [docker.com](https://www.docker.com/products/docker-desktop/) — enables `make start` |
| Expo Go (phone) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779) |
| Android Studio (optional) | Only needed for a local dev build (push notifications) |

---

## Method 1 — Tunnel Mode (simplest, no networking setup)

Works for all features **except** FCM push notifications. Traffic routes through ngrok — slightly slower but zero config.

```bash
# Terminal 1 — start backend (from repo root)
make start

# Terminal 2 — start Expo
cd mobile
npx expo start --tunnel
```

Scan the QR code with Expo Go on your phone. Done.

---

## Method 2 — LAN Mode (faster, recommended for daily use)

Both your laptop and phone must be on the **same WiFi network**.

### Step 1 — Find your Windows WiFi IP

**Option A — from WSL2:**
```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
# e.g. 192.168.1.105
```

**Option B — from Windows PowerShell:**
```powershell
ipconfig
# Look for "Wireless LAN adapter Wi-Fi" → IPv4 Address
```

### Step 2 — One-time Windows port forwarding (run as Administrator)

WSL2 has its own internal IP that your phone can't reach directly. This forwards Expo's Metro port from your Windows WiFi IP → WSL2.

```powershell
# Get WSL2's current internal IP
$wslIp = (wsl hostname -I).Trim().Split(' ')[0]

# Forward Metro bundler port
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8081 connectaddress=$wslIp connectport=8081

# Allow through Windows Firewall
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="HomeFix API 4000"  dir=in action=allow protocol=TCP localport=4000
```

> **Note:** The backend port 4000 is already exposed by Docker Desktop to the Windows host — no extra forwarding needed. Only Metro (8081) needs the proxy.

> **WSL2 IP changes on reboot.** Re-run the `netsh interface portproxy add` command after each Windows restart (WSL2 gets a new IP). The firewall rules persist.

### Step 3 — Start everything

```bash
# Terminal 1 — backend (repo root)
make start

# Terminal 2 — Expo (replace IP with yours)
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.105 npx expo start --host lan
```

Scan the QR code with Expo Go.

### Clean up when done

```powershell
# Remove the port proxy (optional — does no harm if left)
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8081

# View current proxies
netsh interface portproxy show all
```

---

## Method 3 — USB (Android only, no WiFi needed)

Useful if WiFi is not available or unreliable.

```bash
# Enable USB debugging on your Android phone:
# Settings → About Phone → tap "Build number" 7 times → Developer Options → USB Debugging ON

# Connect phone via USB, then in WSL2:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:4000 tcp:4000

# Start Expo normally
cd mobile
npx expo start
```

The `adb reverse` command makes the phone treat `localhost:8081` and `localhost:4000` as the laptop.

---

## What works in Expo Go vs. what requires a Dev Build

| Feature | Expo Go | Dev Build |
|---------|:-------:|:---------:|
| Login / Register / Onboarding | ✅ | ✅ |
| Booking wizard, job lifecycle | ✅ | ✅ |
| Review & rating — HF-050 | ✅ | ✅ |
| Notification center UI — HF-052 | ✅ | ✅ |
| Provider live location — HF-053 | ✅ | ✅ |
| In-app chat (text / image / voice) — HF-102 | ✅ | ✅ |
| Voice call via Jitsi browser — HF-103 | ✅ | ✅ |
| **FCM push notifications — HF-051** | ❌ SDK 53+ restriction | ✅ |

---

## Testing push notifications — Dev Build

Push requires a custom development build installed on the phone (not Expo Go).

### Option A — Local build (Android, requires Android Studio + JDK 17)

```bash
cd mobile
npx expo run:android        # builds and installs APK on connected USB device
```

Then start Expo in dev-client mode:
```bash
npx expo start --dev-client
```
Open the installed **HomeFix Dev** app and scan the QR code.

### Option B — EAS cloud build (Android + iOS)

```bash
npm install -g eas-cli
eas login                                          # expo.dev account required
eas build --profile development --platform android
# EAS sends you a download link — install the APK on your phone
npx expo start --dev-client
```

### iOS push requirements

- Apple Developer account required
- APNs Auth Key (`.p8` file) uploaded to Firebase Console → Project Settings → Cloud Messaging
- Build via `eas build --platform ios` (requires paid Apple Developer membership)

---

## Console errors & red overlays — why they appear and how they're handled

In Expo Go development mode, `console.error()` triggers a full-screen red overlay and yellow banners. The app suppresses known, non-actionable ones in `app/_layout.tsx` via `console.error` intercept + `LogBox.ignoreLogs`.

| Error message | Root cause | Status |
|---|---|---|
| `expo-notifications: Android Push notifications removed` | expo-notifications was removed from Expo Go in SDK 53 | ✅ Suppressed — use dev build for push |
| `expo-notifications functionality is not fully supported` | Same as above | ✅ Suppressed |
| `[expo-av]: Expo AV has been deprecated` | expo-av deprecated in SDK 54; migrate to expo-audio in future sprint | ✅ Suppressed — still works |
| `Require cycle: store/authStore → api/client` | Intentional stable cycle documented in CLAUDE.md | ✅ Suppressed |
| `Linking requires a build-time setting scheme` | `scheme` not set in app.json — dev-only warning | ✅ Suppressed |
| `AxiosError` / `Network request failed` | Backend not running, or API call error handled by try-catch | ✅ Suppressed — errors shown in UI via toast |
| `Request failed with status code 4xx/5xx` | API errors handled by response interceptor / TanStack Query | ✅ Suppressed |

> **Real errors are still shown.** Only the patterns listed above are filtered. Any unexpected JS exception or thrown error will still show the red overlay.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| "Network request failed" on login | Backend not running | `make start` from repo root; check `make logs` |
| QR scans but app won't load | Phone not on same WiFi, or firewall blocking 8081 | Use tunnel mode: `npx expo start --tunnel` |
| API calls fail with connection refused | Backend port 4000 not accessible | Check Docker: `make start`; verify firewall rule added |
| Chat shows Wi-Fi-Off icon | Socket.IO can't reach backend | Check backend logs: `make logs` |
| Voice call → "Could not start call" | Backend not running or job not ACTIVE | Check job status + backend logs |
| Push not arriving | Expected in Expo Go | Build a dev build (see above) |
| App crashes on start | Usually a JS module error | Check Metro terminal output for the real error |
| "Unable to resolve module" | New package installed but not linked | Restart Metro: press `r` in Expo terminal |
| Port forwarding not working after reboot | WSL2 IP changed | Re-run `netsh interface portproxy add` with new WSL2 IP |

---

## Useful commands

```bash
# Backend
make start          # start containers
make stop           # stop containers
make logs           # tail backend logs
make db             # open psql shell
make migrate        # run pending migrations
make seed           # seed test accounts

# Mobile (from mobile/)
npx expo start --tunnel           # tunnel mode (simplest)
npx expo start --host lan         # LAN mode (set REACT_NATIVE_PACKAGER_HOSTNAME first)
npx expo start --dev-client       # dev build mode (after installing dev build on phone)
npm test                           # run all 246 tests
npm test -- --testPathPattern=<file>  # run a single test file

# Seed accounts (always available)
# Admin:    00000000000 / Admin@1234
# Provider: 01711223344 / Provider@1234
# Resident: 01811223344 / Resident@1234
```
