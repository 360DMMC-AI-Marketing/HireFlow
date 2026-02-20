import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'sonner';
import api from '@/utils/axios';
import { 
  Plus, Mail, Edit2, Trash2, Eye, 
  Send, ChevronLeft, Save, Sparkles, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState({ name: '', subject: '', body: '' });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const sampleData = {
    candidate_name: "Alex Rivera",
    job_title: "Senior Full Stack Engineer",
    company_name: "HireFlow AI",
    interview_date: "Monday at 2:00 PM"
  };

  // Fetch templates from backend
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/email-templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!currentTemplate.name?.trim() || !currentTemplate.subject?.trim()) {
      toast.error('Template name and subject are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: currentTemplate.name.trim(),
        subject: currentTemplate.subject.trim(),
        bodyHtml: currentTemplate.body,
        variables: Object.keys(sampleData),
      };

      if (editingId) {
        const { data } = await api.put(`/email-templates/${editingId}`, payload);
        setTemplates(prev => prev.map(t => (t._id === editingId ? data : t)));
        toast.success('Template updated');
      } else {
        const { data } = await api.post('/email-templates', payload);
        setTemplates(prev => [data, ...prev]);
        toast.success('Template created');
      }
      setIsEditing(false);
      setEditingId(null);
      setCurrentTemplate({ name: '', subject: '', body: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/email-templates/${id}`);
      setTemplates(prev => prev.filter(t => t._id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  // Edit existing
  const handleEdit = (template) => {
    setEditingId(template._id);
    setCurrentTemplate({
      name: template.name,
      subject: template.subject,
      body: template.bodyHtml || '',
    });
    setIsPreviewMode(false);
    setIsEditing(true);
  };

  // Test send
  const handleTestSend = async () => {
    if (!testEmail?.trim()) {
      toast.error('Enter an email address for test send');
      return;
    }
    try {
      setSendingTest(true);
      await api.post('/email-templates/test-send', {
        templateName: currentTemplate.name,
        email: testEmail.trim(),
        data: sampleData,
      });
      toast.success(`Test email sent to ${testEmail}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test send failed');
    } finally {
      setSendingTest(false);
    }
  };

  const renderPreview = (content) => {
    let preview = content || '';
    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, `<span class="bg-blue-100 text-blue-700 px-1 rounded font-medium">${sampleData[key]}</span>`);
    });
    return preview;
  };

  const insertPlaceholder = (placeholder) => {
    setCurrentTemplate(prev => ({
      ...prev,
      body: prev.body + ` {{${placeholder}}} `
    }));
  };

  // Skeleton loading
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white border border-gray-200 p-5 rounded-xl">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen bg-gray-50/50">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
                <p className="text-gray-500">Standardize your communication with candidates.</p>
              </div>
              <button 
                onClick={() => { 
                  setEditingId(null);
                  setCurrentTemplate({ name: '', subject: '', body: '' }); 
                  setIsPreviewMode(false);
                  setIsEditing(true); 
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                <Plus size={18} /> Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
                  <Mail className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No templates found. Create your first one!</p>
                </div>
              ) : (
                templates.map((t) => (
                  <div key={t._id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-lg text-gray-800 truncate flex-1">{t.name}</h3>
                      {t.category && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium ml-2 whitespace-nowrap">
                          {t.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4 truncate">{t.subject}</p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(t)} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(t._id)} className="p-2 hover:bg-red-50 rounded text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="border-b p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50">
              <button onClick={() => { setIsEditing(false); setEditingId(null); }} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft size={20} /> Back to list
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
                >
                  {isPreviewMode ? <Edit2 size={18} /> : <Eye size={18} />}
                  {isPreviewMode ? 'Back to Editor' : 'Live Preview'}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingId ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-6">
                {!isPreviewMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Interview Invite - Initial Screen"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentTemplate.name}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                      <input 
                        type="text" 
                        placeholder="Invitation to interview for {{job_title}}"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        value={currentTemplate.subject}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, subject: e.target.value})}
                      />
                    </div>
                    <div className="h-80">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                      <ReactQuill 
                        theme="snow" 
                        className="h-64 rounded-lg"
                        value={currentTemplate.body}
                        onChange={(val) => setCurrentTemplate({...currentTemplate, body: val})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-inner min-h-[400px]">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      Subject: <span dangerouslySetInnerHTML={{ __html: renderPreview(currentTemplate.subject) }} />
                    </h2>
                    <hr className="my-4 border-gray-100" />
                    <div 
                      className="prose prose-blue max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderPreview(currentTemplate.body) }}
                    />
                  </div>
                )}
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-4 text-sm">
                    <Sparkles size={16} className="text-blue-600" /> Placeholders
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">Click to insert into body</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(sampleData).map(key => (
                      <button 
                        key={key}
                        onClick={() => insertPlaceholder(key)}
                        className="text-xs bg-white border border-gray-200 px-2 py-1.5 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {`{{${key}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">Test Send</h4>
                  <p className="text-xs text-blue-700 mb-3">Send a preview to your email.</p>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <button 
                    onClick={handleTestSend}
                    disabled={sendingTest || !currentTemplate.name}
                    className="w-full flex justify-center items-center gap-2 bg-white text-blue-600 border border-blue-200 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
                  >
                    {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {sendingTest ? 'Sending...' : 'Send Test Email'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailTemplatesPage;