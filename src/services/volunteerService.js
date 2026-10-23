/**
 * Volunteer Management Service
 * 
 * Provides skills-based matching and deployment tracking.
 */

import apiClient from './apiClient';

export const volunteerService = {
  // REST API Methods
  apiGetVolunteers: async (params = {}) => {
    return apiClient.get('/volunteers', { params });
  },

  apiCreateVolunteer: async (volunteerData) => {
    return apiClient.post('/volunteers', volunteerData);
  },

  apiAssignVolunteer: async (id, assignmentData) => {
    return apiClient.post(`/volunteers/${id}/assign`, assignmentData);
  },

  apiReleaseVolunteer: async (id) => {
    return apiClient.post(`/volunteers/${id}/release`);
  },

  // Client-side Fallback Adapters
  createVolunteer: (volunteerData) => {
    const id = `VOL-${String(Date.now()).slice(-4)}`;
    return {
      id,
      name: volunteerData.name,
      role: volunteerData.role || 'General Relief Volunteer',
      skills: Array.isArray(volunteerData.skills) ? volunteerData.skills : (volunteerData.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
      availability: volunteerData.availability || 'Available for Deployment',
      assignedCampId: null,
      assignedCampName: 'Standby Roster',
      currentAssignment: 'Registered on standby roster',
      assignmentStatus: 'Available', // Available, Deployed, On Leave
      phone: volunteerData.phone || '',
      email: volunteerData.email || '',
      tasksCompleted: 0,
      deployedSince: null,
    };
  },

  matchVolunteersForCamp: (camp, volunteers = [], campShortages = [], campIncidents = []) => {
    // Determine needed skills based on active camp issues
    const neededKeywords = [];
    
    if (campIncidents.some((i) => i.category === 'Medical Emergency')) {
      neededKeywords.push('Medical', 'Paramedic', 'Doctor', 'First Aid', 'Triage');
    }
    if (campShortages.some((s) => s.resourceCategory === 'Food Supplies')) {
      neededKeywords.push('Food', 'Kitchen', 'Cooking', 'Ration');
    }
    if (campShortages.some((s) => s.resourceCategory === 'Sanitary Pads' || s.resourceCategory === 'Baby Supplies')) {
      neededKeywords.push('Welfare', 'Gender', 'Child', 'Maternal');
    }
    if (campShortages.some((s) => s.resourceCategory === 'Hygiene Kits')) {
      neededKeywords.push('Sanitation', 'Hygiene', 'Disinfection');
    }

    // Default to logistics / general relief
    neededKeywords.push('Logistics', 'Warehouse', 'Registration');

    return volunteers.map((vol) => {
      const skillsStr = (vol.skills || []).join(' ') + ' ' + (vol.role || '');
      let matchScore = 0;
      const matchedSkills = [];

      for (const kw of neededKeywords) {
        if (skillsStr.toLowerCase().includes(kw.toLowerCase())) {
          matchScore += 25;
          matchedSkills.push(kw);
        }
      }

      if (vol.assignmentStatus === 'Available') {
        matchScore += 30; // bonus for immediately available
      }

      return {
        ...vol,
        matchScore: Math.min(matchScore, 100),
        matchedSkills,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  },

  deployVolunteer: (volunteersState, volunteerId, campId, campName, assignmentTitle) => {
    return volunteersState.map((vol) => {
      if (vol.id === volunteerId) {
        return {
          ...vol,
          assignedCampId: campId,
          assignedCampName: campName,
          currentAssignment: assignmentTitle,
          assignmentStatus: 'Deployed',
          deployedSince: new Date().toISOString(),
          tasksCompleted: vol.tasksCompleted + 1,
        };
      }
      return vol;
    });
  },

  releaseVolunteer: (volunteersState, volunteerId) => {
    return volunteersState.map((vol) => {
      if (vol.id === volunteerId) {
        return {
          ...vol,
          assignedCampId: null,
          assignedCampName: 'Standby Roster',
          currentAssignment: 'Awaiting next assignment',
          assignmentStatus: 'Available',
          deployedSince: null,
        };
      }
      return vol;
    });
  },
};
