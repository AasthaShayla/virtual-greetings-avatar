
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

// Initialize the 3D scene with performance optimizations
export const initScene = (container: HTMLDivElement) => {
  // Create scene with optimized settings
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f8ff); // Light blue background
  
  // Create optimized camera
  const camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  camera.position.set(0, 1.5, 2.2); // Position camera for better framing of office worker
  
  // Create optimized renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  
  // Add lights with optimized settings for better face illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  // Main directional light (sun-like)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(1, 1, 1);
  directionalLight.castShadow = true;
  // Optimize shadow settings
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 10;
  scene.add(directionalLight);
  
  // Add a strong front light to illuminate the face for better visibility
  const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
  frontLight.position.set(0, 0, 2);
  scene.add(frontLight);
  
  // Add fill light from the other side to reduce harsh shadows
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-1, 0.5, 1);
  scene.add(fillLight);

  return { scene, camera, renderer };
};

// Pre-load textures for model with better error handling
export const loadTextures = () => {
  console.log('Loading textures...');
  const textureLoader = new THREE.TextureLoader();
  const tgaLoader = new TGALoader();
  
  // Set texture loading priority
  tgaLoader.manager = new THREE.LoadingManager();
  tgaLoader.manager.onProgress = (url, loaded, total) => {
    console.log(`Texture loading: ${Math.floor(loaded / total * 100)}% (${url})`);
  };
  tgaLoader.manager.onError = (url) => {
    console.error('Error loading texture:', url);
  };
  
  // Create optimized materials with default textures
  const headMaterial = new THREE.MeshPhongMaterial({
    color: 0xffdbac, // Default skin tone if textures not available
    shininess: 30,
  });
  
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xadd8e6, // Default clothing color if textures not available
    shininess: 20,
  });

  console.log('Default materials created');
  return { headMaterial, bodyMaterial };
};

// Create an FBXLoader instance with optional loading manager
export const createFBXLoader = (loadingManager?: THREE.LoadingManager) => {
  return loadingManager ? new FBXLoader(loadingManager) : new FBXLoader();
};

// Create a GLTFLoader instance with optional loading manager
export const createGLTFLoader = (loadingManager?: THREE.LoadingManager) => {
  return loadingManager ? new GLTFLoader(loadingManager) : new GLTFLoader();
};

export type ThreeSceneObjects = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};
