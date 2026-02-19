import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Lock, 
  Copy, 
  CheckCircle, 
  Linkedin, 
  Loader2, 
  X,
  Check 
} from 'lucide-react';

const DistributionStep = ({ formData, setFormData }) => {
  // --- STATE ---
  const [slugCopied, setSlugCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Connection States — check if user already connected via OAuth
  const [isConnectingIndeed, setIsConnectingIndeed] = useState(false);
  const [indeedConnected, setIndeedConnected] = useState(false);
  
  const [isConnectingLinkedin, setIsConnectingLinkedin] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  const userTier = 'Pro';

  // Check URL params on mount for OAuth return
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integration');
    if (integration === 'linkedin_success') {
      setLinkedinConnected(true);
      handleDistributionChange('linkedin', 'enabled', true);
    }
    if (integration === 'indeed_success') {
      setIndeedConnected(true);
      handleDistributionChange('indeed', 'enabled', true);
    }
  }, []);

  // --- HANDLERS ---

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

  // Connect to Indeed via real OAuth flow
  const handleIndeedConnect = () => {
    setIsConnectingIndeed(true);
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/integrations/indeed`;
  };

  // Connect to LinkedIn via real OAuth flow
  const handleLinkedinConnect = () => {
    setIsConnectingLinkedin(true);
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/integrations/linkedin`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Distribution Settings</h3>
        <p className="text-sm text-slate-600">Select where you want to publish this job</p>
      </div>

      {/* ================= LINKEDIN ================= */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0077b5] rounded-lg flex items-center justify-center text-white">
              <Linkedin className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">LinkedIn Jobs</div>
              <div className="text-sm text-slate-600">Post to LinkedIn's job board</div>
            </div>
          </div>
          
          {/* Connect Logic */}
          {linkedinConnected ? (
            <Checkbox
              checked={formData.distribution.linkedin.enabled}
              onCheckedChange={(checked) => handleDistributionChange('linkedin', 'enabled', checked)}
            />
          ) : (
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLinkedinConnect} 
                disabled={isConnectingLinkedin}
            >
              {isConnectingLinkedin ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
              {isConnectingLinkedin ? 'Connecting...' : 'Connect LinkedIn'}
            </Button>
          )}
        </div>

        {/* LinkedIn Details (Only show if enabled) */}
        {formData.distribution.linkedin.enabled && linkedinConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
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

            {/* PREVIEW BUTTON (Restored Functionality) */}
            <Button 
                type="button"
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowPreview(true)}
            >
              <ExternalLink className="w-4 h-4" />
              Preview on LinkedIn
            </Button>
          </div>
        )}
      </div>

      {/* ================= INDEED ================= */}
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

          {/* Connect Logic */}
          {indeedConnected ? (
            <Checkbox
              checked={formData.distribution.indeed.enabled}
              onCheckedChange={(checked) => handleDistributionChange('indeed', 'enabled', checked)}
            />
          ) : (
            <Button 
                variant="outline" 
                size="sm"
                onClick={handleIndeedConnect}
                disabled={isConnectingIndeed}
            >
               {isConnectingIndeed ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
               {isConnectingIndeed ? 'Connecting...' : 'Connect Indeed'}
            </Button>
          )}
        </div>

        {formData.distribution.indeed.enabled && indeedConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
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

        {!indeedConnected && (
          <Alert>
            <AlertDescription>
              Connect your Indeed account to post jobs directly from HireFlow.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ================= HIREFLOW PORTAL ================= */}
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
          </div>
        )}
      </div>

      {/* ================= EMAIL APPLICATIONS ================= */}
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

      {/* ================= LINKEDIN PREVIEW MODAL (Restored) ================= */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50">
              <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-[#0077b5]" />
                Post Preview
              </h4>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LinkedIn Post Mockup */}
            <div className="p-6 bg-[#f3f2ef]">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Your Company Name</div>
                    <div className="text-xs text-slate-500">Just now • 🌐</div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-800 mb-4 space-y-2">
                  <p>We are hiring! 🚀</p>
                  <p>
                    We are looking for a <span className="font-semibold">{formData.title || 'Job Title'}</span> to 
                    join our {formData.department} team.
                  </p>
                  <p className="text-blue-600 font-medium cursor-pointer">#hiring #careers #{formData.department?.toLowerCase()}</p>
                </div>

                {/* Link Preview Card */}
                <div className="border border-slate-300 rounded bg-slate-50 overflow-hidden cursor-pointer">
                  <div className="h-32 bg-slate-200 w-full flex items-center justify-center text-slate-400">
                    Job Cover Image
                  </div>
                  <div className="p-3 bg-white border-t border-slate-200">
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {formData.title || 'Job Title'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{formData.location || 'Remote'}</span>
                      <span>•</span>
                      <span>{formData.employmentType}</span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs border border-blue-600 text-blue-600 px-3 py-1 rounded-full font-semibold">
                            Apply Now
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionStep;