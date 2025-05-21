
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { createFBXLoader, loadTextures } from '@/utils/threeUtils';
import type { ThreeSceneObjects } from '@/utils/threeUtils';

export const useAvatarModel = (sceneObjects: ThreeSceneObjects | null) => {
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  useEffect(() => {
    if (!sceneObjects) return;
    
    loadModel(sceneObjects);
    
    return () => {
      // Clean up model
      if (modelRef.current && sceneObjects.scene) {
        sceneObjects.scene.remove(modelRef.current);
        modelRef.current = null;
      }
    };
  }, [sceneObjects]);
  
  const loadModel = (sceneObjects: ThreeSceneObjects) => {
    const { scene } = sceneObjects;
    const fbxLoader = createFBXLoader();
    const { headMaterial, bodyMaterial } = loadTextures();
    
    // Load the FBX model
    fbxLoader.load(
      '/Exports/Business_Female_04.fbx',
      (fbx) => {
        modelRef.current = fbx;
        
        // Scale and position the model
        fbx.scale.set(0.01, 0.01, 0.01); // Scale down the model
        fbx.position.set(0, 0, 0); // Center the model
        fbx.rotation.y = Math.PI; // Face the model toward the camera
        
        // Apply materials to the model
        fbx.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Apply head material to head parts
            if (child.name.includes('Head') || child.name.includes('Face')) {
              child.material = headMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            } 
            // Apply body material to body parts
            else {
              child.material = bodyMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
          
          // Find the jaw bone for animation
          if (child instanceof THREE.Bone && child.name.includes('Jaw')) {
            jawBoneRef.current = child;
          }
        });
        
        // Add the model to the scene
        scene.add(fbx);
        
        // Load facial animations
        loadFacialAnimations(fbx);
      },
      (progress) => {
        console.log('Model loading:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  };
  
  const loadFacialAnimations = (fbx: THREE.Group) => {
    const fbxLoader = createFBXLoader();
    
    fbxLoader.load(
      '/Exports/Business_Female_04_facial.fbx',
      (facialFbx) => {
        // Create an animation mixer
        mixerRef.current = new THREE.AnimationMixer(fbx);
        
        // Get all animations from the facial model
        const animations = facialFbx.animations;
        
        // Find the talking animation
        const talkingAnimation = animations.find(anim => 
          anim.name.includes('Talk') || anim.name.includes('Mouth')
        );
        
        if (talkingAnimation) {
          // Create an action for the talking animation
          const talkAction = mixerRef.current.clipAction(talkingAnimation);
          talkAction.setEffectiveWeight(0); // Start with weight 0
          talkAction.play();
        }
        
        setModelLoaded(true);
      },
      (progress) => {
        console.log('Facial animation loading:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading facial animations:', error);
      }
    );
  };

  return {
    modelRef,
    mixerRef,
    jawBoneRef,
    modelLoaded
  };
};
