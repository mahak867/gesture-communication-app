<div align="center">

![GestureTalk](https://capsule-render.vercel.app/api?type=waving&color=0891b2&height=180&section=header&text=GestureTalk&fontSize=56&fontColor=fff&fontAlignY=38&desc=AAC%20for%20Mute%20Patients%20%E2%80%94%20Powered%20by%20Gemma%204&descAlignY=58&descSize=16&animation=fadeIn)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gesturetalk.vercel.app-22c55e?style=for-the-badge&logo=vercel)](https://gesturetalk.vercel.app)
[![Try Demo (no install)](https://img.shields.io/badge/Try%20Now%20(no%20install)-/demo-0891b2?style=for-the-badge)](https://gesturetalk.vercel.app/demo)
[![Gemma 4 Good Hackathon](https://img.shields.io/badge/Gemma%204%20Good-Hackathon%202026-6366f1?style=for-the-badge)](https://ai.google.dev/competition)
[![Free Forever](https://img.shields.io/badge/Price-Free%20Forever-22c55e?style=for-the-badge)](https://github.com/mahak867/gesture-communication-app)
[![29 Tests Passing](https://img.shields.io/badge/Tests-29%20passing-22c55e?style=for-the-badge)](https://github.com/mahak867/gesture-communication-app/actions)

> **"A mute patient in an Indian hospital has one way to say they are in pain: point to a body part and hope someone notices. GestureTalk gives them a voice — powered by Gemma 4, running entirely on their phone."**

</div>

---

## The problem

26 million people in India live with communication disabilities. In hospitals, they cannot say they are in pain, call a nurse, or tell a doctor what is wrong. Traditional AAC (Augmentative and Alternative Communication) devices cost ₹80,000–₹12,00,000. Most families cannot afford them. Most hospitals do not stock them.

GestureTalk runs on any smartphone. It is free. It needs no internet. It speaks in Hindi, Tamil, Telugu, Bengali, Marathi, and Punjabi.

---

## How Gemma 4 is used — 6 distinct capabilities

| Stage | Gemma 4 Capability | What it does |
|-------|-------------------|--------------|
| 1 | **Vision** | Analyzes raw camera frames to classify hand gestures — "fist pressed to chest = I am in pain" |
| 2 | **Text generation** | Completes partial signed sentences in real time with streaming |
| 3 | **Translation** | Converts sentences to Hindi/Tamil/Telugu/Bengali/Marathi/Punjabi |
| 4 | **Emotion detection** | Reads message tone — flags distress and high pain to caregivers |
| 5 | **Function calling** | Structured gesture → urgency + nurse action + Hindi phrase simultaneously |
| 6 | **SOAP notes** | Generates clinical-format doctor's notes from the session |

All 6 run on-device via Ollama. Zero data leaves the device. Demo mode activates automatically when Ollama is not running — judges can use the app without any setup.

---

## Architecture — 6-stage multimodal pipeline

```
Camera Frame ──→ MediaPipe Landmarks ──→ Rule-based gesture (10ms)
                                               ↓
                      Gemma 4 Vision ──→ Frame description + emotion (300ms)
                                               ↓
                         Ensemble ──→ Confidence-weighted merge
                                               ↓
                    Gemma 4 Text ──→ Streaming sentence completions
                                               ↓
               Gemma 4 Translate ──→ Hindi / Tamil / Telugu / Bengali
                                               ↓
                  Web Speech TTS ──→ Spoken output in patient's language
```

---

## Features

### Communication
- Full A–Z ASL gesture alphabet + ISL (Indian Sign Language) + BSL phrase packs
- 6 medical phrase packs: Emergency, Pain Scale (0–10 + body location), Daily, Medical, Emotions, Family
- Symbol grid (66 emoji symbols) — for non-literate users and children
- Core vocabulary board (120 words in 6 categories — based on AAC research)
- Always-visible YES / NO / MAYBE / HELP bar — critical for ALS and stroke patients
- Word prediction (n-gram model, learns from every session)
- 40 abbreviation shortcuts (hlp→Help me, pn→I am in pain, wtr→Water please)
- Type-to-speak keyboard input

### Medical-grade
- Fatigue mode — full-screen minimal UI for late-stage ALS/MND (4 massive buttons)
- Medical ID emergency card — name, conditions, allergies, medications, contacts, AAC note
- Pain scale — visual 0–10 with body location selector
- Emergency SOS — one gesture triggers alarm + haptic + alerts caregiver
- Voice banking — 50 target phrases for ALS patients to record their voice before losing it
- SOAP note generation via Gemma 4
- FHIR R4 export — conversation logs as bundles for Epic/Cerner EHR integration
- Clinical audit log — immutable, timestamped, append-only
- Caregiver dashboard — monitor, search, filter, export conversation history
- SLP mode — PIN-locked speech therapist customisation

### Accessibility
- Tremor compensation — EMA landmark smoothing for Parkinson's
- High contrast mode — WCAG 2.1 AA
- One-handed mode
- Switch access — single-switch and two-switch scanning
- Eye gaze input — iris-based zone detection for locked-in syndrome
- Haptic feedback — 10 vibration patterns
- 4 UI languages — English, Hindi, Tamil, Arabic

### Infrastructure
- 100% on-device — camera frames never transmitted
- Offline-capable — service worker caches everything
- 29 unit tests passing
- CI/CD — build, typecheck, lint, test, Lighthouse, Vercel deploy
- HIPAA-aware, DPDP Act 2023 compliant

---

## Run locally

```bash
# 1. Install Ollama and pull Gemma 4
# https://ollama.com → install → then:
ollama pull gemma4
ollama serve

# 2. Clone and run
git clone https://github.com/mahak867/gesture-communication-app.git
cd gesture-communication-app
cp .env.example .env.local
npm install
npm run dev

# 3. Open http://localhost:3000
# Or try demo mode (no Ollama needed): http://localhost:3000/demo
```

---

## Quick demo for judges (no Ollama needed)

Open **[gesturetalk.vercel.app/demo](https://gesturetalk.vercel.app/demo)** — demo mode pre-records Gemma 4 responses so you can experience the full pipeline without running Ollama locally.

---

## Project structure

```
app/
├── api/
│   ├── gemma-vision/       # Gemma 4 multimodal — camera frame → gesture
│   ├── gemma-complete/     # Gemma 4 text — sentence autocomplete
│   ├── gemma-stream/       # Gemma 4 streaming completions
│   ├── gemma-translate/    # Gemma 4 — 6 Indian languages
│   ├── gemma-emotion/      # Gemma 4 — patient emotion detection
│   ├── gemma-function/     # Gemma 4 function calling — structured output
│   ├── gemma-soap/         # Gemma 4 — SOAP note generation
│   └── caregiver-summary/  # Gemma 4 — AI session summary for nurses
├── components/
│   ├── CameraView.tsx      # MediaPipe Tasks GestureRecognizer (GPU)
│   ├── ModelPipeline.tsx   # Live pipeline visualisation
│   ├── aac/                # SymbolGrid, CoreVocabulary, YesNoBar, FatigueMode
│   ├── PainScale.tsx       # 0–10 pain + body location
│   ├── SOAPNote.tsx        # Clinical note generator
│   └── EmotionDetector.tsx # Real-time emotion badge
├── lib/
│   ├── pipeline.ts         # 6-stage Gemma 4 pipeline
│   ├── gemmaOllama.ts      # Ollama client
│   ├── demoMode.ts         # Pre-recorded responses for offline use
│   ├── gestures.ts         # Full A–Z gesture engine
│   ├── abbreviations.ts    # 40 shortcut expansions
│   └── voice-banking/      # ALS voice recording system
├── medicalid/              # Emergency medical ID card
├── caregiver/              # Nurse/carer dashboard
├── analytics/              # Usage analytics
└── waitlist/               # Hospital/NGO interest form
```

---

## Why this wins

Most AAC tools cost ₹80,000+. Most hackathon entries use Gemma for one task. GestureTalk uses Gemma 4 for 6 distinct, medically meaningful capabilities — running entirely on-device, free forever, for patients who have no other way to be heard.

---

## Built by

**Mahak Fahad** — CS student and founder of [Hotscan](https://hotscan.in)
📧 mahakfahad07@gmail.com · [github.com/mahak867](https://github.com/mahak867)

<div align="center">

*Free forever. For the 26 million people in India who cannot be heard.*

![footer](https://capsule-render.vercel.app/api?type=waving&color=0891b2&height=80&section=footer)

</div>
