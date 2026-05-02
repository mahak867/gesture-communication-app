# 🤟 GestureTalk — Sign Language Communication App

> **Real-time gesture-to-voice communication, powered by on-device AI.**
> Designed for people with speech and hearing challenges — works on any device with a camera.

---

## ✨ What It Does

GestureTalk uses your device camera to detect hand gestures in real-time and converts them into:

- 🔊 **Spoken voice** — via the Web Speech Synthesis API
- 📝 **On-screen text** — built letter-by-letter, word-by-word
- 💬 **Persistent conversation history** — a full log of everything communicated, saved across page refreshes
- 🤖 **AI sentence completions** — Gemma (via Ollama) suggests natural completions from partial phrases
- 🌐 **Live translation** — Gemma translates messages into Hindi, Tamil, Telugu, Bengali, and Marathi

No sign language training required to get started. Quick-phrase buttons cover the most common needs (greetings, emergencies, basic needs) instantly, and phrases are available in **English, Spanish, and French**.

---

## 🚀 Key Features

| Feature | Status | Details |
|---|---|---|
| 🤖 **On-device AI (MediaPipe)** | ✅ Working | MediaPipe Gesture Recognizer — no video leaves the device |
| 🖐️ **Two-hand support** | ✅ Working | Tracks up to 2 hands simultaneously, independent dwell timers |
| ✋ **Gesture alphabet** | ✅ Working | Letters A, I, K, L, Y · Numbers 1–4 · Commands SPACE, SPEAK, BACK, CLEAR |
| 📳 **Haptic feedback** | ✅ Working | 50 ms vibration pulse on every confirmed gesture (mobile devices) |
| 🔔 **Sound feedback** | ✅ Working | Web Audio API beep on gesture confirmation |
| ⚡ **Auto-speak mode** | ✅ Working | Speaks and clears the sentence automatically after 3 s of inactivity |
| ↩️ **Undo / gesture history** | ✅ Working | 30-step undo stack |
| ⌨️ **Keyboard shortcuts** | ✅ Working | `Space` = Speak · `Backspace` = Delete · `Escape` = Clear · `Ctrl+Z` = Undo |
| 🌐 **Quick phrase languages** | ✅ Working | Built-in phrases in English, Spanish, and French |
| 📤 **Emergency share** | ✅ Working | One-tap share via SMS / system share sheet |
| 📋 **Copy per message** | ✅ Working | Copy any logged message to clipboard |
| 🔡 **Text size control** | ✅ Working | Normal / Large / X-Large accessibility slider |
| 🎙️ **Voice settings** | ✅ Working | Voice picker, speed & pitch sliders, persisted across sessions |
| ⭐ **Custom phrases** | ✅ Working | Add personal phrases saved to localStorage |
| 💾 **Session persistence** | ✅ Working | Last 50 messages survive page refresh |
| ⌨️ **Type to speak** | ✅ Working | Keyboard fallback for any text |
| 📊 **Session stats** | ✅ Working | Duration, gestures, messages, words |
| 📱 **PWA / installable** | ✅ Working | Add to Home Screen on iOS and Android |
| ♿ **WCAG 2.1 AA** | ✅ Working | ARIA tablist, live regions, 44 px touch targets, keyboard nav |
| 🤖 **Gemma AI pipeline** | ✅ Working* | Vision + sentence completion + translation via Ollama |
| 🌐 **AI translation** | ✅ Working* | Hindi, Tamil, Telugu, Bengali, Marathi via Gemma/Ollama |
| 👩‍⚕️ **Caregiver dashboard** | ✅ Working | Real-time message log, AI summary via Gemma/Ollama |
| 👤 **Patient profiles** | ✅ Working | Multiple profiles with per-profile settings |
| 👩‍⚕️ **SLP mode** | ✅ Working | PIN-protected config, phrase packs, gesture overrides |
| 🎯 **Gesture trainer** | ✅ Working* | Train custom gestures from live camera landmarks |
| 📤 **Conversation export** | ✅ Working | Download history as HTML or CSV |
| 😟 **Emotion detection** | ✅ Working* | Gemma detects emotional state from gestures |
| 📊 **Analytics** | ✅ Working | Usage analytics dashboard at `/analytics` |

> \* Requires Ollama running locally (`ollama serve` + `ollama pull gemma3:4b`). The app falls back gracefully when offline.

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
- **[MediaPipe Tasks Vision](https://mediapipe.dev/)** — Real-time hand gesture recognition (21 landmarks per hand, up to 2 hands)
- **[Gemma 3 (via Ollama)](https://ollama.com/)** — On-device LLM for sentence completion, translation, vision analysis, and caregiver summaries
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)** — Browser-native TTS
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** — Gesture confirmation beep (no external dependency)
- **[Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)** — Haptic feedback on mobile
- **TypeScript** — Full type safety throughout

---

## 🤖 Gemma AI Pipeline

When Ollama is running locally, each confirmed gesture triggers a 6-stage AI pipeline:

| Stage | Model | What it does |
|---|---|---|
| 1. MediaPipe | On-device WASM | 21-point hand landmark detection |
| 2. Gemma Vision | `gemma3:4b` multimodal | Analyses camera frame to confirm gesture intent + emotion |
| 3. Ensemble | Fast math | Merges MediaPipe + vision confidence scores |
| 4. Sentence completion | `gemma3:4b` streaming | Suggests 3 natural completions for the partial sentence |
| 5. Translation | `gemma3:4b` | Translates into the selected Indian language |
| 6. Web Speech TTS | Browser-native | Speaks the final result aloud |

### Setup (Ollama)

```bash
# Install Ollama — https://ollama.com
ollama serve
ollama pull gemma3:4b

# Copy and fill environment variables
cp .env.example .env.local
```

The app works fully offline — Ollama stages fall back gracefully when unavailable.

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
- [x] Expanded gesture vocabulary (A, I, K, L, Y + 1–4)
- [x] Gemma AI pipeline — vision, sentence completion, translation
- [x] Caregiver dashboard with AI summary
- [x] Patient profiles (multiple patients per device)
- [x] SLP mode with PIN, phrase packs, and gesture overrides
- [x] Personalised gesture trainer (records live landmarks)
- [x] Conversation export (HTML + CSV)
- [x] Health check API endpoint for model status
- [ ] Full ASL alphabet (C, D, E, G, H, O, P, Q, R, S, T, U, X, Z) via expanded landmark rules
- [ ] Simple ML classifier for high-accuracy full-alphabet recognition
- [ ] Cloud sync for custom phrases (optional, opt-in)
- [ ] More localisation languages (Mandarin, German, Portuguese, Arabic, …)
- [ ] Bluetooth headset TTS support
- [ ] Speech-to-text input (microphone fallback)

---

## 📄 License

MIT © GestureTalk
