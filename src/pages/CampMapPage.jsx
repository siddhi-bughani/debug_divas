import React, { useState } from 'react';
import { CampMapView } from '../components/maps/CampMapView';
import { useAppData } from '../context/AppDataContext';
import { calculateCampPriority } from '../utils/priorityCalculator';
import { StatCard } from '../components/common/StatCard';
import { Tent, AlertTriangle, ShieldAlert, MapPin, Layers } from 'lucide-react';

export const CampMapPage = () => {
  const { camps, alerts, incidents, requests } = useAppData();

  const criticalCampsCount = camps.filter((c) => {
    const priority = calculateCampPriority(c, alerts, incidents, requests);
    return priority.tier === 'Critical';
  }).length;

  const highCampsCount = camps.filter((c) => {
    const priority = calculateCampPriority(c, alerts, incidents, requests);
    return priority.tier === 'High';
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Interactive Relief Camp Geospatial Grid
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Manually registered camp installations, occupancy levels, and real-time urgency statuses.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-sahay-slate">
          <span>{criticalCampsCount} Critical Shelters</span>
          <span>•</span>
          <span>{highCampsCount} High Deficit Shelters</span>
        </div>
      </div>

      {/* Main Interactive Leaflet Map */}
      <CampMapView />
    </div>
  );
};
