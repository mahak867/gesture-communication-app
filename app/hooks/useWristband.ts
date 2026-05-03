// app/hooks/useWristband.ts
// Web Bluetooth connection to BNO055 wristband (Seeed XIAO nRF52840)
// Handles: BLE connection, IMU tilt → gesture, GATT characteristic notifications
// Directly wires to FatigueMode YES/NO/HELP/SOS buttons
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

// Web Bluetooth type stubs (not in lib.dom.d.ts by default in all TS configs)
declare global {
  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    value: DataView | null;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
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

export type WristGesture = 'yes' | 'no' | 'help' | 'sos' | 'idle';

export interface WristbandState {
  connected:    boolean;
  connecting:   boolean;
  gesture:      WristGesture;
  roll:         number;   // degrees, -180 to 180
  pitch:        number;   // degrees, -90 to 90
  batteryPct:   number;   // 0-100
  error:        string | null;
  supported:    boolean;  // Web Bluetooth API available
}

// BLE service and characteristic UUIDs — must match firmware
const SERVICE_UUID  = '19b10000-e8f2-537e-4f6c-d104768a1214';
const IMU_CHAR_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
const BAT_CHAR_UUID = '19b10002-e8f2-537e-4f6c-d104768a1214';

// Tilt thresholds (degrees) — calibrated for minimal wrist movement
const THRESH = { tiltLeft: -20, tiltRight: 20, tiltFwd: -25, shake: 35 };

function classifyGesture(roll: number, pitch: number): WristGesture {
  if (Math.abs(roll) > THRESH.shake && Math.abs(pitch) > THRESH.shake) return 'sos';
  if (roll < THRESH.tiltLeft)  return 'yes';
  if (roll > THRESH.tiltRight) return 'no';
  if (pitch < THRESH.tiltFwd)  return 'help';
  return 'idle';
}

export function useWristband(onGesture?: (g: WristGesture) => void) {
  const [state, setState] = useState<WristbandState>({
    connected: false, connecting: false, gesture: 'idle',
    roll: 0, pitch: 0, batteryPct: 100, error: null,
    supported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
  });

  const deviceRef    = useRef<BluetoothDevice | null>(null);
  const onGestureRef = useRef(onGesture);
  useEffect(() => { onGestureRef.current = onGesture; }, [onGesture]);

  const connect = useCallback(async () => {
    if (!state.supported) {
      setState(s => ({ ...s, error: 'Web Bluetooth not supported. Use Chrome on Android/Windows.' }));
      return;
    }
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      const device = await (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth.requestDevice({
        filters: [{ name: 'GestureTalk-Wrist' }],
        optionalServices: [SERVICE_UUID],
      });

      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setState(s => ({ ...s, connected: false, gesture: 'idle', error: 'Wristband disconnected' }));
      });

      const server  = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      // IMU characteristic — roll,pitch,yaw as comma-separated string
      const imuChar = await service.getCharacteristic(IMU_CHAR_UUID);
      await imuChar.startNotifications();
      imuChar.addEventListener('characteristicvaluechanged', (e) => {
        const val  = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const text = new TextDecoder().decode(val);
        const [r, p] = text.split(',').map(Number);
        const gesture = classifyGesture(r, p);
        setState(s => ({ ...s, roll: r, pitch: p, gesture }));
        if (gesture !== 'idle') onGestureRef.current?.(gesture);
      });

      // Battery characteristic — single byte 0-100
      try {
        const batChar = await service.getCharacteristic(BAT_CHAR_UUID);
        const batVal  = await batChar.readValue();
        setState(s => ({ ...s, batteryPct: batVal.getUint8(0) }));
      } catch { /* battery optional */ }

      setState(s => ({ ...s, connected: true, connecting: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setState(s => ({ ...s, connecting: false, error: msg }));
    }
  }, [state.supported]);

  const disconnect = useCallback(() => {
    deviceRef.current?.gatt?.disconnect();
    setState(s => ({ ...s, connected: false, gesture: 'idle' }));
  }, []);

  // Cleanup on unmount — disconnect BLE to free browser resources
  useEffect(() => {
    return () => { deviceRef.current?.gatt?.disconnect(); };
  }, []);

  return { ...state, connect, disconnect };
}
