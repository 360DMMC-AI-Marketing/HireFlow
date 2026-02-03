import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

export const Input = React.forwardRef(({ label, error, icon: Icon, ...props }, ref) => (
  <div className="space-y-1.5 mb-5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
        error ? "text-red-500" : "text-slate-400 group-focus-within:text-[#061446]"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <input 
        ref={ref}
        {...props}
        className={cn(
          "w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold bg-white border outline-none transition-all",
          error 
            ? "border-red-200 bg-red-50 focus:ring-4 focus:ring-red-500/5 focus:border-red-500" 
            : "border-slate-200 focus:border-[#061446] focus:ring-8 focus:ring-[#C1DCE2]/20"
        )}
      />
    </div>
    {error && (
      <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-red-500 animate-in fade-in slide-in-from-top-1">
        <AlertCircle className="w-3 h-3" />
        <p className="text-[10px] font-black uppercase">{error}</p>
      </div>
    )}
  </div>
));

Input.displayName = "Input";
