/**
 * RoadWise - Root Application Component & Mode Orchestrator
 * ==========================================================
 *
 * ROLE IN ROADWISE ARCHITECTURE:
 *   This is the master React component that manages top-level application state,
 *   coordinates view routing between the Landing Page, Mode 1 (Road Inspection),
 *   and Mode 2 (Authority Dashboard), and manages asynchronous lifecycle hooks.
 *
 * CORE STATE RESPONSIBILITIES:
 *   1. View Switching:
 *      - `showLanding` (boolean): Controls display of public landing page.
 *      - `activeTab` ('inspect' | 'dashboard'): Switches between Mode 1 and Mode 2.
 *   2. Mode 1 Upload & Context State:
 *      - `selectedFile`: Raw browser File object uploaded via drag-and-drop or file picker.
 *      - `previewUrl`: Blob URL generated via `URL.createObjectURL()` for immediate preview.
 *      - `context`: Operational road environment parameters (road_type, traffic, sensitivity, GPS).
 *      - `conf` & `imgsz`: User-adjustable YOLO inference hyperparameters.
 *   3. Asynchronous Execution & Health:
 *      - `health`: Server readiness state refreshed every 30s via `checkHealth()`.
 *      - `isLoading`: Locks UI during multi-second model inference and DB transaction.
 *      - `inspectionResult`: Structured JSON response rendered by `<InspectionResults />`.
 *
 * MEMORY MANAGEMENT & DEFENSIVE VALIDATION (Viva Note):
 *   - `URL.revokeObjectURL()` is called inside `handleReset()` to free memory allocated
 *     for client-side image preview blobs, avoiding browser memory leaks.
 *   - Mandatory GPS validation (`hasValidGps`) guarantees that inspections can be accurately
 *     plotted on the Leaflet geographic map before network submission.
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import ContextForm from './components/ContextForm';
import InspectionResults from './components/InspectionResults';
import LoadingOverlay from './components/LoadingOverlay';
import AuthorityDashboard from './Pages/AuthorityDashboard';
import TrackReport from './Pages/TrackReport';
import { checkHealth, inspectRoad } from './api/client';
import { AlertTriangle, Layers, Cpu, Activity, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import LandingPage from './Pages/LandingPage.jsx';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('inspect'); // 'inspect' | 'dashboard' | 'track'
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

  const [conf, setConf] = useState(0.10);
  const [imgsz, setImgsz] = useState(0);

  // Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Initial Health Check: Polled on mount and every 30 seconds
  const fetchHealth = async () => {
    const res = await checkHealth();
    setHealth(res);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    // Cleanup interval on unmount to avoid background memory leaks
    return () => clearInterval(interval);
  }, []);

  // Strict GPS coordinate validation guard:
  // Ensures latitude in [-90, 90] and longitude in [-180, 180] before form submission
  const hasValidGps = Boolean(
    context.latitude !== null &&
    context.latitude !== undefined &&
    context.longitude !== null &&
    context.longitude !== undefined &&
    !isNaN(Number(context.latitude)) &&
    !isNaN(Number(context.longitude)) &&
    Number(context.latitude) >= -90 &&
    Number(context.latitude) <= 90 &&
    Number(context.longitude) >= -180 &&
    Number(context.longitude) <= 180
  );

  // Form submit guard: requires both an image file and valid coordinates
  const canAnalyze = Boolean(selectedFile && hasValidGps);

  // Mode 1 Submission Handler:
  // Serializes multipart/form-data and dispatches POST /api/inspections/inspect
  const handleAnalyze = async () => {
    if (isLoading) return;

    setApiError(null);
    setInspectionResult(null);

    // Validate image presence
    if (!selectedFile) {
      setFileError("Please select or drag-and-drop a road image first.");
      return;
    }

    // Validate mandatory GPS coordinates
    if (!hasValidGps) {
      setApiError("Valid live GPS coordinates (latitude and longitude) are mandatory before submitting an inspection. Please click 'Use My Current Location'.");
      return;
    }

    setIsLoading(true);

    try {
      // Build multipart/form-data payload for FastAPI streaming
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('road_type', context.road_type);
      formData.append('traffic_level', context.traffic_level);
      formData.append('location_sensitivity', context.location_sensitivity);
      formData.append('conf', String(conf));
      formData.append('imgsz', String(imgsz));

      // Mandatory verified live GPS coordinates
      formData.append('latitude', String(context.latitude));
      formData.append('longitude', String(context.longitude));

      // Supplementary regional context only (trimmed)
      if (context.state?.trim()) formData.append('state', context.state.trim());
      if (context.city?.trim()) formData.append('city', context.city.trim());
      if (context.area?.trim()) formData.append('area', context.area.trim());

      // Execute inspection via client adapter
      const result = await inspectRoad(formData);
      setInspectionResult(result);
    } catch (err) {
      console.error("Inspection request failed:", err);
      setApiError(err.message || "An unexpected error occurred during inspection.");
    } finally {
      setIsLoading(false);
    }
  };

  // State Reset & Memory Cleanup Handler:
  // Revokes created object URLs to prevent browser memory leaks
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setInspectionResult(null);
    setApiError(null);
    setFileError(null);
    setContext(prev => ({
      ...prev,
      latitude: null,
      longitude: null,
      accuracy: null,
    }));
  };

  if (showLanding) {
    return (
      <LandingPage
        onStartInspection={() => {
          setShowLanding(false);
          setActiveTab('inspect');
        }}
        onOpenDashboard={() => {
          setShowLanding(false);
          setActiveTab('dashboard');
        }}
        onTrackComplaint={() => {
          setShowLanding(false);
          setActiveTab('track');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#141D20] font-sans selection:bg-[#114B44] selection:text-white">

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
          <AuthorityDashboard onBackToInspect={() => setActiveTab('inspect')} />
        ) : activeTab === 'track' ? (
          <TrackReport
            onBackToHome={() => setShowLanding(true)}
            onStartInspection={() => {
              setShowLanding(false);
              setActiveTab('inspect');
            }}
          />
        ) : (
          <div className="space-y-6">

            {/* Error Banner */}
            {apiError && (
              <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-[#991B1B] text-xs flex items-start justify-between gap-3 shadow-2xs">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#141D20]">Inspection Error</span>
                    <span className="text-xs text-[#991B1B] leading-relaxed font-mono">{apiError}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="text-xs text-[#991B1B] hover:text-[#141D20] underline font-mono ml-auto font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* If result is ready, show full results dashboard */}
            {inspectionResult ? (
              <InspectionResults
                key={inspectionResult.report_id || inspectionResult.inspection_id || 'result'}
                result={inspectionResult}
                onReset={handleReset}
              />
            ) : (
              /* Two-Column Inspection Workspace */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Inspection Input (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-lg bg-white border border-[#DFE3E1] space-y-4 shadow-2xs">

                    <div className="border-b border-[#DFE3E1] pb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#141D20] uppercase font-mono tracking-wider">
                        Inspection Input
                      </span>
                      <span className="text-[11px] text-[#505E63] font-mono bg-[#F8F7F4] px-2 py-0.5 rounded border border-[#DFE3E1]">
                        Mode 1 Live
                      </span>
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
                      imgsz={imgsz}
                      setImgsz={setImgsz}
                      onAnalyze={handleAnalyze}
                      isLoading={isLoading}
                      canAnalyze={canAnalyze}
                    />

                  </div>
                </div>

                {/* Right Column: Pipeline Overview & Empty State (7 cols) */}
                <div className="lg:col-span-7">
                  {isLoading ? (
                    <div className="py-12">
                      <LoadingOverlay />
                    </div>
                  ) : (
                    /* Intentional Professional Empty State */
                    <div className="p-6 sm:p-8 rounded-lg bg-white border border-[#DFE3E1] space-y-6 shadow-2xs">

                      <div className="space-y-1.5 border-b border-[#DFE3E1] pb-4">
                        <div className="flex items-center space-x-2 text-[#141D20]">
                          <Layers className="w-4 h-4 text-[#114B44]" />
                          <h2 className="text-sm font-bold uppercase font-mono tracking-wider">
                            Ready for Inspection
                          </h2>
                        </div>
                        <p className="text-xs text-[#505E63] leading-relaxed font-sans">
                          Select a road surface photograph and specify road classification to calculate condition rating and maintenance risk.
                        </p>
                      </div>

                      {/* Technical Pipeline Overview Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

                        <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20]">
                            <Cpu className="w-4 h-4 text-[#114B44]" />
                            <span>Defect Object Detection</span>
                          </div>
                          <p className="text-xs text-[#505E63] leading-relaxed">
                            Autonomous Dual-Model detection: Potholes (D40), Alligator Cracks (D20), and unified Linear Cracks (D00).
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20]">
                            <Activity className="w-4 h-4 text-[#114B44]" />
                            <span>Condition Scoring</span>
                          </div>
                          <p className="text-xs text-[#505E63] leading-relaxed">
                            Exponential damage load decay formula (100 = intact, 0 = severe distress) with overlap compensation.
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20]">
                            <ShieldCheck className="w-4 h-4 text-[#114B44]" />
                            <span>Context-Calibrated Risk</span>
                          </div>
                          <p className="text-xs text-[#505E63] leading-relaxed">
                            Calibrates defect severity using road classification, traffic volume, and proximity to sensitive facilities.
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1.5">
                          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20]">
                            <FileText className="w-4 h-4 text-[#114B44]" />
                            <span>Actionable Telemetry</span>
                          </div>
                          <p className="text-xs text-[#505E63] leading-relaxed">
                            Generates maintenance priority bands (LOW to CRITICAL) and operational guidance recorded to SQLite.
                          </p>
                        </div>

                      </div>

                      {/* Technical Specs Footer */}
                      <div className="p-3 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[11px] font-mono text-[#505E63] flex flex-wrap items-center justify-between gap-2">
                        <span>Model: Dual-Model YOLOv8 (MS-NMS Fusion)</span>
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

      {/* Technical Civic Footer */}
      <footer className="border-t border-[#DFE3E1] bg-white py-3.5 text-xs text-[#505E63] font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RoadWise Road Safety & Asset Inspection Platform</span>
          <span className="text-[#79888E]">
            {activeTab === 'dashboard' ? 'Mode 2 — Authority Infrastructure Dashboard' : activeTab === 'track' ? 'Mode 1 — Public Citizen Tracking Portal' : 'Mode 1 — Single Road Inspection'}
          </span>
        </div>
      </footer>

    </div>
  );
}
