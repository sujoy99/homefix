# BRD — Voice & Accessibility

**SRS:** REQ-011 to REQ-013 · **Sprint:** 4

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-011 | Residents record a voice note instead of typing | ⏳ Sprint 4 |
| REQ-012 | Voice-to-Text converts voice notes to searchable text | ⏳ Sprint 4 |
| REQ-013 | Text-to-Voice: Provider presses button to hear description aloud | ⏳ Sprint 4 |

## Context

HomeFix serves users of varying literacy levels in Bangladesh. Many Providers may not read well. The platform's voice features are a **core differentiator**, not an optional feature.

## Voice Note Recording (REQ-011 — HF-042)

- Library: `expo-av` (AudioRecorder)
- Format: AAC, max 2 minutes per recording
- UI: large microphone button, always visible on the "describe issue" step
- Waveform visualizer during recording (engagement/feedback)
- Playback before submission (resident can re-record)
- Stored via `storage.service.ts` (local → S3)
- Performance target: < 200ms start latency (SRS NFR)

## Speech-to-Text (REQ-012 — HF-043)

- Converts the voice note audio to text after recording
- Transcript stored in `jobs.description` alongside `jobs.voice_note_url`
- Makes job content searchable (future job search by keyword)
- Implementation: device-native (Expo `expo-speech-recognition` or platform API)
- Fallback: if STT fails, store audio only — resident's typed description used instead
- Language: Bengali primary, English secondary

## Text-to-Voice (REQ-013 — HF-044)

- Provider job detail screen has a prominent "Read Aloud" button
- Reads: job title + full description + service address + estimated budget
- Library: `expo-speech`
- Language detection: use Bengali TTS voice if available, English as fallback
- Provider can pause/stop playback
- Button visible regardless of whether a voice note was recorded (always reads text)

## General Accessibility Rules (All Platforms)

- Touch targets: minimum 48×48px
- All interactive elements have accessible labels (`accessibilityLabel`)
- Font sizes respect system scale — no locked font sizes
- Color contrast ratio: minimum 4.5:1 for body text (WCAG AA)
- `KeyboardAvoidingView` on all forms
- Screen reader (TalkBack/VoiceOver) compatible for core flows
- No information conveyed by color alone

## Sprint 4 Tickets

| Ticket | Description | Est. |
|--------|-------------|------|
| HF-042 | Voice note recording in booking flow | 6h |
| HF-043 | Speech-to-Text integration | 6h |
| HF-044 | Text-to-Voice "Read Aloud" button for providers | 4h |
| HF-045 | Voice note playback in provider job view | 3h |
| HF-046 | Accessibility audit — large fonts, high contrast, screen reader | 4h |
