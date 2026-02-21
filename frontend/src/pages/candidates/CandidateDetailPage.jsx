import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Download,
  Calendar,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import ResumeViewer from '@/components/candidates/ResumeViewer';

const CandidateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const response = await api.get(`/candidates/${id}`);
      setCandidate(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SMART ACTION HANDLERS ---

  // 1. Schedule Interview -> Updates status to 'Interview' (Backend automatically generates link & emails it)
  const handleSchedule = async () => {
    const jobId = candidate?.jobId?._id || candidate?.jobId;
    if (!jobId) {
      toast.error("Error: This candidate is not linked to a Job ID.");
      return;
    }

    setActionLoading(true);
    try {
      setCandidate(prev => ({ ...prev, status: 'Interview' }));
      await api.patch(`/candidates/${id}/status`, { status: 'Interview' });

      toast.success("Interview Initiated!", {
        description: "An email with the scheduling link has been sent directly to the candidate.",
        duration: 5000
      });

      navigate('/dashboard/interviews/settings');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to initiate scheduling';
      toast.error(msg);
      fetchCandidate(); // Revert optimistic update
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Reject Candidate -> Sets Status to 'Rejected' (Backend sends email)
  const handleReject = async () => {
    if (!confirm("Are you sure? This will reject the candidate and automatically send a rejection email.")) return;

    setActionLoading(true);
    try {
      setCandidate(prev => ({ ...prev, status: 'Rejected' })); // Optimistic
      await api.patch(`/candidates/${id}/status`, { status: 'Rejected' });
      toast.success("Candidate Rejected", { description: "Rejection email sent." });
    } catch (error) {
      toast.error("Failed to reject candidate");
      fetchCandidate(); // Revert
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Hire Candidate -> Sets Status to 'Hired'
  const handleHire = async () => {
    if (!confirm("Confirm hiring this candidate? This will automatically send an offer/hiring email.")) return;

    setActionLoading(true);
    try {
      setCandidate(prev => ({ ...prev, status: 'Hired' })); // Optimistic
      await api.patch(`/candidates/${id}/status`, { status: 'Hired' });
      toast.success("Candidate Hired!", { description: "Hiring email sent successfully." });
    } catch (error) {
      toast.error("Failed to hire candidate");
      fetchCandidate(); // Revert
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Send Generic Email (No status change)
  const handleSendEmail = async () => {
    toast.info("Email feature coming soon");
  };

  // --- HELPERS ---

  const getStatusBadge = (status) => {
    const variants = {
      New: 'bg-blue-100 text-blue-800 border-blue-300',
      Screening: 'bg-purple-100 text-purple-800 border-purple-300',
      Interview: 'bg-amber-100 text-amber-800 border-amber-300',
      Offer: 'bg-green-100 text-green-800 border-green-300',
      Hired: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      Rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return variants[status] || variants.New;
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-600 text-white';
    if (score >= 60) return 'bg-amber-500 text-white';
    if (score >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading candidate...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-10 text-center">
        <div className="text-red-500 mb-4">Error: {error || 'Candidate not found'}</div>
        <Button onClick={() => navigate('/dashboard/candidates')}>Back to Candidates</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/candidates')}
            className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700">
                      {candidate.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">{candidate.name}</h1>
                      <p className="text-slate-600 mt-1">{candidate.title || 'Candidate'}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge className={`${getStatusBadge(candidate.status)} border`}>
                          {candidate.status}
                        </Badge>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBadge(candidate.matchScore || 0)}`}>
                          {candidate.matchScore || 0}% Match
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {candidate.resumePath && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/candidates/${candidate._id}/resume?download=true&token=${encodeURIComponent(token || '')}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-5 h-5" />
                    <span>{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="w-5 h-5" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin className="w-5 h-5" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                  {candidate.linkedIn && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Linkedin className="w-5 h-5" />
                      <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {candidate.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{candidate.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Resume Viewer */}
            <ResumeViewer 
              candidateId={candidate._id}
              resumeFileName={candidate.resumeFileName}
              resumePath={candidate.resumePath}
            />

            {/* Experience */}
            {candidate.experience && candidate.experience.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-indigo-200 pl-4">
                      <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                      <p className="text-slate-600">{exp.company}</p>
                      <p className="text-sm text-slate-500">{exp.duration}</p>
                      {exp.description && (
                        <p className="text-slate-600 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {candidate.education && candidate.education.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-slate-900">{edu.degree}</h3>
                      <p className="text-slate-600">{edu.institution}</p>
                      <p className="text-sm text-slate-500">{edu.year}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions & Timeline */}
          <div className="space-y-6">
            
            {/* --- SMART ACTIONS CARD --- */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                {/* 1. Schedule (Hidden if Hired/Rejected) */}
                {['New', 'Screening', 'Interview', 'Applied'].includes(candidate.status) && (
                  <Button 
                    onClick={handleSchedule}
                    disabled={actionLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}

                {/* 2. Send Email */}
                <Button 
                  onClick={handleSendEmail} 
                  disabled={actionLoading}
                  variant="outline" 
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>

                {/* 3. Hire Candidate */}
                {!['Hired', 'Rejected'].includes(candidate.status) && (
                  <Button 
                    onClick={handleHire}
                    disabled={actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Hire Candidate
                  </Button>
                )}
                
                {/* 4. Reject Candidate */}
                {!['Hired', 'Rejected'].includes(candidate.status) && (
                  <Button 
                    onClick={handleReject}
                    disabled={actionLoading}
                    variant="outline" 
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  >
                    Reject Candidate
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailPage;