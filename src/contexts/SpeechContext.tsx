
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
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Pre-load voices to ensure availability
      let voices = speechSynthesis.getVoices();
      
      const voiceSetup = () => {
        voices = speechSynthesis.getVoices();
        console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
        
        // Prioritize female English voices
        const femaleVoice = voices.find(voice => 
          voice.lang.includes('en') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('woman') ||
           voice.name.toLowerCase().includes('girl') ||
           (!voice.name.toLowerCase().includes('male') && !voice.name.toLowerCase().includes('man')))
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
        
        // Set voice parameters for female characteristics
        utterance.pitch = 1.2;  // Higher pitch for female voice
        utterance.rate = 1.0;   // Normal speed
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
      };
      
      // Event handlers
      utterance.onstart = () => {
        console.log("Speech started");
        setIsSpeaking(true);
        
        // Clear any existing interval
        if (speechIntervalRef.current !== null) {
          clearInterval(speechIntervalRef.current);
        }
        
        // Enhanced lip sync with dynamic mouth movement for GLB model
        // Using a more accurate speech pattern simulation
        speechIntervalRef.current = window.setInterval(() => {
          // Analysis of speech patterns to create realistic mouth movements
          const now = Date.now();
          
          // Complex waveform to simulate natural speech patterns
          // Multiple overlapping waves with different frequencies
          const baseWave = Math.sin(now * 0.01) * 0.3 + 0.5;    // Base movement (slower)
          const detailWave = Math.sin(now * 0.05) * 0.2;        // Word articulation
          const microWave = Math.sin(now * 0.2) * 0.1;          // Micro-expressions
          
          // Add randomness to create natural variation in speech
          const randomVariation = Math.random() * 0.15;         // Small random variations
          
          // Calculate final mouth openness value with all components
          // The value is clamped between 0 and 1 for proper animation
          const volume = Math.max(0, Math.min(1, 
            baseWave + detailWave + microWave + randomVariation));
          
          setMouthOpenness(volume);
        }, 30); // Higher frequency updates (30ms) for smoother animation
      };
      
      utterance.onend = () => {
        console.log("Speech ended");
        if (speechIntervalRef.current !== null) {
          clearInterval(speechIntervalRef.current);
          speechIntervalRef.current = null;
        }
        setIsSpeaking(false);
        
        // Gradual mouth closing animation
        const closeMouth = () => {
          setMouthOpenness(prev => {
            const newValue = prev * 0.75; // Faster closing
            if (newValue < 0.01) {
              return 0;
            }
            requestAnimationFrame(closeMouth);
            return newValue;
          });
        };
        closeMouth();
      };
      
      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        if (speechIntervalRef.current !== null) {
          clearInterval(speechIntervalRef.current);
          speechIntervalRef.current = null;
        }
        setIsSpeaking(false);
        setMouthOpenness(0);
      };
      
      // Check if voices are loaded
      if (voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          voiceSetup();
        }, { once: true });
        
        // Safety timeout to force voice loading
        setTimeout(() => {
          if (voices.length === 0) {
            voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              voiceSetup();
            } else {
              // Last resort - speak without a specific voice
              window.speechSynthesis.speak(utterance);
            }
          }
        }, 500);
      } else {
        voiceSetup();
      }
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
