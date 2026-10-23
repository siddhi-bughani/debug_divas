/**
 * Analytics Service
 * Computes live operational metrics directly from shared application state.
 */

import apiClient from './apiClient';

export const analyticsService = {
  // REST API Methods
  apiGetDashboardAnalytics: async () => {
    return apiClient.get('/analytics/dashboard');
  },

  apiGetActivityLogs: async (limit = 20) => {
    return apiClient.get('/analytics/activities', { params: { limit } });
  },

  apiResetDemoData: async () => {
    return apiClient.post('/analytics/reset-demo');
  },

  // Client-side Fallback Adapters
  getOverviewMetrics: ({ camps, alerts, requests, incidents, volunteers, inventory }) => {
    const activeCamps = camps.filter((c) => c.operationalStatus === 'Active');
    const urgentCamps = camps.filter((c) => {
      return alerts.some((a) => a.campId === c.id && (a.severity === 'Critical' || a.severity === 'High') && a.status !== 'Resolved');
    });

    const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');
    const criticalIncidents = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved');
    const pendingRequests = requests.filter((r) => ['Submitted', 'Under Review', 'Approved'].includes(r.status));
    const totalPeopleAffected = camps.reduce((sum, c) => sum + (c.currentOccupancy || 0), 0);
    const deployedVolunteers = volunteers.filter((v) => v.assignmentStatus === 'Deployed');

    return {
      activeCampsCount: activeCamps.length,
      urgentCampsCount: urgentCamps.length,
      activeAlertsCount: activeAlerts.length,
      criticalIncidentsCount: criticalIncidents.length,
      pendingRequestsCount: pendingRequests.length,
      totalPeopleAffected,
      deployedVolunteersCount: deployedVolunteers.length,
      totalVolunteersCount: volunteers.length,
    };
  },

  getAlertsByCategory: (alerts) => {
    const counts = {};
    for (const a of alerts) {
      if (a.status !== 'Resolved') {
        counts[a.resourceCategory] = (counts[a.resourceCategory] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  },

  getAlertsBySeverity: (alerts) => {
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    return severities.map((severity) => ({
      name: severity,
      count: alerts.filter((a) => a.severity === severity && a.status !== 'Resolved').length,
      resolved: alerts.filter((a) => a.severity === severity && a.status === 'Resolved').length,
    }));
  },

  getResourceStockVsDemand: (inventory, requests) => {
    const categories = ['Drinking Water', 'Food Supplies', 'Sanitary Pads', 'Essential Medicines', 'Blankets', 'Hygiene Kits'];
    
    return categories.map((cat) => {
      // Sum available stock across all locations
      const availableStock = inventory
        .filter((i) => i.category === cat)
        .reduce((sum, i) => sum + Math.max(0, (i.availableQuantity || 0) - (i.reservedQuantity || 0)), 0);

      // Sum requested demand from open requests
      const requestedDemand = requests
        .filter((r) => r.resourceCategory === cat && ['Submitted', 'Under Review', 'Approved'].includes(r.status))
        .reduce((sum, r) => sum + (Number(r.requestedQuantity) || 0), 0);

      return {
        category: cat,
        stock: availableStock,
        demand: requestedDemand,
      };
    });
  },

  getRequestStatusBreakdown: (requests) => {
    const statuses = ['Submitted', 'Under Review', 'Approved', 'Allocated', 'Dispatched', 'Delivered', 'Rejected'];
    return statuses.map((status) => ({
      name: status,
      count: requests.filter((r) => r.status === status).length,
    }));
  },
};
