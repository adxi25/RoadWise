import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import ContextForm from './components/ContextForm';
import InspectionResults from './components/InspectionResults';
import LoadingOverlay from './components/LoadingOverlay';
import DashboardPlaceholder from './components/DashboardPlaceholder';
import { checkHealth, inspectRoad } from './api/client';
import { AlertTriangle, Layers, Cpu, Activity, ShieldCheck, FileText } from 'lucide-react';
import LandingPage from './Pages/LandingPage.jsx';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('inspect'); // 'inspect' | 'dashboard'
  const [health, setHealth] = useState(null);

  // Form & Image State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [fileError, setFileError] = useState(null);

  const [context, setContext] = useState({
    road_type: 'main_road',
    traffic_level: 'high',
    location_sensitivity: 'none',
    latitude: null,
    longitude: null,
    state: '',
    city: '',
    area: '',
  });

  const [conf, setConf] = useState(0.25);

  // Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Initial Health Check
  const fetchHealth = async () => {
    const res = await checkHealth();
    setHealth(res);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async () => {
    setApiError(null);

    if (!selectedFile) {
      setFileError("Please select or drag-and-drop a road image first.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('road_type', context.road_type);
      formData.append('traffic_level', context.traffic_level);
      formData.append('location_sensitivity', context.location_sensitivity);
      formData.append('conf', String(conf));

      if (context.latitude !== null && context.latitude !== undefined && !isNaN(context.latitude)) {
        formData.append('latitude', String(context.latitude));
      }
      if (context.longitude !== null && context.longitude !== undefined && !isNaN(context.longitude)) {
        formData.append('longitude', String(context.longitude));
      }
      if (context.state?.trim()) formData.append('state', context.state.trim());
      if (context.city?.trim()) formData.append('city', context.city.trim());
      if (context.area?.trim()) formData.append('area', context.area.trim());

      const result = await inspectRoad(formData);
      setInspectionResult(result);
    } catch (err) {
      console.error("Inspection request failed:", err);
      setApiError(err.message || "An unexpected error occurred during inspection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInspectionResult(null);
    setApiError(null);
    setFileError(null);
  };
  if (showLanding) {
  return (
    <LandingPage
      onStartInspection={() => setShowLanding(false)}
      onTrackComplaint={() => {
        alert('Complaint tracking will be implemented next.');
      }}
    />
  );
}

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefreshHealth={fetchHealth}
        onHome={() => setShowLanding(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' ? (
          <DashboardPlaceholder onBackToInspect={() => setActiveTab('inspect')} />
        ) : (
          <div className="space-y-6">
            
            {/* Error Banner */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-white">Inspection Failed</span>
                    <span className="text-[11px] text-rose-200/90 leading-relaxed font-mono">{apiError}</span>
                  </div>
                </div>
                <button
                  onClick={() => setApiError(null)}
                  className="text-xs text-rose-400 hover:text-rose-200 underline font-mono ml-auto"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* If result is ready, show full results dashboard */}
            {inspectionResult ? (
              <InspectionResults
                result={inspectionResult}
                onReset={handleReset}
              />
            ) : (
              /* Two-Column Inspection Workspace */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Inspection Input (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                    
                    <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                        Inspection Input
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">Mode 1</span>
                    </div>

                    <ImageUploader
                      selectedFile={selectedFile}
                      setSelectedFile={setSelectedFile}
                      previewUrl={previewUrl}
                      setPreviewUrl={setPreviewUrl}
                      imageMeta={imageMeta}
                      setImageMeta={setImageMeta}
                      error={fileError}
                      setError={setFileError}
                    />

                    <ContextForm
                      context={context}
                      setContext={setContext}
                      conf={conf}
                      setConf={setConf}
                      onAnalyze={handleAnalyze}
                      isLoading={isLoading}
                      canAnalyze={!!selectedFile}
                    />

                  </div>
                </div>

                {/* Right Column: Analysis Summary & Empty State (7 cols) */}
                <div className="lg:col-span-7">
                  {isLoading ? (
                    <div className="py-12">
                      <LoadingOverlay />
                    </div>
                  ) : (
                    /* Intentional Professional Empty State */
                    <div className="p-6 sm:p-8 rounded-xl bg-slate-900/40 border border-slate-800 space-y-6">
                      
                      <div className="space-y-1.5 border-b border-slate-800 pb-4">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <h2 className="text-sm font-bold uppercase font-mono tracking-wider">
                            Ready for inspection
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          Upload a road image and provide the infrastructure context to run the analysis.
                        </p>
                      </div>

                      {/* Technical Pipeline Overview Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        
                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Defect Object Detection</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Identifies potholes (D40), alligator cracks (D20), transverse cracks (D10), and longitudinal cracks (D00).
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Condition Scoring</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Exponential damage load decay formula (100 = perfect, 0 = severe degradation) with duplicate overlap discounting.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Context-Calibrated Risk</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Amplifies damage severity using road classification, traffic volume, and proximity to critical sensitive facilities.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Actionable Telemetry</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Generates maintenance priority bands (LOW to CRITICAL) and operational guidance stored in the database.
                          </p>
                        </div>

                      </div>

                      {/* Technical Specs Footer */}
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
                        <span>Model: YOLOv8 640px</span>
                        <span>Backend: FastAPI + SQLite</span>
                        <span>Mode: Single Frame Inspection</span>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3.5 text-xs text-slate-400 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RoadWise Road Safety & Asset Inspection Platform</span>
          <span className="text-slate-400">Mode 1 — Single Road Inspection</span>
        </div>
      </footer>

    </div>
  );
}
