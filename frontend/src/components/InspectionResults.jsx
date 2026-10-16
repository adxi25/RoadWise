import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  RotateCcw, 
  Eye, 
  Columns2, 
  FileText, 
  Maximize2, 
  X,
  MapPin, 
  Calendar, 
  ShieldAlert,
  Layers,
  Info
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import PriorityBadge from './PriorityBadge';
import { getImageUrl } from '../api/client';

export default function InspectionResults({ result, onReset }) {
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated' | 'original' | 'split'
  const [copied, setCopied] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  if (!result) return null;

  const {
    report_id,
    inspection_id,
    image,
    location,
    context,
    detections = [],
    detection_summary = {},
    condition = {},
    risk = {},
    priority = {},
    recommendation = "",
    created_at,
  } = result;

  const originalUrl = getImageUrl(image?.original_path);
  const annotatedUrl = getImageUrl(image?.annotated_path);

  const handleCopyReportId = () => {
    navigator.clipboard.writeText(report_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const damageClassBadges = {
    D40: { label: 'Pothole', bg: 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]' },
    D20: { label: 'Alligator Crack', bg: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]' },
    D10: { label: 'Transverse Crack', bg: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' },
    D00: { label: 'Longitudinal Crack', bg: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' },
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[#505E63] font-bold">REPORT:</span>
            <span className="text-xs font-mono font-bold text-[#114B44] bg-[#EBF4F2] px-2 py-0.5 rounded border border-[#CCDCD8]">
              {report_id}
            </span>
            <button
              type="button"
              onClick={handleCopyReportId}
              className="p-1 rounded bg-[#F8F7F4] hover:bg-[#F3F1EC] border border-[#DFE3E1] text-[#505E63] hover:text-[#141D20] text-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#114B44]"
              title="Copy Report ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {inspection_id && (
              <span className="text-[11px] font-mono text-[#79888E]">
                (Record #{inspection_id})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#505E63] font-mono pt-0.5">
            {location?.city && (
              <span className="flex items-center space-x-1 text-[#141D20]">
                <MapPin className="w-3.5 h-3.5 text-[#114B44]" />
                <span className="font-semibold">{location.city}{location.state ? `, ${location.state}` : ''}</span>
              </span>
            )}
            <span className="capitalize">{context?.road_type?.replace(/_/g, ' ')}</span>
            <span className="capitalize">{context?.traffic_level?.replace(/_/g, ' ')} traffic</span>
            {created_at && (
              <span className="flex items-center space-x-1 text-[#79888E]">
                <Calendar className="w-3 h-3" />
                <span>{new Date(created_at).toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded bg-[#114B44] hover:bg-[#0D3833] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-stretch sm:self-auto justify-center shadow-2xs focus-visible:ring-2 focus-visible:ring-[#114B44]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Inspection</span>
        </button>
      </div>

      {/* 2. Top Grid: Road Image Viewer & Score Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Road Image Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-2xs">
            
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] uppercase tracking-wider font-mono">
                <Eye className="w-3.5 h-3.5 text-[#114B44]" />
                <span>Road Surface Imagery</span>
              </div>

              <div className="flex items-center space-x-1 bg-[#F8F7F4] p-1 rounded border border-[#DFE3E1] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('annotated')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                    viewMode === 'annotated'
                      ? 'bg-[#114B44] text-white shadow-2xs'
                      : 'text-[#505E63] hover:text-[#141D20]'
                  }`}
                >
                  AI Annotated ({detections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                    viewMode === 'original'
                      ? 'bg-[#114B44] text-white shadow-2xs'
                      : 'text-[#505E63] hover:text-[#141D20]'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all hidden sm:block focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                    viewMode === 'split'
                      ? 'bg-[#114B44] text-white shadow-2xs'
                      : 'text-[#505E63] hover:text-[#141D20]'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Main Image Display Area */}
            <div className="relative rounded bg-[#141D20] border border-[#DFE3E1] min-h-[380px] max-h-[560px] flex items-center justify-center overflow-hidden">
              
              {viewMode === 'annotated' && (
                <div className="relative w-full h-full flex items-center justify-center p-1">
                  <img
                    src={annotatedUrl || originalUrl}
                    alt="AI Annotated road defects"
                    className="max-h-[540px] w-auto max-w-full object-contain rounded"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#141D20]/90 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    YOLOv8 Detection Overlay
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(annotatedUrl || originalUrl)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#141D20]/90 hover:bg-[#141D20] border border-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
                    title="Fullscreen view"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {viewMode === 'original' && (
                <div className="relative w-full h-full flex items-center justify-center p-1">
                  <img
                    src={originalUrl}
                    alt="Original road inspection photo"
                    className="max-h-[540px] w-auto max-w-full object-contain rounded"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#141D20]/90 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    Original Camera Source
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(originalUrl)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#141D20]/90 hover:bg-[#141D20] border border-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
                    title="Fullscreen view"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {viewMode === 'split' && (
                <div className="grid grid-cols-2 gap-2 p-2 w-full h-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/80 block">Original</span>
                    <div className="bg-[#000000] border border-white/10 rounded p-1 flex items-center justify-center min-h-[300px]">
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="max-h-[340px] w-auto max-w-full object-contain rounded"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 block font-bold">Annotated</span>
                    <div className="bg-[#000000] border border-white/10 rounded p-1 flex items-center justify-center min-h-[300px]">
                      <img
                        src={annotatedUrl}
                        alt="Annotated"
                        className="max-h-[340px] w-auto max-w-full object-contain rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Right: Scores, Priority & Operational Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Action Priority Card */}
          <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5 shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#505E63] font-bold block">
              Calculated Maintenance Priority
            </span>
            <PriorityBadge
              priority={priority.level || risk.maintenance_priority}
              size="lg"
              description={priority.description || risk.priority_description}
            />
          </div>

          {/* Twin Score Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ScoreGauge
              score={condition.condition_score ?? 100}
              title="ROAD CONDITION"
              type="condition"
              subtitle="Exponential decay model based on detected defect load"
            />
            <ScoreGauge
              score={risk.risk_score ?? 0}
              title="MAINTENANCE RISK"
              type="risk"
              subtitle="Combines damage load with road category and sensitive facility weight"
            />
          </div>

          {/* Risk Factors Breakdown */}
          <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5 text-xs shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#505E63] font-bold block">
              Scoring Telemetry
            </span>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#DFE3E1] text-[#505E63]">
                <span>Calculated Damage Load:</span>
                <span className="text-[#141D20] font-bold">{condition.damage_load ?? 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DFE3E1] text-[#505E63]">
                <span>Damage Level (Stretched):</span>
                <span className="text-[#141D20] font-bold">{risk.damage_level ?? 0} / 100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DFE3E1] text-[#505E63]">
                <span>Context Multiplier:</span>
                <span className="text-[#114B44] font-bold">{risk.context_factor ? `${risk.context_factor.toFixed(2)}x` : '1.00x'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DFE3E1] text-[#505E63]">
                <span>Facility Sensitivity:</span>
                <span className="text-[#141D20] font-sans capitalize font-medium">{context.location_sensitivity?.replace(/_/g, ' ')}</span>
              </div>
              {location?.latitude && location?.longitude && (
                <div className="flex justify-between py-1 text-[#505E63]">
                  <span>GPS Coordinates:</span>
                  <span className="text-[#141D20] font-bold">{Number(location.latitude).toFixed(6)}°, {Number(location.longitude).toFixed(6)}°</span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Guidance Box */}
          <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-1.5 text-xs shadow-2xs">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#141D20] uppercase font-mono">
              <FileText className="w-3.5 h-3.5 text-[#114B44]" />
              <span>Operational Guidance</span>
            </div>
            <p className="text-[#505E63] leading-relaxed font-sans text-xs">
              {recommendation}
            </p>
          </div>

        </div>

      </div>

      {/* 3. Dedicated Defect Telemetry Table */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] uppercase tracking-wider font-mono">
            <Layers className="w-3.5 h-3.5 text-[#114B44]" />
            <span>Detected Defect Telemetry</span>
          </div>
          <span className="text-[11px] font-mono text-[#505E63] font-semibold">
            Total Detections: {detections.length}
          </span>
        </div>

        {detections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#DFE3E1] text-[#505E63] text-[11px] bg-[#F8F7F4]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Damage Type</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Relative Box Size (W × H)</th>
                  <th className="py-2.5 px-3">Center (X, Y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE3E1]">
                {detections.map((d, idx) => {
                  const badge = damageClassBadges[d.class_code] || { label: d.class_name, bg: 'bg-[#F8F7F4] text-[#141D20] border-[#DFE3E1]' };
                  const isHighlighted = highlightedIndex === idx;

                  return (
                    <tr
                      key={idx}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseLeave={() => setHighlightedIndex(null)}
                      className={`transition-colors cursor-default ${
                        isHighlighted ? 'bg-[#EBF4F2]' : 'hover:bg-[#F8F7F4]'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#79888E] font-mono font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${badge.bg}`}>
                          {d.class_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#141D20] capitalize font-sans">
                        {d.class_name.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#114B44]">
                        {(d.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-[#505E63]">
                        {(d.width * 100).toFixed(1)}% × {(d.height * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-[#79888E] text-[11px]">
                        ({d.x_center.toFixed(3)}, {d.y_center.toFixed(3)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#141D20]">
              <Info className="w-4 h-4 text-[#114B44] flex-shrink-0" />
              <span>No road surface defects detected above confidence threshold</span>
            </div>
            <p className="text-xs text-[#505E63] leading-relaxed">
              <strong className="text-[#141D20]">Model Limitations Notice:</strong> Zero model detections indicates that no trained defect features met the confidence threshold in this frame. It does <em>not</em> guarantee that the road is undamaged or physically safe. Faint cracks, low-contrast potholes, or defects obscured by shade or distance may be missed. Certified field inspection remains necessary.
            </p>
          </div>
        )}
      </div>

      {/* 4. Prototype Disclaimer Notice */}
      <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] text-xs text-[#62737A] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#114B44] flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#141D20] font-semibold">Decision-Support Notice:</strong> The condition score, risk index, and priority rating are project-defined calculations intended to assist engineering triage based on detected distress. Zero model detections does not certify physical road safety. Qualified on-site verification is advised before allocating repair resources.
        </p>
      </div>

      {/* Fullscreen Zoom Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded bg-white text-[#141D20] hover:bg-[#F3F1EC] focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullscreenImage}
              alt="Fullscreen high-res inspection"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded border border-white/20"
            />
          </div>
        </div>
      )}

    </div>
  );
}
