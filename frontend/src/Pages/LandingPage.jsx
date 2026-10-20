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
  Search
} from 'lucide-react';
import heroRoadImage from '../assets/hero_road_annotated.jpg';

export default function LandingPage({ onStartInspection, onOpenDashboard, onTrackComplaint }) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#141D20] flex flex-col font-sans selection:bg-[#114B44] selection:text-white">
      
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#DFE3E1] bg-[#F8F7F4]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#114B44] text-xs font-bold tracking-wider text-white font-mono shadow-sm">
              RW
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#141D20] font-sans">
                RoadWise
              </span>
              <span className="text-[11px] text-[#505E63] font-mono leading-none">
                Civic Road Infrastructure Telemetry
              </span>
            </div>
          </div>

          {/* Navigation Actions */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={onOpenDashboard}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#505E63] hover:text-[#114B44] hover:bg-[#EBF4F2] rounded transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-[#114B44]" />
              <span>Authority Dashboard</span>
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[#EAE7E1] text-[#505E63]">
                Mode 2
              </span>
            </button>

            <button
              type="button"
              onClick={onTrackComplaint}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#505E63] hover:text-[#114B44] hover:bg-[#EBF4F2] rounded transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Report</span>
            </button>

            <button
              type="button"
              onClick={onStartInspection}
              className="inline-flex items-center gap-2 bg-[#114B44] hover:bg-[#0D3833] active:bg-[#0A2A26] px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded transition-colors shadow-sm"
            >
              <span>Start Inspection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Headline, Narrative, and Primary Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* System Status Tag */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[11px] font-mono text-[#114B44] font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-[#114B44]" />
              <span>DECISION-SUPPORT TELEMETRY PLATFORM</span>
            </div>

            {/* Core Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#141D20] leading-[1.08]">
                Better road inspections.
                <span className="block text-[#114B44]">Clearer priorities.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#505E63] leading-relaxed max-w-2xl pt-2">
                Turn pavement condition photography into structured technical inspection telemetry.
                RoadWise combines real-time YOLOv8 damage detection with exponential condition scoring
                and contextual traffic factors to calculate transparent maintenance priorities.
              </p>
            </div>

            {/* Call to Action Controls */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onStartInspection}
                className="inline-flex items-center justify-center gap-2 bg-[#114B44] hover:bg-[#0D3833] active:bg-[#0A2A26] text-white px-5 py-3 rounded font-semibold text-sm transition-all shadow-sm"
              >
                <span>Launch Inspection Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F3F1EC] text-[#141D20] border border-[#DFE3E1] hover:border-[#CCDCD8] px-5 py-3 rounded font-semibold text-sm transition-colors shadow-sm"
              >
                <Activity className="w-4 h-4 text-[#114B44]" />
                <span>Open Authority Dashboard</span>
                <ChevronRight className="w-4 h-4 text-[#79888E]" />
              </button>
            </div>

            {/* Explicit Prototype & Human-Review Disclaimer */}
            <div className="pt-2 flex items-start gap-2.5 text-xs text-[#62737A] border-t border-[#DFE3E1]">
              <ShieldAlert className="w-4 h-4 text-[#114B44] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[#141D20] font-semibold">Decision-Support Prototype:</strong> All damage classifications, condition indexes, and maintenance recommendations are algorithmic estimates designed for infrastructure triage and require qualified engineering field verification.
              </p>
            </div>

          </div>

          {/* Right Column: Authentic Infrastructure Hero Visual with AI Telemetry Overlay */}
          <div className="lg:col-span-5">
            <div className="relative rounded-lg border border-[#DFE3E1] bg-white p-2.5 shadow-sm overflow-hidden">
              
              {/* Local Road Asset */}
              <div className="relative rounded overflow-hidden bg-[#141D20] aspect-[4/3] flex items-center justify-center">
                <img
                  src={heroRoadImage}
                  alt="Real civic road inspection sample"
                  className="w-full h-full object-cover"
                />

                {/* Illustrative image label — no fabricated detection results */}
                <div className="absolute top-3 left-3 rounded border border-white/20 bg-[#0D3833]/85 px-3 py-2 text-[10px] font-mono text-white">
                  Illustrative road imagery
                </div>

              </div>

              {/* Visual Caption */}
              <div className="pt-2 px-1 flex items-center justify-between text-[11px] font-mono text-[#505E63]">
                  <span>Road inspection example</span>
                  <span>Live results appear after inspection</span>
              </div>

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
                  Run YOLOv8 object detection across road distress classes (potholes D40, alligator cracking D20, transverse D10, longitudinal D00) and compute an exponential condition decay score.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
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

              <div className="p-3.5 rounded border border-[#FDE68A] bg-[#FFFBEB] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#B45309]">D10</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#B45309] font-semibold">Weight: 1.5</span>
                </div>
                <h4 className="text-sm font-bold text-[#92400E]">Transverse Crack</h4>
                <p className="text-[11px] text-[#78350F] leading-relaxed">
                  Cross-perpendicular cracks caused by asphalt contraction or thermal expansion cycles.
                </p>
              </div>

              <div className="p-3.5 rounded border border-[#CCFBF1] bg-[#F0FDFA] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0F766E]">D00</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#CCFBF1] text-[#0F766E] font-semibold">Weight: 1.0</span>
                </div>
                <h4 className="text-sm font-bold text-[#115E59]">Longitudinal Crack</h4>
                <p className="text-[11px] text-[#134E4A] leading-relaxed">
                  Joint or wheelpath parallel fissures requiring early sealant to prevent moisture infiltration.
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
            <span>Civic Road Infrastructure Decision-Support System</span>
          </div>
          <div className="text-[11px] font-mono text-[#79888E]">
            Model: YOLOv8 640px · Storage: SQLite · API: FastAPI
          </div>
        </div>
      </footer>

    </div>
  );
}