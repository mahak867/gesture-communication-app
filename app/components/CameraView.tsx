// components/CameraView.tsx
"use client";
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useSpeech } from '@/hooks/useSpeech';

export default function CameraView({ onDetect }: { onDetect: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const handsInstance = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastSpokenTime = useRef(0);
  const { speak } = useSpeech();

  // --- GESTURE LOGIC (Same as before) ---
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

    // Numbers
    if (thumb.tip.x < index.tip.x && !middleUp && !ringUp && !pinkyUp) return "Zero";
    if (indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) return "One";
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "Two";
    if (indexUp && middleUp && ringUp && !pinkyUp) return "Three";
    if (indexUp && middleUp && ringUp && pinkyUp && !thumbUp) return "Four";
    if (indexUp && middleUp && ringUp && pinkyUp && thumbUp) return "Five";

    // Letters
    if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbOut) return "A";
    if (indexUp && middleUp && ringUp && pinkyUp && !thumbOut) return "B";
    if (pinkyUp && !ringUp && !middleUp && !indexUp) return "I";
    if (thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) return "L";
    if (thumbUp && pinkyUp && !indexUp && !middleUp && !ringUp) return "Y";
    if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp && !thumbOut) return "Like";

    return null;
  };

  // --- RENDER LOOP ---
  const onResults = (results: any) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(results.image, 0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lms = results.multiHandLandmarks[0];
      
      // Draw Skeleton
      const Hands = (window as any).Hands;
      const drawConnectors = (window as any).drawConnectors;
      if (drawConnectors && Hands) {
        drawConnectors(ctx, lms, Hands.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      }

      const gesture = detectGesture(lms);
      if (gesture) {
        // Draw Text
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        const x = lms[12].x * width;
        const y = lms[12].y * height - 50;
        ctx.strokeText(gesture, x, y);
        ctx.fillText(gesture, x, y);

        // Speak & Callback
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

  // --- INIT ---
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
       
       {!isReady && <div className="absolute inset-0 flex items-center justify-center text-white animate-pulse bg-black/80">Loading AI Model...</div>}
       
       <video ref={videoRef} className="hidden" autoPlay playsInline />
       <canvas ref={canvasRef} width="1280" height="720" className="w-full h-full object-cover transform scale-x-[-1]" />
    </div>
  );
}