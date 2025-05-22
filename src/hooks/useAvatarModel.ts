
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
    
    // Create a loading manager to track progress
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      console.log(`Loading: ${Math.round(loaded / total * 100)}% (${url})`);
    };
    
    loadModel(sceneObjects, loadingManager);
    
    return () => {
      // Clean up model
      if (modelRef.current && sceneObjects.scene) {
        sceneObjects.scene.remove(modelRef.current);
        modelRef.current = null;
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
        
        // Scale and position the model - face toward camera
        fbx.scale.set(0.01, 0.01, 0.01); // Scale down the model
        fbx.position.set(0, -0.2, 0); // Lower position slightly for better frame
        fbx.rotation.y = 0; // Face the model toward the camera directly
        
        // Apply materials to the model with better texture mapping
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
          
          // Find the jaw bone for animation with improved naming matching
          if (child instanceof THREE.Bone && 
              (child.name.toLowerCase().includes('jaw') || 
               child.name.toLowerCase().includes('mouth'))) {
            jawBoneRef.current = child;
            console.log('Found jaw bone:', child.name);
          }
        });
        
        // Add the model to the scene
        scene.add(fbx);
        console.log('Added model to scene');
        
        // Load facial animations with priority
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
        // Create an animation mixer
        mixerRef.current = new THREE.AnimationMixer(fbx);
        
        // Get all animations from the facial model
        const animations = facialFbx.animations;
        console.log('Available animations:', animations.map(a => a.name));
        
        // Load multiple facial expressions for better animation variety
        animations.forEach(animation => {
          const action = mixerRef.current!.clipAction(animation);
          
          // Set different weights for different animations
          if (animation.name.includes('Talk') || animation.name.includes('Mouth')) {
            action.setEffectiveWeight(0.8);
            action.play();
          } else if (animation.name.includes('Eye') || animation.name.includes('Blink')) {
            action.setEffectiveWeight(0.6);
            action.play();
          } else if (animation.name.includes('Brow')) {
            action.setEffectiveWeight(0.4);
            action.play();
          } else {
            action.setEffectiveWeight(0.3);
            action.play();
          }
        });
        
        // Add blink animation cycle
        setInterval(() => {
          const blinkAction = animations.find(anim => anim.name.includes('Blink'));
          if (blinkAction && mixerRef.current) {
            const action = mixerRef.current.clipAction(blinkAction);
            action.setEffectiveWeight(1);
            action.play();
            setTimeout(() => {
              action.setEffectiveWeight(0);
            }, 200);
          }
        }, 4000 + Math.random() * 3000);
        
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
