import { NextRequest, NextResponse } from "next/server";
import { generateCaregiverSummary } from "@/app/lib/gemmaOllama";

export async function POST(req: NextRequest) {
  try {
    const { messages, timeframe } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ summary: "No messages to summarise." });
    }
    const summary = await generateCaregiverSummary(messages, timeframe ?? "daily");
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Caregiver summary error:", err);
    return NextResponse.json({ summary: "Summary unavailable. Please review messages manually." });
  }
}
