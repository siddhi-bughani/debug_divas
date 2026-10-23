import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { incidentService } from '../../services/incidentService';
import toast from 'react-hot-toast';

export const IncidentModal = ({ isOpen, onClose }) => {
  const { camps, incidents, addActivity } = useAppData();
  const { currentUser } = useAuth();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: '',
      category: 'Medical Emergency',
      campId: 'CAMP-01',
      severity: 'Critical',
      peopleAffected: 5,
      assignedResponder: '',
      notes: '',
    },
  });

  const onSubmit = (data) => {
    const selectedCamp = camps.find((c) => c.id === data.campId);

    const newInc = incidentService.createIncident({
      ...data,
      campName: selectedCamp ? selectedCamp.name : 'General Locality',
      locationAddress: selectedCamp ? selectedCamp.address : 'Locality Precincts',
      district: selectedCamp ? selectedCamp.district : 'Ernakulam',
    });

    incidents.unshift(newInc);
    addActivity(currentUser.name, 'Logged Emergency Incident', `${newInc.id}: ${newInc.title} at ${newInc.campName}`, 'Emergency');
    toast.success(`Emergency Incident #${newInc.id} logged.`);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Critical Emergency or Medical Incident"
      subtitle="Immediate coordination dispatch record"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Incident Headline / Summary <span className="text-sahay-terracotta">*</span>
          </label>
          <input
            type="text"
            {...register('title', { required: true })}
            placeholder="e.g. Acute Respiratory Distress / Well Water Contamination"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            >
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Severe Shortage & Health Hazard">Severe Shortage & Health Hazard</option>
              <option value="Infrastructure Damage">Infrastructure Damage</option>
              <option value="Overcrowding & Shelter Risk">Overcrowding & Shelter Risk</option>
              <option value="Sanitation & Water Contamination">Sanitation & Water Contamination</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Severity
            </label>
            <select
              {...register('severity')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            >
              <option value="Critical">Critical (Immediate life hazard)</option>
              <option value="High">High (Urgent intervention needed)</option>
              <option value="Medium">Medium (Operational risk)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Affected Relief Camp
            </label>
            <select
              {...register('campId')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            >
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Individuals Directly Impacted
            </label>
            <input
              type="number"
              min={1}
              {...register('peopleAffected')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Designated Initial Responder / Team
          </label>
          <input
            type="text"
            {...register('assignedResponder')}
            placeholder="e.g. 108 Ambulance Unit #12 / Taluk Medical Officer"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
          />
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Clinical / Incident Details
          </label>
          <textarea
            rows={3}
            {...register('notes')}
            placeholder="Symptoms, patient status, physical hazard location, emergency interventions taken..."
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
          />
        </div>

        <div className="pt-3 border-t border-sahay-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded border border-sahay-border text-xs font-medium text-sahay-slate hover:bg-sahay-border-light"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-sahay-terracotta hover:bg-sahay-terracotta/90 text-white text-xs font-semibold shadow-subtle"
          >
            Log Emergency Incident
          </button>
        </div>
      </form>
    </Modal>
  );
};
