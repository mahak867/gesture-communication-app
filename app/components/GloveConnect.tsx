'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { advanceScan } from '../hooks/useScanner';
import {
  GLOVE_BATTERY, GLOVE_COMMAND, GLOVE_EVENT, GLOVE_GESTURES, GLOVE_SERVICE,
  parseBattery, parseGloveEvent, type GloveEvent,
} from '../lib/glove';
import { QUICK } from '../lib/vocab';

type Status = 'idle' | 'connecting' | 'connected' | 'error';

const ICON: Partial<Record<GloveEvent, string>> = { YES: '👍', NO: '👎', NEXT: '☝️ →', PREV: '✌️ ←', SELECT: '✊', HELP: '🚨' };

/**
 * The glove is the primary input. This bar is always on screen so the
 * connection survives tab changes. Once connected, the glove drives a
 * highlight: point = next, two fingers = back, fist = press, long fist = help.
 * Web Bluetooth: Chrome/Edge on Android, Windows, macOS, ChromeOS.
 */
export function GloveBar() {
  const { settings, say } = useApp();
  const [status, setStatus] = useState<Status>('idle');
  const [battery, setBattery] = useState<number | null>(null);
  const [last, setLast] = useState<GloveEvent | null>(null);
  const [note, setNote] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const device = useRef<BluetoothDevice | null>(null);
  const command = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const handler = useRef<(e: GloveEvent) => void>(() => {});
  const wantConnected = useRef(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported('bluetooth' in navigator);
  }, []);

  useEffect(() => {
    handler.current = (e) => {
      const t = (k: keyof typeof QUICK) => QUICK[k].text[settings.lang];
      setLast(e);
      if (e === 'YES') say(t('yes'));
      else if (e === 'NO') say(t('no'));
      else if (e === 'HELP') say(t('help'), { urgent: true });
      else if (e === 'NEXT') advanceScan(1);
      else if (e === 'PREV') advanceScan(-1);
      else if (e === 'SELECT') {
        const el = document.activeElement as HTMLElement | null;
        if (el?.hasAttribute('data-scan')) el.click();
        else advanceScan(1); // nothing highlighted yet: highlight the first item
      } else if (e === 'CAL_OPEN') setNote('Calibrating: open your hand and relax it…');
      else if (e === 'CAL_FIST') setNote('Calibrating: now make a gentle fist…');
      else if (e === 'CAL_DONE') setNote('Calibration saved on the glove.');
    };
  }, [settings.lang, say]);

  useEffect(() => {
    const root = document.documentElement;
    if (status === 'connected') root.dataset.glove = 'on';
    else delete root.dataset.glove;
  }, [status]);

  useEffect(() => () => {
    wantConnected.current = false;
    device.current?.gatt?.disconnect();
  }, []);

  const attach = async (dev: BluetoothDevice) => {
    const server = await dev.gatt!.connect();
    const svc = await server.getPrimaryService(GLOVE_SERVICE);
    const ev = await svc.getCharacteristic(GLOVE_EVENT);
    ev.addEventListener('characteristicvaluechanged', (e) => {
      const v = (e.target as BluetoothRemoteGATTCharacteristic).value;
      const parsed = v && parseGloveEvent(v);
      if (parsed) handler.current(parsed);
    });
    await ev.startNotifications();
    const bat = await svc.getCharacteristic(GLOVE_BATTERY);
    setBattery(parseBattery(await bat.readValue()));
    bat.addEventListener('characteristicvaluechanged', (e) => {
      const v = (e.target as BluetoothRemoteGATTCharacteristic).value;
      if (v) setBattery(parseBattery(v));
    });
    await bat.startNotifications();
    command.current = await svc.getCharacteristic(GLOVE_COMMAND);
    setStatus('connected');
    setNote('');
    advanceScan(1);
  };

  const connect = async () => {
    setStatus('connecting');
    try {
      const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: [GLOVE_SERVICE] }] });
      device.current = dev;
      wantConnected.current = true;
      // A patient cannot reconnect a glove themselves, so retry automatically.
      dev.addEventListener('gattserverdisconnected', async () => {
        if (!wantConnected.current) return;
        setStatus('connecting');
        setNote('Glove signal lost — reconnecting…');
        for (let i = 0; i < 5 && wantConnected.current; i++) {
          try {
            await attach(dev);
            return;
          } catch {
            await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
          }
        }
        setStatus('error');
        setNote('Glove disconnected. Check it is switched on and charged.');
      });
      await attach(dev);
    } catch (e) {
      const cancelled = e instanceof Error && e.name === 'NotFoundError';
      setStatus(cancelled ? 'idle' : 'error');
      if (!cancelled) setNote('Could not connect. Is the glove switched on and nearby?');
    }
  };

  const disconnect = () => {
    wantConnected.current = false;
    device.current?.gatt?.disconnect();
    setStatus('idle');
  };

  const send = (cmd: 'CAL' | 'BUZZ') => command.current?.writeValue(new TextEncoder().encode(cmd)).catch(() => {});
  const btn = 'rounded-xl border-2 border-[var(--line)] bg-[var(--panel)] px-3 py-2 font-semibold';

  return (
    <section aria-label="Glove" className="rounded-2xl border-2 border-[var(--line)] bg-[var(--panel)] p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[1.1em] font-bold">🧤 Glove</span>
        {status === 'connected' ? (
          <>
            <span className="rounded-lg bg-[var(--yes)] px-2 py-1 text-[0.9em] text-white">Connected</span>
            {battery != null && (
              <span className={`text-[0.9em] ${battery < 20 ? 'font-bold text-[var(--urgent)]' : 'text-[var(--muted)]'}`}>
                🔋 {battery}%
              </span>
            )}
            {last && <span aria-live="polite" className="text-[0.9em] text-[var(--muted)]">last: {ICON[last] ?? ''} {last}</span>}
            <span className="ml-auto flex gap-2">
              <button type="button" className={btn} onClick={() => send('CAL')}>Calibrate</button>
              <button type="button" className={btn} onClick={() => send('BUZZ')}>Buzz</button>
              <button type="button" className={btn} onClick={disconnect}>Disconnect</button>
            </span>
          </>
        ) : supported ? (
          <>
            <button
              type="button"
              disabled={status === 'connecting'}
              onClick={connect}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-white disabled:opacity-60"
            >
              {status === 'connecting' ? 'Connecting…' : 'Connect glove'}
            </button>
            <span className="text-[0.9em] text-[var(--muted)]">Touch, camera and switch input also work.</span>
          </>
        ) : (
          <span className="text-[0.9em] text-[var(--muted)]">
            This browser has no Bluetooth. Use Chrome or Edge on Android, Windows, macOS or ChromeOS for the glove.
          </span>
        )}
        <button type="button" className={`${btn} ${status === 'connected' ? '' : 'ml-auto'}`} aria-expanded={showHelp} onClick={() => setShowHelp((s) => !s)}>
          ? Gestures
        </button>
      </div>
      {note && <p role="status" className="mt-2">{note}</p>}
      {showHelp && (
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {GLOVE_GESTURES.map((g) => (
            <li key={g.event} className="rounded-lg bg-[var(--bg)] px-3 py-2">
              <b>{ICON[g.event]} {g.event}</b> — {g.how}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
