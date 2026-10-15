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
    { value: 'national_highway', label: 'National Highway (NH)', group: 'Major' },
    { value: 'state_highway', label: 'State Highway (SH)', group: 'Major' },
    { value: 'expressway', label: 'Expressway', group: 'Major' },
    { value: 'major_arterial', label: 'Major Arterial Road', group: 'Major' },
    { value: 'main_road', label: 'Main City Road', group: 'Urban' },
    { value: 'ring_road', label: 'Ring Road / Bypass', group: 'Urban' },
    { value: 'collector_road', label: 'Collector Road', group: 'Urban' },
    { value: 'commercial_road', label: 'Commercial Area Road', group: 'Urban' },
    { value: 'market_road', label: 'Market / Commercial Corridor', group: 'Urban' },
    { value: 'school_road', label: 'School Zone Route', group: 'Sensitive' },
    { value: 'hospital_road', label: 'Hospital Access Route', group: 'Sensitive' },
    { value: 'emergency_route', label: 'Emergency Service Corridor', group: 'Sensitive' },
    { value: 'residential', label: 'Residential Street', group: 'Local' },
    { value: 'colony_road', label: 'Colony / Access Road', group: 'Local' },
    { value: 'rural_road', label: 'Rural / Feeder Road', group: 'Rural' },
    { value: 'other', label: 'Other Road Category', group: 'Other' },
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
      
      {/* Infrastructure Context Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Infrastructure Context</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Required</span>
        </div>

        {/* Road Type */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Road Classification <span className="text-rose-400">*</span>
          </label>
          <select
            value={context.road_type}
            onChange={(e) => setContext(prev => ({ ...prev, road_type: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
          >
            {roadTypes.map((item) => (
              <option key={item.value} value={item.value} className="bg-slate-900 text-slate-100">
                [{item.group}] {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Traffic Level */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">
              Traffic Density <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-slate-400 uppercase font-mono">
              {context.traffic_level.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
            {trafficLevels.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setContext(prev => ({ ...prev, traffic_level: t.value }))}
                className={`py-1.5 px-1 rounded text-[11px] font-medium transition-colors text-center ${
                  context.traffic_level === t.value
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Sensitivity */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Location Sensitivity <span className="text-rose-400">*</span>
          </label>
          <select
            value={context.location_sensitivity}
            onChange={(e) => setContext(prev => ({ ...prev, location_sensitivity: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
          >
            {sensitivities.map((item) => (
              <option key={item.value} value={item.value} className="bg-slate-900 text-slate-100">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Geographic Location Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Geographic Location</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Optional</span>
        </div>

        {/* Location Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoStatus === 'locating'}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors ${
              geoStatus === 'locating'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 cursor-wait'
                : 'bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40'
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
            className="py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>{showManualCoords ? 'Hide Coordinates' : 'Enter Coordinates Manually'}</span>
          </button>
        </div>

        {/* Active Coordinates Display */}
        {hasCoords && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-mono text-[11px] text-emerald-300 font-semibold">
                Lat: {Number(context.latitude).toFixed(6)}°, Lng: {Number(context.longitude).toFixed(6)}°
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-[11px] text-rose-400 hover:text-rose-300 underline font-mono ml-auto"
            >
              Clear
            </button>
          </div>
        )}

        {/* Geolocation Error Message */}
        {geoError && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">{geoError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Manual Coordinates Input */}
        {showManualCoords && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">
              Decimal Degrees
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Latitude (-90 to 90)</label>
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
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Longitude (-180 to 180)</label>
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
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Administrative Region Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
          <div>
            <input
              type="text"
              placeholder="City (e.g. Bengaluru)"
              value={context.city || ''}
              onChange={(e) => setContext(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="State (e.g. Karnataka)"
              value={context.state || ''}
              onChange={(e) => setContext(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Area / Ward"
              value={context.area || ''}
              onChange={(e) => setContext(prev => ({ ...prev, area: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings (Confidence Threshold) */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center space-x-1.5 font-mono">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Detection Sensitivity</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-cyan-400 font-bold">{conf.toFixed(2)}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={conf}
              onChange={(e) => setConf(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.10 (High Recall)</span>
              <span>0.25 (Default)</span>
              <span>0.80 (High Precision)</span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <button
        type="submit"
        disabled={!canAnalyze || isLoading}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors ${
          !canAnalyze || isLoading
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-sm'
        }`}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            <span>Running Road Inspection...</span>
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
