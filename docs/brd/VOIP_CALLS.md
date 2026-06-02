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

**Production:** Set all four vars. Self-hosted server enforces token auth so only your app can create valid rooms.

---

## JWT Token Structure (Jitsi)

```json
{
  "context": {
    "user": { "id": "<callerId>" }
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

| Option | Cost | SLA | Setup Effort |
|--------|------|-----|--------------|
| `meet.jit.si` (public) | Free | None | Zero — dev only |
| Self-hosted Jitsi | VPS cost (~$10–20/mo) | Yours | ~2 hours |
| Agora RTC | ~$0.99/1000 min | 99.9% | 1 day (Phase 2) |

**Recommendation:** Start with self-hosted Jitsi. Migrate to Agora when monthly call minutes consistently exceed 50,000 (≈ $50/mo threshold).
