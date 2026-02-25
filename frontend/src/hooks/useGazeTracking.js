import { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

/**
 * Runs TensorFlow.js FaceMesh in the browser at ~10 FPS.
 * Calculates gaze score (0-100) from iris position relative to eye corners.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @param {boolean} isActive - only track when interview is live
 * @returns {{ gazeScore, confidence, fps, isLoading, flushAttentionBuffer }}
 */
export function useGazeTracking(videoRef, isActive = true) {
  const [gazeScore, setGazeScore] = useState(0);
  const [confidence, setConfidence] = useState('Low');
  const [fps, setFps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const detectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const attentionBufferRef = useRef([]);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const startTimeRef = useRef(Date.now());

  // ── Load model once ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true,   // needed for iris landmarks
        maxFaces: 2              // detect if someone else appears
      });

      if (!cancelled) {
        detectorRef.current = detector;
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Gaze score calculation ──
  const calcGaze = useCallback((face) => {
    const kp = face.keypoints;
    // Iris centers (from refineLandmarks)
    const leftIris = kp[468];   // left iris center
    const rightIris = kp[473];  // right iris center
    if (!leftIris || !rightIris) return 50;

    // Eye corners
    const LL = kp[33], LR = kp[133];   // left eye outer/inner
    const RL = kp[362], RR = kp[263];  // right eye inner/outer

    // Horizontal: iris position within eye (0=left edge, 1=right edge)
    const leftRatio = (leftIris.x - LL.x) / (LR.x - LL.x);
    const rightRatio = (rightIris.x - RL.x) / (RR.x - RL.x);
    const hDev = Math.abs(((leftRatio + rightRatio) / 2) - 0.5) * 2;

    // Vertical
    const eyeTop = kp[159], eyeBot = kp[145];
    const vRatio = (leftIris.y - eyeTop.y) / (eyeBot.y - eyeTop.y);
    const vDev = Math.abs(vRatio - 0.5) * 2;

    const deviation = Math.sqrt(hDev ** 2 + vDev ** 2);
    return Math.max(0, Math.min(100, Math.round((1 - deviation) * 100)));
  }, []);

  // ── Head pose ──
  const calcHeadPose = useCallback((face) => {
    const kp = face.keypoints;
    const leftEar = kp[234], rightEar = kp[454];
    const chin = kp[152], forehead = kp[10];

    return {
      yaw: Math.atan2(rightEar.x - leftEar.x, (rightEar.z || 0) - (leftEar.z || 0)) * (180 / Math.PI),
      pitch: Math.atan2(chin.y - forehead.y, (chin.z || 0) - (forehead.z || 0)) * (180 / Math.PI),
      roll: Math.atan2(rightEar.y - leftEar.y, rightEar.x - leftEar.x) * (180 / Math.PI)
    };
  }, []);

  // ── Detection loop (10 FPS) ──
  useEffect(() => {
    if (!isActive || isLoading || !videoRef?.current) return;

    const detect = async () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || !detectorRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const faces = await detectorRef.current.estimateFaces(vid);

        // FPS counter
        fpsCounterRef.current.frames++;
        const now = Date.now();
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          setFps(fpsCounterRef.current.frames);
          fpsCounterRef.current = { frames: 0, lastTime: now };
        }

        if (faces.length > 0) {
          const score = calcGaze(faces[0]);
          const headPose = calcHeadPose(faces[0]);
          setGazeScore(score);
          setConfidence(score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low');

          attentionBufferRef.current.push({
            timestamp: (Date.now() - startTimeRef.current) / 1000,
            gazeScore: score,
            headPose,
            faceDetected: true,
            multipleFaces: faces.length > 1
          });
        } else {
          setGazeScore(0);
          setConfidence('Low');
          attentionBufferRef.current.push({
            timestamp: (Date.now() - startTimeRef.current) / 1000,
            gazeScore: 0,
            faceDetected: false,
            multipleFaces: false
          });
        }
      } catch (e) {
        console.error('[Gaze] Detection error:', e);
      }

      // Throttle to ~10 FPS
      setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(detect);
      }, 100);
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isActive, isLoading, videoRef, calcGaze, calcHeadPose]);

  /** Get buffered attention data and clear the buffer. Call every 5s. */
  const flushAttentionBuffer = useCallback(() => {
    const data = [...attentionBufferRef.current];
    attentionBufferRef.current = [];
    return data;
  }, []);

  return { gazeScore, confidence, fps, isLoading, flushAttentionBuffer,
    setStartTime: (t) => { startTimeRef.current = t; }
  };
}