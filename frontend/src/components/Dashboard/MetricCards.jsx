import React from 'react';
import { Layers, AlertCircle, AlertTriangle, Activity, ShieldCheck, MapPin } from 'lucide-react';

export default function MetricCards({ stats, filteredCount, totalCount, activeFilterCount }) {
  const isFiltered = activeFilterCount > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* Total Inspections */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-[#505E63]">
          <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Total Stored</span>
          <Layers className="w-4 h-4 text-[#114B44]" />
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl font-bold font-sans text-[#141D20] tracking-tight">
            {stats?.total_inspections ?? 0}
          </div>
          <div className="text-[11px] text-[#79888E] font-mono">
            {isFiltered ? `${filteredCount} in active view` : 'Verified records'}
          </div>
        </div>
      </div>

      {/* Critical Priority */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-2 border-l-4 border-l-rose-600">
        <div className="flex items-center justify-between text-[#505E63]">
          <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-rose-800">Critical Queue</span>
          <AlertCircle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl font-bold font-sans text-rose-900 tracking-tight">
            {stats?.critical_count ?? 0}
          </div>
          <div className="text-[11px] text-[#79888E] font-mono">
            Immediate dispatch
          </div>
        </div>
      </div>

      {/* High Priority */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-2 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between text-[#505E63]">
          <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-amber-800">High Priority</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl font-bold font-sans text-amber-900 tracking-tight">
            {stats?.high_count ?? 0}
          </div>
          <div className="text-[11px] text-[#79888E] font-mono">
            Urgent scheduling
          </div>
        </div>
      </div>

      {/* Average Condition Score */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-[#505E63]">
          <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Avg Condition</span>
          <Activity className="w-4 h-4 text-[#114B44]" />
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl font-bold font-sans text-[#141D20] tracking-tight">
            {stats?.avg_condition_score !== undefined ? `${stats.avg_condition_score}` : '—'}
            <span className="text-xs text-[#79888E] font-normal ml-0.5">/100</span>
          </div>
          <div className="text-[11px] text-[#79888E] font-mono">
            Pavement integrity
          </div>
        </div>
      </div>

      {/* Average Maintenance Risk */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-[#505E63]">
          <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Avg Risk Index</span>
          <ShieldCheck className="w-4 h-4 text-[#114B44]" />
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl font-bold font-sans text-[#141D20] tracking-tight">
            {stats?.avg_risk_score !== undefined ? `${stats.avg_risk_score}` : '—'}
            <span className="text-xs text-[#79888E] font-normal ml-0.5">/100</span>
          </div>
          <div className="text-[11px] text-[#79888E] font-mono">
            Calibrated network risk
          </div>
        </div>
      </div>

      {/* Valid GPS Geocoded */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-[#505E63]">
          <span className="text-[11px] font-bold uppercase font-mono tracking-wider">GPS Mapped</span>
          <MapPin className="w-4 h-4 text-[#114B44]" />
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl font-bold font-sans text-[#141D20] tracking-tight">
            {stats?.valid_gps_count ?? 0}
          </div>
          <div className="text-[11px] text-[#79888E] font-mono">
            {stats?.total_inspections
              ? `${Math.round(((stats.valid_gps_count || 0) / stats.total_inspections) * 100)}% GIS coverage`
              : '0% coverage'}
          </div>
        </div>
      </div>
    </div>
  );
}
