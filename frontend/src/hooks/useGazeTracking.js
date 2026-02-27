import { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

/**
 * Runs TensorFlow.js FaceMesh in the browser at ~10 FPS.
 * Calculates gaze score (0-100) from iris position relative to eye corners.
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
  const loggedFaceRef = useRef(false);
  const loggedNoFaceRef = useRef(false);

  // ── Load model once ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      console.log('[Gaze] Loading TensorFlow.js + FaceMesh...');
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('[Gaze] TF backend ready:', tf.getBackend());

      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 2
      });

      if (!cancelled) {
        detectorRef.current = detector;
        setIsLoading(false);
        console.log('[Gaze] FaceMesh model loaded successfully');
      }
    })().catch(err => {
      console.error('[Gaze] Model load failed:', err);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Gaze score calculation ──
  const calcGaze = useCallback((face) => {
    const kp = face.keypoints;
    const leftIris = kp[468];
    const rightIris = kp[473];
    if (!leftIris || !rightIris) return 50;

    const LL = kp[33], LR = kp[133];
    const RL = kp[362], RR = kp[263];

    const leftRatio = (leftIris.x - LL.x) / (LR.x - LL.x);
    const rightRatio = (rightIris.x - RL.x) / (RR.x - RL.x);
    const hDev = Math.abs(((leftRatio + rightRatio) / 2) - 0.5) * 2;

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

    // Reset log flags when detection loop restarts
    loggedFaceRef.current = false;
    loggedNoFaceRef.current = false;

    console.log('[Gaze] Detection loop starting, isActive:', isActive);

    // Offscreen canvas for feeding frames to TF — fixes GPU/browser compat issues
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let loggedStart = false;

    const detect = async () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || !detectorRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Check video has actual pixel data
      if (vid.videoWidth === 0 || vid.videoHeight === 0) {
        if (!loggedStart) {
          console.log('[Gaze] Video element has 0 dimensions, waiting...', {
            readyState: vid.readyState,
            videoWidth: vid.videoWidth,
            videoHeight: vid.videoHeight,
            srcObject: !!vid.srcObject
          });
        }
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Size canvas to match video (once)
      if (canvas.width !== vid.videoWidth || canvas.height !== vid.videoHeight) {
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        console.log('[Gaze] Canvas sized:', canvas.width, 'x', canvas.height);
      }

      if (!loggedStart) {
        console.log('[Gaze] Detection loop started. Video:', vid.videoWidth, 'x', vid.videoHeight,
          'readyState:', vid.readyState, 'srcObject:', !!vid.srcObject);
        loggedStart = true;
      }

      try {
        // Draw current video frame to canvas — this is the key fix
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const faces = await detectorRef.current.estimateFaces(canvas);

        // Log first 5 detection results
        if (fpsCounterRef.current.frames < 5) {
          console.log(`[Gaze] Frame ${fpsCounterRef.current.frames}: ${faces.length} face(s) found`,
            faces.length > 0 ? `keypoints: ${faces[0].keypoints?.length}` : '');
        }

        // FPS counter
        fpsCounterRef.current.frames++;
        const now = Date.now();
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          setFps(fpsCounterRef.current.frames);
          fpsCounterRef.current = { frames: 0, lastTime: now };
        }

        if (faces.length > 0) {
          if (!loggedFaceRef.current) {
            console.log('[Gaze] ✅ Face detected! Tracking active. Keypoints:', faces[0].keypoints.length);
            loggedFaceRef.current = true;
            loggedNoFaceRef.current = false;
          }

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
          if (!loggedNoFaceRef.current) {
            console.log('[Gaze] ❌ No face detected — check camera/lighting. Video size:', vid.videoWidth, 'x', vid.videoHeight);
            loggedNoFaceRef.current = true;
            loggedFaceRef.current = false;
          }

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