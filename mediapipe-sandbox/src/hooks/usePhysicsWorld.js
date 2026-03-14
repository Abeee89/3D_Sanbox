import { useRef, useEffect, useCallback } from 'react';
import * as CANNON from 'cannon-es';

const PHYSICS_QUALITY = {
  low: { iterations: 6, maxSubSteps: 2 },
  normal: { iterations: 10, maxSubSteps: 3 },
  high: { iterations: 14, maxSubSteps: 4 }
};

/**
 * Custom hook untuk setup Cannon.js physics world
 * @returns {Object} - world ref dan physics utilities
 */
export function usePhysicsWorld() {
  const worldRef = useRef(null);
  const groundBodyRef = useRef(null);
  const qualityRef = useRef('normal');
  const gravityRef = useRef(-9.82);
  const isFrozenRef = useRef(false);

  // Initialize physics world
  useEffect(() => {
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = PHYSICS_QUALITY.normal.iterations;
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
      if (isFrozenRef.current) {
        return;
      }

      const { maxSubSteps } = PHYSICS_QUALITY[qualityRef.current] || PHYSICS_QUALITY.normal;
      worldRef.current.step(1 / 60, deltaTime, maxSubSteps);
    }
  }, []);

  const setQuality = useCallback((quality) => {
    if (!worldRef.current || !PHYSICS_QUALITY[quality]) {
      return;
    }

    qualityRef.current = quality;
    worldRef.current.solver.iterations = PHYSICS_QUALITY[quality].iterations;
  }, []);

  const setGravity = useCallback((gravityY) => {
    if (!worldRef.current || Number.isNaN(gravityY)) {
      return;
    }

    gravityRef.current = gravityY;
    worldRef.current.gravity.set(0, gravityY, 0);
  }, []);

  const setFrozen = useCallback((isFrozen) => {
    isFrozenRef.current = isFrozen;
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

  const applyRadialImpulse = useCallback((origin, strength = 12, radius = 8) => {
    if (!worldRef.current || !origin) {
      return;
    }

    for (const body of worldRef.current.bodies) {
      if (body.mass === 0) {
        continue;
      }

      const offset = new CANNON.Vec3(
        body.position.x - origin.x,
        body.position.y - origin.y,
        body.position.z - origin.z
      );

      const distance = offset.length();
      if (distance === 0 || distance > radius) {
        continue;
      }

      const falloff = 1 - distance / radius;
      offset.normalize();
      const impulse = offset.scale(strength * falloff);
      body.applyImpulse(impulse, body.position);
    }
  }, []);

  return {
    world: worldRef,
    groundBody: groundBodyRef,
    step,
    addBody,
    removeBody,
    setQuality,
    setGravity,
    setFrozen,
    applyRadialImpulse,
    gravityRef
  };
}
