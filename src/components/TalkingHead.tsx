
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSpeech } from '@/contexts/SpeechContext';
import { initScene } from '@/utils/threeUtils';
import { useAvatarModel } from '@/hooks/useAvatarModel';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import type { ThreeSceneObjects } from '@/utils/threeUtils';

const TalkingHead: React.FC = () => {
  const { mouthOpenness } = useSpeech();
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneObjectsRef = useRef<ThreeSceneObjects | null>(null);
  const currentMouthOpenness = useRef<number>(0);
  
  // Setup 3D scene
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize the 3D scene
    sceneObjectsRef.current = initScene(canvasRef.current);
    
    // Handle window resize
    const handleResize = () => {
      if (!sceneObjectsRef.current) return;
      const { camera, renderer } = sceneObjectsRef.current;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneObjectsRef.current?.renderer.domElement && canvasRef.current) {
        canvasRef.current.removeChild(sceneObjectsRef.current.renderer.domElement);
      }
      
      sceneObjectsRef.current = null;
    };
  }, []);
  
  // Load and setup avatar model
  const { modelRef, mixerRef, jawBoneRef, modelLoaded } = useAvatarModel(sceneObjectsRef.current);
  
  // Update mouth openness from speech
  useEffect(() => {
    currentMouthOpenness.current = mouthOpenness;
  }, [mouthOpenness]);
  
  // Setup animation loop
  useAvatarAnimation({
    sceneObjects: sceneObjectsRef.current,
    modelRef,
    mixerRef,
    jawBoneRef,
    modelLoaded,
    currentMouthOpenness
  });

  return <div ref={canvasRef} className="canvas-container h-full w-full" />;
};

export default TalkingHead;
