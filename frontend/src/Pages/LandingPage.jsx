import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Layers,
  Activity,
  Sliders,
  MapPin,
  Cpu,
  FileText,
  Search,
  CheckCircle2,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function LandingPage({ onStartInspection, onOpenDashboard, onTrackComplaint }) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#141D20] flex flex-col font-sans selection:bg-[#114B44] selection:text-white">
      
      {/* 1. Hero Section */}
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Headline, Narrative, and Primary Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* System Status Tag */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[11px] font-mono text-[#114B44] font-semibold tracking-wide shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#114B44] animate-pulse" />
              <span>AUTONOMOUS PAVEMENT DISTRESS TELEMETRY</span>
            </div>

            {/* Core Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#141D20] leading-[1.08]">
                Better road inspections.
                <span className="block text-[#114B44]">Clearer priorities.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#505E63] leading-relaxed max-w-2xl pt-2">
                Turn pavement condition photography into structured technical inspection telemetry.
                RoadWise combines real-time YOLOv8 damage detection with exponential condition scoring,
                1.0 km geofenced anti-spoofing, and contextual traffic factors to calculate transparent maintenance priorities.
              </p>
            </div>

            {/* Call to Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
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
                <span>Track Existing Complaint</span>
              </button>
            </div>

            {/* Decision-Support System Assurance */}
            <div className="pt-2 flex items-start gap-2.5 text-xs text-[#62737A] border-t border-[#DFE3E1]">
              <ShieldAlert className="w-4 h-4 text-[#114B44] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[#141D20] font-semibold">Civic Decision-Support Platform:</strong> Standardized AI distress analysis, multi-factor risk prioritization, and closed-loop municipal dispatch telemetry.
              </p>
            </div>

          </div>

          {/* Right Column: Interactive Real-Time AI Telemetry Console (Replaces Flat Image) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-[#1D3632] bg-[#0E1E1C] p-5 shadow-2xl text-white font-sans overflow-hidden">
              
              {/* Terminal Top Bar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-emerald-400 pl-1 font-semibold tracking-wide">
                    ROADWISE TELEMETRY CONSOLE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Dual-Model Active</span>
                </div>
              </div>

              {/* Dual Specialist Architecture Cards */}
              <div className="grid grid-cols-2 gap-2 pt-4 pb-3">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">HEAD 01</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">YOLOv8s</span>
                  </div>
                  <div className="text-xs font-semibold text-white">Pothole Specialist (D40)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Weight: 4.0 • Cavity Voids</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-teal-400 font-bold">HEAD 02</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-teal-950 text-teal-300 border border-teal-800">Exp-C 2-Class</span>
                  </div>
                  <div className="text-xs font-semibold text-white">Crack Specialist (D00/D20)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Weight: 1.0–2.5 • Fatigue Fissures</div>
                </div>
              </div>

              {/* Simulated Real-World Telemetry Diagnostic Frame */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">SAMPLE INSPECTION TELEMETRY</span>
                  <span className="text-emerald-400 font-bold">RW-20261116-SYS</span>
                </div>

                {/* Metric Gauges Row */}
                <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono text-slate-400">SURFACE HEALTH</div>
                    <div className="text-base font-bold font-mono text-amber-400">54.2<span className="text-[10px] text-slate-400">/100</span></div>
                    <div className="text-[9px] text-slate-400 font-mono">Degraded Surface</div>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono text-slate-400">CONTEXT WEIGHT</div>
                    <div className="text-base font-bold font-mono text-teal-300">1.45×</div>
                    <div className="text-[9px] text-slate-400 font-mono">Arterial • High Traffic</div>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono text-slate-400">CALCULATED RISK</div>
                    <div className="text-base font-bold font-mono text-rose-400">78.6<span className="text-[10px] text-slate-400">/100</span></div>
                    <div className="text-[9px] text-rose-300 font-mono font-bold">CRITICAL</div>
                  </div>
                </div>

                {/* Active Geospatial & Corridor Rules */}
                <div className="space-y-1.5 pt-1 text-[10px] font-mono">
                  <div className="flex items-center justify-between text-slate-300 bg-white/5 px-2.5 py-1.5 rounded">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>1.0 km Anti-Spoofing Safezone</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">Hardware GPS Locked</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 bg-white/5 px-2.5 py-1.5 rounded">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>150m Haversine Corridor Telemetry</span>
                    </span>
                    <span className="text-amber-400 font-semibold">Aggregate Corridor Cluster</span>
                  </div>
                </div>
              </div>

              {/* Priority Spectrum Indicator */}
              <div className="pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>AUTOMATED TRIAGE SPECTRUM</span>
                  <span>4-TIER BANDING</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono font-bold">
                  <div className="py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</div>
                  <div className="py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</div>
                  <div className="py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">MEDIUM</div>
                  <div className="py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">LOW</div>
                </div>
              </div>

              {/* Subtle decorative glow in bottom corner */}
              <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

        </section>

        {/* 3. Three-Step Structured Civic Workflow */}
        <section className="border-y border-[#DFE3E1] bg-[#F3F1EC] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#114B44] uppercase tracking-wider">
                System Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141D20]">
                From Raw Imagery to Prioritized Repair Dispatch
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Step 1: Inspect */}
              <div className="p-6 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#114B44] bg-[#EBF4F2] px-2 py-0.5 rounded">
                    PHASE 01
                  </span>
                  <Layers className="w-4 h-4 text-[#114B44]" />
                </div>
                <h3 className="text-base font-bold text-[#141D20]">
                  Inspect
                </h3>
                <p className="text-xs text-[#505E63] leading-relaxed">
                  Ingest road surface photography along with administrative location, road classification (e.g. National Highway, Main Road), traffic density, and geographic coordinates.
                </p>
                <div className="pt-2 text-[11px] font-mono text-[#79888E] border-t border-[#DFE3E1]/70">
                  EXIF GPS extraction + manual coordinate input
                </div>
              </div>

              {/* Step 2: Assess */}
              <div className="p-6 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#114B44] bg-[#EBF4F2] px-2 py-0.5 rounded">
                    PHASE 02
                  </span>
                  <Cpu className="w-4 h-4 text-[#114B44]" />
                </div>
                <h3 className="text-base font-bold text-[#141D20]">
                  Assess
                </h3>
                <p className="text-xs text-[#505E63] leading-relaxed">
                  Run Dual-Model YOLOv8 detection across unified road distress classes (Potholes D40, Alligator Cracks D20, Linear Cracks D00) and compute an exponential condition decay score.
                </p>
                <div className="pt-2 text-[11px] font-mono text-[#79888E] border-t border-[#DFE3E1]/70">
                  Damage load decay + sensitive facility weighting
                </div>
              </div>

              {/* Step 3: Prioritize */}
              <div className="p-6 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#114B44] bg-[#EBF4F2] px-2 py-0.5 rounded">
                    PHASE 03
                  </span>
                  <Activity className="w-4 h-4 text-[#114B44]" />
                </div>
                <h3 className="text-base font-bold text-[#141D20]">
                  Prioritize
                </h3>
                <p className="text-xs text-[#505E63] leading-relaxed">
                  Translate raw defect counts into transparent maintenance priority tiers (Critical, High, Medium, Low) and generate clear operational guidance for repair crew scheduling.
                </p>
                <div className="pt-2 text-[11px] font-mono text-[#79888E] border-t border-[#DFE3E1]/70">
                  Persisted to SQLite for GIS & network dispatch
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 4. Supported Defect Categories Overview */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-lg border border-[#DFE3E1] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE3E1] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#141D20]">
                  Evaluated Road Distress Classes
                </h3>
                <p className="text-xs text-[#505E63]">
                  Standardized defect taxonomies mapped to structural severity weights
                </p>
              </div>
              <span className="text-xs font-mono text-[#114B44] bg-[#EBF4F2] px-2.5 py-1 rounded font-semibold self-start sm:self-auto">
                YOLOv8 Object Detection
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-3.5 rounded border border-[#FECDD3] bg-[#FFF1F2] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#9F1239]">D40</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFE4E6] text-[#9F1239] font-semibold">Weight: 4.0</span>
                </div>
                <h4 className="text-sm font-bold text-[#881337]">Pothole</h4>
                <p className="text-[11px] text-[#4C0519] leading-relaxed">
                  Deep localized cavities impacting vehicle safety, rim integrity, and suspension dynamics.
                </p>
              </div>

              <div className="p-3.5 rounded border border-[#FED7AA] bg-[#FFF7ED] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#C2410C]">D20</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFEDD5] text-[#C2410C] font-semibold">Weight: 2.5</span>
                </div>
                <h4 className="text-sm font-bold text-[#9A3412]">Alligator Crack</h4>
                <p className="text-[11px] text-[#7C2D12] leading-relaxed">
                  Interconnected fatigue cracking indicating structural base weakness or subgrade failure.
                </p>
              </div>

              <div className="p-3.5 rounded border border-[#CCFBF1] bg-[#F0FDFA] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0F766E]">D00</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#CCFBF1] text-[#0F766E] font-semibold">Weight: 1.0</span>
                </div>
                <h4 className="text-sm font-bold text-[#115E59]">Linear Crack</h4>
                <p className="text-[11px] text-[#134E4A] leading-relaxed">
                  Unified longitudinal and transverse fissures requiring early sealant to prevent moisture infiltration.
                </p>
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* 5. Civic Footer */}
      <footer className="border-t border-[#DFE3E1] bg-white py-6 text-xs text-[#505E63] font-sans">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#141D20]">RoadWise</span>
            <span className="text-[#DFE3E1]">|</span>
            <span>Civic Pavement Telemetry & Maintenance Prioritization Platform</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#79888E]">
            <span>Dual-Model MS-NMS Fusion</span>
            <span>·</span>
            <span>1.0 km Geofenced Telemetry</span>
            <span>·</span>
            <span>150m Corridor Clustering</span>
          </div>
        </div>
      </footer>

    </div>
  );
}