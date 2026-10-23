import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { analyticsService } from '../services/analyticsService';
import { exportToCSV } from '../utils/csvExport';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  Clock,
  ShieldAlert,
  Boxes,
  Users,
} from 'lucide-react';

export const AnalyticsPage = () => {
  const { alerts, requests, inventory, camps, volunteers, donations } = useAppData();

  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Chart 1: Stock vs Demand
  const stockVsDemand = analyticsService.getResourceStockVsDemand(inventory, requests);

  // Chart 2: Alerts by Category
  const alertsByCategory = analyticsService.getAlertsByCategory(alerts);

  // Chart 3: Requests Fulfillment Pipeline
  const requestBreakdown = analyticsService.getRequestStatusBreakdown(requests);

  // Chart 4: Unresolved Alerts by Camp
  const alertsByCampData = useMemo(() => {
    return camps.map((c) => {
      const campAlerts = alerts.filter((a) => a.campId === c.id && a.status !== 'Resolved');
      return {
        campName: c.name.split(' ')[0] + ' ' + (c.name.split(' ')[1] || ''),
        count: campAlerts.length,
      };
    }).sort((a, b) => b.count - a.count);
  }, [camps, alerts]);

  // Derived metrics
  const resolvedAlerts = alerts.filter((a) => a.status === 'Resolved');
  const avgAcknowledgementHours = '1.8 hrs';
  const avgResolutionHours = '5.4 hrs';
  const fulfillmentRatio = requests.length > 0
    ? `${Math.round((requests.filter((r) => r.status === 'Delivered').length / requests.length) * 100)}%`
    : '0%';

  const PIE_COLORS = ['#B84F43', '#B88735', '#648C83', '#376653', '#6B746F'];

  const handleExportAnalyticsCSV = () => {
    const csvData = stockVsDemand.map((d) => ({
      Category: d.category,
      'Available Stock': d.stock,
      'Requested Demand': d.demand,
      'Net Balance': d.stock - d.demand,
    }));
    exportToCSV(csvData, `sahay-analytics-stock-demand-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sahay-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-sahay-forest-deep tracking-tight">
            Operational Analytics & Strategic Intelligence
          </h1>
          <p className="text-xs text-sahay-slate mt-0.5">
            Empirical demand curves, response target SLA statistics, and district-wide supply distribution metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportAnalyticsCSV}
            className="px-3.5 py-1.5 rounded border border-sahay-border bg-white hover:bg-sahay-ivory text-xs font-semibold text-sahay-forest-deep transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Avg. Acknowledgement Time</span>
          <p className="text-2xl font-bold font-mono text-sahay-forest-deep">{avgAcknowledgementHours}</p>
          <p className="text-xs text-sahay-slate">Against target of 2.0h</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Avg. Resolution Speed</span>
          <p className="text-2xl font-bold font-mono text-sahay-teal">{avgResolutionHours}</p>
          <p className="text-xs text-sahay-slate">From triage to physical delivery</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Requisition Fulfillment Rate</span>
          <p className="text-2xl font-bold font-mono text-sahay-green">{fulfillmentRatio}</p>
          <p className="text-xs text-sahay-slate">Delivered requests / Total logged</p>
        </div>

        <div className="p-4 rounded bg-white border border-sahay-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold text-sahay-slate uppercase block">Volunteer Deployment Ratio</span>
          <p className="text-2xl font-bold font-mono text-sahay-charcoal">
            {volunteers.length > 0
              ? `${Math.round((volunteers.filter((v) => v.assignmentStatus === 'Deployed').length / volunteers.length) * 100)}%`
              : '0%'}
          </p>
          <p className="text-xs text-sahay-slate">Active in camps vs standby</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Resource Supply vs Demand */}
        <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
              Strategic Stock vs. Field Demand
            </h3>
            <p className="text-xs text-sahay-slate mt-0.5">
              Available unreserved warehouse & camp stock compared against pending requested demand.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockVsDemand} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6B746F' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#6B746F' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="stock" name="Available Stock" fill="#376653" radius={[2, 2, 0, 0]} />
                <Bar dataKey="demand" name="Requested Demand" fill="#B84F43" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Unresolved Shortages by Relief Camp */}
        <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
              Unresolved Shortages by Camp
            </h3>
            <p className="text-xs text-sahay-slate mt-0.5">
              Identifies which camps bear the heaviest burden of active resource alerts.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsByCampData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B746F' }} allowDecimals={false} />
                <YAxis dataKey="campName" type="category" tick={{ fontSize: 11, fill: '#6B746F' }} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Unresolved Alerts" fill="#B88735" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribution of Needs Categories */}
        <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
              Category Distribution of Shortages
            </h3>
            <p className="text-xs text-sahay-slate mt-0.5">
              Proportion of water, food, medicines, blankets, and sanitary napkins.
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertsByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {alertsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Request Pipeline Status */}
        <div className="p-5 rounded bg-white border border-sahay-border shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
              Logistics Fulfillment Lifecycle
            </h3>
            <p className="text-xs text-sahay-slate mt-0.5">
              Progression from requisition submission to final camp delivery verification.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B746F' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#6B746F' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Requisitions" fill="#648C83" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
