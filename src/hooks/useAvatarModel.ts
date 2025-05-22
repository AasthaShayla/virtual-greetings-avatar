
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
    
    // Create a loading manager with progress tracking
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      console.log(`Loading model: ${Math.round(loaded / total * 100)}% (${url})`);
    };
    
    // Load model with optimized settings
    loadModel(sceneObjects, loadingManager);
    
    return () => {
      // Clean up model
      if (modelRef.current && sceneObjects.scene) {
        sceneObjects.scene.remove(modelRef.current);
        modelRef.current = null;
      }
      
      // Clean up animations
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [sceneObjects]);
  
  const loadModel = (sceneObjects: ThreeSceneObjects, loadingManager: THREE.LoadingManager) => {
    console.log('Loading 3D model...');
    const { scene } = sceneObjects;
    const fbxLoader = createFBXLoader(loadingManager);
    const { headMaterial, bodyMaterial } = loadTextures();
    
    // Load the FBX model with improved settings
    fbxLoader.load(
      '/Exports/Business_Female_04.fbx',
      (fbx) => {
        console.log('Model loaded successfully');
        modelRef.current = fbx;
        
        // Set the model to face toward the camera
        fbx.scale.set(0.01, 0.01, 0.01); // Scale down the model
        fbx.position.set(0, -0.2, 0); // Lower position slightly for better framing
        fbx.rotation.y = Math.PI; // Rotate 180 degrees to face the camera
        
        // Apply materials and prepare for shadows
        fbx.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log('Found mesh:', child.name);
            
            // Apply materials based on mesh name
            if (child.name.includes('Head') || 
                child.name.includes('Face') || 
                child.name.toLowerCase().includes('eye') || 
                child.name.toLowerCase().includes('brow')) {
              child.material = headMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            } else {
              child.material = bodyMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
          
          // Find jaw bone with broader search criteria
          if (child instanceof THREE.Bone) {
            const lowerName = child.name.toLowerCase();
            if (lowerName.includes('jaw') || 
                lowerName.includes('mouth') || 
                lowerName.includes('mandible')) {
              jawBoneRef.current = child;
              console.log('Found jaw bone:', child.name);
            }
          }
        });
        
        // Add model to scene
        scene.add(fbx);
        
        // Load facial animations with high priority
        loadFacialAnimations(fbx, loadingManager);
      },
      (progress) => {
        console.log('Model loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  };
  
  const loadFacialAnimations = (fbx: THREE.Group, loadingManager: THREE.LoadingManager) => {
    console.log('Loading facial animations...');
    const fbxLoader = createFBXLoader(loadingManager);
    
    fbxLoader.load(
      '/Exports/Business_Female_04_facial.fbx',
      (facialFbx) => {
        console.log('Facial animations loaded successfully');
        mixerRef.current = new THREE.AnimationMixer(fbx);
        
        // Get all animations
        const animations = facialFbx.animations;
        console.log('Available animations:', animations.map(a => a.name));
        
        // Play all animations with different weights for variety
        animations.forEach(animation => {
          if (!mixerRef.current) return;
          
          const action = mixerRef.current.clipAction(animation);
          
          // Set appropriate weights based on animation type
          if (animation.name.includes('Talk') || animation.name.includes('Mouth')) {
            action.setEffectiveWeight(0.9);
            action.play();
          } else if (animation.name.includes('Eye') || animation.name.includes('Blink')) {
            action.setEffectiveWeight(0.8);
            action.play();
          } else if (animation.name.includes('Brow')) {
            action.setEffectiveWeight(0.7);
            action.play();
          } else {
            action.setEffectiveWeight(0.5);
            action.play();
          }
        });
        
        // Add randomized blinking
        setInterval(() => {
          const blinkAction = animations.find(anim => 
            anim.name.includes('Blink') || anim.name.includes('Eye'));
            
          if (blinkAction && mixerRef.current) {
            const action = mixerRef.current.clipAction(blinkAction);
            action.setEffectiveWeight(1);
            action.play();
            
            // Reset after blinking
            setTimeout(() => {
              action.setEffectiveWeight(0.2);
            }, 200);
          }
        }, 3000 + Math.random() * 2000); // Random blinking interval
        
        setModelLoaded(true);
      },
      (progress) => {
        console.log('Animation loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
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
