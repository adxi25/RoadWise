import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Eye, AlertCircle } from 'lucide-react';

const PRIORITY_COLORS = {
  CRITICAL: {
    bg: '#BE123C', // Rose 700
    border: '#FFE4E6',
    pulse: 'rgba(190, 18, 60, 0.4)',
    label: 'Critical',
  },
  HIGH: {
    bg: '#C2410C', // Orange 700
    border: '#FFEDD5',
    pulse: 'rgba(194, 65, 12, 0.3)',
    label: 'High',
  },
  MEDIUM: {
    bg: '#B45309', // Amber 700
    border: '#FEF3C7',
    pulse: 'rgba(180, 83, 9, 0.25)',
    label: 'Medium',
  },
  LOW: {
    bg: '#0F766E', // Teal 700
    border: '#CCFBF1',
    pulse: 'rgba(15, 118, 110, 0.25)',
    label: 'Low',
  },
};

function createCustomPin(priority) {
  const config = PRIORITY_COLORS[priority?.toUpperCase()] || PRIORITY_COLORS.LOW;
  const isCritical = priority?.toUpperCase() === 'CRITICAL';

  const html = `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      ${isCritical ? `
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${config.pulse};
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      ` : ''}
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${config.bg};
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'roadwise-map-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function GeographicMap({
  inspections = [],
  totalInView = 0,
  focusInspection = null,
  onSelectInspection,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerMapRef = useRef(new Map());

  // Filter valid coordinates strictly: no fabricated or null coords
  const mappedInspections = inspections.filter(item => {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    return (
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !(lat === 0 && lng === 0)
    );
  });

  const unmappedCount = Math.max(0, totalInView - mappedInspections.length);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center on India / regional hub or first coordinate
    const initialCenter = mappedInspections.length > 0
      ? [Number(mappedInspections[0].latitude), Number(mappedInspections[0].longitude)]
      : [12.9716, 77.5946];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: mappedInspections.length > 0 ? 11 : 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Clean OpenStreetMap CartoDB Positron / OSM Standard TileLayer with mandatory attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers whenever mapped inspections change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current.clear();

    if (mappedInspections.length === 0) {
      return;
    }

    const bounds = L.latLngBounds();

    mappedInspections.forEach(item => {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      const priority = (item.priority || 'LOW').toUpperCase();
      const priorityConf = PRIORITY_COLORS[priority] || PRIORITY_COLORS.LOW;

      const marker = L.marker([lat, lng], {
        icon: createCustomPin(priority),
        title: `${item.report_id} (${priority})`,
      });

      const locationStr = [item.area, item.city, item.state].filter(Boolean).join(', ') || 'Coordinates verified';

      // Create rich HTML popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-xs space-y-2 min-w-[210px] text-[#141D20]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-[#DFE3E1] pb-1.5 gap-2">
          <span class="font-mono font-bold text-[#141D20]">${item.report_id}</span>
          <span style="background-color: ${priorityConf.bg}; color: #FFFFFF;" class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider">
            ${priority}
          </span>
        </div>

        <div class="space-y-1 text-[#505E63] text-[11px]">
          <div><strong class="text-[#141D20]">Location:</strong> ${locationStr}</div>
          <div><strong class="text-[#141D20]">Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <div><strong class="text-[#141D20]">Road Class:</strong> ${item.road_type ? item.road_type.replace(/_/g, ' ') : 'N/A'}</div>
          <div class="flex items-center justify-between pt-1">
            <span>Risk Score: <strong class="text-[#141D20] font-mono">${item.risk_score !== null && item.risk_score !== undefined ? item.risk_score : '—'}</strong></span>
            <span>Condition: <strong class="text-[#141D20] font-mono">${item.condition_score !== null && item.condition_score !== undefined ? item.condition_score : '—'}</strong></span>
          </div>
          ${item.detection_count !== undefined ? `<div><strong class="text-[#141D20]">Detections:</strong> ${item.detection_count} defect(s)</div>` : ''}
        </div>

        <button
          type="button"
          id="btn-inspect-${item.id}"
          class="w-full mt-2 py-1.5 px-2 bg-[#114B44] hover:bg-[#0D3833] text-white rounded text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
        >
          <span>View Telemetry & Defects</span>
        </button>
      `;

      // Attach event listener directly to avoid inline script injection
      const btn = popupContent.querySelector(`#btn-inspect-${item.id}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (onSelectInspection) {
            onSelectInspection(item);
          }
        });
      }

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'roadwise-custom-popup',
      });

      markersLayer.addLayer(marker);
      markerMapRef.current.set(item.id, marker);
      bounds.extend([lat, lng]);
    });

    // Auto-fit bounds if markers exist and not focused on specific target
    if (!focusInspection && mappedInspections.length > 0) {
      if (mappedInspections.length === 1) {
        map.setView(
          [Number(mappedInspections[0].latitude), Number(mappedInspections[0].longitude)],
          14
        );
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [mappedInspections.length, focusInspection]);

  // Handle focus target from table click
  useEffect(() => {
    if (!focusInspection || !mapInstanceRef.current) return;

    const lat = Number(focusInspection.latitude);
    const lng = Number(focusInspection.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const map = mapInstanceRef.current;
    map.flyTo([lat, lng], 16, { duration: 1.2 });

    const marker = markerMapRef.current.get(focusInspection.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 700);
    }
  }, [focusInspection]);

  return (
    <div className="rounded-lg bg-white border border-[#DFE3E1] shadow-2xs overflow-hidden flex flex-col">
      {/* Map Header / Telemetry Bar */}
      <div className="p-3 sm:px-4 sm:py-3 border-b border-[#DFE3E1] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#141D20] uppercase font-mono tracking-wider block">
              GIS Geospatial Telemetry
            </span>
            <span className="text-[11px] text-[#505E63] font-sans">
              Real GPS-verified road inspection coordinates plotted onto OpenStreetMap
            </span>
          </div>
        </div>

        {/* Priority Legend & Status Pills */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white border border-[#DFE3E1]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BE123C]"></span>
            <span className="text-[#141D20]">Critical</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white border border-[#DFE3E1]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C2410C]"></span>
            <span className="text-[#141D20]">High</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white border border-[#DFE3E1]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]"></span>
            <span className="text-[#141D20]">Med</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white border border-[#DFE3E1]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span>
            <span className="text-[#141D20]">Low</span>
          </div>

          <div className="px-2 py-0.5 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] font-semibold">
            {mappedInspections.length} Mapped
          </div>
          {unmappedCount > 0 && (
            <div className="px-2 py-0.5 rounded bg-[#FFF7ED] border border-[#FED7AA] text-[#C2410C] font-semibold" title="Historical records captured prior to mandatory live GPS requirement">
              {unmappedCount} Legacy Unmapped
            </div>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-[#EAE7E1]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {mappedInspections.length === 0 && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#FECDD3] text-[#991B1B] flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#141D20] font-sans">
              No Inspections with Live GPS in Current Filter
            </h4>
            <p className="text-xs text-[#505E63] max-w-md">
              The currently selected filters returned zero records containing verified geographic coordinates. Adjust your filters or switch to "All Priorities".
            </p>
          </div>
        )}
      </div>

      {/* Map Footer Information */}
      <div className="px-4 py-2 bg-white border-t border-[#DFE3E1] text-[11px] text-[#79888E] font-mono flex flex-wrap items-center justify-between gap-2">
        <span>Click any pin to inspect corridor metadata and dispatch status.</span>
        <span>Tile Provider: OpenStreetMap (OSM Standard)</span>
      </div>
    </div>
  );
}
