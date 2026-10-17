"use client";

import React from "react";
import { Sliders, ShieldCheck, AlertCircle } from "lucide-react";
import { RADAR_PRESETS } from "@/lib/services/fleetRadarData";

interface JudgeScenarioSandboxProps {
  activePresetKey: string;
  onSelectPreset: (presetKey: string) => void;
}

export function JudgeScenarioSandbox({
  activePresetKey,
  onSelectPreset,
}: JudgeScenarioSandboxProps) {
  return (
    <div className="w-full bg-[#2F3130] border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#3F4241] rounded-[2px] p-3 text-xs font-mono text-white shadow-sm shrink-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#3F4241]">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#FFD900]" />
          <span className="font-bold text-white tracking-wider uppercase text-[11px]">
            JUDGE SCENARIO SANDBOX (Mission M9)
          </span>
          <span className="text-[#8B8D8C]">|</span>
          <span className="text-[#D5D7D6] text-[10px]">
            Presets A–D • Real-Time Engine Overrides
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#24813A] bg-[#E8F4E8] px-2 py-0.5 rounded-[2px] font-bold">
          <ShieldCheck className="w-3 h-3 text-[#24813A]" />
          <span>Worker-First: No Auto-Deactivations</span>
        </div>
      </div>

      {/* 4 Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.values(RADAR_PRESETS).map((preset) => {
          const isActive = activePresetKey === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`text-left p-2 rounded-[2px] border transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1B1D1C] border-[#FFD900] ring-1 ring-[#FFD900] shadow-xs"
                  : "bg-[#242625] border-[#3F4241] hover:border-[#8B8D8C] hover:bg-[#2C2E2D]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{preset.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-[2px] font-bold ${
                    preset.id === "presetA"
                      ? "bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30"
                      : preset.id === "presetB"
                      ? "bg-[#FCE5E3] text-[#D52222] border border-[#D52222]/40"
                      : "bg-[#FFF5D6] text-[#E7A500] border border-[#E7A500]/40"
                  }`}
                >
                  {preset.badge}
                </span>
              </div>
              <div className="text-[11px] font-sans font-bold text-[#EAEAE6] truncate">
                {preset.subtitle}
              </div>
              <div className="text-[10px] font-sans text-[#D5D7D6] line-clamp-1 mt-0.5 leading-snug">
                {preset.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legal & Compliance Notice */}
      <div className="mt-2 pt-1.5 border-t border-[#3F4241] flex flex-wrap items-center justify-between text-[10px] text-[#8B8D8C]">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-[#FFD900]" />
          <span>Notice: Synthetic + live-phone demo. Real-fleet accuracy is not claimed.</span>
        </div>
        <div className="text-[#FFD900] font-mono">
          Target Courier: r_0042 (Arjun Kumar • RDR-8021)
        </div>
      </div>
    </div>
  );
}
