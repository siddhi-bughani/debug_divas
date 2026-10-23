/**
 * Report Service
 * 
 * Manages public needs reporting, duplicate heuristics, verification,
 * and conversion into resource requests or emergency incidents.
 */
import apiClient from './apiClient';

export const detectDuplicateReports = (newReport, existingReports = []) => {
  const normCategory = (newReport.category || '').toLowerCase().trim();
  const normLocation = (newReport.manualLocationAddress || newReport.campName || '').toLowerCase().trim();
  const newCampId = newReport.campId;
  const now = Date.now();

  const duplicates = existingReports.filter((rep) => {
    if (rep.id === newReport.id) return false;
    
    // Same category check
    const sameCat = (rep.category || '').toLowerCase().trim() === normCategory;
    if (!sameCat) return false;

    // Same camp check or similar location
    const sameCamp = Boolean(newCampId && rep.campId && rep.campId === newCampId);
    const existingLoc = (rep.manualLocationAddress || rep.campName || '').toLowerCase().trim();
    const locMatch = sameCamp || (normLocation.length > 3 && existingLoc.includes(normLocation)) || (existingLoc.length > 3 && normLocation.includes(existingLoc));

    if (!locMatch) return false;

    // Time window heuristic: within past 12 hours
    const repTime = new Date(rep.submittedAt).getTime();
    const hoursDiff = Math.abs(now - repTime) / (1000 * 60 * 60);

    return hoursDiff <= 12;
  });

  return duplicates;
};

export const reportService = {
  // REST API Methods
  apiGetReports: async (params = {}) => {
    return apiClient.get('/reports', { params });
  },

  apiSubmitReport: async (reportData) => {
    return apiClient.post('/reports', reportData);
  },

  apiVerifyReport: async (id, reviewNotes = '') => {
    return apiClient.post(`/reports/${id}/verify`, { reviewNotes });
  },

  apiRejectReport: async (id, reason = '') => {
    return apiClient.post(`/reports/${id}/reject`, { reason });
  },

  apiConvertToRequest: async (id) => {
    return apiClient.post(`/reports/${id}/convert-request`);
  },

  apiConvertToIncident: async (id) => {
    return apiClient.post(`/reports/${id}/convert-incident`);
  },

  // Client-side Fallback Adapters
  generateReferenceNumber: () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `SHY-REP-${new Date().getFullYear()}-${randomSuffix}`;
  },

  createReport: (reportData, existingReports = []) => {
    const id = `REP-${String(Date.now()).slice(-4)}`;
    const referenceNumber = reportService.generateReferenceNumber();
    
    const duplicates = detectDuplicateReports(reportData, existingReports);
    const isPotentialDuplicate = duplicates.length > 0;
    const duplicateOfId = isPotentialDuplicate ? duplicates[0].id : null;

    const newReport = {
      id,
      reportId: id,
      referenceNumber,
      category: reportData.category || 'Other',
      description: reportData.description || '',
      estimatedQuantity: Number(reportData.estimatedQuantity) || 0,
      unit: reportData.unit || 'Units',
      peopleAffected: Number(reportData.peopleAffected) || 1,
      urgency: reportData.urgency || 'Medium',
      campId: reportData.campId || null,
      campName: reportData.campName || 'Unassigned / Local Area',
      manualLocationAddress: reportData.manualLocationAddress || '',
      district: reportData.district || 'Ernakulam',
      latitude: reportData.latitude || null,
      longitude: reportData.longitude || null,
      reporterName: reportData.reporterName || 'Anonymous Citizen',
      reporterContact: reportData.reporterContact || '',
      protectContact: reportData.protectContact !== false,
      hasPhoto: Boolean(reportData.photoUrl || reportData.hasPhoto),
      photoCaption: reportData.photoCaption || '',
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      convertedToRequestId: null,
      convertedToIncidentId: null,
      isPotentialDuplicate,
      duplicateOfId,
      reviewNotes: isPotentialDuplicate 
        ? `Flagged: Potential duplicate of ${duplicateOfId} due to matching category and proximity.` 
        : '',
    };

    return newReport;
  },

  updateReportStatus: (reportsState, reportId, newStatus, reviewerName, reviewNotes = '') => {
    return reportsState.map((report) => {
      if (report.id === reportId || report.reportId === reportId) {
        return {
          ...report,
          status: newStatus,
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewerName || 'Central Authority',
          reviewNotes: reviewNotes || report.reviewNotes,
        };
      }
      return report;
    });
  },
};

export default reportService;
