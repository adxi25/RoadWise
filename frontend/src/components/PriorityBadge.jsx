import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PriorityBadge({ priority = "LOW", size = "md", description = "" }) {
  const normPriority = (priority || "LOW").toUpperCase();

  const config = {
    CRITICAL: {
      label: "CRITICAL",
      icon: AlertOctagon,
      bg: "bg-rose-950/60",
      border: "border-rose-600/50",
      text: "text-rose-300",
      dot: "bg-rose-500",
      defaultDesc: "Immediate maintenance and field inspection recommended.",
    },
    HIGH: {
      label: "HIGH",
      icon: AlertTriangle,
      bg: "bg-orange-950/60",
      border: "border-orange-500/50",
      text: "text-orange-300",
      dot: "bg-orange-400",
      defaultDesc: "High priority. Maintenance should be scheduled soon.",
    },
    MEDIUM: {
      label: "MEDIUM",
      icon: AlertCircle,
      bg: "bg-amber-950/60",
      border: "border-amber-500/50",
      text: "text-amber-300",
      dot: "bg-amber-400",
      defaultDesc: "Moderate priority. Monitor and schedule routine maintenance.",
    },
    LOW: {
      label: "LOW",
      icon: CheckCircle2,
      bg: "bg-emerald-950/60",
      border: "border-emerald-600/50",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
      defaultDesc: "Low priority. Continue routine monitoring.",
    },
  };

  const current = config[normPriority] || config.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="inline-flex items-center space-x-2">
        <span
          className={`inline-flex items-center space-x-1.5 rounded-md border font-semibold font-mono tracking-wider ${current.bg} ${current.border} ${current.text} ${sizeClasses[size]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
          <span>{current.label} PRIORITY</span>
        </span>
      </div>

      {description && (
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {description}
        </p>
      )}
    </div>
  );
}
