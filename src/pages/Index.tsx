
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
    speak("Hi there! It's nice to meet you!");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div id="canvas-container" className="h-full w-full">
          <TalkingHead />
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <Button 
          onClick={handleSayHi}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 text-lg font-medium"
        >
          Say Hi
        </Button>
      </div>
    </div>
  );
};

export default Index;
