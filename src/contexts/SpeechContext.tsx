
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

interface SpeechContextType {
  isSpeaking: boolean;
  mouthOpenness: number;
  speak: (text: string) => void;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpenness, setMouthOpenness] = useState(0);
  const speechIntervalRef = useRef<number | null>(null);
  
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set a female voice specifically
      const voices = speechSynthesis.getVoices();
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      
      // Try to find a female English voice
      const femaleVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.includes('female') || 
         voice.name.includes('woman') || 
         voice.name.includes('girl') ||
         (!voice.name.includes('male') && !voice.name.includes('man')))
      );
      
      if (femaleVoice) {
        console.log("Using female voice:", femaleVoice.name);
        utterance.voice = femaleVoice;
      } else {
        // Fallback to any English voice
        const englishVoice = voices.find(voice => voice.lang.includes('en'));
        if (englishVoice) {
          console.log("Using fallback voice:", englishVoice.name);
          utterance.voice = englishVoice;
        }
      }
      
      // Set speech parameters for more natural female speech
      utterance.pitch = 1.2;  // Slightly higher pitch for female voice
      utterance.rate = 1.0;   // Normal speed
      
      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        
        // Clear any existing interval
        if (speechIntervalRef.current !== null) {
          clearInterval(speechIntervalRef.current);
        }
        
        // Enhanced mouth movement based on speech rhythm
        speechIntervalRef.current = window.setInterval(() => {
          // Use a more natural mouth movement pattern
          // This creates a wave-like pattern that better mimics speech
          const now = Date.now();
          const base = Math.sin(now * 0.01) * 0.3 + 0.5; // Base movement
          const detail = Math.sin(now * 0.05) * 0.2;     // Detailed movement
          const volume = Math.max(0, Math.min(0.9, base + detail)); // Clamp between 0-0.9
          
          setMouthOpenness(volume);
        }, 50); // More frequent updates for smoother animation
      };
      
      utterance.onend = () => {
        if (speechIntervalRef.current !== null) {
          clearInterval(speechIntervalRef.current);
          speechIntervalRef.current = null;
        }
        setIsSpeaking(false);
        
        // Gradually close mouth for natural look
        const closeMouth = () => {
          setMouthOpenness(prev => {
            const newValue = prev * 0.8;
            if (newValue < 0.01) {
              return 0;
            }
            setTimeout(closeMouth, 50);
            return newValue;
          });
        };
        closeMouth();
      };
      
      utterance.onerror = () => {
        if (speechIntervalRef.current !== null) {
          clearInterval(speechIntervalRef.current);
          speechIntervalRef.current = null;
        }
        setIsSpeaking(false);
        setMouthOpenness(0);
      };
      
      // Pre-load voices if needed
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          // Try again once voices are loaded
          speak(text);
        }, { once: true });
        return;
      }
      
      // Speak
      speechSynthesis.speak(utterance);
    } else {
      console.error("Speech synthesis not supported in this browser");
    }
  }, []);
  
  return (
    <SpeechContext.Provider value={{ isSpeaking, mouthOpenness, speak }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = (): SpeechContextType => {
  const context = useContext(SpeechContext);
  if (context === undefined) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};
