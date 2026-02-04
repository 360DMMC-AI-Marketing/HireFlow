import React from "react";
import { useForm } from "react-hook-form";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../shared/Input";
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Store mock token for demonstration
    localStorage.setItem('authToken', 'mock-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify({ email: data.email, name: 'Jordan Smith' }));
    toast.success("Welcome back to HireFlow!");
    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input 
        icon={Mail} 
        label="Email Address" 
        placeholder="name@company.com"
        error={errors.email?.message}
        {...register("email", { 
          required: "Email is required",
          pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
        })}
      />
      <Input 
        icon={Lock} 
        label="Password" 
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password", { required: "Password is required" })}
      />
      
      <div className="flex items-center justify-between mt-2 mb-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-[#061446] focus:ring-[#C1DCE2]" />
          <span className="text-xs font-bold text-slate-500">Remember me</span>
        </label>
        <button 
          type="button" 
          className="text-xs font-black uppercase tracking-wider text-[#061446] hover:text-slate-600 transition-colors"
          onClick={() => navigate('/forgot-password')}
        >
          Forgot Password?
        </button>
      </div>

      <button 
        disabled={isSubmitting}
        className="w-full py-4 bg-[#061446] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Access"}
      </button>

      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        New to HireFlow?{" "}
        <button 
          type="button" 
          onClick={() => navigate('/signup')} 
          className="text-[#061446] font-black uppercase tracking-wider hover:underline ml-1"
        >
          Create Account
        </button>
      </p>
    </form>
  );
};
