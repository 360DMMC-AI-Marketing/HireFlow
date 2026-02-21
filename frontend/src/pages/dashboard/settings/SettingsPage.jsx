import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/utils/axios';
import { toast } from 'sonner';
import IntegrationsPage from '../integrations/IntegrationsPage';
import { 
  Building, Share2, CreditCard, Users, Upload, Plus, Trash2, 
  Loader2, Save, Palette, Globe
} from 'lucide-react';

// ─── Tab components ──────────────────────────────────────────

const CompanyTab = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', website: '', industry: 'Technology', size: '1-10', description: '', logo: '' });
  const [branding, setBranding] = useState({ primaryColor: '#6366f1', secondaryColor: '#818cf8' });
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data } = await api.get('/company');
        if (data?.company) {
          const c = data.company;
          setCompany(c);
          setForm({ name: c.name || '', website: c.website || '', industry: c.industry || 'Technology', size: c.size || '1-10', description: c.description || '', logo: c.logo || '' });
          setBranding(c.branding || { primaryColor: '#6366f1', secondaryColor: '#818cf8' });
          setMembers(c.members || []);
        }
      } catch { /* No company yet */ }
      finally { setLoading(false); }
    };
    fetchCompany();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...form, branding };
      const endpoint = company ? '/company' : '/company';
      const method = company ? 'put' : 'post';
      const { data } = await api[method](endpoint, payload);
      setCompany(data.company);
      toast.success(company ? 'Company updated' : 'Company created');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save company');
    } finally { setSaving(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      const { data } = await api.post('/company/members', { email: inviteEmail.trim(), role: inviteRole });
      setMembers(data.company?.members || []);
      setInviteEmail('');
      toast.success('Team member added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally { setInviting(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      const { data } = await api.delete(`/company/members/${userId}`);
      setMembers(data.company?.members || []);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-8">
      {/* Company Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building size={18} /> Company Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {form.logo ? <img src={form.logo} alt="Logo" className="w-full h-full object-cover" /> : <Upload size={20} className="text-gray-400" />}
          </div>
          <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Upload Logo <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Inc."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><Globe size={14} className="inline mr-1" />Website</label>
            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              {['Technology','Healthcare','Finance','Retail','Manufacturing','Education','Real Estate','Consulting','Other'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              {['1-10','11-50','51-200','201-500','500+'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="About your company..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
        </div>
      </div>

      {/* Branding */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Palette size={18} /> Branding</h3>
        <div className="flex gap-6">
          {[{ key: 'primaryColor', label: 'Primary Color' }, { key: 'secondaryColor', label: 'Secondary Color' }].map(c => (
            <div key={c.key} className="flex items-center gap-3">
              <input type="color" value={branding[c.key]} onChange={e => setBranding({ ...branding, [c.key]: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
              <div>
                <p className="text-sm font-medium text-gray-700">{c.label}</p>
                <p className="text-xs text-gray-400">{branding[c.key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {company ? 'Update Company' : 'Create Company'}
        </button>
      </div>

      {/* Team Members */}
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users size={18} /> Team Members</h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="team@example.com"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleInvite} disabled={inviting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition whitespace-nowrap">
            {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Member
          </button>
        </div>
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No team members yet.</p>
          ) : members.map(m => {
            const u = m.user || {};
            return (
              <div key={u._id || m._id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {(u.firstName?.[0] || '?').toUpperCase()}{(u.lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.firstName || ''} {u.lastName || ''}</p>
                    <p className="text-xs text-gray-500">{u.email || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full capitalize">{m.role}</span>
                  <button onClick={() => handleRemoveMember(u._id)} className="p-1 text-red-400 hover:text-red-600 transition" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BillingTab = () => (
  <div className="text-center py-16">
    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <CreditCard className="text-indigo-400" size={36} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">Billing & Subscription</h3>
    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
      Manage your plan, payment methods, and invoices. We're working hard to bring you a seamless billing experience.
    </p>
    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-5 py-2.5 rounded-xl text-sm font-semibold mb-8">
      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
      Coming Soon
    </div>
    
    {/* Plan preview cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-4">
      {[
        { name: 'Free', price: '$0', desc: '5 jobs, 50 candidates', current: true },
        { name: 'Pro', price: '$49', desc: 'Unlimited jobs & candidates' },
        { name: 'Enterprise', price: '$199', desc: 'Custom integrations & SSO' },
      ].map(plan => (
        <div 
          key={plan.name}
          className={`p-4 rounded-xl border ${plan.current ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}
        >
          <p className="text-sm font-bold text-gray-900">{plan.name}</p>
          <p className="text-2xl font-black text-indigo-600 my-1">{plan.price}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
          <p className="text-xs text-gray-500">{plan.desc}</p>
          {plan.current && (
            <span className="inline-block mt-2 text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              Current Plan
            </span>
          )}
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-400 mt-6">You'll be notified when paid plans become available.</p>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'company';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Switch tab when ?tab= changes (e.g. from OAuth redirect)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const tabs = [
    { id: 'company', label: 'Company', icon: <Building size={18} /> },
    { id: 'integrations', label: 'Integrations', icon: <Share2 size={18} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account, company, and integrations.</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-8 -mx-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
              activeTab === tab.id 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'company' && <CompanyTab />}
        {activeTab === 'integrations' && <IntegrationsPage />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  );
};

export default SettingsPage;