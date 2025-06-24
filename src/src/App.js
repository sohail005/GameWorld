import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import Hud from './Components/Hud';
import MessageDisplay from './Components/MessageDisplay';
import ControlsInfo from './Components/ControlsInfo';
import { createFinishLineTexture } from './Helper/helpers';
import { styles } from './Styles/styles';


export default function App() {
  const mountRef = useRef(null);
  const game = useRef({
    scene: null,
    camera: null,
    renderer: null,
    playerCar: null,
    gameActive: false,
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, PageUp: false, PageDown: false },
    carSpeed: 0,
    carDirection: 0,
    passedFinishLine: false,
    playerCarSize: null
  });

  const [speed, setSpeed] = useState(0);
  const [lap, setLap] = useState(0);
  const [message, setMessage] = useState('');

  const totalLaps = 3;


  // Modified loadParkedCar function:
  // 1. First, modify loadParkedCar to ensure better debugging
  function loadParkedCar(url, scale, position, rotationY, color) {
    const g = game.current;
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Apply transformations
        model.scale.set(scale, scale, scale);
        model.position.set(position[0], position[1], position[2]);
        model.rotation.y = rotationY;

        // Apply color to all materials (more reliable method)
        model.traverse((child) => {
          if (child.isMesh) {
            // Clone material to avoid affecting other instances
            child.material = child.material.clone();
            // child.material.color.setHex(color);
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add bounding box helper for debugging
        const bbox = new THREE.Box3().setFromObject(model);
        const helper = new THREE.Box3Helper(bbox, 0xffff00);
        g.scene.add(helper);
        setTimeout(() => g.scene.remove(helper), 2000); // Remove after 2 sec

        g.scene.add(model);
        console.log(`Car loaded at ${position} with scale ${scale}`);
      },
      undefined,
      (err) => console.error('Failed to load car:', err)
    );
  }


  useEffect(() => {
    // --- SCENE SETUP ---
    const currentMount = mountRef.current;
    const g = game.current;
    const trackShape = new THREE.Shape();
    const outerRadius = 80;
    const innerRadius = 60;
    g.scene = new THREE.Scene();
    g.scene.background = new THREE.Color(0x87CEEB);
    g.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
    // Add models around the track (place this after track creation)

    const placeParkedCars = () => {
      const trackRadius = (outerRadius + innerRadius) / 2;
      const parkingSpots = 6;

      // Array of different model paths and their scale factors
      const parkedModels = [
        { path: '/Skyscraper.glb', scale: 20 },
        { path: '/tower.glb', scale: 4 },
        { path: '/Small_Building.glb', scale: 30 },
        { path: '/botbot.glb', scale: 250 },
        { path: '/tower.glb', scale: 5 },
        { path: '/Rover.glb', scale: 5 }
      ];

      for (let i = 0; i < parkingSpots; i++) {
        const angle = (Math.PI * 2 * i) / parkingSpots;
        const distanceFromTrack = 35;

        // Calculate position
        const x = Math.cos(angle) * (trackRadius + distanceFromTrack);
        const z = Math.sin(angle) * (trackRadius + distanceFromTrack);

        // Face models perpendicular to track radius
        const rotation = angle + Math.PI / 2;

        // Pick model and scale for this spot
        const { path, scale } = parkedModels[i % parkedModels.length];

        loadParkedCar(
          path,
          scale,
          [x, 0.2, z],
          rotation,
        );
      }
    };
    // 3. Call this after your track is created, but before animation starts
    placeParkedCars();

    // Renderer
    g.renderer = new THREE.WebGLRenderer({ antialias: true });
    g.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    g.renderer.shadowMap.enabled = true;
    currentMount.appendChild(g.renderer.domElement);

    // Camera
    g.camera = new THREE.PerspectiveCamera(100, currentMount.clientWidth / currentMount.clientHeight, 0.2, 1000);
    g.camera.position.set(0, 5, 10);
    g.camera.lookAt(g.scene.position);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    g.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    g.scene.add(dirLight);

    const controls = new OrbitControls(g.camera, g.renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // --- WORLD CREATION ---
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 'green' });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    g.scene.add(ground);

    // Ground level constant for collision detection
    const GROUND_LEVEL = 0.2;

    // Racetrack

    trackShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const innerPath = new THREE.Path();
    innerPath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    trackShape.holes.push(innerPath);
    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, { depth: 0.1, bevelEnabled: false });
    const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.y = 0.1;
    track.receiveShadow = true;
    g.scene.add(track);

    // Finish Line
    const finishLineGeometry = new THREE.PlaneGeometry(20, 5);
    const finishLineMaterial = new THREE.MeshLambertMaterial({ map: createFinishLineTexture() });
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.position.set(0, 0.15, -innerRadius);
    finishLine.rotation.x = -Math.PI / 2;
    g.scene.add(finishLine);

    // Player Car
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/CAR_Model.glb',
      (gltf) => {
        const model = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const scaleFactor = 0.02;
        model.scale.setScalar(scaleFactor);
        bbox.setFromObject(model);
        bbox.getCenter(model.position).multiplyScalar(-1);
        model.position.set(10, 0.2, 0.5);
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        g.playerCar = model;
        g.scene.add(model);
      },
      undefined,
      (err) => console.error('Failed to load car model', err)
    );

    // --- GAME LOGIC ---
    const maxSpeed = 2;
    const acceleration = 0.01;
    const deceleration = 0.02;
    const friction = 0.01;
    const turnSpeed = 0.03;
    let localLap = 0;

    const updateCar = () => {
      if (!g.gameActive || !g.playerCar) return;
      if (g.keys.ArrowUp) g.carSpeed += acceleration;
      else if (g.keys.ArrowDown) g.carSpeed -= deceleration;
      else g.carSpeed *= (1 - friction);
      g.carSpeed = Math.max(-maxSpeed / 2, Math.min(maxSpeed, g.carSpeed));
      if (Math.abs(g.carSpeed) < 0.01) g.carSpeed = 0;

      if (g.carSpeed !== 0) {
        const direction = g.carSpeed > 0 ? 1 : -1;
        if (g.keys.ArrowLeft) g.carDirection += turnSpeed * direction;
        if (g.keys.ArrowRight) g.carDirection -= turnSpeed * direction;
      }

      // Vertical movement with ground collision
      if (g.keys.PageUp) {
        g.playerCar.position.y += 0.3;
      }
      if (g.keys.PageDown) {
        g.playerCar.position.y -= 0.3;
        // Prevent going below ground level
        if (g.playerCar.position.y < GROUND_LEVEL) {
          g.playerCar.position.y = GROUND_LEVEL;
        }
      }

      g.playerCar.rotation.y = g.carDirection;
      g.playerCar.position.x += Math.sin(g.carDirection) * g.carSpeed;
      g.playerCar.position.z += Math.cos(g.carDirection) * g.carSpeed;
    };

    const updateCamera = () => {
      if (!g.playerCar) return;
      const size = g.playerCarSize || new THREE.Vector3(0, 4, 5);
      const distanceBehind = size.z * 1.2;
      const heightAbove = size.y * 3;
      const offset = new THREE.Vector3(0, heightAbove, -distanceBehind);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), g.playerCar.rotation.y);
      const cameraPosition = g.playerCar.position.clone().add(offset);
      const lerpFactor = g.carSpeed > 5 ? 0.5 : 0.1;
      g.camera.position.lerp(cameraPosition, lerpFactor);
      const currentTarget = new THREE.Vector3();
      g.camera.getWorldDirection(currentTarget);
      const target = g.playerCar.position.clone();
      target.y += size.y * 1.2;
      const smoothedTarget = currentTarget.lerp(target.sub(g.camera.position), 0.2);
      g.camera.lookAt(g.camera.position.clone().add(smoothedTarget));
    };

    const checkLaps = () => {
      if (!g.gameActive || !g.playerCar) return;
      const carZ = g.playerCar.position.z;
      const carX = Math.abs(g.playerCar.position.x);
      if (carZ < -innerRadius && carZ > -outerRadius && carX < (outerRadius - innerRadius) / 2) {
        if (!g.passedFinishLine) g.passedFinishLine = true;
      }
      if (carZ > -innerRadius && g.passedFinishLine) {
        localLap++;
        setLap(localLap);
        g.passedFinishLine = false;
        if (localLap >= totalLaps) {
          g.gameActive = false;
          g.carSpeed = 0;
          setMessage('FINISH!');
        }
      }
    };

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      updateCar(delta);
      updateCamera();
      checkLaps();
      setSpeed(Math.abs(g.carSpeed * 100).toFixed(0));
      g.renderer.render(g.scene, g.camera);
      requestAnimationFrame(animate);
    };

    // --- EVENT HANDLERS ---
    const handleKeyDown = (e) => { if (g.keys[e.key] !== undefined) g.keys[e.key] = true; };
    const handleKeyUp = (e) => { if (g.keys[e.key] !== undefined) g.keys[e.key] = false; };
    const handleKeyFly = (e) => { if (g.keys[e.key] !== undefined) g.keys[e.key] = false; };
    const handleKeyFlyDown = (e) => { if (g.keys[e.key] !== undefined) g.keys[e.key] = false; };
    const handleResize = () => {
      g.camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      g.camera.updateProjectionMatrix();
      g.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    // --- START GAME ---
    let count = 3;
    setMessage(count);
    const countdown = setInterval(() => {
      count--;
      if (count > 0) setMessage(count);
      else if (count === 0) {
        setMessage('GO!');
        g.gameActive = true;
      } else {
        setMessage('');
        clearInterval(countdown);
      }
    }, 500);
    animate();

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('KeyFly', handleKeyFly);
      window.removeEventListener('KeyFlyDown', handleKeyFlyDown);
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(g.renderer.domElement);
    };
  }, []);

  const simulateKey = (key, isDown) => {
    const g = game.current;
    if (g.keys[key] !== undefined) {
      g.keys[key] = isDown;
    }
  };

  return (
    <div ref={mountRef} style={styles.gameContainer}>
      <Hud speed={speed} lap={lap} totalLaps={totalLaps} />
      <MessageDisplay message={message} />
      <ControlsInfo />
      <div style={styles.leftControls}>
        <button
          style={styles.controlBtn}
          onTouchStart={() => simulateKey('ArrowLeft', true)}
          onTouchEnd={() => simulateKey('ArrowLeft', false)}
          onMouseDown={() => simulateKey('ArrowLeft', true)}
          onMouseUp={() => simulateKey('ArrowLeft', false)}
        >
          ◀
        </button>
        <button
          style={styles.controlBtn}
          onTouchStart={() => simulateKey('ArrowRight', true)}
          onTouchEnd={() => simulateKey('ArrowRight', false)}
          onMouseDown={() => simulateKey('ArrowRight', true)}
          onMouseUp={() => simulateKey('ArrowRight', false)}
        >
          ▶
        </button>
      </div>
      <div style={styles.rightControls}>
        <button
          style={styles.controlBtn}
          onTouchStart={() => simulateKey('ArrowUp', true)}
          onTouchEnd={() => simulateKey('ArrowUp', false)}
          onMouseDown={() => simulateKey('ArrowUp', true)}
          onMouseUp={() => simulateKey('ArrowUp', false)}
        >
          <img src="arrow.png" alt="Accelerate" style={{ width: 40, height: 40 }} />
        </button>
        <button
          style={styles.controlBtn}
          onTouchStart={() => simulateKey('ArrowDown', true)}
          onTouchEnd={() => simulateKey('ArrowDown', false)}
          onMouseDown={() => simulateKey('ArrowDown', true)}
          onMouseUp={() => simulateKey('ArrowDown', false)}
        >
          <img src="brake.png" alt="Brake" style={{ width: 40, height: 40 }} />
        </button>
      </div>
      <div style={styles.FlyControls}>
        <button
          style={styles.controlBtn}
          onTouchStart={() => simulateKey('PageUp', true)}
          onTouchEnd={() => simulateKey('PageUp', false)}
          onMouseDown={() => simulateKey('PageUp', true)}
          onMouseUp={() => simulateKey('PageUp', false)}
        >
          <img src="rocket.png" alt="Accelerate" style={{ width: 40, height: 40 }} />
        </button>
        <button
          style={styles.controlBtn}
          onTouchStart={() => simulateKey('PageDown', true)}
          onTouchEnd={() => simulateKey('PageDown', false)}
          onMouseDown={() => simulateKey('PageDown', true)}
          onMouseUp={() => simulateKey('PageDown', false)}
        >
          <img src="brake.png" alt="Brake" style={{ width: 40, height: 40 }} />
        </button>
      </div>
    </div>
  );
}