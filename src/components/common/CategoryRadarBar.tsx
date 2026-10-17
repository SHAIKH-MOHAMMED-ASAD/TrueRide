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
    <div className="space-y-3">
      {categories.map((cat) => {
        const isHigh = cat.subscore >= 70;
        const isMed = cat.subscore >= 35 && cat.subscore < 70;

        let barColor = "bg-[#24813A]";
        let textColor = "text-[#24813A]";
        let bgTag = "bg-[#E8F4E8]";

        if (isHigh) {
          barColor = "bg-[#D52222]";
          textColor = "text-[#D52222]";
          bgTag = "bg-[#FCE5E3]";
        } else if (isMed) {
          barColor = "bg-[#E7A500]";
          textColor = "text-[#E7A500]";
          bgTag = "bg-[#FFF5D6]";
        }

        return (
          <div
            key={cat.key}
            className="p-3 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] transition hover:border-[#8B8D8C]"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#17191B] tracking-tight">{cat.label}</span>
                <span className="text-[10px] text-[#5D6266] font-mono">
                  Weight: {(cat.weight * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className={`px-1.5 py-0.2 rounded-[1px] text-[11px] font-bold ${textColor} ${bgTag}`}>
                  Score: {cat.subscore.toFixed(0)}/100
                </span>
                <span className="text-[11px] text-[#5D6266] pl-1.5 border-l border-[#D9D6CD]">
                  Contrib: +{cat.contrib.toFixed(1)} pts
                </span>
              </div>
            </div>

            {/* Industrial Square Progress Bar */}
            <div className="w-full h-2 bg-[#F1F0ED] rounded-[1px] overflow-hidden border border-[#D9D6CD]/60 relative">
              <div
                className={`h-full ${barColor} transition-all duration-300 rounded-[1px]`}
                style={{ width: `${Math.min(100, Math.max(0, cat.subscore))}%` }}
              />
            </div>

            <div className="mt-1 text-[11px] text-[#5D6266] flex items-center justify-between">
              <span>{cat.description}</span>
              <span className="font-mono text-[10px] text-[#8B8D8C]">
                {isHigh ? "Elevated Risk Signal" : isMed ? "Moderate Divergence" : "Normal Baseline"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
