import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Manages the full interview lifecycle over Socket.io.
 * Handles: socket connection, state transitions, TTS playback,
 * mic audio streaming to server, and live transcript updates.
 */
export function useInterview(sessionId, token) {
  const [state, setState] = useState('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);

  useEffect(() => {
    // Socket.io connects to the raw server host, NOT the /api path
    // VITE_API_URL = http://localhost:5000/api  →  we need http://localhost:5000
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverHost = rawApiUrl.replace(/\/api\/?$/, ''); // strips trailing /api

    const socket = io(`${serverHost}/interview`, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-interview', { sessionId });
    });
    socket.on('disconnect', () => setIsConnected(false));

    // ── State changes ──
    socket.on('interview-state', ({ state: s, questionIndex: qi, totalQuestions: tq, questionText: qt }) => {
      setState(s);
      if (qi !== undefined) setQuestionIndex(qi);
      if (tq !== undefined) setTotalQuestions(tq);
      if (qt) { setCurrentQuestion(qt); setTranscript(''); }
    });

    // ── TTS audio playback ──
    const audioQueue = [];
    let isPlaying = false;

    socket.on('tts-audio-chunk', async ({ audio, isLast }) => {
      if (audio) {
        audioQueue.push(Uint8Array.from(atob(audio), c => c.charCodeAt(0)));
      }
      if (!isPlaying && audioQueue.length > 0) {
        isPlaying = true;
        await playQueue(audioQueue, () => { isPlaying = false; });
      }
    });

    // ── Live transcript ──
    socket.on('transcript-update', ({ text, isFinal, fullTranscript }) => {
      if (isFinal) setTranscript(fullTranscript || text);
    });

    // ── Server says: start sending mic audio ──
    socket.on('start-sending-audio', () => startMicCapture(socket));

    // ── Interview done ──
    socket.on('interview-complete', () => { stopMicCapture(); setState('done'); });
    socket.on('interview-error', ({ message }) => setError(message));

    socketRef.current = socket;
    return () => { stopMicCapture(); socket.disconnect(); };
  }, [sessionId, token]);

  // ── Audio playback helper ──
  async function playQueue(queue, onDone) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    while (queue.length > 0) {
      const chunk = queue.shift();
      try {
        const buf = await ctx.decodeAudioData(chunk.buffer.slice(0));
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
        await new Promise(r => { src.onended = r; });
      } catch (e) { console.error('[Audio] Playback error:', e); }
    }
    onDone();
  }

  // ── Mic capture → server ──
  async function startMicCapture(socket) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true }
      });
      mediaStreamRef.current = stream;

      const actx = new AudioContext({ sampleRate: 16000 });
      const source = actx.createMediaStreamSource(stream);
      const processor = actx.createScriptProcessor(4096, 1, 1);
      processorRef.current = { processor, actx };

      processor.onaudioprocess = (e) => {
        const f32 = e.inputBuffer.getChannelData(0);
        const i16 = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++) {
          i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767)));
        }
        socket.emit('audio-data', { sessionId, audio: i16.buffer });
      };

      source.connect(processor);
      processor.connect(actx.destination);
    } catch (e) {
      console.error('[Mic] Error:', e);
      setError('Microphone access failed');
    }
  }

  function stopMicCapture() {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    if (processorRef.current) {
      processorRef.current.processor.disconnect();
      processorRef.current.actx.close();
    }
  }

  const startInterview = useCallback(() =>
    socketRef.current?.emit('start-interview', { sessionId }), [sessionId]);

  const endInterview = useCallback(() => {
    socketRef.current?.emit('end-interview', { sessionId });
    stopMicCapture();
  }, [sessionId]);

  const sendAttentionData = useCallback((dataPoints) =>
    socketRef.current?.emit('attention-data', { sessionId, dataPoints }), [sessionId]);

  return {
    state, questionIndex, totalQuestions, currentQuestion, transcript,
    isConnected, error, startInterview, endInterview, sendAttentionData
  };
}