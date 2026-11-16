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
  Compass,
  Zap,
  MapPin,
  Clock,
  Sliders,
  ChevronRight,
  TrendingDown,
  FileSpreadsheet,
  AlertTriangle,
  GitBranch,
  Crosshair,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ onStartInspection, onOpenDashboard, onTrackComplaint }) {
  // Live Design Testing Switcher: 'A' (Enterprise Bento & Field Tool) vs 'B' (Clean Minimalist Civic Tool)
  const [variant, setVariant] = useState('A');

  // Interactive Sample Scenario State for Option A Hero Viewport
  const [activeSample, setActiveSample] = useState('pothole');

  // Interactive Workflow Tab for Option B
  const [activeStage, setActiveStage] = useState(1);

  // Sample Scenarios Data
  const sampleScenarios = {
    pothole: {
      title: 'Pothole Cavity (D40)',
      image: '/sample_roads/pothole_sample.jpg',
      badge: 'Head 1 Specialist (D40)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      defectType: 'D40 Severe Cavity',
      confidence: '94.2%',
      area: '0.18 m²',
      pciScore: 34,
      pciStatus: 'Critical Distress',
      pciColor: '#EF4444',
      context: 'Arterial Road (1.45× load)',
      riskScore: 78.6,
      riskBand: 'CRITICAL',
      riskBandColor: 'bg-rose-500 text-white',
      dispatchTicket: '#RW-942 · Ward 4 Maintenance Queue',
      contractorAction: 'Immediate cold-mix asphalt patch within 24h',
      boxStyle: { top: '38%', left: '28%', width: '44%', height: '38%' }
    },
    crack: {
      title: 'Alligator Fatigue Cracks (D20)',
      image: '/sample_roads/crack_sample.jpg',
      badge: 'Head 2 Specialist (D20/D00)',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      defectType: 'D20 Interlocking Fatigue',
      confidence: '88.7%',
      area: '0.62 m²',
      pciScore: 52,
      pciStatus: 'Degraded Subbase',
      pciColor: '#F59E0B',
      context: 'Secondary Collector (1.20× load)',
      riskScore: 61.4,
      riskBand: 'HIGH',
      riskBandColor: 'bg-amber-500 text-white',
      dispatchTicket: '#RW-948 · Ward 2 Asphalt Crew',
      contractorAction: 'Crack-sealing & milling overlay scheduled',
      boxStyle: { top: '30%', left: '20%', width: '60%', height: '50%' }
    },
    linear: {
      title: 'Longitudinal Fissure (D00)',
      image: '/sample_roads/crack_sample.jpg',
      badge: 'Head 2 Specialist (D00)',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      defectType: 'D00 Linear Joint Crack',
      confidence: '81.3%',
      area: '0.09 m²',
      pciScore: 76,
      pciStatus: 'Moderate Wear',
      pciColor: '#10B981',
      context: 'Local Residential (1.00× load)',
      riskScore: 36.8,
      riskBand: 'LOW',
      riskBandColor: 'bg-emerald-600 text-white',
      dispatchTicket: '#RW-953 · Routine Preventive Log',
      contractorAction: 'Rubberized bitumen joint seal on Q3 cycle',
      boxStyle: { top: '22%', left: '35%', width: '30%', height: '58%' }
    }
  };

  const currentSample = sampleScenarios[activeSample];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#141D20] flex flex-col font-sans selection:bg-[#114B44] selection:text-white">

      {/* =========================================================================
          LIVE DESIGN VARIANT TESTER BAR
          ========================================================================= */}
      <div className="sticky top-0 z-40 bg-[#141D20] text-white border-b border-[#2C3B3F] py-2 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold uppercase tracking-wider">Interactive Design Preview:</span>
            <span className="text-slate-400 text-[11px] hidden md:inline">Test both options live in your browser</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0B1214] p-1 rounded-lg border border-[#2C3B3F]">
            <button
              type="button"
              onClick={() => setVariant('A')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                variant === 'A'
                  ? 'bg-[#114B44] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Option A: Enterprise Bento & Field Tool
            </button>
            <button
              type="button"
              onClick={() => setVariant('B')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                variant === 'B'
                  ? 'bg-[#114B44] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Option B: Clean Minimalist Civic Tool
            </button>
          </div>
        </div>
      </div>

      {variant === 'A' ? (
        /* =========================================================================
           OPTION A: ENTERPRISE PRECISION & INTERACTIVE BENTO GRID
           ========================================================================= */
        <main className="flex-1 space-y-16 py-8 sm:py-12">

          {/* 1. Hero Section with Interactive Field Tool Viewport */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF4F2] border border-[#CCDCD8] text-[11px] font-mono text-[#114B44] font-semibold tracking-wide shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#114B44]" />
                <span>AI PAVEMENT DISTRESS TELEMETRY</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#141D20] leading-[1.12]">
                  High-Precision Pavement Intelligence.
                  <span className="block text-[#114B44]">Objective Maintenance Priority.</span>
                </h1>
                <p className="text-base text-[#505E63] leading-relaxed">
                  Transform raw road surface photography into calibrated civil telemetry.
                  RoadWise fuses <strong>Dual-Model YOLOv8 detection</strong> with exponential Pavement Condition Index (PCI) decay,
                  hardware geofence validation, and 150m spatial corridor clustering.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartInspection}
                  className="inline-flex items-center justify-center gap-2 bg-[#114B44] hover:bg-[#0D3833] text-white px-6 py-3.5 rounded-lg font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  <span>Start Road Inspection</span>
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

              {/* System Assurance */}
              <div className="pt-2 flex items-start gap-2.5 text-xs text-[#62737A] border-t border-[#DFE3E1]">
                <ShieldCheck className="w-4 h-4 text-[#114B44] flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#141D20] font-semibold">Trained on 6,000+ pavement distress frames:</strong> Multi-Scale NMS fusion across D40 potholes, D20 alligator cracking, and D00 linear fissures.
                </p>
              </div>

            </div>

            {/* Right: Realistic Rugged Field Inspection Viewport */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900 text-white shadow-2xl overflow-hidden">
                
                {/* Viewport Header with Live Scenario Switchers */}
                <div className="bg-slate-950/90 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
                      LIVE INSPECTION VIEWER
                    </span>
                  </div>
                  
                  {/* Scenario Toggle Pills */}
                  <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-md border border-slate-700 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveSample('pothole')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                        activeSample === 'pothole'
                          ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      D40 Pothole
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSample('crack')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                        activeSample === 'crack'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      D20 Alligator
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSample('linear')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                        activeSample === 'linear'
                          ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      D00 Linear
                    </button>
                  </div>
                </div>

                {/* Road Image with Razor-Sharp Calibrated Bounding Box */}
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  <img
                    src={currentSample.image}
                    alt={currentSample.title}
                    className="w-full h-full object-cover opacity-90 transition-all duration-300"
                  />

                  {/* Dynamic Bounding Box Overlay */}
                  <div
                    className="absolute border-2 border-emerald-400 bg-emerald-400/15 rounded-sm transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    style={currentSample.boxStyle}
                  >
                    {/* Bounding Box Label Tag */}
                    <div className="absolute -top-6 left-0 bg-emerald-500 text-slate-950 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-t whitespace-nowrap shadow-sm flex items-center gap-1">
                      <Crosshair className="w-3 h-3" />
                      <span>{currentSample.defectType} · {currentSample.confidence}</span>
                    </div>

                    {/* Area Badge at Bottom */}
                    <div className="absolute -bottom-5 right-0 bg-slate-900/90 text-emerald-300 px-1.5 py-0.5 text-[9px] font-mono rounded-b border border-emerald-500/30 whitespace-nowrap">
                      Area: {currentSample.area}
                    </div>
                  </div>

                  {/* Floating Telemetry Stamp */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300">
                    <span className="text-emerald-400 font-semibold">● GPS LOCKED:</span> 28.4518° N, 77.5718° E (Ward 4)
                  </div>
                </div>

                {/* Telemetry Output Dashboard Under the Image */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                  
                  {/* Metric Gauges Row */}
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* Radial Health Metric */}
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] font-mono text-slate-400">SURFACE HEALTH</div>
                      <div className="text-xl font-bold font-mono pt-0.5" style={{ color: currentSample.pciColor }}>
                        {currentSample.pciScore}<span className="text-xs text-slate-400">/100</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">{currentSample.pciStatus}</div>
                    </div>

                    {/* Context Multiplier */}
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] font-mono text-slate-400">CONTEXT IMPACT</div>
                      <div className="text-xl font-bold font-mono text-teal-300 pt-0.5">
                        {activeSample === 'pothole' ? '1.45×' : activeSample === 'crack' ? '1.20×' : '1.00×'}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">{currentSample.context.split('(')[0]}</div>
                    </div>

                    {/* Final Priority Band */}
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] font-mono text-slate-400">TRIAGE PRIORITY</div>
                      <div className="pt-1">
                        <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold rounded ${currentSample.riskBandColor}`}>
                          {currentSample.riskBand}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 pt-1">Score: {currentSample.riskScore}/100</div>
                    </div>

                  </div>

                  {/* Contractor Work-Order Dispatch Banner */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="font-mono text-[11px]">
                        <span className="text-slate-400">Dispatch: </span>
                        <span className="text-emerald-400 font-semibold">{currentSample.dispatchTicket}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Closed-Loop Ready</span>
                  </div>

                </div>

              </div>
            </div>

          </section>

          {/* 2. Key Proof Metrics Strip */}
          <section className="border-y border-[#DFE3E1] bg-white py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">6,000+</div>
                <div className="text-xs text-[#505E63] font-sans pt-0.5">Trained Pavement Frames</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">Dual YOLOv8</div>
                <div className="text-xs text-[#505E63] font-sans pt-0.5">MS-NMS Spatial Fusion</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">1.0 km Safezone</div>
                <div className="text-xs text-[#505E63] font-sans pt-0.5">Anti-Spoof Geofence</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[#114B44]">150m Corridor</div>
                <div className="text-xs text-[#505E63] font-sans pt-0.5">Haversine Multi-Report Cluster</div>
              </div>
            </div>
          </section>

          {/* 3. Engineering Bento Grid (Replaces AI 3-Box Cards) */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#114B44] uppercase tracking-wider">
                System Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141D20]">
                Calibrated Engineering Capabilities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

              {/* Bento Card 1: Dual-Model Spatial Fusion (7 cols) */}
              <div className="md:col-span-7 rounded-xl bg-white border border-[#DFE3E1] p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#114B44]">
                    <GitBranch className="w-5 h-5" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Dual-Model Fusion</span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#EBF4F2] text-[#114B44] px-2 py-0.5 rounded font-semibold">
                    IoU 0.45 · Multi-Scale
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#141D20]">
                    Pothole Specialist + Crack Specialist Fusion
                  </h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    Single-model architectures fail on fine linear cracks while detecting wide cavities. RoadWise combines 
                    <strong> Head 1 (Pothole Cavity Specialist)</strong> with <strong>Head 2 (Experiment C Fatigue Specialist)</strong>, merging bounding boxes via Non-Maximum Suppression to eliminate false negatives.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
                    <span className="text-[10px] font-mono text-[#114B44] font-bold">HEAD 01: POTHOLE (D40)</span>
                    <div className="text-xs font-semibold text-[#141D20]">Cavity Void Recall</div>
                    <div className="text-[11px] text-[#505E63]">Weight 4.0 · High safety risk</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
                    <span className="text-[10px] font-mono text-[#114B44] font-bold">HEAD 02: CRACK (D00/D20)</span>
                    <div className="text-xs font-semibold text-[#141D20]">Interlocking Fatigue</div>
                    <div className="text-[11px] text-[#505E63]">Weight 1.0–2.5 · Subbase seal</div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Exponential Distress Decay (5 cols) */}
              <div className="md:col-span-5 rounded-xl bg-white border border-[#DFE3E1] p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#114B44]">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Health Decay Math</span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#EBF4F2] text-[#114B44] px-2 py-0.5 rounded font-semibold">
                    Exponential Decay
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#141D20]">
                    Pavement Condition Index (PCI)
                  </h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    Linear deduction models underestimate critical clusters. RoadWise implements exponential damage load decay: multiple severe defects trigger compounded urgency.
                  </p>
                </div>

                {/* Mathematical Visualizer Box */}
                <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] font-mono text-[11px] space-y-1.5">
                  <div className="text-[#114B44] font-bold">Score = 100 × e^(-0.04 × Σ(Weight × Overlap))</div>
                  <div className="text-[#505E63] text-[10px] leading-relaxed">
                    100 = Brand-new asphalt surface<br />
                    &lt;40 = Structural subgrade failure requiring priority dispatch
                  </div>
                </div>
              </div>

              {/* Bento Card 3: 150m Haversine Corridor Telemetry (6 cols) */}
              <div className="md:col-span-6 rounded-xl bg-white border border-[#DFE3E1] p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#114B44]">
                    <MapPin className="w-5 h-5" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Spatial Clustering</span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#EBF4F2] text-[#114B44] px-2 py-0.5 rounded font-semibold">
                    150m Haversine
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#141D20]">
                    Corridor Multi-Citizen Deduplication
                  </h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    When multiple citizens report pavement distress along the same stretch of road, RoadWise clusters defects within a 150-meter corridor radius into a single consolidated contractor work order, preventing duplicate crew dispatch costs.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#EBF4F2] border border-[#CCDCD8] text-xs text-[#114B44] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Enforces 1.0 km hardware safezone to block spoofed remote uploads</span>
                </div>
              </div>

              {/* Bento Card 4: Municipal Dispatch Pipeline (6 cols) */}
              <div className="md:col-span-6 rounded-xl bg-white border border-[#DFE3E1] p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#114B44]">
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Authority Mode 2</span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#EBF4F2] text-[#114B44] px-2 py-0.5 rounded font-semibold">
                    CSV Work-Orders
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#141D20]">
                    Closed-Loop Municipal Work-Order Flow
                  </h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    Public citizen inspections directly populate the Municipal Authority action panel. Engineering superintendents can filter by ward, inspect GPS coordinates, allocate repair crews, and export CSV contractor work-orders.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#505E63] pt-1 border-t border-[#DFE3E1]">
                  <span>Status: PENDING ➔ IN-PROGRESS ➔ RESOLVED</span>
                  <button
                    type="button"
                    onClick={onOpenDashboard}
                    className="text-[#114B44] font-bold hover:underline cursor-pointer"
                  >
                    Open Authority Portal →
                  </button>
                </div>
              </div>

            </div>

          </section>

        </main>
      ) : (
        /* =========================================================================
           OPTION B: CLEAN MINIMALIST CIVIC TOOL
           ========================================================================= */
        <main className="flex-1 space-y-16 py-8 sm:py-12">

          {/* 1. Ultra-Clean Hero */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EBF4F2] text-xs font-mono font-semibold text-[#114B44]">
                <span>MUNICIPAL INFRASTRUCTURE TELEMETRY</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#141D20] leading-tight">
                  Transparent Road Inspections.
                  <span className="block text-[#114B44]">Data-Driven Repairs.</span>
                </h1>
                <p className="text-base text-[#505E63] leading-relaxed">
                  A public civic-tech platform that combines citizen photo reporting with autonomous YOLOv8 defect detection, condition scoring, and ward-level repair scheduling.
                </p>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartInspection}
                  className="inline-flex items-center justify-center gap-2 bg-[#114B44] hover:bg-[#0D3833] text-white px-6 py-3.5 rounded-lg font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  <span>Report Road Hazard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onTrackComplaint}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F3F1EC] text-[#141D20] border border-[#CCDCD8] px-5 py-3.5 rounded-lg font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#114B44]" />
                  <span>Track by Report ID</span>
                </button>
              </div>

            </div>

            {/* Right: Clean Split Inspection Card */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[#DFE3E1] bg-white p-6 shadow-md space-y-5">
                
                <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#141D20]">
                      Sample Inspection Record
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#505E63] bg-[#F8F7F4] px-2 py-0.5 rounded border border-[#DFE3E1]">
                    ID: #RW-2026-042
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* Photo Preview */}
                  <div className="relative rounded-lg overflow-hidden border border-[#DFE3E1] aspect-[4/3] bg-slate-900">
                    <img
                      src="/sample_roads/pothole_sample.jpg"
                      alt="Sample Pothole"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                      D40 Pothole · 94%
                    </div>
                  </div>

                  {/* Telemetry Breakdown */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] font-mono text-[#79888E]">CONDITION INDEX</div>
                      <div className="text-2xl font-bold font-mono text-rose-600">34.2 / 100</div>
                      <div className="text-xs text-[#505E63]">Critical Surface Distress</div>
                    </div>

                    <div className="border-t border-[#DFE3E1] pt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#79888E]">Road Class:</span>
                        <span className="font-semibold text-[#141D20]">Main City Arterial</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#79888E]">Geofence:</span>
                        <span className="font-semibold text-emerald-700">✓ Within 1.0 km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#79888E]">Corridor:</span>
                        <span className="font-semibold text-[#141D20]">150m Segment Match</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="inline-block w-full text-center py-1.5 rounded bg-rose-50 text-rose-700 font-bold font-mono text-xs border border-rose-200">
                        PRIORITY: CRITICAL DISPATCH
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </section>

          {/* 2. Interactive 3-Stage Pipeline Bar */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="border-b border-[#DFE3E1] pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#141D20]">
                How RoadWise Processes Road Damage
              </h2>
              <p className="text-xs text-[#505E63] pt-1">
                Click each stage to inspect the technical parameters
              </p>
            </div>

            {/* Stage Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setActiveStage(1)}
                className={`p-4 rounded-lg text-left border transition-all cursor-pointer ${
                  activeStage === 1
                    ? 'bg-[#EBF4F2] border-[#114B44] text-[#114B44] shadow-xs'
                    : 'bg-white border-[#DFE3E1] text-[#505E63] hover:border-[#114B44]'
                }`}
              >
                <div className="text-xs font-mono font-bold">STAGE 01</div>
                <div className="text-sm font-bold text-[#141D20] pt-1">Citizen Ingestion</div>
                <div className="text-xs text-[#79888E] pt-0.5">Photo + Geofenced GPS</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveStage(2)}
                className={`p-4 rounded-lg text-left border transition-all cursor-pointer ${
                  activeStage === 2
                    ? 'bg-[#EBF4F2] border-[#114B44] text-[#114B44] shadow-xs'
                    : 'bg-white border-[#DFE3E1] text-[#505E63] hover:border-[#114B44]'
                }`}
              >
                <div className="text-xs font-mono font-bold">STAGE 02</div>
                <div className="text-sm font-bold text-[#141D20] pt-1">Dual-Model AI Analysis</div>
                <div className="text-xs text-[#79888E] pt-0.5">Detection + PCI Scoring</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveStage(3)}
                className={`p-4 rounded-lg text-left border transition-all cursor-pointer ${
                  activeStage === 3
                    ? 'bg-[#EBF4F2] border-[#114B44] text-[#114B44] shadow-xs'
                    : 'bg-white border-[#DFE3E1] text-[#505E63] hover:border-[#114B44]'
                }`}
              >
                <div className="text-xs font-mono font-bold">STAGE 03</div>
                <div className="text-sm font-bold text-[#141D20] pt-1">Municipal Dispatch</div>
                <div className="text-xs text-[#79888E] pt-0.5">Prioritized Work Orders</div>
              </button>
            </div>

            {/* Stage Detail Card */}
            <div className="p-6 rounded-xl bg-white border border-[#DFE3E1] shadow-xs">
              {activeStage === 1 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#141D20]">Stage 01: Citizen Photo & Anti-Spoof Ingestion</h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    Citizens capture or upload road distress photography. RoadWise automatically extracts EXIF metadata and verifies against the device's live GPS coordinates using a strict 1.0 km geofence safezone, preventing misleading or remote false reports.
                  </p>
                  <div className="flex gap-2 pt-2 text-[11px] font-mono text-[#114B44]">
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">1.0 km Geofence</span>
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">EXIF Parser</span>
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">Interactive Pin Drop</span>
                  </div>
                </div>
              )}

              {activeStage === 2 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#141D20]">Stage 02: Dual-Model MS-NMS Fusion & Damage Load Decay</h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    The FastAPI backend routes the image through two parallel neural heads: Head 1 evaluates deep pothole voids (D40) while Head 2 identifies fatigue cracking (D20) and linear fissures (D00). Bounding boxes are fused with Non-Maximum Suppression, calculating an objective exponential condition index.
                  </p>
                  <div className="flex gap-2 pt-2 text-[11px] font-mono text-[#114B44]">
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">Dual YOLOv8</span>
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">Exponential Decay</span>
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">Context Multipliers</span>
                  </div>
                </div>
              )}

              {activeStage === 3 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#141D20]">Stage 03: Municipal Triage & Contractor Queue</h3>
                  <p className="text-xs text-[#505E63] leading-relaxed">
                    Inspections are persisted to SQLite and classified into 4 priority bands (Critical, High, Medium, Low). Reports along the same 150m corridor are automatically clustered. Authorized municipal superintendents can log into Mode 2 to assign crews and export contractor work orders.
                  </p>
                  <div className="flex gap-2 pt-2 text-[11px] font-mono text-[#114B44]">
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">150m Haversine Clustering</span>
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">Contractor CSV Export</span>
                    <span className="bg-[#EBF4F2] px-2 py-0.5 rounded">Mode 2 Action Panel</span>
                  </div>
                </div>
              )}
            </div>

          </section>

        </main>
      )}

      {/* 4. Common Civic Footer */}
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
