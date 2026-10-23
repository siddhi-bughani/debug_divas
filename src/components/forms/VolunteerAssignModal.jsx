import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { volunteerService } from '../../services/volunteerService';
import { Users, CheckCircle2, Star, ShieldCheck, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const VolunteerAssignModal = ({ isOpen, onClose, volunteer }) => {
  const { camps, volunteers, setVolunteers, alerts, incidents, addActivity } = useAppData();
  const [selectedCampId, setSelectedCampId] = useState(volunteer?.assignedCampId || camps[0]?.id || '');
  const [assignmentTitle, setAssignmentTitle] = useState('');

  if (!volunteer) return null;

  const targetCamp = camps.find((c) => c.id === selectedCampId);
  const campShortages = alerts.filter((a) => a.campId === selectedCampId && a.status !== 'Resolved');
  const campIncidents = incidents.filter((i) => i.campId === selectedCampId && i.status !== 'Resolved');

  const handleDeploy = (e) => {
    e.preventDefault();
    if (!targetCamp) return;

    const roleAssignment = assignmentTitle.trim() || `Field Coordinator at ${targetCamp.name}`;
    const updated = volunteerService.deployVolunteer(
      volunteers,
      volunteer.id,
      targetCamp.id,
      targetCamp.name,
      roleAssignment
    );

    setVolunteers(updated);
    addActivity('Volunteer Coordinator', 'Deployed Volunteer', `${volunteer.name} assigned to ${targetCamp.name}`, 'Volunteer');
    toast.success(`${volunteer.name} successfully deployed to ${targetCamp.name}`);
    onClose();
  };

  const handleRelease = () => {
    const updated = volunteerService.releaseVolunteer(volunteers, volunteer.id);
    setVolunteers(updated);
    addActivity('Volunteer Coordinator', 'Released Volunteer to Standby', `${volunteer.name} returned to standby`, 'Volunteer');
    toast.success(`${volunteer.name} released to standby roster.`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deploy Volunteer: ${volunteer.name}`}
      subtitle={`Skills: ${(volunteer.skills || []).join(', ')}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleDeploy} className="space-y-4 text-xs">
        {/* Volunteer Profile Summary */}
        <div className="p-3 rounded bg-sahay-ivory border border-sahay-border flex items-center justify-between">
          <div>
            <p className="font-bold text-sahay-forest-deep text-sm">{volunteer.name}</p>
            <p className="text-sahay-slate mt-0.5">{volunteer.role} • {volunteer.phone}</p>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              volunteer.assignmentStatus === 'Deployed'
                ? 'bg-sahay-teal-light text-sahay-teal'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {volunteer.assignmentStatus}
          </span>
        </div>

        {/* Camp Destination Selector */}
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Assign To Relief Camp <span className="text-sahay-terracotta">*</span>
          </label>
          <select
            value={selectedCampId}
            onChange={(e) => setSelectedCampId(e.target.value)}
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs focus:ring-1 focus:ring-sahay-forest-action"
          >
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} ({camp.district}) — {camp.currentOccupancy} Occupants
              </option>
            ))}
          </select>
        </div>

        {/* Camp Needs Insight */}
        {targetCamp && (
          <div className="p-3 rounded border border-sahay-border bg-sahay-forest-light/40 space-y-1.5">
            <span className="text-[10px] font-bold text-sahay-forest-deep uppercase tracking-wider block">
              Camp Ground Vulnerabilities:
            </span>
            <p className="text-xs text-sahay-charcoal">{targetCamp.primaryVulnerability}</p>
            <div className="flex gap-3 text-[11px] text-sahay-slate pt-1">
              <span>Active Shortages: <strong>{campShortages.length}</strong></span>
              <span>Active Incidents: <strong>{campIncidents.length}</strong></span>
            </div>
          </div>
        )}

        {/* Assignment Role / Task */}
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Specific Field Assignment Task
          </label>
          <input
            type="text"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            placeholder="e.g. Lead medical triage unit / Supervise community kitchen"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-sahay-border flex items-center justify-between">
          {volunteer.assignmentStatus === 'Deployed' ? (
            <button
              type="button"
              onClick={handleRelease}
              className="px-3 py-1.5 rounded border border-sahay-border text-xs text-sahay-terracotta hover:bg-sahay-terracotta-light"
            >
              Release to Standby Roster
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-sahay-border text-xs font-medium text-sahay-slate hover:bg-sahay-border-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shadow-subtle flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Deployment</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
