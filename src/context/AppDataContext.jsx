import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  INITIAL_CAMPS,
  INITIAL_WAREHOUSES,
  INITIAL_INVENTORY,
  INITIAL_ALERTS,
  INITIAL_REPORTS,
  INITIAL_REQUESTS,
  INITIAL_DONATIONS,
  INITIAL_VOLUNTEERS,
  INITIAL_INCIDENTS,
  INITIAL_ACTIVITIES,
} from '../data/demoData';

import apiClient from '../services/apiClient';
import { campService } from '../services/campService';
import { reportService } from '../services/reportService';
import { requestService } from '../services/requestService';
import { resourceService } from '../services/resourceService';
import { shortageAlertService } from '../services/shortageAlertService';
import { allocationService, calculateAllocationRecommendation } from '../services/allocationService';
import { donationService } from '../services/donationService';
import { volunteerService } from '../services/volunteerService';
import { incidentService } from '../services/incidentService';
import { analyticsService } from '../services/analyticsService';
import { DEFAULT_RESPONSE_TARGETS } from '../utils/shortageRules';

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [isBackendLive, setIsBackendLive] = useState(false);

  // Load persisted demo data if available, or fall back to INITIAL constants
  const [camps, setCamps] = useState(() => {
    const saved = localStorage.getItem('sahay_camps');
    return saved ? JSON.parse(saved) : INITIAL_CAMPS;
  });

  const [warehouses, setWarehouses] = useState(() => {
    const saved = localStorage.getItem('sahay_warehouses');
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('sahay_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('sahay_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('sahay_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('sahay_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [donations, setDonations] = useState(() => {
    const saved = localStorage.getItem('sahay_donations');
    return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
  });

  const [volunteers, setVolunteers] = useState(() => {
    const saved = localStorage.getItem('sahay_volunteers');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTEERS;
  });

  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('sahay_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('sahay_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [responseTargets, setResponseTargets] = useState(() => {
    const saved = localStorage.getItem('sahay_response_targets');
    return saved ? JSON.parse(saved) : DEFAULT_RESPONSE_TARGETS;
  });

  // Save non-sensitive demo data to localStorage for offline fallback
  useEffect(() => {
    localStorage.setItem('sahay_camps', JSON.stringify(camps));
    localStorage.setItem('sahay_inventory', JSON.stringify(inventory));
    localStorage.setItem('sahay_alerts', JSON.stringify(alerts));
    localStorage.setItem('sahay_reports', JSON.stringify(reports));
    localStorage.setItem('sahay_requests', JSON.stringify(requests));
    localStorage.setItem('sahay_donations', JSON.stringify(donations));
    localStorage.setItem('sahay_volunteers', JSON.stringify(volunteers));
    localStorage.setItem('sahay_incidents', JSON.stringify(incidents));
    localStorage.setItem('sahay_activities', JSON.stringify(activities));
  }, [camps, inventory, alerts, reports, requests, donations, volunteers, incidents, activities]);

  /**
   * Synchronize state with real MongoDB backend
   */
  const refreshFromBackend = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        campService.apiGetCamps(),
        resourceService.apiGetWarehouses(),
        resourceService.apiGetInventory(),
        shortageAlertService.apiGetAlerts(),
        reportService.apiGetReports(),
        requestService.apiGetRequests(),
        donationService.apiGetDonations(),
        volunteerService.apiGetVolunteers(),
        incidentService.apiGetIncidents(),
        analyticsService.apiGetActivityLogs(30),
      ]);

      const [cRes, wRes, invRes, aRes, repRes, reqRes, donRes, volRes, incRes, actRes] = results;

      if (cRes.status === 'fulfilled' && cRes.value?.data) setCamps(cRes.value.data);
      if (wRes.status === 'fulfilled' && wRes.value?.data) setWarehouses(wRes.value.data);
      if (invRes.status === 'fulfilled' && invRes.value?.data) setInventory(invRes.value.data);
      if (aRes.status === 'fulfilled' && aRes.value?.data) setAlerts(aRes.value.data);
      if (repRes.status === 'fulfilled' && repRes.value?.data) setReports(repRes.value.data);
      if (reqRes.status === 'fulfilled' && reqRes.value?.data) setRequests(reqRes.value.data);
      if (donRes.status === 'fulfilled' && donRes.value?.data) setDonations(donRes.value.data);
      if (volRes.status === 'fulfilled' && volRes.value?.data) setVolunteers(volRes.value.data);
      if (incRes.status === 'fulfilled' && incRes.value?.data) setIncidents(incRes.value.data);
      if (actRes.status === 'fulfilled' && actRes.value?.data) setActivities(actRes.value.data);

      setIsBackendLive(true);
    } catch (err) {
      console.warn('[SAHAY] Backend sync skipped or unavailable:', err.message);
      setIsBackendLive(false);
    }
  }, []);

  // Initial connection probe on mount
  useEffect(() => {
    const probeBackend = async () => {
      try {
        const health = await apiClient.get('/health', { timeout: 2000 });
        if (health?.status === 'online') {
          console.log('[SAHAY] Live Express & MongoDB REST API connected.');
          await refreshFromBackend();
        }
      } catch {
        // Backend not currently responding; local demo fallback active
        setIsBackendLive(false);
      }
    };
    probeBackend();
  }, [refreshFromBackend]);

  const addActivity = (user, action, target, category = 'General') => {
    const newAct = {
      id: `ACT-${String(Date.now()).slice(-4)}`,
      timestamp: new Date().toISOString(),
      user: user || 'Central Administrator',
      action,
      target,
      category,
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  /**
   * Internal helper: Trigger shortage recalculation when inventory or demand changes
   */
  const triggerShortageEvaluation = async (currentInventory, currentRequests) => {
    if (isBackendLive) {
      try {
        await shortageAlertService.apiTriggerEvaluation();
        const aRes = await shortageAlertService.apiGetAlerts();
        if (aRes?.data) {
          setAlerts(aRes.data);
          return;
        }
      } catch (err) {
        console.warn('Backend evaluation fallback to client logic:', err);
      }
    }

    const evaluated = shortageAlertService.evaluateAllShortages({
      camps,
      inventory: currentInventory || inventory,
      requests: currentRequests || requests,
      existingAlerts: alerts,
      responseTargets,
    });
    setAlerts(evaluated);
  };

  /**
   * Public Report Actions
   */
  const submitPublicReport = async (reportData) => {
    if (isBackendLive) {
      try {
        const res = await reportService.apiSubmitReport({
          ...reportData,
          manualLocationAddress: reportData.manualLocationAddress || reportData.locationAddress || 'Camp Vicinity',
        });
        if (res?.data) {
          setReports((prev) => [res.data, ...prev]);
          addActivity('Citizen / Field Reporter', 'Submitted Public Need Report', `${res.data.referenceNumber} (${res.data.category})`, 'Report');
          toast.success(`Report #${res.data.referenceNumber} submitted and recorded in MongoDB.`);
          await refreshFromBackend();
          return res.data;
        }
      } catch (err) {
        console.warn('Backend submit report failed, using client state:', err);
      }
    }

    const newReport = reportService.createReport(reportData, reports);
    setReports((prev) => [newReport, ...prev]);
    addActivity('Citizen / Field Reporter', 'Submitted Public Need Report', `${newReport.referenceNumber} (${newReport.category} for ${newReport.campName})`, 'Report');
    
    if (newReport.isPotentialDuplicate) {
      toast('Report submitted. Flagged for reviewer as potential duplicate.', { icon: 'ℹ️' });
    } else {
      toast.success(`Report #${newReport.referenceNumber} submitted successfully.`);
    }

    return newReport;
  };

  const verifyReport = async (reportId, reviewerName, reviewNotes = '') => {
    if (isBackendLive) {
      try {
        const res = await reportService.apiVerifyReport(reportId, reviewNotes);
        if (res?.data) {
          setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? res.data : r)));
          addActivity(reviewerName || 'Central Authority', 'Verified Public Report', `${res.data.referenceNumber} (${res.data.category})`, 'Report');
          toast.success(`Report ${res.data.referenceNumber || reportId} verified in database.`);
          await refreshFromBackend();
          return;
        }
      } catch (err) {
        console.warn('Backend verify report failed, using client state:', err);
      }
    }

    const updated = reportService.updateReportStatus(reports, reportId, 'Verified', reviewerName, reviewNotes);
    setReports(updated);
    const targetReport = reports.find((r) => r.id === reportId);
    addActivity(reviewerName || 'Central Authority', 'Verified Public Report', `${targetReport?.referenceNumber || reportId} (${targetReport?.category})`, 'Report');
    toast.success(`Report ${targetReport?.referenceNumber || reportId} verified.`);

    triggerShortageEvaluation();
  };

  const rejectReport = async (reportId, reviewerName, reviewNotes = '') => {
    if (isBackendLive) {
      try {
        const res = await reportService.apiRejectReport(reportId, reviewNotes);
        if (res?.data) {
          setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? res.data : r)));
          addActivity(reviewerName || 'Central Authority', 'Rejected Public Report', reportId, 'Report');
          toast('Report marked as rejected in database.', { icon: '🚫' });
          await refreshFromBackend();
          return;
        }
      } catch (err) {
        console.warn('Backend reject report failed, using client state:', err);
      }
    }

    const updated = reportService.updateReportStatus(reports, reportId, 'Rejected', reviewerName, reviewNotes);
    setReports(updated);
    addActivity(reviewerName || 'Central Authority', 'Rejected Public Report', reportId, 'Report');
    toast('Report marked as rejected.', { icon: '🚫' });
  };

  /**
   * Convert Report to Resource Request
   */
  const convertReportToRequest = async (reportId, reviewerName) => {
    if (isBackendLive) {
      try {
        const res = await reportService.apiConvertToRequest(reportId);
        if (res?.data?.request) {
          await refreshFromBackend();
          toast.success(`Report converted to Resource Request #${res.data.request.requestId} in MongoDB.`);
          return res.data.request;
        }
      } catch (err) {
        console.warn('Backend convert to request failed, using client state:', err);
      }
    }

    const rep = reports.find((r) => r.id === reportId || r.reportId === reportId);
    if (!rep) return;

    const camp = camps.find((c) => c.id === rep.campId) || camps[0];
    const campInv = inventory.find((i) => i.locationId === camp.id && (i.category.toLowerCase() === rep.category.toLowerCase() || i.category.includes(rep.category)));
    const availableQty = campInv ? campInv.availableQuantity : 0;

    const newRequest = requestService.createRequest({
      campId: camp.id,
      campName: camp.name,
      resourceCategory: rep.category === 'Food' ? 'Food Supplies' : (rep.category === 'Medicines' ? 'Essential Medicines' : rep.category),
      resourceItem: rep.category === 'Sanitary Pads' ? 'Sanitary Hygiene Packs' : (campInv ? campInv.itemName : `${rep.category} Emergency Stock`),
      requestedQuantity: rep.estimatedQuantity || 100,
      availableQuantityAtRequest: availableQty,
      unit: rep.unit || (campInv ? campInv.unit : 'Units'),
      affectedPopulation: rep.peopleAffected || camp.currentOccupancy || 50,
      severity: rep.urgency === 'Critical' ? 'Critical' : (rep.urgency === 'High' ? 'High' : 'Medium'),
      isMedicalEmergency: rep.category.includes('Medic'),
      sourceReportId: rep.id,
      notes: `Converted from verified report ${rep.referenceNumber}: ${rep.description}`,
    });

    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);

    setReports((prev) =>
      prev.map((r) =>
        (r.id === reportId || r.reportId === reportId)
          ? {
              ...r,
              status: 'Converted to Request',
              convertedToRequestId: newRequest.id,
              reviewedAt: new Date().toISOString(),
              reviewedBy: reviewerName || 'Central Authority',
            }
          : r
      )
    );

    addActivity(reviewerName || 'Central Authority', 'Converted Report to Request', `${newRequest.id} for ${camp.name}`, 'Request');
    toast.success(`Report converted to Resource Request #${newRequest.id}`);

    triggerShortageEvaluation(inventory, updatedRequests);
    return newRequest;
  };

  /**
   * Convert Report to Emergency Incident
   */
  const convertReportToIncident = async (reportId, responderName) => {
    if (isBackendLive) {
      try {
        const res = await reportService.apiConvertToIncident(reportId);
        if (res?.data?.incident) {
          await refreshFromBackend();
          toast.success(`Report converted to Emergency Incident #${res.data.incident.incidentId} in MongoDB.`);
          return res.data.incident;
        }
      } catch (err) {
        console.warn('Backend convert to incident failed, using client state:', err);
      }
    }

    const rep = reports.find((r) => r.id === reportId || r.reportId === reportId);
    if (!rep) return;

    const newIncident = {
      id: `INC-${String(Date.now()).slice(-4)}`,
      title: `${rep.category}: ${rep.description.slice(0, 50)}...`,
      category: rep.category.includes('Medic') ? 'Medical Emergency' : 'Severe Shortage & Health Hazard',
      campId: rep.campId,
      campName: rep.campName,
      locationAddress: rep.manualLocationAddress || 'Camp Precincts',
      district: rep.district || 'Ernakulam',
      severity: rep.urgency === 'Critical' ? 'Critical' : 'High',
      status: 'Response Assigned',
      reportedAt: new Date().toISOString(),
      assignedResponder: responderName || 'Rapid Response Ambulance & Doctor Desk',
      peopleAffected: rep.peopleAffected || 1,
      linkedRequestIds: [],
      linkedAlertIds: [],
      notes: `Logged directly from public report #${rep.referenceNumber}. ${rep.description}`,
    };

    setIncidents((prev) => [newIncident, ...prev]);

    setReports((prev) =>
      prev.map((r) =>
        (r.id === reportId || r.reportId === reportId)
          ? {
              ...r,
              status: 'Converted to Incident',
              convertedToIncidentId: newIncident.id,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Emergency Operations Desk',
            }
          : r
      )
    );

    addActivity('Emergency Operations Desk', 'Logged Emergency Incident from Report', `${newIncident.id} at ${newIncident.campName}`, 'Emergency');
    toast.success(`Report converted to Emergency Incident #${newIncident.id}`);
    return newIncident;
  };

  /**
   * Resource Request Actions
   */
  const approveRequest = async (requestId, reviewerName = 'Central Administrator') => {
    if (isBackendLive) {
      try {
        await requestService.apiUpdateRequestStatus(requestId, 'Approved', 'Approved by Central Administrator');
        await refreshFromBackend();
        toast.success(`Request ${requestId} approved for fulfillment in MongoDB.`);
        return;
      } catch (err) {
        console.warn('Backend approve request failed, using client state:', err);
      }
    }

    const updated = requestService.updateRequestStatus(requests, requestId, 'Approved', { reviewedBy: reviewerName });
    setRequests(updated);
    addActivity(reviewerName, 'Approved Resource Request', requestId, 'Request');
    toast.success(`Request ${requestId} approved for fulfillment.`);
  };

  const rejectRequest = async (requestId, reviewerName = 'Central Administrator', reason = '') => {
    if (isBackendLive) {
      try {
        await requestService.apiUpdateRequestStatus(requestId, 'Rejected', reason);
        await refreshFromBackend();
        toast('Request rejected in MongoDB.', { icon: '🚫' });
        return;
      } catch (err) {
        console.warn('Backend reject request failed, using client state:', err);
      }
    }

    const updated = requestService.updateRequestStatus(requests, requestId, 'Rejected', { reviewedBy: reviewerName, rejectionReason: reason });
    setRequests(updated);
    addActivity(reviewerName, 'Rejected Resource Request', requestId, 'Request');
    toast('Request rejected.', { icon: '🚫' });
  };

  /**
   * Allocation Recommendation & Commitment
   */
  const getRecommendationForRequest = (request) => {
    const camp = camps.find((c) => c.id === request.campId) || { name: request.campName };
    return calculateAllocationRecommendation({
      request,
      camp,
      inventory,
      warehouses,
      otherAlerts: alerts,
    });
  };

  const commitAllocation = async ({ requestId, sourceWarehouseId, allocatedQuantity, reviewerName = 'Central Administrator' }) => {
    const req = requests.find((r) => r.id === requestId || r.requestId === requestId);
    if (!req) return false;

    if (isBackendLive) {
      try {
        const res = await allocationService.apiCreateAllocation({
          requestId: req.requestId || req.id,
          sourceWarehouseId,
          allocatedQuantity,
          notes: `Authorized by ${reviewerName}`,
        });

        if (res?.data?.allocation) {
          await refreshFromBackend();
          toast.success(`Allocation of ${allocatedQuantity} ${req.unit} approved and committed in MongoDB.`);
          return true;
        }
      } catch (err) {
        console.warn('Backend commit allocation failed, falling back to client logic:', err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || 'Server allocation failed. Using local state.');
      }
    }

    // Client fallback
    const sourceInv = inventory.find(
      (inv) => inv.locationId === sourceWarehouseId && inv.category === req.resourceCategory
    );

    if (!sourceInv) {
      toast.error('Source warehouse does not hold this resource category.');
      return false;
    }

    const availableStock = sourceInv.availableQuantity - sourceInv.reservedQuantity;
    if (allocatedQuantity > availableStock) {
      toast.error(`Cannot allocate ${allocatedQuantity}. Only ${availableStock} ${sourceInv.unit} is unreserved.`);
      return false;
    }

    const updatedInventory = resourceService.reserveStock(inventory, sourceInv.id, allocatedQuantity);
    setInventory(updatedInventory);

    const updatedRequests = requestService.updateRequestStatus(requests, requestId, 'Allocated', {
      allocatedWarehouseId: sourceWarehouseId,
      allocatedQuantity,
      reviewedBy: reviewerName,
    });
    setRequests(updatedRequests);

    addActivity(
      reviewerName,
      'Authorized Resource Allocation',
      `${allocatedQuantity} ${req.unit} of ${req.resourceItem} from ${sourceWarehouseId} to ${req.campName}`,
      'Allocation'
    );

    toast.success(`Allocation of ${allocatedQuantity} ${req.unit} approved.`);
    return true;
  };

  const dispatchAllocatedRequest = async (requestId, reviewerName = 'Logistics Desk') => {
    if (isBackendLive) {
      try {
        await requestService.apiUpdateRequestStatus(requestId, 'Dispatched', 'Consignment handed to field logistics team');
        await refreshFromBackend();
        toast.success(`Consignment for ${requestId} dispatched via database.`);
        return;
      } catch (err) {
        console.warn('Backend dispatch failed:', err);
      }
    }

    const req = requests.find((r) => r.id === requestId || r.requestId === requestId);
    if (!req || req.status !== 'Allocated') {
      toast.error('Only allocated requests can be dispatched.');
      return;
    }

    const sourceInv = inventory.find(
      (inv) => inv.locationId === req.allocatedWarehouseId && inv.category === req.resourceCategory
    );

    let updatedInventory = inventory;
    if (sourceInv) {
      updatedInventory = resourceService.commitDispatch(inventory, sourceInv.id, req.allocatedQuantity);
      setInventory(updatedInventory);
    }

    const updatedRequests = requestService.updateRequestStatus(requests, requestId, 'Dispatched', {
      dispatchedAt: new Date().toISOString(),
    });
    setRequests(updatedRequests);

    addActivity(reviewerName, 'Dispatched Consignment', `${req.allocatedQuantity} ${req.unit} for ${req.campName}`, 'Inventory');
    toast.success(`Consignment for ${req.campName} marked as Dispatched.`);
  };

  const deliverRequest = async (requestId, reviewerName = 'Camp Receiver') => {
    if (isBackendLive) {
      try {
        await requestService.apiUpdateRequestStatus(requestId, 'Delivered', 'Goods physically confirmed at camp entrance');
        await refreshFromBackend();
        toast.success(`Delivery receipt confirmed and shortage re-evaluated in MongoDB.`);
        return;
      } catch (err) {
        console.warn('Backend deliver failed:', err);
      }
    }

    const req = requests.find((r) => r.id === requestId || r.requestId === requestId);
    if (!req || req.status !== 'Dispatched') {
      toast.error('Only dispatched requests can be marked delivered.');
      return;
    }

    const updatedInventory = resourceService.deliverToDestination(
      inventory,
      req.campId,
      req.resourceCategory,
      req.resourceItem,
      req.allocatedQuantity || req.requestedQuantity,
      req.unit
    );
    setInventory(updatedInventory);

    const updatedRequests = requestService.updateRequestStatus(requests, requestId, 'Delivered', {
      deliveredAt: new Date().toISOString(),
    });
    setRequests(updatedRequests);

    addActivity(reviewerName, 'Verified Delivery Receipt', `${req.allocatedQuantity || req.requestedQuantity} ${req.unit} received at ${req.campName}`, 'Inventory');
    toast.success(`Delivery received at ${req.campName}. Inventory balance updated.`);

    triggerShortageEvaluation(updatedInventory, updatedRequests);
  };

  /**
   * Shortage Alert Actions
   */
  const acknowledgeAlert = async (alertId, userName = 'Operations Desk') => {
    if (isBackendLive) {
      try {
        await shortageAlertService.apiAcknowledgeAlert(alertId, `Acknowledged by ${userName}`);
        await refreshFromBackend();
        toast.success(`Alert ${alertId} acknowledged in MongoDB.`);
        return;
      } catch (err) {
        console.warn('Backend acknowledge alert failed:', err);
      }
    }

    setAlerts((prev) =>
      prev.map((a) =>
        (a.id === alertId || a.alertId === alertId)
          ? {
              ...a,
              status: 'Acknowledged',
              acknowledgedAt: new Date().toISOString(),
              assignedTo: userName,
            }
          : a
      )
    );
    addActivity(userName, 'Acknowledged Shortage Alert', alertId, 'Alert');
    toast.success(`Alert ${alertId} acknowledged.`);
  };

  const assignAlertAction = async (alertId, assignedCoordinator, note = '') => {
    if (isBackendLive) {
      try {
        await shortageAlertService.apiAssignAlert(alertId, assignedCoordinator, note);
        await refreshFromBackend();
        toast.success(`Action assigned to ${assignedCoordinator} in MongoDB.`);
        return;
      } catch (err) {
        console.warn('Backend assign alert failed:', err);
      }
    }

    setAlerts((prev) =>
      prev.map((a) =>
        (a.id === alertId || a.alertId === alertId)
          ? {
              ...a,
              status: 'Action Assigned',
              assignedTo: assignedCoordinator,
              internalNotes: note ? `${a.internalNotes ? a.internalNotes + ' | ' : ''}${note}` : a.internalNotes,
            }
          : a
      )
    );
    addActivity('Operations Desk', 'Assigned Alert Action', `${alertId} assigned to ${assignedCoordinator}`, 'Alert');
    toast.success(`Action assigned to ${assignedCoordinator}.`);
  };

  const resolveAlert = async (alertId, userName = 'Operations Desk') => {
    if (isBackendLive) {
      try {
        const res = await shortageAlertService.apiResolveAlert(alertId, `Stock replenished. Resolved by ${userName}`);
        if (res?.data) {
          await refreshFromBackend();
          toast.success(`Alert ${alertId} resolved in MongoDB.`);
          return true;
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Cannot resolve alert: stock remains below threshold.', { duration: 6000 });
        return false;
      }
    }

    const targetAlert = alerts.find((a) => a.id === alertId || a.alertId === alertId);
    if (!targetAlert) return false;

    const verification = shortageAlertService.canManuallyResolveAlert(targetAlert, inventory);
    if (!verification.allowed) {
      toast.error(verification.reason, { duration: 6000 });
      return false;
    }

    setAlerts((prev) =>
      prev.map((a) =>
        (a.id === alertId || a.alertId === alertId)
          ? {
              ...a,
              status: 'Resolved',
              resolvedAt: new Date().toISOString(),
              explanation: `Manually marked resolved by ${userName}. Stock levels confirmed above safety threshold.`,
            }
          : a
      )
    );
    addActivity(userName, 'Resolved Shortage Alert', alertId, 'Alert');
    toast.success(`Alert ${alertId} resolved.`);
    return true;
  };

  const simulateAlertRefresh = (hoursToAdvance = 4) => {
    const escalated = shortageAlertService.simulateAlertEscalation(alerts, hoursToAdvance);
    setAlerts(escalated);
    addActivity('System Simulation', 'Simulated Alert Refresh & Escalation', `Advanced clock by ${hoursToAdvance}h to test SLA breach targets`, 'Alert');
    toast(`Alert SLA clock advanced by ${hoursToAdvance}h. Escalation conditions re-evaluated.`, { icon: '⏱️' });
  };

  /**
   * Camp Management
   */
  const addCamp = async (newCampData) => {
    if (isBackendLive) {
      try {
        const res = await campService.apiCreateCamp({
          ...newCampData,
          latitude: parseFloat(newCampData.latitude) || 10.1118,
          longitude: parseFloat(newCampData.longitude) || 76.3534,
        });
        if (res?.data) {
          await refreshFromBackend();
          toast.success(`Camp "${res.data.name}" registered in MongoDB.`);
          return res.data;
        }
      } catch (err) {
        console.warn('Backend add camp failed, using local state:', err);
      }
    }

    const id = `CAMP-0${camps.length + 1}`;
    const newCamp = {
      id,
      name: newCampData.name,
      address: newCampData.address,
      district: newCampData.district || 'Ernakulam',
      state: 'Kerala',
      coordinates: [parseFloat(newCampData.latitude) || 10.1118, parseFloat(newCampData.longitude) || 76.3534],
      manager: newCampData.manager,
      contactPhone: newCampData.contactPhone,
      capacity: Number(newCampData.capacity) || 300,
      currentOccupancy: Number(newCampData.currentOccupancy) || 0,
      operationalStatus: 'Active',
      establishedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      primaryVulnerability: newCampData.primaryVulnerability || 'Registered Relief Center',
    };

    setCamps((prev) => [...prev, newCamp]);
    addActivity('Central Administrator', 'Registered Relief Camp', `${newCamp.name} (${newCamp.id})`, 'Camp');
    toast.success(`Camp "${newCamp.name}" successfully registered.`);
    return newCamp;
  };

  const updateCamp = async (campId, updates) => {
    if (isBackendLive) {
      try {
        await campService.apiUpdateCamp(campId, updates);
        await refreshFromBackend();
        toast.success('Camp record updated in MongoDB.');
        return;
      } catch (err) {
        console.warn('Backend update camp failed:', err);
      }
    }

    setCamps((prev) =>
      prev.map((c) =>
        (c.id === campId || c.campId === campId)
          ? {
              ...c,
              ...updates,
              lastUpdated: new Date().toISOString(),
            }
          : c
      )
    );
    addActivity('Camp Administrator', 'Updated Camp Record', campId, 'Camp');
    toast.success('Camp details updated.');
  };

  /**
   * Reset All Demo Data
   */
  const resetDemoData = async () => {
    if (isBackendLive) {
      try {
        await analyticsService.apiResetDemoData();
        await refreshFromBackend();
        toast.success('MongoDB dataset reset to initial baseline.');
        return;
      } catch (err) {
        console.warn('Backend reset failed:', err);
      }
    }

    localStorage.removeItem('sahay_camps');
    localStorage.removeItem('sahay_warehouses');
    localStorage.removeItem('sahay_inventory');
    localStorage.removeItem('sahay_alerts');
    localStorage.removeItem('sahay_reports');
    localStorage.removeItem('sahay_requests');
    localStorage.removeItem('sahay_donations');
    localStorage.removeItem('sahay_volunteers');
    localStorage.removeItem('sahay_incidents');
    localStorage.removeItem('sahay_activities');
    localStorage.removeItem('sahay_response_targets');

    setCamps(INITIAL_CAMPS);
    setWarehouses(INITIAL_WAREHOUSES);
    setInventory(INITIAL_INVENTORY);
    setAlerts(INITIAL_ALERTS);
    setReports(INITIAL_REPORTS);
    setRequests(INITIAL_REQUESTS);
    setDonations(INITIAL_DONATIONS);
    setVolunteers(INITIAL_VOLUNTEERS);
    setIncidents(INITIAL_INCIDENTS);
    setActivities(INITIAL_ACTIVITIES);
    setResponseTargets(DEFAULT_RESPONSE_TARGETS);

    toast.success('Demonstration dataset reset to initial state.');
  };

  return (
    <AppDataContext.Provider
      value={{
        isBackendLive,
        refreshFromBackend,
        camps,
        warehouses,
        inventory,
        alerts,
        reports,
        requests,
        donations,
        volunteers,
        incidents,
        activities,
        responseTargets,
        setResponseTargets,
        // Actions
        submitPublicReport,
        verifyReport,
        rejectReport,
        convertReportToRequest,
        convertReportToIncident,
        approveRequest,
        rejectRequest,
        getRecommendationForRequest,
        commitAllocation,
        dispatchAllocatedRequest,
        deliverRequest,
        acknowledgeAlert,
        assignAlertAction,
        resolveAlert,
        simulateAlertRefresh,
        addCamp,
        updateCamp,
        setInventory,
        setDonations,
        setVolunteers,
        setIncidents,
        addActivity,
        resetDemoData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

export default AppDataContext;
