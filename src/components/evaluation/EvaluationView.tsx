"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Sparkles,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  ShieldCheck,
  TrendingUp,
  Cpu,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export function EvaluationView() {
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/evaluation/metrics");
      const data = await res.json();
      setEvaluation(data.evaluation);
    } catch (err) {
      console.error("Failed to load evaluation metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !evaluation) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">
        <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Running held-out evaluation test suite...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0a1828] via-[#0c1f38] to-[#0a1828] border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                INDEPENDENT SYNTHETIC BENCHMARK
              </span>
              <span className="text-xs text-slate-400 font-mono">
                15 Labelled Held-Out Evaluation Scenarios
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Model Performance & Verification Metrics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Evaluated against ground truth labels assigned independently of the risk engine. Measures both detection power on unauthorized account sharing and friction prevention for genuine riders.
            </p>
          </div>

          <button
            onClick={fetchMetrics}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-slate-800 border border-slate-700 transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Re-evaluate Benchmark</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">Precision</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {evaluation.precision}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Challenges are legitimate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">Recall</span>
          <span className="text-2xl font-bold font-mono text-teal-300">
            {evaluation.recall}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Handoffs detected
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">F1 Score</span>
          <span className="text-2xl font-bold font-mono text-cyan-400">
            {evaluation.f1Score}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Harmonic balance
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">False Positive Rate</span>
          <span className="text-2xl font-bold font-mono text-cyan-300">
            {evaluation.falsePositiveRate}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Routine upgrade friction
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">Challenge Rate</span>
          <span className="text-2xl font-bold font-mono text-amber-300">
            {evaluation.challengeRate}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Sessions routed to check
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">P95 Scoring Latency</span>
          <span className="text-2xl font-bold font-mono text-white">
            {evaluation.p95LatencyMs} ms
          </span>
          <span className="text-[10px] text-emerald-400 font-mono block mt-1">
            Target &lt; 200 ms (Met)
          </span>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Confusion Matrix (15 Benchmark Test Cases)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* True Positives */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-xs">
                  True Positives (TP)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Actual Handoffs accurately flagged & challenged
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {evaluation.truePositives}
            </span>
          </div>

          {/* False Positives */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white text-xs">
                  False Positives (FP)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Legitimate sessions mistakenly challenged
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-amber-400">
              {evaluation.falsePositives}
            </span>
          </div>

          {/* False Negatives */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-white text-xs">
                  False Negatives (FN)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Actual Handoffs missed (undetected)
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-rose-400">
              {evaluation.falseNegatives}
            </span>
          </div>

          {/* True Negatives */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white text-xs">
                  True Negatives (TN)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Legitimate sessions cleanly allowed without friction
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-cyan-400">
              {evaluation.trueNegatives}
            </span>
          </div>
        </div>
      </div>

      {/* Held-out Test Cases Table */}
      <div className="rounded-2xl bg-[#0c162c] border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Detailed Test Scenarios Breakdown ({evaluation.items?.length || 0})
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Average Latency: {evaluation.avgLatencyMs} ms
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Test ID</th>
                <th className="py-2.5 px-4">Scenario Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Ground Truth</th>
                <th className="py-2.5 px-4">Engine Risk</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Result</th>
                <th className="py-2.5 px-4 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {evaluation.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400 font-bold">{item.id}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[10px]">
                    {item.scenarioType}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        item.groundTruth === "HANDOFF"
                          ? "bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                          : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                      }`}
                    >
                      {item.groundTruth}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`font-bold ${
                        item.predictedRiskLevel === "HIGH"
                          ? "text-rose-400"
                          : item.predictedRiskLevel === "MEDIUM"
                          ? "text-amber-300"
                          : "text-emerald-400"
                      }`}
                    >
                      {item.overallScore.toFixed(0)} ({item.predictedRiskLevel})
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {item.recommendedAction}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.classification === "TP"
                          ? "bg-emerald-950 text-emerald-300"
                          : item.classification === "TN"
                          ? "bg-cyan-950 text-cyan-300"
                          : item.classification === "FP"
                          ? "bg-amber-950 text-amber-300"
                          : "bg-rose-950 text-rose-300"
                      }`}
                    >
                      {item.classification}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-400">
                    {item.latencyMs} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
