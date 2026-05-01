import { NextRequest, NextResponse } from "next/server";
import { getSentenceCompletions } from "@/app/lib/gemmaOllama";

export async function POST(req: NextRequest) {
  try {
    const { text, context, language } = await req.json();
    if (!text || text.trim().length < 1) {
      return NextResponse.json({ completions: [] });
    }
    const completions = await getSentenceCompletions(text, context ?? "general", language ?? "en");
    return NextResponse.json({ completions });
  } catch (err) {
    console.error("Gemma complete error:", err);
    return NextResponse.json({ completions: ["I need help", "Please come here", "Thank you"] });
  }
}
