/**
 * RoadWise - Frontend API Client Adapter Module
 * ==============================================
 *
 * ROLE IN ROADWISE ARCHITECTURE:
 *   This module acts as the centralized HTTP gateway connecting the React frontend (SPA)
 *   to the FastAPI asynchronous backend service. It abstracts network requests, handles
 *   cross-origin resource sharing (CORS), serializes multipart form data for road images,
 *   deserializes JSON responses, and normalizes server-side file paths into web URLs.
 *
 * BACKEND ENDPOINTS CONSUMED:
 *   - GET   /api/health                  -> checkHealth()
 *   - POST  /api/inspections/inspect     -> inspectRoad(formData)
 *   - GET   /api/inspections             -> getInspections(filters)
 *   - GET   /api/inspections/{id}        -> getInspectionById(id)
 *   - PATCH /api/inspections/{id}/status -> updateInspectionStatus(id, payload)
 *   - GET   /api/inspections/nearby      -> getNearbyInspections(lat, lon, radius)
 *   - GET   /api/dashboard/stats         -> getDashboardStats()
 *   - GET   /api/reports/track/{id}      -> trackReport(trackingId)
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

/**
 * Resolve image paths into absolute backend static URLs.
 */
export function getImageUrl(pathStr) {
  if (!pathStr) return '';
  if (typeof pathStr !== 'string') pathStr = String(pathStr);

  const trimmed = pathStr.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, '/');

  if (normalized.includes('data/uploads/')) {
    const filename = normalized.split('data/uploads/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/data/uploads/${filename}`;
  }

  if (normalized.includes('results/predictions/')) {
    const filename = normalized.split('results/predictions/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/results/predictions/${filename}`;
  }

  if (normalized.includes('uploads/')) {
    const filename = normalized.split('uploads/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/data/uploads/${filename}`;
  }

  if (normalized.includes('predictions/')) {
    const filename = normalized.split('predictions/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/results/predictions/${filename}`;
  }

  const filename = normalized.split('/').pop().replace(/^\/+/, '');
  if (!filename) return '';

  if (filename.includes('_annotated')) {
    return `${API_BASE_URL}/results/predictions/${filename}`;
  }

  return `${API_BASE_URL}/data/uploads/${filename}`;
}

/**
 * Check backend health status and YOLO model readiness.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Health check failed:', err);
    return {
      status: 'offline',
      service: 'RoadWise API',
      error: err.message,
    };
  }
}

/**
 * Execute a Mode 1 inspection by posting image bytes + road context.
 */
export async function inspectRoad(formData) {
  const res = await fetch(`${API_BASE_URL}/api/inspections/inspect`, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const errorDetail = data?.detail || `Inspection failed with status ${res.status}`;
    throw new Error(errorDetail);
  }

  return data;
}

/**
 * Fetch past inspections with optional filters.
 */
export async function getInspections(filters = {}) {
  const query = new URLSearchParams();
  if (filters.priority) query.append('priority', filters.priority);
  if (filters.city) query.append('city', filters.city);
  if (filters.road_type) query.append('road_type', filters.road_type);
  if (filters.limit) query.append('limit', String(filters.limit));

  const url = `${API_BASE_URL}/api/inspections${query.toString() ? '?' + query.toString() : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch inspections: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Fetch full inspection detail with detections by inspection ID.
 */
export async function getInspectionById(id) {
  const res = await fetch(`${API_BASE_URL}/api/inspections/${id}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch inspection #${id}`);
  }

  return await res.json();
}

/**
 * Update inspection status, assigned crew, and official remarks (Mode 2 Authority Action).
 */
export async function updateInspectionStatus(inspectionId, { status, official_remarks, assigned_crew }) {
  const res = await fetch(`${API_BASE_URL}/api/inspections/${inspectionId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      status,
      official_remarks: official_remarks || null,
      assigned_crew: assigned_crew || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update inspection status: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Query existing road defect inspections on the same corridor within `radiusMeters`.
 */
export async function getNearbyInspections(latitude, longitude, radiusMeters = 150) {
  if (latitude == null || longitude == null) return [];
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_meters: String(radiusMeters),
  });

  const res = await fetch(`${API_BASE_URL}/api/inspections/nearby?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    return [];
  }

  return await res.json();
}

/**
 * Fetch aggregate metrics for Mode 2 Authority Dashboard.
 */
export async function getDashboardStats() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch dashboard stats: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Public Citizen Portal: Track a road damage complaint by Complaint ID or record number.
 */
export async function trackReport(trackingId) {
  if (!trackingId || !trackingId.trim()) {
    throw new Error('Please enter a valid Complaint ID.');
  }

  const encodedId = encodeURIComponent(trackingId.trim());
  const res = await fetch(`${API_BASE_URL}/api/reports/track/${encodedId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error(`Complaint ID "${trackingId.trim()}" was not found. Please verify the code on your inspection confirmation.`);
    }
    throw new Error(errorData.detail || `Server error during tracking (${res.status})`);
  }

  return await res.json();
}
