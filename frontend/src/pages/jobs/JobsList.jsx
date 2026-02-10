import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';

const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jobs');
      setJobs(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={fetchJobs}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Job Management</h1>
            <p className="text-slate-500 mt-1">Multi-platform distribution & internal tracking</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/jobs/create')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Button>
        </div>



        {/* Jobs Display */}
        {jobs.length === 0 ? (
          // Empty State
          <div className="bg-gray-50 rounded-lg border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No jobs found
              </h3>
              <p className="text-slate-600 mb-6">
                {jobs.length === 0
                  ? "No jobs yet. Create your first job posting!"
                  : "Try adjusting your filters to see more results."}
              </p>
              {jobs.length === 0 && (
                <Button
                  onClick={() => navigate('/dashboard/jobs/create')}
                  className="flex items-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Job
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} onUpdate={fetchJobs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;
