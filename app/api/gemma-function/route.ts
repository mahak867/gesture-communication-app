import { NextRequest, NextResponse } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL  = "gemma4";

// Gemma 4 function calling for structured, type-safe gesture analysis
const GESTURE_FUNCTION = {
  name: "analyze_patient_gesture",
  description: "Analyze a hand gesture from a mute hospital patient and determine communication intent",
  parameters: {
    type: "object",
    properties: {
      gesture_id:     { type: "string",  description: "Short identifier: pain|help|water|yes|no|doctor|family|medicine|emergency|other" },
      phrase:         { type: "string",  description: "Natural language phrase the patient is communicating" },
      urgency:        { type: "string",  enum: ["low", "medium", "high", "critical"] },
      emotion:        { type: "string",  enum: ["calm", "distressed", "fearful", "neutral", "urgent"] },
      confidence:     { type: "number",  description: "0.0-1.0 confidence score" },
      suggested_action: { type: "string", description: "Immediate action for the nurse/caregiver" },
      hindi_phrase:   { type: "string",  description: "Same phrase in Hindi" },
    },
    required: ["gesture_id", "phrase", "urgency", "confidence"],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { frameBase64, landmarkGesture, context, patientHistory } = await req.json();

    const system = `You are a medical AI analyzing hand gestures for a mute patient in an Indian hospital.
Context: ${context ?? "medical ward"}.
MediaPipe identified: "${landmarkGesture ?? "unknown"}".
${patientHistory ? `Patient's recent messages: ${patientHistory}` : ""}

Use the analyze_patient_gesture function to return a structured analysis.
Consider medical urgency carefully — err toward higher urgency when uncertain.`;

    // Gemma 4 function calling via tools API
    const body: Record<string, unknown> = {
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: "Analyze this patient gesture and call the function with your analysis." },
      ],
      tools: [{ type: "function", function: GESTURE_FUNCTION }],
      stream: false,
      options: { temperature: 0.1, num_predict: 200 },
    };

    if (frameBase64) {
      (body.messages as Array<Record<string, unknown>>)[1] = {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${frameBase64}` } },
          { type: "text", text: "Analyze this patient gesture and call the function with your analysis." },
        ],
      };
    }

    const start = Date.now();
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json();

    // Extract function call result
    const toolCall = data.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      return NextResponse.json({ ...args, latencyMs: Date.now() - start, model: MODEL, functionCalling: true });
    }

    // Fallback: parse from text response if tool call not used
    const text = data.message?.content ?? "";
    return NextResponse.json({
      gesture_id: landmarkGesture ?? "unknown",
      phrase: text.slice(0, 80) || `Patient gestured: ${landmarkGesture}`,
      urgency: "medium",
      confidence: 0.7,
      latencyMs: Date.now() - start,
      model: MODEL,
      functionCalling: false,
    });
  } catch {
    return NextResponse.json({
      gesture_id: "unknown",
      phrase: "Unable to analyze gesture",
      urgency: "low",
      confidence: 0,
      offline: true,
    });
  }
}
