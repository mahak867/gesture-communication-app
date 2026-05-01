import { useState, useCallback } from "react";

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  voice?: string;
  fontSize: number;
  dwellMs: number;
  context: "medical" | "daily" | "emergency" | "general";
  createdAt: string;
}

const STORAGE_KEY = "gesturetalk-profiles";
const ACTIVE_KEY = "gesturetalk-active-profile";

const DEFAULT_PROFILE: Profile = {
  id: "default",
  name: "Default",
  emoji: "👤",
  fontSize: 1,
  dwellMs: 1500,
  context: "medical",
  createdAt: new Date().toISOString(),
};

function load(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [DEFAULT_PROFILE];
  } catch { return [DEFAULT_PROFILE]; }
}

function save(profiles: Profile[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); } catch { /* ignore */ }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    typeof window !== "undefined" ? load() : [DEFAULT_PROFILE]
  );
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(ACTIVE_KEY) ?? "default";
  });

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0];

  const switchProfile = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
  }, []);

  const addProfile = useCallback((name: string, emoji: string) => {
    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name: name.trim().slice(0, 20),
      emoji,
      fontSize: 1,
      dwellMs: 1500,
      context: "medical",
      createdAt: new Date().toISOString(),
    };
    setProfiles((prev) => {
      const next = [...prev, newProfile];
      save(next);
      return next;
    });
    return newProfile.id;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<Profile>) => {
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      save(next);
      return next;
    });
  }, []);

  const removeProfile = useCallback((id: string) => {
    if (id === "default") return;
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      save(next);
      return next;
    });
    if (activeId === id) switchProfile("default");
  }, [activeId, switchProfile]);

  return { profiles, activeProfile, activeId, switchProfile, addProfile, updateProfile, removeProfile };
}
