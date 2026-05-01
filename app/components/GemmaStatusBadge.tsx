"use client";
import { useEffect, useState } from "react";
import { checkGemmaStatus, type GemmaStatus } from "@/app/lib/gemmaOllama";

export default function GemmaStatusBadge() {
  const [status, setStatus] = useState<GemmaStatus | null>(null);

  useEffect(() => {
    checkGemmaStatus().then(setStatus);
    const interval = setInterval(() => checkGemmaStatus().then(setStatus), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        status.available
          ? "bg-green-950 border border-green-800 text-green-400"
          : "bg-gray-900 border border-gray-700 text-gray-500"
      }`}
      title={status.available ? `Gemma 4 on-device · ${status.latencyMs}ms` : "Gemma offline — using fallback"}
      aria-label={status.available ? "Gemma 4 AI running on-device" : "Gemma 4 offline"}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${status.available ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
      {status.available ? `Gemma 4 on-device · ${status.latencyMs}ms` : "Gemma offline"}
    </div>
  );
}
