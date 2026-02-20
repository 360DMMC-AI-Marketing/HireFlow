import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/utils/axios';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, ExternalLink, Loader2, Unplug, Plug,
  Mail, Calendar, Linkedin, Briefcase, Settings
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const integrations = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Sync interviews with Google Calendar, send calendar invites automatically.',
    icon: Calendar,
    color: 'text-red-500',
    bg: 'bg-red-50',
    configFields: [],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Post jobs to LinkedIn and import candidate profiles.',
    icon: Linkedin,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    configFields: [
      { key: 'autoPost', label: 'Auto-post new jobs', type: 'toggle' },
    ],
  },
  {
    id: 'indeed',
    name: 'Indeed',
    description: 'Distribute job postings to Indeed via XML feed.',
    icon: Briefcase,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    configFields: [],
  },
  {
    id: 'email',
    name: 'Email (SMTP)',
    description: 'Transactional email delivery for candidate communications.',
    icon: Mail,
    color: 'text-green-600',
    bg: 'bg-green-50',
    configFields: [],
    alwaysConnected: true,
  },
];

export default function IntegrationsPage() {
  const [searchParams] = useSearchParams();
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [configs, setConfigs] = useState({});

  useEffect(() => {
    checkStatuses();
    // Handle OAuth return
    const integration = searchParams.get('integration');
    if (integration) {
      const [platform, result] = integration.split('_');
      if (result === 'success') {
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
        checkStatuses();
      } else if (result === 'failed') {
        toast.error(`Failed to connect ${platform}`);
      }
    }
  }, [searchParams]);

  const checkStatuses = async () => {
    try {
      setLoading(true);
      // Check user profile for integration tokens
      const { data } = await api.get('/user/profile');
      const user = data?.user;
      const s = {};
      if (user?.integrations?.google?.accessToken) s.google = true;
      if (user?.integrations?.linkedin?.accessToken) s.linkedin = true;
      if (user?.integrations?.indeed?.accessToken) s.indeed = true;
      s.email = true; // SMTP is always connected via env
      setStatuses(s);
    } catch {
      // Fallback: assume disconnected
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platformId) => {
    setConnecting(platformId);
    // Redirect to OAuth flow
    window.location.href = `${API_BASE}/integrations/${platformId}`;
  };

  const handleDisconnect = async (platformId) => {
    if (!window.confirm(`Disconnect ${platformId}?`)) return;
    try {
      setConnecting(platformId);
      await api.put('/user/profile', { 
        [`integrations.${platformId}`]: { accessToken: null, refreshToken: null, tokenExpiry: null } 
      });
      setStatuses(prev => ({ ...prev, [platformId]: false }));
      toast.success(`${platformId.charAt(0).toUpperCase() + platformId.slice(1)} disconnected`);
    } catch (err) {
      toast.error('Failed to disconnect');
    } finally {
      setConnecting(null);
    }
  };

  const toggleConfig = (platformId, key) => {
    setConfigs(prev => ({
      ...prev,
      [platformId]: { ...prev[platformId], [key]: !prev[platformId]?.[key] }
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-56 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">Connect external services to enhance your recruitment workflow.</p>
      {integrations.map(intg => {
        const Icon = intg.icon;
        const isConnected = !!statuses[intg.id];
        const isLoading = connecting === intg.id;

        return (
          <div key={intg.id} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-sm transition">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 ${intg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={24} className={intg.color} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-gray-900">{intg.name}</h4>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 size={10} /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">
                      <XCircle size={10} /> Not Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{intg.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {intg.alwaysConnected ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border">
                        <Settings size={14} className="inline mr-1" /> Configured via ENV
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>SMTP settings are configured in server environment variables.</TooltipContent>
                  </Tooltip>
                ) : isConnected ? (
                  <button
                    onClick={() => handleDisconnect(intg.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />} Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(intg.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Connect
                  </button>
                )}
              </div>
            </div>

            {/* Config fields (if connected and has config) */}
            {isConnected && intg.configFields.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-6">
                {intg.configFields.map(f => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={configs[intg.id]?.[f.key] || false}
                      onChange={() => toggleConfig(intg.id, f.key)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
