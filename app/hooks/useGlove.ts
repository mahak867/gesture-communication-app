// app/hooks/useGlove.ts
// Web Bluetooth connection to flex sensor glove
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

declare global {
  // Re-use declarations from useWristband.ts — TypeScript merges them
  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    value: DataView | null;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
  }
  interface BluetoothRemoteGATTService {
    getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
    disconnect(): void;
  }
  interface BluetoothDevice extends EventTarget {
    gatt?: BluetoothRemoteGATTServer;
    address: string;
    name?: string;
  }
  interface Bluetooth {
    requestDevice(options: object): Promise<BluetoothDevice>;
  }
}

export interface FingerState {
  thumb:  number;  // 0.0 (straight) to 1.0 (fully bent)
  index:  number;
  middle: number;
  ring:   number;
  pinky:  number;
}

export interface GlovePrediction {
  gesture:    string;   // e.g. "A", "B", "fist", "open_palm", "thumbs_up"
  confidence: number;   // 0.0–1.0
  fingers:    FingerState;
}

export interface GloveState {
  connected:   boolean;
  connecting:  boolean;
  prediction:  GlovePrediction | null;
  roll:        number;  // wrist IMU — same BNO055 as wristband
  pitch:       number;
  error:       string | null;
  supported:   boolean;
}

// BLE UUIDs — must match glove firmware
const GLOVE_SERVICE  = '12340000-e8f2-537e-4f6c-d104768a1214';
const FLEX_CHAR_UUID = '12340001-e8f2-537e-4f6c-d104768a1214'; // 5 bytes: thumb..pinky (0-255)
const IMU_CHAR_UUID  = '12340002-e8f2-537e-4f6c-d104768a1214'; // roll,pitch CSV

// Calibration defaults — updated per user via Calibration tab
const FLEX_MIN = [200, 180, 190, 185, 175]; // straight (raw ADC, 0-1023 range via ADS1115)
const FLEX_MAX = [650, 620, 640, 630, 610]; // fully bent

function normalize(raw: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (raw - min) / (max - min)));
}

function classifyFromFingers(f: FingerState): GlovePrediction {
  const { thumb, index, middle, ring, pinky } = f;
  const BENT = 0.6; // threshold for "finger bent"
  const UP   = 0.3; // threshold for "finger straight/up"

  const iUp = index  < UP;
  const mUp = middle < UP;
  const rUp = ring   < UP;
  const pUp = pinky  < UP;
  const tOut = thumb < 0.4;

  // Commands
  if (!iUp && !mUp && !rUp && !pUp && thumb < 0.5 && tOut) return { gesture:'SPEAK',    confidence:0.91, fingers:f };
  if (iUp && mUp && rUp && pUp && thumb > BENT)             return { gesture:'SPACE',    confidence:0.88, fingers:f };
  if (!iUp && !mUp && !rUp && !pUp && thumb < 0.2)          return { gesture:'thumbsup', confidence:0.89, fingers:f };
  // Letters
  if (!iUp && !mUp && !rUp && !pUp && tOut)                 return { gesture:'A',        confidence:0.87, fingers:f };
  if (iUp && mUp && rUp && pUp && thumb > 0.7)              return { gesture:'B',        confidence:0.85, fingers:f };
  if (!iUp && mUp && rUp && pUp && thumb < 0.5)             return { gesture:'F',        confidence:0.83, fingers:f };
  if (!iUp && !mUp && !rUp && pUp && thumb > BENT)          return { gesture:'I',        confidence:0.86, fingers:f };
  if (iUp && mUp && !rUp && !pUp && tOut)                   return { gesture:'K',        confidence:0.82, fingers:f };
  if (iUp && !mUp && !rUp && !pUp && tOut)                  return { gesture:'L',        confidence:0.88, fingers:f };
  if (iUp && mUp && !rUp && !pUp && !tOut)                  return { gesture:'two',      confidence:0.85, fingers:f };
  if (iUp && mUp && rUp && !pUp && !tOut)                   return { gesture:'three',    confidence:0.84, fingers:f };
  if (iUp && !mUp && !rUp && !pUp && !tOut)                 return { gesture:'one',      confidence:0.87, fingers:f };
  if (thumb > BENT && index > BENT && middle > BENT && ring > BENT && pinky > BENT)
    return { gesture:'fist',     confidence:0.9,  fingers:f };

  return { gesture:'unknown', confidence:0.4, fingers:f };
}

export function useGlove(onPrediction?: (p: GlovePrediction) => void) {
  const [state, setState] = useState<GloveState>({
    connected:false, connecting:false, prediction:null,
    roll:0, pitch:0, error:null,
    supported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
  });
  const deviceRef    = useRef<BluetoothDevice | null>(null);
  const onPredRef    = useRef(onPrediction);
  useEffect(() => { onPredRef.current = onPrediction; }, [onPrediction]);

  const connect = useCallback(async () => {
    if (!state.supported) {
      setState(s => ({ ...s, error: 'Web Bluetooth not supported' }));
      return;
    }
    setState(s => ({ ...s, connecting:true, error:null }));
    try {
      const device = await (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth.requestDevice({
        filters: [{ name: 'GestureTalk-Glove' }],
        optionalServices: [GLOVE_SERVICE],
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setState(s => ({ ...s, connected:false, prediction:null, error:'Glove disconnected' }));
      });

      const server  = await device.gatt!.connect();
      const service = await server.getPrimaryService(GLOVE_SERVICE);

      // Flex sensors — 5 bytes packed as uint8
      const flexChar = await service.getCharacteristic(FLEX_CHAR_UUID);
      await flexChar.startNotifications();
      flexChar.addEventListener('characteristicvaluechanged', (e) => {
        const v = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const raw = [v.getUint8(0),v.getUint8(1),v.getUint8(2),v.getUint8(3),v.getUint8(4)];
        // ADS1115 sends 0-255 mapped from 0-1023
        const fingers: FingerState = {
          thumb:  normalize(raw[0]*4, FLEX_MIN[0], FLEX_MAX[0]),
          index:  normalize(raw[1]*4, FLEX_MIN[1], FLEX_MAX[1]),
          middle: normalize(raw[2]*4, FLEX_MIN[2], FLEX_MAX[2]),
          ring:   normalize(raw[3]*4, FLEX_MIN[3], FLEX_MAX[3]),
          pinky:  normalize(raw[4]*4, FLEX_MIN[4], FLEX_MAX[4]),
        };
        const pred = classifyFromFingers(fingers);
        setState(s => ({ ...s, prediction:pred }));
        if (pred.gesture !== 'unknown') onPredRef.current?.(pred);
      });

      // IMU for wrist orientation
      try {
        const imuChar = await service.getCharacteristic(IMU_CHAR_UUID);
        await imuChar.startNotifications();
        imuChar.addEventListener('characteristicvaluechanged', (e) => {
          const text = new TextDecoder().decode((e.target as BluetoothRemoteGATTCharacteristic).value!);
          const [r, p] = text.split(',').map(Number);
          setState(s => ({ ...s, roll:r, pitch:p }));
        });
      } catch { /* IMU optional */ }

      setState(s => ({ ...s, connected:true, connecting:false }));
    } catch (err) {
      setState(s => ({ ...s, connecting:false, error:err instanceof Error ? err.message : 'Failed' }));
    }
  }, [state.supported]);

  const disconnect = useCallback(() => {
    deviceRef.current?.gatt?.disconnect();
    setState(s => ({ ...s, connected:false, prediction:null }));
  }, []);

  useEffect(() => {
    return () => { deviceRef.current?.gatt?.disconnect(); };
  }, []);

  return { ...state, connect, disconnect };
}
