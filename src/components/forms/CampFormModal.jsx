import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { MapPin, Building, Users, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export const CampFormModal = ({ isOpen, onClose, campToEdit }) => {
  const { addCamp, updateCamp } = useAppData();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: campToEdit || {
      name: '',
      address: '',
      district: 'Ernakulam',
      latitude: '10.1118',
      longitude: '76.3534',
      manager: '',
      contactPhone: '',
      capacity: 350,
      currentOccupancy: 200,
      primaryVulnerability: 'Riverfront low-lying relief wing',
    },
  });

  const onSubmit = (data) => {
    try {
      if (campToEdit) {
        updateCamp(campToEdit.id, data);
      } else {
        addCamp(data);
      }
      reset();
      onClose();
    } catch (e) {
      toast.error('Failed to save camp record.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campToEdit ? `Edit Camp: ${campToEdit.name}` : 'Register New Relief Camp'}
      subtitle="Manual coordinate and facility registration"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Camp Facility Name <span className="text-sahay-terracotta">*</span>
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            placeholder="e.g. Govt. Model Higher Secondary School Shelter"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs focus:ring-1 focus:ring-sahay-forest-action"
          />
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Physical Address & Location <span className="text-sahay-terracotta">*</span>
          </label>
          <input
            type="text"
            {...register('address', { required: 'Address is required' })}
            placeholder="Street, Landmark, Panchayat / Ward"
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs focus:ring-1 focus:ring-sahay-forest-action"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              District <span className="text-sahay-terracotta">*</span>
            </label>
            <input
              type="text"
              {...register('district', { required: true })}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Primary Vulnerability Focus
            </label>
            <input
              type="text"
              {...register('primaryVulnerability')}
              placeholder="e.g. Elderly & Infants / Low-lying"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        {/* Manual Coordinates Registration */}
        <div className="p-3 rounded bg-sahay-ivory border border-sahay-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sahay-forest-deep text-[10px] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sahay-forest-action" />
              <span>Manual Map Coordinates (No Live GPS Tracking)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-sahay-slate block mb-0.5">Latitude (°N)</label>
              <input
                type="text"
                {...register('latitude', { required: true })}
                placeholder="10.1118"
                className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-sahay-slate block mb-0.5">Longitude (°E)</label>
              <input
                type="text"
                {...register('longitude', { required: true })}
                placeholder="76.3534"
                className="w-full px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Capacity & Manager */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Designated Capacity (Persons)
            </label>
            <input
              type="number"
              {...register('capacity', { required: true, min: 10 })}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Current Occupancy
            </label>
            <input
              type="number"
              {...register('currentOccupancy', { min: 0 })}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Camp Manager Name
            </label>
            <input
              type="text"
              {...register('manager')}
              placeholder="e.g. Dr. Anita Thomas"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Manager Phone Contact
            </label>
            <input
              type="tel"
              {...register('contactPhone')}
              placeholder="+91 94470 00000"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
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
            className="px-4 py-2 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shadow-subtle"
          >
            {campToEdit ? 'Save Changes' : 'Register Camp'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
