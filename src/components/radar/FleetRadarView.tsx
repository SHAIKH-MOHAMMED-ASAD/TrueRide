"use client";

import React, { useState, useMemo } from "react";
import { Radio, Flame, CheckCircle2, AlertTriangle, ShieldAlert, ShieldX } from "lucide-react";
import {
  FleetCourier,
  INITIAL_MUMBAI_COURIERS,
  applyPresetToCouriers,
} from "@/lib/services/fleetRadarData";
import { FleetRadarMap } from "./FleetRadarMap";
import { RiderMonitorList } from "./RiderMonitorList";
import { RiderTelemetryPanel } from "./RiderTelemetryPanel";
import { JudgeScenarioSandbox } from "./JudgeScenarioSandbox";
import { SuspiciousUserAuthModal } from "@/components/verification/SuspiciousUserAuthModal";

interface FleetRadarViewProps {
  onNavigateToTab?: (tab: string, param?: string) => void;
  mapApiKey?: string;
  mapProvider?: string;
}

export function FleetRadarView({ onNavigateToTab, mapApiKey, mapProvider }: FleetRadarViewProps) {
  // Master courier list state
  const [couriers, setCouriers] = useState<FleetCourier[]>(INITIAL_MUMBAI_COURIERS);
  const [authCourier, setAuthCourier] = useState<FleetCourier | null>(null);

  // Default selected is r_0042 (primary flagged courier)
  const [selectedCourierId, setSelectedCourierId] = useState<string>("r_0042");

  // Active Preset Key (presetB is Rented Account Swap matching detection state)
  const [activePresetKey, setActivePresetKey] = useState<string>("presetB");

  // Map layer toggles
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showSyndicates, setShowSyndicates] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);

  // Responsive mobile tab
  const [mobileTab, setMobileTab] = useState<"map" | "list" | "telemetry">("map");

  // Expanded map mode (takes full 12-column grid when toggled)
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Current selected courier object
  const selectedCourier = useMemo(() => {
    return couriers.find((c) => c.id === selectedCourierId) || couriers[0];
  }, [couriers, selectedCourierId]);

  // Compute live fleet counters
  const counts = useMemo(() => {
    return {
      total: couriers.length,
      L0: couriers.filter((c) => c.riskLevel === "L0").length,
      L1: couriers.filter((c) => c.riskLevel === "L1").length,
      L2: couriers.filter((c) => c.riskLevel === "L2").length,
      L3: couriers.filter((c) => c.riskLevel === "L3").length,
    };
  }, [couriers]);

  // Handle Preset selection
  const handleSelectPreset = (presetKey: string) => {
    setActivePresetKey(presetKey);
    const updated = applyPresetToCouriers(presetKey, couriers);
    setCouriers(updated);
    setSelectedCourierId("r_0042");
  };

  // Handle Courier selection
  const handleSelectCourier = (c: FleetCourier) => {
    setSelectedCourierId(c.id);
  };

  const handleNavigateToCase = (caseId: string) => {
    if (onNavigateToTab) {
      onNavigateToTab("cases", caseId);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-4 gap-3 bg-[#F7F7F5] text-[#17191B] font-sans overflow-hidden">
      {/* Top Fleet Radar Status Header (TrueRide Industrial Theme) */}
      <div className="bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[2px] bg-[#FFD900] flex items-center justify-center text-[#17191B]">
            <Flame className="w-4 h-4 fill-[#17191B] text-[#17191B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-[#17191B] tracking-wider uppercase">
                FLEET TRUST RADAR
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD] font-bold">
                MUMBAI METRO
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#8B8D8C]">
              Continuous Behavioral Identity Intelligence • Real-Time Fleet Feed
            </div>
          </div>
        </div>

        {/* Dynamic Risk Band Badges (TrueRide Industrial Tokens) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          {/* L0 Silent */}
          <div className="px-2.5 py-1 rounded-[2px] bg-[#E8F4E8] border border-[#24813A]/30 flex items-center gap-1.5 text-xs font-mono text-[#24813A]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-bold">L0 Silent: {counts.L0}</span>
          </div>

          {/* L1 Ambient */}
          <div className="px-2.5 py-1 rounded-[2px] bg-[#FFF5D6] border border-[#E7A500]/40 flex items-center gap-1.5 text-xs font-mono text-[#E7A500]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-bold">L1 Ambient: {counts.L1}</span>
          </div>

          {/* L2 Challenge */}
          <div className="px-2.5 py-1 rounded-[2px] bg-[#FEE8D6] border border-[#E06D14]/40 flex items-center gap-1.5 text-xs font-mono text-[#E06D14]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="font-bold">L2 Challenge: {counts.L2}</span>
          </div>

          {/* L3 Hold */}
          <div className="px-2.5 py-1 rounded-[2px] bg-[#FCE5E3] border border-[#D52222]/40 flex items-center gap-1.5 text-xs font-mono text-[#D52222]">
            <ShieldX className="w-3.5 h-3.5" />
            <span className="font-bold">L3 Hold: {counts.L3}</span>
          </div>
        </div>

        {/* Engine Pipeline Status */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#5D6266]">
          <span className="w-2 h-2 rounded-[1px] bg-[#24813A]" />
          <span className="text-[#24813A] font-bold">PIPELINE ONLINE</span>
          <span className="text-[#8B8D8C] text-[10px]">v2.0</span>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible only below lg breakpoint) */}
      <div className="lg:hidden flex items-center bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] p-1 text-xs font-mono shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("map")}
          className={`flex-1 py-1.5 text-center rounded-[2px] font-bold transition cursor-pointer ${
            mobileTab === "map" ? "bg-[#FFD900] text-[#17191B]" : "text-[#5D6266]"
          }`}
        >
          Tactical Map
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-1.5 text-center rounded-[2px] font-bold transition cursor-pointer ${
            mobileTab === "list" ? "bg-[#FFD900] text-[#17191B]" : "text-[#5D6266]"
          }`}
        >
          Rider Monitor ({couriers.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("telemetry")}
          className={`flex-1 py-1.5 text-center rounded-[2px] font-bold transition cursor-pointer ${
            mobileTab === "telemetry" ? "bg-[#FFD900] text-[#17191B]" : "text-[#5D6266]"
          }`}
        >
          Telemetry ({selectedCourier.id})
        </button>
      </div>

      {/* Workspace Grid (Adapts to 3 columns or full expanded map) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Column: Rider Monitor (hidden when map is expanded) */}
        {!isMapExpanded && (
          <div
            className={`lg:col-span-3 h-full min-h-0 flex flex-col ${
              mobileTab === "list" ? "block" : "hidden lg:flex"
            }`}
          >
            <RiderMonitorList
              couriers={couriers}
              selectedCourier={selectedCourier}
              onSelectCourier={handleSelectCourier}
            />
          </div>
        )}

        {/* Center Column: Tactical Radar Map (Takes 12 columns if expanded, otherwise 6) */}
        <div
          className={`${
            isMapExpanded ? "lg:col-span-12" : "lg:col-span-6"
          } h-full min-h-0 flex flex-col ${
            mobileTab === "map" ? "block" : "hidden lg:flex"
          }`}
        >
          <FleetRadarMap
            couriers={couriers}
            selectedCourier={selectedCourier}
            onSelectCourier={handleSelectCourier}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            showSyndicates={showSyndicates}
            setShowSyndicates={setShowSyndicates}
            showCorridors={showCorridors}
            setShowCorridors={setShowCorridors}
            mapApiKey={mapApiKey}
            mapProvider={mapProvider}
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded((v) => !v)}
          />
        </div>

        {/* Right Column: Rider Telemetry (hidden when map is expanded) */}
        {!isMapExpanded && (
          <div
            className={`lg:col-span-3 h-full min-h-0 flex flex-col ${
              mobileTab === "telemetry" ? "block" : "hidden lg:flex"
            }`}
          >
            <RiderTelemetryPanel
              selectedCourier={selectedCourier}
              onNavigateToCase={handleNavigateToCase}
              onAuthenticateCourier={(c) => setAuthCourier(c)}
            />
          </div>
        )}
      </div>

      {/* Bottom Row: Judge Scenario Sandbox (Pinned at bottom, compact) */}
      <JudgeScenarioSandbox
        activePresetKey={activePresetKey}
        onSelectPreset={handleSelectPreset}
      />

      {/* Suspicious Courier Authentication Modal */}
      {authCourier && (
        <SuspiciousUserAuthModal
          isOpen={true}
          courier={{
            id: authCourier.id,
            name: authCourier.name,
            riskScore: (authCourier as any).riskScore ?? (authCourier.riskLevel === "L3" ? 84 : 62),
            riskLevel: authCourier.riskLevel,
            zone: authCourier.zone,
            caseId: authCourier.caseId,
            triggers: authCourier.telemetry?.signals?.map((s) => s.explanation),
          }}
          onClose={() => setAuthCourier(null)}
          onComplete={(result) => {
            if (result.authVerdict === "AUTHENTICATED") {
              // Immediately restore courier to L0 Silent on Tactical Radar
              setCouriers((prev) =>
                prev.map((c) =>
                  c.id === authCourier.id
                    ? {
                        ...c,
                        riskLevel: "L0",
                        telemetry: {
                          ...c.telemetry,
                          riskScore: 12,
                          personBoundConsistency: 0.96,
                          baselineDriftSigma: 0.4,
                          signals: [],
                        },
                      }
                    : c
                )
              );
            }
          }}
        />
      )}
    </div>
  );
}
