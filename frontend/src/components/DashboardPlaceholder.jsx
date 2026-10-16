import React from 'react';
import { Activity, Map, BarChart3, Shield, ArrowRight, Layers } from 'lucide-react';

export default function DashboardPlaceholder({ onBackToInspect }) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 text-center space-y-6">
      
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] text-xs font-mono font-semibold">
        <Activity className="w-3.5 h-3.5 text-[#114B44]" />
        <span>Mode 2 Authority Portal — Prototype Module</span>
      </div>

      <div className="space-y-2 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#141D20] font-sans tracking-tight">
          Network Road Asset Management
        </h2>
        <p className="text-xs sm:text-sm text-[#505E63] leading-relaxed">
          Mode 2 connects real inspection records to network GIS mapping, aggregated ward defect distributions, and prioritized maintenance dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
        <div className="p-5 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] flex items-center justify-center">
            <Map className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-[#141D20] text-xs uppercase font-mono">GIS Network Map</h4>
          <p className="text-xs text-[#505E63] leading-relaxed">
            Geospatial markers for inspected road corridors with maintenance priority color coding based on actual SQLite database records.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-[#141D20] text-xs uppercase font-mono">Defect Aggregation</h4>
          <p className="text-xs text-[#505E63] leading-relaxed">
            Corridor-level defect breakdowns by road classification, administrative city/ward, and detected damage types.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-[#141D20] text-xs uppercase font-mono">Priority Dispatch Queue</h4>
          <p className="text-xs text-[#505E63] leading-relaxed">
            Systematic queue calculated from structural condition decay and sensitive facility proximity to assist resource allocation.
          </p>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBackToInspect}
          className="px-5 py-2.5 rounded bg-[#114B44] hover:bg-[#0D3833] text-white font-semibold text-xs inline-flex items-center space-x-2 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-[#114B44]"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Go to Single Road Inspection (Mode 1)</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      <p className="text-[11px] text-[#79888E] font-mono">
        Authority Dashboard will populate with real database records in Phase Four.
      </p>

    </div>
  );
}
