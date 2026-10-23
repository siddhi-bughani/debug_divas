import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { analyticsService } from '../services/analyticsService';
import { StatCard } from '../components/common/StatCard';
import { PriorityCampList } from '../components/dashboard/PriorityCampList';
import { OperationsTimeline } from '../components/dashboard/OperationsTimeline';
import { OverviewCharts } from '../components/dashboard/OverviewCharts';
import {
  Tent,
  AlertTriangle,
  ShieldAlert,
  Boxes,
  Users,
  PackageSearch,
  CheckCircle2,
  HeartHandshake,
  TrendingUp,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export const DashboardPage = () => {
  const { camps, alerts, requests, incidents, volunteers, inventory, activities } = useAppData();

  const metrics = analyticsService.getOverviewMetrics({
    camps,
    alerts,
    requests,
    incidents,
    volunteers,
    inventory,
  });

  const totalInventoryUnits = inventory.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Relief Operations Command Center
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Real-time multi-agency coordination dashboard across relief shelters, supply hubs, and field responders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sahay-green-light border border-sahay-green/30 text-sahay-green text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-sahay-green animate-pulse" />
            <span>Operational Grid Online</span>
          </span>
        </div>
      </div>

      {/* Summary Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Active Relief Camps"
          value={metrics.activeCampsCount}
          subtext={`${camps.length} total facilities`}
          icon={Tent}
          to="/camps"
          tone="neutral"
        />

        <StatCard
          label="Urgent Intervention"
          value={metrics.urgentCampsCount}
          subtext="Critical deficits detected"
          icon={AlertTriangle}
          to="/camps?filter=urgent"
          tone="critical"
          badge={`${Math.round((metrics.urgentCampsCount / Math.max(1, camps.length)) * 100)}% of total`}
        />

        <StatCard
          label="Active Shortage Alerts"
          value={metrics.activeAlertsCount}
          subtext="Evaluated by rules engine"
          icon={ShieldAlert}
          to="/alerts"
          tone="critical"
        />

        <StatCard
          label="Critical Incidents"
          value={metrics.criticalIncidentsCount}
          subtext="Medical & safety events"
          icon={ShieldAlert}
          to="/incidents"
          tone="critical"
        />

        <StatCard
          label="Pending Requests"
          value={metrics.pendingRequestsCount}
          subtext="Awaiting dispatch or review"
          icon={PackageSearch}
          to="/requests"
          tone="warning"
        />

        <StatCard
          label="People Needing Aid"
          value={formatNumber(metrics.totalPeopleAffected)}
          subtext="Registered camp occupants"
          icon={Users}
          to="/camps"
          tone="teal"
        />

        <StatCard
          label="Available Inventory"
          value={formatNumber(totalInventoryUnits)}
          subtext="Units in depots & camps"
          icon={Boxes}
          to="/inventory"
          tone="neutral"
        />

        <StatCard
          label="Volunteers Deployed"
          value={`${metrics.deployedVolunteersCount} / ${metrics.totalVolunteersCount}`}
          subtext="Active on-site responders"
          icon={Users}
          to="/volunteers"
          tone="success"
        />
      </div>

      {/* Priority Section: Where Help Is Needed Most */}
      <PriorityCampList
        camps={camps}
        alerts={alerts}
        incidents={incidents}
        requests={requests}
      />

      {/* Visual Analytics / Overview Charts */}
      <OverviewCharts
        inventory={inventory}
        requests={requests}
        alerts={alerts}
        camps={camps}
      />

      {/* Operations Activity Timeline */}
      <OperationsTimeline activities={activities} />
    </div>
  );
};
