/**
 * RoadWise - Interactive Citizen Mini-Map Pin Drop & Reverse Geocoding
 * ====================================================================
 *
 * ROLE IN ROADWISE ARCHITECTURE:
 *   Enables citizens and evaluators in Mode 1 to visually inspect and fine-tune
 *   their road defect location via a draggable Leaflet pin on OpenStreetMap.
 *
 * CAPABILITIES:
 *   1. Draggable Pin: Allows adjusting coordinates along a road stretch (essential
 *      for college viva demos to demonstrate distinct potholes along a 50-100m corridor).
 *   2. Map Click: Clicking anywhere on the mini-map relocates the pin.
 *   3. Auto-Reverse Geocoding: Automatically resolves City, State, and Area/Road
 *      via OpenStreetMap Nominatim.
 *   4. Haversine Corridor Telemetry: Queries the backend (/api/inspections/nearby)
 *      to notify citizens if prior defects exist on the same road corridor,
 *      reinforcing that each pothole is registered independently with its own ID.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, AlertCircle, Info, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { getNearbyInspections } from '../api/client';

function getHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GEOFENCE_RADIUS_METERS = 1000; // 1.0 km maximum pin variance from verified device GPS

function createDraggablePinIcon() {
  const html = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(17, 75, 68, 0.25);
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: #114B44;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
      ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'roadwise-draggable-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export default function MiniMapPicker({
  latitude,
  longitude,
  deviceGpsOrigin = null,
  onLocationChange,
  onAddressResolved,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const deviceGpsOriginRef = useRef(deviceGpsOrigin);

  // Keep live ref updated to prevent stale closures in Leaflet event listeners
  useEffect(() => {
    deviceGpsOriginRef.current = deviceGpsOrigin;
  }, [deviceGpsOrigin]);

  // Default fallback coordinates (Bengaluru central coordinates)
  const defaultLat = 12.9716;
  const defaultLng = 77.5946;

  const currentLat = latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : defaultLat;
  const currentLng = longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : defaultLng;

  const [nearbyDefects, setNearbyDefects] = useState([]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [corridorLoading, setCorridorLoading] = useState(false);
  const [geofenceInfo, setGeofenceInfo] = useState(null);
  const debounceTimerRef = useRef(null);

  // Clamping helper: guarantees pin strictly stays inside GEOFENCE_RADIUS_METERS from origin
  const clampToGeofence = useCallback((lat, lng) => {
    const origin = deviceGpsOriginRef.current;
    if (!origin || origin.lat === null || origin.lng === null || isNaN(Number(origin.lat)) || isNaN(Number(origin.lng))) {
      return { lat, lng, clamped: false, distanceMeters: 0 };
    }

    const dist = getHaversineDistanceMeters(origin.lat, origin.lng, lat, lng);
    if (dist > GEOFENCE_RADIUS_METERS) {
      const ratio = GEOFENCE_RADIUS_METERS / dist;
      const clampedLat = parseFloat((origin.lat + (lat - origin.lat) * ratio).toFixed(6));
      const clampedLng = parseFloat((origin.lng + (lng - origin.lng) * ratio).toFixed(6));
      return {
        lat: clampedLat,
        lng: clampedLng,
        clamped: true,
        distanceMeters: GEOFENCE_RADIUS_METERS,
      };
    }

    return {
      lat,
      lng,
      clamped: false,
      distanceMeters: Math.round(dist),
    };
  }, []);

  // Check nearby corridor defects
  const checkCorridorDensity = useCallback(async (lat, lng) => {
    try {
      setCorridorLoading(true);
      const res = await getNearbyInspections(lat, lng, 150.0);
      const list = Array.isArray(res) ? res : (res?.nearby || []);
      setNearbyDefects(list);
    } catch (err) {
      console.warn('Failed to query corridor density:', err);
      setNearbyDefects([]);
    } finally {
      setCorridorLoading(false);
    }
  }, []);

  // Reverse geocode via OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      setIsReverseGeocoding(true);
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });
      if (!response.ok) return;

      const data = await response.json();
      const addr = data.address || {};

      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      const state = addr.state || '';
      const area = addr.suburb || addr.neighbourhood || addr.road || addr.quarter || addr.subdivision || '';

      if (onAddressResolved && (city || state || area)) {
        onAddressResolved({ city, state, area });
      }
    } catch (err) {
      console.warn('Reverse geocoding unavailable:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [onAddressResolved]);

  // Unified position update handler with geofence protection
  const handlePositionUpdate = useCallback((newLat, newLng) => {
    const check = clampToGeofence(newLat, newLng);
    const lat = check.lat;
    const lng = check.lng;

    if (deviceGpsOriginRef.current) {
      setGeofenceInfo({
        active: true,
        clamped: check.clamped,
        distanceMeters: check.distanceMeters,
      });
    } else {
      setGeofenceInfo(null);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (onLocationChange) {
      onLocationChange(lat, lng);
    }

    // Debounce network calls to prevent hammering Nominatim / SQLite
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      checkCorridorDensity(lat, lng);
      reverseGeocode(lat, lng);
    }, 500);
  }, [clampToGeofence, onLocationChange, checkCorridorDensity, reverseGeocode]);

  const handlePositionUpdateRef = useRef(handlePositionUpdate);
  useEffect(() => {
    handlePositionUpdateRef.current = handlePositionUpdate;
  });

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = createDraggablePinIcon();
    const marker = L.marker([currentLat, currentLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.bindTooltip('Drag pin to exact defect location', {
      permanent: false,
      direction: 'top',
      offset: [0, -32],
    });

    // Real-time clamping WHILE dragging (prevents pin from physically leaving circle)
    marker.on('drag', () => {
      const pos = marker.getLatLng();
      const check = clampToGeofence(pos.lat, pos.lng);
      if (check.clamped) {
        marker.setLatLng([check.lat, check.lng]);
      }
    });

    // Finalize on drag end
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handlePositionUpdateRef.current(pos.lat, pos.lng);
    });

    // Clamp and place on map click
    map.on('click', (e) => {
      handlePositionUpdateRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Initial check
    if (latitude !== null && longitude !== null) {
      checkCorridorDensity(currentLat, currentLng);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Synchronize pin position when parent coordinates change (e.g. from browser GPS button)
  useEffect(() => {
    if (latitude === null || longitude === null) return;

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      const dist = Math.abs(currentPos.lat - lat) + Math.abs(currentPos.lng - lng);
      if (dist > 0.00002) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 0.6 });
      }
    }

    checkCorridorDensity(lat, lng);
  }, [latitude, longitude, checkCorridorDensity]);

  // Manage 1.0 km geofence circle overlay on Leaflet map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (deviceGpsOrigin && deviceGpsOrigin.lat && deviceGpsOrigin.lng) {
      if (!geofenceCircleRef.current) {
        const circle = L.circle([deviceGpsOrigin.lat, deviceGpsOrigin.lng], {
          radius: GEOFENCE_RADIUS_METERS,
          color: '#114B44',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: '#114B44',
          fillOpacity: 0.05,
        }).addTo(mapInstanceRef.current);
        circle.bindTooltip('1.0 km Local Corridor Safezone', { permanent: false, direction: 'top' });
        geofenceCircleRef.current = circle;
      } else {
        geofenceCircleRef.current.setLatLng([deviceGpsOrigin.lat, deviceGpsOrigin.lng]);
      }

      // Initialize geofence badge status
      if (latitude !== null && longitude !== null) {
        const dist = getHaversineDistanceMeters(deviceGpsOrigin.lat, deviceGpsOrigin.lng, Number(latitude), Number(longitude));
        setGeofenceInfo({
          active: true,
          clamped: dist > GEOFENCE_RADIUS_METERS,
          distanceMeters: Math.min(GEOFENCE_RADIUS_METERS, Math.round(dist)),
        });
      }
    } else {
      if (geofenceCircleRef.current) {
        geofenceCircleRef.current.remove();
        geofenceCircleRef.current = null;
      }
      setGeofenceInfo(null);
    }
  }, [deviceGpsOrigin]);

  return (
    <div className="space-y-2 pt-1">
      {/* Mini-Map Header & Instructions */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#505E63]">
        <span className="flex items-center gap-1 font-semibold text-[#141D20]">
          <Compass className="w-3.5 h-3.5 text-[#114B44]" />
          <span>Interactive Pin Drop (Draggable)</span>
        </span>
        <span>
          {isReverseGeocoding ? (
            <span className="text-[#114B44] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#114B44] animate-ping" />
              Resolving address...
            </span>
          ) : (
            'Click map or drag pin'
          )}
        </span>
      </div>

      {/* Leaflet Map Frame (isolated stacking context to prevent poking through modals) */}
      <div className="relative rounded-lg overflow-hidden border border-[#CCDCD8] shadow-2xs h-48 bg-[#EAE7E1] isolate z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Geofence Telemetry Banner (Anti-Spoofing Perimeter) */}
      {geofenceInfo && geofenceInfo.active && (
        <div className={`p-2 rounded flex items-center justify-between text-[11px] font-mono border ${
          geofenceInfo.clamped 
            ? 'bg-[#FEF2F2] border-[#FECDD3] text-[#991B1B]'
            : 'bg-[#EBF4F2] border-[#CCDCD8] text-[#114B44]'
        }`}>
          <div className="flex items-center gap-1.5 font-semibold">
            {geofenceInfo.clamped ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#114B44] shrink-0" />
            )}
            <span>
              {geofenceInfo.clamped 
                ? 'Geofence Clamped (1.0 km max boundary from your device)' 
                : `Corridor Geofence: ${geofenceInfo.distanceMeters}m from device GPS fix`}
            </span>
          </div>
          <span className="text-[10px] opacity-80">1.0 km Safezone Active</span>
        </div>
      )}

      {/* Corridor Density Alert Banner (Haversine Proximity Feedback) */}
      {nearbyDefects.length > 0 ? (
        <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
          <div className="flex items-center gap-1.5 font-bold font-mono text-[11px] uppercase tracking-wide text-[#B45309]">
            <Info className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span>Corridor Defect Telemetry ({nearbyDefects.length} defect{nearbyDefects.length > 1 ? 's' : ''} nearby)</span>
          </div>
          <p className="text-[11px] text-[#78350F] leading-relaxed">
            Existing defect(s) logged within 150m along this road corridor. Your report will be filed as an <strong>independent defect (RW-...)</strong> contributing to this stretch's aggregate maintenance priority.
          </p>
        </div>
      ) : (
        latitude !== null && (
          <div className="p-2 rounded bg-[#F8F7F4] border border-[#DFE3E1] text-[11px] text-[#505E63] font-mono flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Independent road corridor location</span>
            </span>
            <span>Radius: 150m verified</span>
          </div>
        )
      )}
    </div>
  );
}
