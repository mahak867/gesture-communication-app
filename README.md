# GestureTalk

**A free, offline communication system for hospital patients who cannot speak. Its main input is a low-cost sensor glove.**

Patients on ventilators, after a stroke, or with throat surgery, ALS or severe weakness often cannot say they are in pain, call a nurse, or answer a doctor. Commercial AAC (augmentative and alternative communication) devices cost ₹80,000 or more. GestureTalk is a sensor glove you can build for about ₹4,000, plus a web app that runs on any phone or tablet.

```
 🧤 Glove ──BLE──▶ 📱 GestureTalk web app ──▶ 🔊 speech · 🪧 big text for the visitor · 🚨 alarm
 (point / fist /        (works offline,
  thumb up/down)         nothing uploaded)
```

## What it does

| | |
|---|---|
| 🧤 **Glove first** | Point = move the highlight, fist = press, hold fist 3 s = HELP, thumb up/down = yes/no. Vibration confirms every gesture. Auto-reconnects. [Build guide →](hardware/glove/README.md) |
| 👍 **Yes / No / Help always on screen** | ICU research shows yes/no is the most-used exchange. Never more than one action away. |
| 🙋 **Needs, feelings, conversation boards** | About 30 hospital phrases (suction, reposition, "wait, I'm still typing", "call my family"…). Buttons never move, so the hand learns where they are. |
| 🤕 **Pain board** | Where → how much, using a 0–10 faces scale. Pain of 6 or more raises the alarm. |
| ⌨️ **Typing with word prediction** | ABC or QWERTY layout. Learns the words you use. The device keyboard can be used for any language. |
| 🪧 **Show to visitor** | Full-screen large text, with a *flip* so the person across the bed can read it. |
| 🚨 **Urgent alarm** | Full-screen red, loud chime and vibration until a carer taps "I'm here". Shows the patient's name. |
| ♿ **Access options** | On-lift activation (slide off to cancel), dwell/hold activation for tremor, repeat-press filter, button size up to 160%, high contrast, single-switch auto-scanning. |
| 📷 **Camera backup** | If there's no glove: the same core gestures through the front camera (MediaPipe, processed on the device). |
| 🌐 **English + हिन्दी** | Every built-in phrase in both languages, using the device's own voices. |
| 🔒 **Private and offline** | No account, no analytics. Everything is stored on the device. Installable as an app (PWA) and works without internet. |
| ✨ **Optional local AI** | Sentence completion through a local [Ollama](https://ollama.com) model you run yourself. Off by default. |

## Design decisions (and why)

These come from open-source AAC projects ([Cboard](https://www.cboard.io/), [AsTeRICS Grid](https://github.com/asterics/AsTeRICS-Grid)), research on ICU communication, and the problems with the previous version of this app:

- **Few, robust gestures instead of fingerspelling.** Weak, sedated or trembling patients can't fingerspell reliably, and a misread "yes" in a hospital is dangerous. Each gesture must be held steady and fires only once.
- **Calibration adapts to the person.** Fingers that can't move are ignored rather than blocking gestures.
- **Fixed button positions** (motor planning), large targets, icon + word on every button. Colour is never the only signal.
- **Speed for common messages:** a phrase speaks with one tap. Typing is there for everything else.
- **Partner-facing display:** visitors often can't hear a phone speaker on a busy ward.
- **No false promises:** it isn't a medical device and doesn't replace the nurse-call bell.

## Run it

```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:3000. Use Chrome or Edge for the glove (they support Web Bluetooth).

```bash
npm test
```
```bash
npm run build
```

Optional AI suggestions: install Ollama, run `ollama pull gemma3`, copy `.env.example` to `.env.local`, then turn it on in **Settings**.

## Project layout

```
app/
  page.tsx               app shell: glove bar, quick answers, message, boards
  components/            Key (accessible button), GloveConnect, PhraseBoard, PainBoard,
                         Keyboard, CameraGestures, SettingsPanel, Overlays (alarm, partner view, history)
  hooks/useApp.tsx       shared state: settings, message, history, speech, alarm
  hooks/useScanner.ts    switch/glove scanning
  lib/                   pure, unit-tested logic: vocab, prediction, settings, glove protocol, gestures
  api/suggest/route.ts   optional local-AI sentence suggestions
hardware/glove/          parts list, schematic, build workflow, firmware, enclosure
public/sw.js             offline cache
```

## Licence

MIT. See [LICENSE](LICENSE).
