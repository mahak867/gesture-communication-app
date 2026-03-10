"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

// --- Speech Hook ---
const useSpeech = () => {
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);
  return { speak };
};

// --- Phrases Data ---
const phrases = [
  { text: "Hello", icon: "👋" }, { text: "Thank You", icon: "🙏" },
  { text: "Yes", icon: "✅" }, { text: "No", icon: "❌" },
  { text: "I need water", icon: "💧" }, { text: "I need help", icon: "🆘" },
];

// --- Quick Phrases Component ---
function QuickPhrases({ onSpeak }: { onSpeak: (text: string) => void }) {
  const { speak } = useSpeech();
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {phrases.map((p) => (
        <button key={p.text} onClick={() => { speak(p.text); onSpeak(p.text); }} 
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 flex items-center gap-2 transition-all hover:scale-105"
        >
          <span className="text-2xl">{p.icon}</span>
          <span className="text-sm font-medium text-white">{p.text}</span>
        </button>
      ))}
    </div>
  );
}

// --- Camera Component ---
function CameraView({ onDetect }: { onDetect: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const handsInstance = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastSpokenTime = useRef(0);
  const { speak } = useSpeech();

  const detectGesture = (lms: any) => {
    const thumb = { tip: lms[4], ip: lms[3], mcp: lms[2] };
    const index = { tip: lms[8], pip: lms[6] };
    const middle = { tip: lms[12], pip: lms[10] };
    const ring = { tip: lms[16], pip: lms[14] };
    const pinky = { tip: lms[20], pip: lms[18] };

    const isUp = (f: any) => f.tip.y < f.pip.y - 0.03;
    const thumbUp = thumb.tip.y < thumb.ip.y;
    const thumbOut = thumb.tip.x < thumb.mcp.x - 0.1;

    const indexUp = isUp(index);
    const middleUp = isUp(middle);
    const ringUp = isUp(ring);
    const pinkyUp = isUp(pinky);

    if (indexUp && middleUp && !ringUp && !pinkyUp) return "Two";
    if (indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) return "One";
    if (thumbUp && pinkyUp && !indexUp && !middleUp && !ringUp) return "Y";
    if (thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) return "L";
    if (pinkyUp && !ringUp && !middleUp && !indexUp) return "I";
    if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbOut) return "A";
    if (indexUp && middleUp && ringUp && pinkyUp && thumbUp) return "Five";
    
    return null;
  };

  const onResults = (results: any) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(results.image, 0, 0, w, h);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lms = results.multiHandLandmarks[0];
      const Hands = (window as any).Hands;
      const drawConnectors = (window as any).drawConnectors;
      if (drawConnectors && Hands) {
        drawConnectors(ctx, lms, Hands.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      }

      const gesture = detectGesture(lms);
      if (gesture) {
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        const x = lms[12].x * w;
        const y = lms[12].y * h - 50;
        ctx.strokeText(gesture, x, y);
        ctx.fillText(gesture, x, y);

        const now = Date.now();
        if (now - lastSpokenTime.current > 2000) {
          speak(gesture);
          onDetect(gesture);
          lastSpokenTime.current = now;
        }
      }
    }
    ctx.restore();
  };

  useEffect(() => {
    if (!isReady) return;
    const Hands = (window as any).Hands;
    if (!Hands) return;

    const hands = new Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
    hands.onResults(onResults);
    handsInstance.current = hands;

    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        const processFrame = async () => {
          if (videoRef.current && handsInstance.current) await handsInstance.current.send({ image: videoRef.current });
          animationFrameId.current = requestAnimationFrame(processFrame);
        };
        processFrame();
      }
    });
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [isReady]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
       <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="afterInteractive" />
       <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" onLoad={() => setIsReady(true)} />
       
       {!isReady && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 z-10 gap-4">
           <div className="w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin"></div>
           <span>Initializing Camera...</span>
         </div>
       )}
       
       <video ref={videoRef} className="hidden" autoPlay playsInline />
       <canvas ref={canvasRef} width="1280" height="720" className="w-full h-full object-cover transform scale-x-[-1]" />
    </div>
  );
}

// --- Main Page ---
export default function CommunicationApp() {
  const [history, setHistory] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const { speak } = useSpeech();

  const handleNewMessage = (text: string) => {
    setHistory((prev) => [text, ...prev.slice(0, 10)]);
  };

  const handleManualSpeak = () => {
    if (inputText.trim()) {
      speak(inputText);
      handleNewMessage(inputText);
      setInputText("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
      
      {/* Left: Camera */}
      <div className="w-full md:w-3/5 h-[60vh] md:h-screen relative flex flex-col">
        <CameraView onDetect={handleNewMessage} />
        
        {/* History */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 max-h-40 overflow-y-auto z-20">
          <div className="text-xs text-gray-400 uppercase mb-2">Conversation Log</div>
          <div className="flex flex-wrap gap-2">
            {history.map((msg, i) => (
              <div key={i} className="bg-white/10 rounded px-3 py-1 text-sm">{msg}</div>
            ))}
            {history.length === 0 && <span className="text-gray-500 text-sm italic">Waiting for input...</span>}
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="w-full md:w-2/5 bg-slate-900 border-l border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto">
        
        <div>
          <h1 className="text-2xl font-bold text-blue-400">TalkBox</h1>
          <p className="text-sm text-gray-400">Communication Assistant</p>
        </div>

        {/* Type to Speak */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase text-gray-500 font-bold">Type to Speak</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSpeak()}
              placeholder="Type anything..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
            <button onClick={handleManualSpeak} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold transition-colors">
              Speak
            </button>
          </div>
        </div>

        {/* Quick Phrases */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase text-gray-500 font-bold">Quick Phrases</h2>
          <QuickPhrases onSpeak={handleNewMessage} />
        </div>
      </div>
    </main>
  );
}