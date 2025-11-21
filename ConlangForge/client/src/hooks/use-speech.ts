import { useState, useCallback, useRef } from 'react';

interface UseSpeechOptions {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  lang?: string; // BCP 47 language tag
}

// Synchronous feature detection
function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const [currentlySpeaking, setCurrentlySpeaking] = useState<string | null>(null);
  const supported = isSpeechSynthesisSupported();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, id?: string, onComplete?: () => void) => {
    // Synchronous guard - exit early if unsupported
    if (!isSpeechSynthesisSupported() || !text) {
      onComplete?.();
      return;
    }

    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    
    if (options.lang) {
      utterance.lang = options.lang;
    }

    utterance.onstart = () => {
      setCurrentlySpeaking(id || text);
    };
    
    utterance.onend = () => {
      setCurrentlySpeaking(null);
      onComplete?.();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setCurrentlySpeaking(null);
      onComplete?.();
    };

    utteranceRef.current = utterance;
    
    // Small delay to ensure proper initialization
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 10);
  }, [options.rate, options.pitch, options.volume, options.lang]);

  const stop = useCallback(() => {
    // Synchronous guard
    if (!isSpeechSynthesisSupported()) return;
    
    window.speechSynthesis.cancel();
    setCurrentlySpeaking(null);
  }, []);

  const isSpeaking = useCallback((id?: string) => {
    if (!id) return currentlySpeaking !== null;
    return currentlySpeaking === id;
  }, [currentlySpeaking]);

  return {
    speak,
    stop,
    isSpeaking,
    supported,
  };
}
