import React, { useState } from 'react';
import {
  Drawer
} from '../common/Drawer';
import {
  SeverityBadge,
  StatusBadge,
} from '../common/Badge';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Boxes,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  FileText,
  PackagePlus,
  Send,
  AlertCircle,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { checkEscalationStatus } from '../../utils/shortageRules';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const AlertDetailDrawer = ({
  alert,
  isOpen,
  onClose,
  onOpenAllocationModal,
}) => {
  const {
    acknowledgeAlert,
    assignAlertAction,
    resolveAlert,
    requests,
    reports,
    inventory,
    responseTargets,
    convertReportToRequest,
  } = useAppData();
  const { currentUser } = useAuth();

  const [assignedCoordinator, setAssignedCoordinator] = useState(alert?.assignedTo || '');
  const [internalNote, setInternalNote] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  if (!alert) return null;

  const escalation = checkEscalationStatus(alert, responseTargets);

  const handleAcknowledge = () => {
    acknowledgeAlert(alert.id, currentUser.name);
  };

  const handleAssignAction = (e) => {
    e.preventDefault();
    if (!assignedCoordinator.trim()) return;
    assignAlertAction(alert.id, assignedCoordinator.trim(), internalNote.trim());
    setIsAssigning(false);
    setInternalNote('');
  };

  const handleResolve = () => {
    resolveAlert(alert.id, currentUser.name);
  };

  // Find linked requests and reports
  const linkedRequestsList = requests.filter((r) =>
    (alert.linkedRequestIds || []).includes(r.id) || (r.campId === alert.campId && r.resourceCategory === alert.resourceCategory)
  );
  const linkedReportsList = reports.filter((rep) =>
    (alert.sourceReportIds || []).includes(rep.id)
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={alert.resourceItem}
      subtitle={`Alert ID: ${alert.id} • ${alert.campName}`}
      width="max-w-xl"
    >
      <div className="space-y-6">
        {/* Severity & Escalation Status Banner */}
        <div
          className={`p-4 rounded border flex items-start justify-between gap-3 ${
            escalation.isBreached
              ? 'bg-sahay-terracotta-light border-sahay-terracotta/40 text-sahay-charcoal'
              : 'bg-sahay-ivory border-sahay-border'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>

            {escalation.isBreached && (
              <div className="mt-2 text-xs font-semibold text-sahay-terracotta flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  SLA Target Breached: Unresolved for {escalation.elapsedHours}h (Target: {escalation.targetHours}h). Escalated to Priority Command.
                </span>
              </div>
            )}

            {!escalation.isBreached && alert.status !== 'Resolved' && (
              <p className="mt-1.5 text-xs text-sahay-slate">
                Detected {formatRelativeTime(alert.detectedAt)} ({escalation.elapsedHours}h elapsed of {escalation.targetHours}h response target).
              </p>
            )}

            {alert.status === 'Resolved' && (
              <p className="mt-1.5 text-xs text-sahay-green font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved at {formatDateTime(alert.resolvedAt)}</span>
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-sahay-slate uppercase font-mono block">Recurrence</span>
            <span className="text-xs font-bold text-sahay-charcoal">
              {alert.recurrenceCount > 1 ? `Recurrence #${alert.recurrenceCount}` : 'Initial Event'}
            </span>
          </div>
        </div>

        {/* Explainable Diagnostic Summary */}
        <div className="p-3.5 rounded bg-sahay-forest-light/40 border border-sahay-border text-xs leading-relaxed text-sahay-charcoal">
          <p className="font-semibold text-sahay-forest-deep mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-sahay-forest-action" />
            <span>Shortage Diagnostic:</span>
          </p>
          <p>{alert.explanation}</p>
        </div>

        {/* Recommended Action */}
        <div className="p-3.5 rounded bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Recommended Next Action:</span>
          </p>
          <p>{alert.recommendedAction}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded border border-sahay-border bg-sahay-ivory/50">
            <span className="text-[10px] text-sahay-slate uppercase block">Available Stock</span>
            <span className="text-base font-bold text-sahay-charcoal">
              {alert.availableQuantityAtDetection} <span className="text-xs font-normal text-sahay-slate">{alert.unit}</span>
            </span>
          </div>
          <div className="p-2.5 rounded border border-sahay-border bg-sahay-ivory/50">
            <span className="text-[10px] text-sahay-slate uppercase block">Safety Threshold</span>
            <span className="text-base font-bold text-sahay-charcoal">
              {alert.safetyStockThreshold} <span className="text-xs font-normal text-sahay-slate">{alert.unit}</span>
            </span>
          </div>
          <div className="p-2.5 rounded border border-sahay-border bg-sahay-terracotta-light/40 border-sahay-terracotta/20">
            <span className="text-[10px] text-sahay-terracotta uppercase font-bold block">Estimated Shortfall</span>
            <span className="text-base font-bold text-sahay-terracotta">
              {alert.estimatedShortageQuantity} <span className="text-xs font-normal text-sahay-slate">{alert.unit}</span>
            </span>
          </div>
          <div className="p-2.5 rounded border border-sahay-border bg-sahay-ivory/50">
            <span className="text-[10px] text-sahay-slate uppercase block">People Impacted</span>
            <span className="text-base font-bold text-sahay-charcoal">
              ~{alert.peopleAffected}
            </span>
          </div>
        </div>

        {/* Camp & Location Details */}
        <div className="border-t border-sahay-border pt-4 text-xs space-y-2">
          <h4 className="font-bold text-sahay-forest-deep uppercase tracking-wider text-[11px]">
            Location & Assigned Officer
          </h4>
          <div className="flex items-start gap-2 text-sahay-charcoal">
            <MapPin className="w-4 h-4 text-sahay-slate shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{alert.campName}</p>
              <p className="text-sahay-slate">{alert.locationAddress}, {alert.district}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sahay-charcoal pt-1">
            <UserCheck className="w-4 h-4 text-sahay-slate shrink-0" />
            <span>Currently Assigned: <strong>{alert.assignedTo || 'Unassigned'}</strong></span>
          </div>
        </div>

        {/* Workflow Actions Section */}
        {alert.status !== 'Resolved' && (
          <div className="border-t border-sahay-border pt-4 space-y-3">
            <h4 className="font-bold text-sahay-forest-deep uppercase tracking-wider text-[11px]">
              Response Actions
            </h4>

            <div className="flex flex-wrap gap-2">
              {alert.status === 'Detected' && (
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-sahay-forest-action text-white hover:bg-sahay-forest-hover transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge Alert</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAssigning(!isAssigning)}
                className="px-3 py-1.5 rounded text-xs font-medium border border-sahay-border bg-white text-sahay-charcoal hover:bg-sahay-ivory transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-sahay-slate" />
                <span>{isAssigning ? 'Cancel Assignment' : 'Assign Coordinator'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAllocationModal) onOpenAllocationModal(alert);
                }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-sahay-teal text-white hover:bg-sahay-teal/90 transition-colors flex items-center gap-1.5"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Generate Allocation Recommendation</span>
              </button>

              <button
                type="button"
                onClick={handleResolve}
                className="px-3 py-1.5 rounded text-xs font-medium border border-sahay-green text-sahay-green hover:bg-sahay-green-light transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify & Mark Resolved</span>
              </button>
            </div>

            {/* Coordinator Assignment Sub-Form */}
            {isAssigning && (
              <form onSubmit={handleAssignAction} className="p-3 rounded border border-sahay-border bg-sahay-ivory/60 space-y-2 mt-2">
                <div>
                  <label className="text-[10px] font-semibold text-sahay-slate uppercase block">Responsible Coordinator / Desk</label>
                  <input
                    type="text"
                    required
                    value={assignedCoordinator}
                    onChange={(e) => setAssignedCoordinator(e.target.value)}
                    placeholder="e.g. Dr. Vivek Menon / Aluva Sub-Depot Desk"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded border border-sahay-border bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-sahay-slate uppercase block">Internal Action Note</label>
                  <textarea
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Action plan, dispatch instruction, or coordination note..."
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded border border-sahay-border bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-sahay-forest-action text-white text-xs font-medium hover:bg-sahay-forest-hover"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Linked Reports and Requests */}
        <div className="border-t border-sahay-border pt-4 space-y-3 text-xs">
          <h4 className="font-bold text-sahay-forest-deep uppercase tracking-wider text-[11px]">
            Linked Supply Chain Documents
          </h4>

          {linkedRequestsList.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-sahay-slate mb-1">Associated Resource Requests:</p>
              <div className="space-y-1">
                {linkedRequestsList.map((r) => (
                  <div key={r.id} className="p-2 rounded bg-sahay-ivory border border-sahay-border flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sahay-charcoal">{r.id}</span>
                      <span className="text-sahay-slate"> • {r.requestedQuantity} {r.unit} ({r.status})</span>
                    </div>
                    <SeverityBadge severity={r.severity} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {linkedReportsList.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-sahay-slate mb-1">Citizen Ground Reports:</p>
              <div className="space-y-1">
                {linkedReportsList.map((rep) => (
                  <div key={rep.id} className="p-2 rounded bg-sahay-ivory border border-sahay-border">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sahay-charcoal">{rep.referenceNumber}</span>
                      <span className="text-[10px] text-sahay-slate">{rep.status}</span>
                    </div>
                    <p className="text-sahay-slate line-clamp-1 mt-0.5">{rep.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alert.internalNotes && (
            <div className="pt-2">
              <span className="text-[10px] font-semibold text-sahay-slate uppercase block">Internal Audit Notes:</span>
              <p className="text-xs text-sahay-slate mt-1 bg-sahay-ivory p-2.5 rounded border border-sahay-border font-mono text-[11px]">
                {alert.internalNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
