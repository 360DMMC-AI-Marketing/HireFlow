import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export const Breadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            {isLast ? (
              <span className="text-slate-900 font-semibold">
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.href} 
                className="text-slate-500 hover:text-indigo-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
