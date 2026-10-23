import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { calculateCampPriority } from '../utils/priorityCalculator';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { CampFormModal } from '../components/forms/CampFormModal';
import { exportToCSV } from '../utils/csvExport';
import {
  Search,
  Filter,
  Plus,
  Download,
  MapPin,
  Users,
  AlertTriangle,
  Boxes,
  ChevronRight,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

export const CampsPage = () => {
  const { camps, alerts, incidents, requests } = useAppData();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('filter') === 'urgent' ? 'URGENT' : 'ALL');
  const [sortBy, setSortBy] = useState('priority');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campToEdit, setCampToEdit] = useState(null);

  // Enriched camps with priority info and shortages
  const enrichedCamps = useMemo(() => {
    return camps.map((camp) => {
      const priorityInfo = calculateCampPriority(camp, alerts, incidents, requests);
      const campAlerts = alerts.filter((a) => a.campId === camp.id && a.status !== 'Resolved');
      const campRequests = requests.filter((r) => r.campId === camp.id && ['Submitted', 'Under Review', 'Approved'].includes(r.status));
      const criticalShortages = campAlerts.filter((a) => a.severity === 'Critical');

      return {
        ...camp,
        priorityInfo,
        campAlerts,
        campRequests,
        criticalShortages,
      };
    });
  }, [camps, alerts, incidents, requests]);

  // Filter & Search
  const filteredCamps = useMemo(() => {
    return enrichedCamps
      .filter((camp) => {
        const matchesSearch =
          camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          camp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          camp.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (camp.manager || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (districtFilter !== 'ALL' && camp.district !== districtFilter) return false;
        if (priorityFilter === 'URGENT' && camp.priorityInfo.tier !== 'Critical' && camp.priorityInfo.tier !== 'High') return false;
        if (priorityFilter !== 'ALL' && priorityFilter !== 'URGENT' && camp.priorityInfo.tier !== priorityFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priorityInfo.score - a.priorityInfo.score;
        if (sortBy === 'occupancy') return b.currentOccupancy - a.currentOccupancy;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [enrichedCamps, searchQuery, districtFilter, priorityFilter, sortBy]);

  const handleExportCSV = () => {
    const csvData = filteredCamps.map((c) => ({
      'Camp ID': c.id,
      'Camp Name': c.name,
      District: c.district,
      Address: c.address,
      Manager: c.manager,
      Phone: c.contactPhone,
      Capacity: c.capacity,
      Occupancy: c.currentOccupancy,
      'Occupancy Rate': `${Math.round((c.currentOccupancy / c.capacity) * 100)}%`,
      'Priority Score': c.priorityInfo.score,
      'Urgency Tier': c.priorityInfo.tier,
      'Active Shortages': c.campAlerts.length,
      'Pending Requests': c.campRequests.length,
      'Last Updated': c.lastUpdated,
    }));
    exportToCSV(csvData, `sahay-camps-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Relief Camps Directory
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Central registry of verified disaster shelters, registered locations, occupancies, and operational priorities.
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

          <button
            type="button"
            onClick={() => {
              setCampToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Register Camp</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by camp name, ID, manager, or address..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Districts</option>
            <option value="Ernakulam">Ernakulam</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Priority Tiers</option>
            <option value="URGENT">Critical & High Urgency Only</option>
            <option value="Critical">Critical Tier</option>
            <option value="High">High Tier</option>
            <option value="Moderate">Moderate Tier</option>
            <option value="Normal">Normal Tier</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="priority">Sort by Urgency Priority Score</option>
            <option value="occupancy">Sort by Highest Occupancy</option>
            <option value="name">Sort Alphabetically (A-Z)</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredCamps.length}</strong> camps
        </div>
      </div>

      {/* Camps Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Camp ID & Facility</th>
                <th className="py-3 px-4">Registered Location</th>
                <th className="py-3 px-4">Occupancy / Capacity</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Active Shortages</th>
                <th className="py-3 px-4">Manager Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredCamps.map((camp) => {
                const occupancyRate = Math.round((camp.currentOccupancy / camp.capacity) * 100);
                const isOvercrowded = occupancyRate >= 95;

                return (
                  <tr key={camp.id} className="hover:bg-sahay-ivory/30 transition-colors">
                    {/* Camp ID & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep font-semibold">
                          {camp.id}
                        </span>
                        <Link
                          to={`/camps/${camp.id}`}
                          className="font-bold text-sahay-forest-deep hover:text-sahay-forest-action hover:underline"
                        >
                          {camp.name}
                        </Link>
                      </div>
                      <p className="text-[11px] text-sahay-slate mt-0.5 line-clamp-1">
                        {camp.primaryVulnerability}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-sahay-slate">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-sahay-slate mt-0.5" />
                        <div>
                          <p className="text-sahay-charcoal font-medium line-clamp-1">{camp.address}</p>
                          <p className="text-[10px]">{camp.district}, {camp.state}</p>
                        </div>
                      </div>
                    </td>

                    {/* Occupancy */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sahay-charcoal">
                          {camp.currentOccupancy} / {camp.capacity}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isOvercrowded
                              ? 'bg-sahay-terracotta-light text-sahay-terracotta'
                              : 'bg-sahay-border-light text-sahay-slate'
                          }`}
                        >
                          {occupancyRate}%
                        </span>
                      </div>
                      <div className="w-full bg-sahay-border h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            isOvercrowded ? 'bg-sahay-terracotta' : 'bg-sahay-forest-action'
                          }`}
                          style={{ width: `${Math.min(100, occupancyRate)}%` }}
                        />
                      </div>
                    </td>

                    {/* Priority Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-sahay-forest-deep">
                          {camp.priorityInfo.score}
                        </span>
                        <SeverityBadge severity={camp.priorityInfo.tier} />
                      </div>
                    </td>

                    {/* Active Shortages */}
                    <td className="py-3 px-4">
                      {camp.campAlerts.length === 0 ? (
                        <span className="text-sahay-green text-[11px] font-medium flex items-center gap-1">
                          <span>Stable Buffer</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {camp.criticalShortages.length > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sahay-terracotta-light text-sahay-terracotta border border-sahay-terracotta/30">
                              {camp.criticalShortages.length} Critical
                            </span>
                          )}
                          <span className="text-[11px] text-sahay-slate">
                            {camp.campAlerts.length} total alert(s)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Manager */}
                    <td className="py-3 px-4 text-sahay-slate">
                      <p className="font-medium text-sahay-charcoal">{camp.manager}</p>
                      <p className="text-[10px] font-mono">{camp.contactPhone}</p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCampToEdit(camp);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-border/60 transition-colors"
                          title="Edit camp registration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to={`/camps/${camp.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-sahay-border bg-white text-sahay-forest-action hover:bg-sahay-forest-light text-xs font-medium transition-colors"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camp Modal */}
      <CampFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campToEdit={campToEdit}
      />
    </div>
  );
};
