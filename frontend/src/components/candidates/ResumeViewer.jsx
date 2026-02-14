import { useState } from 'react';
import { FileText, Download, ExternalLink, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * ResumeViewer — displays a candidate's PDF resume inline using an iframe,
 * with download and fullscreen options.
 * 
 * Props:
 *   candidateId  - candidate _id (required)
 *   resumeFileName - original file name (optional, used for display)
 *   resumePath - path on server (optional, used to determine if resume exists)
 */
const ResumeViewer = ({ candidateId, resumeFileName, resumePath }) => {
  const [showViewer, setShowViewer] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!candidateId || !resumePath) {
    return null; // No resume to display
  }

  const token = localStorage.getItem('token');
  // Build the resume URL with auth token as query param for iframe access
  const resumeUrl = `${API_URL}/candidates/${candidateId}/resume?token=${encodeURIComponent(token || '')}`;
  const downloadUrl = `${resumeUrl}&download=true`;

  const isPdf = (resumeFileName || resumePath || '').toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    // Create a temporary link to trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = resumeFileName || 'resume.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    window.open(resumeUrl, '_blank');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Resume
            </div>
            <div className="flex items-center gap-2">
              {isPdf && !showViewer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowViewer(true); setLoadError(false); }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View
                </Button>
              )}
              {isPdf && showViewer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewer(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              {isPdf && (
                <Button variant="ghost" size="sm" onClick={handleOpenNewTab}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showViewer && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <FileText className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {resumeFileName || 'resume.pdf'}
                </p>
                <p className="text-xs text-slate-500">
                  {isPdf ? 'PDF Document — Click "View" to preview' : 'Document file — Click "Download" to open'}
                </p>
              </div>
            </div>
          )}

          {showViewer && isPdf && (
            <div className={`relative border rounded-lg overflow-hidden bg-slate-100 ${fullscreen ? '' : ''}`}>
              <div className="flex items-center justify-between px-3 py-2 bg-slate-200 border-b">
                <span className="text-xs font-medium text-slate-600 truncate">
                  {resumeFileName || 'resume.pdf'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setFullscreen(!fullscreen)}
                >
                  {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </Button>
              </div>
              {loadError ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="w-10 h-10 mb-3 text-slate-400" />
                  <p className="text-sm font-medium">Unable to load PDF preview</p>
                  <p className="text-xs mt-1">Try downloading the file instead</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ) : (
                <iframe
                  src={resumeUrl}
                  className="w-full border-0"
                  style={{ height: fullscreen ? '80vh' : '500px' }}
                  title="Resume Viewer"
                  onError={() => setLoadError(true)}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen overlay */}
      {showViewer && fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-slate-900">{resumeFileName || 'Resume'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setFullscreen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <iframe
              src={resumeUrl}
              className="flex-1 w-full border-0"
              title="Resume Viewer Fullscreen"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ResumeViewer;
