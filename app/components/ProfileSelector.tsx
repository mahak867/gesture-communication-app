"use client";
import { useState } from "react";
import type { Profile } from "../hooks/useProfiles";

const EMOJIS = ["👤", "👩", "👨", "👵", "👴", "🧒", "👩‍⚕️", "👨‍⚕️", "🙋", "🙍", "🧑"];

interface Props {
  profiles: Profile[];
  activeId: string;
  onSwitch: (id: string) => void;
  onAdd: (name: string, emoji: string) => void;
  onRemove: (id: string) => void;
}

export default function ProfileSelector({ profiles, activeId, onSwitch, onAdd, onRemove }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("👤");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const submit = () => {
    if (!newName.trim()) return;
    onAdd(newName, newEmoji);
    setNewName("");
    setNewEmoji("👤");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              activeId === profile.id
                ? "bg-cyan-900/40 border-cyan-700"
                : "bg-gray-800/60 border-gray-700/60"
            }`}
          >
            <button
              onClick={() => onSwitch(profile.id)}
              className="flex items-center gap-3 flex-1 min-h-[40px] touch-manipulation text-left"
              aria-label={`Switch to ${profile.name} profile`}
              aria-pressed={activeId === profile.id}
            >
              <span className="text-2xl">{profile.emoji}</span>
              <div>
                <p className="font-medium text-white text-sm">{profile.name}</p>
                <p className="text-xs text-gray-400">
                  {profile.context} · {(profile.dwellMs / 1000).toFixed(1)}s dwell
                </p>
              </div>
              {activeId === profile.id && (
                <span className="ml-auto text-cyan-400 text-xs font-bold">ACTIVE</span>
              )}
            </button>

            {profile.id !== "default" && (
              confirmDelete === profile.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { onRemove(profile.id); setConfirmDelete(null); }}
                    className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >Del</button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                  >No</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(profile.id)}
                  className="text-gray-600 hover:text-red-400 text-sm px-2 min-h-[36px]"
                  aria-label={`Delete ${profile.name} profile`}
                >🗑️</button>
              )
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase">New Profile</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                className={`text-xl p-1 rounded-lg ${newEmoji === e ? "bg-cyan-700" : "bg-gray-700"}`}
                aria-label={`Select ${e} emoji`}
              >{e}</button>
            ))}
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Profile name (e.g. Ravi, Nurse, ICU)"
            maxLength={20}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600"
            aria-label="New profile name"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!newName.trim()}
              className="flex-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 text-white text-sm font-bold min-h-[44px] rounded-xl transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 bg-gray-700 text-gray-300 text-sm min-h-[44px] rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/60 border-dashed text-gray-400 hover:text-white text-sm min-h-[44px] rounded-xl transition-colors"
          aria-label="Add new profile"
        >
          + Add profile
        </button>
      )}
    </div>
  );
}
