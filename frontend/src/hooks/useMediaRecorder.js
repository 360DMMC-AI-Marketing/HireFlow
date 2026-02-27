import { useState, useRef, useCallback } from 'react';

/**
 * Records the candidate's camera+audio stream as a webm file.
 * On stop, uploads the recording to the backend.
 */
export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  /**
   * Start recording from a MediaStream (camera + mic).
   */
  const startRecording = useCallback((stream) => {
    if (!stream) {
      setError('No media stream available');
      return;
    }

    chunksRef.current = [];

    // Pick the best supported format
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1500000  // 1.5 Mbps — decent quality, reasonable file size
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        console.error('[Recorder] Error:', e);
        setError('Recording error');
      };

      // Record in 5-second chunks (safer than one big blob)
      recorder.start(5000);
      recorderRef.current = recorder;
      setIsRecording(true);
      setError(null);
      console.log('[Recorder] Started -', mimeType);
    } catch (e) {
      console.error('[Recorder] Failed to start:', e);
      setError('Could not start recording');
    }
  }, []);

  /**
   * Stop recording and return the complete video Blob.
   */
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        setIsRecording(false);
        console.log('[Recorder] Stopped — size:', (blob.size / 1024 / 1024).toFixed(1), 'MB');
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  /**
   * Upload the recording blob to the backend.
   */
  const uploadRecording = useCallback(async (sessionId, blob, token) => {
    if (!blob || blob.size === 0) {
      console.log('[Recorder] No recording to upload');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('recording', blob, `interview-${sessionId}.${ext}`);

      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const xhr = new XMLHttpRequest();

      const result = await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload network error'));

        xhr.open('POST', `${API}/ai-interviews/${sessionId}/recording`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      console.log('[Recorder] Upload complete:', result);
      setIsUploading(false);
      setUploadProgress(100);
      return result;
    } catch (e) {
      console.error('[Recorder] Upload error:', e);
      setError('Upload failed: ' + e.message);
      setIsUploading(false);
      return null;
    }
  }, []);

  return {
    isRecording,
    isUploading,
    uploadProgress,
    error,
    startRecording,
    stopRecording,
    uploadRecording
  };
}