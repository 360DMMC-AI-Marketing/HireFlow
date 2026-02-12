import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  MoreVertical,
  Edit,
  Pause,
  Play,
  XCircle,
  Copy,
  Trash2,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  Star,
  ExternalLink
} from 'lucide-react';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchJobDetails();
    fetchCandidates();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/candidates');
      // Filter candidates for this specific job
      const jobCandidates = response.data.filter(c => c.jobId === id);
      setCandidates(jobCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  // Calculate analytics from candidates
  const analytics = {
    totalApplicants: candidates.length,
    screenedApplicants: candidates.filter(c => c.status === 'Screening').length,
    interviewsScheduled: candidates.filter(c => c.status === 'Interview').length,
    interviewsCompleted: candidates.filter(c => ['Offer', 'Hired'].includes(c.status)).length,
    topCandidates: candidates.filter(c => c.matchScore >= 80).length
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/jobs/${id}/status`, { status: newStatus });
      setJob(prev => ({ ...prev, status: newStatus }));
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update job status');
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await api.post(`/jobs/${id}/duplicate`);
      navigate(`/dashboard/jobs/${response.data._id}`);
    } catch (error) {
      console.error('Error duplicating job:', error);
      alert('Failed to duplicate job');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/jobs/${id}`);
      navigate('/dashboard/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const openStatusDialog = (action) => {
    setActionType(action);
    setShowStatusDialog(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Draft: 'bg-gray-100 text-gray-800 border-gray-300',
      Active: 'bg-green-100 text-green-800 border-green-300',
      Paused: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Closed: 'bg-red-100 text-red-800 border-red-300'
    };
    return variants[status] || variants.Draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600">Job not found</p>
          <Button onClick={() => navigate('/dashboard/jobs')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                <Badge className={`${getStatusBadge(job.status)} border`}>
                  {job.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>📍 {job.location} {job.isRemote && '(Remote)'}</span>
                <span>🏢 {job.department}</span>
                <span>💼 {job.employmentType}</span>
                {job.salary?.min && job.salary?.max && (
                  <span>💰 {job.salary.currency} {job.salary.min} - {job.salary.max}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/dashboard/jobs/${id}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {job.status === 'Active' ? (
                    <DropdownMenuItem onClick={() => openStatusDialog('pause')}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Job
                    </DropdownMenuItem>
                  ) : job.status === 'Paused' ? (
                    <DropdownMenuItem onClick={() => openStatusDialog('resume')}>
                      <Play className="w-4 h-4 mr-2" />
                      Resume Job
                    </DropdownMenuItem>
                  ) : null}
                  {job.status !== 'Closed' && (
                    <DropdownMenuItem onClick={() => openStatusDialog('close')}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Job
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applicants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.totalApplicants}
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Screened</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.screenedApplicants}
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Interviews Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.interviewsScheduled}
                </div>
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Interviews Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.interviewsCompleted}
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Top Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.topCandidates}
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: job.description }} />
                
                {job.responsibilities && (
                  <>
                    <h3>Responsibilities</h3>
                    <p className="whitespace-pre-wrap">{job.responsibilities}</p>
                  </>
                )}

                {job.requirements && (
                  <>
                    <h3>Requirements</h3>
                    <p className="whitespace-pre-wrap">{job.requirements}</p>
                  </>
                )}

                {job.benefits && (
                  <>
                    <h3>Benefits</h3>
                    <p className="whitespace-pre-wrap">{job.benefits}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Candidate Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Applied', count: analytics.totalApplicants, color: 'bg-indigo-600' },
                    { label: 'Screened', count: analytics.screenedApplicants, color: 'bg-blue-600' },
                    { label: 'Interview Scheduled', count: analytics.interviewsScheduled, color: 'bg-yellow-600' },
                    { label: 'Interviewed', count: analytics.interviewsCompleted, color: 'bg-green-600' },
                    { label: 'Recommended', count: analytics.topCandidates, color: 'bg-purple-600' }
                  ].map((stage, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                        <span className="text-sm font-bold text-slate-900">{stage.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stage.color} transition-all`}
                          style={{
                            width: `${analytics.totalApplicants > 0 ? (stage.count / analytics.totalApplicants) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => navigate(`/dashboard/candidates?jobId=${id}`)}
                >
                  View All Candidates ({candidates.length})
                </Button>
              </CardContent>
            </Card>

            {/* Recent Candidates */}
            {candidates.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Applicants</CardTitle>
                    <Badge variant="secondary">{candidates.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {candidates.slice(0, 5).map((candidate) => (
                      <div
                        key={candidate._id}
                        onClick={() => navigate(`/dashboard/candidates/${candidate._id}`)}
                        className="p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {candidate.name || 'Unknown'}
                              </h4>
                              {candidate.matchScore >= 80 && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              {candidate.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{candidate.email}</span>
                                </span>
                              )}
                              {candidate.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  {candidate.phone}
                                </span>
                              )}
                            </div>
                            {candidate.location && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                <MapPinIcon className="w-3 h-3" />
                                {candidate.location}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3">
                            {candidate.matchScore > 0 && (
                              <Badge 
                                className={
                                  candidate.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                                  candidate.matchScore >= 60 ? 'bg-amber-100 text-amber-800' :
                                  candidate.matchScore >= 40 ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {candidate.matchScore}%
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {candidate.status || 'New'}
                            </Badge>
                          </div>
                        </div>
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{candidate.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {candidates.length > 5 && (
                      <Button
                        variant="link"
                        className="w-full text-indigo-600 hover:text-indigo-700"
                        onClick={() => navigate(`/dashboard/candidates?jobId=${id}`)}
                      >
                        View All {candidates.length} Applicants <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Screening Criteria */}
            {job.screeningCriteria && job.screeningCriteria.requiredSkills?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Screening Criteria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {job.screeningCriteria.requiredSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {job.screeningCriteria.minYearsExperience > 0 && (
                    <div>
                      <div className="text-sm font-medium text-slate-700 mb-1">Experience</div>
                      <div className="text-sm text-slate-600">
                        Minimum {job.screeningCriteria.minYearsExperience} years
                      </div>
                    </div>
                  )}

                  {job.screeningCriteria.educationLevel && (
                    <div>
                      <div className="text-sm font-medium text-slate-700 mb-1">Education</div>
                      <div className="text-sm text-slate-600">
                        {job.screeningCriteria.educationLevel}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Distribution & Application Link */}
            <Card>
              <CardHeader>
                <CardTitle>Application Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Public Application URL */}
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="text-sm font-semibold text-indigo-900 mb-2">
                    📋 Public Application URL
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-indigo-700 bg-white px-3 py-2 rounded border border-indigo-200 break-all">
                      {window.location.origin}/apply/{job._id}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/apply/${job._id}`);
                        alert('Application link copied to clipboard!');
                      }}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">
                    Share this link to receive applications directly
                  </p>
                </div>

                {/* Distribution Channels */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Distribution Channels</div>
                  {job.distribution?.linkedin?.enabled && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">LinkedIn</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Active
                      </Badge>
                    </div>
                  )}
                  {job.distribution?.indeed?.enabled && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">Indeed</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Active
                      </Badge>
                    </div>
                  )}
                  {job.distribution?.hireflowPortal?.enabled && (
                    <div className="text-sm">
                      <div className="text-slate-700 mb-1">HireFlow Portal</div>
                      <a
                        href={`https://hireflow.com/apply/${job.distribution.hireflowPortal.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline text-xs break-all"
                      >
                        {`hireflow.com/apply/${job.distribution.hireflowPortal.slug}`}
                      </a>
                    </div>
                  )}
                  {job.distribution?.emailApplications?.enabled && (
                    <div className="text-sm">
                      <div className="text-slate-700 mb-1">Email Applications</div>
                      <div className="text-xs text-slate-600 break-all">
                        {job.distribution.emailApplications.email}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Info */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-600">Created</div>
                  <div className="font-medium">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Last Updated</div>
                  <div className="font-medium">
                    {new Date(job.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                {job.isAIGenerated && (
                  <Badge variant="secondary" className="w-full justify-center">
                    AI-Generated Content
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Change Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === 'pause' && 'Pause this job?'}
                {actionType === 'resume' && 'Resume this job?'}
                {actionType === 'close' && 'Close this job?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === 'pause' && 'New applications will not be accepted while the job is paused.'}
                {actionType === 'resume' && 'The job will be active again and accept new applications.'}
                {actionType === 'close' && 'Mark this position as filled? All candidates will be archived.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (actionType === 'pause') handleStatusChange('Paused');
                  if (actionType === 'resume') handleStatusChange('Active');
                  if (actionType === 'close') handleStatusChange('Closed');
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All candidate applications for this job will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default JobDetailPage;
