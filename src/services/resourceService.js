/**
 * Resource & Inventory Service
 * 
 * Manages inventory levels across camps and central warehouses.
 * Enforces non-negative stock and tracks reserved allocations.
 */

import apiClient from './apiClient';

export const resourceService = {
  // REST API Methods
  apiGetInventory: async (params = {}) => {
    return apiClient.get('/inventory', { params });
  },

  apiGetWarehouses: async () => {
    return apiClient.get('/inventory/warehouses');
  },

  apiAdjustStock: async (recordId, quantityChange, reason = 'Manual Adjustment') => {
    return apiClient.post(`/inventory/${recordId}/adjust`, { quantityChange, reason });
  },

  apiCreateInventoryRecord: async (record) => {
    return apiClient.post('/inventory', record);
  },

  // Client-side Fallback Adapters
  createInventoryRecord: (record) => ({
    id: `INV-${String(Date.now()).slice(-4)}`,
    availableQuantity: Math.max(0, Number(record.availableQuantity) || 0),
    reservedQuantity: 0,
    safetyStockThreshold: Math.max(0, Number(record.safetyStockThreshold) || 0),
    estimatedDemand: Math.max(0, Number(record.estimatedDemand) || 0),
    lastUpdated: new Date().toISOString(),
    ...record,
  }),

  adjustStock: (inventoryState, recordId, quantityChange, reason = 'Adjustment') => {
    return inventoryState.map((item) => {
      if (item.id === recordId) {
        const newAvailable = Math.max(0, item.availableQuantity + quantityChange);
        return {
          ...item,
          availableQuantity: newAvailable,
          lastUpdated: new Date().toISOString(),
          lastAdjustmentReason: reason,
        };
      }
      return item;
    });
  },

  reserveStock: (inventoryState, recordId, quantityToReserve) => {
    return inventoryState.map((item) => {
      if (item.id === recordId) {
        const effectiveAvailable = item.availableQuantity - item.reservedQuantity;
        const actualReserve = Math.min(effectiveAvailable, quantityToReserve);
        if (actualReserve <= 0) return item;

        return {
          ...item,
          reservedQuantity: item.reservedQuantity + actualReserve,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });
  },

  commitDispatch: (inventoryState, recordId, quantityToDeduct) => {
    return inventoryState.map((item) => {
      if (item.id === recordId) {
        const newAvailable = Math.max(0, item.availableQuantity - quantityToDeduct);
        const newReserved = Math.max(0, item.reservedQuantity - quantityToDeduct);
        return {
          ...item,
          availableQuantity: newAvailable,
          reservedQuantity: newReserved,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });
  },

  deliverToDestination: (inventoryState, destinationCampId, category, itemName, quantityToAdd, unit = 'Units') => {
    let matched = false;
    const updated = inventoryState.map((item) => {
      if (item.locationId === destinationCampId && item.category === category) {
        matched = true;
        return {
          ...item,
          availableQuantity: item.availableQuantity + quantityToAdd,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });

    if (!matched) {
      // Create new inventory line for destination
      updated.push({
        id: `INV-C-${String(Date.now()).slice(-4)}`,
        locationType: 'Camp',
        locationId: destinationCampId,
        locationName: 'Camp Storage',
        category,
        itemName,
        availableQuantity: quantityToAdd,
        reservedQuantity: 0,
        safetyStockThreshold: 50,
        estimatedDemand: quantityToAdd,
        unit,
        lastUpdated: new Date().toISOString(),
      });
    }

    return updated;
  },
};
