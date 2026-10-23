import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Users, ArrowRight, Info, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const { currentUser, switchRole } = useAuth();
  const navigate = useNavigate();

  const ROLES = [
    {
      key: 'admin',
      role: 'Central Administrator',
      persona: 'District Collectorate Control Officer',
      email: 'admin.disaster@kerala.gov.in',
      scope: 'State & District HQ Oversight',
      description:
        'Full administrative authority. Review and verify public reports, authorize strategic warehouse allocations, override escalations, and manage master camp registrations.',
      badge: 'State HQ',
    },
    {
      key: 'manager',
      role: 'Camp Manager',
      persona: 'Dr. Anita Thomas',
      email: 'anita.thomas@sahay.org',
      scope: 'Riverside Community Relief Center (CAMP-01)',
      description:
        'Camp-level operational authority. Requisition supplies, record local stock arrivals, log medical emergencies, and coordinate on-site volunteer duties.',
      badge: 'CAMP-01 Manager',
    },
    {
      key: 'reporter',
      role: 'Reporter',
      persona: 'Field Ground Reporter',
      email: 'ground.reporter@volunteer.org',
      scope: 'Grassroots & Citizen Needs Intake',
      description:
        'Community reporter profile. Report urgent shortages, upload photographic evidence from isolated wards, and track public report reference codes.',
      badge: 'Field Volunteer',
    },
  ];

  const handleSelectRole = (key) => {
    switchRole(key);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-sahay-ivory flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2">
        <div className="w-12 h-12 rounded bg-sahay-forest-deep text-white font-bold text-xl flex items-center justify-center mx-auto shadow-subtle">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-sahay-forest-deep">
          SAHAY — Role Selection & Access Console
        </h1>
        <p className="text-xs text-sahay-slate max-w-md mx-auto">
          Centralized humanitarian relief platform for disaster-management authorities, camp managers, and ground teams.
        </p>
      </div>

      {/* Demo Notice Banner */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="p-3.5 rounded bg-sahay-forest-light/60 border border-sahay-border text-xs text-sahay-charcoal flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sahay-forest-action shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sahay-forest-deep">Demo Persona Switcher</p>
            <p className="text-[11px] text-sahay-slate mt-0.5">
              Select any role below to experience SAHAY from that stakeholder's viewpoint. Production authentication with JWTs, bcrypt password hashing, and role RBAC will be enforced by the Node.js / Express backend.
            </p>
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl space-y-3">
        {ROLES.map((r) => {
          const isSelected = currentUser.role === r.role;

          return (
            <div
              key={r.key}
              onClick={() => handleSelectRole(r.key)}
              className={`p-5 rounded border bg-white shadow-subtle hover:shadow-card cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'border-2 border-sahay-forest-action bg-sahay-forest-light/20'
                  : 'border-sahay-border hover:border-sahay-forest-action/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-sahay-forest-deep">{r.role}</h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sahay-border-light text-sahay-forest-action font-semibold">
                      {r.badge}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-sahay-green font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-sahay-charcoal">{r.persona} • <span className="font-normal text-sahay-slate">{r.email}</span></p>
                  <p className="text-xs text-sahay-slate leading-relaxed pt-1">{r.description}</p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors shadow-subtle"
                >
                  <span>Enter Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-sahay-slate">
        <Link to="/report-need" className="text-sahay-forest-action hover:underline font-semibold">
          Open Citizen Public Need Intake Portal &rarr;
        </Link>
      </div>
    </div>
  );
};
