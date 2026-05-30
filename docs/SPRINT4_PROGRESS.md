# Sprint 4 — Voice & Accessibility — Progress Tracker

> **Branch:** `feature/sprint-4-mobile`  
> **Last updated:** 2026-05-30  
> **Tests:** 50/50 passing (after HF-044 commit)

---

## Ticket Status

| Ticket | Title | Status | Commit |
|--------|-------|--------|--------|
| HF-042 | Voice note recording in booking flow | ✅ Done | `58fb680` |
| HF-045 | Voice note playback in provider job detail | ✅ Done | `becce9d` |
| HF-044 | Text-to-Voice "Read Aloud" for providers | ✅ Done | `1c95cef` |
| HF-043 | Voice-to-Text / Speech-to-Text | 🔮 Future Development | — |
| HF-046 | Accessibility audit | ⏳ Pending | — |

---

## Detailed Step Checklist

### ✅ HF-042 — Voice Note Recording (expo-av, REQ-011)
- [x] `voiceNote: string | null` added to `BookingDraft` type + `EMPTY_DRAFT` in `create.tsx`
- [x] `VoiceRecorder` component built — `components/shared/VoiceRecorder.tsx`
  - States: idle → recording (live timer) → recorded (play/pause/delete)
  - Uses `Audio.Recording` for capture, `Audio.Sound` for preview
  - Always visible on booking Step 2 (design mandate, REQ-011)
- [x] `VoiceRecorder` integrated into `renderStepDescribe()` in `create.tsx`
- [x] `jobService.uploadVoiceNote(jobId, fileUri)` added to `job.service.ts` — calls `PATCH /v2/jobs/:id/voice-note`
- [x] Upload wired in `handleSubmit` after photo upload (separate try/catch)
- [x] i18n keys added: `booking.voice_label/hint/record/stop/play/pause/delete/recording/recorded/error_voice` (bn + en)
- [x] 6/6 jest tests in `tests/components/VoiceRecorder.test.tsx`

### ✅ HF-045 — Voice Note Playback in Provider Job Detail (expo-av)
- [x] `VoiceNotePlayer` component built — `components/shared/VoiceNotePlayer.tsx`
  - Play/pause toggle, progress bar, time display, auto-reset on finish
  - Unloads sound on unmount
- [x] Imported + rendered in `booking/job/[id].tsx` inside description card
- [x] Conditionally rendered — hidden entirely when `job.voice_note_url` is null
- [x] URL resolved via `resolveMediaUrl()` (handles relative + S3 paths)
- [x] i18n keys added: `job_detail.voice_note/voice_play/voice_pause` (bn + en)
- [x] 4/4 jest tests in `tests/components/VoiceNotePlayer.test.tsx`

### ✅ HF-044 — Text-to-Voice "Read Aloud" for Providers (expo-speech, REQ-013)
- [x] `ReadAloudButton` component — `components/shared/ReadAloudButton.tsx`
  - `expo-speech` speak/stop toggle
  - Language-aware: Bengali (`bn-BD`) when app language is `bn`, English (`en`) otherwise
  - Unmount cleanup via `Speech.stop()`
- [x] Integrated into `booking/job/[id].tsx` — visible only when `user.role === UserRole.PROVIDER`
  - Reads `job.description` + formatted address parts aloud (joined with `. `)
  - Language passed from `i18n.language` → `bn-BD` or `en-US`
- [x] i18n keys: `job_detail.read_aloud / read_aloud_stop / read_aloud_hint` (bn + en)
- [x] 6/6 jest tests in `tests/components/ReadAloudButton.test.tsx`
- [x] Committed `1c95cef`

### 🔮 HF-043 — Voice-to-Text / Speech-to-Text (REQ-012) — Future Development

Deferred from Sprint 4. Requires a decision on the transcription backend before any mobile work can start.

#### Proposed Implementation

**Recommended approach: Self-hosted Whisper via a backend microservice**

```
Architecture:
  Mobile → records audio (expo-av, already done in HF-042)
          → POST /v2/jobs/transcribe (multipart, audio file)
          ← { transcript: "pipe is leaking under sink" }
          → fills draft.description field
```

**Backend microservice (Python, new Docker container):**
```
services/whisper/
├── main.py          # FastAPI endpoint: POST /transcribe
├── model.py         # Loads whisper model once at startup (lazy)
├── requirements.txt # openai-whisper, fastapi, uvicorn, ffmpeg-python
└── Dockerfile
```
- Model: `whisper-small` (500 MB, good Bengali accuracy, ~3–5 s on CPU)
- Upgrade path: swap to `whisper-medium` (1.5 GB) for better accuracy
- Express backend proxies to this service so mobile never hits it directly
- New endpoint: `POST /v2/transcribe` — auth required, rate-limited to 10 req/min/user

**Server requirements (Docker host):**
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| CPU | 2 vCPU | 4 vCPU |
| GPU | Not required | NVIDIA 4 GB+ (5–10× faster) |
| Storage | +2 GB for model | +2 GB |

**Mobile work (once backend is ready):**
- [ ] Add "Convert to text" icon button inside `VoiceRecorder` (shown only when recorded)
- [ ] Call `POST /v2/transcribe` with the recorded file URI
- [ ] On success: patch `draft.description` with transcript text
- [ ] Loading spinner on the button during request (~3–5 s)
- [ ] Error toast on failure (network or server error)
- [ ] i18n keys: `booking.voice_transcribe / voice_transcribing / voice_transcribe_error` (bn + en)
- [ ] Jest tests mocking the transcribe service call

**When to implement:** When the server infrastructure is ready and the team decides on the model size. No mobile code changes are needed before the backend endpoint exists.

### ⏳ HF-046 — Accessibility Audit
- [ ] Sweep all interactive elements for `accessibilityLabel` + `accessibilityRole`
  - Screens to audit: login, register (all steps), home, category list, provider detail, booking wizard (all 5 steps), bookings list, job detail, provider jobs/feed, profile, admin approvals
- [ ] Verify all touch targets ≥ 48×48 px (icon-only buttons are the usual culprits)
- [ ] Verify no text/container clipping at 1.5× system font scale
- [ ] Verify high-contrast readability (no light-gray-on-white for critical labels)
- [ ] Add `accessibilityHint` on non-obvious actions (voice recorder, photo picker, map drag)
- [ ] Commit

---

## Files Changed This Sprint

| File | Change |
|------|--------|
| `mobile/components/shared/VoiceRecorder.tsx` | New — voice recording UI |
| `mobile/components/shared/VoiceNotePlayer.tsx` | New — audio playback UI |
| `mobile/app/(app)/booking/create.tsx` | Added `voiceNote` draft field + `VoiceRecorder` on Step 2 + upload on submit |
| `mobile/app/(app)/booking/job/[id].tsx` | Added `VoiceNotePlayer` in description card |
| `mobile/services/job.service.ts` | Added `uploadVoiceNote()` |
| `mobile/i18n/locales/bn.json` | Added `booking.voice_*` + `job_detail.voice_*` keys |
| `mobile/i18n/locales/en.json` | Added `booking.voice_*` + `job_detail.voice_*` keys |
| `mobile/tests/components/VoiceRecorder.test.tsx` | New — 6 tests |
| `mobile/tests/components/VoiceNotePlayer.test.tsx` | New — 4 tests |
| `mobile/package.json` | Added `expo-av`, `expo-speech` |

---

## Resuming This Session

Paste `docs/SESSION_CONTEXT.md` then add:

> "Sprint 4 is in progress. See `docs/SPRINT4_PROGRESS.md` for full status. HF-042, HF-044, HF-045 are done. HF-043 is deferred to future development. **Next task: HF-046** — accessibility audit. Start the sweep."
