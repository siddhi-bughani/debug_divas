/**
 * SAHAY Platform Deterministic Shortage Rules & Business Logic
 * 
 * Evaluates inventory against demand, safety stock thresholds, population requirements,
 * and unresolved requests to generate explainable alerts.
 */

// Default SLA Response Targets in hours
export const DEFAULT_RESPONSE_TARGETS = {
  Critical: 2,  // 2 hours
  High: 6,      // 6 hours
  Medium: 18,   // 18 hours
  Low: 36,      // 36 hours
};

// Standard daily requirements per person for disaster situations (baseline guidelines)
export const DAILY_PER_CAPITA_REQUIREMENTS = {
  'Drinking Water': { qty: 3, unit: 'Litres' },
  'Food Supplies': { qty: 0.5, unit: 'kg' },
  'Sanitary Pads': { qty: 0.25, unit: 'Packs' }, // approx per female capita over duration
  'Blankets': { qty: 0.5, unit: 'Units' },
  'Hygiene Kits': { qty: 0.2, unit: 'Kits' },
};

/**
 * Generate a deterministic deduplication key for an inventory condition
 */
export const getDeduplicationKey = (campId, category, itemName) => {
  const normCamp = (campId || 'general').trim().toLowerCase();
  const normCat = (category || 'general').trim().toLowerCase();
  const normItem = (itemName || 'item').trim().toLowerCase().replace(/\s+/g, '-');
  return `alert_${normCamp}_${normCat}_${normItem}`;
};

/**
 * Calculate severity based on inventory, demand, and population impact
 */
export const determineSeverity = ({
  category,
  availableQty,
  safetyStock,
  estimatedDemand,
  peopleAffected = 0,
  isMedicalEmergency = false,
  hoursUnresolved = 0,
}) => {
  // Rule 1: Medical incidents or zero life-support stock with urgent demand -> Critical
  if (isMedicalEmergency) return 'Critical';
  
  const isLifeSupport = ['Drinking Water', 'Essential Medicines', 'Food Supplies', 'Sanitary Pads'].includes(category);
  
  if (isLifeSupport && availableQty <= 0 && estimatedDemand > 0) {
    return 'Critical';
  }

  // Severe water or medicine deficit with high population affected
  if ((category === 'Drinking Water' || category === 'Essential Medicines') && 
      availableQty < (safetyStock * 0.3) && peopleAffected > 100) {
    return 'Critical';
  }

  // Escalation if unresolved for too long
  if (hoursUnresolved >= DEFAULT_RESPONSE_TARGETS.High && availableQty < safetyStock) {
    return 'Critical';
  }

  // Rule 2: High severity
  // Sanitary pads completely stockout or severe deficit
  if (category === 'Sanitary Pads' && (availableQty < (safetyStock * 0.4) || availableQty === 0)) {
    return 'High';
  }

  if (availableQty < safetyStock * 0.5) {
    return 'High';
  }

  if (estimatedDemand > (availableQty * 2)) {
    return 'High';
  }

  if (hoursUnresolved >= DEFAULT_RESPONSE_TARGETS.Medium && availableQty < safetyStock) {
    return 'High';
  }

  // Rule 3: Medium severity
  if (availableQty < safetyStock || estimatedDemand > availableQty) {
    return 'Medium';
  }

  // Rule 4: Low severity (approaching threshold)
  if (availableQty <= safetyStock * 1.25) {
    return 'Low';
  }

  return null; // No shortage
};

/**
 * Evaluate an individual inventory item against camp population and requests
 */
export const evaluateItemShortage = (inventoryItem, camp, linkedRequests = [], settings = {}) => {
  const availableQty = Math.max(0, (inventoryItem.availableQuantity || 0) - (inventoryItem.reservedQuantity || 0));
  const safetyStock = inventoryItem.safetyStockThreshold || 0;
  
  // Sum pending request demand for this item
  const pendingRequestDemand = linkedRequests
    .filter(r => r.campId === camp.id && r.resourceCategory === inventoryItem.category && ['Submitted', 'Under Review', 'Approved'].includes(r.status))
    .reduce((sum, r) => sum + (Number(r.requestedQuantity) || 0), 0);

  const totalDemand = Math.max(inventoryItem.estimatedDemand || 0, pendingRequestDemand);
  const peopleAffected = camp.currentOccupancy || camp.capacity || 50;

  const severity = determineSeverity({
    category: inventoryItem.category,
    availableQty,
    safetyStock,
    estimatedDemand: totalDemand,
    peopleAffected,
  });

  if (!severity) {
    return null; // Condition cleared or no shortage
  }

  const estimatedShortage = Math.max(0, Math.max(safetyStock, totalDemand) - availableQty);

  // Produce clear operational explanation
  let explanation = '';
  if (availableQty === 0) {
    explanation = `Zero ${inventoryItem.itemName} in stock at ${camp.name}. Unmet demand is ${estimatedShortage} ${inventoryItem.unit}, impacting approximately ${peopleAffected} residents.`;
  } else if (availableQty < safetyStock) {
    explanation = `${inventoryItem.itemName} (${availableQty} ${inventoryItem.unit}) is below the required safety threshold of ${safetyStock} ${inventoryItem.unit} at ${camp.name}. Shortfall: ${estimatedShortage} ${inventoryItem.unit}.`;
  } else {
    explanation = `Projected demand (${totalDemand} ${inventoryItem.unit}) exceeds currently unreserved stock (${availableQty} ${inventoryItem.unit}) at ${camp.name}.`;
  }

  // Recommended action
  let recommendedAction = '';
  if (severity === 'Critical') {
    recommendedAction = `Authorize immediate emergency transfer of at least ${estimatedShortage} ${inventoryItem.unit} from nearest central depot or dispatch rapid response unit.`;
  } else if (severity === 'High') {
    recommendedAction = `Review central warehouse reserves and allocate ${estimatedShortage} ${inventoryItem.unit} to prevent complete stockout.`;
  } else if (severity === 'Medium') {
    recommendedAction = `Schedule replenishment of ${estimatedShortage} ${inventoryItem.unit} in upcoming distribution run.`;
  } else {
    recommendedAction = `Monitor daily consumption rate; replenish when logistics route permits.`;
  }

  return {
    dedupKey: getDeduplicationKey(camp.id, inventoryItem.category, inventoryItem.itemName),
    campId: camp.id,
    campName: camp.name,
    district: camp.district,
    locationAddress: camp.address,
    coordinates: camp.coordinates,
    inventoryRecordId: inventoryItem.id,
    resourceCategory: inventoryItem.category,
    resourceItem: inventoryItem.itemName,
    unit: inventoryItem.unit,
    availableQuantityAtDetection: availableQty,
    safetyStockThreshold: safetyStock,
    estimatedDemand: totalDemand,
    estimatedShortageQuantity: estimatedShortage,
    peopleAffected,
    severity,
    explanation,
    recommendedAction,
  };
};

/**
 * Check if alert response target has been breached
 */
export const checkEscalationStatus = (alert, responseTargets = DEFAULT_RESPONSE_TARGETS) => {
  if (alert.status === 'Resolved') {
    return { isBreached: false, elapsedHours: 0, targetHours: 0 };
  }

  const targetHours = responseTargets[alert.severity] || DEFAULT_RESPONSE_TARGETS[alert.severity] || 12;
  const detectedTime = new Date(alert.detectedAt).getTime();
  const now = Date.now();
  const elapsedHours = Math.max(0, (now - detectedTime) / (1000 * 60 * 60));

  const isBreached = elapsedHours > targetHours && alert.status !== 'In Progress' && alert.status !== 'Resolved';

  return {
    isBreached,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    targetHours,
    hoursOverdue: isBreached ? Math.round((elapsedHours - targetHours) * 10) / 10 : 0,
  };
};
