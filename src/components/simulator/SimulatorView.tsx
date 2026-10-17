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
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c162c] to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                CRITICAL DEMO BENCHMARK
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Real Server Pipeline • Zero Mock Data
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Interactive Session Risk Simulator
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Execute controlled delivery sessions against individualized rider baselines. Witness how TrueRide evaluates behavioral touch cadence, detects same-phone handoffs, and avoids penalizing routine phone upgrades.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
          >
            {isRunning ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                <span>Evaluating Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>Run Scenario Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Grid: Scenario Selector vs Details & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 9 Scenarios List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Select Test Scenario (9 Scenarios)
            </h2>
            <span className="text-xs font-mono text-cyan-400">
              Active: {selectedScenario.category}
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/90 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50"
                      : "bg-[#0c162c]/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">
                          {sc.name}
                        </span>
                        {isHandoff && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono font-bold">
                            KEY VALUE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {sc.description}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        sc.expectedRiskLevel === "HIGH"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : sc.expectedRiskLevel === "MEDIUM"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
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
        <div className="lg:col-span-7 space-y-6">
          {/* Selected Scenario Card */}
          <div className="p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Scenario Parameters:
                </span>
                <span className="font-semibold text-white text-sm">
                  {selectedScenario.name}
                </span>
              </div>
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showJson ? "Hide JSON" : "Inspect Payload"}</span>
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-300 space-y-2">
              <p>{selectedScenario.description}</p>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-[11px] text-cyan-300">
                <span className="text-slate-400 font-sans block mb-1 font-semibold text-xs">
                  Why this test is essential:
                </span>
                {selectedScenario.keyDifferentiator}
              </div>

              {/* Parameter Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="text-slate-500 block">Rider ID</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {selectedScenario.eventPayload.riderId}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="text-slate-500 block">Device Identifier</span>
                  <span className="font-mono font-semibold text-slate-200 truncate block">
                    {selectedScenario.eventPayload.deviceId}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="text-slate-500 block">Zone & City</span>
                  <span className="font-mono font-semibold text-slate-200 truncate block">
                    {selectedScenario.eventPayload.operatingZone}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="text-slate-500 block">Interaction Interval</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {selectedScenario.eventPayload.avgIntervalSec
                      ? `${selectedScenario.eventPayload.avgIntervalSec}s`
                      : "Default"}
                  </span>
                </div>
              </div>

              {showJson && (
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-300 max-h-48 mt-2">
                  {JSON.stringify(selectedScenario.eventPayload, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Simulation Output Area */}
          {simulationResult ? (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0e1a35] to-[#0a1224] border border-cyan-500/40 shadow-2xl space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pipeline Execution Completed
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {simulationResult.scoringLatencyMs}ms Latency
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
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
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Security Case opened:{" "}
                      <strong className="font-mono text-white">
                        {simulationResult.caseNumber}
                      </strong>{" "}
                      (Auto-routed for Analyst Review)
                    </span>
                  </div>
                  {onOpenCase && simulationResult.caseId && (
                    <button
                      onClick={() => onOpenCase(simulationResult.caseId)}
                      className="px-3 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white font-mono font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition"
                    >
                      <span>View Case</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Evidence Quality & Confidence */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <EvidenceQualityBadge quality={simulationResult.evidenceQuality} />
                <span className="font-mono text-slate-400">
                  Confidence Score:{" "}
                  <strong className="text-white">
                    {simulationResult.sessionDetail?.assessment?.confidenceScore?.toFixed(0) || "85"}%
                  </strong>
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Scoring Engine: {simulationResult.sessionDetail?.assessment?.scoringVersion || "v1.0.0"}
                </span>
              </div>

              {/* 5-Category Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Observable Signals & Reason Codes (
                  {simulationResult.sessionDetail?.assessment?.signals?.length || 0} Traces)
                </h4>
                <div className="space-y-2">
                  {simulationResult.sessionDetail?.assessment?.signals?.map(
                    (sig: any) => (
                      <div
                        key={sig.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200">
                                {sig.name}
                              </span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {sig.signalCode}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-1">
                              {sig.explanation}
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span
                              className={`text-xs font-bold ${
                                sig.subscore >= 70
                                  ? "text-rose-400"
                                  : sig.subscore >= 35
                                  ? "text-amber-300"
                                  : "text-cyan-400"
                              }`}
                            >
                              {sig.subscore.toFixed(0)}/100
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">
                              Observed Session Value:
                            </span>
                            <span className="text-amber-200">{sig.observedValue}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">
                              Expected Baseline Range:
                            </span>
                            <span className="text-slate-300">{sig.expectedRange}</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0c162c]/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-cyan-400/50 mb-3" />
              <p className="text-slate-300 font-medium text-sm">
                Ready to execute scenario: &ldquo;{selectedScenario.name}&rdquo;
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Click &ldquo;Run Scenario Pipeline&rdquo; above to ingest this synthetic event into SQLite and compute live explainable scores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
