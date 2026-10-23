import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Warehouse,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { SeverityBadge } from '../common/Badge';

export const AllocationModal = ({
  isOpen,
  onClose,
  request,
  alert,
}) => {
  const {
    inventory,
    warehouses,
    requests,
    camps,
    commitAllocation,
    getRecommendationForRequest,
  } = useAppData();
  const { currentUser } = useAuth();

  // Determine active target request
  const targetRequest = request || (alert ? requests.find((r) => r.campId === alert.campId && r.resourceCategory === alert.resourceCategory) : null);
  const targetCamp = targetRequest ? camps.find((c) => c.id === targetRequest.campId) : null;

  const [recommendation, setRecommendation] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [allocatedQuantity, setAllocatedQuantity] = useState(0);

  useEffect(() => {
    if (targetRequest) {
      const rec = getRecommendationForRequest(targetRequest);
      setRecommendation(rec);
      if (rec && rec.sourceWarehouse) {
        setSelectedWarehouseId(rec.sourceWarehouse.id || 'WH-01');
        setAllocatedQuantity(rec.proposedAllocationQuantity);
      }
    }
  }, [targetRequest]);

  if (!targetRequest) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Strategic Resource Allocation">
        <div className="p-4 text-center text-xs text-sahay-slate">
          <p>No active request found to allocate. Please select or convert an alert into an approved request first.</p>
        </div>
      </Modal>
    );
  }

  const handleAuthorizeAllocation = (e) => {
    e.preventDefault();
    if (!selectedWarehouseId || allocatedQuantity <= 0) return;

    const success = commitAllocation({
      requestId: targetRequest.id,
      sourceWarehouseId: selectedWarehouseId,
      allocatedQuantity: Number(allocatedQuantity),
      reviewerName: currentUser.name,
    });

    if (success) {
      onClose();
    }
  };

  // Find candidate warehouses with matching stock
  const candidateInventory = inventory.filter(
    (inv) => inv.locationType === 'Warehouse' && inv.category === targetRequest.resourceCategory
  );

  const selectedSourceItem = candidateInventory.find((i) => i.locationId === selectedWarehouseId);
  const sourceAvailableStock = selectedSourceItem
    ? selectedSourceItem.availableQuantity - selectedSourceItem.reservedQuantity
    : 0;
  const remainingStock = Math.max(0, sourceAvailableStock - allocatedQuantity);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Strategic Supply Allocation & Authorization"
      subtitle={`Authorizing dispatch for ${targetRequest.referenceCode} • ${targetRequest.campName}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleAuthorizeAllocation} className="space-y-5">
        {/* Destination & Demand Overview */}
        <div className="p-3.5 rounded bg-sahay-ivory border border-sahay-border flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-sahay-slate">Destination Relief Camp</span>
            <p className="font-bold text-sahay-forest-deep text-sm">{targetRequest.campName}</p>
            <p className="text-sahay-slate mt-0.5">
              Population affected: ~{targetRequest.affectedPopulation} • Urgency: {targetRequest.severity}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-sahay-slate">Requested Resource</span>
            <p className="font-bold text-sahay-charcoal text-sm">{targetRequest.resourceItem}</p>
            <p className="text-sahay-forest-action font-semibold mt-0.5">
              {targetRequest.requestedQuantity} {targetRequest.unit}
            </p>
          </div>
        </div>

        {/* Explainable Recommendation Engine Output */}
        {recommendation && (
          <div className="p-4 rounded border border-sahay-forest-action/30 bg-sahay-forest-light/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sahay-forest-deep uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sahay-forest-action" />
                <span>Deterministic Allocation Rule Output</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white text-sahay-forest-action border border-sahay-border">
                Rule-Based Engine (Non-Blackbox)
              </span>
            </div>

            <p className="text-xs text-sahay-charcoal leading-relaxed font-sans">
              {recommendation.explanation || recommendation.reason}
            </p>

            {recommendation.isPartial && (
              <p className="text-[11px] text-amber-800 font-medium">
                Note: Proposed allocation is calibrated to preserve emergency safety buffers across the regional network.
              </p>
            )}
          </div>
        )}

        {/* Source Warehouse Selection & Allocation Parameters */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-sahay-forest-deep uppercase tracking-wider">
            Supply Source & Dispatch Parameters
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Source Warehouse Dropdown */}
            <div>
              <label className="font-semibold text-sahay-slate uppercase text-[10px] block mb-1">
                Source Warehouse / Depot
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  const item = candidateInventory.find((i) => i.locationId === e.target.value);
                  if (item) {
                    const unreserved = item.availableQuantity - item.reservedQuantity;
                    setAllocatedQuantity(Math.min(targetRequest.requestedQuantity, unreserved));
                  }
                }}
                className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
              >
                {candidateInventory.map((sourceItem) => {
                  const unreserved = sourceItem.availableQuantity - sourceItem.reservedQuantity;
                  return (
                    <option key={sourceItem.locationId} value={sourceItem.locationId}>
                      {sourceItem.locationName} (Avail: {unreserved} {sourceItem.unit})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Allocation Quantity Input */}
            <div>
              <label className="font-semibold text-sahay-slate uppercase text-[10px] block mb-1">
                Authorized Allocation Quantity ({targetRequest.unit})
              </label>
              <input
                type="number"
                min={1}
                max={sourceAvailableStock}
                value={allocatedQuantity}
                onChange={(e) => setAllocatedQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action font-semibold"
              />
              <span className="text-[10px] text-sahay-slate mt-1 block">
                Max available unreserved: {sourceAvailableStock} {targetRequest.unit}
              </span>
            </div>
          </div>

          {/* Before & After Balance Ledger */}
          <div className="p-3.5 rounded border border-sahay-border bg-sahay-ivory/60 text-xs">
            <h5 className="font-bold text-sahay-forest-deep text-[11px] mb-2 uppercase tracking-wider">
              Projected Stock Balance Ledger
            </h5>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded bg-white border border-sahay-border">
                <span className="text-[10px] text-sahay-slate block">Current Warehouse Unreserved</span>
                <span className="font-bold text-sm text-sahay-charcoal">
                  {sourceAvailableStock} {targetRequest.unit}
                </span>
              </div>
              <div className="p-2 rounded bg-sahay-forest-light border border-sahay-border">
                <span className="text-[10px] text-sahay-forest-action font-semibold block">Proposed Deduction</span>
                <span className="font-bold text-sm text-sahay-forest-deep">
                  -{allocatedQuantity} {targetRequest.unit}
                </span>
              </div>
              <div className="p-2 rounded bg-white border border-sahay-border">
                <span className="text-[10px] text-sahay-slate block">Remaining Warehouse Buffer</span>
                <span className="font-bold text-sm text-sahay-charcoal">
                  {remainingStock} {targetRequest.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-sahay-border flex items-center justify-between">
          <p className="text-[11px] text-sahay-slate flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sahay-forest-action shrink-0" />
            <span>Explicit authority verification required before warehouse dispatch.</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded border border-sahay-border text-xs font-medium text-sahay-slate hover:bg-sahay-border-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allocatedQuantity <= 0 || allocatedQuantity > sourceAvailableStock}
              className="px-4 py-2 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Authorize & Commit Allocation</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
