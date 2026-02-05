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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Pause, Play, XCircle, Copy, Trash2 } from "lucide-react";

const JobTable = ({ jobs }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const variants = {
      Draft: 'bg-gray-100 text-gray-800 border-gray-300',
      Active: 'bg-green-100 text-green-800 border-green-300',
      Paused: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Closed: 'bg-red-100 text-red-800 border-red-300'
    };
    return variants[status] || variants.Draft;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-700">Job Title</TableHead>
            <TableHead className="font-semibold text-slate-700">Department</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Applicants</TableHead>
            <TableHead className="font-semibold text-slate-700">Created Date</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <TableRow
                key={job._id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(`/dashboard/jobs/${job._id}`)}
              >
                <TableCell className="font-medium text-slate-900">{job.title}</TableCell>
                <TableCell className="text-slate-600">{job.department}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusBadge(job.status)} border`}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">
                  {job.analytics?.totalApplicants || 0}
                </TableCell>
                <TableCell className="text-slate-600">
                  {formatDate(job.createdAt)}
                </TableCell>
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
                        navigate(`/dashboard/jobs/${job._id}/edit`);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {job.status === 'Active' && (
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                      )}
                      {job.status === 'Paused' && (
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </DropdownMenuItem>
                      )}
                      {job.status !== 'Closed' && (
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Close
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => e.stopPropagation()}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                No jobs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobTable;
