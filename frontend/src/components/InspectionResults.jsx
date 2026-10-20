import React, { useState, useEffect } from 'react';
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
  Info,
  ImageOff,
  AlertCircle
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import PriorityBadge from './PriorityBadge';
import { getImageUrl } from '../api/client';

export default function InspectionResults({ result, onReset }) {
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated' | 'original' | 'split'
  const [copied, setCopied] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  // Failure tracking for images
  const [annotatedError, setAnnotatedError] = useState(false);
  const [originalError, setOriginalError] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);

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

  const rawOriginal = image?.original_path || result?.image_path || result?.original_path;
  const rawAnnotated = image?.annotated_path || result?.annotated_image_path || result?.annotated_path;

  const originalUrl = getImageUrl(rawOriginal);
  const annotatedUrl = getImageUrl(rawAnnotated);

  useEffect(() => {
    setAnnotatedError(false);
    setOriginalError(false);
    setFullscreenError(false);
  }, [originalUrl, annotatedUrl]);

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
            {location?.latitude !== null && location?.latitude !== undefined &&
             location?.longitude !== null && location?.longitude !== undefined && (
              <span className="flex items-center space-x-1 text-[#114B44] font-bold bg-[#EBF4F2] px-2 py-0.5 rounded border border-[#CCDCD8]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{Number(location.latitude).toFixed(6)}°, {Number(location.longitude).toFixed(6)}°</span>
              </span>
            )}
            {location?.city && (
              <span className="flex items-center space-x-1 text-[#141D20]">
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
                  {annotatedUrl && !annotatedError ? (
                    <>
                      <img
                        src={annotatedUrl}
                        alt="AI Annotated road defects"
                        onError={() => setAnnotatedError(true)}
                        className="max-h-[540px] w-auto max-w-full object-contain rounded"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#141D20]/90 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        YOLOv8 Detection Overlay
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFullscreenError(false);
                          setFullscreenImage(annotatedUrl);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#141D20]/90 hover:bg-[#141D20] border border-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
                        title="Fullscreen view"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : originalUrl && !originalError ? (
                    <>
                      <img
                        src={originalUrl}
                        alt="Original road inspection photo (AI overlay unavailable)"
                        onError={() => setOriginalError(true)}
                        className="max-h-[540px] w-auto max-w-full object-contain rounded"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#141D20]/90 border border-amber-400/40 px-2 py-0.5 rounded text-[10px] font-mono text-amber-200 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span>AI Overlay Unavailable — Showing Source</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFullscreenError(false);
                          setFullscreenImage(originalUrl);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#141D20]/90 hover:bg-[#141D20] border border-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
                        title="Fullscreen view"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 text-[#79888E] min-h-[340px]">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                        <ImageOff className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Road Surface Imagery Unavailable</p>
                        <p className="text-xs text-white/60 max-w-sm">
                          The road inspection image could not be loaded from server storage. Detected defect telemetry and scoring formulas remain intact below.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'original' && (
                <div className="relative w-full h-full flex items-center justify-center p-1">
                  {originalUrl && !originalError ? (
                    <>
                      <img
                        src={originalUrl}
                        alt="Original road inspection photo"
                        onError={() => setOriginalError(true)}
                        className="max-h-[540px] w-auto max-w-full object-contain rounded"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#141D20]/90 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        Original Camera Source
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFullscreenError(false);
                          setFullscreenImage(originalUrl);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#141D20]/90 hover:bg-[#141D20] border border-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
                        title="Fullscreen view"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 text-[#79888E] min-h-[340px]">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                        <ImageOff className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Original Photo Unavailable</p>
                        <p className="text-xs text-white/60 max-w-sm">
                          The original road photograph could not be retrieved from the server.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'split' && (
                <div className="grid grid-cols-2 gap-2 p-2 w-full h-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/80 block">Original</span>
                    <div className="bg-[#000000] border border-white/10 rounded p-1 flex items-center justify-center min-h-[300px]">
                      {originalUrl && !originalError ? (
                        <img
                          src={originalUrl}
                          alt="Original"
                          onError={() => setOriginalError(true)}
                          className="max-h-[340px] w-auto max-w-full object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 text-white/50">
                          <ImageOff className="w-5 h-5 text-white/40" />
                          <span className="text-[11px] font-mono">Original unavailable</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 block font-bold">Annotated</span>
                    <div className="bg-[#000000] border border-white/10 rounded p-1 flex items-center justify-center min-h-[300px]">
                      {annotatedUrl && !annotatedError ? (
                        <img
                          src={annotatedUrl}
                          alt="Annotated"
                          onError={() => setAnnotatedError(true)}
                          className="max-h-[340px] w-auto max-w-full object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 text-white/50">
                          <ImageOff className="w-5 h-5 text-white/40" />
                          <span className="text-[11px] font-mono">Annotated overlay unavailable</span>
                        </div>
                      )}
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
              {location?.latitude !== null && location?.latitude !== undefined &&
               location?.longitude !== null && location?.longitude !== undefined && (
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
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded bg-white text-[#141D20] hover:bg-[#F3F1EC] focus-visible:ring-2 focus-visible:ring-white"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            {fullscreenError ? (
              <div className="p-8 rounded bg-[#141D20] border border-white/20 text-center text-white space-y-3">
                <ImageOff className="w-8 h-8 text-white/50 mx-auto" />
                <p className="text-sm font-semibold">Image Preview Unavailable</p>
                <p className="text-xs text-white/60">The high-resolution image could not be loaded.</p>
              </div>
            ) : (
              <img
                src={fullscreenImage}
                alt="Fullscreen high-res inspection"
                onError={() => setFullscreenError(true)}
                className="max-h-[85vh] w-auto max-w-full object-contain rounded border border-white/20"
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
}
