import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { calculateCampPriority } from '../utils/priorityCalculator';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { ResourceRequestModal } from '../components/forms/ResourceRequestModal';
import { IncidentModal } from '../components/forms/IncidentModal';
import { AllocationModal } from '../components/forms/AllocationModal';
import { AlertDetailDrawer } from '../components/alerts/AlertDetailDrawer';
import {
  ArrowLeft,
  MapPin,
  Users,
  AlertTriangle,
  Boxes,
  ShieldAlert,
  FileText,
  Clock,
  Plus,
  PackageSearch,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';

export const CampDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { camps, inventory, alerts, requests, reports, incidents, activities } = useAppData();

  const [activeTab, setActiveTab] = useState('overview');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedAlertForDrawer, setSelectedAlertForDrawer] = useState(null);
  const [selectedAlertForAllocation, setSelectedAlertForAllocation] = useState(null);

  const camp = camps.find((c) => c.id === id);

  if (!camp) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-bold text-sahay-forest-deep">Camp Not Found</h2>
        <p className="text-xs text-sahay-slate">The specified camp identifier does not exist in the registered registry.</p>
        <Link to="/camps" className="inline-block px-3 py-1.5 rounded bg-sahay-forest-action text-white text-xs">
          Return to Camps Directory
        </Link>
      </div>
    );
  }

  // Filter linked records for this specific camp entity
  const campInventory = inventory.filter((i) => i.locationId === camp.id && i.locationType === 'Camp');
  const campAlerts = alerts.filter((a) => a.campId === camp.id);
  const activeAlerts = campAlerts.filter((a) => a.status !== 'Resolved');
  const campRequests = requests.filter((r) => r.campId === camp.id);
  const campReports = reports.filter((rep) => rep.campId === camp.id);
  const campIncidents = incidents.filter((i) => i.campId === camp.id);
  const campActivities = activities.filter((act) => act.target && (act.target.includes(camp.id) || act.target.includes(camp.name)));

  const priorityInfo = calculateCampPriority(camp, alerts, incidents, requests);

  const TABS = [
    { id: 'overview', label: 'Camp Overview' },
    { id: 'inventory', label: `Inventory Stock (${campInventory.length})` },
    { id: 'alerts', label: `Shortage Alerts (${activeAlerts.length})` },
    { id: 'requests', label: `Resource Requests (${campRequests.length})` },
    { id: 'reports', label: `Public Reports (${campReports.length})` },
    { id: 'incidents', label: `Medical & Safety (${campIncidents.length})` },
    { id: 'activity', label: 'Activity History' },
  ];

  return (
    <div className="space-y-6">
      {/* Back breadcrumb and Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/camps')}
            className="p-1.5 rounded border border-sahay-border bg-white text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-ivory transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep font-semibold">
                {camp.id}
              </span>
              <h1 className="text-xl font-bold text-sahay-forest-deep tracking-tight">
                {camp.name}
              </h1>
              <SeverityBadge severity={priorityInfo.tier} />
            </div>
            <p className="text-xs text-sahay-slate mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sahay-slate" />
              <span>{camp.address}, {camp.district}, {camp.state} • Coordinates: [{camp.coordinates.join(', ')}]</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="px-3 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <PackageSearch className="w-3.5 h-3.5" />
            <span>Create Request</span>
          </button>

          <button
            type="button"
            onClick={() => setIsIncidentModalOpen(true)}
            className="px-3 py-1.5 rounded border border-sahay-terracotta/40 bg-sahay-terracotta-light text-sahay-terracotta hover:bg-sahay-terracotta hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Log Incident</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-white border border-sahay-border">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Occupancy Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-sahay-charcoal">
              {camp.currentOccupancy} / {camp.capacity}
            </span>
            <span className="text-xs text-sahay-slate font-medium">
              ({Math.round((camp.currentOccupancy / camp.capacity) * 100)}%)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-white border border-sahay-border">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Urgency Priority</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-sahay-forest-deep font-mono">
              {priorityInfo.score} <span className="text-xs text-sahay-slate font-normal">/ 100</span>
            </span>
            <SeverityBadge severity={priorityInfo.tier} />
          </div>
        </div>

        <div className="p-3.5 rounded bg-white border border-sahay-border">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Active Shortage Alerts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-sahay-terracotta">
              {activeAlerts.length}
            </span>
            <span className="text-xs text-sahay-slate">Shortfalls detected</span>
          </div>
        </div>

        <div className="p-3.5 rounded bg-white border border-sahay-border">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Camp In-Charge</span>
          <div className="mt-1">
            <p className="text-xs font-bold text-sahay-charcoal truncate">{camp.manager}</p>
            <p className="text-[10px] text-sahay-slate font-mono">{camp.contactPhone}</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-sahay-border flex items-center gap-1 overflow-x-auto text-xs font-medium">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2.5 whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-sahay-forest-action text-sahay-forest-deep font-bold bg-white'
                : 'border-transparent text-sahay-slate hover:text-sahay-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Priority Diagnosis */}
          <div className="p-4 rounded border border-sahay-border bg-sahay-ivory/60 space-y-2">
            <h3 className="text-xs font-bold text-sahay-forest-deep uppercase tracking-wider">
              Prioritization Diagnosis
            </h3>
            <p className="text-xs text-sahay-charcoal leading-relaxed">
              {priorityInfo.primaryReason}
            </p>
            <p className="text-[11px] text-sahay-slate">
              Primary Vulnerability: {camp.primaryVulnerability}
            </p>
          </div>

          {/* Quick Active Alerts list */}
          <div className="bg-white rounded border border-sahay-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-sahay-forest-deep uppercase tracking-wider">
                Unresolved Shortage Deficits
              </h3>
              <span className="text-xs text-sahay-slate">{activeAlerts.length} Active</span>
            </div>

            {activeAlerts.length === 0 ? (
              <p className="text-xs text-sahay-slate italic py-2">No active shortages detected at this shelter.</p>
            ) : (
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertForDrawer(alert)}
                    className="p-3 rounded border border-sahay-border hover:bg-sahay-ivory/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sahay-charcoal">{alert.resourceItem}</span>
                        <SeverityBadge severity={alert.severity} />
                      </div>
                      <p className="text-sahay-slate mt-0.5 line-clamp-1">{alert.explanation}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sahay-terracotta font-semibold">
                        -{alert.estimatedShortageQuantity} {alert.unit}
                      </span>
                      <ChevronRight className="w-4 h-4 text-sahay-slate" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded border border-sahay-border overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase">
                <th className="py-3 px-4">Item & Category</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Reserved Stock</th>
                <th className="py-3 px-4">Safety Threshold</th>
                <th className="py-3 px-4">Estimated Demand</th>
                <th className="py-3 px-4">Status Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {campInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sahay-slate italic">
                    No dedicated inventory line items registered yet.
                  </td>
                </tr>
              ) : (
                campInventory.map((item) => {
                  const unreserved = Math.max(0, item.availableQuantity - item.reservedQuantity);
                  const isBelow = unreserved < item.safetyStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-sahay-ivory/20">
                      <td className="py-3 px-4">
                        <p className="font-bold text-sahay-forest-deep">{item.itemName}</p>
                        <p className="text-[10px] text-sahay-slate">{item.category}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-sahay-charcoal">
                        {item.availableQuantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sahay-slate">
                        {item.reservedQuantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sahay-slate">
                        {item.safetyStockThreshold} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sahay-slate">
                        {item.estimatedDemand} {item.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBelow
                              ? 'bg-sahay-terracotta-light text-sahay-terracotta'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isBelow ? 'Below Safety Threshold' : 'Adequate'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Shortage Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {campAlerts.length === 0 ? (
            <p className="p-6 text-center text-xs text-sahay-slate italic bg-white rounded border border-sahay-border">
              No shortage alerts recorded for this camp.
            </p>
          ) : (
            campAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlertForDrawer(alert)}
                className="p-4 bg-white rounded border border-sahay-border shadow-subtle hover:bg-sahay-ivory/30 cursor-pointer transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light font-bold">
                      {alert.id}
                    </span>
                    <span className="font-bold text-sahay-forest-deep text-sm">{alert.resourceItem}</span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <StatusBadge status={alert.status} />
                </div>
                <p className="text-sahay-slate">{alert.explanation}</p>
                <div className="flex items-center justify-between text-[11px] text-sahay-slate pt-1 border-t border-sahay-border-light">
                  <span>Shortfall: <strong>{alert.estimatedShortageQuantity} {alert.unit}</strong></span>
                  <span>Detected {formatRelativeTime(alert.detectedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded border border-sahay-border overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase">
                <th className="py-3 px-4">Request Code</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Requested Qty</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {campRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sahay-slate italic">
                    No requests logged for this camp.
                  </td>
                </tr>
              ) : (
                campRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-sahay-ivory/20">
                    <td className="py-3 px-4 font-mono font-bold text-sahay-forest-deep">{r.id}</td>
                    <td className="py-3 px-4">{r.resourceItem}</td>
                    <td className="py-3 px-4 font-semibold">{r.requestedQuantity} {r.unit}</td>
                    <td className="py-3 px-4"><SeverityBadge severity={r.severity} /></td>
                    <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-sahay-slate">{formatRelativeTime(r.submittedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Public Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {campReports.length === 0 ? (
            <p className="p-6 text-center text-xs text-sahay-slate italic bg-white rounded border border-sahay-border">
              No ground public reports tagged for this camp.
            </p>
          ) : (
            campReports.map((rep) => (
              <div key={rep.id} className="p-4 bg-white rounded border border-sahay-border shadow-subtle space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-sahay-forest-action">{rep.referenceNumber}</span>
                    <span className="font-bold text-sahay-charcoal">{rep.category}</span>
                  </div>
                  <StatusBadge status={rep.status} />
                </div>
                <p className="text-sahay-slate">{rep.description}</p>
                <div className="flex items-center justify-between text-[11px] text-sahay-slate pt-1 border-t border-sahay-border-light">
                  <span>Reported by: {rep.reporterName || 'Citizen'}</span>
                  <span>{formatRelativeTime(rep.submittedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Medical Incidents */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {campIncidents.length === 0 ? (
            <p className="p-6 text-center text-xs text-sahay-slate italic bg-white rounded border border-sahay-border">
              No medical emergencies or severe incidents logged at this time.
            </p>
          ) : (
            campIncidents.map((inc) => (
              <div key={inc.id} className="p-4 bg-white rounded border border-sahay-border shadow-subtle space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-sahay-terracotta">{inc.id}</span>
                    <span className="font-bold text-sahay-charcoal">{inc.title}</span>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <p className="text-sahay-slate">{inc.notes}</p>
                <div className="flex items-center justify-between text-[11px] text-sahay-slate pt-1 border-t border-sahay-border-light">
                  <span>Assigned: <strong>{inc.assignedResponder}</strong></span>
                  <span>Impacted: ~{inc.peopleAffected}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 7: Activity History */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded border border-sahay-border p-5 space-y-3">
          {campActivities.length === 0 ? (
            <p className="text-xs text-sahay-slate italic">No specific activities logged for this camp yet.</p>
          ) : (
            <div className="space-y-3">
              {campActivities.map((act) => (
                <div key={act.id} className="p-2.5 rounded bg-sahay-ivory border border-sahay-border text-xs flex justify-between">
                  <div>
                    <span className="font-bold text-sahay-charcoal">{act.action}</span>
                    <span className="text-sahay-slate"> by {act.user}</span>
                    <p className="text-sahay-slate text-[11px] mt-0.5">{act.target}</p>
                  </div>
                  <span className="text-[10px] text-sahay-slate font-mono">{formatRelativeTime(act.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <ResourceRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        preselectedCampId={camp.id}
      />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
      />

      <AlertDetailDrawer
        alert={selectedAlertForDrawer}
        isOpen={Boolean(selectedAlertForDrawer)}
        onClose={() => setSelectedAlertForDrawer(null)}
        onOpenAllocationModal={(alt) => setSelectedAlertForAllocation(alt)}
      />

      <AllocationModal
        alert={selectedAlertForAllocation}
        isOpen={Boolean(selectedAlertForAllocation)}
        onClose={() => setSelectedAlertForAllocation(null)}
      />
    </div>
  );
};
