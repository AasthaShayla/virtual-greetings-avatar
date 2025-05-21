
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSpeech } from '@/contexts/SpeechContext';

const TalkingHead: React.FC = () => {
  const { mouthOpenness } = useSpeech();
  const canvasRef = useRef<HTMLDivElement>(null);
  const scene = useRef<THREE.Scene | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const head = useRef<THREE.Group | null>(null);
  const jaw = useRef<THREE.Mesh | null>(null);
  const leftEyeLid = useRef<THREE.Mesh | null>(null);
  const rightEyeLid = useRef<THREE.Mesh | null>(null);
  
  // Animation properties
  const animationFrameId = useRef<number>(0);
  const currentMouthOpenness = useRef<number>(0);
  const blinkTime = useRef<number>(0);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize the 3D scene
    initScene();
    
    // Create the head model
    createHead();
    
    // Start the animation loop
    animate();
    
    // Set up blinking
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.2) blink();
    }, 5000);
    
    // Handle window resize
    const handleResize = () => {
      if (!camera.current || !renderer.current) return;
      camera.current.aspect = window.innerWidth / window.innerHeight;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(blinkInterval);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (renderer.current && renderer.current.domElement && canvasRef.current) {
        canvasRef.current.removeChild(renderer.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    // Update jaw position based on speech volume
    currentMouthOpenness.current = mouthOpenness;
  }, [mouthOpenness]);
  
  const initScene = () => {
    // Create scene
    scene.current = new THREE.Scene();
    scene.current.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    camera.current = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 2000
    );
    camera.current.position.set(0, 0, 10);
    
    // Create renderer
    renderer.current = new THREE.WebGLRenderer({ antialias: true });
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setPixelRatio(window.devicePixelRatio);
    canvasRef.current?.appendChild(renderer.current.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.current.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.current.add(directionalLight);
  };
  
  const createHead = () => {
    if (!scene.current) return;
    
    // Create head group
    head.current = new THREE.Group();
    scene.current.add(head.current);
    
    // Create head base
    const headGeometry = new THREE.SphereGeometry(2, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac,
      roughness: 0.7, 
      metalness: 0.1 
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    head.current.add(headMesh);
    
    // Create eyes
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeballMaterial = new THREE.MeshStandardMaterial({ color: 0x1a75ff });
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.8, 0.2, 1.8);
    head.current.add(leftEye);
    
    // Left eyeball
    const leftEyeball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16), 
      eyeballMaterial
    );
    leftEyeball.position.set(0, 0, 0.15);
    leftEye.add(leftEyeball);
    
    // Left eyelid
    leftEyeLid.current = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 16, 16, 0, Math.PI * 2, 0, Math.PI/2), 
      headMaterial
    );
    leftEyeLid.current.position.set(-0.8, 0.2, 1.8);
    leftEyeLid.current.rotation.x = Math.PI;
    leftEyeLid.current.visible = false;
    head.current.add(leftEyeLid.current);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.8, 0.2, 1.8);
    head.current.add(rightEye);
    
    // Right eyeball
    const rightEyeball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16), 
      eyeballMaterial
    );
    rightEyeball.position.set(0, 0, 0.15);
    rightEye.add(rightEyeball);
    
    // Right eyelid
    rightEyeLid.current = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 16, 16, 0, Math.PI * 2, 0, Math.PI/2), 
      headMaterial
    );
    rightEyeLid.current.position.set(0.8, 0.2, 1.8);
    rightEyeLid.current.rotation.x = Math.PI;
    rightEyeLid.current.visible = false;
    head.current.add(rightEyeLid.current);
    
    // Create nose
    const noseGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, -0.3, 1.9);
    nose.rotation.x = -Math.PI / 2;
    head.current.add(nose);
    
    // Create mouth
    const mouthGeometry = new THREE.BoxGeometry(1.2, 0.2, 0.4);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -1, 1.5);
    head.current.add(mouth);
    
    // Create jaw (for mouth animation)
    const jawGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.4);
    const jawMaterial = new THREE.MeshStandardMaterial({ color: 0xff9999 });
    jaw.current = new THREE.Mesh(jawGeometry, jawMaterial);
    jaw.current.position.set(0, -1.2, 1.5);
    jaw.current.visible = true;
    head.current.add(jaw.current);
  };
  
  const blink = () => {
    if (!leftEyeLid.current || !rightEyeLid.current) return;
    
    // Show eyelids
    leftEyeLid.current.visible = true;
    rightEyeLid.current.visible = true;
    
    // Hide eyelids after 150ms
    setTimeout(() => {
      if (leftEyeLid.current && rightEyeLid.current) {
        leftEyeLid.current.visible = false;
        rightEyeLid.current.visible = false;
      }
    }, 150);
  };
  
  const animate = () => {
    // Update mouth animation based on speech
    if (jaw.current) {
      // Move jaw based on speech volume
      jaw.current.position.y = -1.2 - currentMouthOpenness.current * 0.3;
    }
    
    // Make head move slightly for more natural look
    if (head.current) {
      const time = Date.now() * 0.0005;
      head.current.rotation.y = Math.sin(time) * 0.1;
      head.current.rotation.x = Math.sin(time * 1.3) * 0.05;
    }
    
    // Render the scene
    if (scene.current && camera.current && renderer.current) {
      renderer.current.render(scene.current, camera.current);
    }
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(animate);
  };

  return <div ref={canvasRef} className="canvas-container" />;
};

export default TalkingHead;
