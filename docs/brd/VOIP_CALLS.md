# BRD — VoIP Call Service (HF-101 / HF-103)

**SRS:** REQ-xxx (in-app communication, no phone number exposure)  
**Backend ticket:** HF-101 — Pluggable VoIP call service  
**Mobile ticket:** HF-103 — In-app voice call screen  
**Last Updated:** 2026-06-03

---

## Business Rules

| Rule | Detail |
|------|--------|
| Participants only | Only the resident who created the job and the assigned provider can create/join a call room |
| ACTIVE gate | Call room only available while `job.status = ACTIVE`. Disabled after job completion |
| No phone numbers | In-app call replaces direct phone contact — no personal numbers ever transmitted |
| Provider-agnostic mobile | Mobile reads `provider` field from API response to select the correct SDK at runtime |
| Phase 1 | Self-hosted Jitsi Meet (free, open source) |
| Phase 2 | Agora RTC (swap in by setting `CALL_PROVIDER=agora`; no mobile code change needed) |

---

## API Contract

### `POST /api/v2/jobs/:id/call/room`

**Auth:** Bearer token (any authenticated user)  
**Roles:** Resident (job owner) or Provider (assigned to job)  
**Guards:** Job must exist + caller must be participant + job must be ACTIVE

**Response `201`:**
```json
{
  "provider": "jitsi",
  "roomName": "homefix-job-<job_uuid>",
  "serverUrl": "https://meet.yourserver.com",
  "token": "<jwt>"
}
```

- `provider` — tells mobile which SDK to load (`jitsi` or `agora`)
- `roomName` — deterministic: `homefix-job-{jobId}`. Both participants get the same room. Idempotent.
- `serverUrl` — Jitsi server base URL; absent for Agora
- `token` — signed JWT (Jitsi) or RTC token (Agora); absent in dev when `JITSI_APP_SECRET` is not set

**Errors:**
| Code | HTTP | Condition |
|------|------|-----------|
| `CALL_NOT_AVAILABLE` | 400 | Job not ACTIVE |
| `JOB_ACCESS_DENIED` | 403 | Caller not a job participant |
| `RESOURCE_NOT_FOUND` | 404 | Job not found |

---

## Architecture

```
Mobile (resident)          Backend API           Jitsi Server
      │                        │                       │
      │  POST /call/room ──────►│                       │
      │                        │  (sign JWT locally)   │
      │◄── RoomConfig ─────────│                       │
      │                        │                       │
      │  join room ────────────────────────────────────►│
      │                        │                       │
Mobile (provider)                                      │
      │  POST /call/room ──────►│                       │
      │◄── same RoomConfig ────│                       │
      │                        │                       │
      │  join room ────────────────────────────────────►│
      │◄═══════ WebRTC audio/video (P2P or via JVB) ══►│
```

**Key point:** The backend is **never in the media path**. JWT is generated locally (pure function, no external API call). All audio/video flows directly between clients and the Jitsi Video Bridge (JVB). Backend load from calls = 0 after room creation.

---

## Environment Variables

| Variable | Default | Required in prod | Description |
|----------|---------|------------------|-------------|
| `CALL_PROVIDER` | `jitsi` | No | Switch to `agora` for Phase 2 |
| `JITSI_SERVER_URL` | `https://meet.jit.si` | Yes | Your Jitsi server URL or load balancer |
| `JITSI_APP_ID` | — | Yes (for JWT auth) | Must match `jitsi.conf` app_id |
| `JITSI_APP_SECRET` | — | Yes (for JWT auth) | Must match `jitsi.conf` app_secret |

**Dev:** Omit `JITSI_APP_ID` and `JITSI_APP_SECRET` → tokenless rooms on `meet.jit.si`. Works immediately with zero setup.

> **meet.jit.si limitations discovered during Sprint 6 testing:**
> - Since ~2023, `meet.jit.si` requires participants to **log in with a Google account** to be the room moderator. Without login, you land in a lobby and see "asking to join meeting."
> - The lobby **cannot** be disabled via URL hash params (`#config.lobby.enabled=false`) — the public server blocks client-side config overrides.
> - This means `meet.jit.si` is **development-only for quick smoke tests**, not suitable for real user testing or production. HomeFix users (residents, providers in Bangladesh) should never need a Google account to make a call.
> - With no Google account, both participants get stuck in the lobby unless one of them is logged into Google and can "Admit" the other.

**Production:** Set all four vars. Self-hosted server enforces token auth so only your app can create valid rooms. No Google login required — your JWT is the identity.

---

## JWT Token Structure (Jitsi / JaaS)

For **self-hosted Jitsi**, the token identifies the user and grants moderator status to bypass lobby:

```json
{
  "context": {
    "user": {
      "id": "<callerId>",
      "moderator": true
    },
    "features": {
      "lobby": false
    }
  },
  "aud": "jitsi",
  "iss": "<JITSI_APP_ID>",
  "sub": "<jitsi_hostname>",
  "room": "homefix-job-<jobId>",
  "nbf": <now>,
  "exp": <now + 7200>
}
```

Signed with `HS256` using `JITSI_APP_SECRET`. Expires in 2 hours.

> **Important:** Both the caller AND the recipient need their own JWT token with `moderator: true` and `features.lobby: false`. The current `JitsiProvider` generates a token only for the caller. The recipient's URL (sent via push notification) has no token. On a self-hosted server with `allow_empty_token = false`, the recipient's URL will be rejected. **Fix needed before going live:** call `createRoom` for both participants and include the second token in the push notification payload.

For **8x8 JaaS**, the token structure is slightly different — see the JaaS section below.

---

## Self-Hosted Jitsi Deployment Guide

### Minimum Server Requirements

| Workload | vCPU | RAM | Bandwidth |
|----------|------|-----|-----------|
| Dev / staging | 2 | 2 GB | 10 Mbps |
| Production (voice, ≤50 concurrent) | 2 | 4 GB | 50 Mbps |
| Production (voice, ≤200 concurrent) | 4 | 8 GB | 200 Mbps |
| Production (video HD, ≤50 concurrent) | 4 | 8 GB | 200 Mbps |

HomeFix is **voice-first** — audio requires ~100 Kbps per participant pair. A 2 vCPU / 4 GB server handles ~100 concurrent voice calls comfortably.

### Step 1 — Provision a Ubuntu 22.04 VPS

Any cloud VPS works: AWS EC2, DigitalOcean Droplet, Hetzner, Vultr, etc.

Requirements:
- Public IPv4 address
- Domain name pointing to the server (e.g. `meet.homefix.app`)
- Port 80 and 443 open (HTTP/HTTPS)
- UDP port 10000 open (Jitsi JVB media)
- TCP port 4443 open (Jitsi JVB fallback)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Set hostname (replace with your domain)
sudo hostnamectl set-hostname meet.homefix.app
echo "127.0.0.1 meet.homefix.app" | sudo tee -a /etc/hosts
```

### Step 2 — Install Jitsi Meet

```bash
# Add Jitsi APT repo
curl https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list

sudo apt update
sudo apt install -y jitsi-meet
```

During install:
- **Hostname:** enter your domain (`meet.homefix.app`)
- **SSL certificate:** choose "Generate a new self-signed certificate" (we'll replace with Let's Encrypt next)

### Step 3 — TLS Certificate (Let's Encrypt)

```bash
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
# Enter your email when prompted
```

### Step 4 — Enable JWT Authentication

```bash
sudo apt install -y lua-basexx lua-cjson lua-socket libssl-dev
sudo apt install -y prosody-modules  # if not already installed
```

Edit `/etc/prosody/conf.avail/meet.homefix.app.cfg.lua`:

```lua
VirtualHost "meet.homefix.app"
    authentication = "token"
    app_id = "homefix"                    -- must match JITSI_APP_ID
    app_secret = "your-jitsi-app-secret" -- must match JITSI_APP_SECRET
    allow_empty_token = false
    ...
```

Edit `/etc/jitsi/meet/meet.homefix.app-config.js`:
```javascript
var config = {
    hosts: { ... },
    enableLayerSuspension: true,
    p2p: { enabled: true },  // enables P2P for 1:1 calls (lower server load)
    // ...
};
```

Restart services:
```bash
sudo systemctl restart prosody jicofo jitsi-videobridge2 nginx
```

### Step 5 — Verify JWT is Enforced

Try joining without a token — should be rejected:
```bash
curl -I https://meet.homefix.app/homefix-job-test
# Should redirect to a "token required" page, not let you join
```

Join with a valid JWT (generate one from your backend API):
```http
POST /api/v2/jobs/<active_job_id>/call/room
Authorization: Bearer <token>
```
Open the `serverUrl/roomName?jwt=<token>` URL in a browser — call should connect.

### Step 6 — Scaling with Multiple JVB Nodes (Octo Cascade)

For > 200 concurrent voice calls, add JVB nodes:

```bash
# On each additional JVB server (same Ubuntu 22.04):
sudo apt install -y jitsi-videobridge2

# Edit /etc/jitsi/videobridge/config on the new node:
JVB_HOST=meet.homefix.app       # your Prosody/Jicofo host
JVB_SECRET=your-jvb-secret

sudo systemctl start jitsi-videobridge2
```

Jicofo automatically load-balances across all registered JVB nodes using the Octo cascade protocol. Add/remove JVB nodes without restarting the main server.

### Step 7 — Update HomeFix Backend Env

```env
JITSI_SERVER_URL=https://meet.homefix.app
JITSI_APP_ID=homefix
JITSI_APP_SECRET=your-jitsi-app-secret
```

Restart backend:
```bash
make down && make up
```

---

## 8x8 JaaS — Jitsi as a Service (Alternative to Self-Hosting)

8x8 JaaS is the managed version of Jitsi. No server to provision. Free tier: 5,000 participant-minutes/month, up to 100 participants per room.

**When to use:** You want proper Jitsi (no Google login, no lobby) without running your own server. Good bridge between `meet.jit.si` (unusable for real users) and full self-hosting.

### Setup

1. Sign up at [jaas.8x8.vc](https://jaas.8x8.vc)
2. Create an app → note your **App ID** (looks like `vpaas-magic-cookie-xxxxxxxx`)
3. Generate an **API key** → download the RSA private key (`.pem` file) and note the **Key ID**

### Environment Variables

```env
JITSI_SERVER_URL=https://8x8.vc
JITSI_APP_ID=vpaas-magic-cookie-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JITSI_APP_SECRET=<contents of the .pem private key file>
JITSI_KEY_ID=<key ID from JaaS console>
```

### JaaS JWT Token Structure

JaaS uses RS256 (RSA) signing, not HS256. The token structure differs from self-hosted:

```json
{
  "context": {
    "user": {
      "id": "<callerId>",
      "name": "<display name>",
      "moderator": true
    },
    "features": {
      "lobby": false,
      "recording": false
    }
  },
  "aud": "jitsi",
  "iss": "chat",
  "sub": "8x8.vc",
  "room": "<JITSI_APP_ID>/homefix-job-<jobId>",
  "exp": <now + 7200>
}
```

Signed with `RS256` using the private key. The `JitsiProvider` needs updating to use `RS256` and the JaaS room name format (`<appId>/homefix-job-<jobId>`).

### URL Format

```
https://8x8.vc/<appId>/homefix-job-<jobId>?jwt=<token>
```

Both participants need their own JWT (both with `moderator: true`). No lobby, no Google login.

---

## Phase 2 — Agora RTC Migration

When ready for Phase 2 (higher SLA, less infrastructure management):

1. Create an Agora account at `console.agora.io`
2. Create a project → copy `App ID` and `App Certificate`
3. Implement `AgoraProvider` in `backend/src/modules/calls/providers/agora.provider.ts`:
   ```typescript
   export class AgoraProvider implements ICallProvider {
     async createRoom(jobId: string, userId: string): Promise<RoomConfig> {
       // generate Agora RTC token using agora-token npm package
       // ...
       return { provider: 'agora', roomName, token };
     }
   }
   ```
4. Register in `call.service.ts` resolver (the `'agora'` branch)
5. Set `CALL_PROVIDER=agora` in env
6. Mobile auto-selects `agora-rn-sdk` because `provider === 'agora'` in the response

No mobile code changes needed — mobile reads the `provider` field at runtime.

---

## Cost Comparison

| Option | Cost | Google login required | Lobby issue | Setup Effort |
|--------|------|-----------------------|-------------|--------------|
| `meet.jit.si` (public) | Free | Yes (blocks real users) | Yes (can't disable) | Zero — **smoke tests only** |
| 8x8 JaaS | Free ≤5,000 min/mo | No | No (JWT controls it) | ~1 hour |
| Self-hosted Jitsi | VPS ~$10–20/mo | No | No (config controls it) | ~2 hours |
| Agora RTC | ~$0.99/1,000 min | No | N/A | 1 day (Phase 2) |

**Recommendation:** Use **8x8 JaaS** for development and early production (free tier covers thousands of calls/month). Migrate to self-hosted or Agora when monthly minutes consistently exceed 5,000.
