# 🤟 GestureTalk — Sign Language Communication App

> **Real-time gesture-to-voice communication, powered by on-device AI.**
> Designed for people with speech and hearing challenges — works on any device with a camera.

---

## ✨ What It Does

GestureTalk uses your device camera to detect hand gestures in real-time and converts them into:

- 🔊 **Spoken voice** — via the Web Speech Synthesis API
- 📝 **On-screen text** — built letter-by-letter, word-by-word
- 💬 **Conversation history** — a full log of everything communicated

No sign language training required to get started. Quick-phrase buttons cover the most common needs (greetings, emergencies, basic needs) instantly.

---

## 🚀 Key Features

| Feature | Details |
|---|---|
| 🤖 **On-device AI** | MediaPipe Hands (Google) — no video ever leaves the device |
| ✋ **Gesture alphabet** | Letters A, I, L, Y · Numbers 1–4 · Commands SPACE, SPEAK, BACK, CLEAR |
| 🎙️ **Voice settings** | Voice picker, speed & pitch sliders, live preview |
| ⭐ **Custom phrases** | Add your own phrases — saved to device storage (localStorage) |
| 📋 **Conversation log** | Full history with one-tap replay and .txt export |
| ⌨️ **Type to speak** | Keyboard fallback for any text, no gestures needed |
| 📊 **Session stats** | Duration, gestures confirmed, messages & words sent |
| 📱 **PWA / installable** | Add to Home Screen on iOS and Android, works offline |
| ♿ **WCAG 2.1 AA** | ARIA tablist, focus-visible ring, live regions, 44px touch targets |
| 🌐 **Any device** | Responsive layout: phone, tablet, desktop, Chromebook, smart TV browser |

---

## 🏗️ Technology Stack

- **[Next.js 16](https://nextjs.org/)** — React framework (App Router)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[MediaPipe Hands](https://mediapipe.dev/)** — Real-time hand landmark detection
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)** — Browser-native TTS
- **TypeScript** — Full type safety throughout

---

## 🔒 Privacy

All processing happens **100% on-device**:
- No video or images are uploaded to any server
- No user data is collected or stored remotely
- Conversation history stays in your browser's memory (cleared on refresh)
- Custom phrases are stored locally in `localStorage`

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

| Gesture | Action |
|---|---|
| ✊ Fist + thumb sideways | Letter **A** |
| 🤙 Pinky only | Letter **I** |
| 👆 Index + thumb sideways | Letter **L** |
| 🤙 Thumb + pinky | Letter **Y** |
| ☝️ Index only | Number **1** |
| ✌️ Index + middle | Number **2** |
| 3️⃣ Three fingers | Number **3** |
| 4️⃣ Four fingers | Number **4** |
| ✋ All 5 fingers + thumb | **SPACE** |
| 👍 Thumb up | **SPEAK** (reads sentence aloud) |
| 👎 Thumb down | **BACK** (delete last character) |
| 🤘 Index + pinky (rock-on) | **CLEAR** (clear entire sentence) |

*Hold any gesture for **1.5 seconds** to confirm it.*

---

## 🌱 Roadmap

- [ ] More ASL letters (B, C, D, E, F, G, H, O, V, W) via expanded landmark analysis
- [ ] Multi-language TTS (Spanish, French, Mandarin, etc.)
- [ ] Cloud sync for custom phrases (optional, opt-in)
- [ ] Caregiver mode (remote monitoring)
- [ ] Bluetooth headset TTS support

---

## 📄 License

MIT © GestureTalk
