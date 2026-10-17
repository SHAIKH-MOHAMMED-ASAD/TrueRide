import React from "react";

interface CategoryScores {
  behavioral: number;
  device: number;
  location: number;
  sessionAccount: number;
  historical: number;
}

interface CategoryRadarBarProps {
  scores: CategoryScores;
  contributions?: CategoryScores;
  weights?: {
    behavioral: number;
    device: number;
    location: number;
    sessionAccount: number;
    historical: number;
  };
}

export function CategoryRadarBar({
  scores,
  contributions,
  weights = {
    behavioral: 0.25,
    device: 0.2,
    location: 0.15,
    sessionAccount: 0.2,
    historical: 0.2,
  },
}: CategoryRadarBarProps) {
  const categories = [
    {
      key: "behavioral",
      label: "A. Behavioral Consistency",
      subscore: scores.behavioral,
      weight: weights.behavioral,
      contrib:
        contributions?.behavioral ??
        Math.round(scores.behavioral * weights.behavioral * 10) / 10,
      description: "Touch interval cadence, acceptance collapse, order navigation drift",
    },
    {
      key: "device",
      label: "B. Device Consistency",
      subscore: scores.device,
      weight: weights.device,
      contrib:
        contributions?.device ??
        Math.round(scores.device * weights.device * 10) / 10,
      description: "Hardware signature registry match; correlated device anomalies",
    },
    {
      key: "location",
      label: "C. Location & Travel",
      subscore: scores.location,
      weight: weights.location,
      contrib:
        contributions?.location ??
        Math.round(scores.location * weights.location * 10) / 10,
      description: "Primary zone adherence vs plausible city transitions",
    },
    {
      key: "sessionAccount",
      label: "D. Session & Account Changes",
      subscore: scores.sessionAccount,
      weight: weights.sessionAccount,
      contrib:
        contributions?.sessionAccount ??
        Math.round(scores.sessionAccount * weights.sessionAccount * 10) / 10,
      description: "Rapid re-login sequence, payout rerouting, credential updates",
    },
    {
      key: "historical",
      label: "E. Historical Risk Context",
      subscore: scores.historical,
      weight: weights.historical,
      contrib:
        contributions?.historical ??
        Math.round(scores.historical * weights.historical * 10) / 10,
      description: "Multi-session persistent drift & prior corroborated cases",
    },
  ];

  return (
    <div className="space-y-3.5">
      {categories.map((cat) => {
        const isHigh = cat.subscore >= 70;
        const isMed = cat.subscore >= 35 && cat.subscore < 70;

        let barColor = "bg-cyan-500";
        let textColor = "text-cyan-400";
        if (isHigh) {
          barColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
          textColor = "text-rose-400";
        } else if (isMed) {
          barColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
          textColor = "text-amber-300";
        }

        return (
          <div key={cat.key} className="text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-200">{cat.label}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  ({Math.round(cat.weight * 100)}% Weight)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className={`font-semibold ${textColor}`}>
                  {cat.subscore.toFixed(0)}/100
                </span>
                <span className="text-slate-400 text-[11px]">
                  (+{cat.contrib.toFixed(1)} pts)
                </span>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ease-out rounded-full ${barColor}`}
                style={{ width: `${Math.max(2, Math.min(100, cat.subscore))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {cat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
