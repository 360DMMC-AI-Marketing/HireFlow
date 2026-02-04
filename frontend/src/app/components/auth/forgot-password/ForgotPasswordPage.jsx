import React from "react";
import { useForm } from "react-hook-form";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../shared/Input";
import { useNavigate } from "react-router-dom";

export const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // simulate API call
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('If that email exists, a reset link has been sent.');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
        </button>

        <button type="button" onClick={() => navigate('/login')} className="w-full text-sm text-slate-500 hover:underline">
          Back to login
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordPage;