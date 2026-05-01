"use client";
import { useState } from "react";

export interface SLPConfig {
  enabled: boolean;
  patientName: string;
  gestureOverrides: Record<string, string>; // gesture id → custom label
  allowedPacks: string[];
  maxSentenceLength: number;
  requireConfirmation: boolean;
  notes: string;
}

const DEFAULT_CONFIG: SLPConfig = {
  enabled: false,
  patientName: "",
  gestureOverrides: {},
  allowedPacks: ["Emergency", "Pain", "Daily Needs", "Medical", "Emotions", "ISL / Indian", "BSL / British"],
  maxSentenceLength: 100,
  requireConfirmation: false,
  notes: "",
};

const ALL_PACKS = ["Emergency", "Pain", "Daily Needs", "Medical", "Emotions", "ISL / Indian", "BSL / British"];

const STORAGE_KEY = "gesturetalk-slp-config";

function loadConfig(): SLPConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

interface Props {
  onConfigChange?: (config: SLPConfig) => void;
}

export default function SLPMode({ onConfigChange }: Props) {
  const [config, setConfig] = useState<SLPConfig>(() =>
    typeof window !== "undefined" ? loadConfig() : DEFAULT_CONFIG
  );
  const [saved, setSaved] = useState(false);
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const SLP_PIN = "1234"; // Simple PIN; in production, use proper auth

  const update = (updates: Partial<SLPConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
    onConfigChange?.(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePack = (pack: string) => {
    const next = config.allowedPacks.includes(pack)
      ? config.allowedPacks.filter((p) => p !== pack)
      : [...config.allowedPacks, pack];
    update({ allowedPacks: next });
  };

  if (!unlocked) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 space-y-2">
          <p className="text-amber-300 text-sm font-semibold">🔒 SLP Configuration</p>
          <p className="text-amber-200/70 text-xs">
            For speech-language pathologists only. Enter PIN to configure patient-specific settings.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4-digit PIN (default: 1234)"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
            aria-label="SLP PIN"
          />
          <button
            onClick={() => { if (pin === SLP_PIN) setUnlocked(true); else setPin(""); }}
            className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold min-h-[48px] rounded-xl text-sm"
          >
            Unlock SLP Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center justify-between bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-white">SLP Mode Active</p>
          <p className="text-xs text-gray-400">Restrict and configure for this patient</p>
        </div>
        <button
          role="switch"
          aria-checked={config.enabled}
          onClick={() => update({ enabled: !config.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${config.enabled ? "bg-cyan-600" : "bg-gray-700"}`}
          aria-label="Toggle SLP mode"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Patient name */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-bold uppercase">Patient Name</label>
        <input
          type="text"
          value={config.patientName}
          onChange={(e) => update({ patientName: e.target.value })}
          placeholder="e.g. Ravi Kumar (optional)"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
          aria-label="Patient name"
        />
      </div>

      {/* Allowed phrase packs */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-bold uppercase">Enabled Phrase Packs</label>
        <div className="flex flex-wrap gap-2">
          {ALL_PACKS.map((pack) => (
            <button
              key={pack}
              onClick={() => togglePack(pack)}
              aria-pressed={config.allowedPacks.includes(pack)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                config.allowedPacks.includes(pack)
                  ? "bg-cyan-700 text-white"
                  : "bg-gray-700 text-gray-400 line-through"
              }`}
            >
              {pack}
            </button>
          ))}
        </div>
      </div>

      {/* Max sentence length */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-bold uppercase">
          Max sentence length: <span className="text-cyan-400">{config.maxSentenceLength} chars</span>
        </label>
        <input
          type="range" min={20} max={200} step={10}
          value={config.maxSentenceLength}
          onChange={(e) => update({ maxSentenceLength: Number(e.target.value) })}
          className="w-full accent-cyan-400"
          aria-label="Maximum sentence length"
        />
      </div>

      {/* Clinical notes */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-bold uppercase">Clinical Notes</label>
        <textarea
          value={config.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Notes about this patient's communication needs…"
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
          aria-label="Clinical notes"
        />
      </div>

      <button
        onClick={save}
        className={`w-full font-bold min-h-[48px] rounded-xl text-sm transition-colors ${
          saved ? "bg-green-700 text-white" : "bg-cyan-700 hover:bg-cyan-600 text-white"
        }`}
      >
        {saved ? "✅ Saved" : "💾 Save SLP Configuration"}
      </button>

      <button
        onClick={() => setUnlocked(false)}
        className="w-full text-gray-500 text-xs hover:text-gray-300 py-2"
      >
        🔒 Lock SLP Settings
      </button>
    </div>
  );
}
