import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { AllocationModal } from '../components/forms/AllocationModal';
import { ResourceRequestModal } from '../components/forms/ResourceRequestModal';
import { exportToCSV } from '../utils/csvExport';
import { formatRelativeTime } from '../utils/formatters';
import {
  PackageSearch,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  ChevronRight,
  Boxes,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RequestsPage = () => {
  const {
    requests,
    camps,
    approveRequest,
    rejectRequest,
    dispatchAllocatedRequest,
    deliverRequest,
  } = useAppData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequestForAllocation, setSelectedRequestForAllocation] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.campName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.resourceItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.resourceCategory.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (severityFilter !== 'ALL' && req.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

      return true;
    });
  }, [requests, searchQuery, severityFilter, statusFilter]);

  const handleExportCSV = () => {
    const csvData = filteredRequests.map((r) => ({
      'Request ID': r.id,
      Camp: r.campName,
      Category: r.resourceCategory,
      Item: r.resourceItem,
      'Requested Qty': r.requestedQuantity,
      Unit: r.unit,
      'Affected Population': r.affectedPopulation,
      Severity: r.severity,
      Status: r.status,
      'Submitted At': r.submittedAt,
      'Reviewed By': r.reviewedBy || 'Pending',
      'Allocated Qty': r.allocatedQuantity || 0,
      'Allocated Warehouse': r.allocatedWarehouseId || 'None',
    }));
    exportToCSV(csvData, `sahay-resource-requests-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Resource Requests & Logistics Fulfillment
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Priority-based requisition pipeline linking camps to central logistics supply chains.
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
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Create Requisition</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request ID, camp, or resource..."
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
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved (Awaiting Allocation)</option>
            <option value="Allocated">Allocated (Ready to Dispatch)</option>
            <option value="Dispatched">Dispatched (En Route)</option>
            <option value="Delivered">Delivered</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredRequests.length}</strong> requests
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Request Code & Resource</th>
                <th className="py-3 px-4">Requesting Camp</th>
                <th className="py-3 px-4">Quantity & Impact</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status & Logistics</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-sahay-ivory/30 transition-colors">
                  {/* Code & Resource */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep">
                        {req.id}
                      </span>
                      {req.isMedicalEmergency && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sahay-terracotta-light text-sahay-terracotta border border-sahay-terracotta/30 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Medical</span>
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sahay-charcoal mt-1">{req.resourceItem}</p>
                    <p className="text-[10px] text-sahay-slate">{req.resourceCategory}</p>
                  </td>

                  {/* Camp */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sahay-forest-deep">{req.campName}</p>
                    {req.sourceReportId && (
                      <span className="text-[10px] text-sahay-teal font-medium mt-0.5 block">
                        Linked Report: {req.sourceReportId}
                      </span>
                    )}
                  </td>

                  {/* Qty & People */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-sahay-charcoal">
                      {req.requestedQuantity} {req.unit}
                    </span>
                    <p className="text-[10px] text-sahay-slate">~{req.affectedPopulation} people</p>
                  </td>

                  {/* Severity */}
                  <td className="py-3 px-4">
                    <SeverityBadge severity={req.severity} />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={req.status} />
                    {req.status === 'Allocated' && (
                      <p className="text-[10px] text-sahay-forest-action font-medium mt-0.5">
                        {req.allocatedQuantity} {req.unit} from {req.allocatedWarehouseId}
                      </p>
                    )}
                  </td>

                  {/* Timeline */}
                  <td className="py-3 px-4 text-sahay-slate text-[11px]">
                    <p>Sub: {formatRelativeTime(req.submittedAt)}</p>
                    {req.deliveredAt && <p className="text-sahay-green font-medium">Delivered {formatRelativeTime(req.deliveredAt)}</p>}
                  </td>

                  {/* Action Workflow Button */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Workflow 1: Submitted -> Approve or Reject */}
                      {(req.status === 'Submitted' || req.status === 'Under Review') && (
                        <>
                          <button
                            type="button"
                            onClick={() => approveRequest(req.id, currentUser.name)}
                            className="px-2.5 py-1 rounded bg-sahay-forest-action text-white hover:bg-sahay-forest-hover text-xs font-medium"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectRequest(req.id, currentUser.name)}
                            className="px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Workflow 2: Approved -> Allocate via Recommendation Engine */}
                      {req.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => setSelectedRequestForAllocation(req)}
                          className="px-3 py-1 rounded bg-sahay-teal text-white hover:bg-sahay-teal/90 text-xs font-semibold flex items-center gap-1.5 shadow-subtle"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Allocate Supply</span>
                        </button>
                      )}

                      {/* Workflow 3: Allocated -> Dispatch */}
                      {req.status === 'Allocated' && (
                        <button
                          type="button"
                          onClick={() => dispatchAllocatedRequest(req.id, currentUser.name)}
                          className="px-3 py-1 rounded bg-indigo-700 text-white hover:bg-indigo-800 text-xs font-semibold flex items-center gap-1.5 shadow-subtle"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Truck</span>
                        </button>
                      )}

                      {/* Workflow 4: Dispatched -> Delivered (triggers shortage resolution!) */}
                      {req.status === 'Dispatched' && (
                        <button
                          type="button"
                          onClick={() => deliverRequest(req.id, currentUser.name)}
                          className="px-3 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-subtle"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Delivery</span>
                        </button>
                      )}

                      {req.status === 'Delivered' && (
                        <span className="text-emerald-700 text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Modal */}
      <AllocationModal
        request={selectedRequestForAllocation}
        isOpen={Boolean(selectedRequestForAllocation)}
        onClose={() => setSelectedRequestForAllocation(null)}
      />

      {/* Create Requisition Modal */}
      <ResourceRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
