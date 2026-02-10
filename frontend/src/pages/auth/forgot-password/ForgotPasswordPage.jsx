import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../shared/Input";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm();
  const [step, setStep] = useState(1); // 1 = email, 2 = code
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const onSubmitEmail = async (data) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: data.email
      });
      
      if (response.data.success) {
        toast.success('Verification code sent to your email!');
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send verification code');
    }
  };

  const onSubmitCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-reset-code', {
        email: getValues('email'),
        code
      });
      
      if (response.data.success) {
        toast.success('Code verified! Redirecting...');
        // Navigate to reset password with the token
        navigate(`/reset-password/${response.data.resetToken}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setIsVerifying(false);
    }
  };

  if (step === 2) {
    return (
      <form onSubmit={onSubmitCode}>
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
            <KeyRound className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Enter Verification Code</h3>
          <p className="text-sm text-slate-600">
            We sent a 6-digit code to <span className="font-semibold">{getValues('email')}</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3">Verification Code</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl font-bold tracking-[0.5em] px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <div className="space-y-4">
          <button
            disabled={isVerifying || code.length !== 6}
            className="w-full py-4 bg-[#061446] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
          </button>

          <button 
            type="button" 
            onClick={() => setStep(1)} 
            className="w-full text-sm text-slate-500 hover:underline"
          >
            Back to email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmitEmail)}>
      <Input
        icon={Mail}
        label="Email Address"
        placeholder="name@company.com"
        error={errors.email?.message}
        {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
      />

      <div className="space-y-4">
        <button
          disabled={isSubmitting}
          className="w-full py-4 bg-[#061446] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
        </button>

        <button type="button" onClick={() => navigate('/login')} className="w-full text-sm text-slate-500 hover:underline">
          Back to login
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordPage;