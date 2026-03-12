import { useRef, useEffect, useCallback } from 'react';
import * as CANNON from 'cannon-es';

/**
 * Custom hook untuk setup Cannon.js physics world
 * @returns {Object} - world ref dan physics utilities
 */
export function usePhysicsWorld() {
  const worldRef = useRef(null);
  const groundBodyRef = useRef(null);

  // Initialize physics world
  useEffect(() => {
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    worldRef.current = world;

    // Ground material and body
    const groundMaterial = new CANNON.Material('groundMaterial');
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
    groundBodyRef.current = groundBody;

    // Cleanup
    return () => {
      // Remove all bodies from world
      while (world.bodies.length > 0) {
        world.removeBody(world.bodies[0]);
      }
    };
  }, []);

  // Step physics simulation
  const step = useCallback((deltaTime) => {
    if (worldRef.current) {
      worldRef.current.step(1 / 60, deltaTime, 3);
    }
  }, []);

  // Add body to world
  const addBody = useCallback((body) => {
    if (worldRef.current) {
      worldRef.current.addBody(body);
    }
  }, []);

  // Remove body from world
  const removeBody = useCallback((body) => {
    if (worldRef.current) {
      worldRef.current.removeBody(body);
    }
  }, []);

  return {
    world: worldRef,
    groundBody: groundBodyRef,
    step,
    addBody,
    removeBody
  };
}
