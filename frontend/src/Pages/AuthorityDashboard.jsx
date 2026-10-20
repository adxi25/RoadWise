import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { getInspections, getDashboardStats } from '../api/client';
import MetricCards from '../components/Dashboard/MetricCards';
import GeographicMap from '../components/Dashboard/GeographicMap';
import RankingTable from '../components/Dashboard/RankingTable';
import InspectionDetailModal from '../components/Dashboard/InspectionDetailModal';

export default function AuthorityDashboard({ onBackToInspect }) {
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Modal & Map Focus State
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [focusInspection, setFocusInspection] = useState(null);

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setApiError(null);

    try {
      const [inspectionsData, statsData] = await Promise.all([
        getInspections(),
        getDashboardStats().catch((err) => {
          console.warn('Backend stats endpoint query failed, calculating client-side:', err);
          return null;
        }),
      ]);

      setInspections(inspectionsData || []);

      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback: derive metrics from real inspections records
        const total = (inspectionsData || []).length;
        let critical = 0;
        let high = 0;
        let medium = 0;
        let low = 0;
        let totalCond = 0;
        let totalRisk = 0;
        let validGps = 0;

        (inspectionsData || []).forEach((item) => {
          const pri = (item.priority || '').toUpperCase();
          if (pri === 'CRITICAL') critical++;
          else if (pri === 'HIGH') high++;
          else if (pri === 'MEDIUM') medium++;
          else if (pri === 'LOW') low++;

          if (item.condition_score !== null && item.condition_score !== undefined) {
            totalCond += Number(item.condition_score);
          }
          if (item.risk_score !== null && item.risk_score !== undefined) {
            totalRisk += Number(item.risk_score);
          }
          if (
            item.latitude !== null &&
            item.latitude !== undefined &&
            item.longitude !== null &&
            item.longitude !== undefined &&
            !isNaN(Number(item.latitude)) &&
            !isNaN(Number(item.longitude)) &&
            Number(item.latitude) !== 0 &&
            Number(item.longitude) !== 0
          ) {
            validGps++;
          }
        });

        setStats({
          total_inspections: total,
          critical_count: critical,
          high_count: high,
          medium_count: medium,
          low_count: low,
          avg_condition_score: total > 0 ? Number((totalCond / total).toFixed(2)) : 0,
          avg_risk_score: total > 0 ? Number((totalRisk / total).toFixed(2)) : 0,
          valid_gps_count: validGps,
        });
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setApiError(err.message || 'Failed to connect to RoadWise database service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  const handleFocusOnMap = (item) => {
    setFocusInspection(item);
    // Smooth scroll to map if on small screens
    const mapElement = document.getElementById('authority-gis-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatRefreshTime = (dateObj) => {
    if (!dateObj) return '—';
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Authority Header & Controls */}
      <div className="p-5 rounded-lg bg-white border border-[#DFE3E1] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44] text-[11px] font-mono font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>Mode 2 Authority Portal</span>
              </span>
              <span className="text-[11px] font-mono text-[#79888E]">
                Civic Asset Infrastructure
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#141D20] font-sans tracking-tight">
              Road Asset Maintenance Prioritization Dashboard
            </h1>

            <p className="text-xs text-[#505E63] font-sans max-w-3xl leading-relaxed">
              Synthesizes real inspection telemetry to answer which road corridors require intervention first, where they are located, and the defect manifestations driving urgent risk.
            </p>
          </div>

          {/* Action Buttons & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-[11px] font-mono text-[#505E63] bg-[#F8F7F4] border border-[#DFE3E1] px-3 py-1.5 rounded flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Updated: {formatRefreshTime(lastRefreshed)}</span>
            </div>

            <button
              type="button"
              disabled={isRefreshing || isLoading}
              onClick={() => loadDashboardData(true)}
              className="px-3.5 py-1.5 rounded bg-white hover:bg-[#F3F1EC] border border-[#DFE3E1] text-[#141D20] text-xs font-semibold font-mono inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#114B44] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>

            {onBackToInspect && (
              <button
                type="button"
                onClick={onBackToInspect}
                className="px-3.5 py-1.5 rounded bg-[#114B44] hover:bg-[#0D3833] text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Single Inspection (Mode 1)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {apiError && (
        <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-[#991B1B] text-xs flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#141D20]">Authority Telemetry Unavailable</span>
              <span className="text-xs text-[#991B1B] leading-relaxed font-mono">{apiError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData(false)}
            className="px-3 py-1 bg-white hover:bg-[#FEF2F2] border border-[#FECDD3] text-[#991B1B] rounded text-xs font-semibold font-mono transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <MetricCards
        stats={stats}
        filteredCount={inspections.length}
        totalCount={stats?.total_inspections || inspections.length}
        activeFilterCount={0}
      />

      {/* Interactive GIS Geospatial Map */}
      <div id="authority-gis-map">
        <GeographicMap
          inspections={inspections}
          totalInView={inspections.length}
          focusInspection={focusInspection}
          onSelectInspection={(item) => setSelectedInspection(item)}
        />
      </div>

      {/* Maintenance Priority Ranking Queue */}
      <RankingTable
        inspections={inspections}
        onSelectInspection={(item) => setSelectedInspection(item)}
        onFocusOnMap={handleFocusOnMap}
      />

      {/* Comprehensive Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}

    </div>
  );
}
