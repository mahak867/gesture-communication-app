'use client';

import { useRef, useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';

/** Switch between people sharing a device; back up or move a person's signs as a file. */
export function ProfilesPanel() {
  const { profiles, active, select, create, remove, update, exportProfile, importProfile } = useProfiles();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  if (!active) return null;

  const download = () => {
    const blob = new Blob([exportProfile()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gesturetalk-${active.name.replace(/\W+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="card grid gap-3 p-4">
      <h2 className="text-[1.1em] font-bold">People</h2>
      <div className="grid gap-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === active.id}
            className={`key flex items-center justify-between px-4 py-3 text-left ${p.id === active.id ? 'key--selected' : ''}`}
            onClick={() => select(p.id)}
          >
            <span>{p.name}</span>
            <span className="text-[0.8em] opacity-80">{p.signs.length} signs</span>
          </button>
        ))}
      </div>

      <label className="grid gap-1">
        <span className="text-[0.9em] font-semibold">Name of {active.name === 'Patient' ? 'this person' : active.name}</span>
        <input
          className="min-h-12 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--surface-2)] px-3"
          value={active.name}
          maxLength={40}
          onChange={(e) => update({ name: e.target.value })}
        />
      </label>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create(name);
          setName('');
        }}
      >
        <input
          className="min-h-12 min-w-0 flex-1 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--surface-2)] px-3"
          placeholder="Add another person"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="key px-4">Add</button>
      </form>

      <div className="grid grid-cols-3 gap-2 text-[0.9em]">
        <button type="button" className="key py-3" onClick={download}>Back up</button>
        <button type="button" className="key py-3" onClick={() => file.current?.click()}>Restore</button>
        <button
          type="button"
          className="key key--ghost py-3"
          onClick={() => confirm(`Delete ${active.name} and all their signs from this device?`) && remove(active.id)}
        >
          Delete
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const p = importProfile(await f.text());
            setMsg(`Restored ${p.name} (${p.signs.length} signs).`);
          } catch (err) {
            setMsg(err instanceof Error ? err.message : 'Could not read that file.');
          }
        }}
      />
      {msg && <p role="status" className="text-[0.9em]">{msg}</p>}
      <p className="text-[0.8em] text-[var(--muted)]">A backup file holds this person’s calibration and signs — keep it safe, and use it to move to a new phone or tablet.</p>
    </section>
  );
}
