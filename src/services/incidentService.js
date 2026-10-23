/**
 * Emergency & Medical Incident Service
 */
import apiClient from './apiClient';

export const incidentService = {
  // REST API Methods
  apiGetIncidents: async (params = {}) => {
    return apiClient.get('/incidents', { params });
  },

  apiCreateIncident: async (incidentData) => {
    return apiClient.post('/incidents', incidentData);
  },

  apiUpdateIncidentStatus: async (id, status, assignedResponder = '', notes = '') => {
    return apiClient.patch(`/incidents/${id}/status`, { status, assignedResponder, notes });
  },

  // Client-side Fallback Adapters
  createIncident: (incidentData) => {
    const id = `INC-${String(Date.now()).slice(-4)}`;
    return {
      id,
      incidentId: id,
      title: incidentData.title || 'Emergency Incident',
      category: incidentData.category || 'Medical Emergency',
      campId: incidentData.campId || null,
      campName: incidentData.campName || 'Unassigned Locality',
      locationAddress: incidentData.locationAddress || '',
      district: incidentData.district || 'Ernakulam',
      severity: incidentData.severity || 'Critical',
      status: 'Reported',
      reportedAt: new Date().toISOString(),
      assignedResponder: incidentData.assignedResponder || 'Awaiting Dispatch',
      peopleAffected: Number(incidentData.peopleAffected) || 1,
      linkedRequestIds: incidentData.linkedRequestIds || [],
      linkedAlertIds: incidentData.linkedAlertIds || [],
      notes: incidentData.notes || '',
    };
  },

  updateIncidentStatus: (incidentsState, incidentId, newStatus, responder = '', notes = '') => {
    return incidentsState.map((inc) => {
      if (inc.id === incidentId || inc.incidentId === incidentId) {
        return {
          ...inc,
          status: newStatus,
          assignedResponder: responder || inc.assignedResponder,
          notes: notes ? `${inc.notes ? inc.notes + ' | ' : ''}${notes}` : inc.notes,
        };
      }
      return inc;
    });
  },
};

export default incidentService;
