import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';

const AddCandidatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null); // TRACK FILE

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', linkedIn: '',
    title: '', positionApplied: '', source: 'HireFlow Direct',
    status: 'New', summary: '', matchScore: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // PATH A: Upload Resume (AI Engine)
      if (resumeFile) {
        const data = new FormData();
        data.append('resume', resumeFile);
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone || '');
        data.append('location', formData.location || '');
        data.append('linkedIn', formData.linkedIn || '');
        data.append('coverLetter', formData.summary || '');
        data.append('positionApplied', formData.positionApplied || 'General');
        data.append('source', formData.source || 'HireFlow Direct');
        
        // Remove Content-Type header to let browser set it with boundary
        await api.post('/candidates/apply', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Resume uploaded! AI is analyzing...');
      } 
      // PATH B: Manual Entry (Your existing logic)
      else {
        await api.post('/candidates', formData);
        alert('Candidate added manually!');
      }
      navigate('/dashboard/candidates');
    } catch (error) {
      console.error(error);
      alert('Error adding candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
           <button onClick={() => navigate('/dashboard/candidates')} className="flex items-center text-slate-600 mb-4">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back
           </button>
           <h1 className="text-3xl font-bold">Add New Candidate</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. RESUME UPLOAD SECTION (Fixed) */}
          <Card className="mb-6">
            <CardHeader><CardTitle>Resume Upload (Optional)</CardTitle></CardHeader>
            <CardContent>
              {!resumeFile ? (
                <label className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 cursor-pointer block">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p>Click to upload PDF/DOCX</p>
                  <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx"/>
                </label>
              ) : (
                <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="text-indigo-600"/>
                    <span className="font-medium">{resumeFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setResumeFile(null)}><X className="w-4 h-4"/></button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. MANUAL FIELDS (Only show if no resume selected, OR keep as overrides) */}
          {/* Paste your existing form fields here (Name, Email, Status, etc.) */}
          {/* ... */}
          
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : resumeFile ? 'Upload & Parse with AI' : 'Add Manually'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddCandidatePage;