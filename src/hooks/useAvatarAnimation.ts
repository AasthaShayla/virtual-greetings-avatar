
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
  
  useEffect(() => {
    if (!sceneObjects) return;
    
    // Add stronger lighting to make sure the model is visible
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
    frontLight.position.set(0, 0, 2);
    sceneObjects.scene.add(frontLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-1, 0.5, 0.5);
    sceneObjects.scene.add(fillLight);
    
    // Start the animation loop
    animate();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [sceneObjects, modelLoaded]);
  
  const animate = () => {
    // Update mouth animation based on speech for lip sync
    if (jawBoneRef.current && modelLoaded) {
      // Enhanced lip sync - map the mouth openness to jaw rotation with more natural movement
      const targetRotation = currentMouthOpenness.current * 0.4; // Increase jaw movement range
      const currentRotation = jawBoneRef.current.rotation.x;
      // Smooth transition for more natural movement
      jawBoneRef.current.rotation.x += (targetRotation - currentRotation) * 0.3;
    }
    
    // Update animation mixer
    const deltaTime = clockRef.current.getDelta();
    if (mixerRef.current) {
      mixerRef.current.update(deltaTime);
    }
    
    // Make head move slightly for more natural look with enhanced facial expressions
    if (modelRef.current) {
      const time = Date.now() * 0.0005;
      // Face the model toward the camera (already set in model loading)
      // Add subtle natural movements
      modelRef.current.rotation.y = Math.sin(time) * 0.05; 
      modelRef.current.rotation.x = Math.sin(time * 1.3) * 0.03;
    }
    
    // Render the scene
    if (sceneObjects) {
      const { scene, camera, renderer } = sceneObjects;
      renderer.render(scene, camera);
    }
    
    // Continue animation loop with optimized frame rate
    animationFrameId.current = requestAnimationFrame(animate);
  };
};
