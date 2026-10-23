import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Tent,
  Map,
  AlertTriangle,
  FileText,
  PackageSearch,
  Boxes,
  HeartHandshake,
  Users,
  ShieldAlert,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { alerts, reports, requests, incidents } = useAppData();
  const { currentUser, isReporter, isCampManager } = useAuth();

  const activeAlertsCount = alerts.filter((a) => a.status !== 'Resolved' && (a.severity === 'Critical' || a.severity === 'High')).length;
  const pendingReportsCount = reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length;
  const activeIncidentsCount = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length;

  const NAV_ITEMS = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Relief Camps', to: '/camps', icon: Tent },
    { label: 'Camp Map', to: '/map', icon: Map },
    {
      label: 'Shortage Alerts',
      to: '/alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-sahay-terracotta text-white',
    },
    {
      label: 'Public Reports',
      to: '/reports',
      icon: FileText,
      badge: pendingReportsCount > 0 ? pendingReportsCount : null,
      badgeColor: 'bg-sahay-ochre text-white',
    },
    {
      label: 'Resource Requests',
      to: '/requests',
      icon: PackageSearch,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: 'bg-sahay-forest-action text-white',
    },
    { label: 'Inventory & Allocation', to: '/inventory', icon: Boxes },
    { label: 'Donations', to: '/donations', icon: HeartHandshake },
    { label: 'Volunteers', to: '/volunteers', icon: Users },
    {
      label: 'Emergency & Medical',
      to: '/incidents',
      icon: ShieldAlert,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-sahay-terracotta text-white',
    },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-sahay-charcoal/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-40 flex flex-col bg-white border-r border-sahay-border transition-all duration-200 select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sahay-border bg-sahay-ivory/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-sahay-forest-deep flex items-center justify-center text-white font-bold text-sm tracking-wider">
                S
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-sahay-forest-deep leading-none">
                  SAHAY
                </h1>
                <p className="text-[10px] text-sahay-slate font-medium uppercase tracking-wider mt-0.5">
                  Relief Ops Console
                </p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded bg-sahay-forest-deep flex items-center justify-center text-white font-bold text-sm mx-auto">
              S
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 rounded hover:bg-sahay-border/60 text-sahay-slate hover:text-sahay-charcoal transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Pill */}
        {!isCollapsed && (
          <div className="px-3.5 py-2.5 border-b border-sahay-border-light bg-sahay-forest-light/40 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="text-[10px] font-semibold uppercase text-sahay-slate">Current Role</p>
              <p className="text-xs font-medium text-sahay-forest-deep truncate">{currentUser.role}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white border border-sahay-border text-sahay-forest-action">
              {currentUser.badge?.split(' ')[0] || 'HQ'}
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors relative group ${
                    isActive
                      ? 'bg-sahay-forest-light text-sahay-forest-deep font-semibold'
                      : 'text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-ivory'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 text-current" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-auto shrink-0 ${
                      item.badgeColor
                    } ${isCollapsed ? 'absolute top-1 right-1 px-1 text-[9px]' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Public Citizen Report Shortcut Link */}
        <div className="p-3 border-t border-sahay-border bg-sahay-ivory/40">
          <NavLink
            to="/report-need"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded border border-sahay-border bg-white text-xs font-medium text-sahay-forest-action hover:bg-sahay-forest-light transition-colors ${
              isCollapsed ? 'justify-center px-1' : ''
            }`}
            title="Public Citizen Report Portal"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span className="truncate">Citizen Report Form</span>}
          </NavLink>
        </div>
      </aside>
    </>
  );
};
