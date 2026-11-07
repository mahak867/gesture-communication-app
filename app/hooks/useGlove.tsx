'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseFrame, type Frame } from '../lib/sensors';
import { DemoGlove, type Shape } from '../lib/simulator';
import { GLOVE_BATTERY, GLOVE_COMMAND, GLOVE_FRAME, GLOVE_SERVICE, parseBattery } from '../lib/glove';

export type GloveSource = 'none' | 'ble' | 'demo';
export type GloveStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type Listener = (f: Frame) => void;

interface GloveState {
  source: GloveSource;
  status: GloveStatus;
  battery: number | null;
  error: string;
  bleSupported: boolean;
  connectBle: () => Promise<void>;
  startDemo: () => void;
  disconnect: () => void;
  /** Subscribe to raw frames (50 Hz). Returns an unsubscribe function. */
  subscribe: (fn: Listener) => () => void;
  /** Latest frame, for live visualisation (read inside rAF, not via state). */
  latest: React.RefObject<Frame | null>;
  buzz: (ms?: number) => void;
  demo: { perform: (s: Shape, holdMs?: number) => void; setTremor: (t: number) => void; setButton: (b: boolean) => void } | null;
}

const Ctx = createContext<GloveState | null>(null);

export function GloveProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<GloveSource>('none');
  const [status, setStatus] = useState<GloveStatus>('idle');
  const [battery, setBattery] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [bleSupported, setBleSupported] = useState(true);
  const listeners = useRef(new Set<Listener>());
  const latest = useRef<Frame | null>(null);
  const device = useRef<BluetoothDevice | null>(null);
  const command = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const demoRef = useRef<DemoGlove | null>(null);
  const want = useRef(false);

  useEffect(() => {
    setBleSupported('bluetooth' in navigator);
  }, []);

  const emit = useCallback((f: Frame) => {
    latest.current = f;
    listeners.current.forEach((fn) => fn(f));
  }, []);

  const attach = useCallback(
    async (dev: BluetoothDevice) => {
      const server = await dev.gatt!.connect();
      const svc = await server.getPrimaryService(GLOVE_SERVICE);
      const frames = await svc.getCharacteristic(GLOVE_FRAME);
      frames.addEventListener('characteristicvaluechanged', (e) => {
        const v = (e.target as BluetoothRemoteGATTCharacteristic).value;
        const f = v && parseFrame(v);
        if (f) emit(f);
      });
      await frames.startNotifications();
      const bat = await svc.getCharacteristic(GLOVE_BATTERY);
      setBattery(parseBattery(await bat.readValue()));
      bat.addEventListener('characteristicvaluechanged', (e) => {
        const v = (e.target as BluetoothRemoteGATTCharacteristic).value;
        if (v) setBattery(parseBattery(v));
      });
      await bat.startNotifications();
      command.current = await svc.getCharacteristic(GLOVE_COMMAND);
      setStatus('connected');
      setError('');
    },
    [emit],
  );

  const stopAll = useCallback(() => {
    want.current = false;
    demoRef.current?.stop();
    demoRef.current = null;
    device.current?.gatt?.disconnect();
    device.current = null;
    command.current = null;
    latest.current = null;
  }, []);

  const connectBle = useCallback(async () => {
    stopAll();
    setStatus('connecting');
    try {
      const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: [GLOVE_SERVICE] }] });
      device.current = dev;
      want.current = true;
      setSource('ble');
      // A patient cannot reconnect the glove themselves — retry automatically.
      dev.addEventListener('gattserverdisconnected', async () => {
        if (!want.current) return;
        setStatus('reconnecting');
        for (let i = 0; i < 6 && want.current; i++) {
          try {
            await attach(dev);
            return;
          } catch {
            await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
          }
        }
        setStatus('error');
        setError('Glove disconnected. Check it is switched on and charged.');
      });
      await attach(dev);
    } catch (e) {
      const cancelled = e instanceof Error && e.name === 'NotFoundError';
      setStatus(cancelled ? 'idle' : 'error');
      setSource(cancelled ? 'none' : 'ble');
      if (!cancelled) setError('Could not connect. Is the glove switched on and nearby?');
    }
  }, [attach, stopAll]);

  const startDemo = useCallback(() => {
    stopAll();
    const g = new DemoGlove(emit);
    demoRef.current = g;
    g.start();
    setSource('demo');
    setStatus('connected');
    setBattery(100);
    setError('');
  }, [emit, stopAll]);

  const disconnect = useCallback(() => {
    stopAll();
    setSource('none');
    setStatus('idle');
    setBattery(null);
  }, [stopAll]);

  useEffect(() => stopAll, [stopAll]);

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const buzz = useCallback((ms = 60) => {
    if (command.current) command.current.writeValue(new TextEncoder().encode(`BUZZ ${Math.round(ms)}`)).catch(() => {});
    else if (source === 'demo') navigator.vibrate?.(ms);
  }, [source]);

  const demo = useMemo(
    () =>
      source === 'demo'
        ? {
            perform: (s: Shape, holdMs?: number) => demoRef.current?.perform(s, holdMs),
            setTremor: (t: number) => { if (demoRef.current) demoRef.current.tremor = t; },
            setButton: (b: boolean) => { if (demoRef.current) demoRef.current.button = b; },
          }
        : null,
    [source],
  );

  const value = useMemo<GloveState>(
    () => ({ source, status, battery, error, bleSupported, connectBle, startDemo, disconnect, subscribe, latest, buzz, demo }),
    [source, status, battery, error, bleSupported, connectBle, startDemo, disconnect, subscribe, buzz, demo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGlove(): GloveState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGlove must be used inside <GloveProvider>');
  return v;
}
