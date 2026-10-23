import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, SeverityBadge } from '../components/common/Badge';
import { PublicReportForm } from '../components/forms/PublicReportForm';
import { Modal } from '../components/common/Modal';
import { exportToCSV } from '../utils/csvExport';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Download,
  Eye,
  MapPin,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReportsPage = () => {
  const { reports, verifyReport, rejectReport, convertReportToRequest, convertReportToIncident } = useAppData();
  const { currentUser, isReporter } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesSearch =
        rep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rep.campName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter !== 'ALL' && rep.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && rep.category !== categoryFilter) return false;

      return true;
    });
  }, [reports, searchQuery, statusFilter, categoryFilter]);

  const handleVerify = (repId) => {
    verifyReport(repId, currentUser.name, reviewNote);
    setReviewNote('');
    if (selectedReport?.id === repId) {
      setSelectedReport((prev) => ({ ...prev, status: 'Verified' }));
    }
  };

  const handleReject = (repId) => {
    rejectReport(repId, currentUser.name, reviewNote || 'Marked as rejected by verification team.');
    setReviewNote('');
    if (selectedReport?.id === repId) {
      setSelectedReport((prev) => ({ ...prev, status: 'Rejected' }));
    }
  };

  const handleConvertToRequest = (repId) => {
    const newReq = convertReportToRequest(repId, currentUser.name);
    if (selectedReport?.id === repId) {
      setSelectedReport((prev) => ({ ...prev, status: 'Converted to Request', convertedToRequestId: newReq?.id }));
    }
  };

  const handleConvertToIncident = (repId) => {
    const newInc = convertReportToIncident(repId, currentUser.name);
    if (selectedReport?.id === repId) {
      setSelectedReport((prev) => ({ ...prev, status: 'Converted to Incident', convertedToIncidentId: newInc?.id }));
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredReports.map((r) => ({
      'Reference Code': r.referenceNumber,
      Category: r.category,
      Description: r.description,
      Quantity: r.estimatedQuantity,
      Unit: r.unit,
      'People Affected': r.peopleAffected,
      Urgency: r.urgency,
      'Camp Name': r.campName,
      Location: r.manualLocationAddress,
      Status: r.status,
      'Is Potential Duplicate': r.isPotentialDuplicate ? 'YES' : 'NO',
      'Submitted At': r.submittedAt,
      'Reviewed By': r.reviewedBy || 'Pending',
    }));
    exportToCSV(csvData, `sahay-public-reports-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Public Needs Reports & Verification Queue
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Incoming reports from affected citizens, grassroots volunteers, and camp coordinators.
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
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Need Report</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, category, location, or description..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted (Pending Review)</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified Only</option>
            <option value="Converted to Request">Converted to Request</option>
            <option value="Converted to Incident">Converted to Incident</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="Sanitary Pads">Sanitary Pads</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Food">Food</option>
            <option value="Medicines">Medicines</option>
            <option value="Medical Assistance">Medical Assistance</option>
            <option value="Blankets">Blankets</option>
            <option value="Hygiene Supplies">Hygiene Supplies</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredReports.length}</strong> reports
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Tracking Code & Category</th>
                <th className="py-3 px-4">Situation Description</th>
                <th className="py-3 px-4">Location / Camp</th>
                <th className="py-3 px-4">Qty & Impact</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredReports.map((rep) => (
                <tr
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`hover:bg-sahay-ivory/30 cursor-pointer transition-colors ${
                    rep.isPotentialDuplicate ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Code & Category */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light font-bold text-sahay-forest-action">
                        {rep.referenceNumber}
                      </span>
                      {rep.isPotentialDuplicate && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sahay-ochre-light text-sahay-ochre border border-sahay-ochre/30">
                          Potential Duplicate
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sahay-charcoal mt-1">{rep.category}</p>
                    <span className="text-[10px] text-sahay-slate">{formatRelativeTime(rep.submittedAt)}</span>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-sahay-charcoal line-clamp-2">{rep.description}</p>
                    {rep.hasPhoto && (
                      <span className="text-[10px] text-sahay-teal font-medium mt-0.5 inline-block">
                        📷 Attached Photo Evidence
                      </span>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sahay-forest-deep">{rep.campName}</p>
                    <p className="text-[10px] text-sahay-slate line-clamp-1">{rep.manualLocationAddress}</p>
                  </td>

                  {/* Qty & People */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-sahay-charcoal">
                      {rep.estimatedQuantity} {rep.unit}
                    </span>
                    <p className="text-[10px] text-sahay-slate">~{rep.peopleAffected} individuals</p>
                  </td>

                  {/* Urgency */}
                  <td className="py-3 px-4">
                    <SeverityBadge severity={rep.urgency} />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={rep.status} />
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(rep);
                      }}
                      className="px-2.5 py-1 rounded border border-sahay-border bg-white hover:bg-sahay-forest-light text-sahay-forest-action font-medium text-xs transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Review Modal */}
      {selectedReport && (
        <Modal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={`Review Public Need: ${selectedReport.referenceNumber}`}
          subtitle={`Submitted ${formatDateTime(selectedReport.submittedAt)}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Duplicate Flag Alert */}
            {selectedReport.isPotentialDuplicate && (
              <div className="p-3 rounded bg-sahay-ochre-light border border-sahay-ochre/40 text-sahay-ochre flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Flagged for Human Review: Potential Duplicate</p>
                  <p className="text-[11px] mt-0.5">
                    {selectedReport.reviewNotes || `Matches recent ${selectedReport.category} report in vicinity (${selectedReport.duplicateOfId}). Check before creating separate dispatches.`}
                  </p>
                </div>
              </div>
            )}

            {/* Description & Details */}
            <div className="p-3.5 rounded bg-sahay-ivory border border-sahay-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sahay-forest-deep text-sm">{selectedReport.category}</span>
                <SeverityBadge severity={selectedReport.urgency} />
              </div>
              <p className="text-sahay-charcoal text-xs leading-relaxed">{selectedReport.description}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded border border-sahay-border bg-white">
                <span className="text-[10px] text-sahay-slate uppercase block">Reported Shortfall</span>
                <span className="font-bold text-sm text-sahay-forest-deep">
                  {selectedReport.estimatedQuantity} {selectedReport.unit}
                </span>
              </div>
              <div className="p-2.5 rounded border border-sahay-border bg-white">
                <span className="text-[10px] text-sahay-slate uppercase block">People Impacted</span>
                <span className="font-bold text-sm text-sahay-charcoal">
                  ~{selectedReport.peopleAffected}
                </span>
              </div>
              <div className="p-2.5 rounded border border-sahay-border bg-white">
                <span className="text-[10px] text-sahay-slate uppercase block">Current Status</span>
                <div className="mt-1 flex justify-center">
                  <StatusBadge status={selectedReport.status} />
                </div>
              </div>
            </div>

            {/* Location & Reporter Info */}
            <div className="p-3 rounded border border-sahay-border bg-white space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sahay-slate shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sahay-charcoal">{selectedReport.campName}</p>
                  <p className="text-sahay-slate">{selectedReport.manualLocationAddress}, {selectedReport.district}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-sahay-border-light text-[11px] text-sahay-slate">
                <Lock className="w-3.5 h-3.5 text-sahay-forest-action shrink-0" />
                <span>
                  Reporter: <strong>{selectedReport.reporterName}</strong>
                  {selectedReport.reporterContact && ` • ${selectedReport.reporterContact}`}
                </span>
              </div>
            </div>

            {/* Reviewer Note Input */}
            <div>
              <label className="font-semibold text-sahay-slate uppercase text-[10px] block mb-1">
                Authority Verification Note
              </label>
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Verification details (e.g. Checked with camp manager Dr. Anita; genuine emergency)..."
                className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
              />
            </div>

            {/* Action Buttons: Verification & Conversion Workflow */}
            <div className="pt-3 border-t border-sahay-border flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleReject(selectedReport.id)}
                className="px-3 py-1.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Report</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedReport.status === 'Submitted' || selectedReport.status === 'Under Review' ? (
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedReport.id)}
                    className="px-3 py-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Needs Report</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleConvertToRequest(selectedReport.id)}
                  className="px-3.5 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convert to Resource Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConvertToIncident(selectedReport.id)}
                  className="px-3 py-1.5 rounded border border-sahay-terracotta/40 bg-sahay-terracotta-light text-sahay-terracotta hover:bg-sahay-terracotta hover:text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Convert to Medical Incident</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone Submit Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Public Need Report"
        maxWidth="max-w-2xl"
      >
        <PublicReportForm onSubmitted={() => setIsSubmitModalOpen(false)} />
      </Modal>
    </div>
  );
};
