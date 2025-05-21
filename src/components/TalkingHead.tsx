
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { useSpeech } from '@/contexts/SpeechContext';

const TalkingHead: React.FC = () => {
  const { mouthOpenness } = useSpeech();
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  
  // Animation properties
  const animationFrameId = useRef<number>(0);
  const currentMouthOpenness = useRef<number>(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize the 3D scene
    initScene();
    
    // Load the 3D model
    loadModel();
    
    // Start the animation loop
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (rendererRef.current && rendererRef.current.domElement && canvasRef.current) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    // Update jaw position based on speech volume
    currentMouthOpenness.current = mouthOpenness;
  }, [mouthOpenness]);
  
  const initScene = () => {
    // Create scene
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0xf0f8ff); // Light blue background
    
    // Create camera
    cameraRef.current = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 2000
    );
    cameraRef.current.position.set(0, 1.7, 2); // Position camera at eye level
    
    // Create renderer
    rendererRef.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRef.current?.appendChild(rendererRef.current.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    sceneRef.current.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-1, 0.5, 0.5);
    sceneRef.current.add(fillLight);
    
    // Add a rim light for better definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 0, -1);
    sceneRef.current.add(rimLight);
  };
  
  const loadModel = () => {
    if (!sceneRef.current) return;
    
    const textureLoader = new THREE.TextureLoader();
    const fbxLoader = new FBXLoader();
    
    // Load head texture
    const headColorTexture = textureLoader.load('/Textures/f020_head_color.tga');
    const headNormalTexture = textureLoader.load('/Textures/f020_head_normal.tga');
    const headSpecularTexture = textureLoader.load('/Textures/f020_head_specular.tga');
    
    // Load body texture
    const bodyColorTexture = textureLoader.load('/Textures/f020_body_color.tga');
    const bodySpecularTexture = textureLoader.load('/Textures/f020_body_specular.tga');
    
    // Load opacity texture
    const opacityTexture = textureLoader.load('/Textures/f020_opacity_color.tga');
    
    // Create materials
    const headMaterial = new THREE.MeshPhongMaterial({
      map: headColorTexture,
      normalMap: headNormalTexture,
      specularMap: headSpecularTexture,
      shininess: 30
    });
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      map: bodyColorTexture,
      specularMap: bodySpecularTexture,
      shininess: 20
    });
    
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
        sceneRef.current?.add(fbx);
        
        // Load facial animations
        fbxLoader.load(
          '/Exports/Business_Female_04_facial.fbx',
          (facialFbx) => {
            // Create an animation mixer
            mixerRef.current = new THREE.AnimationMixer(modelRef.current!);
            
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
      },
      (progress) => {
        console.log('Model loading:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  };
  
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
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(animate);
  };

  return <div ref={canvasRef} className="canvas-container h-full w-full" />;
};

export default TalkingHead;
