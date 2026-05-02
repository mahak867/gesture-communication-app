'use client';
import type { GemmaStatus } from '../lib/gemma';
interface Props { status: GemmaStatus; }
export default function GemmaStatusBadge({ status }: Props) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      status.available
        ? 'bg-violet-900/30 border-violet-700/50 text-violet-300'
        : 'bg-gray-800/60 border-gray-700 text-gray-500'
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.available ? 'bg-violet-400 animate-pulse' : 'bg-gray-600'}`} />
      <div className="min-w-0">
        <p className="font-medium">{status.available ? `Gemma 4 — ${status.model ?? 'on-device'}` : 'Gemma 4 offline'}</p>
        {!status.available && status.error && <p className="text-[10px] text-gray-600 truncate">{status.error}</p>}
      </div>
    </div>
  );
}
