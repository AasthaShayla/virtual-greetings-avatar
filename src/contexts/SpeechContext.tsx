
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SpeechContextType {
  isSpeaking: boolean;
  mouthOpenness: number;
  speak: (text: string) => void;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpenness, setMouthOpenness] = useState(0);
  
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set a voice (optional)
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.includes('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        
        // Simulate mouth movement based on speech rhythm
        const mouthInterval = setInterval(() => {
          const volume = Math.random() * 0.8;
          setMouthOpenness(volume);
        }, 100);
        
        utterance.onend = () => {
          clearInterval(mouthInterval);
          setIsSpeaking(false);
          setMouthOpenness(0);
        };
        
        utterance.onerror = () => {
          clearInterval(mouthInterval);
          setIsSpeaking(false);
          setMouthOpenness(0);
        };
      };
      
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
