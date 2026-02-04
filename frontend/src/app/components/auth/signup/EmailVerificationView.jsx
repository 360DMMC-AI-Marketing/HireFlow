import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const EmailVerificationView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('authToken', 'mock-token-' + Date.now());
      toast.success("Email verified! Welcome to the platform.");
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-[#C1DCE2]/30 text-[#061446] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <Mail className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-[#061446] tracking-tighter uppercase mb-3">Check your inbox</h1>
      <p className="text-slate-500 font-medium mb-10">We've sent a verification link to your email. Click it to secure your account and start hiring.</p>
      
      <div className="space-y-4">
        <button 
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-4 bg-[#061446] text-[#C1DCE2] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "I've verified my email"}
        </button>
        <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#061446] transition-colors py-2">
          Resend verification link
        </button>
      </div>
    </div>
  );
};
