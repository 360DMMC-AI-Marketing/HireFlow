import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Lock, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const DistributionStep = ({ formData, setFormData }) => {
  const [slugCopied, setSlugCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const userTier = 'Pro'; // This would come from user context
  const integrations = { linkedin: true, indeed: false }; // Would come from API

  const handleDistributionChange = (platform, field, value) => {
    setFormData(prev => ({
      ...prev,
      distribution: {
        ...prev.distribution,
        [platform]: {
          ...prev.distribution[platform],
          [field]: value
        }
      }
    }));
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    handleDistributionChange('hireflowPortal', 'slug', slug);
  };

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Distribution Settings</h3>
        <p className="text-sm text-slate-600">Select where you want to publish this job</p>
      </div>

      {/* LinkedIn */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              in
            </div>
            <div>
              <div className="font-semibold text-slate-900">LinkedIn Jobs</div>
              <div className="text-sm text-slate-600">Post to LinkedIn's job board</div>
            </div>
          </div>
          {integrations.linkedin ? (
            <Checkbox
              checked={formData.distribution.linkedin.enabled}
              onCheckedChange={(checked) => handleDistributionChange('linkedin', 'enabled', checked)}
            />
          ) : (
            <Button variant="outline" size="sm">
              Connect LinkedIn
            </Button>
          )}
        </div>

        {formData.distribution.linkedin.enabled && integrations.linkedin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Seniority Level</Label>
              <Select
                value={formData.distribution.linkedin.seniorityLevel}
                onValueChange={(value) => handleDistributionChange('linkedin', 'seniorityLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Entry level">Entry level</SelectItem>
                  <SelectItem value="Associate">Associate</SelectItem>
                  <SelectItem value="Mid-Senior level">Mid-Senior level</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job Function</Label>
              <Select
                value={formData.distribution.linkedin.jobFunction}
                onValueChange={(value) => handleDistributionChange('linkedin', 'jobFunction', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select function" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userTier === 'Enterprise' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="linkedin-sponsored"
                  checked={formData.distribution.linkedin.sponsored}
                  onCheckedChange={(checked) => handleDistributionChange('linkedin', 'sponsored', checked)}
                />
                <Label htmlFor="linkedin-sponsored" className="cursor-pointer">
                  Sponsor this job (Enterprise feature)
                </Label>
              </div>
            )}

            <Button variant="outline" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Preview on LinkedIn
            </Button>
          </div>
        )}
      </div>

      {/* Indeed */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
              i
            </div>
            <div>
              <div className="font-semibold text-slate-900">Indeed</div>
              <div className="text-sm text-slate-600">Reach millions of job seekers</div>
            </div>
          </div>
          {integrations.indeed ? (
            <Checkbox
              checked={formData.distribution.indeed.enabled}
              onCheckedChange={(checked) => handleDistributionChange('indeed', 'enabled', checked)}
            />
          ) : (
            <Button variant="outline" size="sm">
              Connect Indeed
            </Button>
          )}
        </div>

        {formData.distribution.indeed.enabled && integrations.indeed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Salary Display</Label>
              <Select
                value={formData.distribution.indeed.salaryDisplay}
                onValueChange={(value) => handleDistributionChange('indeed', 'salaryDisplay', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hide">Hide</SelectItem>
                  <SelectItem value="Show range">Show range</SelectItem>
                  <SelectItem value="Show starting">Show starting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="flex items-center gap-2 mt-auto">
              <ExternalLink className="w-4 h-4" />
              Preview on Indeed
            </Button>
          </div>
        )}

        {!integrations.indeed && (
          <Alert>
            <AlertDescription>
              Connect your Indeed account to post jobs directly from HireFlow.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* HireFlow Portal */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              HF
            </div>
            <div>
              <div className="font-semibold text-slate-900">HireFlow Application Portal</div>
              <div className="text-sm text-slate-600">Your branded career page</div>
            </div>
          </div>
          {userTier !== 'Free' ? (
            <Checkbox
              checked={formData.distribution.hireflowPortal.enabled}
              onCheckedChange={(checked) => handleDistributionChange('hireflowPortal', 'enabled', checked)}
            />
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Lock className="w-4 h-4" />
              Pro Plan Required
            </div>
          )}
        </div>

        {formData.distribution.hireflowPortal.enabled && userTier !== 'Free' && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Application URL</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-lg">
                  <span className="text-sm text-slate-600">hireflow.com/apply/</span>
                  <Input
                    value={formData.distribution.hireflowPortal.slug}
                    onChange={(e) => handleDistributionChange('hireflowPortal', 'slug', e.target.value)}
                    placeholder="job-slug"
                    className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSlug}
                >
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(
                    `hireflow.com/apply/${formData.distribution.hireflowPortal.slug}`,
                    setSlugCopied
                  )}
                >
                  {slugCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {userTier === 'Enterprise' && (
              <div>
                <Label>Custom Domain (Enterprise)</Label>
                <Input
                  value={formData.distribution.hireflowPortal.customDomain}
                  onChange={(e) => handleDistributionChange('hireflowPortal', 'customDomain', e.target.value)}
                  placeholder="careers.yourcompany.com"
                />
              </div>
            )}

            {userTier === 'Enterprise' && (
              <Button variant="outline">Customize Branding</Button>
            )}
          </div>
        )}

        {userTier === 'Free' && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Upgrade to Pro to enable HireFlow Application Portal</span>
              <Button size="sm">Upgrade</Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Email Applications */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center text-white">
              📧
            </div>
            <div>
              <div className="font-semibold text-slate-900">Email Applications</div>
              <div className="text-sm text-slate-600">Accept applications via email</div>
            </div>
          </div>
          <Checkbox
            checked={formData.distribution.emailApplications.enabled}
            onCheckedChange={(checked) => handleDistributionChange('emailApplications', 'enabled', checked)}
          />
        </div>

        {formData.distribution.emailApplications.enabled && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Application Email</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={formData.distribution.emailApplications.email || `jobs@company.hireflow.com`}
                  onChange={(e) => handleDistributionChange('emailApplications', 'email', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(
                    formData.distribution.emailApplications.email || `jobs@company.hireflow.com`,
                    setEmailCopied
                  )}
                >
                  {emailCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <p className="font-medium mb-2">Include this in your job description:</p>
                <code className="block p-2 bg-slate-100 rounded text-xs">
                  To apply, please send your resume to {formData.distribution.emailApplications.email || 'jobs@company.hireflow.com'}
                </code>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionStep;
