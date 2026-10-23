import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { IncidentModal } from '../components/forms/IncidentModal';
import { exportToCSV } from '../utils/csvExport';
import { formatRelativeTime } from '../utils/formatters';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Download,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const IncidentsPage = () => {
  const { incidents, setIncidents, addActivity } = useAppData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncidentForUpdate, setSelectedIncidentForUpdate] = useState(null);
  const [updateResponder, setUpdateResponder] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.campName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;

      return true;
    });
  }, [incidents, searchQuery, severityFilter, statusFilter]);

  const advanceIncidentStatus = (incId, targetStatus) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === incId) {
          return {
            ...i,
            status: targetStatus,
            assignedResponder: updateResponder.trim() || i.assignedResponder,
            notes: updateNote.trim() ? `${i.notes ? i.notes + ' | ' : ''}${updateNote.trim()}` : i.notes,
          };
        }
        return i;
      })
    );

    addActivity(currentUser.name, 'Updated Incident Status', `${incId} marked as ${targetStatus}`, 'Emergency');
    toast.success(`Incident ${incId} marked as ${targetStatus}`);
    setSelectedIncidentForUpdate(null);
    setUpdateResponder('');
    setUpdateNote('');
  };

  const handleExportCSV = () => {
    const csvData = filteredIncidents.map((i) => ({
      'Incident ID': i.id,
      Title: i.title,
      Category: i.category,
      Camp: i.campName,
      Location: i.locationAddress,
      Severity: i.severity,
      Status: i.status,
      'People Affected': i.peopleAffected,
      'Assigned Responder': i.assignedResponder,
      'Reported At': i.reportedAt,
      Notes: i.notes,
    }));
    exportToCSV(csvData, `sahay-incidents-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const criticalIncidents = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Emergency & Medical Incident Command
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Rapid response triage for medical emergencies, water contamination, structural risks, and epidemic alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded border border-sahay-border bg-white hover:bg-sahay-ivory text-xs font-medium text-sahay-slate hover:text-sahay-charcoal transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-sahay-terracotta hover:bg-sahay-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Log Emergency Incident</span>
          </button>
        </div>
      </div>

      {/* Mandatory Regulatory / Operational Notice */}
      <div className="p-3.5 rounded bg-sahay-ivory border border-sahay-border flex items-center justify-between text-xs text-sahay-charcoal">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-sahay-forest-action shrink-0" />
          <span>
            <strong>Humanitarian Dispatch Protocol:</strong> SAHAY coordinates civilian and NGO logistics and alerts emergency responders. For life-threatening emergencies, notify state EMS (108 / 112) immediately.
          </span>
        </div>
        <span className="text-[10px] text-sahay-slate font-mono uppercase font-bold">Protocol Active</span>
      </div>

      {/* Critical Unresolved Incidents Banner */}
      {criticalIncidents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-sahay-forest-deep uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sahay-terracotta" />
            <span>Active Critical Incidents Requiring Immediate Follow-Up ({criticalIncidents.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded border border-l-4 border-sahay-terracotta bg-white shadow-subtle space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-terracotta">
                      {inc.id}
                    </span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <StatusBadge status={inc.status} />
                </div>

                <h4 className="font-bold text-xs text-sahay-forest-deep">{inc.title}</h4>
                <p className="text-xs text-sahay-slate">{inc.notes}</p>

                <div className="pt-2 border-t border-sahay-border-light flex items-center justify-between text-[11px] text-sahay-slate">
                  <span>Camp: <strong>{inc.campName}</strong></span>
                  <span>Responder: <strong>{inc.assignedResponder}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incident ID, title, camp, or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Verified">Verified</option>
            <option value="Response Assigned">Response Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredIncidents.length}</strong> incidents
        </div>
      </div>

      {/* Incident Directory Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Incident ID & Headline</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location / Relief Camp</th>
                <th className="py-3 px-4">Severity & Impact</th>
                <th className="py-3 px-4">Assigned Responder</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-sahay-ivory/30 transition-colors">
                  {/* ID & Title */}
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep font-bold">
                      {inc.id}
                    </span>
                    <p className="font-bold text-sahay-charcoal mt-1 line-clamp-1">{inc.title}</p>
                    <span className="text-[10px] text-sahay-slate">{formatRelativeTime(inc.reportedAt)}</span>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-sahay-slate">
                    {inc.category}
                  </td>

                  {/* Camp */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sahay-forest-deep">{inc.campName}</p>
                    <p className="text-[10px] text-sahay-slate">{inc.locationAddress}</p>
                  </td>

                  {/* Severity & Impact */}
                  <td className="py-3 px-4">
                    <SeverityBadge severity={inc.severity} />
                    <p className="text-[10px] text-sahay-slate mt-0.5">~{inc.peopleAffected} affected</p>
                  </td>

                  {/* Responder */}
                  <td className="py-3 px-4 text-sahay-slate">
                    <p className="font-semibold text-sahay-charcoal">{inc.assignedResponder}</p>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={inc.status} />
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIncidentForUpdate(inc);
                        setUpdateResponder(inc.assignedResponder || '');
                      }}
                      className="px-2.5 py-1 rounded bg-sahay-forest-light text-sahay-forest-action hover:bg-sahay-forest-action hover:text-white transition-colors text-xs font-medium"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Status Update Modal */}
      {selectedIncidentForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sahay-charcoal/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-sahay-border shadow-modal p-6 max-w-md w-full space-y-4 text-xs">
            <div>
              <h3 className="text-base font-bold text-sahay-forest-deep">
                Update Incident Status: {selectedIncidentForUpdate.id}
              </h3>
              <p className="text-xs text-sahay-slate mt-0.5">{selectedIncidentForUpdate.title}</p>
            </div>

            <div>
              <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                Assigned Responder / Medical Unit
              </label>
              <input
                type="text"
                value={updateResponder}
                onChange={(e) => setUpdateResponder(e.target.value)}
                placeholder="e.g. 108 Ambulance Unit #3 / Dr. Menon"
                className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                Field Progress Note
              </label>
              <textarea
                rows={2}
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Condition stabilized, patient transferred, supplies administered..."
                className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
              />
            </div>

            <div className="pt-2 border-t border-sahay-border space-y-2">
              <span className="font-semibold text-sahay-slate uppercase text-[10px] block">
                Transition Workflow State To:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => advanceIncidentStatus(selectedIncidentForUpdate.id, 'Response Assigned')}
                  className="px-2.5 py-1 rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-xs font-medium"
                >
                  Response Assigned
                </button>
                <button
                  type="button"
                  onClick={() => advanceIncidentStatus(selectedIncidentForUpdate.id, 'In Progress')}
                  className="px-2.5 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 text-xs font-medium"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => advanceIncidentStatus(selectedIncidentForUpdate.id, 'Resolved')}
                  className="px-2.5 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-medium"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-sahay-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIncidentForUpdate(null)}
                className="px-3 py-1.5 rounded border border-sahay-border text-xs text-sahay-slate hover:bg-sahay-border-light"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Incident Modal */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
