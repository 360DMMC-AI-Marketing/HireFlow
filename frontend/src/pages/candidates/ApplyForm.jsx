import { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom'; 
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, CheckCircle, FileText, Loader2 } from 'lucide-react';

const ApplyForm = () => {
  const { jobId } = useParams(); // Get Job ID from URL (e.g., /apply/:jobId)
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'CompanySite';

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('source', source);
    if (jobId) formData.append('jobId', jobId);
    // Add minimum required fields for the backend
    formData.append('name', 'Applicant'); // You should add input fields for these
    formData.append('email', 'applicant@example.com'); // Placeholder

    try {
      await api.post('/candidates/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Application Received!</h2>
          <p className="text-slate-600">Thanks for applying. We'll be in touch soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Join Our Team</h1>
          <p className="text-slate-600 mt-2">Upload your resume to apply instantly.</p>
        </div>

        <Card className="border-0 shadow-xl ring-1 ring-slate-200">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Upload Box */}
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'
              }`}>
                {!file ? (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <span className="text-sm font-medium text-slate-700">Click to upload Resume</span>
                    <p className="text-xs text-slate-500 mt-1">PDF or DOCX (Max 5MB)</p>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  </label>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="w-10 h-10 text-indigo-600 mb-3" />
                    <span className="font-medium text-slate-900">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)}
                      className="text-xs text-red-500 mt-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-lg bg-indigo-600 hover:bg-indigo-700"
                disabled={!file || status === 'uploading'}
              >
                {status === 'uploading' ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by HireFlow AI
        </p>
      </div>
    </div>
  );
};

export default ApplyForm;