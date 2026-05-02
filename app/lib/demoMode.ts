/**
 * Demo Mode — pre-recorded Gemma 4 responses for offline/judge demos.
 * Auto-activates when Ollama is unreachable, or via ?demo=1 URL param.
 */

export interface DemoFrame {
  landmarkGesture: string;
  visionGesture: string;
  visionDescription: string;
  confidence: number;
  emotion: string;
  completions: string[];
  translation: string | null;
  empathy: string | null;
  latencyMs: { vision: number; text: number; translate: number };
}

export const DEMO_FRAMES: DemoFrame[] = [
  {
    landmarkGesture: "pain", visionGesture: "pain",
    visionDescription: "Fist pressed to chest, eyes closed tight",
    confidence: 0.96, emotion: "distressed",
    completions: ["I am in severe pain — level 8", "Please bring pain medication now", "The chest pain is getting worse"],
    translation: "मुझे बहुत तेज़ दर्द हो रहा है",
    empathy: "I hear you — I'm getting help right now.",
    latencyMs: { vision: 312, text: 487, translate: 203 },
  },
  {
    landmarkGesture: "help", visionGesture: "help",
    visionDescription: "Open palm raised high, fingers spread",
    confidence: 0.98, emotion: "fearful",
    completions: ["I need help immediately", "Please call the nurse now", "Someone come here urgently"],
    translation: "मुझे अभी मदद चाहिए",
    empathy: "I'm here — you're not alone. Help is coming.",
    latencyMs: { vision: 289, text: 412, translate: 198 },
  },
  {
    landmarkGesture: "water", visionGesture: "water",
    visionDescription: "Cupped hand gesture toward mouth",
    confidence: 0.91, emotion: "neutral",
    completions: ["I need water please", "I am very thirsty", "Can I have some water"],
    translation: "मुझे पानी चाहिए",
    empathy: null,
    latencyMs: { vision: 301, text: 398, translate: 187 },
  },
  {
    landmarkGesture: "doctor", visionGesture: "doctor",
    visionDescription: "Pointing and beckoning toward the door",
    confidence: 0.88, emotion: "urgent",
    completions: ["Please call the doctor now", "I need to see a doctor urgently", "Get a doctor — this is serious"],
    translation: "डॉक्टर को अभी बुलाओ",
    empathy: "I'll page the doctor immediately.",
    latencyMs: { vision: 334, text: 456, translate: 211 },
  },
  {
    landmarkGesture: "breathe", visionGesture: "breathe",
    visionDescription: "Hand on chest, shallow rapid movement",
    confidence: 0.99, emotion: "fearful",
    completions: ["I cannot breathe — emergency", "Difficulty breathing — help now", "I need oxygen urgently"],
    translation: "मुझे सांस लेने में तकलीफ है",
    empathy: "Emergency — I'm calling for help right now.",
    latencyMs: { vision: 267, text: 389, translate: 178 },
  },
  {
    landmarkGesture: "family", visionGesture: "family",
    visionDescription: "Arms crossed over chest, rocking motion",
    confidence: 0.85, emotion: "distressed",
    completions: ["Please call my family", "I want to see my mother", "Contact my family now please"],
    translation: "मेरे परिवार को बुलाओ",
    empathy: "Of course — I'll call your family right away.",
    latencyMs: { vision: 298, text: 423, translate: 194 },
  },
  {
    landmarkGesture: "yes", visionGesture: "yes",
    visionDescription: "Thumbs up, arm extended forward confidently",
    confidence: 0.97, emotion: "calm",
    completions: ["Yes, I understand", "Yes, please do that", "Yes, that is correct"],
    translation: "हाँ, मैं समझता हूँ",
    empathy: null,
    latencyMs: { vision: 278, text: 356, translate: 181 },
  },
  {
    landmarkGesture: "no", visionGesture: "no",
    visionDescription: "Index finger wagging side to side firmly",
    confidence: 0.94, emotion: "neutral",
    completions: ["No, that is not right", "No, I do not want that", "No, please stop"],
    translation: "नहीं, मुझे वह नहीं चाहिए",
    empathy: null,
    latencyMs: { vision: 265, text: 371, translate: 176 },
  },
  {
    landmarkGesture: "medicine", visionGesture: "medicine",
    visionDescription: "Pill-taking gesture, hand to mouth",
    confidence: 0.92, emotion: "neutral",
    completions: ["I need my medication now", "Time for my pain medicine", "Please give me my tablets"],
    translation: "मुझे अभी दवा चाहिए",
    empathy: null,
    latencyMs: { vision: 308, text: 441, translate: 199 },
  },
  {
    landmarkGesture: "cold", visionGesture: "cold",
    visionDescription: "Arms crossed, shivering motion, hunched shoulders",
    confidence: 0.87, emotion: "uncomfortable",
    completions: ["I am very cold — need a blanket", "Please bring a blanket", "Can you turn the AC down"],
    translation: "मुझे ठंड लग रही है",
    empathy: "I'll get you a warm blanket immediately.",
    latencyMs: { vision: 315, text: 429, translate: 205 },
  },
];

let demoIndex = 0;

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function getNextDemoFrame(gesture?: string): DemoFrame {
  if (gesture) {
    const match = DEMO_FRAMES.find(f =>
      f.landmarkGesture.toLowerCase() === gesture.toLowerCase()
    );
    if (match) return match;
  }
  const frame = DEMO_FRAMES[demoIndex % DEMO_FRAMES.length];
  demoIndex++;
  return frame;
}

export function resetDemoIndex() { demoIndex = 0; }

export async function simulateDemoStage(stageId: string, frame: DemoFrame): Promise<void> {
  const delays: Record<string, number> = {
    mediapipe: 12, vision: frame.latencyMs.vision,
    ensemble: 35,  text: frame.latencyMs.text,
    translate: frame.latencyMs.translate, tts: 80,
  };
  await new Promise(r => setTimeout(r, delays[stageId] ?? 50));
}
