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
  detectHandOpen,
  detectTwoHandsOpen,
  landmarkToWorldPosition,
  smoothHandPosition,
  findNearestBody,
  getSpawnCooldown
} from './utils/gestureHandler';

// Styles
import './App.css';

const QUALITY_PRESETS = {
  low: {
    renderer: 'low',
    physics: 'low',
    tracking: { modelComplexity: 0, maxNumHands: 2, resolution: { width: 424, height: 240 } },
    maxObjects: 55,
    rainIntervalMs: 700
  },
  normal: {
    renderer: 'normal',
    physics: 'normal',
    tracking: { modelComplexity: 1, maxNumHands: 2, resolution: { width: 640, height: 480 } },
    maxObjects: 90,
    rainIntervalMs: 520
  },
  high: {
    renderer: 'high',
    physics: 'high',
    tracking: { modelComplexity: 1, maxNumHands: 2, resolution: { width: 960, height: 540 } },
    maxObjects: 140,
    rainIntervalMs: 360
  }
};

const RAIN_SPAWN_HEIGHT = 10;

function App() {
  // Refs
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State
  const [activeShape, setActiveShape] = useState('box');
  const [isLoading, setIsLoading] = useState(true);
  const [fps, setFps] = useState(0);
  const [objectCount, setObjectCount] = useState(0);
  const [qualityMode, setQualityMode] = useState('normal');
  const [gravity, setGravity] = useState(-9.82);
  const [isPhysicsFrozen, setIsPhysicsFrozen] = useState(false);
  const [autoRain, setAutoRain] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showHandOverlay, setShowHandOverlay] = useState(true);
  const [gestureStatus, setGestureStatus] = useState('Siap: buka dua tangan untuk spawn');
  const [trackingActive, setTrackingActive] = useState(false);
  
  // Refs for mutable state (tidak trigger re-render)
  const objectsRef = useRef([]);
  const grabbedRef = useRef(null);
  const grabbedIndexRef = useRef(-1);
  const isPinchingRef = useRef(false);
  const lastSpawnTimeRef = useRef(0);
  const currentHandPosRef = useRef(new THREE.Vector3());
  const activeShapeRef = useRef(activeShape);
  const qualityModeRef = useRef(qualityMode);
  const lastFpsUiUpdateRef = useRef(0);
  const rainTimerRef = useRef(null);
  const lastBlastTimeRef = useRef(0);

  // Keep activeShapeRef in sync
  useEffect(() => {
    activeShapeRef.current = activeShape;
  }, [activeShape]);

  useEffect(() => {
    qualityModeRef.current = qualityMode;
  }, [qualityMode]);

  // Initialize Three.js scene
  const {
    scene,
    camera,
    render,
    updateHandPosition,
    setControlsEnabled,
    setRenderQuality
  } = useThreeScene(containerRef);

  // Initialize physics world
  const {
    step,
    addBody,
    removeBody,
    setQuality: setPhysicsQuality,
    setGravity: setPhysicsGravity,
    setFrozen,
    applyRadialImpulse
  } = usePhysicsWorld();

  // Release grab
  const releaseGrab = useCallback(() => {
    if (grabbedIndexRef.current !== -1 && objectsRef.current[grabbedIndexRef.current]) {
      setMeshGrabbed(objectsRef.current[grabbedIndexRef.current].mesh, false);
    }
    grabbedRef.current = null;
    grabbedIndexRef.current = -1;
    setControlsEnabled(true);
  }, [setControlsEnabled]);

  const removeObjectAtIndex = useCallback((index) => {
    const obj = objectsRef.current[index];
    if (!obj) {
      return;
    }

    if (scene.current) {
      scene.current.remove(obj.mesh);
    }
    removeBody(obj.body);
    objectsRef.current.splice(index, 1);

    if (grabbedIndexRef.current === index) {
      grabbedRef.current = null;
      grabbedIndexRef.current = -1;
      setControlsEnabled(true);
    } else if (grabbedIndexRef.current > index) {
      grabbedIndexRef.current -= 1;
    }
  }, [scene, removeBody, setControlsEnabled]);

  const spawnObject = useCallback((position, options = {}) => {
    if (!scene.current || !position) {
      return false;
    }

    const preset = QUALITY_PRESETS[qualityModeRef.current] || QUALITY_PRESETS.normal;
    if (objectsRef.current.length >= preset.maxObjects) {
      removeObjectAtIndex(0);
    }

    const { mesh, body } = createPhysicsObject(activeShapeRef.current, position);

    if (options.randomVelocity) {
      body.velocity.set(
        (Math.random() - 0.5) * 2.8,
        Math.random() * 2,
        (Math.random() - 0.5) * 2.8
      );
    }

    scene.current.add(mesh);
    addBody(body);

    objectsRef.current.push({ mesh, body });
    setObjectCount(objectsRef.current.length);

    return true;
  }, [scene, addBody, removeObjectAtIndex]);

  // Start grab
  const startGrab = useCallback((position) => {
    const bodies = objectsRef.current.map((obj) => obj.body);
    const nearestBody = findNearestBody(bodies, position);

    if (nearestBody) {
      const index = objectsRef.current.findIndex((obj) => obj.body === nearestBody);
      if (index !== -1) {
        grabbedRef.current = nearestBody;
        grabbedIndexRef.current = index;
        setMeshGrabbed(objectsRef.current[index].mesh, true);
        setControlsEnabled(false);
      }
    }
  }, [setControlsEnabled]);

  const spawnBurst = useCallback((count = 8) => {
    const center = currentHandPosRef.current.clone();
    center.y += 0.5;

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const radius = 0.7 + Math.random() * 0.7;
      const position = new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + Math.random() * 0.7,
        center.z + Math.sin(angle) * radius
      );
      spawnObject(position, { randomVelocity: true });
    }
  }, [spawnObject]);

  const triggerBlast = useCallback((strength = 16) => {
    const now = Date.now();
    if (now - lastBlastTimeRef.current < 900) {
      return;
    }
    lastBlastTimeRef.current = now;
    applyRadialImpulse(currentHandPosRef.current, strength, 9);
    setGestureStatus('Blast aktif: objek terdorong radial');
  }, [applyRadialImpulse]);

  // Handle hands detected callback
  const handleHandsDetected = useCallback((multiHandLandmarks) => {
    if (!camera.current) return;

    if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
      // No hands - release if grabbing
      if (grabbedRef.current) {
        releaseGrab();
      }
      setGestureStatus('Tidak ada tangan terdeteksi');
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
      setGestureStatus('Pinch aktif: mengambil objek');
    } else if (!isCurrentlyPinching && isPinchingRef.current) {
      // Release grab
      releaseGrab();
      setGestureStatus('Objek dilepas');
    }
    isPinchingRef.current = isCurrentlyPinching;

    // Move grabbed object
    if (grabbedRef.current) {
      grabbedRef.current.position.set(smoothedPos.x, smoothedPos.y, smoothedPos.z);
      grabbedRef.current.velocity.set(0, 0, 0);
      grabbedRef.current.angularVelocity.set(0, 0, 0);
    }

    // Two-hand pinch triggers radial blast
    if (multiHandLandmarks.length >= 2 && detectPinch(multiHandLandmarks[0]) && detectPinch(multiHandLandmarks[1])) {
      triggerBlast();
    }

    // Check two-hands-open for spawning
    if (detectTwoHandsOpen(multiHandLandmarks) && !grabbedRef.current) {
      const now = Date.now();
      if (now - lastSpawnTimeRef.current > getSpawnCooldown()) {
        spawnObject(smoothedPos);
        lastSpawnTimeRef.current = now;
        setGestureStatus('Spawn: dua tangan terbuka terdeteksi');
      }
    } else if (detectHandOpen(hand1) && !isCurrentlyPinching) {
      setGestureStatus('Tangan terbuka: siap spawn');
    }
  }, [camera, updateHandPosition, startGrab, releaseGrab, spawnObject, triggerBlast]);

  // Reset scene
  const handleReset = useCallback(() => {
    // Release any grabbed object first
    releaseGrab();
    
    // Remove all objects
    for (let i = objectsRef.current.length - 1; i >= 0; i -= 1) {
      removeObjectAtIndex(i);
    }
    
    objectsRef.current = [];
    setObjectCount(0);
    setGestureStatus('Scene di-reset');
  }, [releaseGrab, removeObjectAtIndex]);

  const handleFreezeToggle = useCallback((nextFrozen) => {
    setIsPhysicsFrozen(nextFrozen);
    setFrozen(nextFrozen);

    if (nextFrozen) {
      releaseGrab();
      setGestureStatus('Physics dibekukan');
    } else {
      setGestureStatus('Physics dilanjutkan');
    }
  }, [setFrozen, releaseGrab]);

  const handleGravityChange = useCallback((nextGravity) => {
    setGravity(nextGravity);
    setPhysicsGravity(nextGravity);
  }, [setPhysicsGravity]);

  const handleSpawnBurst = useCallback(() => {
    spawnBurst(8);
    setGestureStatus('Burst spawn: 8 objek');
  }, [spawnBurst]);

  const handleBlast = useCallback(() => {
    triggerBlast(20);
  }, [triggerBlast]);

  // Hand tracking hook
  const {
    isLoading: isHandTrackingLoading,
    isTracking,
    updateTrackingOptions
  } = useHandTracking(
    videoRef,
    canvasRef,
    handleHandsDetected
  );

  useEffect(() => {
    setTrackingActive(isTracking);
  }, [isTracking]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isHandTrackingLoading);
  }, [isHandTrackingLoading]);

  // Apply quality and tracking settings
  useEffect(() => {
    const preset = QUALITY_PRESETS[qualityMode] || QUALITY_PRESETS.normal;
    setRenderQuality(preset.renderer);
    setPhysicsQuality(preset.physics);
    updateTrackingOptions({
      ...preset.tracking,
      drawOverlay: showHandOverlay
    });
  }, [qualityMode, showHandOverlay, setRenderQuality, setPhysicsQuality, updateTrackingOptions]);

  // Auto-rain spawner
  useEffect(() => {
    if (!autoRain) {
      if (rainTimerRef.current) {
        clearInterval(rainTimerRef.current);
        rainTimerRef.current = null;
      }
      return undefined;
    }

    const preset = QUALITY_PRESETS[qualityMode] || QUALITY_PRESETS.normal;
    rainTimerRef.current = setInterval(() => {
      const rainPos = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        RAIN_SPAWN_HEIGHT + Math.random() * 2,
        (Math.random() - 0.5) * 10
      );
      spawnObject(rainPos, { randomVelocity: true });
    }, preset.rainIntervalMs);

    return () => {
      if (rainTimerRef.current) {
        clearInterval(rainTimerRef.current);
        rainTimerRef.current = null;
      }
    };
  }, [autoRain, qualityMode, spawnObject]);

  // Keyboard shortcuts for desktop usage
  useEffect(() => {
    const onKeyDown = (event) => {
      if (isLoading) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          handleSpawnBurst();
          break;
        case 'e':
          handleBlast();
          break;
        case 'f':
          handleFreezeToggle(!isPhysicsFrozen);
          break;
        case 'r':
          handleReset();
          break;
        case 'v':
          setShowWebcam((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isLoading, isPhysicsFrozen, handleSpawnBurst, handleBlast, handleFreezeToggle, handleReset]);

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
      toRemove.reverse().forEach((index) => {
        removeObjectAtIndex(index);
      });
      setObjectCount(objectsRef.current.length);
    }

    // Render scene
    render();

    // Avoid React re-render every frame for stats.
    const now = performance.now();
    if (now - lastFpsUiUpdateRef.current > 250) {
      setFps(currentFps);
      lastFpsUiUpdateRef.current = now;
    }
  }, [step, render, removeObjectAtIndex]);

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
          qualityMode={qualityMode}
          onQualityChange={setQualityMode}
          gravity={gravity}
          onGravityChange={handleGravityChange}
          isPhysicsFrozen={isPhysicsFrozen}
          onPhysicsFrozenChange={handleFreezeToggle}
          autoRain={autoRain}
          onAutoRainChange={setAutoRain}
          onSpawnBurst={handleSpawnBurst}
          onBlast={handleBlast}
          showHandOverlay={showHandOverlay}
          onShowHandOverlayChange={setShowHandOverlay}
          showWebcam={showWebcam}
          onShowWebcamChange={setShowWebcam}
        />
        <InstructionsPanel />
      </div>

      <StatsDisplay
        fps={fps}
        objectCount={objectCount}
        qualityMode={qualityMode}
        isPhysicsFrozen={isPhysicsFrozen}
        trackingActive={trackingActive}
        gestureStatus={gestureStatus}
      />

      <WebcamPreview
        videoRef={videoRef}
        canvasRef={canvasRef}
        isVisible={showWebcam}
      />
    </div>
  );
}

export default App;
