import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }) => (
  <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm", className)}>
    {children}
  </div>
);
