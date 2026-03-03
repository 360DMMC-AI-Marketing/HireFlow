import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Eye, Brain, Monitor, Plus, Play, Trash2, Link2,
  ArrowLeft, Video, Clock, BarChart3, CheckCircle2,
  XCircle, AlertCircle, Loader2, Mic, RefreshCw, Search,
  Download, Pause, Volume2, VolumeX, Maximize,
  SkipBack, SkipForward, FileText, Share2
} from "lucide-react";
import { useInterview } from "../../../hooks/useInterview";
import { useGazeTracking } from "../../../hooks/useGazeTracking";
import { useMediaRecorder } from "../../../hooks/useMediaRecorder";
import {
  getAIInterviewsByJob,
  createAIInterview,
  generateMagicLink,
  deleteAIInterview,
  getAnalysis
} from "../../../services/api/aiInterviewAPI";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API.replace('/api', '');
const getToken = () => localStorage.getItem('token');

const fmt = (s) => {
  if (s == null || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
};

// ─── Status & Score Badges ───────────────────────────────────────────────────

const statusConfig = {
  scheduled:     { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Scheduled' },
  'tech-check':  { color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Monitor, label: 'Tech Check' },
  'in-progress': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Play, label: 'In Progress' },
  completed:     { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Completed' },
  failed:        { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Failed' },
  cancelled:     { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle, label: 'Cancelled' }
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.cancelled;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const ScoreBadge = ({ score }) => {
  if (score == null) return <span className="text-slate-300 text-sm">—</span>;
  const color = score >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                score >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                'text-red-700 bg-red-50 border-red-200';
  return <span className={`text-sm font-bold px-2 py-0.5 rounded-md border ${color}`}>{score}</span>;
};

// ─── Attention Timeline (SVG) ────────────────────────────────────────────────

const AttentionTimeline = ({ attentionData, questions, duration, currentTime, onSeek }) => {
  const svgRef = useRef(null);
  const W = 800, H = 120;
  const PAD = { top: 10, right: 10, bottom: 25, left: 35 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const points = useMemo(() => {
    if (!attentionData?.length) return [];
    const step = Math.max(1, Math.floor(attentionData.length / 200));
    return attentionData.filter((_, i) => i % step === 0);
  }, [attentionData]);

  const maxTime = duration || (points.length ? Math.max(...points.map(p => p.timestamp)) : 60);
  const toX = useCallback((t) => PAD.left + (t / maxTime) * plotW, [maxTime]);
  const toY = useCallback((v) => PAD.top + plotH - (Math.min(100, Math.max(0, v || 0)) / 100) * plotH, []);

  const pathD = useMemo(() => {
    if (!points.length) return '';
    return points.map((p, i) =>
      (i === 0 ? 'M' : 'L') + toX(p.timestamp).toFixed(1) + ',' + toY(p.gazeScore).toFixed(1)
    ).join(' ');
  }, [points, toX, toY]);

  const areaD = useMemo(() => {
    if (!pathD || !points.length) return '';
    const b = PAD.top + plotH;
    const last = points[points.length - 1];
    return pathD + ' L' + toX(last.timestamp).toFixed(1) + ',' + b
      + ' L' + toX(points[0].timestamp).toFixed(1) + ',' + b + ' Z';
  }, [pathD, points, toX]);

  const qRegions = useMemo(() =>
    (questions || [])
      .filter(q => q.responseStartTime != null && q.responseEndTime != null)
      .map((q, i) => ({
        x: toX(q.responseStartTime),
        w: Math.max(2, toX(q.responseEndTime) - toX(q.responseStartTime)),
        label: 'Q' + (i + 1)
      })),
    [questions, toX]
  );

  const handleClick = (e) => {
    if (!svgRef.current || !onSeek) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (W / rect.width);
    onSeek(Math.max(0, Math.min(maxTime, ((clickX - PAD.left) / plotW) * maxTime)));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-sm">Attention Timeline</h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Gaze
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-200 inline-block" /> Answering
          </span>
        </div>
      </div>
      <svg ref={svgRef} viewBox={'0 0 ' + W + ' ' + H} className="w-full cursor-crosshair"
        onClick={handleClick} style={{ height: 'auto', maxHeight: 140 }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
              stroke="#e2e8f0" strokeWidth="0.5"
              strokeDasharray={v === 0 || v === 100 ? 'none' : '2,3'} />
            <text x={PAD.left - 4} y={toY(v) + 3} textAnchor="end"
              fill="#94a3b8" fontSize="8">{v}</text>
          </g>
        ))}
        {qRegions.map((r, i) => (
          <g key={'qr' + i}>
            <rect x={r.x} y={PAD.top} width={r.w} height={plotH}
              fill="#dbeafe" opacity="0.4" rx="2" />
            <text x={r.x + r.w / 2} y={H - 4} textAnchor="middle"
              fill="#64748b" fontSize="8" fontWeight="600">{r.label}</text>
          </g>
        ))}
        {areaD && <path d={areaD} fill="url(#gazeGrad)" opacity="0.3" />}
        {pathD && <path d={pathD} fill="none" stroke="#818cf8"
          strokeWidth="1.5" strokeLinejoin="round" />}
        {currentTime > 0 && (
          <line x1={toX(currentTime)} y1={PAD.top}
            x2={toX(currentTime)} y2={PAD.top + plotH}
            stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />
        )}
        {[0, 1, 2, 3, 4].map(i => {
          const t = (maxTime / 4) * i;
          return (
            <text key={'t' + i} x={toX(t)} y={H - 4}
              textAnchor="middle" fill="#94a3b8" fontSize="8">{fmt(t)}</text>
          );
        })}
        <defs>
          <linearGradient id="gazeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ─── Video Player ────────────────────────────────────────────────────────────

const VideoPlayer = ({ src, onTimeUpdate, registerSeek }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const seekTo = useCallback((t) => {
    if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); }
  }, []);

  useEffect(() => { if (registerSeek) registerSeek(seekTo); }, [seekTo, registerSeek]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    playing ? videoRef.current.pause() : videoRef.current.play();
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    if (onTimeUpdate) onTimeUpdate(t);
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const skip = (d) => {
    if (videoRef.current)
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + d));
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!src) return (
    <div className="bg-slate-900 rounded-2xl aspect-video flex flex-col items-center justify-center text-slate-500">
      <Video className="w-16 h-16 mb-3 text-slate-600" />
      <p className="text-sm font-medium">No recording available</p>
      <p className="text-xs text-slate-600 mt-1">Video was not recorded or has been removed.</p>
    </div>
  );

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden">
      <div className="relative aspect-video bg-black cursor-pointer" onClick={togglePlay}>
        <video ref={videoRef} src={src} className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
          onEnded={() => setPlaying(false)} playsInline />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-3 space-y-2">
        <div ref={progressRef} className="w-full h-1.5 bg-slate-700 rounded-full cursor-pointer group"
          onClick={handleProgressClick}>
          <div className="h-full bg-indigo-500 rounded-full relative transition-all"
            style={{ width: pct + '%' }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => skip(-10)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={() => skip(10)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
              <SkipForward className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-mono ml-2">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (videoRef.current) { videoRef.current.muted = !muted; setMuted(!muted); }
            }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={() => videoRef.current?.requestFullscreen?.()}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Synced Transcript ───────────────────────────────────────────────────────

const SyncedTranscript = ({ questions, currentTime, onSeekTo }) => {
  const activeRef = useRef(null);

  const activeIdx = useMemo(() => {
    if (currentTime == null) return -1;
    for (let i = 0; i < (questions || []).length; i++) {
      const q = questions[i];
      if (q.responseStartTime != null && q.responseEndTime != null &&
          currentTime >= q.responseStartTime && currentTime <= q.responseEndTime) return i;
    }
    return -1;
  }, [questions, currentTime]);

  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeIdx]);

  if (!questions?.length) return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500">No transcript data</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm">Interview Transcript</h3>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
          {questions.length} Questions
        </span>
      </div>
      <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-50">
        {questions.map((q, i) => {
          const active = i === activeIdx;
          return (
            <div key={i} ref={active ? activeRef : null}
              className={`px-4 py-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                active ? 'bg-indigo-50/60 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'
              }`}
              onClick={() => onSeekTo && q.responseStartTime != null && onSeekTo(q.responseStartTime)}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  active ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  Q{i + 1} · {q.questionType || q.type || 'general'}
                </span>
                {q.responseStartTime != null && (
                  <span className="text-[10px] text-slate-400 font-mono">{fmt(q.responseStartTime)}</span>
                )}
                {q.analysis?.score != null && <ScoreBadge score={q.analysis.score} />}
              </div>
              <p className={`text-xs font-medium mb-1.5 ${active ? 'text-indigo-900' : 'text-slate-700'}`}>
                {q.questionText}
              </p>
              {q.transcript
                ? <p className={`text-xs leading-relaxed ${active ? 'text-indigo-800/80' : 'text-slate-500'}`}>
                    {q.transcript}
                  </p>
                : <p className="text-xs text-slate-300 italic">No response recorded</p>
              }
              {q.attentionFlags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.attentionFlags.map((fl, j) => (
                    <span key={j} className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">
                      {fl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Playback View (Video + Transcript + Analysis) ──────────────────────────

const PlaybackView = ({ sessionId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [tab, setTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const seekFnRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { setData((await getAnalysis(sessionId)).data.data); }
      catch (e) { console.error('Analysis load failed:', e); }
      finally { setLoading(false); }
    })();
  }, [sessionId]);

  const seekTo = useCallback((t) => {
    if (seekFnRef.current) seekFnRef.current(t);
    setCurrentTime(t);
  }, []);

  const videoUrl = useMemo(() => {
    const url = data?.recordings?.video?.url || data?.recordings?.audio?.url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return BASE_URL + '/' + url.replace(/^\//, '');
  }, [data]);

  const downloadTranscript = () => {
    if (!data) return;
    let txt = 'INTERVIEW TRANSCRIPT\n';
    txt += '='.repeat(50) + '\n';
    txt += 'Date: ' + new Date(data.createdAt || Date.now()).toLocaleString() + '\n';
    txt += 'Duration: ' + fmt(data.duration) + '\n';
    txt += 'Overall Score: ' + (data.overallAnalysis?.overallScore ?? 'N/A') + '/100\n';
    txt += 'Attention Score: ' + (data.overallAttentionScore ?? 'N/A') + '%\n\n';

    (data.questions || []).forEach((q, i) => {
      txt += '-'.repeat(40) + '\n';
      txt += 'Q' + (i + 1) + ' [' + (q.questionType || q.type || 'general') + ']';
      if (q.analysis?.score != null) txt += ' — Score: ' + q.analysis.score + '/100';
      txt += '\n';
      txt += q.questionText + '\n\n';
      txt += 'RESPONSE (' + (q.responseDuration?.toFixed(0) || '?') + 's):\n';
      txt += (q.transcript || '(no response)') + '\n';
      if (q.analysis?.summary) txt += '\nAI Notes: ' + q.analysis.summary + '\n';
      if (q.attentionFlags?.length) txt += 'Flags: ' + q.attentionFlags.join(', ') + '\n';
      txt += '\n';
    });

    const o = data.overallAnalysis || {};
    if (o.summary) txt += '='.repeat(50) + '\nSUMMARY\n' + o.summary + '\n\n';
    if (o.strengths?.length) txt += 'STRENGTHS:\n' + o.strengths.map(s => '  + ' + s).join('\n') + '\n\n';
    if (o.concerns?.length) txt += 'CONCERNS:\n' + o.concerns.map(c => '  - ' + c).join('\n') + '\n';

    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'interview-transcript-' + sessionId.slice(-6) + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const shareLink = async () => {
    const url = window.location.origin + window.location.pathname + '?session=' + sessionId;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { alert('Link: ' + url); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-amber-800 font-bold">Analysis not ready</p>
        <p className="text-amber-600 text-sm mt-1">Still processing. Check back in a moment.</p>
      </div>
    </div>
  );

  const o = data.overallAnalysis || {};
  const recColor = {
    'strong-yes': 'bg-emerald-100 text-emerald-800',
    yes: 'bg-green-100 text-green-800',
    maybe: 'bg-amber-100 text-amber-800',
    no: 'bg-red-100 text-red-800',
    'strong-no': 'bg-red-200 text-red-900'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Back to Sessions
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Interview Playback</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {data.candidateId?.name || 'Candidate'} · {data.jobId?.title || 'Position'}
              {data.duration ? ' · ' + fmt(data.duration) : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={shareLink}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition ${
              copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}>
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button onClick={downloadTranscript}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
            <FileText className="w-4 h-4" /> Transcript
          </button>
          {videoUrl && (
            <a href={videoUrl} download
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
              <Download className="w-4 h-4" /> Video
            </a>
          )}
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Overall', val: o.overallScore, color: 'text-slate-900' },
          { label: 'Communication', val: o.communicationScore, color: 'text-blue-600' },
          { label: 'Technical', val: o.technicalScore, color: 'text-purple-600' },
          { label: 'Culture Fit', val: o.cultureFitScore, color: 'text-teal-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{val ?? '—'}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 font-medium mb-2">Verdict</p>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${recColor[o.recommendation] || 'bg-slate-100 text-slate-600'}`}>
            {o.recommendation?.replace('-', ' ').toUpperCase() || '—'}
          </span>
        </div>
      </div>

      {/* Video + Transcript Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <VideoPlayer src={videoUrl} onTimeUpdate={setCurrentTime}
            registerSeek={(fn) => { seekFnRef.current = fn; }} />
          <AttentionTimeline attentionData={data.attentionData} questions={data.questions}
            duration={data.duration} currentTime={currentTime} onSeek={seekTo} />
        </div>
        <div className="lg:col-span-2">
          <SyncedTranscript questions={data.questions} currentTime={currentTime} onSeekTo={seekTo} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {['overview', 'questions', 'resume'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-sm font-semibold transition border-b-2 ${
                tab === t ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {o.summary && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-2">Summary</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{o.summary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {o.strengths?.length > 0 && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                <h3 className="font-bold text-emerald-900 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {o.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {o.concerns?.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                <h3 className="font-bold text-red-900 mb-3">Concerns</h3>
                <ul className="space-y-2">
                  {o.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className="space-y-4">
          {(data.questions || []).map((q, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {q.questionType || q.type}
                    </span>
                    <ScoreBadge score={q.analysis?.score} />
                    {q.responseStartTime != null && (
                      <button onClick={() => seekTo(q.responseStartTime)}
                        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-mono flex items-center gap-1">
                        <Play className="w-3 h-3" /> {fmt(q.responseStartTime)}
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{q.questionText}</p>
                </div>
                {q.averageGazeScore != null && (
                  <span className="text-xs text-slate-500 ml-4 shrink-0 flex items-center gap-1">
                    <Eye className="w-3 h-3" />{q.averageGazeScore}%
                  </span>
                )}
              </div>
              {q.transcript && (
                <div className="bg-slate-50 rounded-lg p-3 mt-2">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                    Response ({q.responseDuration?.toFixed(0)}s)
                  </p>
                  <p className="text-sm text-slate-700">{q.transcript}</p>
                </div>
              )}
              {q.analysis?.summary && (
                <p className="text-xs text-slate-500 mt-2 italic">{q.analysis.summary}</p>
              )}
              {q.attentionFlags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.attentionFlags.map((fl, j) => (
                    <span key={j} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                      {fl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resume Comparison Tab */}
      {tab === 'resume' && (
        <div className="space-y-4">
          {o.resumeComparison ? (
            <>
              {o.resumeComparison.consistencies?.length > 0 && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                  <h3 className="font-bold text-emerald-900 mb-3">Consistencies with Resume</h3>
                  <ul className="space-y-2">
                    {o.resumeComparison.consistencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {o.resumeComparison.discrepancies?.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                  <h3 className="font-bold text-red-900 mb-3">Discrepancies</h3>
                  <ul className="space-y-2">
                    {o.resumeComparison.discrepancies.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {o.resumeComparison.additionalInsights?.length > 0 && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                  <h3 className="font-bold text-blue-900 mb-3">Additional Insights</h3>
                  <ul className="space-y-2">
                    {o.resumeComparison.additionalInsights.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                        <Eye className="w-4 h-4 mt-0.5 shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No resume comparison available</p>
              <p className="text-slate-400 text-sm mt-1">Resume data was not provided for this interview.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Session List ────────────────────────────────────────────────────────────

const SessionList = ({ onOpenSession, onViewResults }) => {
  const [sessions, setSessions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ jobId: '', candidateId: '', numQuestions: 5 });
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [jobsRes, candidatesRes] = await Promise.all([
        fetch(`${API}/jobs`, { headers }),
        fetch(`${API}/candidates`, { headers })
      ]);
      const jobsData = await jobsRes.json();
      const candidatesData = await candidatesRes.json();
      const jobsList = Array.isArray(jobsData) ? jobsData : jobsData.data || jobsData.jobs || [];
      setJobs(jobsList);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : candidatesData.data || candidatesData.candidates || []);

      const allSessions = [];
      for (const job of jobsList.slice(0, 10)) {
        try {
          const res = await getAIInterviewsByJob(job._id);
          if (res.data?.data) allSessions.push(...res.data.data);
        } catch { }
      }
      allSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(allSessions);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.jobId || !createForm.candidateId) return;
    setCreating(true);
    try {
      const res = await createAIInterview(createForm);
      setSessions(prev => [res.data.data, ...prev]);
      setShowCreate(false);
      setCreateForm({ jobId: '', candidateId: '', numQuestions: 5 });
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (sessionId) => {
    try {
      const res = await generateMagicLink(sessionId);
      await navigator.clipboard.writeText(res.data.data.link);
      setCopiedId(sessionId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await deleteAIInterview(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('Delete failed:', err.response?.status, msg);
      alert('Delete failed: ' + msg);
    }
    setDeleteConfirm(null);
  };

  const filtered = sessions.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      s.candidateId?.name?.toLowerCase().includes(term) ||
      s.candidateId?.email?.toLowerCase().includes(term) ||
      s.jobId?.title?.toLowerCase().includes(term);
    const matchFilter = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'in-progress').length,
    done: sessions.filter(s => s.status === 'completed').length,
    avgScore: (() => {
      const scored = sessions.filter(s => s.overallAnalysis?.overallScore != null);
      return scored.length ? Math.round(scored.reduce((a, s) => a + s.overallAnalysis.overallScore, 0) / scored.length) : null;
    })()
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Video Interviews</h1>
          <p className="text-slate-500 text-sm mt-1">Create, manage, and review AI-conducted interviews</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm shadow-indigo-200">
            <Plus className="w-4 h-4" /> New Interview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Video, label: 'Total', value: stats.total, bg: 'bg-slate-100', fg: 'text-slate-600' },
          { icon: Play, label: 'In Progress', value: stats.active, bg: 'bg-blue-100', fg: 'text-blue-600' },
          { icon: CheckCircle2, label: 'Completed', value: stats.done, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
          { icon: BarChart3, label: 'Avg Score', value: stats.avgScore ?? '—', bg: 'bg-amber-100', fg: 'text-amber-600' }
        ].map(({ icon: I, label, value, bg, fg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${bg}`}><I className={`w-4 h-4 ${fg}`} /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-lg">New AI Interview</h3>
            <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><XCircle className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Position</label>
              <select value={createForm.jobId} onChange={e => setCreateForm(p => ({ ...p, jobId: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="">Select job...</option>
                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Candidate</label>
              <select value={createForm.candidateId} onChange={e => setCreateForm(p => ({ ...p, candidateId: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="">Select candidate...</option>
                {candidates.map(c => <option key={c._id} value={c._id}>{c.name} — {c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Questions</label>
              <select value={createForm.numQuestions} onChange={e => setCreateForm(p => ({ ...p, numQuestions: parseInt(e.target.value) }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions (~{n * 2} min)</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
            <button onClick={handleCreate} disabled={!createForm.jobId || !createForm.candidateId || creating}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search candidate or job..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Video className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg">{sessions.length ? 'No matches' : 'No interviews yet'}</p>
          <p className="text-slate-400 text-sm mt-1">{sessions.length ? 'Adjust your search or filter.' : 'Click "New Interview" to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <div key={session._id} className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
              <div className="p-5 flex items-center gap-5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(session.candidateId?.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{session.candidateId?.name || 'Unknown'}</p>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="truncate">{session.jobId?.title || 'Unknown'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{session.questions?.length || 0} Qs</span>
                    <span className="text-slate-300">•</span>
                    <span>{new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {session.duration != null && (<><span className="text-slate-300">•</span><span>{Math.round(session.duration / 60)}m</span></>)}
                  </div>
                </div>
                <div className="text-center px-3 hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Score</p>
                  <ScoreBadge score={session.overallAnalysis?.overallScore} />
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {session.status === 'in-progress' && (
                    <button onClick={() => onOpenSession(session._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 border border-blue-200 transition">
                      <Play className="w-3.5 h-3.5" /> Rejoin
                    </button>
                  )}
                  {session.status === 'scheduled' && (
                    <>
                      <button onClick={() => handleCopyLink(session._id)}
                        className={`p-2 rounded-lg transition ${copiedId === session._id ? 'bg-green-50 text-green-600' : 'hover:bg-slate-100 text-slate-400'}`}
                        title={copiedId === session._id ? 'Copied!' : 'Copy candidate link'}>
                        {copiedId === session._id ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                      </button>
                      <button onClick={() => onOpenSession(session._id)}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition" title="Start session">
                        <Play className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {session.status === 'completed' && (
                    <button onClick={() => onViewResults(session._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition">
                      <BarChart3 className="w-3.5 h-3.5" /> Results
                    </button>
                  )}
                  {deleteConfirm === session._id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => handleDelete(session._id)} className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition">Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(session._id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Live Interview View ─────────────────────────────────────────────────────

const LiveSessionView = ({ sessionId, onBack }) => {
  const token = getToken() || sessionStorage.getItem('interviewToken');
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const { isRecording, isUploading, uploadProgress, startRecording, stopRecording, uploadRecording } = useMediaRecorder();
  const { state, questionIndex, totalQuestions, currentQuestion, transcript, isConnected, error, startInterview, endInterview, sendAttentionData } = useInterview(sessionId, token);

  const interviewActive = ['greeting', 'asking', 'listening', 'processing', 'closing'].includes(state);

  const { gazeScore, confidence, fps, isLoading, flushAttentionBuffer } = useGazeTracking(videoRef, interviewActive);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true
        });
        if (cancelled) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }
        console.log('[Camera] Stream ready:', mediaStream.getTracks().map(t => t.kind).join(', '));
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('[Camera] Failed:', err);
      }
    })();
    return () => {
      cancelled = true;
      setStream(prev => {
        if (prev) prev.getTracks().forEach(t => t.stop());
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (interviewActive && stream && !isRecording) {
      startRecording(stream);
    }
    if (state === 'done' && isRecording) {
      (async () => {
        const blob = await stopRecording();
        if (blob) await uploadRecording(sessionId, blob, token);
      })();
    }
  }, [state, stream, isRecording, interviewActive]);

  useEffect(() => {
    const iv = setInterval(() => {
      const d = flushAttentionBuffer();
      if (d.length) sendAttentionData(d);
    }, 5000);
    return () => clearInterval(iv);
  }, [flushAttentionBuffer, sendAttentionData]);

  useEffect(() => {
    if (!interviewActive) return;
    const iv = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [interviewActive]);

  const liveFmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const gc = gazeScore > 85 ? 12 : gazeScore > 60 ? 5 : -8;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Live Interview</h1>
            <p className="text-slate-500 text-xs mt-0.5">{state === 'idle' ? 'Ready to start' : state === 'done' ? 'Complete' : 'In progress'}</p>
          </div>
        </div>
        {!['idle', 'done'].includes(state) && (
          <button onClick={endInterview} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-red-700 transition flex items-center gap-2">
            <Monitor className="w-4 h-4" /> End Session
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden relative">
            {!['idle', 'done'].includes(state) && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <div className="px-3 py-1.5 bg-red-500/90 backdrop-blur rounded-full text-xs font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                </div>
                {isRecording && (
                  <div className="px-3 py-1.5 bg-slate-800/80 backdrop-blur rounded-full text-xs text-slate-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" /> Recording
                  </div>
                )}
              </div>
            )}
            <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Monitor className="w-14 h-14 mb-2 text-slate-600" />
                  <p className="text-sm">Camera loading...</p>
                </div>
              )}
            </div>
            <div className="bg-slate-800/90 backdrop-blur px-5 py-3 flex justify-between items-center">
              <div className="flex gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> Gaze: {gazeScore}%</span>
                <span className="flex items-center gap-1.5"><Mic className="w-4 h-4" /> Focus: {confidence}</span>
              </div>
              <span className="text-white font-mono text-lg tracking-wider">{liveFmt(elapsed)}</span>
            </div>
          </div>

          {currentQuestion && (
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-slate-700">Q{questionIndex + 1}/{totalQuestions}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 rounded-full h-2 transition-all duration-500" style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} />
                </div>
              </div>
              <p className="font-medium text-slate-800">{currentQuestion}</p>
              {(state === 'listening' || transcript) && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Transcript</span>
                    {state === 'listening' && <span className="flex items-center gap-1 text-xs text-emerald-600"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Listening</span>}
                  </div>
                  <div className="max-h-32 overflow-y-auto text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                    {transcript || <span className="text-slate-400 italic">Waiting...</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {state === 'idle' && (
            <div className="text-center py-4">
              <button onClick={startInterview} disabled={!isConnected || isLoading}
                className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shadow-indigo-200">
                {!isConnected ? 'Connecting...' : isLoading ? 'Loading AI...' : 'Start Interview'}
              </button>
            </div>
          )}

          {state === 'done' && (
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-800 font-bold text-lg">Interview Complete</p>
              {isUploading ? (
                <div className="mt-3">
                  <p className="text-emerald-600 text-sm">Uploading recording... {uploadProgress}%</p>
                  <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
                    <div className="bg-emerald-600 rounded-full h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-emerald-600 text-sm mt-1">Analysis is being generated.</p>
              )}
              <button onClick={onBack} disabled={isUploading} className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {isUploading ? 'Uploading...' : 'Back to Sessions'}
              </button>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        </div>

        <div className="space-y-4">
          {[
            { icon: Eye, label: 'Gaze Score', value: `${gazeScore}%`, extra: <span className={`text-xs font-semibold ${gc >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{gc >= 0 ? '↑' : '↓'}{Math.abs(gc)}%</span>, bg: 'bg-blue-50', fg: 'text-blue-600' },
            { icon: Brain, label: 'Confidence', value: confidence, bg: 'bg-purple-50', fg: 'text-purple-600' },
            { icon: Monitor, label: 'Frame Rate', value: `${fps}fps`, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
          ].map(({ icon: I, label, value, extra, bg, fg }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${bg}`}><I className={`w-5 h-5 ${fg}`} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{value}</span>
                  {extra}
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">AI Insights</h3>
            <div className="space-y-3">
              {gazeScore > 70 ? (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="font-semibold text-xs text-blue-900">Strong Eye Contact</p>
                  <p className="text-[11px] text-blue-700 mt-1">Consistent gaze throughout.</p>
                </div>
              ) : gazeScore > 40 ? (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="font-semibold text-xs text-amber-900">Moderate Attention</p>
                  <p className="text-[11px] text-amber-700 mt-1">Occasionally looking away.</p>
                </div>
              ) : (
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <p className="font-semibold text-xs text-red-900">Low Eye Contact</p>
                  <p className="text-[11px] text-red-700 mt-1">Frequently looking away.</p>
                </div>
              )}
              {state === 'listening' && gazeScore > 60 && (
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="font-semibold text-xs text-emerald-900">Clear Communication</p>
                  <p className="text-[11px] text-emerald-700 mt-1">Excellent pacing and clarity.</p>
                </div>
              )}
              {state === 'idle' && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="font-semibold text-xs text-slate-600">Waiting</p>
                  <p className="text-[11px] text-slate-500 mt-1">Insights appear after starting.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main View Router ────────────────────────────────────────────────────────

export const AIVideoView = () => {
  const [view, setView] = useState({ type: 'list' });

  switch (view.type) {
    case 'live':
      return <LiveSessionView sessionId={view.sessionId} onBack={() => setView({ type: 'list' })} />;
    case 'results':
      return <PlaybackView sessionId={view.sessionId} onBack={() => setView({ type: 'list' })} />;
    default:
      return (
        <SessionList
          onOpenSession={(id) => setView({ type: 'live', sessionId: id })}
          onViewResults={(id) => setView({ type: 'results', sessionId: id })}
        />
      );
  }
};