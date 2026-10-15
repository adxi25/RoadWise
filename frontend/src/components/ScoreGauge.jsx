import React from 'react';

/**
 * Clean Metric Telemetry Presentation for Road Condition & Maintenance Risk
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

  // Determine color and condition label
  let statusColor = "text-emerald-400";
  let statusBg = "bg-emerald-950/40 border-emerald-500/30";
  let barColor = "bg-emerald-500";
  let defaultLabel = "Good Condition";

  if (type === "condition") {
    if (safeScore >= 80) {
      statusColor = "text-emerald-400";
      statusBg = "bg-emerald-950/40 border-emerald-500/30";
      barColor = "bg-emerald-500";
      defaultLabel = "Relatively Good";
    } else if (safeScore >= 60) {
      statusColor = "text-amber-400";
      statusBg = "bg-amber-950/40 border-amber-500/30";
      barColor = "bg-amber-500";
      defaultLabel = "Fair / Moderate Wear";
    } else if (safeScore >= 40) {
      statusColor = "text-orange-400";
      statusBg = "bg-orange-950/40 border-orange-500/30";
      barColor = "bg-orange-500";
      defaultLabel = "Poor Condition";
    } else {
      statusColor = "text-rose-400";
      statusBg = "bg-rose-950/40 border-rose-500/30";
      barColor = "bg-rose-500";
      defaultLabel = "Heavy Structural Degradation";
    }
  } else {
    // Risk score
    if (safeScore >= 75) {
      statusColor = "text-rose-400";
      statusBg = "bg-rose-950/40 border-rose-500/30";
      barColor = "bg-rose-500";
      defaultLabel = "CRITICAL PRIORITY";
    } else if (safeScore >= 50) {
      statusColor = "text-orange-400";
      statusBg = "bg-orange-950/40 border-orange-500/30";
      barColor = "bg-orange-500";
      defaultLabel = "HIGH PRIORITY";
    } else if (safeScore >= 25) {
      statusColor = "text-amber-400";
      statusBg = "bg-amber-950/40 border-amber-500/30";
      barColor = "bg-amber-500";
      defaultLabel = "MEDIUM PRIORITY";
    } else {
      statusColor = "text-emerald-400";
      statusBg = "bg-emerald-950/40 border-emerald-500/30";
      barColor = "bg-emerald-500";
      defaultLabel = "LOW PRIORITY";
    }
  }

  const finalLabel = statusLabel || defaultLabel;

  return (
    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          {title}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${statusBg} ${statusColor}`}>
          {finalLabel}
        </span>
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
          {safeScore.toFixed(1)}
        </span>
        <span className="text-xs font-mono text-slate-500">/ 100</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${(safeScore / max) * 100}%` }}
        />
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 leading-tight pt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
