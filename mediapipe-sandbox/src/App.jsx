import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

// Components
import Canvas3D from './components/Canvas3D';
import WebcamPreview from './components/WebcamPreview';
import ControlPanel from './components/ControlPanel';
import InstructionsPanel from './components/InstructionsPanel';
import StatsDisplay from './components/StatsDisplay';
import LoadingScreen from './components/LoadingScreen';

// Hooks
import { useThreeScene } from './hooks/useThreeScene';
import { usePhysicsWorld } from './hooks/usePhysicsWorld';
import { useHandTracking } from './hooks/useHandTracking';
import { useGameLoop } from './hooks/useGameLoop';

// Utils
import { createPhysicsObject, syncMeshWithBody, setMeshGrabbed } from './utils/objectFactory';
import {
  detectPinch,
  detectTwoHandsOpen,
  landmarkToWorldPosition,
  smoothHandPosition,
  findNearestBody,
  getSpawnCooldown
} from './utils/gestureHandler';

// Styles
import './App.css';

function App() {
  // Refs
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State
  const [activeShape, setActiveShape] = useState('box');
  const [objects, setObjects] = useState([]); // Array of {mesh, body}
  const [isLoading, setIsLoading] = useState(true);
  const [fps, setFps] = useState(0);
  
  // Refs for mutable state (tidak trigger re-render)
  const objectsRef = useRef([]);
  const grabbedRef = useRef(null);
  const grabbedIndexRef = useRef(-1);
  const isPinchingRef = useRef(false);
  const lastSpawnTimeRef = useRef(0);
  const currentHandPosRef = useRef(new THREE.Vector3());
  const activeShapeRef = useRef(activeShape);

  // Keep activeShapeRef in sync
  useEffect(() => {
    activeShapeRef.current = activeShape;
  }, [activeShape]);

  // Initialize Three.js scene
  const {
    scene,
    camera,
    render,
    updateHandPosition,
    setControlsEnabled
  } = useThreeScene(containerRef);

  // Initialize physics world
  const { world, step, addBody, removeBody } = usePhysicsWorld();

  // Handle hands detected callback
  const handleHandsDetected = useCallback((multiHandLandmarks) => {
    if (!camera.current) return;

    if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
      // No hands - release if grabbing
      if (grabbedRef.current) {
        releaseGrab();
      }
      return;
    }

    // Use first hand for interaction
    const hand1 = multiHandLandmarks[0];
    const indexFinger = hand1[8];

    // Convert to world position
    const targetPos = landmarkToWorldPosition(indexFinger, camera.current);
    const smoothedPos = smoothHandPosition(currentHandPosRef.current, targetPos);
    currentHandPosRef.current.copy(smoothedPos);
    
    // Update hand cursor mesh
    updateHandPosition(smoothedPos);

    // Check pinch gesture
    const isCurrentlyPinching = detectPinch(hand1);

    if (isCurrentlyPinching && !isPinchingRef.current) {
      // Start grab
      startGrab(smoothedPos);
    } else if (!isCurrentlyPinching && isPinchingRef.current) {
      // Release grab
      releaseGrab();
    }
    isPinchingRef.current = isCurrentlyPinching;

    // Move grabbed object
    if (grabbedRef.current) {
      grabbedRef.current.position.set(smoothedPos.x, smoothedPos.y, smoothedPos.z);
      grabbedRef.current.velocity.set(0, 0, 0);
      grabbedRef.current.angularVelocity.set(0, 0, 0);
    }

    // Check two-hands-open for spawning
    if (detectTwoHandsOpen(multiHandLandmarks) && !grabbedRef.current) {
      const now = Date.now();
      if (now - lastSpawnTimeRef.current > getSpawnCooldown()) {
        spawnObject(smoothedPos);
        lastSpawnTimeRef.current = now;
      }
    }
  }, [camera, updateHandPosition]);

  // Start grab
  const startGrab = useCallback((position) => {
    const bodies = objectsRef.current.map(obj => obj.body);
    const nearestBody = findNearestBody(bodies, position);
    
    if (nearestBody) {
      const index = objectsRef.current.findIndex(obj => obj.body === nearestBody);
      if (index !== -1) {
        grabbedRef.current = nearestBody;
        grabbedIndexRef.current = index;
        setMeshGrabbed(objectsRef.current[index].mesh, true);
        setControlsEnabled(false);
      }
    }
  }, [setControlsEnabled]);

  // Release grab
  const releaseGrab = useCallback(() => {
    if (grabbedIndexRef.current !== -1 && objectsRef.current[grabbedIndexRef.current]) {
      setMeshGrabbed(objectsRef.current[grabbedIndexRef.current].mesh, false);
    }
    grabbedRef.current = null;
    grabbedIndexRef.current = -1;
    setControlsEnabled(true);
  }, [setControlsEnabled]);

  // Spawn object
  const spawnObject = useCallback((position) => {
    if (!scene.current) return;

    const { mesh, body } = createPhysicsObject(activeShapeRef.current, position);
    
    scene.current.add(mesh);
    addBody(body);
    
    const newObj = { mesh, body };
    objectsRef.current.push(newObj);
    setObjects([...objectsRef.current]);
  }, [scene, addBody]);

  // Reset scene
  const handleReset = useCallback(() => {
    // Release any grabbed object first
    releaseGrab();
    
    // Remove all objects
    objectsRef.current.forEach(({ mesh, body }) => {
      if (scene.current) scene.current.remove(mesh);
      removeBody(body);
    });
    
    objectsRef.current = [];
    setObjects([]);
  }, [scene, removeBody, releaseGrab]);

  // Hand tracking hook
  const { isLoading: isHandTrackingLoading } = useHandTracking(
    videoRef,
    canvasRef,
    handleHandsDetected
  );

  // Update loading state
  useEffect(() => {
    setIsLoading(isHandTrackingLoading);
  }, [isHandTrackingLoading]);

  // Game loop update
  const handleGameUpdate = useCallback((deltaTime, currentFps) => {
    // Step physics
    step(deltaTime);

    // Sync meshes with physics bodies
    const toRemove = [];
    objectsRef.current.forEach((obj, index) => {
      syncMeshWithBody(obj.mesh, obj.body);
      
      // Remove objects that fall too far
      if (obj.body.position.y < -15) {
        toRemove.push(index);
      }
    });

    // Remove fallen objects (reverse order to maintain indices)
    if (toRemove.length > 0) {
      toRemove.reverse().forEach(index => {
        const obj = objectsRef.current[index];
        if (scene.current) scene.current.remove(obj.mesh);
        removeBody(obj.body);
        objectsRef.current.splice(index, 1);
        
        // Update grabbed index if needed
        if (grabbedIndexRef.current === index) {
          grabbedRef.current = null;
          grabbedIndexRef.current = -1;
        } else if (grabbedIndexRef.current > index) {
          grabbedIndexRef.current--;
        }
      });
      setObjects([...objectsRef.current]);
    }

    // Render scene
    render();

    // Update FPS display
    setFps(currentFps);
  }, [step, render, scene, removeBody]);

  // Start game loop
  useGameLoop(handleGameUpdate, true);

  return (
    <div className="app">
      <LoadingScreen isVisible={isLoading} />
      
      <Canvas3D containerRef={containerRef} />
      
      <div id="ui-layer">
        <ControlPanel
          activeShape={activeShape}
          onShapeChange={setActiveShape}
          onReset={handleReset}
        />
        <InstructionsPanel />
      </div>

      <StatsDisplay fps={fps} />

      <WebcamPreview
        videoRef={videoRef}
        canvasRef={canvasRef}
      />
    </div>
  );
}

export default App;
