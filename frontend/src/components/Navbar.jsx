import React from 'react';
import { Layers, Activity, RefreshCw, Home, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Navbar({ health, activeTab, setActiveTab, onRefreshHealth, onHome }) {
  const isOnline = health?.status === 'healthy';
  const modelReady = health?.model?.status === 'ready';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DFE3E1] bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Left: RoadWise Identity with functional Home click */}
        <button
          type="button"
          onClick={onHome}
          className="flex items-center space-x-3 text-left group rounded p-1 -ml-1 transition-colors hover:bg-[#F3F1EC] focus-visible:ring-2 focus-visible:ring-[#114B44]"
          title="Return to RoadWise Home"
          aria-label="Return to RoadWise Home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded bg-[#114B44] text-white font-mono font-bold text-xs shadow-xs group-hover:bg-[#0D3833] transition-colors">
            RW
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#141D20] font-sans group-hover:text-[#114B44] transition-colors">
              RoadWise
            </span>
            <span className="text-[10px] text-[#505E63] font-mono leading-none hidden sm:block">
              Road Inspection Platform
            </span>
          </div>
        </button>

        {/* Center/Right: Navigation Tabs & Health Indicator */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1" aria-label="Main Navigation">
            {/* Explicit Home Button */}
            <button
              type="button"
              onClick={onHome}
              className="px-2.5 py-1.5 rounded text-xs font-semibold text-[#505E63] hover:text-[#114B44] hover:bg-[#F3F1EC] transition-colors flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#114B44]"
              title="Return to Home Landing"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Home</span>
            </button>

            {/* Inspection Workspace Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('inspect')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                activeTab === 'inspect'
                  ? 'bg-[#114B44] text-white shadow-xs'
                  : 'text-[#505E63] hover:text-[#114B44] hover:bg-[#F3F1EC]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspection Workspace</span>
            </button>

            {/* Authority Dashboard Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                activeTab === 'dashboard'
                  ? 'bg-[#114B44] text-white shadow-xs'
                  : 'text-[#505E63] hover:text-[#114B44] hover:bg-[#F3F1EC]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Authority Dashboard</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                activeTab === 'dashboard'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#EAE7E1] text-[#505E63]'
              }`}>
                Mode 2
              </span>
            </button>
          </nav>

          {/* API Health Status Indicator */}
          <div className="border-l border-[#DFE3E1] pl-3 hidden lg:flex items-center">
            <button
              type="button"
              onClick={onRefreshHealth}
              title="Click to refresh connection status"
              className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#F8F7F4] hover:bg-[#F3F1EC] border border-[#DFE3E1] text-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#114B44]"
            >
              <span className={`w-2 h-2 rounded-full ${
                isOnline 
                  ? (modelReady ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse') 
                  : 'bg-rose-500'
              }`} />
              <span className="text-[#364448] text-[11px] font-mono font-medium">
                {isOnline ? (modelReady ? 'API: Online (YOLOv8)' : 'Model Loading') : 'API: Offline'}
              </span>
              <RefreshCw className="w-2.5 h-2.5 text-[#79888E] hover:text-[#114B44] ml-0.5" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
