import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PriorityBadge({ priority = "LOW", size = "md", description = "" }) {
  const normPriority = (priority || "LOW").toUpperCase();

  const config = {
    CRITICAL: {
      label: "CRITICAL",
      icon: AlertOctagon,
      bg: "bg-[#FEF2F2]",
      border: "border-[#FECDD3]",
      text: "text-[#991B1B]",
      dot: "bg-[#DC2626]",
      defaultDesc: "Immediate maintenance and field engineering verification recommended.",
    },
    HIGH: {
      label: "HIGH",
      icon: AlertTriangle,
      bg: "bg-[#FFF7ED]",
      border: "border-[#FED7AA]",
      text: "text-[#C2410C]",
      dot: "bg-[#EA580C]",
      defaultDesc: "High priority. Maintenance dispatch should be scheduled promptly.",
    },
    MEDIUM: {
      label: "MEDIUM",
      icon: AlertCircle,
      bg: "bg-[#FFFBEB]",
      border: "border-[#FDE68A]",
      text: "text-[#B45309]",
      dot: "bg-[#D97706]",
      defaultDesc: "Moderate priority. Monitor condition and schedule routine maintenance.",
    },
    LOW: {
      label: "LOW",
      icon: CheckCircle2,
      bg: "bg-[#F0FDF4]",
      border: "border-[#BBF7D0]",
      text: "text-[#166534]",
      dot: "bg-[#16A34A]",
      defaultDesc: "Low priority. Pavement stable; continue routine monitoring.",
    },
  };

  const current = config[normPriority] || config.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-xs sm:text-sm",
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="inline-flex items-center space-x-2">
        <span
          className={`inline-flex items-center space-x-1.5 rounded border font-bold font-mono tracking-wider ${current.bg} ${current.border} ${current.text} ${sizeClasses[size]} shadow-2xs`}
        >
          <span className={`w-2 h-2 rounded-full ${current.dot}`} />
          <Icon className="w-3.5 h-3.5" />
          <span>{current.label} PRIORITY</span>
        </span>
      </div>

      {description && (
        <p className="text-xs text-[#505E63] leading-relaxed font-sans">
          {description}
        </p>
      )}
    </div>
  );
}
