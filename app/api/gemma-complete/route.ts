import { NextRequest, NextResponse } from "next/server";
import { getSentenceCompletions } from "@/app/lib/gemmaOllama";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const completions = await getSentenceCompletions(text ?? "");
    return NextResponse.json({ completions });
  } catch {
    return NextResponse.json({ completions: ["I need help", "Please come here", "Thank you"] });
  }
}
