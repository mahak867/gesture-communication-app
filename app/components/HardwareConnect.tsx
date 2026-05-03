'use client';
// Hardware connection panel — wristband + glove via Web Bluetooth
// Shows in Settings tab, connects to physical devices
import { useWristband, type WristGesture } from '../hooks/useWristband';
import { useGlove, type GlovePrediction } from '../hooks/useGlove';

interface Props {
  onWristGesture?:  (g: WristGesture)   => void;
  onGlovePrediction?: (p: GlovePrediction) => void;
}

export default function HardwareConnect({ onWristGesture, onGlovePrediction }: Props) {
  const wrist = useWristband(onWristGesture);
  const glove = useGlove(onGlovePrediction);

  const GESTURE_LABELS: Record<WristGesture, string> = {
    yes:'Tilt left → YES', no:'Tilt right → NO',
    help:'Tilt forward → HELP', sos:'Shake → SOS 🚨', idle:'Resting',
  };

  if (!wrist.supported) return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-xs text-gray-500">
      ⚠️ Web Bluetooth requires Chrome on Android or Windows. Safari and Firefox are not supported.
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs uppercase text-gray-500 font-bold">⌚ Hardware Input</h3>

      {/* Wristband */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Wristband</p>
            <p className="text-xs text-gray-500 mt-0.5">XIAO nRF52840 + BNO055 IMU</p>
          </div>
          <div className="flex items-center gap-2">
            {wrist.connected && <span className="text-xs text-gray-500">🔋{wrist.batteryPct}%</span>}
            <span className={`w-2 h-2 rounded-full ${wrist.connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
          </div>
        </div>

        {wrist.connected ? (
          <div className="flex flex-col gap-2">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cyan-300">{GESTURE_LABELS[wrist.gesture]}</p>
              <p className="text-xs text-gray-600 mt-1">Roll: {wrist.roll.toFixed(1)}° · Pitch: {wrist.pitch.toFixed(1)}°</p>
            </div>
            <div className="text-[10px] text-gray-600 text-center">
              Tilt left = YES · Tilt right = NO · Tilt forward = HELP · Shake = SOS
            </div>
            <button onClick={wrist.disconnect}
              className="w-full min-h-[44px] bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-xl transition-colors">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={wrist.connect} disabled={wrist.connecting}
            className="w-full min-h-[44px] bg-blue-800 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
            {wrist.connecting ? <><span className="animate-spin">⟳</span> Connecting…</> : '⌚ Connect Wristband'}
          </button>
        )}
        {wrist.error && <p className="text-xs text-red-400">{wrist.error}</p>}
      </div>

      {/* Glove */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Gesture Glove</p>
            <p className="text-xs text-gray-500 mt-0.5">XIAO + ADS1115 flex sensors + BNO055</p>
          </div>
          <span className={`w-2 h-2 rounded-full ${glove.connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
        </div>

        {glove.connected && glove.prediction ? (
          <div className="flex flex-col gap-2">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-cyan-300">{glove.prediction.gesture}</span>
                <span className="text-xs text-gray-500">{(glove.prediction.confidence*100).toFixed(0)}%</span>
              </div>
              {/* Finger visualizer */}
              <div className="flex gap-1.5 mt-2">
                {(['thumb','index','middle','ring','pinky'] as const).map(f => (
                  <div key={f} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full bg-gray-700 rounded-full overflow-hidden" style={{height:32}}>
                      <div className="w-full bg-cyan-500 rounded-full transition-all"
                        style={{height:`${glove.prediction!.fingers[f]*100}%`,marginTop:`${(1-glove.prediction!.fingers[f])*100}%`}} />
                    </div>
                    <span className="text-[9px] text-gray-600">{f[0].toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={glove.disconnect}
              className="w-full min-h-[44px] bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-xl transition-colors">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={glove.connect} disabled={glove.connecting}
            className="w-full min-h-[44px] bg-violet-800 hover:bg-violet-700 disabled:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
            {glove.connecting ? <><span className="animate-spin">⟳</span> Connecting…</> : '🧤 Connect Glove'}
          </button>
        )}
        {glove.error && <p className="text-xs text-red-400">{glove.error}</p>}
      </div>

      <p className="text-[10px] text-gray-600 leading-relaxed text-center">
        Hardware is optional — the app works fully without it. The wristband enables FatigueMode for late-stage ALS patients who cannot hold a phone. The glove supplements camera gesture detection.
      </p>
    </div>
  );
}
