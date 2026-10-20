/**
 * RoadWise API Client Adapter
 * Connects the frontend to the FastAPI backend service.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

/**
 * Resolve image paths into absolute backend static URLs.
 * Correctly handles:
 * - absolute Windows paths (e.g. C:\...\data\uploads\...)
 * - relative data/uploads paths
 * - relative results/predictions paths
 * - already valid http/https URLs
 * - filenames
 */
export function getImageUrl(pathStr) {
  if (!pathStr) return '';
  if (typeof pathStr !== 'string') pathStr = String(pathStr);

  const trimmed = pathStr.trim();
  if (!trimmed) return '';

  // If already a valid absolute URL, data URI, or blob URL, return directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Normalize all Windows backslashes to forward slashes
  const normalized = trimmed.replace(/\\/g, '/');

  // If path contains data/uploads or results/predictions (Windows or POSIX paths)
  if (normalized.includes('data/uploads/')) {
    const filename = normalized.split('data/uploads/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/data/uploads/${filename}`;
  }

  if (normalized.includes('results/predictions/')) {
    const filename = normalized.split('results/predictions/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/results/predictions/${filename}`;
  }

  // Also handle paths like uploads/filename or predictions/filename
  if (normalized.includes('uploads/')) {
    const filename = normalized.split('uploads/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/data/uploads/${filename}`;
  }

  if (normalized.includes('predictions/')) {
    const filename = normalized.split('predictions/').pop().replace(/^\/+/, '');
    return `${API_BASE_URL}/results/predictions/${filename}`;
  }

  // Extract filename from any remaining absolute (e.g. C:/path/file.jpg) or relative path
  const filename = normalized.split('/').pop().replace(/^\/+/, '');
  if (!filename) return '';

  // Annotated files belong in results/predictions, original uploads belong in data/uploads
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

