import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const JobDetailsStep = ({ formData, setFormData }) => {
  const [skillInput, setSkillInput] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        screeningCriteria: {
          ...prev.screeningCriteria,
          requiredSkills: [...prev.screeningCriteria.requiredSkills, skillInput.trim()]
        }
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      screeningCriteria: {
        ...prev.screeningCriteria,
        requiredSkills: prev.screeningCriteria.requiredSkills.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAIToggle = () => {
    setFormData(prev => ({
      ...prev,
      isAIAssisted: !prev.isAIAssisted
    }));
  };

  const generateAIDescription = async () => {
    // Placeholder for AI generation
    alert('AI generation would happen here - integrate with OpenAI API');
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-8">
      {/* AI Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <div>
            <div className="font-medium text-slate-900">AI-Assisted Mode</div>
            <div className="text-sm text-slate-600">Let AI help create your job description</div>
          </div>
        </div>
        <Switch
          checked={formData.isAIAssisted}
          onCheckedChange={handleAIToggle}
        />
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
              required
            />
          </div>

          <div>
            <Label htmlFor="department">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleInputChange('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Customer Support">Customer Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employmentType">Employment Type *</Label>
            <Select
              value={formData.employmentType}
              onValueChange={(value) => handleInputChange('employmentType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remote"
            checked={formData.isRemote}
            onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
          />
          <Label htmlFor="remote" className="cursor-pointer">Remote position</Label>
        </div>
      </div>

      {/* Salary Range */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Salary Range (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="salaryMin">Minimum</Label>
            <Input
              id="salaryMin"
              type="number"
              value={formData.salary.min}
              onChange={(e) => handleNestedChange('salary', 'min', e.target.value)}
              placeholder="50000"
            />
          </div>

          <div>
            <Label htmlFor="salaryMax">Maximum</Label>
            <Input
              id="salaryMax"
              type="number"
              value={formData.salary.max}
              onChange={(e) => handleNestedChange('salary', 'max', e.target.value)}
              placeholder="80000"
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.salary.currency}
              onValueChange={(value) => handleNestedChange('salary', 'currency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Job Description */}
      {!formData.isAIAssisted ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Job Description *</h3>
          
          <div>
            <Label>Description</Label>
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              modules={modules}
              className="bg-white"
              placeholder="Describe the role..."
            />
          </div>

          <div>
            <Label>Responsibilities</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
              placeholder="List key responsibilities..."
              rows={4}
            />
          </div>

          <div>
            <Label>Requirements</Label>
            <Textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="List requirements and qualifications..."
              rows={4}
            />
          </div>

          <div>
            <Label>Benefits</Label>
            <Textarea
              value={formData.benefits}
              onChange={(e) => handleInputChange('benefits', e.target.value)}
              placeholder="List benefits and perks..."
              rows={4}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">AI-Assisted Description</h3>
          
          <div>
            <Label>Key Responsibilities (Brief)</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
              placeholder="Bullet points of main responsibilities..."
              rows={3}
            />
          </div>

          <div>
            <Label>Must-Have Skills</Label>
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Type and press Enter"
            />
          </div>

          <Button
            type="button"
            onClick={generateAIDescription}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Sparkles className="w-4 h-4" />
            Generate Description
          </Button>
        </div>
      )}

      {/* Screening Criteria */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Screening Criteria</h3>
        
        <div>
          <Label>Required Skills</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Type skill and press Enter"
            />
            <Button type="button" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.screeningCriteria.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="hover:bg-indigo-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Minimum Years of Experience</Label>
            <Input
              type="number"
              min="0"
              value={formData.screeningCriteria.minYearsExperience}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                screeningCriteria: {
                  ...prev.screeningCriteria,
                  minYearsExperience: parseInt(e.target.value) || 0
                }
              }))}
            />
          </div>

          <div>
            <Label>Education Level</Label>
            <Select
              value={formData.screeningCriteria.educationLevel}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                screeningCriteria: {
                  ...prev.screeningCriteria,
                  educationLevel: value
                }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High School">High School</SelectItem>
                <SelectItem value="Associate">Associate Degree</SelectItem>
                <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                <SelectItem value="Master">Master's Degree</SelectItem>
                <SelectItem value="PhD">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsStep;
