/**
 * Donation Management Service
 */
import apiClient from './apiClient';

export const donationService = {
  // REST API Methods
  apiGetDonations: async (params = {}) => {
    return apiClient.get('/donations', { params });
  },

  apiCreateDonation: async (donationData) => {
    return apiClient.post('/donations', donationData);
  },

  apiUpdateDonationStatus: async (id, status, notes = '', allocationDetails = '') => {
    return apiClient.patch(`/donations/${id}/status`, { status, notes, allocationDetails });
  },

  // Client-side Fallback Adapters
  createDonation: (donationData) => {
    const id = `DON-${String(Date.now()).slice(-4)}`;
    const randomReceipt = Math.floor(100 + Math.random() * 900);
    return {
      id,
      donationId: id,
      receiptNumber: `SHY-DON-${new Date().getFullYear()}-${randomReceipt}`,
      type: donationData.type || 'Monetary',
      donorName: donationData.donorName || 'Anonymous Donor',
      donorEmail: donationData.donorEmail || '',
      donorPhone: donationData.donorPhone || '',
      amountINR: donationData.type === 'Monetary' ? (Number(donationData.amountINR) || 0) : 0,
      itemsDescription: donationData.itemsDescription || '',
      quantity: donationData.type === 'In-Kind' ? (Number(donationData.quantity) || 0) : null,
      unit: donationData.type === 'In-Kind' ? (donationData.unit || 'Units') : null,
      intendedCampId: donationData.intendedCampId || null,
      intendedCampName: donationData.intendedCampName || 'Central Pool',
      status: 'Pledged',
      receivedDate: new Date().toISOString().split('T')[0],
      allocationStatus: 'Under Review',
      allocatedTo: '',
      notes: donationData.notes || '',
    };
  },

  updateDonationStatus: (donationsState, donationId, newStatus, allocationDetails = '') => {
    return donationsState.map((don) => {
      if (don.id === donationId || don.donationId === donationId) {
        return {
          ...don,
          status: newStatus,
          allocationStatus: allocationDetails ? 'Allocated' : don.allocationStatus,
          allocatedTo: allocationDetails || don.allocatedTo,
        };
      }
      return don;
    });
  },
};

export default donationService;
