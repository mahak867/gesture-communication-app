# GestureTalk — Sign Language AAC for Mute Patients, Powered by Gemma 4

**Track:** Health & Sciences | **Special Technology:** Ollama

---

## The Problem: 26 Million People Who Cannot Be Heard

In Indian hospitals, mute and non-verbal patients face a crisis that technology has largely ignored. A patient with ALS cannot tell a nurse they are in pain. A post-stroke patient cannot say their medication is wrong. A child with cerebral palsy cannot ask for water. Traditional AAC (Augmentative and Alternative Communication) devices cost ₹80,000 to ₹12,00,000. Most Indian families cannot afford them. Most hospitals do not stock them.

The result: 26 million people with communication disabilities in India communicate by blinking, nodding, or pointing at alphabet boards one letter at a time — in 2026.

GestureTalk is the answer. It runs on any smartphone. It requires no internet. It costs ₹0. And it is powered entirely by Gemma 4 running on-device via Ollama.

---

## Architecture: A 6-Stage Multimodal Gemma 4 Pipeline

The core innovation of GestureTalk is a 6-stage pipeline where Gemma 4 is not a bolt-on feature — it is the central intelligence.

```
Camera Frame
     │
     ▼
[Stage 1] MediaPipe Tasks GestureRecognizer
     │      GPU-accelerated, 21-point hand landmarks
     │      Full A–Z ASL gesture alphabet (~10ms)
     │
     ▼
[Stage 2] Gemma 4 Vision — multimodal frame analysis
     │      Raw JPEG frame → Ollama multimodal endpoint
     │      Gemma 4 describes hand position + emotional state (~300ms)
     │
     ▼
[Stage 3] Ensemble — confidence-weighted merge
     │      Landmark rules + Gemma 4 vision combined
     │      Gemma 4 wins when context disambiguates
     │
     ▼
[Stage 4] Gemma 4 Text — streaming sentence completion
     │      Partial sentence → 4 AAC completions, streamed live
     │      Medical context + patient history aware
     │
     ▼
[Stage 5] Gemma 4 Translate — 6 Indian languages
     │      Hindi, Tamil, Telugu, Bengali, Marathi, Punjabi
     │      Nurses read patient messages in their language
     │
     ▼
[Stage 6] Web Speech API — spoken output
           Patient's language, patient's preferred voice
```

Every stage runs locally via Ollama. No data leaves the device.

---

## The 6 Distinct Gemma 4 Capabilities Used

| Capability | API Route | What It Does |
|-----------|-----------|--------------|
| Multimodal vision | `/api/gemma-vision` | Analyzes camera frames — gesture + patient emotion simultaneously |
| Streaming text | `/api/gemma-stream` | Real-time sentence completion as the patient signs |
| Translation | `/api/gemma-translate` | Converts sentences to 6 Indian languages for nursing staff |
| Emotion detection | `/api/gemma-emotion` | Detects distress, pain, calm, urgency — alerts caregivers |
| Function calling | `/api/gemma-function` | Structured output: urgency + nurse action + Hindi phrase in one call |
| SOAP notes | `/api/gemma-soap` | Clinical-format doctor's notes from the full conversation session |

---

## Clinical Features for Real Medical Settings

**For patients:**
- Symbol grid (66 emoji symbols, Proloquo2Go style) for non-literate users
- Core vocabulary board — 120 words covering 80% of all communication (Van Tatenhove/Beukelman AAC research)
- Always-visible YES/NO/MAYBE/HELP bar — critical for ALS and stroke patients
- Fatigue mode — full-screen minimal UI (4 massive buttons) for late-stage ALS/MND
- Pain scale (0–10 visual + body location selector)
- Medical ID emergency card — conditions, allergies, medications, AAC note for paramedics
- Voice banking — 50 target phrases for ALS patients to record their voice before losing it
- 40 abbreviation shortcuts (hlp→"Help me", wtr→"Water please", pn→"I am in pain")
- ISL (Indian Sign Language) + BSL phrase packs — 5M+ ISL users in India

**For caregivers and clinicians:**
- Caregiver dashboard — real-time monitoring, emergency flagging, conversation search
- FHIR R4 export — conversation logs as clinical bundles for Epic/Cerner EHR integration
- Immutable clinical audit log — timestamped, append-only
- Gemma 4 AI session summaries for nursing shift handoffs
- SLP mode — PIN-locked speech therapist customisation per patient

**Accessibility:**
- Tremor compensation (EMA landmark smoothing, α=0.35, tuned for Parkinson's 4–12Hz tremor)
- High contrast mode (WCAG 2.1 AA compliant)
- Switch access controller (single-switch and two-switch scanning)
- Eye gaze input (iris-based zone detection for locked-in syndrome)
- HIPAA-aware, DPDP Act 2023 compliant

---

## The Ollama Integration

Ollama was chosen deliberately. In Indian hospital settings, internet connectivity is unreliable. Patient privacy prevents cloud processing. And the ₹0 pricing model requires zero per-request costs.

The Ollama integration includes a live health check endpoint (`/api/health`) showing model availability and latency, environment variable configuration (`OLLAMA_MODEL=gemma4`), and a demo mode that auto-activates with pre-recorded Gemma 4 responses when Ollama is unreachable — so judges and new users can experience the full pipeline without any setup.

All 11 Gemma 4 API routes point to the local Ollama server. The app degrades gracefully: with Ollama running, all 6 Gemma 4 capabilities activate. Without it, MediaPipe gesture detection and 70+ built-in phrases continue to work — ensuring patients are never left without a voice.

---

## Technical Challenges and Solutions

**Latency vs AAC usability:** AAC users need responses within 500ms. Gemma 4 vision takes 300–500ms. Solution: MediaPipe runs in parallel (~10ms) and begins TTS before Gemma 4 vision completes. The ensemble stage merges results in real time.

**Indian medical vocabulary in translation:** Standard translation produces unnatural results. Solution: Gemma 4's translation prompt includes regional context, formal/informal register guidance, and medical vocabulary — producing translations a local nurse would naturally say.

**Offline-first in hospitals:** Hospital wifi is unreliable. Solution: Service worker pre-caches MediaPipe WASM, app shell, and all built-in phrases. The app works completely offline for core communication.

---

## Technical Stack

- **Framework:** Next.js 16, TypeScript, Tailwind CSS
- **Gesture AI:** MediaPipe Tasks GestureRecognizer (GPU delegate, on-device)
- **Language model:** Gemma 4 via Ollama (21 routes, 6 capabilities)
- **Testing:** 29 unit tests (Vitest), Playwright E2E suite
- **CI/CD:** GitHub Actions — build, typecheck, lint, test, Lighthouse, Vercel deploy
- **Clinical:** FHIR R4, HIPAA-aware, DPDP Act 2023

---

## Impact and Vision

GestureTalk is deployable today on any existing hospital smartphone in under 5 minutes. No procurement. No training. No recurring cost.

Immediate target: ICUs and post-surgical wards in Tier 2 and Tier 3 Indian cities where mute patients currently have no AAC options. Next steps: fine-tune Gemma 4 on ISL training data for the full Indian Sign Language alphabet, add Braille output for deaf-blind patients, and integrate with India's Ayushman Bharat Digital Mission.

Every person deserves to be heard. Gemma 4 makes that possible at ₹0.

---

**GitHub:** github.com/mahak867/gesture-communication-app
**Live Demo:** gesturetalk.vercel.app/demo
**Built by:** Mahak Fahad — mahakfahad07@gmail.com
