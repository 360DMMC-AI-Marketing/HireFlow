import React from "react";

export const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
    <p className="text-slate-500 text-sm font-medium mt-1">{subtitle}</p>
  </div>
);
