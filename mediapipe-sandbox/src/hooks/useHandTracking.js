import { useRef, useEffect, useCallback, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// Hand connections for drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

/**
 * Custom hook untuk MediaPipe hand tracking
 * @param {React.RefObject} videoRef - ref ke video element
 * @param {React.RefObject} canvasRef - ref ke canvas element untuk overlay
 * @param {Function} onHandsDetected - callback ketika hands terdeteksi
 * @returns {Object} - tracking state dan controls
 */
export function useHandTracking(videoRef, canvasRef, onHandsDetected) {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    hands.onResults((results) => {
      // Draw to canvas
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: '#00d2ff',
            lineWidth: 1
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: '#ffffff',
            lineWidth: 0.5,
            radius: 1
          });
        }
        // Call callback with landmarks
        if (onHandsDetected) {
          onHandsDetected(results.multiHandLandmarks);
        }
      } else {
        // No hands detected
        if (onHandsDetected) {
          onHandsDetected(null);
        }
      }

      canvasCtx.restore();

      // Mark as loaded after first result
      if (isLoading) {
        setIsLoading(false);
      }
    });

    handsRef.current = hands;

    // Initialize camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current) {
          await handsRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start().then(() => {
      setIsTracking(true);
    });

    cameraRef.current = camera;

    // Cleanup
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [videoRef, canvasRef, onHandsDetected, isLoading]);

  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      setIsTracking(false);
    }
  }, []);

  const startTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.start();
      setIsTracking(true);
    }
  }, []);

  return {
    isLoading,
    isTracking,
    stopTracking,
    startTracking
  };
}
