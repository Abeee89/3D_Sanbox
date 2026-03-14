import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const RENDER_QUALITY = {
  low: { pixelRatio: 0.8, shadows: false, antialias: false, fogFar: 34 },
  normal: { pixelRatio: 1, shadows: true, antialias: true, fogFar: 50 },
  high: { pixelRatio: 1.5, shadows: true, antialias: true, fogFar: 70 }
};

/**
 * Custom hook untuk setup Three.js scene, camera, renderer, lights, ground, dan hand cursor
 * @param {React.RefObject} containerRef - ref ke DOM element container
 * @returns {Object} - scene refs dan utility functions
 */
export function useThreeScene(containerRef) {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const handMeshRef = useRef(null);
  const directionalLightRef = useRef(null);
  const qualityRef = useRef('normal');

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const containerEl = containerRef.current;

    // Scene
    const initialQuality = RENDER_QUALITY[qualityRef.current] || RENDER_QUALITY.normal;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 10, initialQuality.fogFar);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 15);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: initialQuality.antialias, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, initialQuality.pixelRatio));
    renderer.shadowMap.enabled = initialQuality.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    // Ground Plane
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Grid Helper
    scene.add(new THREE.GridHelper(40, 40, 0x444444, 0x222222));

    // Ambient Light
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Directional Light with shadows
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 15, 5);
    light.castShadow = true;
    light.shadow.camera.left = -20;
    light.shadow.camera.right = 20;
    light.shadow.camera.top = 20;
    light.shadow.camera.bottom = -20;
    scene.add(light);
    directionalLightRef.current = light;

    // Hand Cursor Mesh (glowing sphere)
    const handGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const handMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.5
    });
    const handMesh = new THREE.Mesh(handGeo, handMat);
    scene.add(handMesh);
    handMeshRef.current = handMesh;

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const quality = RENDER_QUALITY[qualityRef.current] || RENDER_QUALITY.normal;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerEl && renderer.domElement) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  // Render function
  const render = useCallback(() => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      controlsRef.current?.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  // Update hand cursor position
  const updateHandPosition = useCallback((position) => {
    if (handMeshRef.current && position) {
      handMeshRef.current.position.copy(position);
    }
  }, []);

  // Enable/disable orbit controls
  const setControlsEnabled = useCallback((enabled) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = enabled;
    }
  }, []);

  const setRenderQuality = useCallback((quality) => {
    if (!rendererRef.current || !sceneRef.current || !RENDER_QUALITY[quality]) {
      return;
    }

    qualityRef.current = quality;
    const profile = RENDER_QUALITY[quality];
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatio));
    rendererRef.current.shadowMap.enabled = profile.shadows;

    if (directionalLightRef.current) {
      directionalLightRef.current.castShadow = profile.shadows;
    }

    if (sceneRef.current.fog) {
      sceneRef.current.fog.far = profile.fogFar;
    }
  }, []);

  return {
    scene: sceneRef,
    camera: cameraRef,
    renderer: rendererRef,
    controls: controlsRef,
    handMesh: handMeshRef,
    render,
    updateHandPosition,
    setControlsEnabled,
    setRenderQuality
  };
}
