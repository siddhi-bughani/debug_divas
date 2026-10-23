/**
 * SAHAY Priority Calculator
 * 
 * Computes deterministic urgency scores (0-100) for camps and resource requests,
 * providing transparent, human-readable reasons for ranking.
 */

export const calculateCampPriority = (camp, alerts = [], incidents = [], requests = []) => {
  const campAlerts = alerts.filter(a => a.campId === camp.id && a.status !== 'Resolved');
  const campIncidents = incidents.filter(i => i.campId === camp.id && i.status !== 'Resolved');
  const campRequests = requests.filter(r => r.campId === camp.id && ['Submitted', 'Under Review', 'Approved'].includes(r.status));

  let score = 0;
  const reasons = [];

  // Critical alerts: +30 points each (max 60)
  const criticalAlerts = campAlerts.filter(a => a.severity === 'Critical');
  if (criticalAlerts.length > 0) {
    score += Math.min(criticalAlerts.length * 30, 60);
    const items = criticalAlerts.map(a => a.resourceItem).join(', ');
    reasons.push(`${criticalAlerts.length} critical shortage (${items}) directly threatening survival.`);
  }

  // Active emergency/medical incidents: +25 points each (max 50)
  const criticalIncidents = campIncidents.filter(i => i.severity === 'Critical' || i.category === 'Medical Emergency');
  if (criticalIncidents.length > 0) {
    score += Math.min(criticalIncidents.length * 25, 50);
    reasons.push(`${criticalIncidents.length} active medical/critical incident(s) awaiting resolution.`);
  }

  // High severity alerts: +15 points each (max 30)
  const highAlerts = campAlerts.filter(a => a.severity === 'High');
  if (highAlerts.length > 0) {
    score += Math.min(highAlerts.length * 15, 30);
    const items = highAlerts.map(a => a.resourceItem).join(', ');
    reasons.push(`High deficit in ${items}.`);
  }

  // Overcrowding penalty: if occupancy > 90%
  const occupancyRatio = camp.capacity > 0 ? (camp.currentOccupancy / camp.capacity) : 0;
  if (occupancyRatio >= 1.0) {
    score += 15;
    reasons.push(`Camp operating at ${Math.round(occupancyRatio * 100)}% capacity (severe overcrowding).`);
  } else if (occupancyRatio >= 0.85) {
    score += 8;
    reasons.push(`Camp operating at ${Math.round(occupancyRatio * 100)}% capacity.`);
  }

  // Unresolved requests exceeding threshold
  const oldRequests = campRequests.filter(r => {
    const ageHrs = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
    return ageHrs > 6;
  });
  if (oldRequests.length > 0) {
    score += Math.min(oldRequests.length * 5, 15);
    reasons.push(`${oldRequests.length} resource request(s) unresolved for over 6 hours.`);
  }

  // Normalize score between 0 and 100
  const normalizedScore = Math.min(Math.max(Math.round(score), 5), 100);

  // Determine urgency tier
  let tier = 'Normal';
  if (normalizedScore >= 75) tier = 'Critical';
  else if (normalizedScore >= 50) tier = 'High';
  else if (normalizedScore >= 30) tier = 'Moderate';

  // Primary explainable summary
  const primaryReason = reasons.length > 0 
    ? reasons.join(' ')
    : 'Operational status stable with regular routine maintenance.';

  return {
    score: normalizedScore,
    tier,
    reasons,
    primaryReason,
    criticalAlertsCount: criticalAlerts.length,
    highAlertsCount: highAlerts.length,
    activeIncidentsCount: campIncidents.length,
    pendingRequestsCount: campRequests.length,
  };
};

/**
 * Calculate Priority Score for Resource Requests
 */
export const calculateRequestPriority = (request, camp) => {
  let score = 50; // base score

  if (request.severity === 'Critical') score += 35;
  else if (request.severity === 'High') score += 20;
  else if (request.severity === 'Medium') score += 5;

  if (request.isMedicalEmergency) score += 20;

  // Affected population scaling
  const affected = Number(request.affectedPopulation) || 0;
  if (affected > 200) score += 15;
  else if (affected > 50) score += 8;

  // Essential categories boost
  if (['Drinking Water', 'Essential Medicines', 'Sanitary Pads'].includes(request.resourceCategory)) {
    score += 10;
  }

  return Math.min(score, 100);
};
