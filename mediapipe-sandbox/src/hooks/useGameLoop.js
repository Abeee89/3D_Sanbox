import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook untuk game loop dengan physics update
 * @param {Function} onUpdate - callback yang dipanggil setiap frame (deltaTime, fps)
 * @param {boolean} isRunning - apakah loop sedang berjalan
 * @returns {Object} - fps state dan loop controls
 */
export function useGameLoop(onUpdate, isRunning = true) {
  const requestRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);
  const fpsRef = useRef(0);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap at 100ms
      lastTime = time;

      // Calculate FPS
      fpsRef.current = Math.round(1 / Math.max(deltaTime, 1 / 240));

      // Call update callback
      if (onUpdateRef.current) {
        onUpdateRef.current(deltaTime, fpsRef.current);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning]);

  const getFps = useCallback(() => fpsRef.current, []);

  return {
    getFps
  };
}
