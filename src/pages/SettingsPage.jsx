import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Settings as SettingsIcon,
  Clock,
  ShieldCheck,
  RefreshCw,
  Database,
  Sliders,
  RotateCcw,
  Server,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { responseTargets, setResponseTargets, resetDemoData, simulateAlertRefresh } = useAppData();
  const { currentUser } = useAuth();

  const [targets, setTargets] = useState({ ...responseTargets });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveTargets = (e) => {
    e.preventDefault();
    setResponseTargets(targets);
    localStorage.setItem('sahay_response_targets', JSON.stringify(targets));
    toast.success('SLA response targets updated successfully.');
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setTargets({
      Critical: 2,
      High: 6,
      Medium: 18,
      Low: 36,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="pb-3 border-b border-sahay-border">
        <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
          System Configuration & Operational Parameters
        </h1>
        <p className="text-xs text-sahay-slate mt-0.5">
          Configure response escalation thresholds, SLA service targets, and demonstration dataset states.
        </p>
      </div>

      {/* Section 1: SLA Response Targets Configuration */}
      <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sahay-forest-action" />
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Shortage Alert SLA Escalation Targets (Hours)
          </h3>
        </div>
        <p className="text-xs text-sahay-slate">
          Sets maximum permitted elapsed time before an unacknowledged or unaddressed shortage alert is flagged as breached and escalated to priority command.
        </p>

        <form onSubmit={handleSaveTargets} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded bg-sahay-ivory border border-sahay-border space-y-1">
              <label className="font-bold text-sahay-terracotta text-[10px] uppercase block">
                Critical SLA
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={targets.Critical}
                  onChange={(e) => setTargets({ ...targets, Critical: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white font-mono font-bold text-xs"
                />
                <span className="text-sahay-slate font-medium">hrs</span>
              </div>
              <span className="text-[10px] text-sahay-slate block">Default: 2 hrs</span>
            </div>

            <div className="p-3 rounded bg-sahay-ivory border border-sahay-border space-y-1">
              <label className="font-bold text-sahay-ochre text-[10px] uppercase block">
                High Severity SLA
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={targets.High}
                  onChange={(e) => setTargets({ ...targets, High: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white font-mono font-bold text-xs"
                />
                <span className="text-sahay-slate font-medium">hrs</span>
              </div>
              <span className="text-[10px] text-sahay-slate block">Default: 6 hrs</span>
            </div>

            <div className="p-3 rounded bg-sahay-ivory border border-sahay-border space-y-1">
              <label className="font-bold text-sahay-teal text-[10px] uppercase block">
                Medium Severity SLA
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={targets.Medium}
                  onChange={(e) => setTargets({ ...targets, Medium: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white font-mono font-bold text-xs"
                />
                <span className="text-sahay-slate font-medium">hrs</span>
              </div>
              <span className="text-[10px] text-sahay-slate block">Default: 18 hrs</span>
            </div>

            <div className="p-3 rounded bg-sahay-ivory border border-sahay-border space-y-1">
              <label className="font-bold text-sahay-slate text-[10px] uppercase block">
                Low Severity SLA
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={targets.Low}
                  onChange={(e) => setTargets({ ...targets, Low: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white font-mono font-bold text-xs"
                />
                <span className="text-sahay-slate font-medium">hrs</span>
              </div>
              <span className="text-[10px] text-sahay-slate block">Default: 36 hrs</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shadow-subtle transition-colors"
            >
              Update Response Targets
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Escalation Demo Simulator */}
      <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-sahay-teal" />
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Escalation Demonstration Simulator
          </h3>
        </div>
        <p className="text-xs text-sahay-slate">
          In demonstration mode, triggers deterministic time advances to evaluate SLA breach escalation alerts without having to wait hours in real-time.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => simulateAlertRefresh(2)}
            className="px-3 py-1.5 rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-xs font-semibold text-sahay-forest-deep"
          >
            Advance Clock by +2 Hours
          </button>
          <button
            type="button"
            onClick={() => simulateAlertRefresh(4)}
            className="px-3 py-1.5 rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-xs font-semibold text-sahay-forest-deep"
          >
            Advance Clock by +4 Hours
          </button>
          <button
            type="button"
            onClick={() => simulateAlertRefresh(8)}
            className="px-3 py-1.5 rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-xs font-semibold text-sahay-forest-deep"
          >
            Advance Clock by +8 Hours (Force SLA Breach)
          </button>
        </div>
      </div>

      {/* Section 3: Backend & Architecture Readiness */}
      <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-sahay-forest-action" />
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Backend Architecture & Node.js / MongoDB Adapter
          </h3>
        </div>
        <div className="p-3.5 rounded bg-sahay-ivory border border-sahay-border text-xs space-y-1.5 font-mono">
          <p>Target API URL: <strong>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}</strong></p>
          <p>Demo Mode Adapter: <strong className="text-sahay-green">Active (Client-side Reactive State)</strong></p>
          <p>MongoDB Entities Ready: Users, Camps, Reports, Requests, Inventory, Allocations, Alerts, Donations, Volunteers, Incidents</p>
        </div>
        <p className="text-[11px] text-sahay-slate">
          See included <code>MONGODB_SCHEMA.md</code> for schema specifications, indexes, and Express REST controllers.
        </p>
      </div>

      {/* Section 4: Demo State Reset */}
      <div className="p-5 rounded bg-white border border-rose-200 shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-sahay-terracotta" />
          <h3 className="text-sm font-bold text-sahay-terracotta uppercase tracking-wider">
            Reset Demonstration Dataset
          </h3>
        </div>
        <p className="text-xs text-sahay-slate">
          Clears local storage modifications and restores initial 8 camps, 20 inventory lines, 15 reports, 15 requests, and 10 shortage alerts.
        </p>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-3.5 py-1.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
        >
          Reset Demo Data to Initial State
        </button>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset All Demonstration Data?"
        message="This will restore all fictional camps, reports, shortage alerts, inventory records, and request states to their clean initial benchmark."
        confirmText="Confirm Reset"
        isDestructive={true}
      />
    </div>
  );
};
