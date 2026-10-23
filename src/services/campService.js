/**
 * Camp Service
 */
import apiClient from './apiClient';

export const campService = {
  // REST API Methods
  apiGetCamps: async (params = {}) => {
    return apiClient.get('/camps', { params });
  },

  apiGetCampById: async (id) => {
    return apiClient.get(`/camps/${id}`);
  },

  apiCreateCamp: async (campData) => {
    return apiClient.post('/camps', campData);
  },

  apiUpdateCamp: async (id, updates) => {
    return apiClient.put(`/camps/${id}`, updates);
  },

  // Client-side Fallback Adapters
  getCamps: (campsState) => campsState,
  
  getCampById: (campsState, id) => campsState.find((c) => c.id === id) || null,

  createCamp: (newCamp) => ({
    id: `CAMP-${String(Date.now()).slice(-4)}`,
    establishedDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    operationalStatus: 'Active',
    ...newCamp,
  }),

  updateCamp: (campsState, id, updates) => {
    return campsState.map((camp) => {
      if (camp.id === id) {
        return {
          ...camp,
          ...updates,
          lastUpdated: new Date().toISOString(),
        };
      }
      return camp;
    });
  },
};

export default campService;
