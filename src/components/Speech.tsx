
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface SpeechProps {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onSpeechData: (volume: number) => void;
}

const Speech: React.FC<SpeechProps> = ({ 
  onSpeechStart, 
  onSpeechEnd, 
  onSpeechData 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice (optional - uses default voice if not specified)
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.includes('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        onSpeechStart();
        
        // Simulate mouth movement based on speech rhythm
        const mouthInterval = setInterval(() => {
          const volume = Math.random() * 0.8; // Simulate volume for mouth movement
          onSpeechData(volume);
        }, 100);
        
        utterance.onend = () => {
          clearInterval(mouthInterval);
          setIsSpeaking(false);
          onSpeechEnd();
        };
        
        utterance.onerror = () => {
          clearInterval(mouthInterval);
          setIsSpeaking(false);
          onSpeechEnd();
        };
      };
      
      // Speak
      speechSynthesis.speak(utterance);
    } else {
      console.error("Speech synthesis not supported in this browser");
    }
  }, [onSpeechStart, onSpeechEnd, onSpeechData]);
  
  const handleSayHi = () => {
    speak("Hi there!");
  };
  
  return (
    <div className="controls">
      <Button 
        onClick={handleSayHi}
        disabled={isSpeaking}
      >
        Say Hi
      </Button>
    </div>
  );
};

export default Speech;
