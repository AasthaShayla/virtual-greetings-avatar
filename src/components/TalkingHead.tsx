
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSpeech } from '@/contexts/SpeechContext';
import { initScene } from '@/utils/threeUtils';
import { useAvatarModel } from '@/hooks/useAvatarModel';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import type { ThreeSceneObjects } from '@/utils/threeUtils';
import { Button } from '@/components/ui/button';

const TalkingHead: React.FC = () => {
  const { mouthOpenness, speak } = useSpeech();
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneObjectsRef = useRef<ThreeSceneObjects | null>(null);
  const currentMouthOpenness = useRef<number>(0);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  
  // Setup 3D scene with performance optimizations
  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log('Initializing 3D scene');
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      
      // Clean up renderer
      if (sceneObjectsRef.current?.renderer.domElement && canvasRef.current) {
        canvasRef.current.removeChild(sceneObjectsRef.current.renderer.domElement);
      }
      
      sceneObjectsRef.current = null;
    };
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
      if (!modelLoaded) {
        setModelLoadError('Model loading is taking longer than expected. There might be an issue with the format or file path.');
      }
    }, 10000); // 10 seconds
    
    if (modelLoaded) {
      setModelLoadError(null);
    }
    
    return () => clearTimeout(timeout);
  }, [modelLoaded]);
  
  // Try speaking test message
  const testSpeak = () => {
    speak("Testing the virtual agent with the new 3D model.");
  };

  return (
    <div className="relative h-full w-full">
      <div ref={canvasRef} className="canvas-container h-full w-full" />
      
      {modelLoadError && (
        <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-4 text-center">
          {modelLoadError}
          <div className="mt-2">
            <Button onClick={testSpeak} variant="outline">Test Speech</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalkingHead;
