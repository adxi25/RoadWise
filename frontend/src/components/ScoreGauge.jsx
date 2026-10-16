import React from 'react';

/**
 * Metric Telemetry Presentation for Road Condition & Maintenance Risk
 */
export default function ScoreGauge({
  score = 0,
  max = 100,
  title = "ROAD CONDITION",
  type = "condition", // 'condition' or 'risk'
  statusLabel = "",
  subtitle = "",
}) {
  const safeScore = Math.max(0, Math.min(max, Number(score) || 0));

  let statusColor = "text-emerald-800";
  let statusBg = "bg-[#F0FDF4] border-[#BBF7D0]";
  let barColor = "bg-emerald-600";
  let defaultLabel = "Good Condition";

  if (type === "condition") {
    if (safeScore >= 80) {
      statusColor = "text-emerald-800";
      statusBg = "bg-[#F0FDF4] border-[#BBF7D0]";
      barColor = "bg-emerald-600";
      defaultLabel = "Good / Stable";
    } else if (safeScore >= 60) {
      statusColor = "text-amber-800";
      statusBg = "bg-[#FFFBEB] border-[#FDE68A]";
      barColor = "bg-amber-500";
      defaultLabel = "Fair / Moderate Wear";
    } else if (safeScore >= 40) {
      statusColor = "text-orange-800";
      statusBg = "bg-[#FFF7ED] border-[#FED7AA]";
      barColor = "bg-orange-600";
      defaultLabel = "Poor Condition";
    } else {
      statusColor = "text-rose-800";
      statusBg = "bg-[#FEF2F2] border-[#FECDD3]";
      barColor = "bg-rose-600";
      defaultLabel = "Severe Degradation";
    }
  } else {
    // Risk score (higher = more dangerous)
    if (safeScore >= 75) {
      statusColor = "text-rose-800";
      statusBg = "bg-[#FEF2F2] border-[#FECDD3]";
      barColor = "bg-rose-600";
      defaultLabel = "CRITICAL RISK";
    } else if (safeScore >= 50) {
      statusColor = "text-orange-800";
      statusBg = "bg-[#FFF7ED] border-[#FED7AA]";
      barColor = "bg-orange-600";
      defaultLabel = "HIGH RISK";
    } else if (safeScore >= 25) {
      statusColor = "text-amber-800";
      statusBg = "bg-[#FFFBEB] border-[#FDE68A]";
      barColor = "bg-amber-500";
      defaultLabel = "MEDIUM RISK";
    } else {
      statusColor = "text-emerald-800";
      statusBg = "bg-[#F0FDF4] border-[#BBF7D0]";
      barColor = "bg-emerald-600";
      defaultLabel = "LOW RISK";
    }
  }

  const finalLabel = statusLabel || defaultLabel;

  return (
    <div className="p-4 rounded-lg bg-white border border-[#DFE3E1] space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#505E63] font-bold">
          {title}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${statusBg} ${statusColor}`}>
          {finalLabel}
        </span>
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-3xl font-extrabold text-[#141D20] font-mono tracking-tight">
          {safeScore.toFixed(1)}
        </span>
        <span className="text-xs font-mono text-[#79888E]">/ 100</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-[#EAE7E1] overflow-hidden border border-[#DFE3E1]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${(safeScore / max) * 100}%` }}
        />
      </div>

      {subtitle && (
        <p className="text-[11px] text-[#505E63] leading-snug pt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
