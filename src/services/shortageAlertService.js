/**
 * Shortage Alert Service
 * 
 * Core differentiator: Auto-detection, deterministic severity ranking,
 * deduplication, escalation monitoring, and resolution verification.
 */

import apiClient from './apiClient';
import {
  evaluateItemShortage,
  getDeduplicationKey,
  checkEscalationStatus,
  DEFAULT_RESPONSE_TARGETS,
} from '../utils/shortageRules';

export const shortageAlertService = {
  // REST API Methods
  apiGetAlerts: async (params = {}) => {
    return apiClient.get('/alerts', { params });
  },

  apiGetAlertById: async (id) => {
    return apiClient.get(`/alerts/${id}`);
  },

  apiAcknowledgeAlert: async (id, notes = '') => {
    return apiClient.post(`/alerts/${id}/acknowledge`, { notes });
  },

  apiAssignAlert: async (id, assignedTo, notes = '') => {
    return apiClient.post(`/alerts/${id}/assign`, { assignedTo, notes });
  },

  apiResolveAlert: async (id, resolutionNotes = '') => {
    return apiClient.post(`/alerts/${id}/resolve`, { resolutionNotes });
  },

  apiTriggerEvaluation: async () => {
    return apiClient.post('/alerts/evaluate');
  },

  /**
   * Recalculates all alerts given current camps, inventory, requests, and existing alerts.
   * Enforces deduplication and preserves alert workflow states.
   */
  evaluateAllShortages: ({
    camps = [],
    inventory = [],
    requests = [],
    existingAlerts = [],
    responseTargets = DEFAULT_RESPONSE_TARGETS,
  }) => {
    const updatedAlerts = [...existingAlerts];

    // Evaluate camp-level inventory items
    for (const camp of camps) {
      const campItems = inventory.filter((inv) => inv.locationId === camp.id && inv.locationType === 'Camp');

      for (const item of campItems) {
        const dedupKey = getDeduplicationKey(camp.id, item.category, item.itemName);
        const condition = evaluateItemShortage(item, camp, requests);
        const existingAlertIndex = updatedAlerts.findIndex(
          (a) => a.dedupKey === dedupKey && a.status !== 'Resolved'
        );

        if (condition) {
          // Shortage is actively detected
          if (existingAlertIndex >= 0) {
            // Update existing unresolved alert
            const current = updatedAlerts[existingAlertIndex];
            updatedAlerts[existingAlertIndex] = {
              ...current,
              availableQuantityAtDetection: condition.availableQuantityAtDetection,
              estimatedDemand: condition.estimatedDemand,
              estimatedShortageQuantity: condition.estimatedShortageQuantity,
              severity: condition.severity,
              peopleAffected: condition.peopleAffected,
              explanation: condition.explanation,
              recommendedAction: condition.recommendedAction,
              lastEvaluatedAt: new Date().toISOString(),
            };
          } else {
            // Check if there was an earlier resolved alert with this key
            const priorResolved = updatedAlerts.find(
              (a) => a.dedupKey === dedupKey && a.status === 'Resolved'
            );

            // Create new active alert
            const newAlert = {
              id: `ALT-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
              dedupKey,
              inventoryRecordId: item.id,
              campId: camp.id,
              campName: camp.name,
              district: camp.district,
              locationAddress: camp.address,
              resourceCategory: item.category,
              resourceItem: item.itemName,
              unit: item.unit,
              availableQuantityAtDetection: condition.availableQuantityAtDetection,
              safetyStockThreshold: condition.safetyStockThreshold,
              estimatedDemand: condition.estimatedDemand,
              estimatedShortageQuantity: condition.estimatedShortageQuantity,
              peopleAffected: condition.peopleAffected,
              severity: condition.severity,
              status: 'Detected',
              detectedAt: new Date().toISOString(),
              acknowledgedAt: null,
              resolvedAt: null,
              assignedTo: 'Regional Disaster Ops Desk',
              explanation: condition.explanation,
              recommendedAction: condition.recommendedAction,
              linkedRequestIds: [],
              sourceReportIds: [],
              internalNotes: priorResolved ? 'Re-emerging shortage detected after previous resolution.' : '',
              recurrenceCount: priorResolved ? (priorResolved.recurrenceCount || 1) + 1 : 1,
            };
            updatedAlerts.unshift(newAlert);
          }
        } else {
          // Condition no longer present: stock has recovered!
          if (existingAlertIndex >= 0) {
            const current = updatedAlerts[existingAlertIndex];
            // Auto-resolve since underlying shortage is genuinely fixed
            updatedAlerts[existingAlertIndex] = {
              ...current,
              status: 'Resolved',
              resolvedAt: new Date().toISOString(),
              explanation: `Resolved: stock level (${item.availableQuantity} ${item.unit}) now meets or exceeds safety stock and demand at ${camp.name}.`,
              internalNotes: `${current.internalNotes ? current.internalNotes + ' | ' : ''}Auto-resolved by inventory balance recovery.`,
            };
          }
        }
      }
    }

    return updatedAlerts;
  },

  /**
   * Verify if an alert is eligible to be marked resolved manually
   */
  canManuallyResolveAlert: (alert, inventory = []) => {
    const item = inventory.find((inv) => inv.id === alert.inventoryRecordId || (inv.locationId === alert.campId && inv.category === alert.resourceCategory));
    if (!item) return { allowed: true };

    const effectiveStock = (item.availableQuantity || 0) - (item.reservedQuantity || 0);
    const belowSafety = effectiveStock < (item.safetyStockThreshold || 0);

    if (belowSafety) {
      return {
        allowed: false,
        reason: `Cannot resolve alert: Available stock is ${effectiveStock} ${item.unit}, which remains below the required safety threshold of ${item.safetyStockThreshold} ${item.unit}. Allocate or register delivered stock first.`,
      };
    }

    return { allowed: true };
  },

  /**
   * Simulate alert refresh / time advancement for escalation demo
   */
  simulateAlertEscalation: (alerts = [], hoursToAdvance = 4) => {
    return alerts.map((alert) => {
      if (alert.status === 'Resolved') return alert;

      const currentDetected = new Date(alert.detectedAt).getTime();
      // Backdate detection time so it appears older
      const simulatedDetected = new Date(currentDetected - (hoursToAdvance * 60 * 60 * 1000)).toISOString();
      
      const escalationCheck = checkEscalationStatus({ ...alert, detectedAt: simulatedDetected });
      
      let newSeverity = alert.severity;
      if (escalationCheck.isBreached && alert.severity === 'Medium') {
        newSeverity = 'High';
      } else if (escalationCheck.isBreached && alert.severity === 'High') {
        newSeverity = 'Critical';
      }

      return {
        ...alert,
        detectedAt: simulatedDetected,
        severity: newSeverity,
        escalationWarning: escalationCheck.isBreached,
      };
    });
  },
};
