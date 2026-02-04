import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyEmail } from "../../../services/authService";

export const EmailVerificationView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [autoVerifying, setAutoVerifying] = useState(false);

  // Auto-verify if token is in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !autoVerifying) {
      setAutoVerifying(true);
      handleVerifyWithToken(token);
    }
  }, [searchParams]);

  const handleVerifyWithToken = async (token) => {
    setLoading(true);
    try {
      await verifyEmail(token);
      toast.success("Email verified successfully! You can now log in.");
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      toast.error(error.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = () => {
    if (!manualToken.trim()) {
      toast.error("Please enter a verification token");
      return;
    }
    handleVerifyWithToken(manualToken);
  };

  return (
    <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-[#C1DCE2]/30 text-[#061446] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <Mail className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-[#061446] tracking-tighter uppercase mb-3">
        {autoVerifying ? "Verifying..." : "Check your inbox"}
      </h1>
      <p className="text-slate-500 font-medium mb-10">
        {autoVerifying 
          ? "We're verifying your email address..." 
          : "We've sent a verification link to your email. Click it to secure your account and start hiring."}
      </p>
      
      {!autoVerifying && (
        <div className="space-y-4">
          <div className="text-left">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
              Or paste your verification token:
            </label>
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste token from backend console"
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#061446] focus:outline-none transition-colors text-sm"
            />
          </div>
          
          <button 
            onClick={handleManualVerify}
            disabled={loading}
            className="w-full py-4 bg-[#061446] text-[#C1DCE2] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Email"}
          </button>
          
          <p className="text-xs text-slate-400 mt-4">
            Check your backend console for the verification token if emails aren't working
          </p>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#061446]" />
        </div>
      )}
    </div>
  );
};
