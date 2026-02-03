import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, Lock, Building2, Users2, Globe, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Input } from "../shared/Input";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Consulting",
  "Other"
];

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+"
];

export const SignupPage = ({ onSwitch, onSignup }) => {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting }, trigger, watch } = useForm();

  const watchPassword = watch("password", "");
  const watchConfirmPassword = watch("confirmPassword", "");

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 3) return { strength, label: "Fair", color: "bg-yellow-500" };
    if (strength <= 4) return { strength, label: "Good", color: "bg-blue-500" };
    return { strength, label: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(watchPassword);

  const handleNext = async () => {
    const isValid = await trigger(["email", "password", "confirmPassword"]);
    if (isValid) setStep(2);
  };

  const onSubmit = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success("Account created successfully!");
    onSignup();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Input 
              icon={Mail} 
              label="Admin Email" 
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
            <div className="mb-4">
              <Input 
                icon={Lock} 
                label="Password" 
                type="password"
                placeholder="Create secure password"
                error={errors.password?.message}
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 8, message: "Min 8 characters required" }
                })}
              />
              {watchPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-600">Password Strength:</span>
                    <span className={`text-xs font-black ${
                      passwordStrength.label === "Weak" ? "text-red-500" : 
                      passwordStrength.label === "Fair" ? "text-yellow-500" : 
                      passwordStrength.label === "Good" ? "text-blue-500" : "text-emerald-500"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          level <= passwordStrength.strength ? passwordStrength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Input 
              icon={Lock} 
              label="Confirm Password" 
              type="password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", { 
                required: "Please confirm your password",
                validate: (value) => value === watchPassword || "Passwords do not match"
              })}
            />
            {watchConfirmPassword && (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                {watchConfirmPassword === watchPassword ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
            <button 
              type="button"
              onClick={handleNext}
              className="w-full mt-4 py-4 bg-[#061446] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all"
            >
              Company Details <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Input 
              icon={Building2} 
              label="Company Name" 
              placeholder="e.g. Acme Corp"
              error={errors.companyName?.message}
              {...register("companyName", { required: "Company name is required" })}
            />
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  Industry
                </div>
              </label>
              <select
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium transition-all outline-none ${
                  errors.industry ? "border-red-300" : "border-transparent focus:border-indigo-500 focus:bg-white"
                }`}
                {...register("industry", { required: "Industry is required" })}
              >
                <option value="">Select your industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-xs font-bold text-red-500">{errors.industry.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-slate-400" />
                  Company Size
                </div>
              </label>
              <select
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-medium transition-all outline-none ${
                  errors.companySize ? "border-red-300" : "border-transparent focus:border-indigo-500 focus:bg-white"
                }`}
                {...register("companySize", { required: "Company size is required" })}
              >
                <option value="">Select company size</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>{size} employees</option>
                ))}
              </select>
              {errors.companySize && (
                <p className="mt-1 text-xs font-bold text-red-500">{errors.companySize.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-all"
                  {...register("termsAccepted", { 
                    required: "You must accept the terms of service" 
                  })}
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  I agree to the{" "}
                  <a href="#" className="text-indigo-600 font-bold hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-indigo-600 font-bold hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-2 text-xs font-bold text-red-500">{errors.termsAccepted.message}</p>
              )}
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <button 
                disabled={isSubmitting}
                className="flex-1 py-4 bg-[#061446] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        Already registered?{" "}
        <button type="button" onClick={onSwitch} className="text-[#061446] font-black uppercase tracking-wider hover:underline ml-1">
          Login here
        </button>
      </p>
    </form>
  );
};
