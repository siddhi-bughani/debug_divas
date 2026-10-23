import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { AlertDetailDrawer } from '../components/alerts/AlertDetailDrawer';
import { AllocationModal } from '../components/forms/AllocationModal';
import { checkEscalationStatus } from '../utils/shortageRules';
import { exportToCSV } from '../utils/csvExport';
import { formatRelativeTime } from '../utils/formatters';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Download,
  RefreshCw,
  Boxes,
  Clock,
  MapPin,
  ChevronRight,
  Info,
} from 'lucide-react';

export const ShortageAlertsPage = () => {
  const { alerts, camps, simulateAlertRefresh, responseTargets } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [selectedAlertForDrawer, setSelectedAlertForDrawer] = useState(null);
  const [selectedAlertForAllocation, setSelectedAlertForAllocation] = useState(null);

  // Active Critical and High summary counts
  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length;
  const highCount = alerts.filter((a) => a.severity === 'High' && a.status !== 'Resolved').length;
  const activeCount = alerts.filter((a) => a.status !== 'Resolved').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.resourceItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.campName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && alert.resourceCategory !== categoryFilter) return false;

      if (statusFilter === 'ACTIVE' && alert.status === 'Resolved') return false;
      if (statusFilter === 'RESOLVED' && alert.status !== 'Resolved') return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'ACTIVE' && statusFilter !== 'RESOLVED' && alert.status !== statusFilter) return false;

      return true;
    });
  }, [alerts, searchQuery, severityFilter, categoryFilter, statusFilter]);

  const handleExportCSV = () => {
    const csvData = filteredAlerts.map((a) => {
      const esc = checkEscalationStatus(a, responseTargets);
      return {
        'Alert ID': a.id,
        'Resource Item': a.resourceItem,
        Category: a.resourceCategory,
        'Camp Name': a.campName,
        Severity: a.severity,
        Status: a.status,
        'Available Qty': a.availableQuantityAtDetection,
        'Safety Stock': a.safetyStockThreshold,
        'Estimated Shortfall': a.estimatedShortageQuantity,
        Unit: a.unit,
        'People Affected': a.peopleAffected,
        'Detected At': a.detectedAt,
        'Elapsed Hours': esc.elapsedHours,
        'SLA Breached': esc.isBreached ? 'YES' : 'NO',
        'Assigned To': a.assignedTo || 'Unassigned',
      };
    });
    exportToCSV(csvData, `sahay-shortage-alerts-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Smart Shortage Alert System
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Automated threshold evaluation, deterministic severity scoring, deduplication, and escalation tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => simulateAlertRefresh(4)}
            className="px-3 py-1.5 rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-xs font-semibold text-sahay-forest-deep flex items-center gap-1.5 transition-colors"
            title="Simulate 4-hour clock advance to test escalation SLA response targets"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sahay-slate" />
            <span>Simulate SLA Escalation (+4h)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded border border-sahay-border bg-white hover:bg-sahay-ivory text-xs font-medium text-sahay-slate hover:text-sahay-charcoal transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Urgent Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-white border border-l-4 border-sahay-border border-l-sahay-terracotta shadow-subtle">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Critical Shortages</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-sahay-terracotta">{criticalCount}</span>
            <span className="text-xs text-sahay-slate">Life-support stockout</span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-white border border-l-4 border-sahay-border border-l-sahay-ochre shadow-subtle">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">High Severity</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-sahay-ochre">{highCount}</span>
            <span className="text-xs text-sahay-slate">Severe deficit</span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-white border border-sahay-border shadow-subtle">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Total Active Alerts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-sahay-forest-deep">{activeCount}</span>
            <span className="text-xs text-sahay-slate">Under management</span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-white border border-sahay-border shadow-subtle">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Verified Resolved</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-sahay-green">{resolvedCount}</span>
            <span className="text-xs text-sahay-slate">Condition cleared</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Strip */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource, camp, alert ID, or explanation..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical Severity</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Food Supplies">Food Supplies</option>
            <option value="Sanitary Pads">Sanitary Pads</option>
            <option value="Essential Medicines">Essential Medicines</option>
            <option value="Blankets">Blankets</option>
            <option value="Hygiene Kits">Hygiene Kits</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ACTIVE">Active Unresolved Only</option>
            <option value="ALL">All Statuses</option>
            <option value="Detected">Status: Detected</option>
            <option value="Acknowledged">Status: Acknowledged</option>
            <option value="Action Assigned">Status: Action Assigned</option>
            <option value="In Progress">Status: In Progress</option>
            <option value="RESOLVED">Status: Resolved</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredAlerts.length}</strong> alerts
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Alert ID & Resource</th>
                <th className="py-3 px-4">Affected Relief Camp</th>
                <th className="py-3 px-4">Severity & SLA Target</th>
                <th className="py-3 px-4">Available vs Safety</th>
                <th className="py-3 px-4">Estimated Shortfall</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sahay-slate italic">
                    No shortage alerts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const escalation = checkEscalationStatus(alert, responseTargets);

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlertForDrawer(alert)}
                      className="hover:bg-sahay-ivory/40 cursor-pointer transition-colors"
                    >
                      {/* ID & Resource */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light font-bold">
                            {alert.id}
                          </span>
                          <span className="font-bold text-sahay-forest-deep">{alert.resourceItem}</span>
                        </div>
                        <p className="text-[11px] text-sahay-slate mt-0.5 line-clamp-1">{alert.resourceCategory}</p>
                      </td>

                      {/* Camp */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sahay-charcoal">{alert.campName}</p>
                        <p className="text-[10px] text-sahay-slate">{alert.locationAddress}</p>
                      </td>

                      {/* Severity & SLA */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={alert.severity} />
                          {escalation.isBreached && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sahay-terracotta text-white">
                              SLA Breached
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-sahay-slate mt-0.5 font-mono">
                          {escalation.elapsedHours}h elapsed / {escalation.targetHours}h max
                        </p>
                      </td>

                      {/* Stock vs Safety */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-sahay-charcoal">
                          {alert.availableQuantityAtDetection} {alert.unit}
                        </span>
                        <span className="text-sahay-slate"> / {alert.safetyStockThreshold} {alert.unit}</span>
                      </td>

                      {/* Shortfall */}
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-sahay-terracotta">
                          {alert.estimatedShortageQuantity > 0 ? `-${alert.estimatedShortageQuantity} ${alert.unit}` : '0 (Cleared)'}
                        </span>
                        <p className="text-[10px] text-sahay-slate">~{alert.peopleAffected} people</p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={alert.status} />
                        {alert.assignedTo && (
                          <p className="text-[10px] text-sahay-slate mt-0.5 truncate max-w-[120px]">
                            {alert.assignedTo}
                          </p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlertForAllocation(alert);
                            }}
                            className="px-2 py-1 rounded bg-sahay-forest-light text-sahay-forest-action hover:bg-sahay-forest-action hover:text-white transition-colors text-xs font-medium"
                          >
                            Allocate
                          </button>
                          <ChevronRight className="w-4 h-4 text-sahay-slate" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Detail Drawer */}
      <AlertDetailDrawer
        alert={selectedAlertForDrawer}
        isOpen={Boolean(selectedAlertForDrawer)}
        onClose={() => setSelectedAlertForDrawer(null)}
        onOpenAllocationModal={(alt) => setSelectedAlertForAllocation(alt)}
      />

      {/* Rule-Based Allocation Recommendation Modal */}
      <AllocationModal
        alert={selectedAlertForAllocation}
        isOpen={Boolean(selectedAlertForAllocation)}
        onClose={() => setSelectedAlertForAllocation(null)}
      />
    </div>
  );
};
