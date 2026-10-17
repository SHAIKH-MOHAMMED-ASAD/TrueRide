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

  let colorClasses = "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30";
  let dotColor = "bg-[#24813A]";

  if (normLevel === "HIGH") {
    colorClasses = "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/40";
    dotColor = "bg-[#D52222]";
  } else if (normLevel === "MEDIUM") {
    colorClasses = "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/40";
    dotColor = "bg-[#E7A500]";
  } else {
    colorClasses = "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30";
    dotColor = "bg-[#24813A]";
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-1.5 py-0.5"
      : size === "lg"
      ? "text-xs px-2.5 py-1 font-bold"
      : "text-[11px] px-2 py-0.5 font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border font-mono tracking-tight ${colorClasses} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-none ${dotColor}`} />
      <span>{normLevel} RISK</span>
      {showScore && score !== undefined && (
        <span className="font-mono font-bold opacity-90 pl-1 border-l border-current/20">
          {score.toFixed(0)}/100
        </span>
      )}
    </span>
  );
}

export function ActionBadge({ action }: { action: string }) {
  let badgeColor = "bg-[#F1F0ED] text-[#5D6266] border-[#D9D6CD]";
  let label = action;

  if (action === "ALLOW") {
    badgeColor = "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30";
    label = "ALLOW";
  } else if (action === "MONITOR") {
    badgeColor = "bg-[#F1F0ED] text-[#17191B] border-[#D9D6CD]";
    label = "MONITOR";
  } else if (action === "STEP_UP_VERIFY") {
    badgeColor = "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/40";
    label = "STEP-UP VERIFY";
  } else if (action === "ESCALATE_INVESTIGATION") {
    badgeColor = "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/40";
    label = "ESCALATE INVESTIGATION";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-mono font-bold border tracking-tight ${badgeColor}`}
    >
      {label}
    </span>
  );
}

export function EvidenceQualityBadge({ quality }: { quality: string }) {
  let color = "bg-[#F1F0ED] text-[#5D6266] border-[#D9D6CD]";
  if (quality === "HIGH") {
    color = "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30";
  } else if (quality === "MODERATE") {
    color = "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/40";
  } else if (quality === "LOW") {
    color = "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/40";
  } else if (quality === "INSUFFICIENT") {
    color = "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/40";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[11px] font-mono border ${color}`}
      title="Evidence Quality determines confidence in individual historical baseline"
    >
      <span className="opacity-70">Evidence:</span>
      <span className="font-bold">{quality}</span>
    </span>
  );
}
