import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

export const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased overflow-hidden">
    <div className="flex-1 flex items-center justify-center p-8 z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#061446] rounded-xl flex items-center justify-center shadow-lg shadow-[#061446]/20">
            <Zap className="text-[#C1DCE2] w-6 h-6 fill-[#C1DCE2]" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-[#061446] uppercase">HireFlow</span>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#061446] tracking-tight uppercase leading-none">{title}</h1>
          <p className="text-slate-500 font-medium mt-2">{subtitle}</p>
        </div>

        {children}
      </motion.div>
    </div>

    <div className="hidden lg:flex flex-1 relative bg-[#061446] items-center justify-center p-20 overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1764539780901-0a13bf4f4182?q=80&w=1200" 
          alt="Office" 
          className="w-full h-full object-cover grayscale mix-blend-overlay"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#061446] via-[#061446]/90 to-transparent" />
      
      <div className="relative z-10 max-w-lg">
        <div className="bg-[#C1DCE2] p-3 rounded-2xl w-fit mb-8 shadow-2xl">
          <Brain className="w-10 h-10 text-[#061446]" />
        </div>
        <h2 className="text-5xl font-black text-white leading-tight uppercase tracking-tighter mb-6">
          The future of <span className="text-[#C1DCE2]">Intelligent</span> Recruitment
        </h2>
        <p className="text-[#C1DCE2]/70 text-lg font-medium leading-relaxed">
          Streamline your entire hiring pipeline with AI-driven assessments, automated scheduling, and multi-platform distribution.
        </p>
        
        <div className="mt-12 flex gap-12">
          <div>
            <p className="text-white text-3xl font-black">98%</p>
            <p className="text-[#C1DCE2]/50 text-xs font-black uppercase tracking-widest mt-1">Accuracy</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-white text-3xl font-black">12k+</p>
            <p className="text-[#C1DCE2]/50 text-xs font-black uppercase tracking-widest mt-1">Hires Made</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#C1DCE2]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
    </div>
  </div>
);
