import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useInterview(sessionId, token) {
  const [state, setState] = useState('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  // ── Stop mic — must be defined before useEffect that references it ──
  const stopMicCapture = useCallback(() => {
    // Disconnect audio processing graph
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) { /* ignore */ }
      sourceRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.processor.disconnect();
        if (processorRef.current.actx.state !== 'closed') {
          processorRef.current.actx.close();
        }
      } catch (e) { /* ignore */ }
      processorRef.current = null;
    }
    // Release mic
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(`${API}/interview`, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      socket.emit('join-interview', { sessionId });
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setError('Connection failed: ' + err.message);
    });

    // ── State changes ──
    socket.on('interview-state', ({ state: s, questionIndex: qi, totalQuestions: tq, questionText: qt }) => {
      console.log('[Interview] State:', s, qi !== undefined ? `Q${qi + 1}` : '');
      setState(s);
      if (qi !== undefined) setQuestionIndex(qi);
      if (tq !== undefined) setTotalQuestions(tq);
      if (qt) { setCurrentQuestion(qt); setTranscript(''); }
    });

    // ── TTS playback ──
    socket.on('tts-audio', async ({ audio }) => {
      try {
        console.log('[TTS] Received audio, playing...');
        const bytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const player = new Audio(url);

        player.onended = () => {
          console.log('[TTS] Playback finished');
          URL.revokeObjectURL(url);
          socket.emit('tts-playback-done');
        };
        player.onerror = (e) => {
          console.error('[TTS] Playback error:', e);
          URL.revokeObjectURL(url);
          socket.emit('tts-playback-done');
        };

        await player.play();
      } catch (e) {
        console.error('[TTS] Play failed:', e);
        socket.emit('tts-playback-done');
      }
    });

    // ── Live transcript ──
    socket.on('transcript-update', ({ text, isFinal, fullTranscript }) => {
      if (isFinal) setTranscript(fullTranscript || text);
    });

    // ── Server says: start sending mic audio ──
    // CRITICAL: kill previous mic FIRST to prevent overlapping AudioContexts
    socket.on('start-sending-audio', () => {
      console.log('[Mic] Server requested audio stream');
      stopMicCapture();
      startMicCapture(socket);
    });

    // ── Prompts ──
    socket.on('interview-prompt', ({ message }) => {
      console.log('[Interview] Prompt:', message);
    });

    // ── Done ──
    socket.on('interview-complete', () => {
      stopMicCapture();
      setState('done');
    });
    socket.on('interview-error', ({ message }) => {
      console.error('[Interview] Error:', message);
      setError(message);
    });

    socketRef.current = socket;
    return () => { stopMicCapture(); socket.disconnect(); };
  }, [sessionId, token, stopMicCapture]);

  // ── Mic capture → PCM → server ──
  async function startMicCapture(socket) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      // Don't force sampleRate — browser ignores it. Use native rate and resample.
      const actx = new AudioContext();
      const nativeSR = actx.sampleRate;
      const targetSR = 16000;
      const ratio = nativeSR / targetSR;

      console.log(`[Mic] AudioContext sampleRate: ${nativeSR}Hz -> resampling to ${targetSR}Hz (ratio: ${ratio.toFixed(2)})`);

      const source = actx.createMediaStreamSource(stream);
      const processor = actx.createScriptProcessor(4096, 1, 1);

      sourceRef.current = source;
      processorRef.current = { processor, actx };

      let audioChunkCount = 0;

      processor.onaudioprocess = (e) => {
        const f32 = e.inputBuffer.getChannelData(0);

        // Resample from native rate (usually 48000) to 16000
        const outputLength = Math.floor(f32.length / ratio);
        const resampled = new Float32Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
          const srcIdx = Math.floor(i * ratio);
          resampled[i] = f32[Math.min(srcIdx, f32.length - 1)];
        }

        // Convert Float32 -> Int16 (PCM16 linear)
        const i16 = new Int16Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          i16[i] = Math.max(-32768, Math.min(32767, Math.round(resampled[i] * 32767)));
        }

        // Log first few chunks with audio level
        if (audioChunkCount < 3) {
          let maxVal = 0;
          for (let i = 0; i < i16.length; i++) {
            const abs = Math.abs(i16[i]);
            if (abs > maxVal) maxVal = abs;
          }
          console.log(`[Mic] Chunk ${audioChunkCount}: ${i16.length} samples, peak: ${maxVal}, bytes: ${i16.buffer.byteLength}`);
        }
        audioChunkCount++;

        socket.emit('audio-data', { sessionId, audio: i16.buffer });
      };

      source.connect(processor);
      processor.connect(actx.destination);
      console.log('[Mic] Capturing audio');
    } catch (e) {
      console.error('[Mic] Error:', e);
      setError('Microphone access failed');
    }
  }
  const startInterview = useCallback(() =>
    socketRef.current?.emit('start-interview', { sessionId }), [sessionId]);

  const endInterview = useCallback(() => {
    socketRef.current?.emit('end-interview', { sessionId });
    stopMicCapture();
  }, [sessionId, stopMicCapture]);

  const sendAttentionData = useCallback((dataPoints) =>
    socketRef.current?.emit('attention-data', { sessionId, dataPoints }), [sessionId]);

  return {
    state, questionIndex, totalQuestions, currentQuestion, transcript,
    isConnected, error, startInterview, endInterview, sendAttentionData
  };
}