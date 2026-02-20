import React, { useState, useEffect } from 'react';
import api from '@/utils/axios';
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
      await api.post(`/emails/${id}/resend`);
      toast.success('Email resent successfully');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to resend email');
    } finally {
      setResending(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.queued;
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 ${config.color} ${config.bg} px-2 py-1 rounded-full text-xs font-medium w-fit`}>
        <Icon size={12} /> {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4 items-center px-6 py-4 border-b last:border-0">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Activity Log</h2>
          <p className="text-gray-500 text-sm">Track sent emails, status, and resend failed ones.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <Mail className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No email activity yet.</p>
          <p className="text-gray-400 text-sm mt-1">Emails sent to candidates will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">Recipient</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">Template</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">Date</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(item => (
                <tr key={item._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.to}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.templateName}</td>
                  <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.sentAt ? new Date(item.sentAt).toLocaleString() : item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'failed' && (
                      <button 
                        onClick={() => handleResend(item._id)}
                        disabled={resending === item._id}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium disabled:opacity-50"
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