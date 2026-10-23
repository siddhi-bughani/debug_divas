import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { donationService } from '../../services/donationService';
import { HeartHandshake, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const DonationModal = ({ isOpen, onClose }) => {
  const { camps, donations, setDonations, addActivity } = useAppData();
  const [donationType, setDonationType] = useState('In-Kind');

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      type: 'In-Kind',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      amountINR: 50000,
      itemsDescription: 'Packaged Drinking Water (20L Cans)',
      quantity: 500,
      unit: 'Litres',
      intendedCampId: '',
      notes: '',
    },
  });

  const onSubmit = (data) => {
    const selectedCamp = camps.find((c) => c.id === data.intendedCampId);

    const newDonation = donationService.createDonation({
      ...data,
      type: donationType,
      intendedCampName: selectedCamp ? selectedCamp.name : 'Central Logistics Reserve Pool',
    });

    setDonations([newDonation, ...donations]);
    addActivity(
      'Donation Desk',
      'Registered Contribution',
      `${newDonation.receiptNumber}: ${donationType === 'Monetary' ? '₹' + data.amountINR : data.itemsDescription} from ${data.donorName}`,
      'Donation'
    );
    toast.success(`Contribution ${newDonation.receiptNumber} recorded.`);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Humanitarian Contribution"
      subtitle="Monetary grants and in-kind humanitarian supplies"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Donation Type Selector */}
        <div className="flex rounded border border-sahay-border p-1 bg-sahay-ivory">
          <button
            type="button"
            onClick={() => setDonationType('In-Kind')}
            className={`flex-1 py-1.5 rounded font-semibold transition-colors ${
              donationType === 'In-Kind'
                ? 'bg-white shadow-subtle text-sahay-forest-deep'
                : 'text-sahay-slate hover:text-sahay-charcoal'
            }`}
          >
            In-Kind Supplies (Water, Food, Medicines)
          </button>
          <button
            type="button"
            onClick={() => setDonationType('Monetary')}
            className={`flex-1 py-1.5 rounded font-semibold transition-colors ${
              donationType === 'Monetary'
                ? 'bg-white shadow-subtle text-sahay-forest-deep'
                : 'text-sahay-slate hover:text-sahay-charcoal'
            }`}
          >
            Monetary Aid (INR Direct Grant)
          </button>
        </div>

        {/* Donor Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Donor / Organization Name <span className="text-sahay-terracotta">*</span>
            </label>
            <input
              type="text"
              {...register('donorName', { required: true })}
              placeholder="e.g. Tata Trusts / Rotary Club"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Donor Phone / Email
            </label>
            <input
              type="text"
              {...register('donorPhone')}
              placeholder="+91 98470 00000"
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
            />
          </div>
        </div>

        {donationType === 'Monetary' ? (
          <div>
            <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
              Contribution Amount (INR ₹) <span className="text-sahay-terracotta">*</span>
            </label>
            <input
              type="number"
              min={100}
              {...register('amountINR', { required: true })}
              className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs font-semibold"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                Items Description <span className="text-sahay-terracotta">*</span>
              </label>
              <input
                type="text"
                {...register('itemsDescription', { required: true })}
                placeholder="e.g. 500 Heavy Blankets / 1000 Packaged Food Kits"
                className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  {...register('quantity')}
                  className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  {...register('unit')}
                  placeholder="Units, Litres, Kits, Packs"
                  className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Intended Camp */}
        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Intended Allocation Destination
          </label>
          <select
            {...register('intendedCampId')}
            className="w-full px-3 py-2 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="">Central Unrestricted Pool (Recommended)</option>
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} ({camp.district})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
            Receipt / Verification Notes
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            placeholder="Bank transfer reference, consignment receipt number, packing details..."
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
            className="px-4 py-2 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shadow-subtle flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Record Donation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
