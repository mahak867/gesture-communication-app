'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isProfile, isProfileList, newProfile, uid, type Profile, type Sign } from '../lib/profiles';
import { load, save } from '../lib/storage';

const K = { list: 'gt.profiles', active: 'gt.activeProfile' };
/** Keep the newest samples; old ones fall away as a person's movement changes (e.g. ALS progression). */
export const MAX_SAMPLES = 8;

interface ProfilesState {
  ready: boolean;
  profiles: Profile[];
  active: Profile | null;
  select: (id: string) => void;
  create: (name: string) => Profile;
  remove: (id: string) => void;
  update: (patch: Partial<Omit<Profile, 'id' | 'signs'>>) => void;
  addSign: (sign: Omit<Sign, 'id' | 'createdAt'>) => Sign;
  updateSign: (id: string, patch: Partial<Omit<Sign, 'id'>>) => void;
  removeSign: (id: string) => void;
  addSample: (signId: string, sample: number[][]) => void;
  exportProfile: () => string;
  importProfile: (json: string) => Profile;
}

const Ctx = createContext<ProfilesState | null>(null);

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    const list = load(K.list, [] as Profile[], isProfileList);
    const first = list.length ? list : [newProfile('Patient')];
    setProfiles(first);
    const a = load(K.active, '');
    setActiveId(first.some((p) => p.id === a) ? a : first[0].id);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => { if (ready) save(K.list, profiles); }, [profiles, ready]);
  useEffect(() => { if (ready) save(K.active, activeId); }, [activeId, ready]);

  const active = profiles.find((p) => p.id === activeId) ?? null;

  const mutate = useCallback(
    (fn: (p: Profile) => Profile) => setProfiles((list) => list.map((p) => (p.id === activeId ? fn(p) : p))),
    [activeId],
  );

  const create = useCallback((name: string) => {
    const p = newProfile(name);
    setProfiles((l) => [...l, p]);
    setActiveId(p.id);
    return p;
  }, []);

  const remove = useCallback((id: string) => {
    setProfiles((l) => {
      const rest = l.filter((p) => p.id !== id);
      const next = rest.length ? rest : [newProfile('Patient')];
      setActiveId((a) => (a === id ? next[0].id : a));
      return next;
    });
  }, []);

  const update = useCallback((patch: Partial<Omit<Profile, 'id' | 'signs'>>) => mutate((p) => ({ ...p, ...patch })), [mutate]);

  const addSign = useCallback(
    (s: Omit<Sign, 'id' | 'createdAt'>) => {
      const sign: Sign = { ...s, id: uid(), createdAt: Date.now() };
      mutate((p) => ({ ...p, signs: [...p.signs, sign] }));
      return sign;
    },
    [mutate],
  );

  const updateSign = useCallback(
    (id: string, patch: Partial<Omit<Sign, 'id'>>) =>
      mutate((p) => ({ ...p, signs: p.signs.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    [mutate],
  );

  const removeSign = useCallback((id: string) => mutate((p) => ({ ...p, signs: p.signs.filter((s) => s.id !== id) })), [mutate]);

  const addSample = useCallback(
    (signId: string, sample: number[][]) =>
      mutate((p) => ({
        ...p,
        signs: p.signs.map((s) => (s.id === signId ? { ...s, samples: [...s.samples, sample].slice(-MAX_SAMPLES) } : s)),
      })),
    [mutate],
  );

  const exportProfile = useCallback(() => JSON.stringify({ gesturetalk: 1, profile: active }, null, 1), [active]);

  const importProfile = useCallback((json: string) => {
    const data = JSON.parse(json) as { profile?: unknown };
    if (!isProfile(data.profile)) throw new Error('This file is not a GestureTalk profile.');
    const p: Profile = { ...data.profile, id: uid() };
    setProfiles((l) => [...l, p]);
    setActiveId(p.id);
    return p;
  }, []);

  const value = useMemo<ProfilesState>(
    () => ({ ready, profiles, active, select: setActiveId, create, remove, update, addSign, updateSign, removeSign, addSample, exportProfile, importProfile }),
    [ready, profiles, active, create, remove, update, addSign, updateSign, removeSign, addSample, exportProfile, importProfile],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfiles(): ProfilesState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProfiles must be used inside <ProfilesProvider>');
  return v;
}
