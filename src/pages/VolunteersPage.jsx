import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { StatusBadge } from '../components/common/Badge';
import { VolunteerAssignModal } from '../components/forms/VolunteerAssignModal';
import { volunteerService } from '../../src/services/volunteerService';
import { exportToCSV } from '../utils/csvExport';
import { formatRelativeTime } from '../utils/formatters';
import {
  Users,
  Search,
  Filter,
  Download,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
} from 'lucide-react';

export const VolunteersPage = () => {
  const { volunteers, camps, alerts, incidents } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVolunteerForModal, setSelectedVolunteerForModal] = useState(null);
  const [matchingCampId, setMatchingCampId] = useState('');

  // Skills-based matching recommendation helper
  const targetMatchingCamp = camps.find((c) => c.id === matchingCampId);
  const matchedVolunteers = useMemo(() => {
    if (!targetMatchingCamp) return null;
    const campShortages = alerts.filter((a) => a.campId === targetMatchingCamp.id && a.status !== 'Resolved');
    const campIncidents = incidents.filter((i) => i.campId === targetMatchingCamp.id && i.status !== 'Resolved');
    return volunteerService.matchVolunteersForCamp(targetMatchingCamp, volunteers, campShortages, campIncidents);
  }, [targetMatchingCamp, volunteers, alerts, incidents]);

  const displayList = matchedVolunteers || volunteers;

  const filteredVolunteers = useMemo(() => {
    return displayList.filter((vol) => {
      const matchesSearch =
        vol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vol.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vol.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vol.skills || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (roleFilter !== 'ALL' && !vol.role.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && vol.assignmentStatus !== statusFilter) return false;

      return true;
    });
  }, [displayList, searchQuery, roleFilter, statusFilter]);

  const deployedCount = volunteers.filter((v) => v.assignmentStatus === 'Deployed').length;
  const availableCount = volunteers.filter((v) => v.assignmentStatus === 'Available').length;

  const handleExportCSV = () => {
    const csvData = filteredVolunteers.map((v) => ({
      'Volunteer ID': v.id,
      Name: v.name,
      Role: v.role,
      Skills: (v.skills || []).join('; '),
      Availability: v.availability,
      'Assignment Status': v.assignmentStatus,
      'Assigned Camp': v.assignedCampName || 'Standby',
      'Current Assignment': v.currentAssignment,
      Phone: v.phone,
      Email: v.email,
      'Tasks Completed': v.tasksCompleted,
    }));
    exportToCSV(csvData, `sahay-volunteers-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Volunteers & Field Personnel Deployment
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Skills-based volunteer mobilization, roster assignment, and camp triage placement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded border border-sahay-border bg-white hover:bg-sahay-ivory text-xs font-medium text-sahay-slate hover:text-sahay-charcoal transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Roster Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Deployed on Ground</span>
          <p className="text-2xl font-bold font-mono text-sahay-forest-deep">{deployedCount}</p>
          <p className="text-xs text-sahay-slate">Stationed at active camps & transit hubs</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Available for Immediate Dispatch</span>
          <p className="text-2xl font-bold font-mono text-sahay-green">{availableCount}</p>
          <p className="text-xs text-sahay-slate">Standby reserve for emergency mobilizations</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Total Roster Count</span>
          <p className="text-2xl font-bold font-mono text-sahay-charcoal">{volunteers.length}</p>
          <p className="text-xs text-sahay-slate">Doctors, nurses, logistics tech & counselors</p>
        </div>
      </div>

      {/* Skills-Based Matching Recommendation Banner */}
      <div className="p-4 rounded border border-sahay-forest-action/30 bg-sahay-forest-light/40 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sahay-forest-action shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-sahay-forest-deep uppercase tracking-wider">
                Skills-Based Camp Matching Recommender
              </h3>
              <p className="text-xs text-sahay-slate">
                Select a camp to rank volunteers by matching skillsets with the camp's active medical incidents and shortages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={matchingCampId}
              onChange={(e) => setMatchingCampId(e.target.value)}
              className="px-3 py-1.5 rounded border border-sahay-border bg-white text-xs font-semibold text-sahay-forest-deep"
            >
              <option value="">Choose Camp to Rank Candidates...</option>
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} ({camp.district})
                </option>
              ))}
            </select>
            {matchingCampId && (
              <button
                type="button"
                onClick={() => setMatchingCampId('')}
                className="px-2 py-1 text-xs text-sahay-slate hover:text-sahay-charcoal"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {targetMatchingCamp && (
          <p className="text-[11px] text-sahay-forest-deep bg-white p-2 rounded border border-sahay-border-light">
            Targeting <strong>{targetMatchingCamp.name}</strong>: Prioritizing medical, maternal care, and food handling skills based on current camp deficits.
          </p>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search volunteer name, skills, role, or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Roles</option>
            <option value="Medical">Medical / Paramedic</option>
            <option value="Logistics">Logistics & Fleet</option>
            <option value="Welfare">Welfare & Gender Protection</option>
            <option value="Search">Search & Rescue</option>
            <option value="Kitchen">Community Kitchen</option>
            <option value="Sanitation">Sanitation</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Deployment Statuses</option>
            <option value="Available">Available (Standby)</option>
            <option value="Deployed">Deployed on Duty</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredVolunteers.length}</strong> personnel
        </div>
      </div>

      {/* Volunteer Directory Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Volunteer ID & Name</th>
                <th className="py-3 px-4">Relief Specialization</th>
                <th className="py-3 px-4">Assigned Deployment</th>
                <th className="py-3 px-4">Status & Availability</th>
                <th className="py-3 px-4">Contact Info</th>
                {matchingCampId && <th className="py-3 px-4">Camp Match Score</th>}
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredVolunteers.map((vol) => (
                <tr key={vol.id} className="hover:bg-sahay-ivory/30 transition-colors">
                  {/* ID & Name */}
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep font-bold">
                      {vol.id}
                    </span>
                    <p className="font-bold text-sahay-charcoal mt-1">{vol.name}</p>
                    <span className="text-[10px] text-sahay-slate">{vol.tasksCompleted} tasks completed</span>
                  </td>

                  {/* Skills */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-semibold text-sahay-forest-deep">{vol.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(vol.skills || []).map((skill, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-sahay-border-light text-sahay-slate">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Deployment */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sahay-charcoal">
                      {vol.assignedCampName || 'Standby Roster'}
                    </p>
                    <p className="text-[11px] text-sahay-slate line-clamp-1 mt-0.5">
                      {vol.currentAssignment}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={vol.assignmentStatus} />
                    <p className="text-[10px] text-sahay-slate mt-0.5">{vol.availability}</p>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4 text-sahay-slate">
                    <p className="text-[11px] font-mono font-medium text-sahay-charcoal">{vol.phone}</p>
                    <p className="text-[10px] truncate max-w-[140px]">{vol.email}</p>
                  </td>

                  {/* Match Score (if camp selected) */}
                  {matchingCampId && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-sm text-sahay-forest-deep">
                          {vol.matchScore || 0}%
                        </span>
                        {vol.matchedSkills && vol.matchedSkills.length > 0 && (
                          <span className="text-[10px] text-sahay-teal">
                            ({vol.matchedSkills.join(', ')})
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedVolunteerForModal(vol)}
                      className="px-2.5 py-1 rounded bg-sahay-forest-light text-sahay-forest-action hover:bg-sahay-forest-action hover:text-white transition-colors text-xs font-medium"
                    >
                      {vol.assignmentStatus === 'Deployed' ? 'Reassign' : 'Deploy'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Deployment Modal */}
      <VolunteerAssignModal
        volunteer={selectedVolunteerForModal}
        isOpen={Boolean(selectedVolunteerForModal)}
        onClose={() => setSelectedVolunteerForModal(null)}
      />
    </div>
  );
};
