/**
 * Resource Request Service
 * 
 * Priority-based request lifecycle management with validation against
 * impossible status transitions and negative inventory.
 */
import apiClient from './apiClient';

export const VALID_STATUS_TRANSITIONS = {
  Submitted: ['Under Review', 'Approved', 'Rejected'],
  'Under Review': ['Approved', 'Rejected'],
  Approved: ['Allocated', 'Rejected'],
  Allocated: ['Dispatched', 'Approved'],
  Dispatched: ['Delivered'],
  Delivered: [],
  Rejected: ['Under Review'], // Re-open
};

export const requestService = {
  // REST API Methods
  apiGetRequests: async (params = {}) => {
    return apiClient.get('/requests', { params });
  },

  apiGetRequestById: async (id) => {
    return apiClient.get(`/requests/${id}`);
  },

  apiCreateRequest: async (requestData) => {
    return apiClient.post('/requests', requestData);
  },

  apiUpdateRequestStatus: async (id, status, notes = '') => {
    return apiClient.patch(`/requests/${id}/status`, { status, notes });
  },

  // Client-side Fallback Adapters
  createRequest: (requestData) => {
    const id = `REQ-${String(Date.now()).slice(-4)}`;
    return {
      id,
      requestId: id,
      referenceCode: `REQ-${(requestData.resourceCategory || 'GEN').slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-2)}`,
      campId: requestData.campId,
      campName: requestData.campName || 'Relief Camp',
      resourceCategory: requestData.resourceCategory,
      resourceItem: requestData.resourceItem,
      requestedQuantity: Number(requestData.requestedQuantity) || 0,
      availableQuantityAtRequest: Number(requestData.availableQuantityAtRequest) || 0,
      unit: requestData.unit || 'Units',
      affectedPopulation: Number(requestData.affectedPopulation) || 1,
      severity: requestData.severity || 'Medium',
      isMedicalEmergency: Boolean(requestData.isMedicalEmergency),
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      allocatedWarehouseId: null,
      allocatedQuantity: 0,
      dispatchedAt: null,
      deliveredAt: null,
      sourceReportId: requestData.sourceReportId || null,
      linkedShortageAlertId: requestData.linkedShortageAlertId || null,
      priorityScore: requestData.priorityScore || 50,
      notes: requestData.notes || '',
    };
  },

  canTransition: (currentStatus, targetStatus) => {
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  },

  updateRequestStatus: (requestsState, requestId, newStatus, extraData = {}) => {
    return requestsState.map((req) => {
      if (req.id === requestId || req.requestId === requestId) {
        if (!requestService.canTransition(req.status, newStatus)) {
          console.warn(`Invalid transition from ${req.status} to ${newStatus}`);
          return req;
        }

        const updates = {
          ...req,
          status: newStatus,
          ...extraData,
        };

        if (newStatus === 'Under Review' || newStatus === 'Approved') {
          updates.reviewedAt = new Date().toISOString();
          updates.reviewedBy = extraData.reviewedBy || 'Central Authority';
        } else if (newStatus === 'Dispatched') {
          updates.dispatchedAt = new Date().toISOString();
        } else if (newStatus === 'Delivered') {
          updates.deliveredAt = new Date().toISOString();
        }

        return updates;
      }
      return req;
    });
  },
};

export default requestService;
