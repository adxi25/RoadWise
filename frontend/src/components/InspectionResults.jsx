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
  AlertTriangle,
  Layers
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
    D40: { label: 'Pothole', bg: 'bg-rose-950/60 text-rose-300 border-rose-600/40' },
    D20: { label: 'Alligator Crack', bg: 'bg-orange-950/60 text-orange-300 border-orange-500/40' },
    D10: { label: 'Transverse Crack', bg: 'bg-amber-950/60 text-amber-300 border-amber-500/40' },
    D00: { label: 'Longitudinal Crack', bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40' },
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 font-semibold">REPORT:</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {report_id}
            </span>
            <button
              type="button"
              onClick={handleCopyReportId}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Copy Report ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {inspection_id && (
              <span className="text-[11px] font-mono text-slate-500">
                (Record #{inspection_id})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono pt-0.5">
            {location?.city && (
              <span className="flex items-center space-x-1 text-slate-300">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{location.city}{location.state ? `, ${location.state}` : ''}</span>
              </span>
            )}
            <span className="capitalize">{context?.road_type?.replace(/_/g, ' ')}</span>
            <span className="capitalize">{context?.traffic_level?.replace(/_/g, ' ')} traffic</span>
            {created_at && (
              <span className="flex items-center space-x-1 text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(created_at).toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-stretch sm:self-auto justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>New Inspection</span>
        </button>
      </div>

      {/* 2. Top Grid: High-Resolution Road Image Viewer & Score Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Road Image Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Road Imagery Viewer</span>
              </div>

              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('annotated')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'annotated'
                      ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Annotated ({detections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'original'
                      ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors hidden sm:block ${
                    viewMode === 'split'
                      ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Main Image Display Area (Strict Aspect Ratio Preservation) */}
            <div className="relative rounded-lg overflow-hidden bg-black border border-slate-800 min-h-[380px] max-h-[560px] flex items-center justify-center">
              
              {viewMode === 'annotated' && (
                <div className="relative w-full h-full flex items-center justify-center p-1">
                  <img
                    src={annotatedUrl || originalUrl}
                    alt="AI Annotated road defects"
                    className="max-h-[540px] w-auto max-w-full object-contain rounded"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400">
                    YOLOv8 Detection Overlay
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(annotatedUrl || originalUrl)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
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
                  <div className="absolute top-2.5 left-2.5 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                    Original Camera Source
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(originalUrl)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Fullscreen view"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {viewMode === 'split' && (
                <div className="grid grid-cols-2 gap-2 p-2 w-full h-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block">Original</span>
                    <div className="bg-slate-950 border border-slate-800 rounded p-1 flex items-center justify-center min-h-[300px]">
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="max-h-[340px] w-auto max-w-full object-contain rounded"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 block">Annotated</span>
                    <div className="bg-slate-950 border border-slate-800 rounded p-1 flex items-center justify-center min-h-[300px]">
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
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              Maintenance Priority
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
              subtitle="Risk combines detected damage with road classification and sensitivity"
            />
          </div>

          {/* Risk Factors Breakdown */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              Scoring Telemetry
            </span>

            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Calculated Damage Load:</span>
                <span className="text-slate-200 font-bold">{condition.damage_load ?? 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Damage Level (Stretched):</span>
                <span className="text-slate-200 font-bold">{risk.damage_level ?? 0} / 100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Context Multiplier:</span>
                <span className="text-cyan-400 font-bold">{risk.context_factor ? `${risk.context_factor.toFixed(2)}x` : '1.00x'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Location Sensitivity:</span>
                <span className="text-slate-200 font-sans capitalize">{context.location_sensitivity?.replace(/_/g, ' ')}</span>
              </div>
              {location?.latitude && location?.longitude && (
                <div className="flex justify-between py-1 text-slate-400">
                  <span>GPS Coordinates:</span>
                  <span className="text-slate-200">{Number(location.latitude).toFixed(6)}°, {Number(location.longitude).toFixed(6)}°</span>
                </div>
              )}
            </div>
          </div>

          {/* Actionable Guidance Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 uppercase font-mono">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Operational Guidance</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {recommendation}
            </p>
          </div>

        </div>

      </div>

      {/* 3. Dedicated Defect Telemetry Table */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Detected Defect Telemetry</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Total Detections: {detections.length}
          </span>
        </div>

        {detections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Class</th>
                  <th className="py-2 px-3">Damage Type</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Relative Box Size (W × H)</th>
                  <th className="py-2 px-3">Center (X, Y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {detections.map((d, idx) => {
                  const badge = damageClassBadges[d.class_code] || { label: d.class_name, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
                  const isHighlighted = highlightedIndex === idx;

                  return (
                    <tr
                      key={idx}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseLeave={() => setHighlightedIndex(null)}
                      className={`transition-colors cursor-default ${
                        isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${badge.bg}`}>
                          {d.class_code}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-200 capitalize font-sans">
                        {d.class_name.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 px-3 font-bold text-cyan-400">
                        {(d.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {(d.width * 100).toFixed(1)}% × {(d.height * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        ({d.x_center.toFixed(3)}, {d.y_center.toFixed(3)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>No road surface defects detected above the confidence threshold.</span>
          </div>
        )}
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
              className="absolute -top-10 right-0 p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullscreenImage}
              alt="Fullscreen high-res inspection"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg border border-slate-700"
            />
          </div>
        </div>
      )}

    </div>
  );
}
