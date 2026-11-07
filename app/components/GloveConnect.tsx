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
  const [open, setOpen] = useState(false);
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
    setOpen(false);
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

  const dot = status === 'connected' ? 'dot dot--on' : status === 'connecting' ? 'dot dot--busy' : 'dot';
  const label =
    status === 'connected' ? `Glove${battery != null ? ` · ${battery}%` : ''}` :
    status === 'connecting' ? 'Connecting…' : 'Connect glove';

  return (
    <>
      <button
        type="button"
        className={`pill ${status === 'connected' ? '' : 'pill--cta'}`}
        aria-haspopup="dialog"
        aria-label={`Glove: ${status}${battery != null ? `, battery ${battery} percent` : ''}`}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>🧤</span>
        <span className={dot} aria-hidden />
        <span className="whitespace-nowrap">{label}</span>
        {battery != null && battery < 20 && <span className="text-[var(--urgent)]">🔋!</span>}
      </button>
      {status === 'connected' && last && (
        <span aria-live="polite" className="fade-in text-[0.9em] font-semibold text-[var(--muted)]">
          {ICON[last] ?? ''}
        </span>
      )}
      {note && !open && (
        <p role="status" className="fade-in basis-full text-[0.9em] text-[var(--muted)]">{note}</p>
      )}

      {open && (
        <div className="overlay fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Glove"
            className="sheet card max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-b-[22px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--line)] sm:hidden" />
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[2em]" aria-hidden>🧤</span>
              <div className="flex-1">
                <h2 className="text-[1.25em] font-bold">GestureTalk Glove</h2>
                <p className="text-[0.9em] text-[var(--muted)]">
                  {status === 'connected' ? `Connected${battery != null ? ` · battery ${battery}%` : ''}` :
                    supported ? 'Not connected' : 'This browser has no Bluetooth — use Chrome or Edge.'}
                </p>
              </div>
            </div>
            {note && <p role="status" className="mb-3 rounded-xl bg-[var(--surface-2)] p-3">{note}</p>}

            <div className="mb-5 grid grid-cols-3 gap-2">
              {status === 'connected' ? (
                <>
                  <button type="button" data-scan className="key py-3" onClick={() => send('CAL')}>Calibrate</button>
                  <button type="button" data-scan className="key py-3" onClick={() => send('BUZZ')}>Test buzz</button>
                  <button type="button" data-scan className="key py-3" onClick={disconnect}>Disconnect</button>
                </>
              ) : (
                <button type="button" data-scan disabled={!supported || status === 'connecting'} className="key key--accent col-span-3 py-4" onClick={connect}>
                  {status === 'connecting' ? 'Connecting…' : 'Connect glove'}
                </button>
              )}
            </div>

            <h3 className="mb-2 font-bold">Gestures</h3>
            <ul className="grid gap-2">
              {GLOVE_GESTURES.map((g) => (
                <li key={g.event} className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
                  <span aria-hidden className="w-10 text-center text-[1.4em]">{ICON[g.event]}</span>
                  <span className="text-[0.95em]"><b>{g.event}</b><br />{g.how}</span>
                </li>
              ))}
            </ul>
            <button type="button" data-scan className="key mt-5 w-full py-3" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}
