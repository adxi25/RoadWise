import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Layers,
  ExternalLink,
  Cpu,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  FileText,
} from 'lucide-react';
import { getInspectionById, getImageUrl } from '../../api/client';

const PRIORITY_BADGES = {
  CRITICAL: 'bg-[#FEF2F2] border-[#FECDD3] text-[#991B1B]',
  HIGH: 'bg-[#FFF7ED] border-[#FED7AA] text-[#C2410C]',
  MEDIUM: 'bg-[#FEFCE8] border-[#FEF08A] text-[#854D0E]',
  LOW: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
};

const ROAD_TYPE_LABELS = {
  national_highway: 'National Highway',
  main_road: 'Main Road',
  secondary_road: 'Secondary Road',
  residential: 'Residential Street',
  rural_road: 'Rural Road',
};

const TRAFFIC_LABELS = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  very_low: 'Very Low',
};

const SENSITIVITY_LABELS = {
  school: 'School Zone',
  hospital: 'Hospital Zone',
  market: 'Commercial / Market Zone',
  residential: 'Residential Area',
  none: 'Standard / None',
};

export default function InspectionDetailModal({ inspection, onClose }) {
  const [detail, setDetail] = useState(inspection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeImageTab, setActiveImageTab] = useState('annotated'); // 'annotated' | 'original'
  const [annotatedImgError, setAnnotatedImgError] = useState(false);
  const [originalImgError, setOriginalImgError] = useState(false);

  useEffect(() => {
    if (!inspection?.id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getInspectionById(inspection.id)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load full inspection details:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load complete inspection details.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inspection?.id]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!inspection) return null;

  const priority = (detail?.priority || inspection?.priority || 'LOW').toUpperCase();
  const badgeClass = PRIORITY_BADGES[priority] || PRIORITY_BADGES.LOW;

  const lat = Number(detail?.latitude ?? inspection?.latitude);
  const lng = Number(detail?.longitude ?? inspection?.longitude);
  const hasGps = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const originalUrl = getImageUrl(detail?.image_path || inspection?.image_path);
  const annotatedUrl = getImageUrl(detail?.annotated_image_path || inspection?.annotated_image_path);

  const detections = detail?.detections || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div
        className="relative bg-white w-full max-w-4xl rounded-lg border border-[#DFE3E1] shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#DFE3E1] bg-[#F8F7F4] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm sm:text-base text-[#141D20]">
                {detail?.report_id || inspection?.report_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold font-mono uppercase tracking-wider ${badgeClass}`}
              >
                {priority} Priority
              </span>
            </div>
            <div className="text-xs text-[#505E63] font-mono flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-[#79888E]" />
              <span>Inspected: {formatDate(detail?.created_at || inspection?.created_at)}</span>
              <span>•</span>
              <span>Database Record #{detail?.id || inspection?.id}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#505E63] hover:text-[#141D20] hover:bg-[#EAE7E1] transition-colors cursor-pointer"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-700" />
              <span>Full detections query notice: {error} (Displaying stored telemetry).</span>
            </div>
          )}

          {/* Top Telemetry KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-[#505E63]">
                Condition Score
              </div>
              <div className="text-xl font-bold font-sans text-[#141D20]">
                {detail?.condition_score !== null && detail?.condition_score !== undefined
                  ? Number(detail.condition_score).toFixed(1)
                  : '—'}
                <span className="text-xs text-[#79888E] font-normal ml-0.5">/100</span>
              </div>
              <div className="text-[10px] text-[#79888E] font-mono">
                Structural health
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-[#505E63]">
                Maintenance Risk
              </div>
              <div className="text-xl font-bold font-sans text-[#141D20]">
                {detail?.risk_score !== null && detail?.risk_score !== undefined
                  ? Number(detail.risk_score).toFixed(1)
                  : '—'}
                <span className="text-xs text-[#79888E] font-normal ml-0.5">/100</span>
              </div>
              <div className="text-[10px] text-[#79888E] font-mono">
                Urgency factor
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-[#505E63]">
                Defect Objects
              </div>
              <div className="text-xl font-bold font-sans text-[#141D20]">
                {detections.length || detail?.detection_count || 0}
              </div>
              <div className="text-[10px] text-[#79888E] font-mono">
                Detected road distresses
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-[#505E63]">
                Priority Band
              </div>
              <div className="text-base font-bold font-mono text-[#141D20] pt-0.5">
                {priority}
              </div>
              <div className="text-[10px] text-[#79888E] font-mono">
                Operational queue
              </div>
            </div>
          </div>

          {/* Operational Recommendation Banner */}
          {detail?.recommendation && (
            <div className="p-4 rounded-lg bg-[#F8F7F4] border border-[#DFE3E1] space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold font-mono text-[#141D20] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-[#114B44]" />
                <span>Operational Guidance & Recommendation</span>
              </div>
              <p className="text-xs text-[#505E63] leading-relaxed">
                {detail.recommendation}
              </p>
            </div>
          )}

          {/* Location & Road Environmental Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Location Telemetry */}
            <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5">
              <div className="flex items-center space-x-2 border-b border-[#DFE3E1] pb-2 text-xs font-bold text-[#141D20] font-mono uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#114B44]" />
                <span>Geospatial & Administrative Telemetry</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#505E63]">City / Municipality:</span>
                  <span className="font-semibold text-[#141D20] font-mono">{detail?.city || 'Unspecified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#505E63]">Area / Neighborhood:</span>
                  <span className="font-semibold text-[#141D20] font-mono">{detail?.area || 'Unspecified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#505E63]">State / Province:</span>
                  <span className="font-semibold text-[#141D20] font-mono">{detail?.state || 'Unspecified'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#DFE3E1]">
                  <span className="text-[#505E63]">GPS Coordinates:</span>
                  {hasGps ? (
                    <div className="flex items-center space-x-2 font-mono text-[11px] font-semibold text-[#114B44]">
                      <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center space-x-0.5 text-[#114B44]"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-[#79888E] italic font-mono text-[11px]">No GPS recorded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Environmental & Asset Calibration */}
            <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5">
              <div className="flex items-center space-x-2 border-b border-[#DFE3E1] pb-2 text-xs font-bold text-[#141D20] font-mono uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#114B44]" />
                <span>Asset & Environmental Calibration</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#505E63]">Road Classification:</span>
                  <span className="font-semibold text-[#141D20] font-mono">
                    {ROAD_TYPE_LABELS[detail?.road_type] || detail?.road_type || 'Main Road'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#505E63]">Traffic Volume Level:</span>
                  <span className="font-semibold text-[#141D20] font-mono">
                    {TRAFFIC_LABELS[detail?.traffic_level] || detail?.traffic_level || 'High'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#505E63]">Facility Sensitivity:</span>
                  <span className="font-semibold text-[#141D20] font-mono">
                    {SENSITIVITY_LABELS[detail?.location_sensitivity] || detail?.location_sensitivity || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#DFE3E1]">
                  <span className="text-[#505E63]">Calibration Status:</span>
                  <span className="text-emerald-700 font-mono text-[11px] font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Exponential Decay Calibrated</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Defect Detection Breakdown */}
          <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3">
            <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] font-mono uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-[#114B44]" />
                <span>Detected Distress Manifestations ({detections.length})</span>
              </div>
              <span className="text-[11px] font-mono text-[#505E63]">
                YOLOv8 Inference Telemetry
              </span>
            </div>

            {detections.length === 0 ? (
              <div className="py-5 text-center text-[#505E63] text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="font-semibold text-[#141D20]">No structural surface distress detected</p>
                <p className="text-[11px] text-[#79888E]">
                  This image passed AI inference without exceeding confidence thresholds.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DFE3E1] text-[#79888E] font-mono text-[10px] uppercase">
                      <th className="py-1.5 px-2">Defect Class</th>
                      <th className="py-1.5 px-2">Code</th>
                      <th className="py-1.5 px-2 text-right">Confidence</th>
                      <th className="py-1.5 px-2 text-right">Bounding Box (x, y, w, h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFE3E1] font-mono">
                    {detections.map((d, index) => (
                      <tr key={d.id || index} className="hover:bg-[#F8F7F4]">
                        <td className="py-2 px-2 font-sans font-semibold text-[#141D20]">
                          {d.class_name || 'Road Defect'}
                        </td>
                        <td className="py-2 px-2 text-[#505E63]">
                          <span className="px-1.5 py-0.5 rounded bg-[#F3F1EC] text-[10px] border border-[#DFE3E1]">
                            {d.class_code || 'D40'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-[#114B44]">
                          {d.confidence ? `${(Number(d.confidence) * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-[11px] text-[#79888E]">
                          {d.x_center !== null && d.x_center !== undefined
                            ? `(${Number(d.x_center).toFixed(2)}, ${Number(d.y_center).toFixed(2)}, ${Number(d.width).toFixed(2)}, ${Number(d.height).toFixed(2)})`
                            : 'Relative normalized'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Visual Telemetry (Photographs) */}
          <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE3E1] pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] font-mono uppercase tracking-wider">
                <ImageIcon className="w-3.5 h-3.5 text-[#114B44]" />
                <span>Visual Surface Evidence</span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center space-x-1 bg-[#F3F1EC] p-0.5 rounded border border-[#DFE3E1] text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setActiveImageTab('annotated')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeImageTab === 'annotated'
                      ? 'bg-white text-[#114B44] font-bold shadow-2xs'
                      : 'text-[#505E63] hover:text-[#141D20]'
                  }`}
                >
                  AI Annotated Bounding Boxes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('original')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeImageTab === 'original'
                      ? 'bg-white text-[#114B44] font-bold shadow-2xs'
                      : 'text-[#505E63] hover:text-[#141D20]'
                  }`}
                >
                  Original Photograph
                </button>
              </div>
            </div>

            {/* Image Preview Container */}
            <div className="relative bg-[#141D20] rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] max-h-[460px]">
              {activeImageTab === 'annotated' ? (
                annotatedUrl && !annotatedImgError ? (
                  <img
                    src={annotatedUrl}
                    alt="AI Annotated road defects"
                    className="max-h-[460px] w-auto max-w-full object-contain"
                    onError={() => setAnnotatedImgError(true)}
                  />
                ) : (
                  <div className="p-8 text-center text-white/70 space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-white/40" />
                    <p className="text-xs font-mono">Annotated image preview unavailable.</p>
                    <p className="text-[11px] text-white/50">Path: {detail?.annotated_image_path || 'Not specified'}</p>
                  </div>
                )
              ) : (
                originalUrl && !originalImgError ? (
                  <img
                    src={originalUrl}
                    alt="Original road photograph"
                    className="max-h-[460px] w-auto max-w-full object-contain"
                    onError={() => setOriginalImgError(true)}
                  />
                ) : (
                  <div className="p-8 text-center text-white/70 space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-white/40" />
                    <p className="text-xs font-mono">Original image file unavailable.</p>
                    <p className="text-[11px] text-white/50">Path: {detail?.image_path || 'Not specified'}</p>
                  </div>
                )
              )}
            </div>

            <div className="text-[11px] text-[#79888E] font-mono flex items-center justify-between">
              <span>Displaying {activeImageTab === 'annotated' ? 'YOLOv8 predicted bounding boxes' : 'source optical photograph'}.</span>
              {hasGps && (
                <span>GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#DFE3E1] bg-[#F8F7F4] flex items-center justify-between">
          <span className="text-[11px] text-[#79888E] font-mono">
            RoadWise Mode 2 Operational Telemetry
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white hover:bg-[#F3F1EC] border border-[#DFE3E1] text-[#141D20] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
