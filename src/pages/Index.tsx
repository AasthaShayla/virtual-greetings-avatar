
import { useEffect } from 'react';
import TalkingHead from '@/components/TalkingHead';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/contexts/SpeechContext';

const Index = () => {
  const { speak } = useSpeech();

  // Ensure voices are loaded (some browsers need this)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
    }
  }, []);

  const handleSayHi = () => {
    speak("Hi there!");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100">
      <div id="canvas-container">
        <TalkingHead />
      </div>

      <div className="controls">
        <Button 
          onClick={handleSayHi}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Say Hi
        </Button>
      </div>
    </div>
  );
};

export default Index;
