import React, { useState } from 'react';
import { 
  MapPin, 
  Sliders, 
  LocateFixed, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';

export default function ContextForm({
  context,
  setContext,
  conf,
  setConf,
  imgsz = 640,
  setImgsz,
  onAnalyze,
  isLoading,
  canAnalyze,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [geoStatus, setGeoStatus] = useState(
    context.latitude !== null && context.longitude !== null ? 'success' : 'idle'
  );
  const [geoError, setGeoError] = useState(null);

  const roadTypes = [
    { value: 'national_highway', label: 'National Highway (NH)', group: 'Major Highway' },
    { value: 'state_highway', label: 'State Highway (SH)', group: 'Major Highway' },
    { value: 'expressway', label: 'Expressway', group: 'Major Highway' },
    { value: 'major_arterial', label: 'Major Arterial Road', group: 'Urban Corridor' },
    { value: 'main_road', label: 'Main City Road', group: 'Urban Corridor' },
    { value: 'ring_road', label: 'Ring Road / Bypass', group: 'Urban Corridor' },
    { value: 'collector_road', label: 'Collector Road', group: 'Urban Corridor' },
    { value: 'commercial_road', label: 'Commercial Area Road', group: 'Urban Corridor' },
    { value: 'market_road', label: 'Market / Commercial Corridor', group: 'Urban Corridor' },
    { value: 'school_road', label: 'School Zone Route', group: 'Sensitive Facility' },
    { value: 'hospital_road', label: 'Hospital Access Route', group: 'Sensitive Facility' },
    { value: 'emergency_route', label: 'Emergency Service Corridor', group: 'Sensitive Facility' },
    { value: 'residential', label: 'Residential Street', group: 'Local Road' },
    { value: 'colony_road', label: 'Colony / Access Road', group: 'Local Road' },
    { value: 'rural_road', label: 'Rural / Feeder Road', group: 'Rural Road' },
    { value: 'other', label: 'Other Road Category', group: 'General' },
  ];

  const trafficLevels = [
    { value: 'very_high', label: 'Very High' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'very_low', label: 'Very Low' },
  ];

  const sensitivities = [
    { value: 'none', label: 'None (Standard Corridor)' },
    { value: 'school', label: 'School / Academic Zone' },
    { value: 'hospital', label: 'Hospital / Medical Facility' },
    { value: 'emergency_service', label: 'Emergency Service Route' },
    { value: 'railway_station', label: 'Railway / Transit Hub' },
    { value: 'bus_terminal', label: 'Bus Terminal' },
    { value: 'airport', label: 'Airport Access Corridor' },
    { value: 'market', label: 'Commercial Market Area' },
    { value: 'residential_area', label: 'Dense Residential Sector' },
    { value: 'government_office', label: 'Government / Civic Office' },
    { value: 'other', label: 'Other Sensitive Facility' },
  ];

  const hasCoords = (
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

  const handleGetCurrentLocation = () => {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError("Browser geolocation is not supported by your browser. Live GPS coordinates are mandatory to submit an inspection.");
      setContext(prev => ({
        ...prev,
        latitude: null,
        longitude: null,
        accuracy: null,
      }));
      return;
    }

    setGeoStatus('locating');

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const acc = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;

        setContext(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        }));

        setGeoStatus('success');
        setGeoError(null);
      },
      (error) => {
        let message = "Unable to retrieve live GPS location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. RoadWise requires live browser GPS to verify inspection coordinates. Please allow location permissions in your browser address bar/settings, then click 'Use My Current Location'.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "GPS position is unavailable. Please verify that your device's location/GPS services are enabled and try again.";
            break;
          case error.TIMEOUT:
            message = "GPS request timed out waiting for satellite/network fix. Please ensure you have a clear signal and click 'Use My Current Location' to retry.";
            break;
          default:
            message = error.message || "An unknown GPS location error occurred.";
        }
        setGeoStatus('error');
        setGeoError(message);
        // Clear coordinates to prevent invalid or partial submission
        setContext(prev => ({
          ...prev,
          latitude: null,
          longitude: null,
          accuracy: null,
        }));
      },
      options
    );
  };

  const handleClearLocation = () => {
    setContext(prev => ({
      ...prev,
      latitude: null,
      longitude: null,
      accuracy: null,
    }));
    setGeoStatus('idle');
    setGeoError(null);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onAnalyze(); }} className="space-y-4">
      
      {/* 1. Infrastructure Context Card */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] uppercase tracking-wider font-mono">
            <Compass className="w-3.5 h-3.5 text-[#114B44]" />
            <span>Infrastructure Context</span>
          </div>
          <span className="text-[10px] text-[#505E63] font-mono font-medium">Required</span>
        </div>

        {/* Road Type */}
        <div>
          <label className="block text-xs font-semibold text-[#141D20] mb-1">
            Road Classification <span className="text-rose-600">*</span>
          </label>
          <select
            value={context.road_type}
            onChange={(e) => setContext(prev => ({ ...prev, road_type: e.target.value }))}
            className="w-full px-3 py-2 rounded bg-white border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] font-sans cursor-pointer hover:border-[#CCDCD8]"
          >
            {roadTypes.map((item) => (
              <option key={item.value} value={item.value}>
                [{item.group}] {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Traffic Level */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#141D20]">
              Traffic Density <span className="text-rose-600">*</span>
            </label>
            <span className="text-[10px] text-[#505E63] uppercase font-mono font-medium">
              {context.traffic_level.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 p-1 rounded bg-[#F8F7F4] border border-[#DFE3E1]">
            {trafficLevels.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setContext(prev => ({ ...prev, traffic_level: t.value }))}
                className={`py-1.5 px-1 rounded text-[11px] font-semibold transition-all text-center focus-visible:ring-2 focus-visible:ring-[#114B44] ${
                  context.traffic_level === t.value
                    ? 'bg-[#114B44] text-white shadow-2xs'
                    : 'text-[#505E63] hover:text-[#141D20] hover:bg-[#EAE7E1]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Sensitivity */}
        <div>
          <label className="block text-xs font-semibold text-[#141D20] mb-1">
            Facility Proximity / Sensitivity <span className="text-rose-600">*</span>
          </label>
          <select
            value={context.location_sensitivity}
            onChange={(e) => setContext(prev => ({ ...prev, location_sensitivity: e.target.value }))}
            className="w-full px-3 py-2 rounded bg-white border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] font-sans cursor-pointer hover:border-[#CCDCD8]"
          >
            {sensitivities.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Geographic Location Card (Mandatory Live GPS) */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] uppercase tracking-wider font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#114B44]" />
            <span>Geographic Coordinates</span>
          </div>
          {hasCoords ? (
            <span className="text-[10px] text-emerald-800 bg-[#EBF4F2] px-2 py-0.5 rounded border border-[#CCDCD8] font-mono font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-[#114B44]" />
              <span>GPS Verified</span>
            </span>
          ) : (
            <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono font-bold">
              Mandatory *
            </span>
          )}
        </div>

        {/* Location Action Button */}
        <div>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoStatus === 'locating'}
            className={`w-full py-2.5 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-2 transition-all border focus-visible:ring-2 focus-visible:ring-[#114B44] ${
              geoStatus === 'locating'
                ? 'bg-[#EBF4F2] text-[#114B44] border-[#CCDCD8] cursor-wait'
                : hasCoords
                ? 'bg-[#F8F7F4] hover:bg-[#EBF4F2] text-[#114B44] border-[#CCDCD8]'
                : 'bg-[#114B44] hover:bg-[#0D3833] text-white border-transparent shadow-xs'
            }`}
          >
            <LocateFixed className={`w-4 h-4 ${geoStatus === 'locating' ? 'animate-spin' : ''}`} />
            <span>
              {geoStatus === 'locating'
                ? 'Acquiring Live GPS Coordinates...'
                : hasCoords
                ? 'Update / Refresh GPS Location'
                : 'Use My Current Location'}
            </span>
          </button>
        </div>

        {/* Active Coordinates Display */}
        {hasCoords && (
          <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-emerald-900 font-bold font-mono text-[11px] uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Live GPS Location Acquired</span>
              </div>
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-[11px] text-rose-700 hover:text-rose-900 underline font-mono font-semibold"
                title="Clear current coordinates"
              >
                Clear
              </button>
            </div>
            <div className="font-mono text-xs text-emerald-950 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <span><strong>Lat:</strong> {Number(context.latitude).toFixed(6)}°</span>
              <span><strong>Lng:</strong> {Number(context.longitude).toFixed(6)}°</span>
              {context.accuracy && (
                <span className="text-emerald-700 text-[11px]">
                  (±{context.accuracy}m accuracy)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Geolocation Error Message */}
        {geoError && (
          <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-xs text-rose-900 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-rose-950 text-[11px] uppercase font-mono">
                    GPS Location Required
                  </span>
                  <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                    {geoError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeoError(null)}
                className="text-xs text-rose-600 hover:text-rose-900 font-bold ml-1"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Administrative Region Inputs (Supplementary Context Only) */}
        <div className="pt-2 border-t border-[#DFE3E1] space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-[#141D20] uppercase font-mono tracking-wider">
              Administrative Region
            </label>
            <span className="text-[10px] text-[#79888E] font-mono">Supplementary Context</span>
          </div>
          <p className="text-[10px] text-[#505E63] leading-relaxed">
            Optional regional metadata for reporting. Does not substitute for mandatory GPS coordinates.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">City (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={context.city || ''}
                onChange={(e) => setContext(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] placeholder:text-[#A3B1AC]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">State (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Karnataka"
                value={context.state || ''}
                onChange={(e) => setContext(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] placeholder:text-[#A3B1AC]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">Area / Ward (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Ward 150"
                value={context.area || ''}
                onChange={(e) => setContext(prev => ({ ...prev, area: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] placeholder:text-[#A3B1AC]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Advanced Detection Calibration */}
      <div className="p-3 rounded-lg bg-white border border-[#DFE3E1] space-y-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#505E63] hover:text-[#114B44] transition-colors focus-visible:ring-2 focus-visible:ring-[#114B44]"
        >
          <div className="flex items-center space-x-1.5 font-mono">
            <Sliders className="w-3.5 h-3.5 text-[#114B44]" />
            <span>YOLOv8 Detection Confidence Threshold</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold text-[#114B44]">{conf.toFixed(2)}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="pt-2.5 border-t border-[#DFE3E1] space-y-3">
            {/* Confidence Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#141D20]">
                <span>Confidence Threshold</span>
                <span className="font-mono text-[#114B44] font-bold">{conf.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={conf}
                onChange={(e) => setConf(parseFloat(e.target.value))}
                className="w-full accent-[#114B44] cursor-pointer h-1.5 bg-[#EAE7E1] rounded"
              />
              <div className="flex justify-between text-[10px] text-[#505E63] font-mono">
                <span>0.10 (High Recall)</span>
                <span>0.25 (Default)</span>
                <span>0.80 (High Precision)</span>
              </div>
            </div>

            {/* Inference Resolution (imgsz) */}
            {setImgsz && (
              <div className="pt-2 border-t border-[#DFE3E1] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#141D20]">
                  <span>Inference Resolution</span>
                  <span className="font-mono text-[#114B44] font-bold">{imgsz} px</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 640, label: '640 px', desc: 'Standard' },
                    { val: 960, label: '960 px', desc: 'Enhanced' },
                    { val: 1280, label: '1280 px', desc: 'High Detail' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.val}
                      onClick={() => setImgsz(opt.val)}
                      className={`py-1.5 px-2 rounded border text-center transition-all ${
                        imgsz === opt.val
                          ? 'bg-[#114B44] text-white border-[#114B44] shadow-2xs font-semibold'
                          : 'bg-[#F8F7F4] text-[#505E63] border-[#DFE3E1] hover:bg-[#F3F1EC]'
                      }`}
                    >
                      <div className="text-[11px] font-mono leading-none">{opt.label}</div>
                      <div className={`text-[9px] mt-0.5 ${imgsz === opt.val ? 'text-white/80' : 'text-[#79888E]'}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#505E63] leading-tight">
                  640px is the model's native training resolution. Higher resolutions scale the input canvas for large images.
                </p>
              </div>
            )}
          </div>
        )}
      </div>


      {/* 4. Primary Inspection Execution Button */}
      <button
        type="submit"
        disabled={!canAnalyze || isLoading}
        className={`w-full py-3 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#114B44] ${
          !canAnalyze || isLoading
            ? 'bg-[#EAE7E1] text-[#79888E] border border-[#DFE3E1] cursor-not-allowed'
            : 'bg-[#114B44] hover:bg-[#0D3833] active:bg-[#0A2A26] text-white'
        }`}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing Road Inspection Pipeline...</span>
          </>
        ) : !hasCoords ? (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Run Road Inspection</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Run Road Inspection</span>
          </>
        )}
      </button>

    </form>
  );
}
