import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TechCheckPage = () => {
  const { magicToken } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [sessionInfo, setSessionInfo] = useState(null);
  const [checks, setChecks] = useState({
    camera:     { status: 'pending', msg: 'Testing...' },
    microphone: { status: 'pending', msg: 'Testing...' },
    internet:   { status: 'pending', msg: 'Testing...' },
    browser:    { status: 'pending', msg: 'Testing...' }
  });

  // Fetch session info + temp token
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/v1/ai-interviews/join/${magicToken}`);
        setSessionInfo(data.data);

        // ✅ Store the temporary interview token
        if (data.data.token) {
          sessionStorage.setItem('interviewToken', data.data.token);
          sessionStorage.setItem('interviewSessionId', data.data.sessionId);
        }
      } catch {
        setSessionInfo({ error: 'Invalid or expired interview link.' });
      }
    })();
  }, [magicToken]);

  // Run checks
  useEffect(() => {
    (async () => {
      // Browser
      const ua = navigator.userAgent;
      const ok = /Chrome|Firefox|Edg/.test(ua);
      setChecks(p => ({
        ...p,
        browser: {
          status: ok ? 'passed' : 'warning',
          msg: ok ? 'Supported browser' : 'Chrome recommended for best experience'
        }
      }));

      // Camera + Mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setChecks(p => ({
          ...p,
          camera: { status: 'passed', msg: 'Camera working' },
          microphone: { status: 'passed', msg: 'Microphone detected' }
        }));
        // Stop tracks after check so they can be re-acquired on the live page
        // Actually keep them for preview, cleanup on unmount
      } catch {
        setChecks(p => ({
          ...p,
          camera: { status: 'failed', msg: 'Camera access denied — please allow permissions' },
          microphone: { status: 'failed', msg: 'Microphone access denied' }
        }));
      }

      // Internet
      try {
        const t = Date.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
        const ms = Date.now() - t;
        setChecks(p => ({
          ...p,
          internet: {
            status: ms < 500 ? 'passed' : ms < 1000 ? 'warning' : 'failed',
            msg: ms < 500 ? `Good connection (${ms}ms)` : `Slow connection (${ms}ms)`
          }
        }));
      } catch {
        setChecks(p => ({ ...p, internet: { status: 'failed', msg: 'No connection detected' } }));
      }
    })();

    // Cleanup camera on unmount
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const allOk = Object.values(checks).every(c => c.status !== 'failed' && c.status !== 'pending');
  const icon = { passed: '✅', warning: '⚠️', failed: '❌', pending: '⏳' };

  if (sessionInfo?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-red-600 text-lg font-semibold">{sessionInfo.error}</p>
          <p className="text-gray-500 text-sm mt-2">Please contact the recruiter for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-1">Pre-Interview Tech Check</h1>
        {sessionInfo && (
          <>
            <p className="text-gray-500 mb-1 text-sm">
              <strong>{sessionInfo.jobTitle}</strong> — {sessionInfo.totalQuestions} questions,
              ~{sessionInfo.estimatedDuration} min
            </p>
            {sessionInfo.candidateName && (
              <p className="text-gray-400 mb-4 text-sm">Welcome, {sessionInfo.candidateName}</p>
            )}
          </>
        )}

        <div className="bg-gray-900 rounded-xl overflow-hidden mb-6 aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(checks).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">{icon[v.status]}</span>
              <div>
                <p className="font-medium capitalize text-sm">{k}</p>
                <p className="text-xs text-gray-500">{v.msg}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(`/ai-interview/live/${sessionInfo.sessionId}`)}
          disabled={!allOk || !sessionInfo}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {allOk ? 'Continue to Interview' : 'Fix issues above to continue'}
        </button>
      </div>
    </div>
  );
};

export default TechCheckPage;