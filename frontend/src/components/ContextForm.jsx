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
  Edit3,
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
  const [showManualCoords, setShowManualCoords] = useState(false);

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

  const handleGetCurrentLocation = () => {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError("Geolocation is not supported by your browser. Please enter coordinates manually.");
      return;
    }

    setGeoStatus('locating');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        setContext(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        setGeoStatus('success');
        setShowManualCoords(false);
      },
      (error) => {
        let message = "Unable to retrieve location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please allow location access or enter coordinates manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Please enter coordinates manually.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please enter coordinates manually.";
            break;
          default:
            message = error.message || "An unknown location error occurred.";
        }
        setGeoStatus('error');
        setGeoError(message);
      },
      options
    );
  };

  const handleClearLocation = () => {
    setContext(prev => ({
      ...prev,
      latitude: null,
      longitude: null,
    }));
    setGeoStatus('idle');
    setGeoError(null);
  };

  const hasCoords = context.latitude !== null && context.latitude !== undefined && 
                    context.longitude !== null && context.longitude !== undefined;

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

      {/* 2. Geographic Location Card */}
      <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DFE3E1] pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#141D20] uppercase tracking-wider font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#114B44]" />
            <span>Geographic Coordinates</span>
          </div>
          <span className="text-[10px] text-[#505E63] font-mono">Optional</span>
        </div>

        {/* Location Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoStatus === 'locating'}
            className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border focus-visible:ring-2 focus-visible:ring-[#114B44] ${
              geoStatus === 'locating'
                ? 'bg-[#EBF4F2] text-[#114B44] border-[#CCDCD8] cursor-wait'
                : 'bg-[#F8F7F4] hover:bg-[#EBF4F2] text-[#114B44] border-[#DFE3E1]'
            }`}
          >
            <LocateFixed className={`w-3.5 h-3.5 ${geoStatus === 'locating' ? 'animate-spin' : ''}`} />
            <span>
              {geoStatus === 'locating' ? 'Acquiring GPS...' : 'Use My Current Location'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualCoords(!showManualCoords)}
            className="py-2 px-3 rounded bg-[#F8F7F4] hover:bg-[#F3F1EC] text-[#505E63] hover:text-[#141D20] border border-[#DFE3E1] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#114B44]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#79888E]" />
            <span>{showManualCoords ? 'Hide Lat/Long' : 'Enter Manually'}</span>
          </button>
        </div>

        {/* Active Coordinates Display */}
        {hasCoords && (
          <div className="p-2.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-xs flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span className="font-mono text-[11px] text-emerald-900 font-bold">
                Lat: {Number(context.latitude).toFixed(6)}°, Lng: {Number(context.longitude).toFixed(6)}°
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-[11px] text-rose-700 hover:text-rose-900 underline font-mono ml-auto font-semibold"
            >
              Clear
            </button>
          </div>
        )}

        {/* Geolocation Error Message */}
        {geoError && (
          <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECDD3] text-xs text-rose-800 flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">{geoError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              className="text-xs text-rose-600 hover:text-rose-900 ml-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Manual Coordinates Input */}
        {showManualCoords && (
          <div className="p-3 rounded bg-[#F8F7F4] border border-[#DFE3E1] space-y-2">
            <span className="text-[10px] text-[#505E63] uppercase font-mono font-semibold block">
              Decimal Degrees (WGS 84)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g. 12.971598"
                  value={context.latitude !== null && context.latitude !== undefined ? context.latitude : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContext(prev => ({ ...prev, latitude: val === '' ? null : parseFloat(val) }));
                    if (val !== '') setGeoStatus('success');
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-[#DFE3E1] text-[#141D20] text-xs font-mono focus-visible:ring-2 focus-visible:ring-[#114B44]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">Longitude (-180 to 180)</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g. 77.594562"
                  value={context.longitude !== null && context.longitude !== undefined ? context.longitude : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContext(prev => ({ ...prev, longitude: val === '' ? null : parseFloat(val) }));
                    if (val !== '') setGeoStatus('success');
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-[#DFE3E1] text-[#141D20] text-xs font-mono focus-visible:ring-2 focus-visible:ring-[#114B44]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Administrative Region Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#DFE3E1]">
          <div>
            <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">City</label>
            <input
              type="text"
              placeholder="e.g. Bengaluru"
              value={context.city || ''}
              onChange={(e) => setContext(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] placeholder:text-[#A3B1AC]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">State</label>
            <input
              type="text"
              placeholder="e.g. Karnataka"
              value={context.state || ''}
              onChange={(e) => setContext(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[#141D20] text-xs focus-visible:ring-2 focus-visible:ring-[#114B44] placeholder:text-[#A3B1AC]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#505E63] mb-0.5">Area / Ward</label>
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
