# Submission Checklist — May 18, 2026

## Required (submission invalid without these)

- [ ] **Video uploaded to YouTube** (public, unlisted OK, under 3 minutes)
  - Use VIDEO_SCRIPT.md as your guide
  - Must show Gemma 4 pipeline tab with real latency numbers
  - Must show Hindi translation appearing
  - Upload at: https://studio.youtube.com
  
- [ ] **Vercel deployment live**
  - Go to vercel.com → Add New Project → mahak867/gesture-communication-app
  - Add env vars: OLLAMA_URL=http://localhost:11434, OLLAMA_MODEL=gemma4
  - Copy the deployment URL (e.g. gesturetalk.vercel.app)
  
- [ ] **Kaggle writeup submitted**
  - Copy contents of KAGGLE_WRITEUP.md (1,304 words — under 1,500 limit ✅)
  - Submit at: https://www.kaggle.com/competitions/gemma-4-good-hackathon/discussion/new
  - Select track: Health & Sciences
  - Attach: GitHub URL + Vercel URL + YouTube URL

- [ ] **README updated with real YouTube and Vercel URLs**
  - Replace https://gesturetalk.vercel.app with your real Vercel URL
  - Add your YouTube link as a badge at the top of README.md

## Tracks to select (you can win multiple)

- [x] Main Track (compete for $50K/$25K/$15K/$10K)
- [x] Impact Track — Health & Sciences ($10K)
- [x] Impact Track — Digital Equity & Inclusivity ($10K)  
- [x] Special Technology — Ollama ($10K) ← MOST WINNABLE

## What Gemma 4 features to emphasise in writeup

1. Multimodal vision (camera frame → gesture classification)
2. Streaming text completion (real-time sentence building)
3. Translation (6 Indian languages)
4. Emotion detection (distress → caregiver alert)
5. Function calling (structured urgency + action + Hindi phrase)
6. SOAP note generation (clinical documentation)

## After submitting

- [ ] Share on LinkedIn/Twitter with #Gemma4Good
- [ ] Ask 10 friends to star the GitHub repo
- [ ] Revoke the GitHub token at github.com/settings/tokens
