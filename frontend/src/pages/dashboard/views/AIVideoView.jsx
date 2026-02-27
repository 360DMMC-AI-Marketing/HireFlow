import React, { useState, useEffect, useRef } from "react";
import {
  Eye, Brain, Monitor, Plus, Play, Trash2, Link2,
  ArrowLeft, Video, Clock, BarChart3, CheckCircle2,
  XCircle, AlertCircle, Loader2, Mic, RefreshCw, Search
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
const getToken = () => localStorage.getItem('token');

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

// ─── Results View ────────────────────────────────────────────────────────────

const ResultsView = ({ sessionId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData((await getAnalysis(sessionId)).data.data); }
      catch (e) { console.error('Analysis load failed:', e); }
      finally { setLoading(false); }
    })();
  }, [sessionId]);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  if (!data) return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-amber-800 font-bold">Analysis not ready</p>
        <p className="text-amber-600 text-sm mt-1">Still processing. Check back in a moment.</p>
      </div>
    </div>
  );

  const o = data.overallAnalysis || {};
  const recColor = { 'strong-yes': 'bg-emerald-100 text-emerald-800', yes: 'bg-green-100 text-green-800', maybe: 'bg-amber-100 text-amber-800', no: 'bg-red-100 text-red-800', 'strong-no': 'bg-red-200 text-red-900' };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back to Sessions</button>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interview Analysis</h1>
        <p className="text-slate-500 text-sm mt-1">{data.duration ? `${Math.round(data.duration / 60)} min` : ''} • Attention: {data.overallAttentionScore ?? 'N/A'}%</p>
      </div>

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
            <ul className="space-y-2">{o.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{s}</li>
            ))}</ul>
          </div>
        )}
        {o.concerns?.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <h3 className="font-bold text-red-900 mb-3">Concerns</h3>
            <ul className="space-y-2">{o.concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{c}</li>
            ))}</ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">Question Breakdown</h3>
        <div className="space-y-4">
          {(data.questions || []).map((q, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{q.type}</span>
                    <ScoreBadge score={q.analysis?.score} />
                  </div>
                  <p className="text-sm font-medium text-slate-800">{q.questionText}</p>
                </div>
                {q.averageGazeScore != null && (
                  <span className="text-xs text-slate-500 ml-4 shrink-0 flex items-center gap-1"><Eye className="w-3 h-3" />{q.averageGazeScore}%</span>
                )}
              </div>
              {q.transcript && (
                <div className="bg-slate-50 rounded-lg p-3 mt-2">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Response ({q.responseDuration?.toFixed(0)}s)</p>
                  <p className="text-sm text-slate-700">{q.transcript}</p>
                </div>
              )}
              {q.analysis?.summary && <p className="text-xs text-slate-500 mt-2 italic">{q.analysis.summary}</p>}
              {q.attentionFlags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.attentionFlags.map((f, j) => (
                    <span key={j} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Live Interview View ─────────────────────────────────────────────────────

const LiveSessionView = ({ sessionId, onBack }) => {
  const token = getToken() || sessionStorage.getItem('interviewToken');
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // ═══════════════════════════════════════════════════
  // HOOKS FIRST — React requires consistent hook order
  // ═══════════════════════════════════════════════════

  const { isRecording, isUploading, uploadProgress, startRecording, stopRecording, uploadRecording } = useMediaRecorder();
  const { state, questionIndex, totalQuestions, currentQuestion, transcript, isConnected, error, startInterview, endInterview, sendAttentionData } = useInterview(sessionId, token);

  const interviewActive = ['greeting', 'asking', 'listening', 'processing', 'closing'].includes(state);

  const { gazeScore, confidence, fps, isLoading, flushAttentionBuffer } = useGazeTracking(videoRef, interviewActive);

  // ═══════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════

  // ── Camera: get video+audio stream, attach to <video> element ──
  // Audio included so MediaRecorder captures both tracks.
  // Video element is muted so candidate doesn't hear echo.
  // useInterview creates a SEPARATE 16kHz audio stream for Deepgram.
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

  // ── Recording: start when interview active + stream ready, stop on done ──
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

  // ── Flush gaze data to server every 5s ──
  useEffect(() => {
    const iv = setInterval(() => {
      const d = flushAttentionBuffer();
      if (d.length) sendAttentionData(d);
    }, 5000);
    return () => clearInterval(iv);
  }, [flushAttentionBuffer, sendAttentionData]);

  // ── Elapsed timer ──
  useEffect(() => {
    if (!interviewActive) return;
    const iv = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [interviewActive]);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
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
              <span className="text-white font-mono text-lg tracking-wider">{fmt(elapsed)}</span>
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
      return <ResultsView sessionId={view.sessionId} onBack={() => setView({ type: 'list' })} />;
    default:
      return (
        <SessionList
          onOpenSession={(id) => setView({ type: 'live', sessionId: id })}
          onViewResults={(id) => setView({ type: 'results', sessionId: id })}
        />
      );
  }
};