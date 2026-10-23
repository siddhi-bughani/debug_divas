import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  User,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  LogOut,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { SeverityBadge } from '../common/Badge';
import { formatRelativeTime } from '../../utils/formatters';

const ROUTE_TITLES = {
  '/': 'Relief Operations Command Center',
  '/camps': 'Relief Camps Directory',
  '/map': 'Interactive Relief Camp Map',
  '/alerts': 'Smart Shortage Alert System',
  '/reports': 'Public Needs Reports & Verification',
  '/requests': 'Resource Requests & Allocations',
  '/inventory': 'Inventory & Strategic Allocations',
  '/donations': 'Donations & Contribution Management',
  '/volunteers': 'Volunteers & Deployment Roster',
  '/incidents': 'Emergency & Medical Incident Command',
  '/analytics': 'Operational Analytics & Reports',
  '/settings': 'System Settings & SLA Thresholds',
  '/report-need': 'Public Need Reporting Portal',
  '/login': 'Demo Role Selection',
};

export const Header = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, switchRole } = useAuth();
  const { alerts, incidents, simulateAlertRefresh } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const notifRef = useRef(null);
  const roleRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unacknowledgedAlerts = alerts.filter(
    (a) => (a.severity === 'Critical' || a.severity === 'High') && a.status !== 'Resolved'
  );

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to camps or alerts with query param
    navigate(`/camps?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const currentTitle = ROUTE_TITLES[location.pathname] || 'SAHAY Relief Platform';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-sahay-border px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded md:hidden text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-border-light transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-sahay-slate">
            <span>SAHAY</span>
            <span>/</span>
            <span className="text-sahay-forest-deep font-medium capitalize">
              {location.pathname === '/' ? 'Command Center' : location.pathname.replace('/', '')}
            </span>
          </div>
          <h2 className="text-sm md:text-base font-bold text-sahay-forest-deep leading-tight truncate">
            {currentTitle}
          </h2>
        </div>
      </div>

      {/* Right: Search, Simulate Escalation button, Notifications, User/Role Switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global Search */}
        <form onSubmit={handleGlobalSearch} className="hidden lg:flex items-center relative">
          <Search className="w-4 h-4 text-sahay-slate absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search camp, district, item..."
            className="w-56 xl:w-64 pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action focus:border-sahay-forest-action text-sahay-charcoal placeholder:text-sahay-slate"
          />
        </form>

        {/* Simulate Alert Refresh / Escalation Trigger */}
        <button
          type="button"
          onClick={() => simulateAlertRefresh(4)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-sahay-forest-deep transition-colors"
          title="Simulate 4-hour time advance to test escalation SLA response targets"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sahay-slate" />
          <span>Simulate SLA Escalation</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-border-light transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sahay-terracotta ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded border border-sahay-border shadow-modal py-2 z-50">
              <div className="px-4 py-2 border-b border-sahay-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-sahay-forest-deep">Urgent Operational Alerts</h4>
                  <p className="text-[10px] text-sahay-slate">{unacknowledgedAlerts.length} unresolved high/critical alert(s)</p>
                </div>
                <Link
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-sahay-forest-action hover:underline font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-sahay-border-light">
                {unacknowledgedAlerts.length === 0 ? (
                  <p className="p-4 text-center text-xs text-sahay-slate">No urgent shortage alerts at this time.</p>
                ) : (
                  unacknowledgedAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/alerts');
                      }}
                      className="p-3 hover:bg-sahay-ivory cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-[10px] text-sahay-slate">{formatRelativeTime(alert.detectedAt)}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-sahay-charcoal line-clamp-1">{alert.campName}</p>
                      <p className="text-[11px] text-sahay-slate line-clamp-2 mt-0.5">{alert.explanation}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-sahay-border text-center bg-sahay-ivory/50">
                <Link
                  to="/incidents"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-sahay-slate hover:text-sahay-charcoal inline-flex items-center gap-1"
                >
                  <span>Check Emergency Medical Incidents</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Demo Role Switcher Menu */}
        <div className="relative" ref={roleRef}>
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1.5 rounded border border-sahay-border hover:bg-sahay-ivory transition-colors"
          >
            <div className="w-7 h-7 rounded bg-sahay-forest-light text-sahay-forest-action flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-semibold text-sahay-charcoal leading-none truncate max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-sahay-slate leading-none mt-1">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-sahay-slate hidden sm:block" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded border border-sahay-border shadow-modal py-2 z-50">
              <div className="px-3.5 py-2 border-b border-sahay-border">
                <p className="text-[10px] uppercase tracking-wider text-sahay-slate font-semibold">Demo Role Switcher</p>
                <p className="text-xs text-sahay-slate mt-0.5">Switch persona to test role-aware capabilities:</p>
              </div>

              <div className="p-1 space-y-0.5">
                {[
                  { key: 'admin', label: 'Central Administrator', desc: 'Full authority: approve, allocate, verify' },
                  { key: 'manager', label: 'Camp Manager', desc: 'Camp-level oversight & resource requests' },
                  { key: 'reporter', label: 'Reporter', desc: 'Submit and view field public reports' },
                ].map((roleOption) => (
                  <button
                    key={roleOption.key}
                    type="button"
                    onClick={() => {
                      switchRole(roleOption.key);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded text-xs transition-colors ${
                      currentUser.role === roleOption.label
                        ? 'bg-sahay-forest-light text-sahay-forest-deep font-semibold'
                        : 'text-sahay-charcoal hover:bg-sahay-ivory'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{roleOption.label}</span>
                      {currentUser.role === roleOption.label && (
                        <ShieldCheck className="w-3.5 h-3.5 text-sahay-forest-action" />
                      )}
                    </div>
                    <p className="text-[10px] text-sahay-slate font-normal mt-0.5">{roleOption.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-1 mt-1 border-t border-sahay-border-light px-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    navigate('/login');
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-ivory rounded flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Role Switch Page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
