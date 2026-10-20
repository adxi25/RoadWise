import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  ArrowUpDown,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Compass,
} from 'lucide-react';

const ROAD_TYPE_LABELS = {
  national_highway: 'National Highway',
  main_road: 'Main Road',
  secondary_road: 'Secondary Road',
  residential: 'Residential Street',
  rural_road: 'Rural Road',
};

const PRIORITY_BADGES = {
  CRITICAL: 'bg-[#FEF2F2] border-[#FECDD3] text-[#991B1B]',
  HIGH: 'bg-[#FFF7ED] border-[#FED7AA] text-[#C2410C]',
  MEDIUM: 'bg-[#FEFCE8] border-[#FEF08A] text-[#854D0E]',
  LOW: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
};

export default function RankingTable({
  inspections = [],
  onSelectInspection,
  onFocusOnMap,
}) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [roadTypeFilter, setRoadTypeFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk_desc'); // 'risk_desc' | 'risk_asc' | 'condition_asc' | 'condition_desc' | 'date_desc' | 'date_asc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract unique locations from actual database records
  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    inspections.forEach(i => {
      if (i.city?.trim()) locs.add(i.city.trim());
      if (i.state?.trim()) locs.add(i.state.trim());
    });
    return Array.from(locs).sort();
  }, [inspections]);

  // Extract unique road types from actual records
  const uniqueRoadTypes = useMemo(() => {
    const types = new Set();
    inspections.forEach(i => {
      if (i.road_type?.trim()) types.add(i.road_type.trim());
    });
    return Array.from(types).sort();
  }, [inspections]);

  // Filter & Sort Logic
  const filteredAndSortedInspections = useMemo(() => {
    let list = [...inspections];

    // Priority Filter
    if (priorityFilter !== 'ALL') {
      list = list.filter(
        i => (i.priority || '').toUpperCase() === priorityFilter.toUpperCase()
      );
    }

    // Road Type Filter
    if (roadTypeFilter !== 'ALL') {
      list = list.filter(
        i => (i.road_type || '').toLowerCase() === roadTypeFilter.toLowerCase()
      );
    }

    // Location Filter
    if (locationFilter !== 'ALL') {
      const locTarget = locationFilter.toLowerCase();
      list = list.filter(
        i =>
          (i.city && i.city.toLowerCase() === locTarget) ||
          (i.state && i.state.toLowerCase() === locTarget) ||
          (i.area && i.area.toLowerCase().includes(locTarget))
      );
    }

    // Text Search (Report ID, Location, Recommendation)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => {
        const reportMatch = (i.report_id || '').toLowerCase().includes(q);
        const cityMatch = (i.city || '').toLowerCase().includes(q);
        const areaMatch = (i.area || '').toLowerCase().includes(q);
        const stateMatch = (i.state || '').toLowerCase().includes(q);
        const recMatch = (i.recommendation || '').toLowerCase().includes(q);
        return reportMatch || cityMatch || areaMatch || stateMatch || recMatch;
      });
    }

    // Deterministic Sorting
    list.sort((a, b) => {
      if (sortBy === 'risk_desc') {
        const diff = (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0);
        if (diff !== 0) return diff;
        return (b.id || 0) - (a.id || 0);
      }
      if (sortBy === 'risk_asc') {
        const diff = (Number(a.risk_score) || 0) - (Number(b.risk_score) || 0);
        if (diff !== 0) return diff;
        return (a.id || 0) - (b.id || 0);
      }
      if (sortBy === 'condition_asc') {
        const diff = (Number(a.condition_score) || 0) - (Number(b.condition_score) || 0);
        if (diff !== 0) return diff;
        return (b.id || 0) - (a.id || 0);
      }
      if (sortBy === 'condition_desc') {
        const diff = (Number(b.condition_score) || 0) - (Number(a.condition_score) || 0);
        if (diff !== 0) return diff;
        return (b.id || 0) - (a.id || 0);
      }
      if (sortBy === 'date_desc') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA || (b.id || 0) - (a.id || 0);
      }
      if (sortBy === 'date_asc') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB || (a.id || 0) - (b.id || 0);
      }
      return 0;
    });

    return list;
  }, [inspections, priorityFilter, roadTypeFilter, locationFilter, searchQuery, sortBy]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedInspections.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

  const paginatedInspections = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredAndSortedInspections.slice(start, start + pageSize);
  }, [filteredAndSortedInspections, currentPageSafe, pageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'ALL' ||
    roadTypeFilter !== 'ALL' ||
    locationFilter !== 'ALL' ||
    sortBy !== 'risk_desc';

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('ALL');
    setRoadTypeFilter('ALL');
    setLocationFilter('ALL');
    setSortBy('risk_desc');
    setCurrentPage(1);
  };

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
    <div className="rounded-lg bg-white border border-[#DFE3E1] shadow-2xs overflow-hidden flex flex-col space-y-0">
      
      {/* Table Header & Controls Toolbar */}
      <div className="p-4 border-b border-[#DFE3E1] bg-[#F8F7F4] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#114B44]" />
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-[#141D20]">
                Maintenance Priority Ranking Queue
              </h3>
            </div>
            <p className="text-xs text-[#505E63] font-sans">
              Systematic road corridor triage ordered deterministically by context-calibrated maintenance risk.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-[#505E63] bg-white border border-[#DFE3E1] px-2.5 py-1 rounded">
              Showing <strong>{filteredAndSortedInspections.length}</strong> of <strong>{inspections.length}</strong> records
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono font-medium text-[#114B44] bg-[#EBF4F2] border border-[#CCDCD8] hover:bg-[#DDECE8] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#79888E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID, city, area..."
              className="w-full pl-8 pr-3 py-1.5 rounded bg-white border border-[#DFE3E1] text-xs text-[#141D20] placeholder-[#79888E] focus:outline-none focus:border-[#114B44]"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded bg-white border border-[#DFE3E1] text-xs text-[#141D20] focus:outline-none focus:border-[#114B44]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Road Type Filter */}
          <div>
            <select
              value={roadTypeFilter}
              onChange={(e) => {
                setRoadTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded bg-white border border-[#DFE3E1] text-xs text-[#141D20] focus:outline-none focus:border-[#114B44]"
            >
              <option value="ALL">All Road Classes</option>
              {uniqueRoadTypes.map(rt => (
                <option key={rt} value={rt}>
                  {ROAD_TYPE_LABELS[rt] || rt}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded bg-white border border-[#DFE3E1] text-xs text-[#141D20] focus:outline-none focus:border-[#114B44]"
            >
              <option value="ALL">All Municipalities</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded bg-white border border-[#DFE3E1] text-xs font-mono text-[#141D20] focus:outline-none focus:border-[#114B44]"
            >
              <option value="risk_desc">Sort: Highest Risk (1st)</option>
              <option value="risk_asc">Sort: Lowest Risk</option>
              <option value="condition_asc">Sort: Worst Condition</option>
              <option value="condition_desc">Sort: Best Condition</option>
              <option value="date_desc">Sort: Newest Date</option>
              <option value="date_asc">Sort: Oldest Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#DFE3E1] bg-[#F3F1EC] text-[#505E63] font-mono uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">Rank</th>
              <th className="py-2.5 px-3">Report ID</th>
              <th className="py-2.5 px-3">Location & GPS</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Road Class</th>
              <th className="py-2.5 px-3 text-right">Condition</th>
              <th className="py-2.5 px-3 text-right">Risk Score</th>
              <th className="py-2.5 px-3 text-center">Priority</th>
              <th className="py-2.5 px-3 text-center">Detections</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE3E1]">
            {paginatedInspections.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 text-center text-[#505E63]">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertTriangle className="w-6 h-6 text-[#79888E] mx-auto" />
                    <p className="font-semibold text-xs text-[#141D20]">No matching inspection records found</p>
                    <p className="text-[11px] text-[#79888E]">
                      Try adjusting or clearing your filters to view stored database records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInspections.map((item, idx) => {
                const rankNumber = (currentPageSafe - 1) * pageSize + idx + 1;
                const priority = (item.priority || 'LOW').toUpperCase();
                const badgeClass = PRIORITY_BADGES[priority] || PRIORITY_BADGES.LOW;
                const hasGps =
                  item.latitude !== null &&
                  item.latitude !== undefined &&
                  item.longitude !== null &&
                  item.longitude !== undefined &&
                  !isNaN(Number(item.latitude)) &&
                  !isNaN(Number(item.longitude));

                const locationText = [item.area, item.city, item.state].filter(Boolean).join(', ') || 'Unspecified Corridor';

                return (
                  <tr
                    key={item.id || item.report_id}
                    onClick={() => onSelectInspection && onSelectInspection(item)}
                    className="hover:bg-[#F8F7F4] transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#505E63] group-hover:text-[#114B44]">
                      #{rankNumber}
                    </td>

                    {/* Report ID */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#141D20] group-hover:text-[#114B44]">
                        {item.report_id}
                      </div>
                      <div className="text-[10px] text-[#79888E] font-mono">
                        ID: {item.id}
                      </div>
                    </td>

                    {/* Location & GPS */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#141D20] line-clamp-1">
                        {locationText}
                      </div>
                      <div className="text-[10px] font-mono text-[#79888E] flex items-center space-x-1 mt-0.5">
                        {hasGps ? (
                          <>
                            <MapPin className="w-3 h-3 text-[#114B44] flex-shrink-0" />
                            <span>
                              {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#A1A1AA] italic">No GPS coordinates</span>
                        )}
                      </div>
                    </td>

                    {/* Inspection Date */}
                    <td className="py-3 px-3 font-mono text-[11px] text-[#505E63] whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Road Class */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F3F1EC] text-[#505E63] text-[11px] font-mono capitalize">
                        {ROAD_TYPE_LABELS[item.road_type] || item.road_type || 'Main Road'}
                      </span>
                    </td>

                    {/* Condition Score */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-semibold text-[#141D20]">
                        {item.condition_score !== null && item.condition_score !== undefined
                          ? Number(item.condition_score).toFixed(1)
                          : '—'}
                      </div>
                      <div className="text-[10px] text-[#79888E] font-mono">
                        / 100
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-bold text-[#141D20]">
                        {item.risk_score !== null && item.risk_score !== undefined
                          ? Number(item.risk_score).toFixed(1)
                          : '—'}
                      </div>
                      <div className="text-[10px] text-[#79888E] font-mono">
                        / 100
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold font-mono uppercase tracking-wider ${badgeClass}`}
                      >
                        {priority}
                      </span>
                    </td>

                    {/* Detections */}
                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      {item.detection_count !== undefined ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.detection_count > 0
                              ? 'bg-[#EBF4F2] text-[#114B44]'
                              : 'bg-gray-100 text-[#79888E]'
                          }`}
                        >
                          {item.detection_count} defect{item.detection_count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        {hasGps && onFocusOnMap && (
                          <button
                            type="button"
                            title="Focus on GIS Map"
                            onClick={() => onFocusOnMap(item)}
                            className="p-1 rounded text-[#505E63] hover:text-[#114B44] hover:bg-[#EBF4F2] transition-colors"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectInspection && onSelectInspection(item)}
                          className="px-2.5 py-1 rounded bg-[#114B44] hover:bg-[#0D3833] text-white text-[11px] font-semibold font-mono inline-flex items-center space-x-1 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[#F8F7F4] border-t border-[#DFE3E1] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#505E63]">
        <div>
          Showing page <strong>{currentPageSafe}</strong> of <strong>{totalPages}</strong> ({filteredAndSortedInspections.length} total filtered)
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            disabled={currentPageSafe <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded bg-white border border-[#DFE3E1] text-[#141D20] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3F1EC] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-bold text-[#141D20]">
            {currentPageSafe} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPageSafe >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 rounded bg-white border border-[#DFE3E1] text-[#141D20] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3F1EC] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
