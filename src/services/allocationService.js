/**
 * SAHAY Rule-Based Explainable Allocation Recommendation Engine
 * 
 * Evaluates candidate source warehouses/depots to produce transparent,
 * justifiable supply allocations for camp shortages and resource requests.
 * Uses deterministic business rules, not opaque AI models.
 */
import apiClient from './apiClient';

export const allocationService = {
  // REST API Methods
  apiGetRecommendations: async (requestId) => {
    return apiClient.get(`/allocations/recommendation/${requestId}`);
  },

  apiCreateAllocation: async (allocationData) => {
    return apiClient.post('/allocations', allocationData);
  },

  apiGetAllocations: async (params = {}) => {
    return apiClient.get('/allocations', { params });
  },

  apiUpdateAllocationStatus: async (id, status) => {
    return apiClient.patch(`/allocations/${id}/status`, { status });
  },
};

export const calculateAllocationRecommendation = ({
  request,
  camp,
  inventory = [],
  warehouses = [],
  otherAlerts = [],
}) => {
  if (!request) return null;

  const category = request.resourceCategory;
  const requestedQty = Number(request.requestedQuantity) || 0;
  const isEmergency = request.severity === 'Critical' || request.isMedicalEmergency;

  // Find candidate source inventory records (Warehouses with available unreserved stock)
  const candidateSources = inventory.filter((item) => {
    const isWarehouse = item.locationType === 'Warehouse';
    const categoryMatches = item.category === category;
    const effectiveStock = (item.availableQuantity || 0) - (item.reservedQuantity || 0);
    return isWarehouse && categoryMatches && effectiveStock > 0;
  });

  if (candidateSources.length === 0) {
    return {
      isFeasible: false,
      reason: `No central warehouse currently holds available unreserved stock in '${category}'. Additional donations or state procurement required.`,
      proposedAllocationQuantity: 0,
      sourceWarehouse: null,
      remainingSourceStock: 0,
      confidenceScore: 0,
    };
  }

  // Sort candidate sources: prefer source with largest buffer above safety threshold
  const scoredSources = candidateSources.map((source) => {
    const unreservedStock = source.availableQuantity - source.reservedQuantity;
    const bufferAboveSafety = unreservedStock - source.safetyStockThreshold;
    const warehouseInfo = warehouses.find((w) => w.id === source.locationId) || { name: source.locationName };

    return {
      source,
      warehouseInfo,
      unreservedStock,
      bufferAboveSafety,
    };
  });

  scoredSources.sort((a, b) => b.bufferAboveSafety - a.bufferAboveSafety);

  const bestOption = scoredSources[0];
  const { source, warehouseInfo, unreservedStock, bufferAboveSafety } = bestOption;

  // Calculate proposed allocation quantity
  let proposedQty = 0;
  if (bufferAboveSafety >= requestedQty) {
    // Ample buffer: allocate full requested amount
    proposedQty = requestedQty;
  } else if (bufferAboveSafety > 0) {
    // Partial buffer available without breaching source safety stock
    proposedQty = isEmergency ? Math.min(requestedQty, unreservedStock) : bufferAboveSafety;
  } else {
    // Breaches source safety stock: only allocate if critical emergency, capped at 50% buffer
    proposedQty = isEmergency ? Math.min(requestedQty, Math.floor(unreservedStock * 0.5)) : 0;
  }

  if (proposedQty <= 0) {
    return {
      isFeasible: false,
      reason: `Depot ${warehouseInfo.name} has only ${unreservedStock} ${source.unit} in reserve, which is required for baseline district safety buffer.`,
      proposedAllocationQuantity: 0,
      sourceWarehouse: warehouseInfo,
      remainingSourceStock: unreservedStock,
    };
  }

  const remainingSourceStock = unreservedStock - proposedQty;

  // Build explainability notes
  const factors = [];
  factors.push(`${camp.name} requires ${requestedQty} ${request.unit} for ~${request.affectedPopulation || camp.currentOccupancy} individuals.`);

  if (isEmergency) {
    factors.push(`Urgency is CRITICAL; prioritized ahead of standard regional buffer retention.`);
  }

  if (bufferAboveSafety >= requestedQty) {
    factors.push(`${warehouseInfo.name} has ample buffer (${unreservedStock} ${source.unit} unreserved) and will retain ${remainingSourceStock} ${source.unit} after dispatch (exceeding safety threshold of ${source.safetyStockThreshold} ${source.unit}).`);
  } else {
    factors.push(`Partial allocation: ${warehouseInfo.name} will retain ${remainingSourceStock} ${source.unit} to safeguard regional baseline safety reserves.`);
  }

  // Check competing camps with critical alerts in same category
  const competingCamps = otherAlerts.filter(
    (a) => a.resourceCategory === category && a.campId !== camp.id && a.severity === 'Critical' && a.status !== 'Resolved'
  );
  if (competingCamps.length > 0) {
    factors.push(`Note: ${competingCamps.length} other camp(s) also report critical ${category} demand; remaining stock reserved for their upcoming needs.`);
  }

  const explanation = `Recommended: allocate ${proposedQty} ${request.unit} of ${request.resourceItem} from ${warehouseInfo.name} to ${camp.name}. ${factors.join(' ')}`;

  return {
    isFeasible: true,
    proposedAllocationQuantity: proposedQty,
    sourceWarehouse: warehouseInfo,
    sourceInventoryItem: source,
    remainingSourceStock,
    explanation,
    isPartial: proposedQty < requestedQty,
  };
};

export default allocationService;
