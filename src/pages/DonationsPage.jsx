import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { StatusBadge } from '../components/common/Badge';
import { DonationModal } from '../components/forms/DonationModal';
import { exportToCSV } from '../utils/csvExport';
import { formatCurrencyINR, formatDate } from '../utils/formatters';
import {
  HeartHandshake,
  Search,
  Filter,
  Plus,
  Download,
  IndianRupee,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DonationsPage = () => {
  const { donations, setDonations, addActivity } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Totals
  const totalMonetaryINR = donations
    .filter((d) => d.type === 'Monetary' && d.status !== 'Pledged')
    .reduce((sum, d) => sum + (d.amountINR || 0), 0);

  const totalInKindCount = donations.filter((d) => d.type === 'In-Kind').length;

  const filteredDonations = useMemo(() => {
    return donations.filter((don) => {
      const matchesSearch =
        don.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        don.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (don.itemsDescription || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        don.intendedCampName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (typeFilter !== 'ALL' && don.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && don.status !== statusFilter) return false;

      return true;
    });
  }, [donations, searchQuery, typeFilter, statusFilter]);

  const advanceDonationStatus = (donationId) => {
    const transitions = {
      Pledged: 'Received',
      Received: 'Verified',
      Verified: 'Allocated',
      Allocated: 'Distributed',
    };

    setDonations((prev) =>
      prev.map((d) => {
        if (d.id === donationId) {
          const next = transitions[d.status];
          if (!next) return d;
          return {
            ...d,
            status: next,
            allocationStatus: next === 'Distributed' ? 'Distributed' : (next === 'Allocated' ? 'Allocated' : d.allocationStatus),
          };
        }
        return d;
      })
    );

    const target = donations.find((d) => d.id === donationId);
    addActivity('Donations Desk', 'Advanced Contribution Status', `${target?.receiptNumber} (${target?.donorName})`, 'Donation');
    toast.success(`Donation ${target?.receiptNumber} status updated.`);
  };

  const handleExportCSV = () => {
    const csvData = filteredDonations.map((d) => ({
      'Receipt Number': d.receiptNumber,
      Type: d.type,
      'Donor Name': d.donorName,
      'Amount INR': d.type === 'Monetary' ? d.amountINR : 'N/A',
      'Items / Description': d.itemsDescription,
      Quantity: d.quantity || 'N/A',
      Unit: d.unit || 'N/A',
      'Intended Destination': d.intendedCampName,
      Status: d.status,
      'Allocation Status': d.allocationStatus,
      'Received Date': d.receivedDate,
    }));
    exportToCSV(csvData, `sahay-donations-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Donations & Contributions Management
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Transparent registry of public and corporate humanitarian grants, in-kind aid, and destination tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded border border-sahay-border bg-white hover:bg-sahay-ivory text-xs font-medium text-sahay-slate hover:text-sahay-charcoal transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Register Donation</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Verified Monetary Grants</span>
          <p className="text-2xl font-bold font-mono text-sahay-forest-deep">
            {formatCurrencyINR(totalMonetaryINR)}
          </p>
          <p className="text-xs text-sahay-slate">Strictly tracked in designated disaster accounts</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">In-Kind Consignments</span>
          <p className="text-2xl font-bold font-mono text-sahay-teal">
            {totalInKindCount} <span className="text-xs font-normal text-sahay-slate">Shipments</span>
          </p>
          <p className="text-xs text-sahay-slate">Water cans, blankets, food rations & hygiene</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Total Contribution Records</span>
          <p className="text-2xl font-bold font-mono text-sahay-charcoal">
            {donations.length}
          </p>
          <p className="text-xs text-sahay-slate">Audited receipt reference codes generated</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt #, donor, item, or destination..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Donation Types</option>
            <option value="In-Kind">In-Kind Physical Goods</option>
            <option value="Monetary">Monetary Grants</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pledged">Pledged</option>
            <option value="Received">Received</option>
            <option value="Verified">Verified</option>
            <option value="Allocated">Allocated</option>
            <option value="Distributed">Distributed</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredDonations.length}</strong> records
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Receipt Reference & Donor</th>
                <th className="py-3 px-4">Donation Type & Value</th>
                <th className="py-3 px-4">Intended Allocation Target</th>
                <th className="py-3 px-4">Current Workflow Status</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-right">Progress Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredDonations.map((don) => (
                <tr key={don.id} className="hover:bg-sahay-ivory/30 transition-colors">
                  {/* Receipt & Donor */}
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sahay-border-light text-sahay-forest-deep font-bold">
                      {don.receiptNumber}
                    </span>
                    <p className="font-bold text-sahay-charcoal mt-1">{don.donorName}</p>
                    <p className="text-[10px] text-sahay-slate">{don.donorEmail || don.donorPhone}</p>
                  </td>

                  {/* Value */}
                  <td className="py-3 px-4">
                    {don.type === 'Monetary' ? (
                      <div>
                        <span className="font-bold text-sahay-forest-deep font-mono text-sm">
                          {formatCurrencyINR(don.amountINR)}
                        </span>
                        <p className="text-[10px] text-sahay-slate">{don.itemsDescription}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-sahay-charcoal">{don.itemsDescription}</p>
                        <span className="text-[11px] text-sahay-teal font-semibold">
                          {don.quantity} {don.unit}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Target */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sahay-forest-deep">{don.intendedCampName}</p>
                    {don.allocatedTo && (
                      <p className="text-[10px] text-sahay-slate mt-0.5 line-clamp-1">
                        Allocated: {don.allocatedTo}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={don.status} />
                    <span className="text-[10px] text-sahay-slate block mt-0.5">
                      {don.allocationStatus}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-sahay-slate">
                    {formatDate(don.receivedDate)}
                  </td>

                  {/* Progress Action */}
                  <td className="py-3 px-4 text-right">
                    {don.status !== 'Distributed' ? (
                      <button
                        type="button"
                        onClick={() => advanceDonationStatus(don.id)}
                        className="px-2.5 py-1 rounded bg-sahay-forest-light text-sahay-forest-action hover:bg-sahay-forest-action hover:text-white transition-colors text-xs font-medium"
                      >
                        Advance &rarr;
                      </button>
                    ) : (
                      <span className="text-emerald-700 text-xs font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
