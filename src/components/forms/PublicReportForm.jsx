import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Copy,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import toast from 'react-hot-toast';

const REPORT_CATEGORIES = [
  'Drinking Water',
  'Food',
  'Sanitary Pads',
  'Medicines',
  'Medical Assistance',
  'Blankets',
  'Hygiene Supplies',
  'Shelter',
  'Other',
];

export const PublicReportForm = ({ onSubmitted, isStandalone = false }) => {
  const { camps, submitPublicReport } = useAppData();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      category: 'Sanitary Pads', // default to demonstrate required flow
      campId: 'CAMP-01',
      urgency: 'High',
      peopleAffected: 80,
      estimatedQuantity: 100,
      unit: 'Packs',
      description: '',
      manualLocationAddress: '',
      reporterName: '',
      reporterContact: '',
      protectContact: true,
    },
  });

  const selectedCategory = watch('category');

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      const selectedCamp = camps.find((c) => c.id === data.campId);

      const reportPayload = {
        ...data,
        campName: selectedCamp ? selectedCamp.name : 'Unassigned / Local Area',
        district: selectedCamp ? selectedCamp.district : 'Ernakulam',
        photoUrl: photoPreview,
        hasPhoto: Boolean(photoPreview),
      };

      const result = submitPublicReport(reportPayload);
      setSubmittedReport(result);
      setIsSuccess(true);
      reset();
      setPhotoPreview(null);
      if (onSubmitted) onSubmitted(result);
    } catch (err) {
      toast.error('Failed to submit report. Please check input fields.');
    }
  };

  const copyRefToClipboard = () => {
    if (submittedReport?.referenceNumber) {
      navigator.clipboard.writeText(submittedReport.referenceNumber);
      toast.success('Tracking reference number copied.');
    }
  };

  if (isSuccess && submittedReport) {
    return (
      <div className="bg-white rounded border border-sahay-border shadow-card p-6 md:p-8 text-center max-w-xl mx-auto my-4 space-y-4">
        <div className="w-14 h-14 rounded-full bg-sahay-green-light text-sahay-green mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-sahay-forest-deep">
          Public Need Report Lodged
        </h3>

        <p className="text-xs text-sahay-slate max-w-md mx-auto">
          Your report has been securely registered in the central relief queue. Authorities and camp coordinators have been alerted.
        </p>

        {/* Tracking Reference Number Card */}
        <div className="p-4 rounded border border-sahay-border bg-sahay-ivory flex items-center justify-between max-w-md mx-auto">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-sahay-slate block">Tracking Reference Code</span>
            <span className="text-base font-bold font-mono text-sahay-forest-deep">{submittedReport.referenceNumber}</span>
          </div>
          <button
            type="button"
            onClick={copyRefToClipboard}
            className="p-2 rounded hover:bg-sahay-border-light text-sahay-slate hover:text-sahay-charcoal transition-colors"
            title="Copy reference code"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {submittedReport.isPotentialDuplicate && (
          <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left max-w-md mx-auto flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              A similar report exists for this camp. Your report has been consolidated with high priority to strengthen verified demand.
            </span>
          </div>
        )}

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="px-4 py-2 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded border border-sahay-border shadow-subtle p-5 md:p-6 space-y-5">
      <div className="border-b border-sahay-border pb-3">
        <h3 className="text-base font-bold text-sahay-forest-deep">
          Humanitarian Need & Relief Request Intake
        </h3>
        <p className="text-xs text-sahay-slate mt-0.5">
          Report essential resource shortages for relief camps, isolated shelters, or community settlements.
        </p>
      </div>

      {/* Category & Urgency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Category of Need <span className="text-sahay-terracotta">*</span>
          </label>
          <select
            {...register('category', { required: 'Please select a category' })}
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          >
            {REPORT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Reported Urgency Level <span className="text-sahay-terracotta">*</span>
          </label>
          <select
            {...register('urgency', { required: true })}
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          >
            <option value="Critical">Critical (Immediate danger / life support failure)</option>
            <option value="High">High (Severe shortage, required within hours)</option>
            <option value="Medium">Medium (Emerging deficit, needed today)</option>
            <option value="Low">Low (General monitoring / buffer refill)</option>
          </select>
        </div>
      </div>

      {/* Camp & Locality Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Designated Relief Camp (If known)
          </label>
          <select
            {...register('campId')}
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          >
            <option value="">Non-Camp Locality / General Community</option>
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} ({camp.district})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Specific Street Address / Location Landmark <span className="text-sahay-terracotta">*</span>
          </label>
          <input
            type="text"
            {...register('manualLocationAddress', { required: 'Please specify the exact location or block' })}
            placeholder="e.g. Block B, Upper Hall, Govt HSS Aluva"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          />
          {errors.manualLocationAddress && (
            <span className="text-[10px] text-sahay-terracotta mt-0.5 block">{errors.manualLocationAddress.message}</span>
          )}
        </div>
      </div>

      {/* Quantity & People Affected */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Estimated Quantity Required
          </label>
          <input
            type="number"
            min={1}
            {...register('estimatedQuantity')}
            placeholder="e.g. 100"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          />
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Unit of Measurement
          </label>
          <input
            type="text"
            {...register('unit')}
            placeholder="e.g. Packs, Litres, Kits, Units"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          />
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            People Affected (Approx)
          </label>
          <input
            type="number"
            min={1}
            {...register('peopleAffected')}
            placeholder="e.g. 80"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
          />
        </div>
      </div>

      {/* Description */}
      <div className="text-xs">
        <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
          Detailed Description of Situation <span className="text-sahay-terracotta">*</span>
        </label>
        <textarea
          rows={3}
          {...register('description', { required: 'Please provide a clear description of the need' })}
          placeholder="Describe who needs assistance, current supply status, and any special vulnerabilities (infants, elderly, pregnant women)..."
          className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-sahay-charcoal text-xs focus:ring-1 focus:ring-sahay-forest-action"
        />
        {errors.description && (
          <span className="text-[10px] text-sahay-terracotta mt-0.5 block">{errors.description.message}</span>
        )}
      </div>

      {/* Supporting Photo Upload */}
      <div className="text-xs">
        <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
          Supporting Photo (Optional Verification Evidence)
        </label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-3 py-2 rounded border border-sahay-border bg-sahay-ivory hover:bg-sahay-border-light text-sahay-charcoal text-xs font-medium flex items-center gap-2 transition-colors">
            <Camera className="w-4 h-4 text-sahay-slate" />
            <span>Select Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          {photoPreview && (
            <div className="flex items-center gap-2">
              <img src={photoPreview} alt="Preview" className="w-10 h-10 object-cover rounded border border-sahay-border" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="text-[11px] text-sahay-terracotta hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reporter Contact Info (Optional Privacy Shield) */}
      <div className="p-3.5 rounded bg-sahay-ivory border border-sahay-border space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sahay-forest-deep text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sahay-forest-action" />
            <span>Reporter Contact (Optional & Privacy-Protected)</span>
          </span>
          <span className="text-[10px] text-sahay-slate">Redacted from public views</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-sahay-slate block mb-0.5">Your Name</label>
            <input
              type="text"
              {...register('reporterName')}
              placeholder="e.g. Resident / Volunteer Name"
              className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-sahay-slate block mb-0.5">Phone Number (For Verification SMS)</label>
            <input
              type="tel"
              {...register('reporterContact')}
              placeholder="+91 94470 00000"
              className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-sahay-slate">
          <input
            type="checkbox"
            {...register('protectContact')}
            className="rounded text-sahay-forest-action focus:ring-sahay-forest-action"
          />
          <span>Protect my contact details; share only with verified dispatch officers.</span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-subtle disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Registering...' : 'Submit Needs Report'}</span>
        </button>
      </div>
    </form>
  );
};
