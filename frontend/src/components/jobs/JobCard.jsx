import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Briefcase, Globe, Users, MoreVertical, Linkedin, Globe as WebIcon, CheckCircle2, AlertCircle } from "lucide-react";

const JobCard = ({ job, onUpdate }) => {
  const navigate = useNavigate();

  const getStatusVariant = (status) => {
    const variants = {
      Draft: 'outline',
      Active: 'default',
      Paused: 'secondary',
      Closed: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'text-slate-600',
      Active: 'text-green-600 bg-green-50 border-green-200',
      Paused: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      Closed: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status] || 'text-slate-600';
  };

  const getLocationText = (job) => {
    if (job.isRemote) return 'Remote';
    if (job.location === 'Hybrid') return 'Hybrid';
    return 'On-site';
  };

  return (
    <div
      className="group bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-slate-200 rounded-xl p-6"
      onClick={() => navigate(`/dashboard/jobs/${job._id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-slate-900 truncate">
              {job.title}
            </h3>
            <Badge 
              variant="outline"
              className={`${getStatusColor(job.status)} text-xs font-semibold uppercase px-2 py-0.5`}
            >
              {job.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>{job.department}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>{getLocationText(job)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{job.analytics?.totalApplicants || 0} Applicants</span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Distribution
            </span>
            <div className="flex items-center gap-2">
              {/* LinkedIn status */}
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  job.distribution?.linkedin?.postingStatus === 'posted'
                    ? 'bg-green-50 text-green-600'
                    : job.distribution?.linkedin?.postingStatus === 'failed'
                    ? 'bg-red-50 text-red-500'
                    : job.distribution?.linkedin?.enabled
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-50 text-slate-300'
                }`}
                title={
                  job.distribution?.linkedin?.postingStatus === 'posted' ? 'Posted to LinkedIn' :
                  job.distribution?.linkedin?.postingStatus === 'failed' ? 'LinkedIn posting failed' :
                  job.distribution?.linkedin?.enabled ? 'LinkedIn enabled' : 'LinkedIn not enabled'
                }
              >
                <Linkedin className="w-4 h-4" />
              </div>
              {/* Indeed status */}
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  job.distribution?.indeed?.postingStatus === 'posted'
                    ? 'bg-green-50 text-green-600'
                    : job.distribution?.indeed?.enabled
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-50 text-slate-300'
                }`}
                title={
                  job.distribution?.indeed?.postingStatus === 'posted' ? 'Listed on Indeed feed' :
                  job.distribution?.indeed?.enabled ? 'Indeed enabled' : 'Indeed not enabled'
                }
              >
                i
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard/jobs/${job._id}`);
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard/jobs/${job._id}/edit`);
                }}
              >
                Edit Job
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle duplicate
                }}
              >
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle delete
                }}
              >
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
