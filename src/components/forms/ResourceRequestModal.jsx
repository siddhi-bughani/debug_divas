import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import toast from 'react-hot-toast';

export const ResourceRequestModal = ({ isOpen, onClose, preselectedCampId }) => {
  const { camps, requests, inventory, addActivity } = useAppData();
  const { currentUser } = useAuth();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      campId: preselectedCampId || 'CAMP-01',
      resourceCategory: 'Drinking Water',
      resourceItem: 'Packaged Drinking Water (20L Cans)',
      requestedQuantity: 200,
      unit: 'Litres',
      affectedPopulation: 150,
      severity: 'High',
      isMedicalEmergency: false,
      notes: '',
    },
  });

  const onSubmit = (data) => {
    const targetCamp = camps.find((c) => c.id === data.campId);
    
    // Check available inventory in camp
    const campInv = inventory.find(
      (inv) => inv.locationId === data.campId && inv.category === data.resourceCategory
    );
    const availableQty = campInv ? campInv.availableQuantity : 0;

    const newReq = requestService.createRequest({
      ...data,
      campName: targetCamp ? targetCamp.name : 'Relief Camp',
      availableQuantityAtRequest: availableQty,
      requestedQuantity: Number(data.requestedQuantity),
      affectedPopulation: Number(data.affectedPopulation),
    });

    requests.unshift(newReq);
    addActivity(currentUser.name, 'Created Resource Request', `${newReq.id} (${newReq.requestedQuantity} ${newReq.unit} for ${newReq.campName})`, 'Request');
    toast.success(`Resource Request #${newReq.id} submitted.`);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Priority Resource Request"
      subtitle="Formal request requisition for logistics supply chain"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Requesting Relief Camp <span className="text-sahay-terracotta">*</span>
          </label>
          <select
            {...register('campId', { required: true })}
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
          >
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} ({camp.district})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Resource Category
            </label>
            <select
              {...register('resourceCategory')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            >
              <option value="Drinking Water">Drinking Water</option>
              <option value="Food Supplies">Food Supplies</option>
              <option value="Sanitary Pads">Sanitary Pads</option>
              <option value="Essential Medicines">Essential Medicines</option>
              <option value="Blankets">Blankets</option>
              <option value="Hygiene Kits">Hygiene Kits</option>
              <option value="Baby Supplies">Baby Supplies</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Specific Item Name
            </label>
            <input
              type="text"
              {...register('resourceItem', { required: true })}
              placeholder="e.g. 20L Water Cans / Pediatric ORS"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Requested Quantity
            </label>
            <input
              type="number"
              min={1}
              {...register('requestedQuantity', { required: true })}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Unit
            </label>
            <input
              type="text"
              {...register('unit', { required: true })}
              placeholder="Litres, Kits, Packs"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Affected Population
            </label>
            <input
              type="number"
              min={1}
              {...register('affectedPopulation')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Urgency Severity
            </label>
            <select
              {...register('severity')}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            >
              <option value="Critical">Critical (Immediate life support)</option>
              <option value="High">High (Impending stockout)</option>
              <option value="Medium">Medium (Buffer refill)</option>
              <option value="Low">Low (Routine replenish)</option>
            </select>
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-sahay-charcoal">
              <input
                type="checkbox"
                {...register('isMedicalEmergency')}
                className="rounded text-sahay-terracotta focus:ring-sahay-terracotta"
              />
              <span>Critical Medical Emergency Flag</span>
            </label>
          </div>
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Requisition Justification Notes
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            placeholder="Reason for urgency, rate of stock depletion, vulnerable resident details..."
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
            className="px-4 py-2 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shadow-subtle"
          >
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
};
