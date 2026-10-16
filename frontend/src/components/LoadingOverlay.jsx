import React, { useState, useEffect } from 'react';
import { Cpu, Eye, Activity, Shield, Database, Check } from 'lucide-react';

export default function LoadingOverlay() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: "Validating road image & reading EXIF metadata", icon: Eye },
    { label: "Running YOLOv8 road defect neural inference (imgsz=640)", icon: Cpu },
    { label: "Computing exponential condition score & damage load", icon: Activity },
    { label: "Applying road category & facility sensitivity multipliers", icon: Shield },
    { label: "Persisting inspection record & detections to SQLite", icon: Database },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 sm:p-8 rounded-lg bg-white border border-[#DFE3E1] flex flex-col items-center justify-center space-y-6 max-w-md mx-auto shadow-sm">
      
      {/* Processing Indicator */}
      <div className="flex items-center justify-center w-12 h-12 rounded bg-[#EBF4F2] border border-[#CCDCD8] text-[#114B44]">
        <Cpu className="w-6 h-6 animate-pulse" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-[#141D20] uppercase font-mono tracking-wider">
          Executing Inspection Pipeline
        </h3>
        <p className="text-xs text-[#505E63] font-sans">
          Processing high-resolution pavement defect telemetry
        </p>
      </div>

      {/* Pipeline Steps List */}
      <div className="w-full space-y-2 pt-1">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={idx}
              className={`flex items-center space-x-2.5 p-2 rounded border text-xs transition-colors ${
                isCurrent
                  ? 'bg-[#EBF4F2] border-[#CCDCD8] text-[#114B44] font-semibold'
                  : isDone
                  ? 'bg-[#F8F7F4] border-[#DFE3E1] text-[#505E63]'
                  : 'opacity-40 border-transparent text-[#79888E]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-mono ${
                  isCurrent
                    ? 'bg-[#114B44] text-white font-bold'
                    : isDone
                    ? 'bg-[#F0FDF4] text-emerald-800 border border-[#BBF7D0]'
                    : 'bg-[#EAE7E1] text-[#79888E]'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              </div>
              <span className="truncate font-sans">{step.label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
