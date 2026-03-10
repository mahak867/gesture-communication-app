// hooks/useSpeech.ts
import { useCallback } from 'react';

export const useSpeech = () => {
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Optional: Select a specific voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0]; 
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { speak };
};