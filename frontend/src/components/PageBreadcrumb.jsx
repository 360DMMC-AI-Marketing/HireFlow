import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Auto-generate breadcrumbs from current path
const pathLabels = {
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  create: 'Create',
  edit: 'Edit',
  candidates: 'Candidates',
  add: 'Add',
  interviews: 'Interviews',
  settings: 'Settings',
  'email-templates': 'Email Templates',
  'email-activity': 'Email Activity',
  'ai-video': 'AI Video',
  analytics: 'Analytics',
  profile: 'Profile',
};

export function PageBreadcrumb({ customItems, helpText }) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  // Build breadcrumb items from URL path
  const items = customItems || segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    // Skip UUID-like segments for display
    const isId = /^[a-f0-9]{24}$/.test(segment) || /^[0-9a-f-]{36}$/.test(segment);
    const label = isId ? 'Detail' : pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    return { label, path, isLast };
  });

  if (items.length <= 1) return null; // Don't show for root pages

  return (
    <nav className="flex items-center gap-1 text-sm mb-4" aria-label="breadcrumb">
      <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition">
        <Home size={14} />
      </Link>
      {items.slice(1).map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} className="text-gray-300 mx-1" />
          {item.isLast ? (
            <span className="text-gray-700 font-medium">{item.label}</span>
          ) : (
            <Link to={item.path} className="text-gray-400 hover:text-gray-600 transition">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
      {helpText && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle size={14} className="text-gray-300 hover:text-gray-500 cursor-help ml-2 transition" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{helpText}</TooltipContent>
        </Tooltip>
      )}
    </nav>
  );
}

export function HelpTooltip({ text, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {children}
          <HelpCircle size={14} className="text-gray-300 hover:text-gray-500 transition" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}
