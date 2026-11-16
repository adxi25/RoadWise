import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldAlert,
  Layers,
  Activity,
  Cpu,
  Search,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Clock,
  Sliders,
  FileSpreadsheet,
  AlertTriangle,
  GitBranch,
  Crosshair,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ onStartInspection, onOpenDashboard, onTrackComplaint }) {
  // Interactive Pipeline Stage Selector
  const [activeStage, setActiveStage] = useState(1);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#141D20] flex flex-col font-sans selection:bg-[#114B44] selection:text-white">

      <main className="flex-1 space-y-12 sm:space-y-16 py-8 sm:py-14">

        {/* 1. Hero Section: Minimalist Civic-Tech Layout */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF4F2] border border-[#CCDCD8] text-xs font-mono font-semibold text-[#114B44]">
              <span className="w-2 h-2 rounded-full bg-[#114B44]" />
              <span>CIVIC ROAD INFRASTRUCTURE TELEMETRY</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#141D20] leading-[1.12]">
                Transparent Road Inspections.
                <span className="block text-[#114B44]">Objective Repair Priorities.</span>
              </h1>
              <p className="text-base text-[#505E63] leading-relaxed">
                RoadWise turns road photography into structured civil telemetry.
                Combines Dual-Model YOLOv8 defect detection, exponential condition decay scoring,
                and 1.0 km hardware geofencing to prioritize maintenance where it is needed most.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStartInspection}
                className="inline-flex items-center justify-center gap-2 bg-[#114B44] hover:bg-[#0D3833] active:bg-[#0A2A26] text-white px-6 py-3.5 rounded-lg font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                <span>Report Road Damage</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onTrackComplaint}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F3F1EC] text-[#141D20] border border-[#CCDCD8] hover:border-[#114B44] px-5 py-3.5 rounded-lg font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#114B44]" />
                <span>Track Existing Grievance</span>
              </button>
            </div>

            {/* Quick Feature Bullet Strip */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[#505E63] border-t border-[#DFE3E1]">
              <div className="flex items-center gap-1.5 font-medium text-[#141D20]">
                <CheckCircle2 className="w-4 h-4 text-[#114B44] flex-shrink-0" />
                <span>Dual-Model YOLOv8</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#141D20]">
                <CheckCircle2 className="w-4 h-4 text-[#114B44] flex-shrink-0" />
                <span>1.0 km Anti-Spoof</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#141D20]">
                <CheckCircle2 className="w-4 h-4 text-[#114B44] flex-shrink-0" />
                <span>150m Corridor Cluster</span>
              </div>
            </div>

          </div>

          {/* Right Column: Clean Telemetry Product Card (No misleading photos) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[#CCDCD8] bg-white p-6 sm:p-7 shadow-lg space-y-5">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-3.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#141D20]">
                    Inspection Telemetry Record
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#114B44] bg-[#EBF4F2] px-2.5 py-0.5 rounded-md font-semibold border border-[#CCDCD8]">
                  ID: #RW-2026-042
                </span>
              </div>

              {/* Pavement Condition Metric Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
                  <div className="text-[11px] font-mono text-[#79888E]">CONDITION INDEX</div>
                  <div className="text-2xl font-bold font-mono text-rose-600">34.2<span className="text-xs text-[#79888E]">/100</span></div>
                  <div className="text-[11px] text-[#505E63] font-medium">Critical Distress</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
                  <div className="text-[11px] font-mono text-[#79888E]">CONTEXT WEIGHT</div>
                  <div className="text-2xl font-bold font-mono text-[#114B44]">1.45×</div>
                  <div className="text-[11px] text-[#505E63] font-medium">Main City Arterial</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
                  <div className="text-[11px] font-mono text-[#79888E]">CALCULATED RISK</div>
                  <div className="text-2xl font-bold font-mono text-rose-600">78.6<span className="text-xs text-[#79888E]">/100</span></div>
                  <div className="text-[11px] text-rose-700 font-bold font-mono">CRITICAL</div>
                </div>
              </div>

              {/* Detected Defect Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#79888E] font-semibold">
                  Detected Defect Taxonomy
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900 font-mono">D40 Pothole</div>
                      <div className="text-[11px] text-rose-700">1 Cavity Void (0.18 m²)</div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                      94% conf
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-900 font-mono">D20 Alligator</div>
                      <div className="text-[11px] text-amber-700">Fatigue Fissure (0.62 m²)</div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      88% conf
                    </span>
                  </div>
                </div>
              </div>

              {/* Geospatial Corridor & Dispatch Footer */}
              <div className="p-3 rounded-lg bg-[#EBF4F2] border border-[#CCDCD8] text-xs text-[#114B44] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Bennett Univ Corridor · Ward 4</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                  <span>Dispatch: Immediate Patching Order</span>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* 2. Key Metrics Bar */}
        <section className="border-y border-[#DFE3E1] bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">6,000+</div>
              <div className="text-xs text-[#505E63] font-sans pt-0.5">Trained Pavement Images</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">Dual YOLOv8</div>
              <div className="text-xs text-[#505E63] font-sans pt-0.5">MS-NMS Spatial Fusion</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">1.0 km</div>
              <div className="text-xs text-[#505E63] font-sans pt-0.5">Hardware Anti-Spoof Safezone</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">150m</div>
              <div className="text-xs text-[#505E63] font-sans pt-0.5">Corridor Multi-Report Cluster</div>
            </div>
          </div>
        </section>

        {/* 3. Interactive 3-Stage Pipeline (Clean, Concise, No Dense Text) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-[#114B44] uppercase tracking-wider">
              System Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141D20]">
              How RoadWise Processes Road Damage
            </h2>
          </div>

          {/* Clean 3-Stage Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setActiveStage(1)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                activeStage === 1
                  ? 'bg-white border-[#114B44] ring-2 ring-[#114B44]/20 shadow-xs'
                  : 'bg-white/70 border-[#DFE3E1] text-[#505E63] hover:border-[#114B44]'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono font-bold text-[#114B44]">STAGE 01</span>
                <span className={`w-2 h-2 rounded-full ${activeStage === 1 ? 'bg-[#114B44]' : 'bg-[#CCDCD8]'}`} />
              </div>
              <div className="text-sm font-bold text-[#141D20]">Field Ingestion</div>
              <div className="text-xs text-[#79888E] pt-0.5">Photo capture & 1.0 km GPS check</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveStage(2)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                activeStage === 2
                  ? 'bg-white border-[#114B44] ring-2 ring-[#114B44]/20 shadow-xs'
                  : 'bg-white/70 border-[#DFE3E1] text-[#505E63] hover:border-[#114B44]'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono font-bold text-[#114B44]">STAGE 02</span>
                <span className={`w-2 h-2 rounded-full ${activeStage === 2 ? 'bg-[#114B44]' : 'bg-[#CCDCD8]'}`} />
              </div>
              <div className="text-sm font-bold text-[#141D20]">AI Defect Detection</div>
              <div className="text-xs text-[#79888E] pt-0.5">Dual-Model YOLOv8 & PCI Scoring</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveStage(3)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                activeStage === 3
                  ? 'bg-white border-[#114B44] ring-2 ring-[#114B44]/20 shadow-xs'
                  : 'bg-white/70 border-[#DFE3E1] text-[#505E63] hover:border-[#114B44]'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono font-bold text-[#114B44]">STAGE 03</span>
                <span className={`w-2 h-2 rounded-full ${activeStage === 3 ? 'bg-[#114B44]' : 'bg-[#CCDCD8]'}`} />
              </div>
              <div className="text-sm font-bold text-[#141D20]">Authority Dispatch</div>
              <div className="text-xs text-[#79888E] pt-0.5">150m corridor cluster & work order</div>
            </button>
          </div>

          {/* Stage Details (Clean & Concise) */}
          <div className="p-6 rounded-xl bg-white border border-[#DFE3E1] shadow-2xs">
            {activeStage === 1 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#141D20]">Stage 01: Citizen Photo & Anti-Spoof Ingestion</h3>
                <p className="text-xs text-[#505E63] leading-relaxed max-w-3xl">
                  Citizens upload a photograph of road surface damage. RoadWise validates the location using browser GPS and enforces a 1.0 km hardware safezone to block remote or fake submissions.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-[#114B44]">
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">1.0 km Geofence Locked</span>
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">EXIF GPS Extraction</span>
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">Interactive Map Pin Drop</span>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#141D20]">Stage 02: Dual-Model MS-NMS Fusion & Damage Decay</h3>
                <p className="text-xs text-[#505E63] leading-relaxed max-w-3xl">
                  Head 1 targets deep cavity voids (D40 Potholes), while Head 2 targets interconnected fatigue cracking (D20) and linear fissures (D00). Overlapping detections are fused with Non-Maximum Suppression to compute an exponential condition rating.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-[#114B44]">
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">Dual YOLOv8s Models</span>
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">Exponential Load Decay</span>
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">Traffic & Facility Weighting</span>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#141D20]">Stage 03: Municipal Triage & Contractor Queue</h3>
                <p className="text-xs text-[#505E63] leading-relaxed max-w-3xl">
                  Reports are persisted to SQLite and classified into 4 priority bands (Critical, High, Medium, Low). Damage reports within a 150-meter corridor are clustered to prevent redundant crew dispatches. Authorized engineers can export contractor CSVs directly in Mode 2.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-[#114B44]">
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">150m Haversine Clustering</span>
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">Contractor CSV Export</span>
                  <span className="bg-[#EBF4F2] px-2.5 py-1 rounded-md border border-[#CCDCD8]">Closed-Loop State Tracking</span>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* 4. Evaluated Defect Classes (Concise & Clean) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-[#DFE3E1] bg-white p-6 space-y-5 shadow-2xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE3E1] pb-3.5">
              <div>
                <h3 className="text-base font-bold text-[#141D20]">
                  Evaluated Road Distress Classes
                </h3>
                <p className="text-xs text-[#505E63]">
                  Standardized defect taxonomy mapped to structural severity weights
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#114B44] bg-[#EBF4F2] px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto border border-[#CCDCD8]">
                Trained YOLOv8 Heads
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-800">D40</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">Weight: 4.0</span>
                </div>
                <h4 className="text-sm font-bold text-rose-900">Pothole</h4>
                <p className="text-xs text-rose-800/80 leading-relaxed">
                  Deep localized cavities impacting vehicle safety, rim integrity, and suspension dynamics.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-800">D20</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Weight: 2.5</span>
                </div>
                <h4 className="text-sm font-bold text-amber-900">Alligator Crack</h4>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  Interconnected fatigue cracking indicating structural base weakness or subgrade failure.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-teal-800">D00</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">Weight: 1.0</span>
                </div>
                <h4 className="text-sm font-bold text-teal-900">Linear Crack</h4>
                <p className="text-xs text-teal-800/80 leading-relaxed">
                  Longitudinal and transverse fissures requiring early sealant to prevent moisture infiltration.
                </p>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* 5. Minimalist Civic Footer */}
      <footer className="border-t border-[#DFE3E1] bg-white py-6 text-xs text-[#505E63] font-sans mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#141D20]">RoadWise</span>
            <span className="text-[#DFE3E1]">|</span>
            <span>Civic Pavement Telemetry & Municipal Maintenance Prioritization</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#79888E]">
            <span>Dual-Model YOLOv8</span>
            <span>·</span>
            <span>1.0 km Anti-Spoof</span>
            <span>·</span>
            <span>150m Corridor Clustering</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
