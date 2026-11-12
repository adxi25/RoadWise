import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Calendar, 
  Car, 
  ShieldAlert, 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';
import { trackReport, getImageUrl } from '../api/client';
import PriorityBadge from '../components/PriorityBadge';

export default function TrackReport({ onBackToHome, onStartInspection, initialComplaintId = '' }) {
  const [complaintId, setComplaintId] = useState(initialComplaintId);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!complaintId.trim()) {
      setError('Please enter a valid Complaint ID.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await trackReport(complaintId.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve complaint record.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!result?.report_id) return;
    navigator.clipboard.writeText(result.report_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusTheme = (color) => {
    switch (color) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900',
          badge: 'bg-red-600 text-white',
          dot: 'bg-red-600',
        };
      case 'high':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-600 text-white',
          dot: 'bg-amber-600',
        };
      case 'medium':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          badge: 'bg-blue-600 text-white',
          dot: 'bg-blue-600',
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          dot: 'bg-emerald-600',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#141D20] font-sans selection:bg-[#114B44] selection:text-white pb-16">
      
      {/* Header Bar */}
      <header className="border-b border-[#DFE3E1] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1.5 -ml-1.5 rounded hover:bg-[#F3F1EC] text-[#505E63] hover:text-[#114B44] transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#114B44]" />
              <h1 className="text-sm sm:text-base font-bold text-[#141D20]">
                Track Road Damage Complaint
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onStartInspection}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-[#114B44] hover:bg-[#0D3833] text-white transition-colors"
            >
              Report New Damage
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-6">
        
        {/* Search Hero Card */}
        <section className="bg-white rounded-xl border border-[#DFE3E1] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-xl space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#114B44] font-semibold bg-[#EBF4F2] px-2 py-0.5 rounded border border-[#CCDCD8]">
              Public Civic Tracking
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#141D20] tracking-tight">
              Track Your Reported Road Repair Status
            </h2>
            <p className="text-xs sm:text-sm text-[#505E63]">
              Enter your unique Complaint ID (e.g. <span className="font-mono font-medium text-[#141D20]">RW-20261112-...</span>) issued upon submission. No account or citizen login is required.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#79888E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                placeholder="Enter Complaint ID (e.g. RW-20261112-233041-2705)"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#CCDCD8] bg-[#F8F7F4] text-sm text-[#141D20] font-mono placeholder:font-sans placeholder:text-[#79888E] focus:outline-none focus:ring-2 focus:ring-[#114B44] focus:bg-white transition-all"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !complaintId.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#114B44] hover:bg-[#0D3833] active:bg-[#0A2A26] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-xs transition-colors"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Track Status</span>
              )}
            </button>
          </form>

          {/* Quick Help Tip */}
          <div className="pt-2 text-[11px] text-[#79888E] flex items-center gap-1.5 border-t border-[#DFE3E1]/60">
            <Clock className="w-3.5 h-3.5" />
            <span>Complaint IDs are generated automatically upon successful photo upload and GPS verification.</span>
          </div>
        </section>

        {/* Error Alert State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 text-red-900 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Verification Notice</h3>
              <p className="text-xs text-red-800 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Success / Result State */}
        {result && (
          <section className="bg-white rounded-xl border border-[#DFE3E1] shadow-xs overflow-hidden space-y-0 animate-fadeIn">
            
            {/* Top Status Banner */}
            {(() => {
              const theme = getStatusTheme(result.tracking_status?.badge_color);
              return (
                <div className={`p-5 sm:p-6 border-b ${theme.bg} space-y-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${theme.dot} animate-pulse`} />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider">
                        {result.tracking_status?.status_label || 'Status Recorded'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={result.priority} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold">
                      {result.tracking_status?.stage || 'Logged in Municipal Telemetry System'}
                    </h3>
                    <p className="text-xs opacity-90">
                      Estimated Resolution / Response Window: <span className="font-semibold">{result.tracking_status?.eta || 'Routine Scheduling'}</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Core Details Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* ID Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-[#505E63] uppercase tracking-wider block">Verified Public Complaint ID</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-[#114B44]">{result.report_id}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CCDCD8] bg-white hover:bg-[#F3F1EC] text-xs font-medium text-[#141D20] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#505E63]" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Metrics & Context Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Pavement Health & Telemetry */}
                <div className="space-y-4 border border-[#DFE3E1] rounded-lg p-4 bg-white">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#505E63] font-semibold border-b border-[#DFE3E1] pb-2">
                    Physical Assessment
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#505E63]">Road Condition Rating:</span>
                      <span className="font-bold text-sm text-[#141D20]">{Number(result.condition_score).toFixed(1)} / 100</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#505E63]">Maintenance Risk Score:</span>
                      <span className="font-bold text-sm text-[#114B44]">{Number(result.risk_score).toFixed(1)} / 100</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#505E63]">Total Detections:</span>
                      <span className="font-bold text-[#141D20]">{result.detections?.length || 0} defects</span>
                    </div>

                    <div className="pt-2 border-t border-[#DFE3E1] space-y-1">
                      <span className="text-[11px] font-semibold text-[#141D20] block">Official Action Guidance:</span>
                      <p className="text-xs text-[#505E63] leading-relaxed bg-[#F8F7F4] p-2.5 rounded border border-[#DFE3E1]">
                        {result.recommendation || 'Standard civil monitoring recommended.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Geographic & Corridor Data */}
                <div className="space-y-4 border border-[#DFE3E1] rounded-lg p-4 bg-white">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#505E63] font-semibold border-b border-[#DFE3E1] pb-2">
                    Location & Corridor Telemetry
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#505E63] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#114B44]" />
                        GPS Coordinates:
                      </span>
                      <span className="font-mono font-bold text-[#141D20]">
                        {result.latitude ? `${Number(result.latitude).toFixed(5)}°, ${Number(result.longitude).toFixed(5)}°` : 'Coordinates Recorded'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#505E63]">Road Classification:</span>
                      <span className="capitalize font-medium text-[#141D20]">{result.road_type?.replace(/_/g, ' ') || 'Main Road'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#505E63] flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-[#505E63]" />
                        Traffic Density:
                      </span>
                      <span className="capitalize font-medium text-[#141D20]">{result.traffic_level || 'High'} Traffic</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#505E63] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#505E63]" />
                        Submission Timestamp:
                      </span>
                      <span className="font-mono text-[#505E63]">
                        {result.created_at ? new Date(result.created_at).toLocaleString() : 'Recorded'}
                      </span>
                    </div>

                    {(result.city || result.area) && (
                      <div className="flex justify-between items-center pt-1 border-t border-[#DFE3E1]/70">
                        <span className="text-[#505E63]">Municipality / Area:</span>
                        <span className="font-medium text-[#141D20]">{[result.area, result.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Annotated Inspection Evidence */}
              {result.annotated_image_path && (
                <div className="space-y-2 pt-2 border-t border-[#DFE3E1]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#505E63] font-semibold">
                      Verified AI Inspection Imagery
                    </h4>
                    <span className="text-[11px] font-mono text-[#114B44] bg-[#EBF4F2] px-2 py-0.5 rounded border border-[#CCDCD8]">
                      Multi-Scale AI Overlay
                    </span>
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-[#DFE3E1] bg-black aspect-video sm:aspect-16/9 flex items-center justify-center">
                    <img
                      src={getImageUrl(result.annotated_image_path)}
                      alt="AI Annotated Road Surface Evidence"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 sm:p-6 bg-[#F8F7F4] border-t border-[#DFE3E1] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#505E63]">
                Need to report another road?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded border border-[#CCDCD8] bg-white hover:bg-[#F3F1EC] text-xs font-semibold text-[#141D20] transition-colors"
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={onStartInspection}
                  className="px-4 py-1.5 rounded bg-[#114B44] hover:bg-[#0D3833] text-xs font-semibold text-white transition-colors"
                >
                  Start New Inspection
                </button>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

