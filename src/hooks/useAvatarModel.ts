
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
    console.log('Loading 3D model...');
    const { scene } = sceneObjects;
    const fbxLoader = createFBXLoader();
    const { headMaterial, bodyMaterial } = loadTextures();
    
    // Load the FBX model
    fbxLoader.load(
      '/Exports/Business_Female_04.fbx',
      (fbx) => {
        console.log('Model loaded successfully');
        modelRef.current = fbx;
        
        // Scale and position the model
        fbx.scale.set(0.01, 0.01, 0.01); // Scale down the model
        fbx.position.set(0, 0, 0); // Center the model
        fbx.rotation.y = Math.PI; // Face the model toward the camera
        
        // Apply materials to the model
        fbx.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log('Found mesh:', child.name);
            
            // Apply head material to head parts
            if (child.name.includes('Head') || child.name.includes('Face') || 
                child.name.toLowerCase().includes('eye') || child.name.toLowerCase().includes('brow')) {
              child.material = headMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
              console.log('Applied head material to:', child.name);
            } 
            // Apply body material to body parts
            else {
              child.material = bodyMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
              console.log('Applied body material to:', child.name);
            }
          }
          
          // Find the jaw bone for animation
          if (child instanceof THREE.Bone && child.name.toLowerCase().includes('jaw')) {
            jawBoneRef.current = child;
            console.log('Found jaw bone:', child.name);
          }
        });
        
        // Add the model to the scene
        scene.add(fbx);
        console.log('Added model to scene');
        
        // Load facial animations
        loadFacialAnimations(fbx);
      },
      (progress) => {
        console.log('Model loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  };
  
  const loadFacialAnimations = (fbx: THREE.Group) => {
    console.log('Loading facial animations...');
    const fbxLoader = createFBXLoader();
    
    fbxLoader.load(
      '/Exports/Business_Female_04_facial.fbx',
      (facialFbx) => {
        console.log('Facial animations loaded successfully');
        // Create an animation mixer
        mixerRef.current = new THREE.AnimationMixer(fbx);
        
        // Get all animations from the facial model
        const animations = facialFbx.animations;
        console.log('Available animations:', animations.map(a => a.name));
        
        // Find the talking animation
        const talkingAnimation = animations.find(anim => 
          anim.name.includes('Talk') || anim.name.includes('Mouth')
        );
        
        if (talkingAnimation) {
          console.log('Found talking animation:', talkingAnimation.name);
          // Create an action for the talking animation
          const talkAction = mixerRef.current.clipAction(talkingAnimation);
          talkAction.setEffectiveWeight(0); // Start with weight 0
          talkAction.play();
        } else {
          console.log('No talking animation found, using available animations');
          // Use the first animation if no talking animation found
          if (animations.length > 0) {
            const firstAnimation = mixerRef.current.clipAction(animations[0]);
            firstAnimation.play();
          }
        }
        
        setModelLoaded(true);
      },
      (progress) => {
        console.log('Facial animation loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
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
