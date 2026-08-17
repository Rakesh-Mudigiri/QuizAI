import React, { useState, useEffect } from "react";
import { DonutChart } from "@/components/ui/donut-chart";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const generationPhases = [
  { value: 35, color: "#6366F1", label: "Extracting Content", icon: "menu_book" },
  { value: 30, color: "#8B5CF6", label: "AI Reasoning & Analysis", icon: "psychology" },
  { value: 20, color: "#EC4899", label: "Synthesizing Questions", icon: "auto_awesome" },
  { value: 15, color: "#10B981", label: "Validating Answer Keys", icon: "verified" },
];

export default function QuizLoadingDonut({ topicOrFilename = "Study Material" }) {
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % generationPhases.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const currentPhase = generationPhases[activeStep];
  const displayLabel = hoveredSegment?.label || currentPhase.label;
  const displayColor = hoveredSegment?.color || currentPhase.color;
  const displayIcon = hoveredSegment?.icon || currentPhase.icon;

  return (
    <Card className="p-8 w-full max-w-lg mx-auto flex flex-col items-center justify-center space-y-6 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/20 text-slate-100 shadow-2xl rounded-2xl relative overflow-hidden">
      {/* Decorative Glow background */}
      <div 
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: displayColor }}
      />
      <div 
        className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: displayColor }}
      />

      <div className="text-center space-y-1 z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          <span>AI Engine Processing</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Generating Your Custom Quiz
        </h3>
        <p className="text-sm text-slate-400 max-w-xs truncate mx-auto">
          Source: <span className="text-slate-200 font-medium">{topicOrFilename}</span>
        </p>
      </div>

      <div className="relative flex items-center justify-center py-2 z-10">
        <DonutChart
          data={generationPhases}
          size={240}
          strokeWidth={26}
          animationDuration={1.5}
          animationDelayPerSegment={0.1}
          highlightOnHover={true}
          onSegmentHover={(seg) => setHoveredSegment(seg)}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col items-center justify-center text-center p-2"
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 shadow-lg transition-colors duration-300"
                  style={{ backgroundColor: `${displayColor}25`, color: displayColor }}
                >
                  <span className="material-symbols-outlined text-xl">{displayIcon}</span>
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate max-w-[130px]">
                  {displayLabel}
                </p>
                <span className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Analyzing
                </span>
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      {/* Phase Status List */}
      <div className="w-full space-y-2 pt-2 border-t border-slate-800/80 z-10">
        {generationPhases.map((phase, idx) => {
          const isActive = idx === activeStep;
          return (
            <motion.div
              key={phase.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg transition-all duration-300 text-xs font-medium",
                isActive 
                  ? "bg-slate-800/90 border border-slate-700/80 shadow-md text-white" 
                  : "text-slate-400 hover:bg-slate-800/40"
              )}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-transform duration-300",
                    isActive && "scale-125"
                  )}
                  style={{ backgroundColor: phase.color }}
                />
                <span className="material-symbols-outlined text-sm text-slate-400">{phase.icon}</span>
                <span>{phase.label}</span>
              </div>
              {isActive ? (
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                  Active
                </span>
              ) : (
                <span className="text-slate-500">Ready</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
