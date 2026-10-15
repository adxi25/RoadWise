import React from 'react';
import { Layers, Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ health, activeTab, setActiveTab, onRefreshHealth, onHome }) {
  const isOnline = health?.status === 'healthy';
  const modelReady = health?.model?.status === 'ready';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Left: RoadWise Identity */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-400 font-mono font-bold text-sm">
            RW
          </div>
          <div className="flex items-baseline space-x-2.5">
            <span className="text-base font-bold tracking-tight text-white font-sans">
              RoadWise
            </span>
            <span className="text-xs text-slate-400 font-mono border-l border-slate-800 pl-2.5 hidden sm:inline">
              Road Damage Inspection
            </span>
          </div>
        </div>

        {/* Center/Right: Navigation & Telemetry */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('inspect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'inspect'
                  ? 'bg-slate-900 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspection Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Authority Dashboard</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Mode 2
              </span>
            </button>
          </nav>

          {/* API Health Status Indicator */}
          <div className="border-l border-slate-800 pl-3 hidden md:flex items-center space-x-2">
            <button
              onClick={onRefreshHealth}
              title="Click to refresh connection status"
              className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${
                isOnline 
                  ? (modelReady ? 'bg-emerald-400' : 'bg-amber-400') 
                  : 'bg-rose-500'
              }`} />
              <span className="text-slate-300 text-[11px] font-mono">
                {isOnline ? (modelReady ? 'API: Online (YOLOv8)' : 'Model Loading') : 'API: Offline'}
              </span>
              <RefreshCw className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300 ml-1" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
