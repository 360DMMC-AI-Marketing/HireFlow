import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, Briefcase, Clock, Award, Download, ChevronDown,
  Activity, BarChart3, Target, ArrowUpRight, ArrowDownRight, Loader2,
  FileText, Eye, Zap, RefreshCw
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const get = async (path) => {
  const res = await fetch(`${API}/analytics${path}`, { headers: headers() });
  const json = await res.json();
  return json.data || json;
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const FUNNEL_COLORS = { New: '#6366f1', Applied: '#818cf8', Screening: '#f59e0b', Interview: '#3b82f6', Offer: '#10b981', Hired: '#059669', Rejected: '#ef4444' };

// ─── Small Components ────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo', trend }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 hover:shadow-sm transition">
    <div className={`p-2.5 rounded-xl bg-${color}-50`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {trend != null && (
      <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const SectionTitle = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-indigo-600" />
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    {action}
  </div>
);

const ChartCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>{children}</div>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <BarChart3 className="w-10 h-10 mb-2" />
    <p className="text-sm">{message}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Analytics View ─────────────────────────────────────

export const AnalyticsView = () => {
  const [overview, setOverview] = useState(null);
  const [velocity, setVelocity] = useState([]);
  const [sources, setSources] = useState([]);
  const [scores, setScores] = useState([]);
  const [timeMetrics, setTimeMetrics] = useState(null);
  const [topCandidates, setTopCandidates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [jobComparison, setJobComparison] = useState([]);
  const [tierUsage, setTierUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, vel, src, sc, tm, tc, act, jc, tu] = await Promise.all([
        get('/overview'),
        get('/application-velocity?days=14'),
        get('/sources'),
        get('/score-distribution'),
        get('/time-metrics'),
        get('/top-candidates?limit=10'),
        get('/activity?limit=15'),
        get('/job-comparison'),
        get('/tier-usage')
      ]);
      setOverview(ov); setVelocity(vel?.data || vel || []);
      setSources(src); setScores(sc);
      setTimeMetrics(tm); setTopCandidates(tc);
      setActivity(act); setJobComparison(jc);
      setTierUsage(tu);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

   const handleExport = (type) => {
    const token = localStorage.getItem('token');
    window.open(`${API}/analytics/export/${type}?token=${token}`, '_blank');
  };
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm">Loading analytics...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pipeline', label: 'Pipeline', icon: Target },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Recruitment performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="relative">
            <button onClick={() => handleExport('candidates')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              <Download className="w-4 h-4" /> Export Candidates
            </button>
          </div>
          <button onClick={() => handleExport('jobs')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <Download className="w-4 h-4" /> Export Jobs
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={overview?.totalJobs} color="indigo" />
        <StatCard icon={Users} label="Total Candidates" value={overview?.totalCandidates} color="blue" />
        <StatCard icon={Clock} label="Avg Time to Hire" value={overview?.avgTimeToHire ? `${overview.avgTimeToHire}d` : '—'} color="amber" />
        <StatCard icon={Award} label="Avg Match Score" value={overview?.avgMatchScore || '—'} sub="out of 100" color="emerald" />
      </div>

      {/* AI Interview Stats */}
      {overview?.aiInterviews?.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Eye} label="AI Interviews" value={overview.aiInterviews.total} color="purple" />
          <StatCard icon={Zap} label="Completed" value={overview.aiInterviews.completed} color="emerald" />
          <StatCard icon={Award} label="Avg AI Score" value={overview.aiInterviews.avgScore || '—'} color="indigo" />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition border-b-2 ${
                activeTab === t.id ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Overview Tab ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Application Velocity */}
          <ChartCard>
            <SectionTitle icon={TrendingUp} title="Application Velocity (14 days)" />
            {velocity.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocity}>
                    <defs>
                      <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="applicants" stroke="#6366f1" strokeWidth={2} fill="url(#appGrad)" name="Applicants" />
                    <Area type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={2} fill="url(#hireGrad)" name="Hires" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="No application data yet" />}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sources */}
            <ChartCard>
              <SectionTitle icon={Target} title="Application Sources" />
              {sources.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sources} dataKey="count" nameKey="name" cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 -mt-2">
                    {sources.map((s, i) => (
                      <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {s.name} ({s.percentage}%)
                      </span>
                    ))}
                  </div>
                </div>
              ) : <EmptyState message="No source data yet" />}
            </ChartCard>

            {/* Score Distribution */}
            <ChartCard>
              <SectionTitle icon={BarChart3} title="Score Distribution" />
              {scores.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scores}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]} barSize={40}>
                        {scores.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState message="No scored candidates yet" />}
            </ChartCard>
          </div>

          {/* Time Metrics */}
          {timeMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg Time to Screen</p>
                <p className="text-3xl font-bold text-indigo-600">{timeMetrics.screening?.avgDays || 0}<span className="text-sm text-slate-400 ml-1">days</span></p>
                <p className="text-xs text-slate-400 mt-1">{timeMetrics.screening?.count || 0} candidates</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg Time to Interview</p>
                <p className="text-3xl font-bold text-blue-600">{timeMetrics.interview?.avgDays || 0}<span className="text-sm text-slate-400 ml-1">days</span></p>
                <p className="text-xs text-slate-400 mt-1">{timeMetrics.interview?.count || 0} candidates</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg Time to Hire</p>
                <p className="text-3xl font-bold text-emerald-600">{timeMetrics.hire?.avgDays || 0}<span className="text-sm text-slate-400 ml-1">days</span></p>
                <p className="text-xs text-slate-400 mt-1">{timeMetrics.hire?.count || 0} candidates</p>
              </div>
            </div>
          )}

          {/* Usage / Tier */}
          {tierUsage && (
            <ChartCard>
              <SectionTitle icon={Zap} title={`Plan Usage — ${(tierUsage.plan || 'free').charAt(0).toUpperCase() + (tierUsage.plan || 'free').slice(1)}`} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(tierUsage.usage || {}).map(([key, val]) => {
                  const pct = val.unlimited ? 0 : val.limit > 0 ? Math.min(100, Math.round((val.used / val.limit) * 100)) : 0;
                  const danger = !val.unlimited && pct >= 80;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-sm text-slate-500">
                          {val.used}{val.unlimited ? '' : ` / ${val.limit}`}
                        </p>
                      </div>
                      {!val.unlimited && (
                        <div className="w-full h-2 bg-slate-100 rounded-full">
                          <div className={`h-2 rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {val.unlimited && <p className="text-xs text-emerald-600 font-medium">Unlimited</p>}
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* ═══ Pipeline Tab ═══ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Funnel */}
          <ChartCard>
            <SectionTitle icon={Target} title="Recruitment Funnel" />
            {overview?.funnel?.length > 0 ? (
              <div className="space-y-3">
                {overview.funnel.filter(s => s.stage !== 'Rejected').map((stage, i) => {
                  const max = Math.max(...overview.funnel.map(s => s.count), 1);
                  const pct = Math.round((stage.count / max) * 100);
                  return (
                    <div key={stage.stage} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-600 w-24">{stage.stage}</span>
                      <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 3)}%`, background: FUNNEL_COLORS[stage.stage] || '#94a3b8' }}>
                          <span className="text-xs font-bold text-white">{stage.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {overview.funnel.find(s => s.stage === 'Rejected')?.count > 0 && (
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100">
                    <span className="text-sm font-medium text-red-500 w-24">Rejected</span>
                    <span className="text-sm text-red-500 font-bold">{overview.funnel.find(s => s.stage === 'Rejected').count}</span>
                  </div>
                )}
              </div>
            ) : <EmptyState message="No pipeline data yet" />}
          </ChartCard>

          {/* Job Comparison */}
          <ChartCard>
            <SectionTitle icon={Briefcase} title="Job Comparison" />
            {jobComparison.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Job Title</th>
                      <th className="text-left py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Dept</th>
                      <th className="text-center py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Status</th>
                      <th className="text-center py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Candidates</th>
                      <th className="text-center py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Hired</th>
                      <th className="text-center py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Avg Score</th>
                      <th className="text-center py-3 px-2 font-semibold text-slate-500 text-xs uppercase">Conv %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobComparison.map(j => (
                      <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="py-3 px-2 font-medium text-slate-900">{j.title}</td>
                        <td className="py-3 px-2 text-slate-500">{j.department}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            j.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                            j.status === 'Closed' ? 'bg-slate-100 text-slate-500' :
                            'bg-amber-50 text-amber-700'
                          }`}>{j.status}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-semibold text-slate-900">{j.candidates}</td>
                        <td className="py-3 px-2 text-center font-semibold text-emerald-600">{j.hired}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold ${j.avgScore >= 70 ? 'text-emerald-600' : j.avgScore >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {j.avgScore || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-semibold text-indigo-600">{j.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState message="No jobs to compare yet" />}
          </ChartCard>

          {/* Departments */}
          {overview?.departments?.length > 0 && (
            <ChartCard>
              <SectionTitle icon={Briefcase} title="Jobs by Department" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.departments} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Jobs" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* ═══ Candidates Tab ═══ */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <ChartCard>
            <SectionTitle icon={Award} title="Top Candidates by Match Score" />
            {topCandidates.length > 0 ? (
              <div className="space-y-2">
                {topCandidates.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate">{c.position} {c.department ? `· ${c.department}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.skills?.length > 0 && (
                        <div className="hidden lg:flex gap-1">
                          {c.skills.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.status === 'Hired' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'Interview' ? 'bg-blue-50 text-blue-700' :
                        c.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{c.status}</span>
                      <span className={`text-lg font-bold ${
                        c.score >= 70 ? 'text-emerald-600' : c.score >= 40 ? 'text-amber-600' : 'text-red-500'
                      }`}>{c.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No scored candidates yet" />}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sources */}
            <ChartCard>
              <SectionTitle icon={Target} title="Candidates by Source" />
              {sources.length > 0 ? (
                <div className="space-y-3">
                  {sources.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-700 flex-1">{s.name}</span>
                      <span className="text-sm font-bold text-slate-900">{s.count}</span>
                      <span className="text-xs text-slate-400 w-10 text-right">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No source data" />}
            </ChartCard>

            {/* Score Distribution */}
            <ChartCard>
              <SectionTitle icon={BarChart3} title="Match Score Distribution" />
              {scores.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scores}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState message="No scores yet" />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ═══ Activity Tab ═══ */}
      {activeTab === 'activity' && (
        <ChartCard>
          <SectionTitle icon={Activity} title="Recent Activity" />
          {activity.length > 0 ? (
            <div className="space-y-1">
              {activity.map((item, i) => {
                const typeStyles = {
                  application: { bg: 'bg-indigo-100', fg: 'text-indigo-600', icon: Users },
                  status_change: { bg: 'bg-amber-100', fg: 'text-amber-600', icon: ArrowUpRight },
                  job: { bg: 'bg-emerald-100', fg: 'text-emerald-600', icon: Briefcase },
                  interview: { bg: 'bg-purple-100', fg: 'text-purple-600', icon: Eye }
                };
                const style = typeStyles[item.type] || typeStyles.application;
                const Icon = style.icon;
                const time = new Date(item.timestamp);
                const ago = Math.round((Date.now() - time) / 60000);
                const timeStr = ago < 60 ? `${ago}m ago` : ago < 1440 ? `${Math.round(ago / 60)}h ago` : `${Math.round(ago / 1440)}d ago`;

                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                    <div className={`p-2 rounded-lg ${style.bg} shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${style.fg}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">{item.message}</p>
                      {item.detail && <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{timeStr}</span>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState message="No recent activity" />}
        </ChartCard>
      )}
    </div>
  );
};