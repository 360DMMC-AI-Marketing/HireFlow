import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const ReviewStep = ({ formData, setFormData }) => {
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    responsibilities: false,
    requirements: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getEnabledPlatforms = () => {
    const platforms = [];
    if (formData.distribution.linkedin?.enabled) platforms.push('LinkedIn');
    if (formData.distribution.indeed?.enabled) platforms.push('Indeed');
    if (formData.distribution.hireflowPortal?.enabled) platforms.push('HireFlow Portal');
    if (formData.distribution.emailApplications?.enabled) platforms.push('Email');
    return platforms;
  };

  const enabledPlatforms = getEnabledPlatforms();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Review & Post Job</h3>
        <p className="text-slate-600">Review your job details before posting</p>
      </div>

      {/* Job Overview */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-xl font-bold text-slate-900 mb-2">{formData.title || 'Untitled Job'}</h4>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                📍 {formData.location || 'Location not set'}
                {formData.isRemote && ' (Remote)'}
              </span>
              <span>🏢 {formData.department || 'No department'}</span>
              <span>💼 {formData.employmentType}</span>
              {formData.salary.min && formData.salary.max && (
                <span>
                  💰 {formData.salary.currency} {formData.salary.min} - {formData.salary.max}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm">
          <span className={`w-2 h-2 rounded-full ${
            formData.status === 'Active' ? 'bg-green-500' :
            formData.status === 'Draft' ? 'bg-gray-500' :
            formData.status === 'Paused' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          {formData.status}
        </div>
      </div>

      {/* Job Description */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Job Description</h4>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-4 text-sm text-slate-700">
          <div>
            <div className="font-medium text-slate-900 mb-1">Description</div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: expandedSections.description
                  ? formData.description
                  : truncateText(formData.description?.replace(/<[^>]*>/g, ''), 200)
              }}
            />
            {formData.description?.length > 200 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => toggleSection('description')}
                className="px-0 h-auto"
              >
                {expandedSections.description ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>

          {formData.responsibilities && (
            <div>
              <div className="font-medium text-slate-900 mb-1">Responsibilities</div>
              <p className={expandedSections.responsibilities ? '' : 'line-clamp-3'}>
                {formData.responsibilities}
              </p>
              {formData.responsibilities.length > 150 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleSection('responsibilities')}
                  className="px-0 h-auto"
                >
                  {expandedSections.responsibilities ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
          )}

          {formData.requirements && (
            <div>
              <div className="font-medium text-slate-900 mb-1">Requirements</div>
              <p className={expandedSections.requirements ? '' : 'line-clamp-3'}>
                {formData.requirements}
              </p>
              {formData.requirements.length > 150 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleSection('requirements')}
                  className="px-0 h-auto"
                >
                  {expandedSections.requirements ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
          )}

          {formData.benefits && (
            <div>
              <div className="font-medium text-slate-900 mb-1">Benefits</div>
              <p className="line-clamp-2">{formData.benefits}</p>
            </div>
          )}
        </div>
      </div>

      {/* Screening Criteria */}
      {formData.screeningCriteria.requiredSkills.length > 0 && (
        <div className="border rounded-lg p-6 space-y-4">
          <h4 className="font-semibold text-slate-900">Screening Criteria</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-slate-900 mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {formData.screeningCriteria.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {formData.screeningCriteria.minYearsExperience > 0 && (
              <div>
                <div className="font-medium text-slate-900 mb-2">Experience</div>
                <div className="text-slate-700">
                  Minimum {formData.screeningCriteria.minYearsExperience} years
                </div>
              </div>
            )}

            {formData.screeningCriteria.educationLevel && (
              <div>
                <div className="font-medium text-slate-900 mb-2">Education</div>
                <div className="text-slate-700">
                  {formData.screeningCriteria.educationLevel}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distribution Checklist */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Distribution Settings</h4>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {enabledPlatforms.length === 0 ? (
          <Alert>
            <AlertDescription>
              No distribution platforms selected. Your job will be saved as a draft.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {formData.distribution.linkedin?.enabled && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">LinkedIn Jobs</div>
                  <div className="text-sm text-slate-600">
                    Ready to post • {formData.distribution.linkedin.seniorityLevel || 'Seniority level not set'}
                  </div>
                </div>
              </div>
            )}

            {formData.distribution.indeed?.enabled && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Indeed</div>
                  <div className="text-sm text-slate-600">
                    Ready to post • Salary: {formData.distribution.indeed.salaryDisplay}
                  </div>
                </div>
              </div>
            )}

            {formData.distribution.hireflowPortal?.enabled && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">HireFlow Portal</div>
                  <div className="text-sm text-slate-600">
                    Page will be live at: hireflow.com/apply/{formData.distribution.hireflowPortal.slug || 'job-slug'}
                  </div>
                </div>
              </div>
            )}

            {formData.distribution.emailApplications?.enabled && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Email Applications</div>
                  <div className="text-sm text-slate-600">
                    Applications accepted at: {formData.distribution.emailApplications.email || 'jobs@company.hireflow.com'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Confirmation */}
      <Alert className="border-indigo-200 bg-indigo-50">
        <AlertDescription>
          <p className="font-medium text-slate-900 mb-1">Ready to post?</p>
          <p className="text-sm text-slate-700">
            Your job will be posted to {enabledPlatforms.length} platform{enabledPlatforms.length !== 1 ? 's' : ''}: {enabledPlatforms.join(', ')}
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReviewStep;
