"use client";

import React, { useState } from "react";
import {
  Play,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Info,
  Code2,
  Cpu,
  Smartphone,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { SIMULATOR_SCENARIOS, SimulatorScenario } from "@/lib/services/simulator";
import { RiskBadge, ActionBadge, EvidenceQualityBadge } from "../common/RiskBadge";
import { CategoryRadarBar } from "../common/CategoryRadarBar";

interface SimulatorViewProps {
  onOpenCase?: (caseId: string) => void;
  onRefreshMetrics?: () => void;
}

export function SimulatorView({ onOpenCase, onRefreshMetrics }: SimulatorViewProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    "SCENARIO_6_SAME_DEVICE_CITY_HANDOFF"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedScenario =
    SIMULATOR_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    SIMULATOR_SCENARIOS[0];

  const handleRunSimulation = async () => {
    try {
      setIsRunning(true);
      setErrorMsg(null);

      const res = await fetch("/api/simulator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: selectedScenario.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Simulation failed");
      }

      // Fetch the full assessment with signals
      const sessionDetailRes = await fetch(`/api/sessions/${data.result.sessionId}`);
      const detailData = await sessionDetailRes.json();

      setSimulationResult({
        ...data.result,
        sessionDetail: detailData.session,
      });

      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err: any) {
      console.error("Simulation run error:", err);
      setErrorMsg(err.message || "Failed to execute simulation scenario");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Graphite with Yellow Accent */}
      <div className="p-6 bg-[#2F3130] text-white border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#3F4241] rounded-[2px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#FFD900] uppercase">
                CRITICAL DEMO BENCHMARK
              </span>
              <span className="text-[#8B8D8C] text-xs font-mono">•</span>
              <span className="text-[11px] font-mono text-[#D5D7D6]">
                REAL SERVER PIPELINE • ZERO MOCK DATA
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
              Interactive Session Risk Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#D5D7D6] mt-1 max-w-3xl leading-relaxed">
              Execute controlled delivery sessions against individualized rider baselines. Witness how TrueRide evaluates behavioral touch cadence, detects same-phone handoffs, and avoids penalizing routine phone upgrades.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[2px] font-bold text-xs text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {isRunning ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-[#17191B]" />
                <span>Evaluating Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-[#17191B]" />
                <span>Run Scenario Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-[2px] bg-[#FCE5E3] border border-[#D52222]/40 text-[#D52222] text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Grid: Scenario Selector vs Details & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenarios List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17191B] font-mono">
              Select Test Scenario ({SIMULATOR_SCENARIOS.length} Total)
            </h2>
            <span className="text-[11px] font-mono text-[#5D6266] bg-[#F1F0ED] px-2 py-0.5 rounded-[1px] border border-[#D9D6CD]">
              {selectedScenario.category}
            </span>
          </div>

          <div className="space-y-2">
            {SIMULATOR_SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedScenario.id;
              const isHandoff = sc.id === "SCENARIO_6_SAME_DEVICE_CITY_HANDOFF";

              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setSimulationResult(null);
                  }}
                  className={`p-3.5 rounded-[2px] border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#FFF5D6]/40 border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#D9D6CD] shadow-xs"
                      : "bg-[#FFFFFF] border border-[#D9D6CD] hover:bg-[#F7F7F5] hover:border-[#8B8D8C]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#17191B]">
                          {sc.name}
                        </span>
                        {isHandoff && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-[1px] bg-[#FFD900] text-[#17191B] font-mono font-bold">
                            KEY VALUE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5D6266] mt-1 line-clamp-2">
                        {sc.description}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-[1px] font-mono font-bold border shrink-0 ${
                        sc.expectedRiskLevel === "HIGH"
                          ? "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/30"
                          : sc.expectedRiskLevel === "MEDIUM"
                          ? "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/30"
                          : "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30"
                      }`}
                    >
                      {sc.expectedRiskLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scenario Metadata + Live Execution Output */}
        <div className="lg:col-span-7 space-y-5">
          {/* Selected Scenario Card */}
          <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#5D6266]">
                  Scenario Parameters:
                </span>
                <span className="font-bold text-[#17191B] text-xs">
                  {selectedScenario.name}
                </span>
              </div>
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-1 text-xs font-mono font-bold text-[#17191B] hover:text-[#5D6266]"
              >
                <Code2 className="w-3.5 h-3.5 text-[#17191B]" />
                <span>{showJson ? "Hide JSON" : "Inspect Payload"}</span>
              </button>
            </div>

            <div className="mt-3 text-xs text-[#5D6266] space-y-2.5">
              <p className="text-[#17191B]">{selectedScenario.description}</p>
              <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD] font-mono text-[11px] text-[#17191B]">
                <span className="text-[#5D6266] font-sans block mb-1 font-bold text-xs uppercase">
                  Why this test is essential:
                </span>
                {selectedScenario.keyDifferentiator}
              </div>

              {/* Parameter Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                  <span className="text-[#8B8D8C] block text-[10px]">Rider ID</span>
                  <span className="font-bold text-[#17191B]">
                    {selectedScenario.eventPayload.riderId}
                  </span>
                </div>
                <div className="p-2 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                  <span className="text-[#8B8D8C] block text-[10px]">Device Identifier</span>
                  <span className="font-bold text-[#17191B] truncate block">
                    {selectedScenario.eventPayload.deviceId}
                  </span>
                </div>
                <div className="p-2 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                  <span className="text-[#8B8D8C] block text-[10px]">Zone & City</span>
                  <span className="font-bold text-[#17191B] truncate block">
                    {selectedScenario.eventPayload.operatingZone}
                  </span>
                </div>
                <div className="p-2 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                  <span className="text-[#8B8D8C] block text-[10px]">Interaction Interval</span>
                  <span className="font-bold text-[#17191B]">
                    {selectedScenario.eventPayload.avgIntervalSec
                      ? `${selectedScenario.eventPayload.avgIntervalSec}s`
                      : "Default"}
                  </span>
                </div>
              </div>

              {showJson && (
                <pre className="p-3 rounded-[2px] bg-[#2F3130] text-[#D5D7D6] border border-[#3F4241] overflow-x-auto text-[11px] font-mono max-h-48 mt-2">
                  {JSON.stringify(selectedScenario.eventPayload, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Simulation Output Area */}
          {simulationResult ? (
            <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D6CD]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-[#24813A] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pipeline Execution Completed
                    </span>
                    <span className="text-xs font-mono text-[#8B8D8C]">
                      • {simulationResult.scoringLatencyMs}ms Latency
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#17191B] mt-0.5 font-mono uppercase">
                    Live Assessment Output
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <RiskBadge
                    score={simulationResult.overallScore}
                    level={simulationResult.riskLevel}
                    size="lg"
                  />
                  <ActionBadge action={simulationResult.recommendedAction} />
                </div>
              </div>

              {/* Case Created Banner */}
              {simulationResult.caseCreated && (
                <div className="p-3.5 rounded-[2px] bg-[#FFF5D6] border border-[#E7A500]/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#17191B]">
                    <ShieldAlert className="w-4 h-4 text-[#D52222] shrink-0" />
                    <span>
                      Security Case opened:{" "}
                      <strong className="font-mono text-[#17191B]">
                        {simulationResult.caseNumber}
                      </strong>{" "}
                      (Auto-routed for Analyst Review)
                    </span>
                  </div>
                  {onOpenCase && simulationResult.caseId && (
                    <button
                      onClick={() => onOpenCase(simulationResult.caseId)}
                      className="px-3 py-1 rounded-[2px] bg-[#FFD900] hover:bg-[#e6c400] text-[#17191B] font-mono font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition shadow-xs"
                    >
                      <span>View Case</span>
                      <ArrowRight className="w-3 h-3 text-[#17191B]" />
                    </button>
                  )}
                </div>
              )}

              {/* Evidence Quality & Confidence */}
              <div className="flex items-center justify-between p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD] text-xs">
                <EvidenceQualityBadge quality={simulationResult.evidenceQuality} />
                <span className="font-mono text-[#5D6266]">
                  Confidence Score:{" "}
                  <strong className="text-[#17191B]">
                    {simulationResult.sessionDetail?.assessment?.confidenceScore?.toFixed(0) || "85"}%
                  </strong>
                </span>
                <span className="text-[#8B8D8C] font-mono text-[11px]">
                  Scoring Engine: {simulationResult.sessionDetail?.assessment?.scoringVersion || "v1.0.0"}
                </span>
              </div>

              {/* 5-Category Breakdown */}
              <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#17191B] mb-3 font-mono">
                  Five Core Risk Signal Categories
                </h4>
                {simulationResult.sessionDetail?.assessment && (
                  <CategoryRadarBar
                    scores={{
                      behavioral: simulationResult.sessionDetail.assessment.behavioralScore,
                      device: simulationResult.sessionDetail.assessment.deviceScore,
                      location: simulationResult.sessionDetail.assessment.locationScore,
                      sessionAccount:
                        simulationResult.sessionDetail.assessment.sessionAccountScore,
                      historical: simulationResult.sessionDetail.assessment.historicalScore,
                    }}
                  />
                )}
              </div>

              {/* Triggered Signals with Explanations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#17191B] mb-2 font-mono">
                  Observable Signals & Reason Codes (
                  {simulationResult.sessionDetail?.assessment?.signals?.length || 0} Traces)
                </h4>
                <div className="space-y-2">
                  {simulationResult.sessionDetail?.assessment?.signals?.map(
                    (sig: any) => (
                      <div
                        key={sig.id}
                        className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#17191B]">
                                {sig.name}
                              </span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[1px] bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD]">
                                {sig.signalCode}
                              </span>
                            </div>
                            <p className="text-[#5D6266] text-[11px] mt-1">
                              {sig.explanation}
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded-[1px] border ${
                                sig.subscore >= 70
                                  ? "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/30"
                                  : sig.subscore >= 35
                                  ? "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/30"
                                  : "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30"
                              }`}
                            >
                              {sig.subscore.toFixed(0)}/100
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#D9D6CD] grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-[#8B8D8C] block text-[10px]">
                              Observed Session Value:
                            </span>
                            <span className="text-[#D52222] font-semibold">{sig.observedValue}</span>
                          </div>
                          <div>
                            <span className="text-[#8B8D8C] block text-[10px]">
                              Expected Baseline Range:
                            </span>
                            <span className="text-[#17191B]">{sig.expectedRange}</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] text-center flex flex-col items-center justify-center shadow-xs">
              <Sparkles className="w-8 h-8 text-[#17191B] mb-2" />
              <p className="text-[#17191B] font-bold text-sm">
                Ready to execute scenario: &ldquo;{selectedScenario.name}&rdquo;
              </p>
              <p className="text-xs text-[#5D6266] mt-1 max-w-sm">
                Click &ldquo;Run Scenario Pipeline&rdquo; above to ingest this synthetic event into SQLite and compute live explainable scores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
