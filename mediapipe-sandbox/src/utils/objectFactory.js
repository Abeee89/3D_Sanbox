import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Factory function untuk membuat physics object (mesh + body)
 * @param {string} shapeType - 'box' | 'sphere' | 'cylinder'
 * @param {Object} position - {x, y, z} posisi spawn
 * @returns {Object} - { mesh, body }
 */
export function createPhysicsObject(shapeType, position) {
  let shape, geometry;
  const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);

  switch (shapeType) {
    case 'sphere':
      shape = new CANNON.Sphere(0.5);
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case 'cylinder':
      shape = new CANNON.Cylinder(0.5, 0.5, 1, 16);
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
      break;
    case 'box':
    default:
      shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
  }

  // Create Three.js mesh
  const material = new THREE.MeshStandardMaterial({ color: color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Create Cannon.js body
  const body = new CANNON.Body({ mass: 1 });
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);

  return { mesh, body };
}

/**
 * Sync mesh position/rotation dengan physics body
 * @param {THREE.Mesh} mesh
 * @param {CANNON.Body} body
 */
export function syncMeshWithBody(mesh, body) {
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}

/**
 * Highlight mesh saat di-grab
 * @param {THREE.Mesh} mesh
 * @param {boolean} isGrabbed
 */
export function setMeshGrabbed(mesh, isGrabbed) {
  if (mesh && mesh.material) {
    mesh.material.emissive.setHex(isGrabbed ? 0x333333 : 0x000000);
  }
}
