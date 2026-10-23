import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PackageCheck,
  ShieldAlert
} from 'lucide-react';

const SEVERITY_CONFIG = {
  Critical: {
    bg: 'bg-sahay-terracotta-light text-sahay-terracotta border-sahay-terracotta/30',
    icon: ShieldAlert,
    label: 'Critical',
  },
  High: {
    bg: 'bg-sahay-ochre-light text-sahay-ochre border-sahay-ochre/30',
    icon: AlertTriangle,
    label: 'High',
  },
  Medium: {
    bg: 'bg-sahay-teal-light text-sahay-forest-action border-sahay-teal/30',
    icon: AlertCircle,
    label: 'Medium',
  },
  Low: {
    bg: 'bg-sahay-border-light text-sahay-slate border-sahay-border',
    icon: Info,
    label: 'Low',
  },
};

const STATUS_CONFIG = {
  Detected: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  Acknowledged: {
    bg: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Info,
  },
  'Action Assigned': {
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Clock,
  },
  'In Progress': {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Clock,
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  Submitted: {
    bg: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: Clock,
  },
  'Under Review': {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  Verified: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  Approved: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  Allocated: {
    bg: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: PackageCheck,
  },
  Dispatched: {
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Truck,
  },
  Delivered: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  Rejected: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: AlertCircle,
  },
  Active: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  Deployed: {
    bg: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: CheckCircle2,
  },
  Available: {
    bg: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: Clock,
  },
};

export const SeverityBadge = ({ severity, className = '' }) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Low;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${config.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    bg: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: Info,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${config.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
};
