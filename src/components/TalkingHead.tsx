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
    scene.current.background = new THREE.Color(0xf0f8ff); // Lighter blue background
    
    // Create camera
    camera.current = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 2000
    );
    camera.current.position.set(0, 0, 10);
    
    // Create renderer
    renderer.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setPixelRatio(window.devicePixelRatio);
    renderer.current.shadowMap.enabled = true;
    renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRef.current?.appendChild(renderer.current.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.current.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.current.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1, 0.5, 0.5);
    scene.current.add(fillLight);
  };
  
  const createHead = () => {
    if (!scene.current) return;
    
    // Create head group
    head.current = new THREE.Group();
    scene.current.add(head.current);
    
    // More realistic skin color
    const skinColor = 0xffe0bd; // Light skin tone
    const lipColor = 0xdb7093; // Pinkish lips
    const eyeColor = 0x532b1d; // Dark brown eyes
    
    // Create head base - use more complex geometry
    const headGeometry = new THREE.SphereGeometry(2.2, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: skinColor,
      specular: 0x555555,
      shininess: 30,
      roughness: 0.7,
      metalness: 0.1
    });
    
    // Modify the head geometry to make it more oval
    for (let i = 0; i < headGeometry.attributes.position.count; i++) {
      const x = headGeometry.attributes.position.getX(i);
      const y = headGeometry.attributes.position.getY(i);
      const z = headGeometry.attributes.position.getZ(i);
      
      // Make the head taller and slightly narrower
      headGeometry.attributes.position.setY(i, y * 1.2);
      headGeometry.attributes.position.setX(i, x * 0.95);
      
      // Make the back of the head a bit flatter
      if (z < -0.5) {
        headGeometry.attributes.position.setZ(i, z * 0.9);
      }
    }
    
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    head.current.add(headMesh);
    
    // Add hair
    const hairGeometry = new THREE.SphereGeometry(2.25, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hairMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1a1a1a, // Black hair
      roughness: 0.6,
      metalness: 0.2
    });
    
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.5, 0);
    hair.rotation.x = Math.PI * 0.05;
    head.current.add(hair);
    
    // Create more detailed eyes
    const eyeGeometry = new THREE.SphereGeometry(0.28, 24, 24);
    const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const eyeballMaterial = new THREE.MeshPhongMaterial({ color: eyeColor });
    
    // Left eye
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.85, 0.3, 1.8);
    head.current.add(leftEyeGroup);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeGroup.add(leftEye);
    
    // Left iris and pupil
    const leftIris = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      eyeballMaterial
    );
    leftIris.position.set(0, 0, 0.15);
    leftEyeGroup.add(leftIris);
    
    // Left pupil
    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    leftPupil.position.set(0, 0, 0.25);
    leftEyeGroup.add(leftPupil);
    
    // Left eyelid
    leftEyeLid.current = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 24, 24, 0, Math.PI * 2, 0, Math.PI/2),
      headMaterial
    );
    leftEyeLid.current.position.set(-0.85, 0.3, 1.8);
    leftEyeLid.current.rotation.x = Math.PI;
    leftEyeLid.current.visible = false;
    head.current.add(leftEyeLid.current);
    
    // Right eye - repeat the same process
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.85, 0.3, 1.8);
    head.current.add(rightEyeGroup);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeGroup.add(rightEye);
    
    // Right iris and pupil
    const rightIris = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      eyeballMaterial
    );
    rightIris.position.set(0, 0, 0.15);
    rightEyeGroup.add(rightIris);
    
    // Right pupil
    const rightPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    rightPupil.position.set(0, 0, 0.25);
    rightEyeGroup.add(rightPupil);
    
    // Right eyelid
    rightEyeLid.current = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 24, 24, 0, Math.PI * 2, 0, Math.PI/2),
      headMaterial
    );
    rightEyeLid.current.position.set(0.85, 0.3, 1.8);
    rightEyeLid.current.rotation.x = Math.PI;
    rightEyeLid.current.visible = false;
    head.current.add(rightEyeLid.current);
    
    // Create eyebrows
    const browGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const browMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    
    const leftBrow = new THREE.Mesh(browGeometry, browMaterial);
    leftBrow.position.set(-0.85, 0.65, 1.9);
    leftBrow.rotation.z = Math.PI * 0.03;
    head.current.add(leftBrow);
    
    const rightBrow = new THREE.Mesh(browGeometry, browMaterial);
    rightBrow.position.set(0.85, 0.65, 1.9);
    rightBrow.rotation.z = -Math.PI * 0.03;
    head.current.add(rightBrow);
    
    // Add glasses
    const glassesGroup = new THREE.Group();
    head.current.add(glassesGroup);
    
    // Frame material
    const frameMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x222222,
      specular: 0x555555,
      shininess: 30
    });
    
    // Lens material
    const lensMaterial = new THREE.MeshPhongMaterial({
      color: 0xddddff,
      transparent: true,
      opacity: 0.2,
      specular: 0xffffff,
      shininess: 100
    });
    
    // Left lens
    const leftLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32),
      lensMaterial
    );
    leftLens.rotation.x = Math.PI / 2;
    leftLens.position.set(-0.85, 0.3, 2);
    glassesGroup.add(leftLens);
    
    // Right lens
    const rightLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32),
      lensMaterial
    );
    rightLens.rotation.x = Math.PI / 2;
    rightLens.position.set(0.85, 0.3, 2);
    glassesGroup.add(rightLens);
    
    // Left frame
    const leftFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.04, 16, 32),
      frameMaterial
    );
    leftFrame.position.set(-0.85, 0.3, 2);
    leftFrame.rotation.y = Math.PI / 2;
    glassesGroup.add(leftFrame);
    
    // Right frame
    const rightFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.04, 16, 32),
      frameMaterial
    );
    rightFrame.position.set(0.85, 0.3, 2);
    rightFrame.rotation.y = Math.PI / 2;
    glassesGroup.add(rightFrame);
    
    // Bridge
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.05, 0.05),
      frameMaterial
    );
    bridge.position.set(0, 0.3, 2);
    glassesGroup.add(bridge);
    
    // Create a more realistic nose
    const noseGroup = new THREE.Group();
    head.current.add(noseGroup);
    
    const noseGeometry = new THREE.ConeGeometry(0.25, 0.7, 32);
    const noseMaterial = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(skinColor).offsetHSL(0, 0.05, -0.05), // Slightly darker than skin
    });
    
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, -0.3, 1.9);
    nose.rotation.x = -Math.PI / 2.5;
    nose.scale.setZ(0.7); // Flatten the nose a bit
    noseGroup.add(nose);
    
    // Create nostrils
    const nostrilGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const nostrilMaterial = new THREE.MeshBasicMaterial({ color: 0x301a0a });
    
    const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
    leftNostril.position.set(-0.15, -0.5, 2.1);
    leftNostril.scale.setY(0.5);
    noseGroup.add(leftNostril);
    
    const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
    rightNostril.position.set(0.15, -0.5, 2.1);
    rightNostril.scale.setY(0.5);
    noseGroup.add(rightNostril);
    
    // Create mouth
    const lipGeometry = new THREE.TorusGeometry(0.6, 0.1, 16, 32, Math.PI);
    const lipMaterial = new THREE.MeshPhongMaterial({ color: lipColor });
    
    const upperLip = new THREE.Mesh(lipGeometry, lipMaterial);
    upperLip.rotation.x = -Math.PI / 2;
    upperLip.position.set(0, -1, 1.9);
    head.current.add(upperLip);
    
    // Create lower lip and jaw (for mouth animation)
    jaw.current = new THREE.Group();
    jaw.current.position.set(0, -1.2, 1.5);
    head.current.add(jaw.current);
    
    const lowerLip = new THREE.Mesh(lipGeometry, lipMaterial);
    lowerLip.rotation.x = Math.PI / 2;
    lowerLip.position.set(0, 0, 0.4);
    jaw.current.add(lowerLip);
    
    // Create teeth
    const teethGeometry = new THREE.BoxGeometry(1, 0.15, 0.2);
    const teethMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const upperTeeth = new THREE.Mesh(teethGeometry, teethMaterial);
    upperTeeth.position.set(0, -1.1, 1.9);
    head.current.add(upperTeeth);
    
    const lowerTeeth = new THREE.Mesh(teethGeometry, teethMaterial);
    lowerTeeth.position.set(0, 0, 0.4);
    jaw.current.add(lowerTeeth);
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
      jaw.current.position.y = -1.2 - currentMouthOpenness.current * 0.5;
      jaw.current.rotation.x = currentMouthOpenness.current * 0.5;
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
