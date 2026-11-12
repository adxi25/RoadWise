import React from 'react';
import { Layers, Activity, RefreshCw, Home, Search, Shield, ArrowRight, Lock } from 'lucide-react';

export default function Navbar({ health, activeTab, setActiveTab, onRefreshHealth, onHome }) {
  const isOnline = health?.status === 'healthy';
  const modelReady = health?.model?.status === 'ready';
  const isAuthorityMode = activeTab === 'dashboard';

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md shadow-2xs transition-colors ${
      isAuthorityMode ? 'bg-[#0F1E1C] border-[#1D3632] text-white' : 'bg-white/95 border-[#DFE3E1] text-[#141D20]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Left: RoadWise Identity with dynamic Mode Tag */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onHome}
            className={`flex items-center space-x-3 text-left group rounded p-1 -ml-1 transition-colors ${
              isAuthorityMode ? 'hover:bg-white/10' : 'hover:bg-[#F3F1EC]'
            } focus-visible:ring-2 focus-visible:ring-[#114B44]`}
            title="Return to RoadWise Home"
            aria-label="Return to RoadWise Home"
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded font-mono font-bold text-xs shadow-xs transition-colors ${
              isAuthorityMode ? 'bg-emerald-500 text-black' : 'bg-[#114B44] text-white group-hover:bg-[#0D3833]'
            }`}>
              RW
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-bold tracking-tight font-sans transition-colors ${
                isAuthorityMode ? 'text-white' : 'text-[#141D20] group-hover:text-[#114B44]'
              }`}>
                RoadWise
              </span>
              <span className={`text-[10px] font-mono leading-none hidden sm:block ${
                isAuthorityMode ? 'text-emerald-400' : 'text-[#505E63]'
              }`}>
                {isAuthorityMode ? 'Authority Portal (Mode 2)' : 'Public Citizen Portal'}
              </span>
            </div>
          </button>
        </div>

        {/* Center/Right: Navigation Tabs & Health Indicator */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1" aria-label="Main Navigation">
            
            {/* If in Authority Mode: Show Return button and telemetry */}
            {isAuthorityMode ? (
              <div className="flex items-center space-x-2">
                <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-emerald-300 font-mono bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Authorized Municipal Session</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('inspect')}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center space-x-1.5 border border-white/20"
                >
                  <span>← Exit to Citizen Portal</span>
                </button>
              </div>
            ) : (
              /* Citizen Mode Navigation */
              <>
                <button
                  type="button"
                  onClick={onHome}
                  className="px-2.5 py-1.5 rounded text-xs font-semibold text-[#505E63] hover:text-[#114B44] hover:bg-[#F3F1EC] transition-colors flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#114B44]"
                  title="Return to Home Landing"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Home</span>
                </button>

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
                  <span>Report Road Damage</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                    activeTab === 'track'
                      ? 'bg-[#114B44] text-white shadow-xs'
                      : 'text-[#505E63] hover:text-[#114B44] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track Report</span>
                </button>

                {/* Discrete Authority Access Link */}
                <div className="border-l border-[#DFE3E1] pl-2 ml-1 hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold text-[#79888E] hover:text-[#114B44] hover:bg-[#EBF4F2] transition-colors flex items-center space-x-1 border border-transparent hover:border-[#CCDCD8]"
                    title="Access Government Authority Dashboard (Mode 2)"
                  >
                    <Lock className="w-3 h-3 text-[#114B44]" />
                    <span>Authority Portal</span>
                  </button>
                </div>
              </>
            )}
          </nav>

          {/* API Health Status Indicator */}
          <div className={`border-l pl-3 hidden lg:flex items-center ${isAuthorityMode ? 'border-emerald-800' : 'border-[#DFE3E1]'}`}>
            <button
              type="button"
              onClick={onRefreshHealth}
              title="Click to refresh connection status"
              className={`flex items-center space-x-2 px-2.5 py-1 rounded text-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                isAuthorityMode 
                  ? 'bg-black/30 hover:bg-black/50 border border-emerald-900 text-emerald-300' 
                  : 'bg-[#F8F7F4] hover:bg-[#F3F1EC] border border-[#DFE3E1] text-[#505E63]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                isOnline 
                  ? (modelReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse') 
                  : 'bg-rose-500'
              }`} />
              <span className={`text-[11px] font-mono font-medium ${isAuthorityMode ? 'text-emerald-300' : 'text-[#364448]'}`}>
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
