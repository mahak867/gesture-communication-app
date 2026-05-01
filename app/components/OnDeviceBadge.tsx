"use client";
import { useState } from "react";

export default function OnDeviceBadge() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 bg-green-900/40 border border-green-700/50 text-green-400 text-xs px-2.5 py-1 rounded-full hover:bg-green-800/50 transition-colors"
        aria-label="On-device guarantee — tap to learn more"
        aria-expanded={expanded}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
        On-device only
      </button>

      {expanded && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl space-y-2">
          <p className="text-xs font-bold text-white">🔒 On-Device Guarantee</p>
          <ul className="text-xs text-gray-300 space-y-1.5">
            <li>✅ Camera never leaves your device</li>
            <li>✅ Gestures computed locally (MediaPipe)</li>
            <li>✅ AI runs via Ollama on localhost</li>
            <li>✅ No analytics server — events in localStorage</li>
            <li>✅ Works 100% offline after first load</li>
          </ul>
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-xs text-gray-500 hover:text-gray-300 pt-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
