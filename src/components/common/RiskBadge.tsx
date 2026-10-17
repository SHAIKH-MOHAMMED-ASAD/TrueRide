import React from "react";

interface RiskBadgeProps {
  score?: number;
  level?: "LOW" | "MEDIUM" | "HIGH" | string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function RiskBadge({
  score,
  level = "LOW",
  size = "md",
  showScore = true,
}: RiskBadgeProps) {
  const normLevel = level.toUpperCase();

  let colorClasses = "bg-emerald-950/70 text-emerald-400 border-emerald-700/60";
  let dotColor = "bg-emerald-400";

  if (normLevel === "HIGH") {
    colorClasses = "bg-rose-950/80 text-rose-300 border-rose-600/70 glow-red";
    dotColor = "bg-rose-500 animate-pulse";
  } else if (normLevel === "MEDIUM") {
    colorClasses = "bg-amber-950/70 text-amber-300 border-amber-600/70 glow-amber";
    dotColor = "bg-amber-400";
  } else {
    colorClasses = "bg-cyan-950/60 text-cyan-300 border-cyan-800/70";
    dotColor = "bg-cyan-400";
  }

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5"
      : size === "lg"
      ? "text-sm px-3.5 py-1.5 font-semibold"
      : "text-xs px-2.5 py-1 font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{normLevel} RISK</span>
      {showScore && score !== undefined && (
        <span className="font-mono opacity-90 pl-1 border-l border-current/20">
          {score.toFixed(0)}/100
        </span>
      )}
    </span>
  );
}

export function ActionBadge({ action }: { action: string }) {
  let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
  let label = action;

  if (action === "ALLOW") {
    badgeColor = "bg-emerald-900/40 text-emerald-300 border-emerald-800";
    label = "ALLOW";
  } else if (action === "MONITOR") {
    badgeColor = "bg-blue-900/40 text-blue-300 border-blue-800";
    label = "MONITOR";
  } else if (action === "STEP_UP_VERIFY") {
    badgeColor = "bg-amber-900/50 text-amber-200 border-amber-700";
    label = "STEP-UP VERIFY";
  } else if (action === "ESCALATE_INVESTIGATION") {
    badgeColor = "bg-rose-900/60 text-rose-200 border-rose-700";
    label = "ESCALATE INVESTIGATION";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${badgeColor}`}
    >
      {label}
    </span>
  );
}

export function EvidenceQualityBadge({ quality }: { quality: string }) {
  let color = "bg-slate-800 text-slate-400 border-slate-700";
  if (quality === "HIGH") {
    color = "bg-teal-950/60 text-teal-300 border-teal-800";
  } else if (quality === "MODERATE") {
    color = "bg-sky-950/60 text-sky-300 border-sky-800";
  } else if (quality === "LOW") {
    color = "bg-amber-950/60 text-amber-300 border-amber-800";
  } else if (quality === "INSUFFICIENT") {
    color = "bg-purple-950/60 text-purple-300 border-purple-800";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${color}`}
      title="Evidence Quality determines confidence in individual historical baseline"
    >
      <span className="opacity-70">Evidence:</span>
      <span className="font-semibold">{quality}</span>
    </span>
  );
}
