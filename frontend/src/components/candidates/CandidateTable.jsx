import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Eye, 
  Mail, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Star,
  ArrowUpDown
} from "lucide-react";

const CandidateTable = ({ 
  candidates, 
  selectedCandidates = [], 
  onToggleSelect, 
  onToggleSelectAll,
  onSort,
  sortBy,
  sortOrder
}) => {
  const navigate = useNavigate();

  // Status Badge Styling
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

  // Source Badge Styling
  const getSourceBadge = (source) => {
    const variants = {
      'LinkedIn': { 
        bg: 'bg-[#0077b5]/10', 
        text: 'text-[#0077b5]', 
        border: 'border-[#0077b5]/30',
        icon: '💼'
      },
      'Indeed': { 
        bg: 'bg-blue-900/10', 
        text: 'text-blue-900', 
        border: 'border-blue-900/30',
        icon: '🔍'
      },
      'Email': { 
        bg: 'bg-slate-100', 
        text: 'text-slate-700', 
        border: 'border-slate-300',
        icon: '📧'
      },
      'HireFlow Direct': { 
        bg: 'bg-indigo-100', 
        text: 'text-indigo-700', 
        border: 'border-indigo-300',
        icon: '🎯'
      }
    };
    return variants[source] || variants['Email'];
  };

  // Score Badge with Color Coding
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

  const isAllSelected = selectedCandidates.length === candidates.length && candidates.length > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {/* Select All Checkbox */}
            <TableHead className="w-12">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            
            {/* Name Column - Sortable */}
            <TableHead className="font-semibold text-slate-700">
              <button 
                onClick={() => onSort('name')}
                className="flex items-center gap-2 hover:text-indigo-600"
              >
                Candidate Name
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </TableHead>

            {/* Score Column - Sortable */}
            <TableHead className="font-semibold text-slate-700">
              <button 
                onClick={() => onSort('score')}
                className="flex items-center gap-2 hover:text-indigo-600"
              >
                Match Score
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </TableHead>

            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Source</TableHead>
            <TableHead className="font-semibold text-slate-700">Position Applied</TableHead>
            
            {/* Date Column - Sortable */}
            <TableHead className="font-semibold text-slate-700">
              <button 
                onClick={() => onSort('date')}
                className="flex items-center gap-2 hover:text-indigo-600"
              >
                Applied Date
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </TableHead>

            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <TableRow
                key={candidate._id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(`/dashboard/candidates/${candidate._id}`)}
              >
                {/* Checkbox */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedCandidates.includes(candidate._id)}
                    onCheckedChange={() => onToggleSelect(candidate._id)}
                  />
                </TableCell>

                {/* Candidate Name & Email */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
                      {candidate.name?.charAt(0).toUpperCase()}
                    </div>
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
                  {candidate.positionApplied || 'N/A'}
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
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/candidates/${candidate._id}`);
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
                        <span className="text-green-600">Move to Interview</span>
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
                No candidates found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CandidateTable;
