
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadTextures, createGLTFLoader } from '@/utils/threeUtils';
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
    console.log('Loading 3D model (GLB)...');
    const { scene } = sceneObjects;
    const gltfLoader = createGLTFLoader(loadingManager);
    const { headMaterial, bodyMaterial } = loadTextures();
    
    // Load the GLB model
    gltfLoader.load(
      '/office_worker_1_animated.glb',
      (gltf) => {
        console.log('Model loaded successfully', gltf);
        const model = gltf.scene;
        modelRef.current = model;
        
        // Set the model to face toward the camera
        model.scale.set(1, 1, 1); // Default scale
        model.position.set(0, -0.8, 0); // Position for better framing
        model.rotation.y = Math.PI; // Face the camera
        
        // Apply materials and prepare for shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log('Found mesh:', child.name);
            
            // Apply shadows
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Log materials for debugging
            if (child.material) {
              console.log('Material:', child.material);
            }
          }
          
          // Find jaw bone or mouth bones for lip sync
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
        scene.add(model);
        
        // Set up animation mixer if the model has animations
        if (gltf.animations && gltf.animations.length > 0) {
          console.log('Found animations:', gltf.animations.length);
          mixerRef.current = new THREE.AnimationMixer(model);
          
          // Log all animations for debugging
          gltf.animations.forEach((animation, index) => {
            console.log(`Animation ${index}: ${animation.name}`);
          });

          // Find and play idle animation by default
          const idleAnimation = gltf.animations.find(
            anim => anim.name.toLowerCase().includes('idle') || 
                   anim.name.toLowerCase().includes('breathing')
          );
          
          if (idleAnimation && mixerRef.current) {
            const action = mixerRef.current.clipAction(idleAnimation);
            action.play();
            console.log('Playing idle animation:', idleAnimation.name);
          } else if (mixerRef.current) {
            // If no idle animation is found, play the first animation
            const action = mixerRef.current.clipAction(gltf.animations[0]);
            action.play();
            console.log('Playing default animation:', gltf.animations[0].name);
          }
        }
        
        // Search for morph targets/blend shapes for lip sync
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
            console.log('Found morph targets:', child.morphTargetDictionary);
            // Look for mouth/lip related morph targets
            Object.keys(child.morphTargetDictionary).forEach(key => {
              if (key.toLowerCase().includes('mouth') || 
                  key.toLowerCase().includes('lip') || 
                  key.toLowerCase().includes('jaw')) {
                console.log('Found mouth morph target:', key);
              }
            });
          }
        });
        
        setModelLoaded(true);
      },
      (progress) => {
        console.log('Model loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading GLB model:', error);
        // Try loading the blend file as fallback
        tryLoadingBlendFile(scene, loadingManager);
      }
    );
  };
  
  const tryLoadingBlendFile = (scene: THREE.Scene, loadingManager: THREE.LoadingManager) => {
    console.log('Trying to load Sketchfab_2022_02_06_11_22_28.blend as fallback...');
    // For blend files, try using GLTFLoader as a fallback
    const gltfLoader = createGLTFLoader(loadingManager);
    
    gltfLoader.load(
      '/Sketchfab_2022_02_06_11_22_28.blend',
      (gltf) => {
        console.log('Fallback model loaded successfully');
        const model = gltf.scene;
        modelRef.current = model;
        
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, -1, 0);
        model.rotation.y = 0;
        
        scene.add(model);
        setModelLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Error loading fallback model:', error);
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
