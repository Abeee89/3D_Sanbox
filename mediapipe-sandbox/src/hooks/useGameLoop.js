import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook untuk game loop dengan physics update
 * @param {Function} onUpdate - callback yang dipanggil setiap frame (deltaTime, fps)
 * @param {boolean} isRunning - apakah loop sedang berjalan
 * @returns {Object} - fps state dan loop controls
 */
export function useGameLoop(onUpdate, isRunning = true) {
  const requestRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);

  const loop = useCallback(() => {
    const time = performance.now();
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms
    lastTimeRef.current = time;

    // Calculate FPS
    fpsRef.current = Math.round(1 / deltaTime);

    // Call update callback
    if (onUpdate) {
      onUpdate(deltaTime, fpsRef.current);
    }

    // Continue loop
    requestRef.current = requestAnimationFrame(loop);
  }, [onUpdate]);

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, loop]);

  const getFps = useCallback(() => fpsRef.current, []);

  return {
    getFps
  };
}
