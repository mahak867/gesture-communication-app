# 🤟 GestureTalk — Sign Language Communication App

> **Real-time gesture-to-voice communication, powered by on-device AI.**
> Designed for people with speech and hearing challenges — works on any device with a camera.

---

## ✨ What It Does

GestureTalk uses your device camera to detect hand gestures in real-time and converts them into:

- 🔊 **Spoken voice** — via the Web Speech Synthesis API
- 📝 **On-screen text** — built letter-by-letter, word-by-word
- 💬 **Persistent conversation history** — a full log of everything communicated, saved across page refreshes

No sign language training required to get started. Quick-phrase buttons cover the most common needs (greetings, emergencies, basic needs) instantly, and phrases are available in **English, Spanish, and French**.

---

## 🚀 Key Features

| Feature | Details |
|---|---|
| 🤖 **On-device AI** | MediaPipe Hands (Google) — no video ever leaves the device |
| 🖐️ **Two-hand support** | Tracks up to 2 hands simultaneously, with independent dwell timers |
| ✋ **Expanded gesture alphabet** | Letters A, F, I, K, L, Y · Numbers 1–4 (also V, W, B aliases) · Commands SPACE, SPEAK, BACK, CLEAR |
| 📳 **Haptic feedback** | 50 ms vibration pulse on every confirmed gesture (mobile devices) |
| 🔔 **Sound feedback** | Web Audio API beep on gesture confirmation — no need to watch the screen |
| ⚡ **Auto-speak mode** | Speaks and clears the sentence automatically after 3 s of gesture inactivity |
| ↩️ **Undo / gesture history** | 30-step undo stack — revert the last confirmed gesture instantly |
| ⌨️ **Keyboard shortcuts** | `Space` = Speak · `Backspace` = Delete · `Escape` = Clear · `Ctrl+Z` = Undo |
| 🌐 **Language selector** | Quick phrases in English 🇬🇧, Spanish 🇪🇸, and French 🇫🇷 |
| 📤 **Emergency share** | One-tap share current sentence via SMS / system share sheet from the Emergency phrases panel |
| 📋 **Copy per message** | Copy any logged message to clipboard with a single tap |
| 🔡 **Text size control** | Accessibility slider (Normal / Large / X-Large) for sentence builder and conversation log |
| 🎙️ **Voice settings** | Voice picker, speed & pitch sliders, live preview — all persisted across sessions |
| ⭐ **Custom phrases** | Add your own phrases — saved to device storage (localStorage) |
| 💾 **Session persistence** | Conversation history survives page refresh (localStorage, last 50 messages) |
| ⌨️ **Type to speak** | Keyboard fallback for any text, no gestures needed |
| 📊 **Session stats** | Duration, gestures confirmed, messages & words sent |
| 📱 **PWA / installable** | Add to Home Screen on iOS and Android, works offline |
| ♿ **WCAG 2.1 AA** | ARIA tablist, focus-visible ring, live regions, 44 px touch targets |
| 🌐 **Any device** | Responsive layout: phone, tablet, desktop, Chromebook, smart TV browser |

---

## 🎬 Demo

<!-- Replace the placeholder below with an actual screen-recording GIF or MP4 link before the presentation. -->
<!-- Recommended: 30–60 s clip showing gesture input → text build-up → TTS output → quick-phrase panel. -->
> 📽️ **Demo clip coming soon** — record a short screen-capture (30–60 s) showing gesture input, sentence build-up, and TTS playback, then embed it here as an animated GIF or linked MP4.

---

## ♿ Accessibility Validation Checklist

Use this checklist to confirm WCAG 2.1 AA compliance before each release or demo.

- [ ] **Colour contrast** — all text/icon elements pass 4.5 : 1 (normal text) or 3 : 1 (large text) against their backgrounds (test with axe DevTools or Colour Contrast Analyser)
- [ ] **Keyboard navigation** — every interactive element reachable and operable with Tab / Shift-Tab / Enter / Space; focus order is logical
- [ ] **Visible focus indicator** — `focus-visible` ring visible on all focusable elements at 3 px minimum width
- [ ] **Touch targets** — all buttons / icons ≥ 44 × 44 px on mobile (verify in Chrome DevTools device emulation)
- [ ] **ARIA live regions** — gesture confirmations and TTS output announced by screen reader (test with NVDA + Chrome or VoiceOver + Safari)
- [ ] **ARIA roles & labels** — tab list, buttons, and sliders carry descriptive `aria-label` / `aria-labelledby` attributes (verify with axe or Lighthouse)
- [ ] **No motion traps** — camera canvas animation does not trigger vestibular issues; `prefers-reduced-motion` respected where applicable
- [ ] **Text resize** — UI remains usable at 200 % browser zoom and with the in-app X-Large font setting
- [ ] **Screen reader smoke test** — VoiceOver (iOS) and TalkBack (Android) can navigate to and activate the Speak and Phrase buttons without gesture input
- [ ] **axe-core zero critical violations** — run `npx axe http://localhost:3000` or the axe browser extension; resolve all Critical and Serious findings

---

## 🏗️ Technology Stack

- **[Next.js 16](https://nextjs.org/)** — React framework (App Router)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[MediaPipe Hands](https://mediapipe.dev/)** — Real-time hand landmark detection (21 points per hand, up to 2 hands)
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)** — Browser-native TTS
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** — Gesture confirmation beep (no external dependency)
- **[Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)** — Haptic feedback on mobile
- **TypeScript** — Full type safety throughout

---

## ⚡ Performance

GestureTalk runs **entirely on-device** — no cloud round-trips, no latency.

| Metric | Typical value |
|---|---|
| Inference engine | MediaPipe Hands (WebAssembly + GPU delegate) |
| Throughput | **24–30 FPS** on mid-range phones; 30+ FPS on desktop |
| Latency | < 50 ms gesture-to-confirmation (at default 1.5 s dwell) |
| Model size | ~7 MB (loaded once, cached by the browser) |
| CPU / GPU | GPU accelerated via WebGL where available; CPU fallback otherwise |

### Supported browsers

| Browser | Gesture detection | TTS | PWA install |
|---|---|---|---|
| Chrome / Edge 90+ | ✅ | ✅ | ✅ |
| Firefox 90+ | ✅ | ✅ | ✅ (Android) |
| Safari 15.4+ (iOS/macOS) | ✅ | ✅ | ✅ (Add to Home Screen) |
| Samsung Internet 14+ | ✅ | ✅ | ✅ |
| Opera 76+ | ✅ | ✅ | — |

> **Note:** The Web Speech API voice list varies by OS. iOS/Safari provides system voices; desktop Chrome typically offers the widest selection.

---

## 🔒 Privacy

All processing happens **100% on-device**:
- No video or images are uploaded to any server
- No user data is collected or stored remotely
- Conversation history and custom phrases are stored locally in `localStorage` only
- Everything can be cleared at any time from within the app

---

## 💾 Local Storage — Limits & Clearing Data

GestureTalk stores two things in `localStorage`:

| Key | Contents | Typical size |
|---|---|---|
| `gesturetalk-conversation-log` | Last 50 messages (text + metadata) | < 20 KB |
| `gesturetalk-custom-phrases` | Your custom phrase list | < 5 KB |

### Storage limits
Browsers allocate **5–10 MB** per origin for `localStorage`. GestureTalk's own data is well within that budget, but if the quota is exceeded (e.g. many other sites also use storage) the app will **silently retain the last saved state** rather than crash — no data from the current session is lost in memory, but the new entry may not be written to disk.

### How to clear all stored data

1. **In-app (recommended):** Open the **History** tab → tap **🗑 Clear history** to remove the conversation log. Custom phrases can be deleted individually from the **Phrases → Custom** list.
2. **Browser DevTools:** Open DevTools → **Application → Storage → localStorage** → select the app origin → click **Clear All**.
3. **Browser Settings:** Settings → Site Settings → `localhost` (or your domain) → Clear data.

> After clearing, the app starts fresh on the next page load. No account or cloud backup exists — once cleared, data cannot be recovered.

---

## 🖥️ Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — allow camera access when prompted.

### 📷 Camera permissions & troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Black/blank camera feed | Permission denied | Click the camera icon in the address bar → **Allow** → reload |
| "Camera not found" on iOS | Safari requires HTTPS | Serve over HTTPS or use `localhost` (HTTP is allowed for localhost only) |
| Camera works in Chrome but not Safari | Safari 15.3 or older | Update to Safari 15.4+ or use Chrome/Firefox |
| Front camera not mirroring | Device reports rear camera as default | Tap the **flip camera** button in the app header |
| "NotReadableError" (camera in use) | Another app/tab is using the camera | Close other camera apps/tabs and reload |
| Gray overlay after granting permission | Page loaded before permission resolved | Reload the page after granting permission |
| iOS: camera freezes after screen sleep | iOS background-tab suspension | Keep the screen on while using the app (disable auto-lock) |

**iOS / Safari specific notes:**
- Camera access requires a **user gesture** (tap) before the stream can start — the app's "Start camera" button satisfies this.
- On iOS 16+, multiple tabs cannot share the same camera simultaneously; close duplicate GestureTalk tabs.
- `getUserMedia` is only available in Safari 11+ and over **HTTPS** (or `localhost`).
- TTS voices on iOS are loaded asynchronously; if the voice list appears empty, wait 1–2 seconds after page load and re-open Voice Settings.

### Build for production
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

---

## 📐 Gesture Reference

Hold any gesture **steady** for the configured dwell time (default **1.5 s**) to confirm it. The cyan ring around your wrist shows progress.

### Letters

| Gesture | Hand shape | Letter |
|---|---|---|
| ✊ | Fist with thumb pointing sideways | **A** |
| 🖖 | Middle + ring + pinky up; index curls to touch thumb | **F** |
| 🤙 | Pinky finger only up, all others folded | **I** |
| ✌️ | Index + middle up **with** thumb pointing sideways | **K** |
| 👆 | Index up + thumb pointing sideways (L-shape) | **L** |
| 🤙 | Thumb + pinky extended (hang-loose) | **Y** |

### Numbers / ASL aliases

| Gesture | Hand shape | Output |
|---|---|---|
| ☝️ | Index finger only up | **1** |
| ✌️ | Index + middle up (peace sign) | **2** (also ASL **V**) |
| 3️⃣ | Index + middle + ring up | **3** (also ASL **W**) |
| 4️⃣ | All 4 fingers up, thumb tucked | **4** (also ASL **B**) |

### Commands

| Gesture | Hand shape | Action |
|---|---|---|
| ✋ | All 5 fingers + thumb open | **SPACE** — inserts a space |
| 👍 | Thumb pointing straight up | **SPEAK** — reads sentence aloud then clears it |
| 👎 | Thumb pointing straight down | **BACK** — deletes the last character |
| 🤘 | Index + pinky up (rock-on) | **CLEAR** — clears the entire sentence |

---

## ⌨️ Keyboard Shortcuts

These shortcuts are active when focus is **not** inside a text input:

| Key | Action |
|---|---|
| `Space` | Speak the current sentence |
| `Backspace` | Delete the last character |
| `Escape` | Clear the entire sentence |
| `Ctrl + Z` / `⌘ Z` | Undo the last confirmed gesture |

---

## ⚙️ Settings

All settings are persisted to `localStorage` and survive page refresh.

| Setting | Where | Description |
|---|---|---|
| **Voice** | Settings → Voice | Choose TTS voice, adjust speed and pitch |
| **Hold duration** | Settings → Gesture Sensitivity | 0.5 s – 3 s; reduce for fast input, increase to avoid accidental triggers |
| **Auto-speak** | Settings → Auto-Speak | Toggle: speaks + clears after 3 s of gesture inactivity |
| **Text size** | Settings → Text Size | Normal / Large / X-Large font size for sentence builder and conversation log |

---

## 🌐 Quick Phrases & Language

The **Phrases** tab contains built-in phrases across four categories: Greetings, Basic Needs, Responses, and Emergency. Switch between **English 🇬🇧**, **Spanish 🇪🇸**, and **French 🇫🇷** using the language selector at the top of the tab.

### Emergency Share
When a sentence has been built in the sentence builder, a **📤 Share message** button appears in the Emergency category. Tapping it opens the system share sheet (or an SMS compose screen on mobile) pre-filled with your message — ideal for urgent situations.

---

## 🌱 Roadmap

- [x] Voice settings persist across sessions
- [x] Configurable gesture hold (dwell) time
- [x] First-run onboarding walkthrough
- [x] PWA 192×192 and 512×512 icons
- [x] Error boundary with friendly fallback
- [x] Two-hand gesture tracking
- [x] Haptic + audio feedback on confirmation
- [x] Auto-speak mode after inactivity
- [x] Undo / gesture history (30 steps)
- [x] Session-persistent conversation log
- [x] Per-message copy-to-clipboard
- [x] Accessibility text-size control
- [x] Keyboard shortcuts (Space / Backspace / Esc / Ctrl+Z)
- [x] Language localisation — English, Spanish, French
- [x] Emergency share via SMS / system share sheet
- [x] Expanded gesture vocabulary (A, F, I, K, L, Y + number aliases B/V/W)
- [ ] Full ASL alphabet (C, D, E, G, H, O, P, Q, R, S, T, U, X, Z) via expanded landmark rules
- [ ] Simple ML classifier for high-accuracy full-alphabet recognition
- [ ] Cloud sync for custom phrases (optional, opt-in)
- [ ] More localisation languages (Mandarin, German, Portuguese, Arabic, …)
- [ ] Caregiver mode (remote monitoring)
- [ ] Bluetooth headset TTS support

---

## 📄 License

MIT © GestureTalk
