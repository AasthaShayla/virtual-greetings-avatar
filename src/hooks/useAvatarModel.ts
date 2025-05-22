
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadTextures } from '@/utils/threeUtils';
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
    console.log('Loading 3D model (GLTF)...');
    const { scene } = sceneObjects;
    const gltfLoader = new GLTFLoader(loadingManager);
    const { headMaterial, bodyMaterial } = loadTextures();
    
    // Load the GLTF model (from Blender file)
    gltfLoader.load(
      '/Sketchfab_2022_02_06_11_22_28.blend',
      (gltf) => {
        console.log('Model loaded successfully');
        const model = gltf.scene;
        modelRef.current = model;
        
        // Set the model to face toward the camera
        model.scale.set(0.5, 0.5, 0.5); // Scale appropriately
        model.position.set(0, -1, 0); // Position for better framing
        model.rotation.y = 0; // Face the camera
        
        // Apply materials and prepare for shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log('Found mesh:', child.name);
            
            // Apply default materials
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Apply materials based on mesh name if you want to customize
            if (child.name.toLowerCase().includes('head') || 
                child.name.toLowerCase().includes('face') || 
                child.name.toLowerCase().includes('eye') || 
                child.name.toLowerCase().includes('brow')) {
              // Apply head material if needed
            }
          }
          
          // Find jaw bone or mouth bones
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
          
          // Play all animations
          gltf.animations.forEach((animation, index) => {
            console.log(`Animation ${index}: ${animation.name}`);
            if (mixerRef.current) {
              const action = mixerRef.current.clipAction(animation);
              action.play();
            }
          });
        }
        
        setModelLoaded(true);
      },
      (progress) => {
        console.log('Model loading:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        // Try loading as FBX as fallback
        tryLoadingAsBlend(scene, loadingManager);
      }
    );
  };
  
  const tryLoadingAsBlend = (scene: THREE.Scene, loadingManager: THREE.LoadingManager) => {
    console.log('Trying to load as direct Blend file...');
    // For blend files, we may need a Blender exporter or converter
    // This is a placeholder as direct .blend loading is not supported in Three.js
    console.error("Direct .blend loading not supported. Please export to glTF or FBX format.");
  };

  return {
    modelRef,
    mixerRef,
    jawBoneRef,
    modelLoaded
  };
};
