
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

// Initialize the 3D scene
export const initScene = (container: HTMLDivElement) => {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f8ff); // Light blue background
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight, 0.1, 2000
  );
  camera.position.set(0, 1.7, 2); // Position camera at eye level
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-1, 0.5, 0.5);
  scene.add(fillLight);
  
  // Add a rim light for better definition
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
  rimLight.position.set(0, 0, -1);
  scene.add(rimLight);

  return { scene, camera, renderer };
};

// Load textures for model
export const loadTextures = () => {
  // Use TGALoader for TGA textures
  const textureLoader = new THREE.TextureLoader();
  const tgaLoader = new TGALoader();
  
  // Load head texture with TGALoader
  const headColorTexture = tgaLoader.load('/Textures/f020_head_color.tga');
  const headNormalTexture = tgaLoader.load('/Textures/f020_head_normal.tga');
  const headSpecularTexture = tgaLoader.load('/Textures/f020_head_specular.tga');
  
  // Load body texture with TGALoader
  const bodyColorTexture = tgaLoader.load('/Textures/f020_body_color.tga');
  const bodyNormalTexture = tgaLoader.load('/Textures/f020_body_normal.tga');
  const bodySpecularTexture = tgaLoader.load('/Textures/f020_body_specular.tga');
  
  // Load opacity texture with TGALoader
  const opacityTexture = tgaLoader.load('/Textures/f020_opacity_color.tga');

  // Create materials with proper textures
  const headMaterial = new THREE.MeshPhongMaterial({
    map: headColorTexture,
    normalMap: headNormalTexture,
    specularMap: headSpecularTexture,
    shininess: 30
  });
  
  const bodyMaterial = new THREE.MeshPhongMaterial({
    map: bodyColorTexture,
    normalMap: bodyNormalTexture,
    specularMap: bodySpecularTexture,
    shininess: 20
  });

  return { headMaterial, bodyMaterial };
};

// Create an FBX loader instance
export const createFBXLoader = () => {
  return new FBXLoader();
};

export type ThreeSceneObjects = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};
