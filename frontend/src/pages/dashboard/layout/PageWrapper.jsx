import React from "react";
import { Breadcrumb } from "./Breadcrumb";

export const PageWrapper = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions = [], 
  children 
}) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  px-4 py-2.5 rounded-xl font-bold text-sm transition-all
                  ${action.variant === 'primary' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}
                `}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
};
