
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
    
    // Add extra lighting to make sure the model is visible
    const frontLight = new THREE.DirectionalLight(0xffffff, 1);
    frontLight.position.set(0, 0, 2);
    sceneObjects.scene.add(frontLight);
    
    // Start the animation loop
    animate();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [sceneObjects, modelLoaded]);
  
  const animate = () => {
    // Update mouth animation based on speech
    if (jawBoneRef.current && modelLoaded) {
      // Map the mouth openness to jaw rotation
      const jawRotation = currentMouthOpenness.current * 0.3; // Scale down the rotation
      jawBoneRef.current.rotation.x = jawRotation;
    }
    
    // Update animation mixer
    const deltaTime = clockRef.current.getDelta();
    if (mixerRef.current) {
      mixerRef.current.update(deltaTime);
    }
    
    // Make head move slightly for more natural look
    if (modelRef.current) {
      const time = Date.now() * 0.0005;
      modelRef.current.rotation.y = Math.PI + Math.sin(time) * 0.05;
      modelRef.current.rotation.x = Math.sin(time * 1.3) * 0.03;
    }
    
    // Render the scene
    if (sceneObjects) {
      const { scene, camera, renderer } = sceneObjects;
      renderer.render(scene, camera);
    }
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(animate);
  };
};
