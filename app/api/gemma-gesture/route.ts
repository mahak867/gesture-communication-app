import { NextRequest, NextResponse } from "next/server";
import { classifyGestureFromLandmarks } from "@/app/lib/gemmaOllama";

export async function POST(req: NextRequest) {
  try {
    const { landmarks, handedness } = await req.json();
    if (!landmarks || !Array.isArray(landmarks)) {
      return NextResponse.json({ letter: "?", confidence: 0, alternatives: [] });
    }
    const result = await classifyGestureFromLandmarks(landmarks, handedness ?? "Right");
    return NextResponse.json(result);
  } catch (err) {
    console.error("Gemma gesture error:", err);
    return NextResponse.json({ letter: "?", confidence: 0, alternatives: [] });
  }
}
