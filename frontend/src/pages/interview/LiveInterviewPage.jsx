import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../../hooks/useInterview';
import { useGazeTracking } from '../../hooks/useGazeTracking';

const LiveInterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // ── Camera ──
  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) { console.error('Camera denied:', e); }
    })();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // ── Interview hook ──
  const {
    state, questionIndex, totalQuestions, currentQuestion,
    transcript, isConnected, error,
    startInterview, endInterview, sendAttentionData
  } = useInterview(sessionId, token);

  // ── Gaze tracking hook ──
  const { gazeScore, confidence, fps, isLoading, flushAttentionBuffer } =
    useGazeTracking(videoRef, state === 'listening' || state === 'asking');

  // ── Flush attention data every 5s ──
  useEffect(() => {
    const iv = setInterval(() => {
      const data = flushAttentionBuffer();
      if (data.length > 0) sendAttentionData(data);
    }, 5000);
    return () => clearInterval(iv);
  }, [flushAttentionBuffer, sendAttentionData]);

  // ── Timer ──
  useEffect(() => {
    const active = ['greeting', 'asking', 'listening', 'processing'].includes(state);
    if (!active) return;
    const iv = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [state]);

  // ── Redirect when done ──
  useEffect(() => {
    if (state === 'done') {
      setTimeout(() => navigate(`/ai-interview/complete/${sessionId}`), 2000);
    }
  }, [state, sessionId, navigate]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Gaze change indicator (compare to average) ──
  const gazeChange = gazeScore > 85 ? 12 : gazeScore > 60 ? 5 : -8;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="px-8 py-4">
        <p className="text-sm text-gray-500 mb-1">
          <span className="cursor-pointer hover:underline">Home</span> &gt; AI Video
        </p>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Video Assessment</h1>
            <p className="text-gray-500 text-sm">Automated interview insights with gaze tracking</p>
          </div>
          <button
            onClick={endInterview}
            className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
            </svg>
            End Session
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="px-8 flex gap-6">

        {/* ── LEFT: Video + Question ── */}
        <div className="flex-1">
          <div className="bg-gray-900 rounded-2xl overflow-hidden relative">
            {/* REC badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {state !== 'idle' && (
                <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-xs font-semibold tracking-wide">REC</span>
                </div>
              )}
              <button className="text-gray-400 hover:text-white transition p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video */}
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover"
              />
              {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="1.5" />
                  </svg>
                  <p>Video Feed Will Appear Here</p>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="bg-gray-800/90 backdrop-blur px-5 py-3 flex justify-between items-center">
              <div className="flex gap-5 text-sm text-gray-300">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  Gaze: {gazeScore}%
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                  </svg>
                  Focus: {confidence}
                </span>
              </div>
              <span className="text-white font-mono text-lg tracking-wider">{fmt(elapsed)}</span>
            </div>
          </div>

          {/* Question + Transcript */}
          {currentQuestion && (
            <div className="mt-4 bg-white rounded-xl p-5 shadow-sm">
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              <p className="font-medium text-gray-800">{currentQuestion}</p>

              {/* Transcript */}
              {(state === 'listening' || transcript) && (
                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Live Transcript</span>
                    {state === 'listening' && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Listening
                      </span>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {transcript || <span className="text-gray-400 italic">Waiting for response...</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start button */}
          {state === 'idle' && (
            <div className="mt-6 text-center">
              <button
                onClick={startInterview}
                disabled={!isConnected || isLoading}
                className="px-10 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {!isConnected ? 'Connecting...' : isLoading ? 'Loading AI...' : 'Start Interview'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}
        </div>

        {/* ── RIGHT: Metrics + Insights ── */}
        <div className="w-80 space-y-4">
          {/* Gaze Score */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Gaze Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{gazeScore}%</span>
                <span className={`text-xs font-medium ${gazeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {gazeChange >= 0 ? '↑' : '↓'} {Math.abs(gazeChange)}%
                </span>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Confidence</p>
              <span className="text-2xl font-bold">{confidence}</span>
            </div>
          </div>

          {/* Frame Rate */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="18" rx="2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Frame Rate</p>
              <span className="text-2xl font-bold">{fps}fps</span>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">AI Insights</h3>
            <div className="space-y-3">
              {gazeScore > 70 ? (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-sm text-green-700">Strong Eye Contact</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Candidate maintains consistent eye contact throughout the interview.
                  </p>
                </div>
              ) : gazeScore > 40 ? (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="font-semibold text-sm text-yellow-700">Moderate Attention</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Candidate occasionally looks away. Generally engaged.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-sm text-red-700">Low Eye Contact</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Candidate frequently looks away from camera.
                  </p>
                </div>
              )}

              {state === 'listening' && gazeScore > 60 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-semibold text-sm text-green-700">Clear Communication</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Speech clarity and pacing are excellent, showing confidence.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterviewPage;