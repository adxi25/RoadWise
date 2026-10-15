import React from 'react';
import { Activity, Map, BarChart3, Shield, ArrowRight } from 'lucide-react';

export default function DashboardPlaceholder({ onBackToInspect }) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 text-center space-y-6">
      
      <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono">
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span>Mode 2 Authority Portal — Under Construction</span>
      </div>

      <div className="space-y-2 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
          Network Road Asset Management
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Mode 2 provides GIS network mapping, aggregated ward analytics, and prioritized maintenance dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left pt-2">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
            <Map className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-slate-200 text-xs uppercase font-mono">GIS Network Map</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Geospatial visualization of all inspected road segments with risk severity color coding.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-slate-200 text-xs uppercase font-mono">Defect Aggregation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pothole and crack density distributions filtered by road classification and administrative region.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-slate-200 text-xs uppercase font-mono">Priority Queue</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated maintenance queue calculated from condition decay and sensitive corridor weights.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onBackToInspect}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs inline-flex items-center space-x-1.5 transition-colors"
        >
          <span>Return to Inspection Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
