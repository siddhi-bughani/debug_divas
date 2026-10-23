import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  FileText,
  HeartHandshake,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

const CATEGORY_ICONS = {
  Alert: { icon: AlertTriangle, color: 'text-sahay-terracotta bg-sahay-terracotta-light' },
  Request: { icon: PackageCheck, color: 'text-sahay-forest-action bg-sahay-forest-light' },
  Report: { icon: FileText, color: 'text-sahay-ochre bg-sahay-ochre-light' },
  Inventory: { icon: PackageCheck, color: 'text-sahay-teal bg-sahay-teal-light' },
  Allocation: { icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  Donation: { icon: HeartHandshake, color: 'text-indigo-700 bg-indigo-50' },
  Volunteer: { icon: Users, color: 'text-amber-700 bg-amber-50' },
  Emergency: { icon: ShieldAlert, color: 'text-rose-700 bg-rose-50' },
  General: { icon: Clock, color: 'text-sahay-slate bg-sahay-border-light' },
};

export const OperationsTimeline = ({ activities = [] }) => {
  return (
    <div className="bg-white rounded border border-sahay-border shadow-subtle p-5">
      <div className="flex items-center justify-between pb-3 border-b border-sahay-border">
        <div>
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Operations Activity Timeline
          </h3>
          <p className="text-xs text-sahay-slate mt-0.5">
            Audit stream of alerts, verification steps, and logistics dispatch
          </p>
        </div>
        <span className="text-xs text-sahay-slate font-mono">{activities.length} Events</span>
      </div>

      <div className="mt-4 flow-root">
        <ul className="-mb-6">
          {activities.slice(0, 8).map((act, index) => {
            const isLast = index === activities.slice(0, 8).length - 1;
            const meta = CATEGORY_ICONS[act.category] || CATEGORY_ICONS.General;
            const Icon = meta.icon;

            return (
              <li key={act.id}>
                <div className="relative pb-5">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-3.5 -ml-px h-full w-0.5 bg-sahay-border"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className={`relative px-1.5 py-1.5 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <div>
                        <p className="text-xs font-semibold text-sahay-charcoal">
                          <span>{act.action}</span>
                          <span className="font-normal text-sahay-slate"> by </span>
                          <span className="font-medium text-sahay-forest-deep">{act.user}</span>
                        </p>
                        <p className="text-xs text-sahay-slate line-clamp-1 mt-0.5">
                          {act.target}
                        </p>
                      </div>

                      <span className="text-[11px] text-sahay-slate shrink-0 font-mono">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
