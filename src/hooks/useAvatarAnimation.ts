
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ThreeSceneObjects } from '@/utils/threeUtils';

interface AnimationProps {
  sceneObjects: ThreeSceneObjects | null;
  modelRef: React.MutableRefObject<THREE.Group | null>;
  mixerRef: React.MutableRefObject<THREE.AnimationMixer | null>;
  jawBoneRef: React.MutableRefObject<THREE.Bone | null>;
  modelLoaded: boolean;
  currentMouthOpenness: React.MutableRefObject<number>;
}

export const useAvatarAnimation = ({
  sceneObjects,
  modelRef,
  mixerRef,
  jawBoneRef,
  modelLoaded,
  currentMouthOpenness
}: AnimationProps) => {
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationFrameId = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const TARGET_FPS = 60;
  const FRAME_TIME = 1000 / TARGET_FPS;
  
  useEffect(() => {
    if (!sceneObjects || !modelLoaded) return;
    
    // Reset clock to ensure smooth animation
    clockRef.current.start();
    
    // Start the animation loop with frame rate limiting
    animate();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [sceneObjects, modelLoaded]);
  
  const animate = () => {
    const now = performance.now();
    const elapsed = now - lastFrameTime.current;
    
    // Limit frame rate for performance but ensure smooth animation
    if (elapsed > FRAME_TIME) {
      lastFrameTime.current = now - (elapsed % FRAME_TIME);
      
      // Update lip sync with improved smoothing
      if (jawBoneRef.current && modelLoaded) {
        // Map mouth openness to jaw rotation with enhanced natural movement
        const targetRotation = currentMouthOpenness.current * 0.3; // Scaled for better visibility
        const currentRotation = jawBoneRef.current.rotation.x;
        // Apply smoothing for more natural transitions
        jawBoneRef.current.rotation.x += (targetRotation - currentRotation) * 0.3;
      }
      
      // Check for morph targets for lip sync (alternative method)
      if (modelRef.current && modelLoaded) {
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && 
              child.morphTargetDictionary && 
              child.morphTargetInfluences) {
            
            // Look for mouth morph targets
            for (const key in child.morphTargetDictionary) {
              if (key.toLowerCase().includes('mouth') || 
                  key.toLowerCase().includes('lip') ||
                  key.toLowerCase().includes('jaw')) {
                
                const index = child.morphTargetDictionary[key];
                const targetValue = currentMouthOpenness.current;
                const currentValue = child.morphTargetInfluences[index];
                
                // Apply smooth interpolation to lip movement
                child.morphTargetInfluences[index] = 
                  currentValue + (targetValue - currentValue) * 0.3;
              }
            }
          }
        });
      }
      
      // Update animation mixer with delta time for consistent speed
      const deltaTime = clockRef.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(deltaTime);
      }
      
      // Add subtle natural head movements when not speaking
      if (modelRef.current && currentMouthOpenness.current < 0.1) {
        const time = now * 0.0003;
        // Subtle idle movements for naturalistic feel
        const subtleMovement = Math.sin(time) * 0.03;
        // Apply subtle movement to the model's head
        modelRef.current.rotation.y += (subtleMovement - modelRef.current.rotation.y) * 0.01;
        modelRef.current.rotation.x += (Math.sin(time * 1.3) * 0.02 - modelRef.current.rotation.x) * 0.01;
      }
      
      // Render the scene
      if (sceneObjects) {
        sceneObjects.renderer.render(sceneObjects.scene, sceneObjects.camera);
      }
    }
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(animate);
  };
};
