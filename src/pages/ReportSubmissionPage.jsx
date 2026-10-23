import React from 'react';
import { Link } from 'react-router-dom';
import { PublicReportForm } from '../components/forms/PublicReportForm';
import { ArrowLeft, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export const ReportSubmissionPage = () => {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sahay-forest-action hover:text-sahay-forest-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Dashboard</span>
        </Link>
        <span className="text-xs text-sahay-slate">Citizen Humanitarian Intake Portal</span>
      </div>

      {/* Emergency Hotline Notice */}
      <div className="p-3.5 rounded bg-sahay-terracotta-light/60 border border-sahay-terracotta/30 flex items-center justify-between text-xs text-sahay-charcoal">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-sahay-terracotta shrink-0" />
          <span>
            <strong>Immediate Life Threat?</strong> Call State Disaster Emergency Control Room: <strong>1077 / 112</strong>
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono text-sahay-terracotta font-bold">24/7 Helpline</span>
      </div>

      {/* Form */}
      <PublicReportForm isStandalone={true} />

      {/* Trust & Privacy Notice */}
      <div className="p-4 rounded bg-white border border-sahay-border text-center text-xs text-sahay-slate space-y-1">
        <p className="font-semibold text-sahay-forest-deep flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sahay-forest-action" />
          <span>SAHAY Disaster Coordination Network</span>
        </p>
        <p className="text-[11px] max-w-lg mx-auto">
          All reports are triaged by authorized district disaster management authorities. Your phone number is strictly restricted to verified dispatch officers and never published publicly.
        </p>
      </div>
    </div>
  );
};
