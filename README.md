# GestureTalk

**A sensor glove + app that learns the signs of people who cannot speak, and translates them into speech.**

For people who have lost their voice through ALS/MND, stroke, cerebral palsy, a tracheostomy or a ventilator. Most of them never learned sign language, and many can't make textbook handshapes. GestureTalk doesn't ask them to. Each person teaches the glove **their own** movements, a few seconds each, and the app speaks for them.

```
 🧤 Glove (5 flex + motion, ₹4,000) ──BLE 50 Hz──▶ 📱 GestureTalk (any phone / tablet, offline)
                                                    │  learns this person's signs from 4 examples
                                                    ▼
                                   "Water" · "Turn me over" · "I love you" · 🚨 HELP
                                   🔊 spoken  ·  🪧 big text for visitors  ·  history
```

## Why it's different

Sign-language gloves have been built many times: [SignAloud](https://www.kqed.org/futureofyou/165394/invention-translates-sign-language-into-speech-some-in-deaf-community-unimpressed), [SignSpeak](https://arxiv.org/html/2407.12020v2), and dozens of student ESP32/Arduino projects. They almost all do the same thing: recognise the ASL alphabet or a fixed word list, trained on able-bodied signers. They were criticised for being built *for* users rather than *with* them, and they don't help the people who need a voice most.

| | Typical sign glove | **GestureTalk** |
|---|---|---|
| Who it's for | People fluent in a sign language | **Anyone who can move a hand a little** — ALS, stroke, CP, ICU |
| Vocabulary | Fixed alphabet / word list | **The person's own signs**, taught in seconds, any language |
| Limited movement | Fails | **Calibration detects fingers that don't move** and works with what's left |
| Changing ability (ALS) | Retrain from scratch | **Learns from use.** New practice replaces old, automatically |
| Wrong guesses | Always outputs something | **Rejects unclear signs**, shows confidence, one-tap undo |
| Quality check | None | **Self-test per sign** and warnings when two signs are too alike |
| Emergencies | — | **Help sign → full-screen alarm** until a carer responds |
| Without the glove | Nothing | Touch boards, pain scale, typing, switch scanning |
| Try it | Build hardware first | **Demo glove** in the app, no hardware needed |
| Privacy / cost | Often cloud, ₹₹₹ | **Offline, nothing uploaded, ~₹4,000 open hardware** |

## How recognition works

1. **Calibration** records the relaxed hand and the fullest comfortable bend, per finger.
2. **Segmentation** finds each sign in the 50 Hz stream: the hand leaves rest, then either holds a shape or returns to rest. Signal smoothing keeps tremor from looking like movement.
3. **Matching** compares the sign against this person's recorded examples using dynamic time warping (nearest neighbour), across finger bend, hand orientation and motion.
4. **Rejection**: each sign has its own acceptance limit, based on how consistent the person's own examples are. Anything outside every limit is "not recognised", never a guess.

All of this is plain TypeScript in [`app/lib/recognizer.ts`](app/lib/recognizer.ts), runs in the browser in a few milliseconds, and is unit-tested end to end with the demo glove.

## Features

- **Translate**: live finger sensors, the sentence being signed (large), confidence for each sign, speak / show / undo / clear.
- **Signs**: suggested starter vocabulary (Yes, No, Help, pain, water…), your own signs, action signs (speak, delete, clear, emergency), self-test scores.
- **People**: several patients per device, each with their own calibration and signs. Backup and restore as a file.
- **Board**: touch phrase boards (needs, feelings, conversation), pain scale, keyboard with word prediction. English and हिन्दी.
- **Access options**: dwell or press-on-lift activation, repeat-press filter, large buttons, high contrast, switch scanning.
- **Works offline** as an installable app. No account, no analytics.

## Run it

```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:3000, tap **Connect glove → Try the demo glove**, then go to **Signs** to calibrate and teach.

```bash
npm test
```

Use Chrome or Edge for the real glove (they support Web Bluetooth).

## Build the glove

[`hardware/glove/`](hardware/glove/README.md) has the parts list (~₹4,000), schematic, wiring table, step-by-step build workflow, firmware (XIAO ESP32-S3), 3D-printable pod and a bedside checklist.

## Layout

```
app/lib/        sensors (frame format, features) · recognizer (segment + DTW) · profiles · simulator (demo glove) · vocab
app/hooks/      useGlove (BLE / demo) · useProfiles · useTranslator · useSegments · useApp
app/components/ TranslateView · SignsView · RecordSign · Calibrate · BoardView · GloveBar · HandViz · …
hardware/glove/ build guide · schematic.svg · firmware · enclosure.scad
```

## Status

A working prototype. It is **not a medical device** and does not replace nurse-call systems. Next steps: field testing with ALS and stroke patients and their speech therapists, two-glove signing, and an opt-in shared dataset of accessible signs.

MIT licence.
