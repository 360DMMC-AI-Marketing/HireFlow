import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, Save } from 'lucide-react'; // Added 'Save' icon
import JobDetailsStep from './steps/JobDetailsStep';
import DistributionStep from './steps/DistributionStep';
import ReviewStep from './steps/ReviewStep';

const CreateJobWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: '',
    employmentType: 'Full-Time',
    experienceLevel: 'Mid-Level',
    status: 'Draft', // Default is Draft
    description: '',
    responsibilities: '',
    qualifications: '',
    benefits: '',
    isRemote: false,
    salary: {
      min: '',
      max: '',
      currency: 'USD',
      showSalary: false
    },
    applicationMethod: {
      type: 'internal',
      externalUrl: '',
      customEmail: ''
    },
    screeningQuestions: [],
    screeningCriteria: {
      requiredSkills: [],
      minYearsExperience: 0,
      requiredEducation: [],
      requiresCoverLetter: false,
      requiresPortfolio: false
    },
    distribution: {
      hireflowPortal: {
        enabled: true,
        slug: ''
      },
      linkedin: {
        enabled: false,
        postImmediately: false
      },
      indeed: {
        enabled: false,
        postImmediately: false
      },
      emailApplications: {
        enabled: false,
        email: ''
      }
    }
  });

  const steps = [
    { title: 'Job Details', component: JobDetailsStep },
    { title: 'Distribution', component: DistributionStep },
    { title: 'Review', component: ReviewStep }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ✅ UPDATED: Function now accepts the specific status (Draft or Active)
  const handleSubmit = async (finalStatus) => {
    setIsSubmitting(true);
    try {
      // We create a specific payload overriding the status with which button was clicked
      const payload = { ...formData, status: finalStatus };
      
      const response = await api.post('/jobs', payload);
      
      // Different alert message based on action
      const message = finalStatus === 'Active' ? 'Job Published Successfully!' : 'Job Saved as Draft!';
      alert(message);
      
      navigate(`/dashboard/jobs/${response.data._id}`);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error creating job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Create New Job</h1>
          <p className="text-slate-600 mt-2">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index < currentStep
                        ? 'bg-green-600 text-white'
                        : index === currentStep
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      index === currentStep ? 'text-indigo-600' : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      index < currentStep ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            <CurrentStepComponent formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            // ✅ UPDATED: Split into two buttons for the final step
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit('Draft')}
                disabled={isSubmitting}
                className="border-slate-300 hover:bg-slate-100"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>

              <Button
                onClick={() => handleSubmit('Active')}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Job'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJobWizard;