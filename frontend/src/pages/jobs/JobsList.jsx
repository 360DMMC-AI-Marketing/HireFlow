import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming you have this, or use standard <input>
import { 
  Plus, 
  Filter, 
  Search, 
  X,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';

const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED DATA (Unique Departments) ---
  const uniqueDepartments = useMemo(() => {
    const depts = jobs.map(job => job.department).filter(Boolean);
    return [...new Set(depts)];
  }, [jobs]);

  // --- FILTERING LOGIC ---
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 1. Search (Title or Location)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        job.title?.toLowerCase().includes(searchLower) || 
        job.location?.toLowerCase().includes(searchLower);

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

      // 3. Department Filter
      const matchesDept = departmentFilter === 'all' || job.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    }).sort((a, b) => {
      // 4. Date Sorting
      const dateA = new Date(a.createdAt || a.postedAt);
      const dateB = new Date(b.createdAt || b.postedAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [jobs, searchQuery, statusFilter, departmentFilter, sortOrder]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setSortOrder('newest');
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

        {/* --- FILTER BAR --- */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-2">
              <select 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Department Dropdown */}
            <div className="md:col-span-3">
              <select 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="md:col-span-2">
              <button 
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors text-slate-600"
              >
                <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Clear Filters (Only shows if filters are active) */}
            <div className="md:col-span-1 flex items-center justify-center">
              {(searchQuery || statusFilter !== 'all' || departmentFilter !== 'all') && (
                <button 
                  onClick={clearFilters}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear Filters"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Jobs Display */}
        {filteredJobs.length === 0 ? (
          // Empty State
          <div className="bg-gray-50 rounded-lg border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {jobs.length === 0 ? "No jobs found" : "No matching jobs"}
              </h3>
              <p className="text-slate-600 mb-6">
                {jobs.length === 0
                  ? "No jobs yet. Create your first job posting!"
                  : "Try adjusting your filters or search query to see results."}
              </p>
              {jobs.length === 0 ? (
                <Button
                  onClick={() => navigate('/dashboard/jobs/create')}
                  className="flex items-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Job
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters} className="mx-auto">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job._id} job={job} onUpdate={fetchJobs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;