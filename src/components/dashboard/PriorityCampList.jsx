import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  MapPin,
  Users,
  Clock,
  ShieldAlert,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { calculateCampPriority } from '../../utils/priorityCalculator';
import { SeverityBadge } from '../common/Badge';
import { formatRelativeTime } from '../../utils/formatters';

export const PriorityCampList = ({ camps, alerts, incidents, requests }) => {
  // Rank camps by priority score
  const rankedCamps = camps
    .map((camp) => {
      const priorityInfo = calculateCampPriority(camp, alerts, incidents, requests);
      const campAlerts = alerts.filter((a) => a.campId === camp.id && a.status !== 'Resolved');
      const campRequests = requests.filter((r) => r.campId === camp.id && ['Submitted', 'Under Review', 'Approved'].includes(r.status));
      const criticalAlerts = campAlerts.filter((a) => a.severity === 'Critical');

      return {
        ...camp,
        priorityInfo,
        campAlerts,
        campRequests,
        criticalAlerts,
      };
    })
    .sort((a, b) => b.priorityInfo.score - a.priorityInfo.score);

  const topPriorityCamps = rankedCamps.slice(0, 4);

  return (
    <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-sahay-border bg-sahay-ivory/50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sahay-terracotta" />
            <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
              Where Help Is Needed Most
            </h3>
          </div>
          <p className="text-xs text-sahay-slate mt-0.5">
            Ranked by deterministic urgency scoring: critical shortages, medical incidents, and population density.
          </p>
        </div>

        <Link
          to="/camps"
          className="text-xs text-sahay-forest-action hover:text-sahay-forest-hover font-semibold flex items-center gap-1"
        >
          <span>View All Camps</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Priority Camp Items */}
      <div className="divide-y divide-sahay-border">
        {topPriorityCamps.map((camp, index) => {
          const isCritical = camp.priorityInfo.tier === 'Critical';

          return (
            <div
              key={camp.id}
              className={`p-5 transition-colors hover:bg-sahay-ivory/40 ${
                isCritical ? 'border-l-4 border-l-sahay-terracotta' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Column: Camp Info & Prioritization Justification */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep font-mono">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-sahay-forest-deep">
                      {camp.name}
                    </h4>
                    <span className="text-xs text-sahay-slate">•</span>
                    <span className="text-xs text-sahay-slate flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {camp.address}, {camp.district}
                    </span>
                  </div>

                  {/* Why this camp is prioritized (Explicit Explainable Reason) */}
                  <div className="p-2.5 rounded bg-sahay-ivory border border-sahay-border-light text-xs text-sahay-charcoal">
                    <strong className="text-sahay-forest-deep font-semibold">Priority Diagnosis: </strong>
                    <span>{camp.priorityInfo.primaryReason}</span>
                  </div>

                  {/* Operational Details Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sahay-slate pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sahay-slate" />
                      <span>Population affected: <strong>{camp.currentOccupancy}</strong> ({camp.capacity} cap)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-sahay-ochre" />
                      <span>Active alerts: <strong>{camp.campAlerts.length}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-sahay-forest-action" />
                      <span>Pending requests: <strong>{camp.campRequests.length}</strong></span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>Updated {formatRelativeTime(camp.lastUpdated)}</span>
                    </span>
                  </div>
                </div>

                {/* Right Column: Priority Score + Recommended Next Action Button */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-sahay-border-light">
                  <div className="text-left lg:text-right">
                    <div className="flex items-center lg:justify-end gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-sahay-slate">Priority Score</span>
                      <SeverityBadge severity={camp.priorityInfo.tier} />
                    </div>
                    <div className="text-2xl font-bold font-mono text-sahay-forest-deep">
                      {camp.priorityInfo.score}
                      <span className="text-xs text-sahay-slate font-normal"> / 100</span>
                    </div>
                  </div>

                  <Link
                    to={`/camps/${camp.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-sahay-forest-action text-white hover:bg-sahay-forest-hover transition-colors shadow-subtle"
                  >
                    <span>Manage Camp Relief</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
