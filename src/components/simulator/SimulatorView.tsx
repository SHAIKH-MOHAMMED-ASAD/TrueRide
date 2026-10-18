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
  Download,
  Database,
  Sliders,
  Activity,
  Zap,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  FileJson,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Flame,
} from "lucide-react";
import { SIMULATOR_SCENARIOS, SimulatorScenario } from "@/lib/services/simulator";
import { SyntheticBenchmarkSummary, SyntheticSessionRecord } from "@/lib/services/syntheticDatasetGenerator";
import { RiskBadge, ActionBadge, EvidenceQualityBadge } from "../common/RiskBadge";
import { CategoryRadarBar } from "../common/CategoryRadarBar";

interface SimulatorViewProps {
  onOpenCase?: (caseId: string) => void;
  onRefreshMetrics?: () => void;
}

export function SimulatorView({ onOpenCase, onRefreshMetrics }: SimulatorViewProps) {
  // Main simulator tab: 'scenarios' (deterministic 9) vs 'scale' (up to 100,000 synthetic dataset)
  const [simulatorMode, setSimulatorMode] = useState<"scenarios" | "scale">("scenarios");

  // ==========================================
  // SINGLE SCENARIO SIMULATOR STATE
  // ==========================================
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

  // ==========================================
  // MASSIVE SYNTHETIC DATASET SIMULATOR STATE
  // ==========================================
  const [scaleCount, setScaleCount] = useState<number>(10000);
  const [fraudRatePercent, setFraudRatePercent] = useState<number>(7);
  const [newDevicePercent, setNewDevicePercent] = useState<number>(4);
  const [zoneShiftPercent, setZoneShiftPercent] = useState<number>(3);
  const [isGeneratingScale, setIsGeneratingScale] = useState(false);
  const [scaleBenchmark, setScaleBenchmark] = useState<SyntheticBenchmarkSummary | null>(null);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const [scaleSearch, setScaleSearch] = useState<string>("");
  const [scaleFilter, setScaleFilter] = useState<string>("ALL");
  const [scalePage, setScalePage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<"json" | "csv" | null>(null);
  const [scalePersistSuccess, setScalePersistSuccess] = useState<{
    casesCreated: number;
    recordsPersisted: number;
    cumulativeCount: number;
  } | null>(null);

  const handleRunScaleSimulation = async (countToRun?: number) => {
    const count = countToRun !== undefined ? countToRun : scaleCount;
    try {
      setIsGeneratingScale(true);
      setScaleError(null);
      setScalePersistSuccess(null);

      const res = await fetch("/api/simulator/synthetic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          fraudRatePercent,
          newDevicePercent,
          zoneShiftPercent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to run scale simulation");
      }

      setScaleBenchmark(data.benchmark);
      setScalePage(1);
      setScalePersistSuccess({
        casesCreated: data.casesCreated || 0,
        recordsPersisted: data.recordsPersisted || 0,
        cumulativeCount: data.cumulativeCount || count,
      });

      if (onRefreshMetrics) {
        onRefreshMetrics();
      }
    } catch (err: any) {
      console.error("Scale simulation error:", err);
      setScaleError(err.message || "Failed to execute massive scale simulation");
    } finally {
      setIsGeneratingScale(false);
    }
  };

  const handleExportDataset = async (format: "json" | "csv") => {
    try {
      setIsExporting(format);

      // Fast-path: for 100,000 CSV, trigger instantaneous smooth download from pre-generated file
      if (format === "csv" && scaleCount === 100000) {
        const a = document.createElement("a");
        a.href = "/data/trueride_synthetic_100k.csv";
        a.download = "trueride_synthetic_100k.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const res = await fetch("/api/simulator/synthetic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: scaleCount,
          fraudRatePercent,
          newDevicePercent,
          zoneShiftPercent,
          exportFormat: format,
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trueride_synthetic_${scaleCount}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Dataset export error:", err);
      alert("Failed to export dataset: " + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  // Filtered samples for data inspector table
  const filteredSamples = (scaleBenchmark?.sampleRecords || []).filter((r) => {
    if (scaleFilter !== "ALL" && r.classification !== scaleFilter) return false;
    if (!scaleSearch) return true;
    const q = scaleSearch.toLowerCase();
    return (
      r.eventId.toLowerCase().includes(q) ||
      r.riderId.toLowerCase().includes(q) ||
      r.operatingZone.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.deviceModel.toLowerCase().includes(q) ||
      r.groundTruthLabel.toLowerCase().includes(q)
    );
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredSamples.length / PAGE_SIZE));
  const paginatedSamples = filteredSamples.slice((scalePage - 1) * PAGE_SIZE, scalePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header Banner: TrueRide Industrial Charcoal with Yellow Accent */}
      <div className="p-6 bg-[#2F3130] text-white border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#3F4241] rounded-[2px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#FFD900] uppercase">
                IDENTITY RISK SIMULATOR & BENCHMARK
              </span>
              <span className="text-[#8B8D8C] text-xs font-mono">•</span>
              <span className="text-[11px] font-mono text-[#D5D7D6]">
                UP TO 100,000 SESSIONS • REAL STANDALONE ENGINE
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
              Rider Session Risk Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#D5D7D6] mt-1 max-w-3xl leading-relaxed">
              Test individualized behavioral baselines on single scenarios or stress-test throughput with massive synthetic datasets up to 100,000 sessions with sub-millisecond risk scoring.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-[#1B1D1C] p-1 border border-[#3F4241] rounded-[2px] self-start md:self-auto shrink-0 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSimulatorMode("scenarios")}
              className={`px-3 py-1.5 rounded-[2px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                simulatorMode === "scenarios"
                  ? "bg-[#FFD900] text-[#17191B] shadow-xs"
                  : "text-[#D5D7D6] hover:text-white hover:bg-[#2C2E2D]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>9 Mission Scenarios</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatorMode("scale");
                if (!scaleBenchmark && !isGeneratingScale) {
                  handleRunScaleSimulation(10000);
                }
              }}
              className={`px-3 py-1.5 rounded-[2px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                simulatorMode === "scale"
                  ? "bg-[#FFD900] text-[#17191B] shadow-xs"
                  : "text-[#D5D7D6] hover:text-white hover:bg-[#2C2E2D]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Scale Dataset (100k)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SINGLE SCENARIO SIMULATOR (9 MISSION SCENARIOS)                   */}
      {/* ========================================================================= */}
      {simulatorMode === "scenarios" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-[#5D6266]">
              Deterministic sessions ingested through the live SQLite database pipeline.
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-[2px] font-bold text-xs text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-sm"
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
                    <div className="p-2 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                      <span className="text-[#8B8D8C] block text-[9px] uppercase">Rider</span>
                      <span className="font-bold text-[#17191B]">
                        {selectedScenario.eventPayload.riderId}
                      </span>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                      <span className="text-[#8B8D8C] block text-[9px] uppercase">Device</span>
                      <span className="font-bold text-[#17191B] truncate block">
                        {selectedScenario.eventPayload.deviceModel || selectedScenario.eventPayload.deviceId}
                      </span>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                      <span className="text-[#8B8D8C] block text-[9px] uppercase">Touch Cadence</span>
                      <span className="font-bold text-[#17191B]">
                        {selectedScenario.eventPayload.avgIntervalSec}s avg
                      </span>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                      <span className="text-[#8B8D8C] block text-[9px] uppercase">Zone</span>
                      <span className="font-bold text-[#17191B]">
                        {selectedScenario.eventPayload.operatingZone}
                      </span>
                    </div>
                  </div>

                  {showJson && (
                    <div className="mt-3 p-3 rounded-[2px] bg-[#17191B] text-[#FFD900] font-mono text-[11px] overflow-x-auto max-h-60 border border-[#2D302F]">
                      <pre>{JSON.stringify(selectedScenario.eventPayload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Results View */}
              {simulationResult ? (
                <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="w-2.5 h-2.5 rounded-[1px] bg-[#24813A]" />
                      <span className="font-bold text-[#17191B] text-xs">
                        Assessment Completed: {simulationResult.sessionId}
                      </span>
                    </div>
                    {simulationResult.securityCaseId && onOpenCase && (
                      <button
                        onClick={() => onOpenCase(simulationResult.securityCaseId)}
                        className="text-xs font-mono font-bold text-[#17191B] hover:text-[#5D6266] flex items-center gap-1 bg-[#FFD900] px-2.5 py-1 rounded-[1px]"
                      >
                        <span>Open Case {simulationResult.securityCaseId}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                        Risk Score
                      </span>
                      <span className="text-2xl font-mono font-bold text-[#17191B]">
                        {simulationResult.riskScore}
                        <span className="text-xs text-[#8B8D8C]">/100</span>
                      </span>
                    </div>
                    <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                        Risk Band
                      </span>
                      <div className="mt-1">
                        <RiskBadge level={simulationResult.riskLevel} />
                      </div>
                    </div>
                    <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                        Recommended Action
                      </span>
                      <div className="mt-1">
                        <ActionBadge action={simulationResult.recommendedAction} />
                      </div>
                    </div>
                    <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                        Evidence Quality
                      </span>
                      <div className="mt-1">
                        <EvidenceQualityBadge quality={simulationResult.evidenceQuality} />
                      </div>
                    </div>
                  </div>

                  {/* Radar Bar Component for Category Breakdown */}
                  {simulationResult.sessionDetail?.assessment && (
                    <div className="pt-2">
                      <CategoryRadarBar
                        scores={{
                          behavioral: simulationResult.sessionDetail.assessment.behavioralScore,
                          device: simulationResult.sessionDetail.assessment.deviceScore,
                          location: simulationResult.sessionDetail.assessment.locationScore,
                          sessionAccount: simulationResult.sessionDetail.assessment.sessionAccountScore,
                          historical: simulationResult.sessionDetail.assessment.historicalScore,
                        }}
                      />
                    </div>
                  )}

                  {/* Triggered Signals Breakdown */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-[#17191B] mb-2 tracking-wider">
                      Triggered Threat Signals (
                      {simulationResult.sessionDetail?.assessment?.signals?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {simulationResult.sessionDetail?.assessment?.signals?.map(
                        (sig: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] text-xs font-mono"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#17191B]">{sig.signalName}</span>
                              <span className="font-bold text-[#D52222]">
                                Subscore: {sig.subscore}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5D6266] font-sans mt-1">
                              {sig.explanation}
                            </p>
                            <div className="mt-2 pt-2 border-t border-[#D9D6CD] grid grid-cols-2 text-[11px]">
                              <div>
                                <span className="text-[#8B8D8C] block text-[10px]">
                                  Observed Value:
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
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MASSIVE SYNTHETIC SCALE BENCHMARK (UP TO 100,000 RECORDS)         */}
      {/* ========================================================================= */}
      {simulatorMode === "scale" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D6CD]">
              <div>
                <h2 className="text-sm font-extrabold font-mono uppercase text-[#17191B] tracking-wide flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#FFD900]" />
                  <span>Synthetic Dataset & Scale Benchmarking Engine</span>
                </h2>
                <p className="text-xs text-[#5D6266] mt-0.5">
                  Generate up to 100,000 randomized sessions and score them in-memory to benchmark model throughput, latency, and accuracy.
                </p>
              </div>

              {/* Dataset Size Presets */}
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
                {[100, 1000, 10000, 50000, 100000].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setScaleCount(size);
                      handleRunScaleSimulation(size);
                    }}
                    className={`px-2.5 py-1 rounded-[2px] font-bold border transition cursor-pointer ${
                      scaleCount === size
                        ? "bg-[#17191B] text-[#FFD900] border-[#17191B] shadow-xs"
                        : "bg-[#F1F0ED] text-[#5D6266] border-[#D9D6CD] hover:border-[#17191B]"
                    }`}
                  >
                    {size >= 1000 ? `${size / 1000}k` : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Distribution Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#5D6266] font-bold">Fraud / Handoff Ratio</span>
                  <span className="text-[#D52222] font-bold">{fraudRatePercent}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={fraudRatePercent}
                  onChange={(e) => setFraudRatePercent(Number(e.target.value))}
                  className="w-full accent-[#D52222] cursor-pointer"
                />
                <span className="text-[10px] text-[#8B8D8C] block mt-1">
                  Rented accounts & rapid payout changes
                </span>
              </div>

              <div className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#5D6266] font-bold">New Hardware Upgrades</span>
                  <span className="text-[#24813A] font-bold">{newDevicePercent}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={newDevicePercent}
                  onChange={(e) => setNewDevicePercent(Number(e.target.value))}
                  className="w-full accent-[#24813A] cursor-pointer"
                />
                <span className="text-[10px] text-[#8B8D8C] block mt-1">
                  Legitimate phone changes (must remain safe)
                </span>
              </div>

              <div className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#5D6266] font-bold">Zone Drift Transitions</span>
                  <span className="text-[#E7A500] font-bold">{zoneShiftPercent}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={zoneShiftPercent}
                  onChange={(e) => setZoneShiftPercent(Number(e.target.value))}
                  className="w-full accent-[#E7A500] cursor-pointer"
                />
                <span className="text-[10px] text-[#8B8D8C] block mt-1">
                  Adjacent cluster surge demand re-allocations
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunScaleSimulation()}
                  disabled={isGeneratingScale}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[2px] font-mono font-bold text-xs text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isGeneratingScale ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin text-[#17191B]" />
                      <span>Simulating {scaleCount.toLocaleString()} Sessions...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-[#17191B]" />
                      <span>Run {scaleCount.toLocaleString()} Scale Simulation</span>
                    </>
                  )}
                </button>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#8B8D8C] text-[11px] hidden sm:inline">Export Dataset:</span>
                <button
                  type="button"
                  onClick={() => handleExportDataset("csv")}
                  disabled={isExporting !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-[#D9D6CD] bg-[#FFFFFF] hover:bg-[#F1F0ED] text-[#17191B] font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#24813A]" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportDataset("json")}
                  disabled={isExporting !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-[#D9D6CD] bg-[#FFFFFF] hover:bg-[#F1F0ED] text-[#17191B] font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#E06D14]" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Physical CSV Datasets on Disk */}
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[#1E293B] font-bold">Physical CSV Dataset on Disk:</span>
                <code className="px-1.5 py-0.5 rounded-[1px] bg-[#0F172A] text-[#FFD900] text-[11px] font-bold">
                  data/trueride_synthetic_100k.csv (18.5 MB)
                </code>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/data/trueride_synthetic_100k.csv"
                  download="trueride_synthetic_100k.csv"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[1px] bg-[#24813A] hover:bg-[#1E6B30] text-white font-bold transition shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 100K CSV</span>
                </a>
                <a
                  href="/api/evaluation/metrics?format=csv"
                  download="trueride_system_evaluation.csv"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[1px] bg-[#1E293B] hover:bg-[#334155] text-slate-200 font-bold transition shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Evaluation CSV</span>
                </a>
              </div>
            </div>
          </div>

          {scaleError && (
            <div className="p-3.5 rounded-[2px] bg-[#FCE5E3] border border-[#D52222]/40 text-[#D52222] text-xs font-mono">
              {scaleError}
            </div>
          )}

          {/* Scale Results KPI Board */}
          {scaleBenchmark && (
            <div className="space-y-6">
              {/* Records Updated Success Banner */}
              {scalePersistSuccess && (
                <div className="p-4 rounded-[2px] bg-[#E8F4E8] border border-[#24813A]/40 text-[#24813A] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-[#24813A] shrink-0" />
                    <div>
                      <span className="font-extrabold uppercase tracking-wide text-xs text-[#17191B]">
                        DATABASE RECORDS UPDATED ({scaleBenchmark.totalRecords.toLocaleString()} SESSIONS EVALUATED)
                      </span>
                      <div className="text-[11px] text-[#5D6266] font-sans mt-0.5">
                        Recorded <strong className="font-mono font-bold text-[#D52222]">{scalePersistSuccess.casesCreated} high-priority anomaly cases</strong> to the SQLite Review Queue, persisted Session Events, logged a System Audit Benchmark Event, and synchronized dashboard live metrics.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenCase?.("CASE-SCALE")}
                    className="px-3 py-1.5 bg-[#17191B] hover:bg-[#2F3130] text-[#FFD900] rounded-[2px] font-bold text-xs transition cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    View Review Queue →
                  </button>
                </div>
              )}

              {/* 6 Metric KPI Boxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                    Total Evaluated
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#17191B]">
                    {scaleBenchmark.totalRecords.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
                    in {scaleBenchmark.durationMs}ms
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                    Throughput
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#24813A]">
                    {scaleBenchmark.throughputPerSec.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
                    sessions / sec
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                    P95 Latency
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#17191B]">
                    {scaleBenchmark.p95LatencyMs.toFixed(3)}ms
                  </span>
                  <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
                    avg: {scaleBenchmark.avgLatencyMs.toFixed(3)}ms
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                    Precision
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#24813A]">
                    {scaleBenchmark.metrics.precision}%
                  </span>
                  <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
                    True positives / challenges
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                    Recall
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#24813A]">
                    {scaleBenchmark.metrics.recall}%
                  </span>
                  <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
                    Fraud cases caught
                  </span>
                </div>

                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">
                    False Positive Rate
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#24813A]">
                    {scaleBenchmark.metrics.falsePositiveRate}%
                  </span>
                  <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
                    Worker friction rate
                  </span>
                </div>
              </div>

              {/* Confusion Matrix & Risk Distribution Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: 2x2 Confusion Matrix */}
                <div className="lg:col-span-5 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CD]">
                    <span className="text-xs font-mono font-bold uppercase text-[#17191B] tracking-wider">
                      Ground Truth Confusion Matrix
                    </span>
                    <span className="text-[11px] font-mono text-[#24813A] font-bold">
                      F1: {scaleBenchmark.metrics.f1Score}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-3 rounded-[2px] bg-[#E8F4E8] border border-[#24813A]/30">
                      <span className="text-[10px] text-[#24813A] uppercase font-bold block">
                        True Positive (TP)
                      </span>
                      <span className="text-xl font-extrabold text-[#24813A]">
                        {scaleBenchmark.confusionMatrix.truePositives.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#5D6266] block mt-0.5">
                        Handoff correctly caught
                      </span>
                    </div>

                    <div className="p-3 rounded-[2px] bg-[#FFF5D6] border border-[#E7A500]/40">
                      <span className="text-[10px] text-[#E7A500] uppercase font-bold block">
                        False Positive (FP)
                      </span>
                      <span className="text-xl font-extrabold text-[#E7A500]">
                        {scaleBenchmark.confusionMatrix.falsePositives.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#5D6266] block mt-0.5">
                        Legitimate challenged
                      </span>
                    </div>

                    <div className="p-3 rounded-[2px] bg-[#FCE5E3] border border-[#D52222]/30">
                      <span className="text-[10px] text-[#D52222] uppercase font-bold block">
                        False Negative (FN)
                      </span>
                      <span className="text-xl font-extrabold text-[#D52222]">
                        {scaleBenchmark.confusionMatrix.falseNegatives.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#5D6266] block mt-0.5">
                        Missed handoff
                      </span>
                    </div>

                    <div className="p-3 rounded-[2px] bg-[#E8F4E8] border border-[#24813A]/30">
                      <span className="text-[10px] text-[#24813A] uppercase font-bold block">
                        True Negative (TN)
                      </span>
                      <span className="text-xl font-extrabold text-[#24813A]">
                        {scaleBenchmark.confusionMatrix.trueNegatives.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#5D6266] block mt-0.5">
                        Routine session allowed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Risk Bands & Threat Signals Leaderboard */}
                <div className="lg:col-span-7 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CD]">
                    <span className="text-xs font-mono font-bold uppercase text-[#17191B] tracking-wider">
                      Fleet Risk Band Distribution
                    </span>
                    <span className="text-[11px] font-mono text-[#5D6266]">
                      {scaleBenchmark.totalRecords.toLocaleString()} Ingestions
                    </span>
                  </div>

                  {/* Distribution Bar */}
                  <div className="space-y-2">
                    <div className="h-5 rounded-[2px] overflow-hidden flex font-mono text-[10px] font-bold text-white shadow-2xs">
                      <div
                        style={{ width: `${(scaleBenchmark.riskBandDistribution.L0_Silent / scaleBenchmark.totalRecords) * 100}%` }}
                        className="bg-[#24813A] flex items-center justify-center truncate px-1"
                        title={`L0 Silent: ${scaleBenchmark.riskBandDistribution.L0_Silent}`}
                      >
                        L0
                      </div>
                      <div
                        style={{ width: `${(scaleBenchmark.riskBandDistribution.L1_Ambient / scaleBenchmark.totalRecords) * 100}%` }}
                        className="bg-[#E7A500] flex items-center justify-center truncate px-1"
                        title={`L1 Ambient: ${scaleBenchmark.riskBandDistribution.L1_Ambient}`}
                      >
                        L1
                      </div>
                      <div
                        style={{ width: `${(scaleBenchmark.riskBandDistribution.L2_Challenge / scaleBenchmark.totalRecords) * 100}%` }}
                        className="bg-[#E06D14] flex items-center justify-center truncate px-1"
                        title={`L2 Challenge: ${scaleBenchmark.riskBandDistribution.L2_Challenge}`}
                      >
                        L2
                      </div>
                      <div
                        style={{ width: `${(scaleBenchmark.riskBandDistribution.L3_Hold / scaleBenchmark.totalRecords) * 100}%` }}
                        className="bg-[#D52222] flex items-center justify-center truncate px-1"
                        title={`L3 Hold: ${scaleBenchmark.riskBandDistribution.L3_Hold}`}
                      >
                        L3
                      </div>
                    </div>

                    <div className="grid grid-cols-4 text-[11px] font-mono text-center">
                      <span className="text-[#24813A] font-bold">
                        L0: {scaleBenchmark.riskBandDistribution.L0_Silent.toLocaleString()}
                      </span>
                      <span className="text-[#E7A500] font-bold">
                        L1: {scaleBenchmark.riskBandDistribution.L1_Ambient.toLocaleString()}
                      </span>
                      <span className="text-[#E06D14] font-bold">
                        L2: {scaleBenchmark.riskBandDistribution.L2_Challenge.toLocaleString()}
                      </span>
                      <span className="text-[#D52222] font-bold">
                        L3: {scaleBenchmark.riskBandDistribution.L3_Hold.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Top Signals */}
                  <div className="pt-2 border-t border-[#D9D6CD]">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#5D6266] block mb-2">
                      Top Triggered Threat Signals at Scale
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {scaleBenchmark.topSignals.slice(0, 4).map((sig) => (
                        <div
                          key={sig.code}
                          className="p-2 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] flex items-center justify-between"
                        >
                          <span className="text-[#17191B] font-bold truncate pr-1">{sig.name}</span>
                          <span className="text-[#D52222] font-extrabold shrink-0">
                            {sig.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Paginated Data Inspector Table */}
              <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D6CD]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase text-[#17191B] tracking-wider">
                      Synthetic Record Inspector (Sample Preview)
                    </span>
                    <span className="text-[11px] font-mono text-[#8B8D8C]">
                      Showing {filteredSamples.length} records
                    </span>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-[#8B8D8C]" />
                      <input
                        type="text"
                        placeholder="Filter event, rider, zone..."
                        value={scaleSearch}
                        onChange={(e) => {
                          setScaleSearch(e.target.value);
                          setScalePage(1);
                        }}
                        className="pl-7 pr-3 py-1 bg-[#F7F7F5] border border-[#D9D6CD] rounded-[2px] text-xs focus:outline-none focus:border-[#17191B]"
                      />
                    </div>

                    <select
                      value={scaleFilter}
                      onChange={(e) => {
                        setScaleFilter(e.target.value);
                        setScalePage(1);
                      }}
                      className="px-2 py-1 bg-[#F7F7F5] border border-[#D9D6CD] rounded-[2px] text-xs font-bold"
                    >
                      <option value="ALL">All Outcomes</option>
                      <option value="TP">True Positives (TP)</option>
                      <option value="FP">False Positives (FP)</option>
                      <option value="TN">True Negatives (TN)</option>
                      <option value="FN">False Negatives (FN)</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#D9D6CD] text-[10px] text-[#8B8D8C] uppercase">
                        <th className="py-2 px-2">Event ID</th>
                        <th className="py-2 px-2">Rider</th>
                        <th className="py-2 px-2">City / Zone</th>
                        <th className="py-2 px-2">Hardware Model</th>
                        <th className="py-2 px-2">Touch Rhythm</th>
                        <th className="py-2 px-2">Ground Truth</th>
                        <th className="py-2 px-2">Score</th>
                        <th className="py-2 px-2">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F0ED]">
                      {paginatedSamples.map((r) => (
                        <tr key={r.eventId} className="hover:bg-[#F7F7F5]/80">
                          <td className="py-2 px-2 font-bold text-[#17191B]">{r.eventId}</td>
                          <td className="py-2 px-2 text-[#5D6266]">{r.riderId}</td>
                          <td className="py-2 px-2 text-[#17191B] truncate max-w-[140px]">
                            {r.city} • {r.operatingZone}
                          </td>
                          <td className="py-2 px-2 text-[#5D6266] truncate max-w-[130px]">
                            {r.deviceModel}
                          </td>
                          <td className="py-2 px-2 text-[#17191B]">
                            {r.avgIntervalSec}s ({r.interactionPattern})
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-1.5 py-0.5 rounded-[1px] text-[10px] font-bold ${
                                r.groundTruthLabel === "RENTED_ACCOUNT_HANDOFF"
                                  ? "bg-[#FCE5E3] text-[#D52222]"
                                  : r.groundTruthLabel === "ACCOUNT_TAKEOVER_HIJACK"
                                  ? "bg-[#FCE5E3] text-[#D52222]"
                                  : r.groundTruthLabel === "NEW_DEVICE_LEGITIMATE"
                                  ? "bg-[#FFF5D6] text-[#E7A500]"
                                  : "bg-[#E8F4E8] text-[#24813A]"
                              }`}
                            >
                              {r.groundTruthLabel}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-bold text-[#17191B]">
                            {r.riskScore ?? "-"}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-1.5 py-0.5 rounded-[1px] text-[10px] font-bold ${
                                r.classification === "TP"
                                  ? "bg-[#24813A] text-white"
                                  : r.classification === "TN"
                                  ? "bg-[#E8F4E8] text-[#24813A]"
                                  : r.classification === "FP"
                                  ? "bg-[#E7A500] text-white"
                                  : "bg-[#D52222] text-white"
                              }`}
                            >
                              {r.classification}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[#D9D6CD] font-mono text-xs">
                  <span className="text-[#8B8D8C]">
                    Page {scalePage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={scalePage <= 1}
                      onClick={() => setScalePage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-[2px] border border-[#D9D6CD] bg-[#FFFFFF] hover:bg-[#F1F0ED] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#17191B]" />
                    </button>
                    <button
                      type="button"
                      disabled={scalePage >= totalPages}
                      onClick={() => setScalePage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-[2px] border border-[#D9D6CD] bg-[#FFFFFF] hover:bg-[#F1F0ED] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-[#17191B]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
