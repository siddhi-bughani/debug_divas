import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  to,
  tone = 'neutral', // 'neutral' | 'critical' | 'warning' | 'success' | 'teal'
  badge,
}) => {
  const navigate = useNavigate();

  const toneStyles = {
    neutral: 'border-sahay-border bg-white text-sahay-charcoal',
    critical: 'border-sahay-terracotta/40 bg-white border-l-4 border-l-sahay-terracotta text-sahay-charcoal',
    warning: 'border-sahay-ochre/40 bg-white border-l-4 border-l-sahay-ochre text-sahay-charcoal',
    success: 'border-sahay-green/40 bg-white border-l-4 border-l-sahay-green text-sahay-charcoal',
    teal: 'border-sahay-teal/40 bg-white border-l-4 border-l-sahay-teal text-sahay-charcoal',
  };

  const iconTones = {
    neutral: 'text-sahay-slate bg-sahay-forest-light/60',
    critical: 'text-sahay-terracotta bg-sahay-terracotta-light',
    warning: 'text-sahay-ochre bg-sahay-ochre-light',
    success: 'text-sahay-green bg-sahay-green-light',
    teal: 'text-sahay-teal bg-sahay-teal-light',
  };

  const handleClick = () => {
    if (to) navigate(to);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded border transition-all duration-150 relative ${
        to ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5' : ''
      } ${toneStyles[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-sahay-slate tracking-wide uppercase">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-sahay-charcoal">
              {value}
            </span>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-sahay-border-light text-sahay-slate">
                {badge}
              </span>
            )}
          </div>
          {subtext && (
            <p className="mt-1 text-xs text-sahay-slate line-clamp-1">{subtext}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-2 rounded shrink-0 ${iconTones[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {to && (
        <div className="mt-2.5 pt-2 border-t border-sahay-border-light flex items-center justify-between text-xs text-sahay-forest-action font-medium">
          <span>View records</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};
