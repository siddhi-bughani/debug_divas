import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import {
  Filter,
  MapPin,
  Users,
  AlertTriangle,
  PackageSearch,
  ExternalLink,
  ShieldAlert,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { calculateCampPriority } from '../../utils/priorityCalculator';
import { SeverityBadge } from '../common/Badge';

// Helper to create custom HTML/SVG div icon with urgency colors
const createCustomMarker = (urgencyTier, hasCriticalAlert) => {
  let color = '#376653'; // Forest action / Normal
  let borderColor = '#203D35';

  if (urgencyTier === 'Critical' || hasCriticalAlert) {
    color = '#B84F43'; // Terracotta
    borderColor = '#7f2e24';
  } else if (urgencyTier === 'High') {
    color = '#B88735'; // Ochre
    borderColor = '#7c581d';
  } else if (urgencyTier === 'Moderate') {
    color = '#648C83'; // Teal
    borderColor = '#38554e';
  }

  const pulseRing = (urgencyTier === 'Critical' || hasCriticalAlert)
    ? `<span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        ${pulseRing}
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
          z-index: 2;
        ">
          ▲
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to dynamically re-center map when selected camp changes
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

export const CampMapView = ({ onSelectCamp, selectedCampId }) => {
  const { camps, alerts, incidents, requests } = useAppData();

  // Filters
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(() => camps.find(c => c.id === selectedCampId) || null);

  // Compute enriched camps with priority and active shortage stats
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
        hasCriticalAlert: criticalShortages.length > 0,
      };
    });
  }, [camps, alerts, incidents, requests]);

  // Apply filters
  const filteredCamps = useMemo(() => {
    return enrichedCamps.filter((camp) => {
      if (onlyUrgent && camp.priorityInfo.tier !== 'Critical' && camp.priorityInfo.tier !== 'High') {
        return false;
      }
      if (filterSeverity !== 'ALL' && camp.priorityInfo.tier !== filterSeverity) {
        return false;
      }
      if (filterCategory !== 'ALL') {
        const hasCategory = camp.campAlerts.some((a) => a.resourceCategory === filterCategory);
        if (!hasCategory) return false;
      }
      return true;
    });
  }, [enrichedCamps, onlyUrgent, filterSeverity, filterCategory]);

  const defaultCenter = [10.13, 76.35]; // Ernakulam relief corridor

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[550px] bg-white rounded border border-sahay-border overflow-hidden">
      {/* Top Filter Bar */}
      <div className="p-3 bg-sahay-ivory/60 border-b border-sahay-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sahay-forest-deep flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Map Filters:</span>
          </span>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2 py-1 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs"
          >
            <option value="ALL">All Priority Levels</option>
            <option value="Critical">Critical Urgency Only</option>
            <option value="High">High Urgency Only</option>
            <option value="Moderate">Moderate Urgency</option>
            <option value="Normal">Normal Urgency</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-1 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs"
          >
            <option value="ALL">All Resource Shortages</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Food Supplies">Food Supplies</option>
            <option value="Sanitary Pads">Sanitary Pads</option>
            <option value="Essential Medicines">Essential Medicines</option>
            <option value="Blankets">Blankets</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-sahay-charcoal font-medium select-none ml-2">
            <input
              type="checkbox"
              checked={onlyUrgent}
              onChange={(e) => setOnlyUrgent(e.target.checked)}
              className="rounded text-sahay-forest-action focus:ring-sahay-forest-action"
            />
            <span>Show Only Urgent Camps</span>
          </label>
        </div>

        <div className="flex items-center gap-2 text-sahay-slate">
          <span>Showing <strong>{filteredCamps.length}</strong> of {camps.length} registered camps</span>
        </div>
      </div>

      {/* Map + Detail Side Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Leaflet Map */}
        <div className="flex-1 h-full min-h-[350px] relative z-10">
          <MapContainer
            center={selectedCamp ? selectedCamp.coordinates : defaultCenter}
            zoom={11}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {selectedCamp && (
              <MapRecenter center={selectedCamp.coordinates} zoom={13} />
            )}

            {filteredCamps.map((camp) => {
              const icon = createCustomMarker(camp.priorityInfo.tier, camp.hasCriticalAlert);
              return (
                <Marker
                  key={camp.id}
                  position={camp.coordinates}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedCamp(camp);
                      if (onSelectCamp) onSelectCamp(camp);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold text-sahay-slate">{camp.id}</span>
                        <SeverityBadge severity={camp.priorityInfo.tier} />
                      </div>
                      <h4 className="font-bold text-xs text-sahay-forest-deep leading-tight">
                        {camp.name}
                      </h4>
                      <p className="text-[11px] text-sahay-slate mt-0.5 line-clamp-1">{camp.address}</p>
                      
                      <div className="mt-2 pt-2 border-t border-sahay-border text-xs flex justify-between">
                        <span>Occupancy:</span>
                        <span className="font-semibold">{camp.currentOccupancy} / {camp.capacity}</span>
                      </div>

                      {camp.criticalShortages.length > 0 && (
                        <div className="mt-1 text-[11px] text-sahay-terracotta font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{camp.criticalShortages.length} Critical Alert(s)</span>
                        </div>
                      )}

                      <Link
                        to={`/camps/${camp.id}`}
                        className="mt-2.5 block text-center py-1 px-2 rounded bg-sahay-forest-action text-white text-[11px] font-medium hover:bg-sahay-forest-hover"
                      >
                        Open Camp Dossier &rarr;
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-2.5 rounded border border-sahay-border shadow-card text-[11px]">
            <p className="font-bold text-sahay-forest-deep mb-1.5 uppercase text-[10px] tracking-wider">Urgency Status</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sahay-terracotta border border-white shrink-0 inline-block"></span>
                <span>Critical Shortage / Hazard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sahay-ochre border border-white shrink-0 inline-block"></span>
                <span>High Shortage Deficit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sahay-teal border border-white shrink-0 inline-block"></span>
                <span>Moderate Need</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sahay-forest-action border border-white shrink-0 inline-block"></span>
                <span>Operational / Stable</span>
              </div>
            </div>
            <p className="mt-2 pt-1 border-t border-sahay-border-light text-[9px] text-sahay-slate">
              Locations registered manually via authorized GIS coordinates.
            </p>
          </div>
        </div>

        {/* Selected Camp Side Panel */}
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-sahay-border bg-white flex flex-col h-full overflow-y-auto">
          {selectedCamp ? (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sahay-border-light text-sahay-slate">
                    {selectedCamp.id}
                  </span>
                  <SeverityBadge severity={selectedCamp.priorityInfo.tier} />
                </div>
                <h3 className="mt-2 text-sm font-bold text-sahay-forest-deep">
                  {selectedCamp.name}
                </h3>
                <p className="text-xs text-sahay-slate mt-0.5 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{selectedCamp.address}, {selectedCamp.district}</span>
                </p>
              </div>

              {/* Occupancy Indicator */}
              <div className="p-3 rounded bg-sahay-ivory border border-sahay-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sahay-slate font-medium">Camp Occupancy:</span>
                  <span className="font-bold text-sahay-charcoal">
                    {selectedCamp.currentOccupancy} / {selectedCamp.capacity} ({Math.round((selectedCamp.currentOccupancy / selectedCamp.capacity) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-sahay-border h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedCamp.currentOccupancy / selectedCamp.capacity > 0.9
                        ? 'bg-sahay-terracotta'
                        : 'bg-sahay-forest-action'
                    }`}
                    style={{ width: `${Math.min(100, (selectedCamp.currentOccupancy / selectedCamp.capacity) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Priority Explanation */}
              <div>
                <h4 className="text-xs font-semibold text-sahay-forest-deep uppercase tracking-wider">
                  Priority Analysis
                </h4>
                <p className="mt-1 text-xs text-sahay-slate bg-sahay-forest-light/40 p-2.5 rounded border border-sahay-border-light">
                  {selectedCamp.priorityInfo.primaryReason}
                </p>
              </div>

              {/* Active Shortage Alerts */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-sahay-forest-deep uppercase tracking-wider">
                    Active Shortages ({selectedCamp.campAlerts.length})
                  </h4>
                </div>

                <div className="mt-2 space-y-1.5">
                  {selectedCamp.campAlerts.length === 0 ? (
                    <p className="text-xs text-sahay-slate italic">No active shortage alerts.</p>
                  ) : (
                    selectedCamp.campAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-2 rounded border border-sahay-border text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium text-sahay-charcoal">{alert.resourceItem}</p>
                          <p className="text-[11px] text-sahay-slate">Deficit: {alert.estimatedShortageQuantity} {alert.unit}</p>
                        </div>
                        <SeverityBadge severity={alert.severity} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending Requests */}
              <div>
                <h4 className="text-xs font-semibold text-sahay-forest-deep uppercase tracking-wider">
                  Pending Resource Requests ({selectedCamp.campRequests.length})
                </h4>
                <div className="mt-2 space-y-1.5">
                  {selectedCamp.campRequests.length === 0 ? (
                    <p className="text-xs text-sahay-slate italic">No pending requests.</p>
                  ) : (
                    selectedCamp.campRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2 rounded border border-sahay-border text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sahay-charcoal">{req.resourceItem}</p>
                          <p className="text-[11px] text-sahay-slate">{req.requestedQuantity} {req.unit} • {req.status}</p>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sahay-border-light">
                          {req.id}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <Link
                  to={`/camps/${selectedCamp.id}`}
                  className="w-full py-2 px-3 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Full Camp Management File</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center my-auto">
              <MapPin className="w-8 h-8 text-sahay-slate mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-semibold text-sahay-forest-deep">Select a Camp Marker</h4>
              <p className="text-xs text-sahay-slate mt-1 max-w-xs mx-auto">
                Click on any map marker to view real-time camp occupancy, active shortage alerts, and dispatch options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
