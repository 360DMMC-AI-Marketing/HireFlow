import React, { useState, useEffect } from 'react';
import api from '@/utils/axios'; // Make sure this path matches your project structure
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, RotateCcw, Mail, Send, Loader2, RefreshCw } from 'lucide-react';

const statusConfig = {
  sent:      { label: 'Sent',      icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  queued:    { label: 'Queued',    icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
  scheduled: { label: 'Scheduled', icon: Send,        color: 'text-blue-600', bg: 'bg-blue-50' },
  failed:    { label: 'Failed',    icon: XCircle,     color: 'text-red-600', bg: 'bg-red-50' },
  retrying:  { label: 'Retrying',  icon: RotateCcw,   color: 'text-orange-600', bg: 'bg-orange-50' },
};

const EmailActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Calls: GET /api/emails
      const { data } = await api.get('/emails'); 
      setLogs(data?.emails || []);
    } catch (err) {
      console.error('Error fetching email logs:', err);
      toast.error('Failed to load email activity');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id) => {
    try {
      setResending(id);
      // Calls: POST /api/emails/:id/resend
      await api.post(`/emails/${id}/resend`);
      toast.success('Email queued for resending!');
      
      // Refresh logs to get updated status from the database
      fetchLogs(); 
    } catch (err) {
      console.error('Error resending email:', err);
      // Show specific error message from your backend if available
      const errorMessage = err.response?.data?.message || 'Failed to resend email';
      toast.error(errorMessage);
    } finally {
      setResending(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.queued;
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 ${config.color} ${config.bg} px-2.5 py-1 rounded-full text-xs font-semibold w-fit`}>
        <Icon size={12} strokeWidth={2.5} /> {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Email Activity Log</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Track sent emails, status, and resend failed ones.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          <Mail className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-600 font-medium">No email activity yet.</p>
          <p className="text-gray-400 text-sm mt-1">Emails sent to candidates will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(item => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.to}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.templateName}</td>
                  <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {item.sentAt 
                      ? new Date(item.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                      : item.createdAt 
                        ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                        : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'failed' && (
                      <button 
                        onClick={() => handleResend(item._id)}
                        disabled={resending === item._id}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {resending === item._id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmailActivityPage;