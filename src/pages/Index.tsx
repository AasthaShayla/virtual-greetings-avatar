
import { useEffect } from 'react';
import TalkingHead from '@/components/TalkingHead';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/contexts/SpeechContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { speak } = useSpeech();

  // Ensure voices are loaded and welcome user
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Force voice loading
      speechSynthesis.getVoices();
      
      // Preload voices and say welcome after a brief delay to ensure model is loaded
      const timer = setTimeout(() => {
        speak("Hello there! I'm your virtual assistant. How can I help you today?");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [speak]);

  const handleSayWelcome = () => {
    speak("Hi there! I'm your virtual business assistant. I'm here to help you with information and assistance. What would you like to know?");
  };
  
  const handleSayAbout = () => {
    speak("I'm a virtual assistant powered by artificial intelligence. I can provide information, answer questions, and assist with various tasks.");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div id="canvas-container" className="h-full w-full">
          <TalkingHead />
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
        <Button 
          onClick={handleSayWelcome}
          className="bg-purple-500 hover:bg-purple-600 px-6 py-3 text-lg font-medium"
        >
          Welcome
        </Button>
        
        <Button 
          onClick={handleSayAbout}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 text-lg font-medium"
        >
          About Me
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600 px-6 py-3 text-lg font-medium">
              More Options
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-4 pt-10">
              <h2 className="text-xl font-bold">Virtual Assistant</h2>
              <p className="text-gray-600">Your AI-powered virtual assistant with realistic expressions and voice.</p>
              <Button 
                onClick={() => speak("I can help you with information, scheduling, and more. Just let me know what you need.")}
                className="w-full"
              >
                What can you do?
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default Index;
