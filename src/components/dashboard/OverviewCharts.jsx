import React from 'react';
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
  CartesianGrid,
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';

export const OverviewCharts = ({ inventory, requests, alerts, camps }) => {
  // Chart 1: Resource Demand vs Available Stock from shared data
  const stockVsDemandData = analyticsService.getResourceStockVsDemand(inventory, requests);

  // Chart 2: Shortages by Category
  const categoryAlertData = analyticsService.getAlertsByCategory(alerts);

  // Chart 3: Resolved vs Unresolved by Severity
  const severityData = analyticsService.getAlertsBySeverity(alerts);

  // Chart 4: Request Status Breakdown
  const requestStatusData = analyticsService.getRequestStatusBreakdown(requests);

  const PIE_COLORS = ['#B84F43', '#B88735', '#648C83', '#376653', '#6B746F'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Available Unreserved Stock vs Requested Demand */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Critical Resource Supply vs. Open Demand
          </h3>
          <p className="text-xs text-sahay-slate mt-0.5">
            Aggregated available stock across depots compared with unmet camp requests
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stockVsDemandData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#6B746F' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
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

      {/* Chart 2: Shortage Alerts by Resource Category */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Active Shortages by Category
          </h3>
          <p className="text-xs text-sahay-slate mt-0.5">
            Frequency of unresolved shortage warnings across camps
          </p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {categoryAlertData.length === 0 ? (
            <p className="text-xs text-sahay-slate">No active shortages detected.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryAlertData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {categoryAlertData.map((entry, index) => (
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
          )}
        </div>
      </div>

      {/* Chart 3: Severity Breakdown: Active vs Resolved */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Shortage Alerts by Severity & Resolution
          </h3>
          <p className="text-xs text-sahay-slate mt-0.5">
            Active versus verified resolved alerts
          </p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={severityData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B746F' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B746F' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E3DC',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="count" name="Active / Unresolved" fill="#B88735" radius={[2, 2, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#477A5B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Request Status Pipeline */}
      <div className="bg-white rounded border border-sahay-border shadow-subtle p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-sahay-forest-deep uppercase tracking-wider">
            Resource Request Fulfillment Pipeline
          </h3>
          <p className="text-xs text-sahay-slate mt-0.5">
            Tracking lifecycle from submission to field delivery
          </p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={requestStatusData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B746F' }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B746F' }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E3DC',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Total Requests" fill="#648C83" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
