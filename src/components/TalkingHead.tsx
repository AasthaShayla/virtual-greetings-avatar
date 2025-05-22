
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSpeech } from '@/contexts/SpeechContext';
import { initScene } from '@/utils/threeUtils';
import { useAvatarModel } from '@/hooks/useAvatarModel';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import type { ThreeSceneObjects } from '@/utils/threeUtils';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const TalkingHead: React.FC = () => {
  const { mouthOpenness, speak, isSpeaking } = useSpeech();
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneObjectsRef = useRef<ThreeSceneObjects | null>(null);
  const currentMouthOpenness = useRef<number>(0);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Setup 3D scene with performance optimizations
  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log('Initializing 3D scene');
    try {
      sceneObjectsRef.current = initScene(canvasRef.current);
      
      // Handle window resize with debouncing
      let resizeTimeout: number;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          if (!sceneObjectsRef.current || !canvasRef.current) return;
          const { camera, renderer } = sceneObjectsRef.current;
          
          // Update based on container size for better performance
          const width = canvasRef.current.clientWidth;
          const height = canvasRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }, 100);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Mark initialization as complete
      setIsInitializing(false);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
        
        // Clean up renderer
        if (sceneObjectsRef.current?.renderer.domElement && canvasRef.current) {
          canvasRef.current.removeChild(sceneObjectsRef.current.renderer.domElement);
        }
        
        sceneObjectsRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing 3D scene:', error);
      setModelLoadError('Failed to initialize 3D scene. Please check your browser compatibility.');
      setIsInitializing(false);
    }
  }, []);
  
  // Load avatar model with improved error handling
  const { modelRef, mixerRef, jawBoneRef, modelLoaded } = useAvatarModel(sceneObjectsRef.current);
  
  // Directly update mouth openness without delay for better lip sync
  useEffect(() => {
    currentMouthOpenness.current = mouthOpenness;
  }, [mouthOpenness]);
  
  // Optimize animation loop
  useAvatarAnimation({
    sceneObjects: sceneObjectsRef.current,
    modelRef,
    mixerRef,
    jawBoneRef,
    modelLoaded,
    currentMouthOpenness
  });
  
  // Monitor for model loading issues
  useEffect(() => {
    // Set a timeout to check if model has loaded
    const timeout = setTimeout(() => {
      if (!modelLoaded && !isInitializing) {
        setModelLoadError('Model loading is taking longer than expected. There might be an issue with the format or file path. Check console for details.');
      }
    }, 10000); // 10 seconds
    
    if (modelLoaded) {
      setModelLoadError(null);
      // Auto-test speaking when model is loaded
      toast({
        title: "Model Ready",
        description: "3D character loaded successfully."
      });
      speak("Hello! My lips are now synced with my speech. How can I help you today?");
    }
    
    return () => clearTimeout(timeout);
  }, [modelLoaded, speak, isInitializing]);
  
  // Try speaking test message
  const testSpeak = () => {
    speak("Testing lip synchronization with the loaded 3D model. Can you see my mouth moving as I speak?");
  };

  return (
    <div className="relative h-full w-full">
      {isInitializing ? (
        <div className="flex items-center justify-center h-full">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-2/3 mx-auto" />
          </div>
        </div>
      ) : (
        <>
          <div ref={canvasRef} className="canvas-container h-full w-full" />
          
          {modelLoadError && (
            <div className="absolute top-0 left-0 right-0 m-4">
              <Alert variant="destructive">
                <AlertTitle>Loading Error</AlertTitle>
                <AlertDescription>
                  {modelLoadError}
                  <div className="mt-4 flex gap-2">
                    <Button onClick={testSpeak} variant="outline">Test Speech & Lip Sync</Button>
                    <Button onClick={() => window.location.reload()} variant="default">Reload Page</Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4">
            {modelLoaded && (
              <Button 
                onClick={testSpeak} 
                disabled={isSpeaking}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isSpeaking ? "Speaking..." : "Test Lip Sync"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TalkingHead;
