import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { resourceService } from '../services/resourceService';
import { exportToCSV } from '../utils/csvExport';
import { formatRelativeTime } from '../utils/formatters';
import {
  Boxes,
  Warehouse,
  Tent,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryPage = () => {
  const { inventory, setInventory, warehouses, camps, addActivity } = useAppData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locationName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (locationTypeFilter !== 'ALL' && item.locationType !== locationTypeFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      return true;
    });
  }, [inventory, searchQuery, locationTypeFilter, categoryFilter]);

  const handleAdjustStock = (e) => {
    e.preventDefault();
    if (!adjustModalItem || adjustmentQty === 0) return;

    const updated = resourceService.adjustStock(
      inventory,
      adjustModalItem.id,
      Number(adjustmentQty),
      adjustmentReason || 'Manual Inventory Adjustment'
    );
    setInventory(updated);

    addActivity(
      currentUser.name,
      'Adjusted Inventory Level',
      `${adjustModalItem.itemName} at ${adjustModalItem.locationName} (${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} ${adjustModalItem.unit})`,
      'Inventory'
    );

    toast.success('Inventory balance adjusted successfully.');
    setAdjustModalItem(null);
    setAdjustmentQty(0);
    setAdjustmentReason('');
  };

  const handleExportCSV = () => {
    const csvData = filteredInventory.map((i) => ({
      'Inventory ID': i.id,
      'Location Type': i.locationType,
      'Location Name': i.locationName,
      Category: i.category,
      Item: i.itemName,
      'Available Qty': i.availableQuantity,
      'Reserved Qty': i.reservedQuantity,
      'Unreserved Net': i.availableQuantity - i.reservedQuantity,
      'Safety Stock': i.safetyStockThreshold,
      'Estimated Demand': i.estimatedDemand,
      Unit: i.unit,
      'Last Updated': i.lastUpdated,
    }));
    exportToCSV(csvData, `sahay-inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Inventory & Strategic Stock Ledger
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Real-time multi-echelon stock levels across central distribution hubs and frontline relief camps.
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
        </div>
      </div>

      {/* Warehouse Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => {
          const whItems = inventory.filter((i) => i.locationId === wh.id);
          const totalUnits = whItems.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);

          return (
            <div key={wh.id} className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-sahay-forest-light text-sahay-forest-deep">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-sahay-forest-deep">{wh.name}</h3>
                    <p className="text-[10px] text-sahay-slate font-mono">{wh.id} • {wh.district}</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-sahay-border-light text-sahay-forest-action">
                  {wh.capacityTons} Tons Cap
                </span>
              </div>

              <p className="text-xs text-sahay-slate">{wh.address}</p>

              <div className="pt-2 border-t border-sahay-border-light flex items-center justify-between text-xs">
                <span className="text-sahay-slate">Stocked Item Categories: <strong>{whItems.length}</strong></span>
                <span className="font-bold text-sahay-forest-deep">{totalUnits.toLocaleString()} total units</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-3.5 rounded border border-sahay-border shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-sahay-slate absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource, category, or facility name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-sahay-border bg-sahay-ivory/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sahay-forest-action"
            />
          </div>

          <select
            value={locationTypeFilter}
            onChange={(e) => setLocationTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Facilities (Warehouses & Camps)</option>
            <option value="Warehouse">Central Warehouses Only</option>
            <option value="Camp">Relief Camps Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-sahay-border bg-white text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Food Supplies">Food Supplies</option>
            <option value="Sanitary Pads">Sanitary Pads</option>
            <option value="Essential Medicines">Essential Medicines</option>
            <option value="Blankets">Blankets</option>
            <option value="Hygiene Kits">Hygiene Kits</option>
          </select>
        </div>

        <div className="text-xs text-sahay-slate font-medium">
          Showing <strong>{filteredInventory.length}</strong> inventory records
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sahay-ivory/60 border-b border-sahay-border text-[11px] font-bold text-sahay-forest-deep uppercase tracking-wider">
                <th className="py-3 px-4">Item & Category</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4">Physical Available</th>
                <th className="py-3 px-4">Reserved Stock</th>
                <th className="py-3 px-4">Net Unreserved (For Allocation)</th>
                <th className="py-3 px-4">Safety Buffer</th>
                <th className="py-3 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sahay-border">
              {filteredInventory.map((item) => {
                const unreserved = Math.max(0, item.availableQuantity - item.reservedQuantity);
                const isShort = unreserved < item.safetyStockThreshold;

                return (
                  <tr key={item.id} className="hover:bg-sahay-ivory/30 transition-colors">
                    {/* Item */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-sahay-forest-deep">{item.itemName}</p>
                      <span className="text-[10px] text-sahay-slate font-medium">{item.category}</span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.locationType === 'Warehouse' ? (
                          <Warehouse className="w-3.5 h-3.5 text-sahay-forest-action shrink-0" />
                        ) : (
                          <Tent className="w-3.5 h-3.5 text-sahay-teal shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-sahay-charcoal">{item.locationName}</p>
                          <span className="text-[10px] text-sahay-slate font-mono">{item.locationId}</span>
                        </div>
                      </div>
                    </td>

                    {/* Available */}
                    <td className="py-3 px-4 font-semibold text-sahay-charcoal">
                      {item.availableQuantity.toLocaleString()} {item.unit}
                    </td>

                    {/* Reserved */}
                    <td className="py-3 px-4 text-sahay-slate font-mono">
                      {item.reservedQuantity.toLocaleString()} {item.unit}
                    </td>

                    {/* Net Unreserved */}
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold font-mono ${
                          isShort ? 'text-sahay-terracotta' : 'text-sahay-forest-deep'
                        }`}
                      >
                        {unreserved.toLocaleString()} {item.unit}
                      </span>
                    </td>

                    {/* Safety Buffer */}
                    <td className="py-3 px-4 text-sahay-slate">
                      <span>{item.safetyStockThreshold.toLocaleString()} {item.unit}</span>
                      {isShort && (
                        <span className="ml-1.5 text-[10px] text-sahay-terracotta font-bold">
                          [Deficit]
                        </span>
                      )}
                    </td>

                    {/* Adjust Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustmentQty(0);
                        }}
                        className="px-2.5 py-1 rounded border border-sahay-border bg-white hover:bg-sahay-forest-light text-sahay-forest-action text-xs font-medium transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sahay-charcoal/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-sahay-border shadow-modal p-6 max-w-md w-full space-y-4">
            <div>
              <h3 className="text-base font-bold text-sahay-forest-deep">
                Adjust Inventory Level
              </h3>
              <p className="text-xs text-sahay-slate mt-0.5">
                {adjustModalItem.itemName} at {adjustModalItem.locationName}
              </p>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div className="p-3 rounded bg-sahay-ivory border border-sahay-border flex justify-between">
                <span>Current Available Stock:</span>
                <span className="font-bold">{adjustModalItem.availableQuantity} {adjustModalItem.unit}</span>
              </div>

              <div>
                <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                  Quantity Change (+ to Add, - to Deduct)
                </label>
                <input
                  type="number"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  placeholder="e.g. +200 or -50"
                  className="w-full px-3 py-2 rounded border border-sahay-border text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-sahay-charcoal uppercase text-[10px] block mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. New delivery received / Spoilage audit write-off"
                  className="w-full px-3 py-2 rounded border border-sahay-border text-xs"
                />
              </div>

              <div className="pt-3 border-t border-sahay-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-3 py-1.5 rounded border border-sahay-border text-xs text-sahay-slate hover:bg-sahay-border-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustmentQty === 0}
                  className="px-4 py-1.5 rounded bg-sahay-forest-action hover:bg-sahay-forest-hover text-white text-xs font-semibold shadow-subtle disabled:opacity-50"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
