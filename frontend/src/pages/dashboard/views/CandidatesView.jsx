import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import api from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, Brain, FileText, LayoutGrid, List, 
  MoreHorizontal, Calendar, Mail, Phone, Search, X,
  Download, Trash2, Tag, Users, Eye, ThumbsUp, ThumbsDown, Star
} from "lucide-react";
import { Card } from "../shared/Card";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const CandidatesView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId'); // Get jobId from URL
  const [viewMode, setViewMode] = useState('list');
  
  // API State
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

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
      console.error('Error fetching candidates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique positions from candidates
  const uniquePositions = useMemo(() => {
    const positions = candidates
      .map(c => c.positionApplied)
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    return positions.sort();
  }, [candidates]);

  // --- FILTERING & SORTING LOGIC ---
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        candidate.name?.toLowerCase().includes(searchLower) || 
        candidate.email?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || candidate.source === sourceFilter;
      const matchesPosition = positionFilter === 'all' || candidate.positionApplied === positionFilter;
      
      // Filter by jobId if provided in URL
      const matchesJob = !jobIdFilter || candidate.jobId === jobIdFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesPosition && matchesJob;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'score') {
        compareValue = (b.matchScore || 0) - (a.matchScore || 0);
      } else if (sortBy === 'name') {
        compareValue = (a.name || '').localeCompare(b.name || '');
      } else {
        const dateA = new Date(a.appliedDate || a.createdAt);
        const dateB = new Date(b.appliedDate || b.createdAt);
        compareValue = dateB - dateA;
      }

      return sortOrder === 'asc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [candidates, searchQuery, statusFilter, sourceFilter, positionFilter, sortBy, sortOrder, jobIdFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setPositionFilter('all');
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
          break;
        case 'export':
          alert(`Exporting ${selectedCandidates.length} candidates...`);
          break;
        case 'tag':
          alert(`Tagging ${selectedCandidates.length} candidates...`);
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

  // Status & Source Badge Functions
  const getStatusBadge = (status) => {
    const variants = {
      New: 'bg-blue-100 text-blue-800 border-blue-300',
      Screening: 'bg-purple-100 text-purple-800 border-purple-300',
      Interview: 'bg-amber-100 text-amber-800 border-amber-300',
      Offer: 'bg-green-100 text-green-800 border-green-300',
      Hired: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      Rejected: 'bg-red-100 text-red-800 border-red-300',
      Applied: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return variants[status] || variants.New;
  };

  const getSourceBadge = (source) => {
    const variants = {
      'LinkedIn': { bg: 'bg-[#0077b5]/10', text: 'text-[#0077b5]', border: 'border-[#0077b5]/30', icon: '💼' },
      'Indeed': { bg: 'bg-blue-900/10', text: 'text-blue-900', border: 'border-blue-900/30', icon: '🔍' },
      'Email': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: '📧' },
      'HireFlow Direct': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', icon: '🎯' }
    };
    return variants[source] || variants['Email'];
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-600 text-white';
    if (score >= 60) return 'bg-amber-500 text-white';
    if (score >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAllSelected = selectedCandidates.length === filteredAndSortedCandidates.length && filteredAndSortedCandidates.length > 0;

  // Use API data directly
  const allCandidates = candidates;

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      
      {/* Job Filter Banner */}
      {jobIdFilter && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <p className="text-sm font-medium text-indigo-900">
              Showing candidates for a specific job ({filteredAndSortedCandidates.length} found)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/candidates')}
            className="text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}
      
      {/* HEADER & TOGGLE BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talent Pipeline</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {viewMode === 'pipeline' ? 'Candidates organized by status' : `${allCandidates.length} candidates • ${selectedCandidates.length} selected`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/dashboard/candidates/add')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </Button>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                viewMode === 'list' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button 
              onClick={() => setViewMode('pipeline')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                viewMode === 'pipeline' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* --- BULK ACTIONS BAR (Shows when candidates are selected) --- */}
      {showBulkActions && viewMode === 'list' && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
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

      {/* --- FILTER BAR (List View Only) --- */}
      {viewMode === 'list' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search */}
            <div className="md:col-span-3 relative">
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
                <option value="Applied">Applied</option>
              </select>
            </div>

            {/* Position Filter */}
            <div className="md:col-span-2">
              <select 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="all">All Positions</option>
                {uniquePositions.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
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
              {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || positionFilter !== 'all') && (
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
      )}

      {/* =========================================================
          MODE 1: PIPELINE VIEW (Your original Kanban Board)
         ========================================================= */}
      {viewMode === 'pipeline' && (() => {
        const pipelineStages = [
          { id: 'New', name: 'New' },
          { id: 'Applied', name: 'Applied' },
          { id: 'Screening', name: 'Screening' },
          { id: 'Interview', name: 'Interview' },
          { id: 'Offer', name: 'Offer' },
          { id: 'Hired', name: 'Hired' },
          { id: 'Rejected', name: 'Rejected' },
        ];
        // Group filtered candidates by their status
        const grouped = {};
        pipelineStages.forEach(s => { grouped[s.id] = []; });
        filteredAndSortedCandidates.forEach(c => {
          const status = c.status || 'New';
          if (grouped[status]) grouped[status].push(c);
          else grouped['New'].push(c);
        });
        
        return (
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="min-w-[280px] w-80 shrink-0">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {stage.name}
                  <span className="text-[10px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-black">
                    {grouped[stage.id].length}
                  </span>
                </h3>
              </div>
              
              <div className="space-y-3">
                {grouped[stage.id].length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-medium italic">
                    No candidates
                  </div>
                ) : grouped[stage.id].map((candidate) => {
                  const nameParts = (candidate.name || 'U').split(' ');
                  const initials = nameParts.map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                  <Card 
                    key={candidate._id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => navigate(`/dashboard/candidates/${candidate._id}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{candidate.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{candidate.positionApplied || 'No position'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {candidate.resumePath && (
                          <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileText className="w-3 h-3" />
                          </div>
                        )}
                        {candidate.email && (
                          <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Mail className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      {candidate.matchScore > 0 && (
                        <div className={cn("flex items-center gap-1 text-xs font-black",
                          candidate.matchScore >= 80 ? "text-emerald-600" :
                          candidate.matchScore >= 60 ? "text-amber-600" : "text-orange-600"
                        )}>
                          <Brain className="w-3 h-3" />
                          {candidate.matchScore}%
                        </div>
                      )}
                    </div>
                  </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      {/* =========================================================
          MODE 2: LIST VIEW (Full Featured Table)
         ========================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                {/* Select All Checkbox */}
                <TableHead className="w-12">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                
                <TableHead className="font-semibold text-slate-700">Candidate Name</TableHead>
                <TableHead className="font-semibold text-slate-700">Match Score</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Source</TableHead>
                <TableHead className="font-semibold text-slate-700">Position Applied</TableHead>
                <TableHead className="font-semibold text-slate-700">Applied Date</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCandidates.length > 0 ? (
                filteredAndSortedCandidates.map((candidate) => (
                  <TableRow
                    key={candidate._id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => {
                      if (candidate._id && candidate._id.toString().length > 5) {
                        navigate(`/dashboard/candidates/${candidate._id}`);
                      } else {
                        alert('Candidate detail page not available for demo data');
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedCandidates.includes(candidate._id)}
                        onCheckedChange={() => toggleSelectCandidate(candidate._id)}
                      />
                    </TableCell>

                    {/* Candidate Name & Email */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {candidate.avatar ? (
                          <ImageWithFallback 
                            src={candidate.avatar} 
                            alt={candidate.name} 
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
                            {candidate.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{candidate.name}</div>
                          <div className="text-sm text-slate-500">{candidate.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Match Score */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBadge(candidate.matchScore || 0)}`}>
                          {candidate.matchScore || 0}%
                        </div>
                        {candidate.matchScore >= 80 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={`${getStatusBadge(candidate.status)} border`}>
                        {candidate.status}
                      </Badge>
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      {candidate.source && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getSourceBadge(candidate.source).bg} ${getSourceBadge(candidate.source).text} ${getSourceBadge(candidate.source).border}`}>
                          <span>{getSourceBadge(candidate.source).icon}</span>
                          {candidate.source}
                        </div>
                      )}
                    </TableCell>

                    {/* Position Applied */}
                    <TableCell className="text-slate-600 max-w-xs truncate">
                      {candidate.positionApplied || candidate.role || 'N/A'}
                    </TableCell>

                    {/* Applied Date */}
                    <TableCell className="text-slate-600">
                      {formatDate(candidate.appliedDate || candidate.createdAt)}
                    </TableCell>

                    {/* Actions Dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            if (candidate._id && candidate._id.toString().length > 5) {
                              navigate(`/dashboard/candidates/${candidate._id}`);
                            } else {
                              alert('Candidate detail page not available for demo data');
                            }
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${candidate.email}`;
                          }}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Interview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <ThumbsUp className="w-4 h-4 mr-2 text-green-600" />
                            <span className="text-green-600">Move to Next Stage</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <ThumbsDown className="w-4 h-4 mr-2 text-red-600" />
                            <span className="text-red-600">Reject</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                    {allCandidates.length === 0 ? 'No candidates yet. Add one to get started!' : 'No matching candidates found. Try adjusting your filters.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};