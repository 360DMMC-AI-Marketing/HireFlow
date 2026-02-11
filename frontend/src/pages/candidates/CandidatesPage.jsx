import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  X,
  ArrowUpDown,
  Download,
  Mail,
  Trash2,
  Tag,
  Users
} from 'lucide-react';
import CandidateTable from '@/components/candidates/CandidateTable';

const CandidatesPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'score' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // --- BULK ACTIONS STATE ---
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    setShowBulkActions(selectedCandidates.length > 0);
  }, [selectedCandidates]);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/candidates');
      setCandidates(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      // 1. Search (Name or Email)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        candidate.name?.toLowerCase().includes(searchLower) || 
        candidate.email?.toLowerCase().includes(searchLower);

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;

      // 3. Source Filter
      const matchesSource = sourceFilter === 'all' || candidate.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });

    // 4. Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'score') {
        compareValue = (b.matchScore || 0) - (a.matchScore || 0);
      } else if (sortBy === 'name') {
        compareValue = (a.name || '').localeCompare(b.name || '');
      } else { // date
        const dateA = new Date(a.appliedDate || a.createdAt);
        const dateB = new Date(b.appliedDate || b.createdAt);
        compareValue = dateB - dateA;
      }

      return sortOrder === 'asc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [candidates, searchQuery, statusFilter, sourceFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  // --- BULK ACTIONS ---
  const toggleSelectAll = () => {
    if (selectedCandidates.length === filteredAndSortedCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredAndSortedCandidates.map(c => c._id));
    }
  };

  const toggleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleBulkAction = async (action) => {
    try {
      switch(action) {
        case 'email':
          alert(`Emailing ${selectedCandidates.length} candidates...`);
          // Implement bulk email
          break;
        case 'export':
          alert(`Exporting ${selectedCandidates.length} candidates...`);
          // Implement export
          break;
        case 'tag':
          alert(`Tagging ${selectedCandidates.length} candidates...`);
          // Implement tag
          break;
        case 'delete':
          if (confirm(`Delete ${selectedCandidates.length} candidates?`)) {
            await api.delete('/candidates/bulk', { data: { ids: selectedCandidates } });
            fetchCandidates();
            setSelectedCandidates([]);
          }
          break;
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Error performing bulk action');
    }
  };

  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'name' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={fetchCandidates}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>
            <p className="text-slate-500 mt-1">
              {candidates.length} total candidates • {selectedCandidates.length} selected
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/candidates/add')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </Button>
        </div>

        {/* --- BULK ACTIONS BAR (Shows when candidates are selected) --- */}
        {showBulkActions && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-indigo-900">
                {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('email')}
                className="bg-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
                className="bg-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('tag')}
                className="bg-white"
              >
                <Tag className="w-4 h-4 mr-2" />
                Tag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="bg-white text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCandidates([])}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* --- FILTER BAR --- */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
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
                <option value="New">New</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="md:col-span-2">
              <select 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Email">Email</option>
                <option value="HireFlow Direct">HireFlow Direct</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3">
              <select 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="md:col-span-1 flex items-center justify-center">
              {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') && (
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

        {/* Candidates Table */}
        {filteredAndSortedCandidates.length === 0 ? (
          // Empty State
          <div className="bg-gray-50 rounded-lg border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {candidates.length === 0 ? "No candidates yet" : "No matching candidates"}
              </h3>
              <p className="text-slate-600 mb-6">
                {candidates.length === 0 
                  ? "Start by adding your first candidate or import from your ATS."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              {candidates.length === 0 && (
                <Button onClick={() => navigate('/dashboard/candidates/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Candidate
                </Button>
              )}
            </div>
          </div>
        ) : (
          <CandidateTable 
            candidates={filteredAndSortedCandidates}
            selectedCandidates={selectedCandidates}
            onToggleSelect={toggleSelectCandidate}
            onToggleSelectAll={toggleSelectAll}
            onSort={toggleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        )}
      </div>
    </div>
  );
};

export default CandidatesPage;
