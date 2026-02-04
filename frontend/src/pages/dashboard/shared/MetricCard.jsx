import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Card } from "./Card";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const MetricCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-5 flex items-center gap-4 border-none shadow-md bg-white">
    <div className={cn("p-3 rounded-2xl", 
      color === 'amber' ? "bg-amber-50 text-amber-600" : 
      color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
    )}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  </Card>
);
