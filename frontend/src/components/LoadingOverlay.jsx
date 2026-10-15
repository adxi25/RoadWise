import React, { useState, useEffect } from 'react';
import { Cpu, Eye, Activity, Shield, Database, Check } from 'lucide-react';

export default function LoadingOverlay() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: "Validating road image & reading EXIF metadata", icon: Eye },
    { label: "Running YOLOv8 road defect neural inference (imgsz=640)", icon: Cpu },
    { label: "Computing exponential condition score & damage load", icon: Activity },
    { label: "Applying road context & location risk multipliers", icon: Shield },
    { label: "Persisting inspection record & detections to database", icon: Database },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 sm:p-8 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto shadow-lg">
      
      {/* Processing Indicator */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-400">
        <Cpu className="w-6 h-6 animate-pulse" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
          Executing Inspection Pipeline
        </h3>
        <p className="text-xs text-slate-400 font-sans">
          Processing high-resolution road surface analysis
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
              className={`flex items-center space-x-2.5 p-2 rounded-lg border text-xs transition-colors ${
                isCurrent
                  ? 'bg-slate-950 border-cyan-500/40 text-cyan-300 font-medium'
                  : isDone
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : 'opacity-40 border-transparent text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-mono ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : isDone
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
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
