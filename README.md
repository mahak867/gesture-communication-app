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

## 🏗️ Technology Stack

- **[Next.js 16](https://nextjs.org/)** — React framework (App Router)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[MediaPipe Hands](https://mediapipe.dev/)** — Real-time hand landmark detection (21 points per hand, up to 2 hands)
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)** — Browser-native TTS
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** — Gesture confirmation beep (no external dependency)
- **[Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)** — Haptic feedback on mobile
- **TypeScript** — Full type safety throughout

---

## 🔒 Privacy

All processing happens **100% on-device**:
- No video or images are uploaded to any server
- No user data is collected or stored remotely
- Conversation history and custom phrases are stored locally in `localStorage` only
- Everything can be cleared at any time from within the app

---

## 🖥️ Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — allow camera access when prompted.

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
