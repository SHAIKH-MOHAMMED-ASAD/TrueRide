"use client";

import React, { useMemo } from "react";
import {
  Activity,
  Smartphone,
  MapPin,
  ShieldAlert,
  History,
  ExternalLink,
  Fingerprint,
} from "lucide-react";
import { FleetCourier } from "@/lib/services/fleetRadarData";

interface RiderTelemetryPanelProps {
  selectedCourier: FleetCourier;
  onNavigateToCase?: (caseId: string) => void;
  onAuthenticateCourier?: (courier: FleetCourier) => void;
}

export function RiderTelemetryPanel({
  selectedCourier,
  onNavigateToCase,
  onAuthenticateCourier,
}: RiderTelemetryPanelProps) {
  const { telemetry } = selectedCourier;

  // Generate dynamic waveform SVG path based on cadence & jitter
  const waveformPath = useMemo(() => {
    const isHighRisk = selectedCourier.riskLevel === "L3";
    const isMediumRisk = selectedCourier.riskLevel === "L2";
    const points: string[] = [];
    const width = 280;
    const height = 44;
    const midY = height / 2;
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      let y = midY;
      if (isHighRisk) {
        // Erratic jagged collapse waveform
        const noise = Math.sin(i * 1.4) * 16 + Math.cos(i * 3.1) * 6;
        y = midY + (i % 2 === 0 ? noise : -noise * 0.8);
      } else if (isMediumRisk) {
        // Slightly erratic waveform
        const noise = Math.sin(i * 0.8) * 9;
        y = midY + noise;
      } else {
        // Harmonious smooth rhythmic cadence wave
        const wave = Math.sin((i / steps) * Math.PI * 4) * 11;
        y = midY + wave;
      }
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(" ");
  }, [selectedCourier]);

  const getRiskPillColor = (score: number) => {
    if (score >= 70) return "text-[#D52222] bg-[#FCE5E3] border-[#D52222]/40";
    if (score >= 40) return "text-[#E06D14] bg-[#FEE8D6] border-[#E06D14]/40";
    if (score >= 20) return "text-[#E7A500] bg-[#FFF5D6] border-[#E7A500]/40";
    return "text-[#24813A] bg-[#E8F4E8] border-[#24813A]/30";
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] overflow-hidden shadow-xs">
      {/* Header Bar (TrueRide Industrial Theme) */}
      <div className="p-3 border-b border-[#3F4241] bg-[#2F3130] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FFD900]" />
          <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
            RIDER TELEMETRY
          </span>
        </div>
        <span className="px-2 py-0.5 font-mono text-xs font-bold rounded-[2px] bg-[#17191B] border border-[#3F4241] text-[#FFD900]">
          {selectedCourier.id}
        </span>
      </div>

      {/* Main Scrollable Telemetry View */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3.5 scrollbar-thin scrollbar-thumb-[#D9D6CD]">
        {/* Live Touch Cadence Sensor Jitter Waveform */}
        <div className="bg-[#17191B] p-3 rounded-[2px] border border-[#3F4241] text-white">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-[#8B8D8C]">TOUCH CADENCE JITTER (50ms)</span>
            <span
              className={`font-bold ${
                selectedCourier.riskLevel === "L3"
                  ? "text-[#D52222]"
                  : selectedCourier.riskLevel === "L2"
                  ? "text-[#E06D14]"
                  : "text-[#24813A]"
              }`}
            >
              {selectedCourier.riskLevel === "L3" ? "Erratic / Divergent" : "Rhythm Synchronized"}
            </span>
          </div>

          <div className="w-full h-11 bg-[#24262B] rounded-[2px] border border-[#3F4241] flex items-center justify-center overflow-hidden relative">
            <svg viewBox="0 0 280 44" className="w-full h-full">
              <path
                d={waveformPath}
                fill="none"
                stroke={
                  selectedCourier.riskLevel === "L3"
                    ? "#D52222"
                    : selectedCourier.riskLevel === "L2"
                    ? "#E06D14"
                    : "#24813A"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#8B8D8C]">
            <span>Avg: {telemetry.avgCadenceSec}s</span>
            <span>Base: {telemetry.baselineCadenceSec}s</span>
            <span>Drift: {telemetry.baselineDriftSigma}σ</span>
          </div>
        </div>

        {/* Attribution Waterfall */}
        <div className="bg-[#F1F0ED] p-3 rounded-[2px] border border-[#D9D6CD]">
          <div className="text-[10px] font-mono text-[#5D6266] mb-2 font-bold uppercase tracking-wider">
            ATTRIBUTION WATERFALL
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#5D6266]">Grip tilt consistency:</span>
              <span className="text-[#17191B] font-bold">{telemetry.gripConsistency}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5D6266]">Acceptance reaction:</span>
              <span className="text-[#17191B] font-bold">{telemetry.reactionTimeScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5D6266]">Hardware fingerprint:</span>
              <span
                className={`font-bold ${
                  telemetry.isKnownDevice ? "text-[#24813A]" : "text-[#D52222]"
                }`}
              >
                {telemetry.isKnownDevice ? "Known Enrolled" : "Unverified New Device"}
              </span>
            </div>
          </div>
        </div>

        {/* Life-Event Dampener */}
        <div className="bg-[#FFFFFF] p-3 rounded-[2px] border border-[#D9D6CD]">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-[#24813A] font-bold flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5" />
              LIFE-EVENT DAMPENER
            </span>
            <span className="text-xs font-mono font-bold text-[#17191B]">
              PBC: {telemetry.personBoundConsistency.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] font-sans text-[#5D6266] leading-relaxed">
            {telemetry.personBoundConsistency >= 0.85
              ? "Baseline stable. Person-Bound Consistency (PBC) confirms true enrolled courier despite routine transit changes."
              : "Dampener threshold breached. High behavioral divergence indicates likely account substitution."}
          </div>
        </div>

        {/* 5 TrueRide Risk Engine Categories */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-[#5D6266] font-bold tracking-wider uppercase">
            5-CATEGORY ENGINE BREAKDOWN
          </div>

          {/* 1. Behavioral Consistency */}
          <div className="bg-[#F1F0ED] p-2 rounded-[2px] border border-[#D9D6CD] text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#17191B] font-semibold">
                <Activity className="w-3.5 h-3.5 text-[#5D6266]" />
                <span>1. Behavioral Consistency</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border ${getRiskPillColor(
                  telemetry.categoryScores.behavioral
                )}`}
              >
                {telemetry.categoryScores.behavioral}/100
              </span>
            </div>
          </div>

          {/* 2. Device Consistency */}
          <div className="bg-[#F1F0ED] p-2 rounded-[2px] border border-[#D9D6CD] text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#17191B] font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-[#5D6266]" />
                <span>2. Device Consistency</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border ${getRiskPillColor(
                  telemetry.categoryScores.device
                )}`}
              >
                {telemetry.categoryScores.device}/100
              </span>
            </div>
            <div className="text-[10px] text-[#8B8D8C] mt-0.5 pl-5">
              Device: {telemetry.deviceId}
            </div>
          </div>

          {/* 3. Location & Travel Consistency */}
          <div className="bg-[#F1F0ED] p-2 rounded-[2px] border border-[#D9D6CD] text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#17191B] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#5D6266]" />
                <span>3. Location & Travel</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border ${getRiskPillColor(
                  telemetry.categoryScores.location
                )}`}
              >
                {telemetry.categoryScores.location}/100
              </span>
            </div>
            <div className="text-[10px] text-[#8B8D8C] mt-0.5 pl-5">
              Zone: {telemetry.operatingZone}
            </div>
          </div>

          {/* 4. Session & Account Changes */}
          <div className="bg-[#F1F0ED] p-2 rounded-[2px] border border-[#D9D6CD] text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#17191B] font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-[#5D6266]" />
                <span>4. Session & Account</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border ${getRiskPillColor(
                  telemetry.categoryScores.sessionAccount
                )}`}
              >
                {telemetry.categoryScores.sessionAccount}/100
              </span>
            </div>
          </div>

          {/* 5. Historical Risk Context */}
          <div className="bg-[#F1F0ED] p-2 rounded-[2px] border border-[#D9D6CD] text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#17191B] font-semibold">
                <History className="w-3.5 h-3.5 text-[#5D6266]" />
                <span>5. Historical Risk</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border ${getRiskPillColor(
                  telemetry.categoryScores.historical
                )}`}
              >
                {telemetry.categoryScores.historical}/100
              </span>
            </div>
          </div>
        </div>

        {/* Explainable Risk Signals List */}
        {telemetry.signals.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-[#D52222] font-bold tracking-wider uppercase">
              TRIGGERED SIGNALS ({telemetry.signals.length})
            </div>
            {telemetry.signals.map((sig, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] p-2 rounded-[2px] border border-[#D9D6CD] text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between text-[#17191B]">
                  <span className="font-bold">{sig.name}</span>
                  <span className="text-[#D52222] font-bold">+{sig.subscore}</span>
                </div>
                <div className="text-[10px] text-[#5D6266]">Observed: {sig.observed}</div>
                <div className="text-[10px] text-[#8B8D8C]">Baseline: {sig.baseline}</div>
                <div className="text-[10px] text-[#17191B] pt-1 border-t border-[#D9D6CD]/60 font-sans">
                  {sig.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step-Up Authentication Trigger for Suspicious Couriers */}
        {(selectedCourier.riskLevel === "L2" || selectedCourier.riskLevel === "L3" || ((selectedCourier as any).riskScore || 0) >= 40) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onAuthenticateCourier?.(selectedCourier)}
              className="w-full py-2.5 px-3 bg-[#17191B] hover:bg-[#2F3130] text-[#FFD900] rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs border border-[#30363D]"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FFD900]" />
              <span>Authenticate Suspicious Courier</span>
            </button>
          </div>
        )}

        {/* Investigation Case Link */}
        {selectedCourier.caseId && (
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => onNavigateToCase?.(selectedCourier.caseId!)}
              className="w-full py-2 px-3 bg-[#FFD900] hover:bg-[#e6c400] text-[#17191B] rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <span>Inspect Investigation Case ({selectedCourier.caseId})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
