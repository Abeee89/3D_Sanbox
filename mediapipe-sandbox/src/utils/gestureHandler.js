import * as THREE from 'three';

// Configuration
export const CONFIG = {
  pinchThreshold: 0.08, // Increased for better sensitivity (was 0.05)
  handOpenThreshold: 0.15,
  handZDepth: -5,
  lerpFactor: 0.15,
  spawnCooldown: 3500
};

/**
 * Detect pinch gesture (thumb tip close to index tip)
 * @param {Array} landmarks - MediaPipe hand landmarks
 * @param {number} threshold - Optional custom threshold
 * @returns {boolean}
 */
export function detectPinch(landmarks, threshold = CONFIG.pinchThreshold) {
  if (!landmarks || landmarks.length === 0) return false;
  
  const thumb = landmarks[4];
  const index = landmarks[8];
  
  const distance = Math.sqrt(
    Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
  );
  
  return distance < threshold;
}

/**
 * Detect if hand is open (index finger tip above wrist)
 * @param {Array} landmarks - MediaPipe hand landmarks
 * @returns {boolean}
 */
export function detectHandOpen(landmarks) {
  if (!landmarks) return false;
  
  const index = landmarks[8];
  const wrist = landmarks[0];
  
  return index.y < wrist.y - CONFIG.handOpenThreshold;
}

/**
 * Detect two-hands-open gesture for spawning
 * @param {Array} multiHandLandmarks - Array of hand landmarks
 * @returns {boolean}
 */
export function detectTwoHandsOpen(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length < 2) return false;
  
  const hand1Open = detectHandOpen(multiHandLandmarks[0]);
  const hand2Open = detectHandOpen(multiHandLandmarks[1]);
  
  return hand1Open && hand2Open;
}

/**
 * Convert hand landmark to 3D world position
 * @param {Object} landmark - {x, y, z} normalized coordinates
 * @param {THREE.Camera} camera
 * @returns {THREE.Vector3}
 */
export function landmarkToWorldPosition(landmark, camera) {
  const vector = new THREE.Vector3(
    (1 - landmark.x * 2),
    (1 - landmark.y * 2),
    0.5
  );
  vector.unproject(camera);
  
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z + CONFIG.handZDepth;
  
  return camera.position.clone().add(dir.multiplyScalar(distance));
}

/**
 * Smooth hand position using lerp
 * @param {THREE.Vector3} currentPos - current position
 * @param {THREE.Vector3} targetPos - target position
 * @returns {THREE.Vector3} - smoothed position
 */
export function smoothHandPosition(currentPos, targetPos) {
  return currentPos.clone().lerp(targetPos, CONFIG.lerpFactor);
}

/**
 * Find nearest body to position within grab distance
 * @param {Array} bodies - Array of CANNON.Body
 * @param {THREE.Vector3} position
 * @param {number} maxDistance
 * @returns {CANNON.Body|null}
 */
export function findNearestBody(bodies, position, maxDistance = 2) {
  let closestDist = maxDistance;
  let target = null;
  
  for (const body of bodies) {
    const d = Math.sqrt(
      Math.pow(body.position.x - position.x, 2) +
      Math.pow(body.position.y - position.y, 2) +
      Math.pow(body.position.z - position.z, 2)
    );
    
    if (d < closestDist) {
      closestDist = d;
      target = body;
    }
  }
  
  return target;
}

/**
 * Get spawn cooldown value
 * @returns {number} milliseconds
 */
export function getSpawnCooldown() {
  return CONFIG.spawnCooldown;
}
