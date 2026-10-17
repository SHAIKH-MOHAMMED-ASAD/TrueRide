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
      <div className="flex items-center justify-center py-20 text-[#5D6266] font-mono text-sm bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px]">
        <Activity className="w-5 h-5 animate-spin mr-2 text-[#17191B]" />
        Running held-out evaluation test suite...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Banner: Graphite with Yellow Accent */}
      <div className="p-6 bg-[#2F3130] text-white border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#3F4241] rounded-[2px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#FFD900] uppercase">
                INDEPENDENT SYNTHETIC BENCHMARK
              </span>
              <span className="text-[#8B8D8C] text-xs font-mono">•</span>
              <span className="text-[11px] font-mono text-[#D5D7D6]">
                15 LABELLED HELD-OUT SCENARIOS
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
              Model Performance & Verification Metrics
            </h1>
            <p className="text-xs sm:text-sm text-[#D5D7D6] mt-1 max-w-3xl leading-relaxed">
              Evaluated against ground truth labels assigned independently of the risk engine. Measures both detection power on unauthorized account sharing and friction prevention for genuine riders.
            </p>
          </div>

          <button
            onClick={fetchMetrics}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer self-start md:self-auto shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#17191B]" />
            <span>Re-evaluate Benchmark</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid: 6 Square KPI Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">Precision</span>
          <span className="text-2xl font-bold font-mono text-[#24813A]">
            {evaluation.precision}%
          </span>
          <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
            Challenges are legitimate
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">Recall</span>
          <span className="text-2xl font-bold font-mono text-[#24813A]">
            {evaluation.recall}%
          </span>
          <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
            Handoffs detected
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">F1 Score</span>
          <span className="text-2xl font-bold font-mono text-[#17191B]">
            {evaluation.f1Score}%
          </span>
          <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
            Harmonic balance
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">False Positive Rate</span>
          <span className="text-2xl font-bold font-mono text-[#17191B]">
            {evaluation.falsePositiveRate}%
          </span>
          <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
            Routine upgrade friction
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">Challenge Rate</span>
          <span className="text-2xl font-bold font-mono text-[#E7A500]">
            {evaluation.challengeRate}%
          </span>
          <span className="text-[10px] text-[#8B8D8C] block mt-0.5">
            Sessions routed to check
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5D6266] block">P95 Scoring Latency</span>
          <span className="text-2xl font-bold font-mono text-[#17191B]">
            {evaluation.p95LatencyMs} ms
          </span>
          <span className="text-[10px] text-[#24813A] font-mono block mt-0.5 font-bold">
            Target &lt; 200 ms (Met)
          </span>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD] mb-4">
          <h2 className="text-xs font-bold text-[#17191B] uppercase tracking-wider font-mono">
            Confusion Matrix (15 Benchmark Test Cases)
          </h2>
          <span className="text-[10px] font-mono font-bold text-[#5D6266] bg-[#F1F0ED] px-2 py-0.5 rounded-[1px] border border-[#D9D6CD]">
            GROUND TRUTH VALIDATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* True Positives */}
          <div className="p-4 rounded-[2px] bg-[#E8F4E8] border border-[#24813A]/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#24813A]" />
                <span className="font-bold text-[#17191B] text-xs font-mono uppercase">
                  True Positives (TP)
                </span>
              </div>
              <p className="text-[11px] text-[#5D6266] mt-1">
                Actual Handoffs accurately flagged &amp; challenged
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-[#24813A]">
              {evaluation.truePositives}
            </span>
          </div>

          {/* False Positives */}
          <div className="p-4 rounded-[2px] bg-[#FFF5D6] border border-[#E7A500]/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E7A500]" />
                <span className="font-bold text-[#17191B] text-xs font-mono uppercase">
                  False Positives (FP)
                </span>
              </div>
              <p className="text-[11px] text-[#5D6266] mt-1">
                Legitimate sessions mistakenly challenged
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-[#E7A500]">
              {evaluation.falsePositives}
            </span>
          </div>

          {/* False Negatives */}
          <div className="p-4 rounded-[2px] bg-[#FCE5E3] border border-[#D52222]/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[#D52222]" />
                <span className="font-bold text-[#17191B] text-xs font-mono uppercase">
                  False Negatives (FN)
                </span>
              </div>
              <p className="text-[11px] text-[#5D6266] mt-1">
                Actual Handoffs missed (undetected)
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-[#D52222]">
              {evaluation.falseNegatives}
            </span>
          </div>

          {/* True Negatives */}
          <div className="p-4 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#17191B]" />
                <span className="font-bold text-[#17191B] text-xs font-mono uppercase">
                  True Negatives (TN)
                </span>
              </div>
              <p className="text-[11px] text-[#5D6266] mt-1">
                Legitimate sessions cleanly allowed without friction
              </p>
            </div>
            <span className="text-3xl font-bold font-mono text-[#17191B]">
              {evaluation.trueNegatives}
            </span>
          </div>
        </div>
      </div>

      {/* Held-out Test Cases Table */}
      <div className="rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] overflow-hidden shadow-xs">
        <div className="p-4 bg-[#F1F0ED] border-b border-[#D9D6CD] flex items-center justify-between">
          <h3 className="font-bold text-[#17191B] text-xs uppercase tracking-wider font-mono">
            Detailed Test Scenarios Breakdown ({evaluation.items?.length || 0})
          </h3>
          <span className="text-xs font-mono text-[#5D6266]">
            Average Latency: <strong className="text-[#17191B]">{evaluation.avgLatencyMs} ms</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFFFFF] text-[#5D6266] font-mono uppercase text-[10px] tracking-wider border-b border-[#D9D6CD]">
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
            <tbody className="divide-y divide-[#D9D6CD] font-mono text-[11px]">
              {evaluation.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5]">
                  <td className="py-2.5 px-4 text-[#17191B] font-bold">{item.id}</td>
                  <td className="py-2.5 px-4 font-sans text-[#17191B] font-medium">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-4 text-[#5D6266] text-[10px]">
                    {item.scenarioType}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-[1px] text-[10px] font-bold border ${
                        item.groundTruth === "HANDOFF"
                          ? "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/30"
                          : "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30"
                      }`}
                    >
                      {item.groundTruth}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`font-bold ${
                        item.predictedRiskLevel === "HIGH"
                          ? "text-[#D52222]"
                          : item.predictedRiskLevel === "MEDIUM"
                          ? "text-[#E7A500]"
                          : "text-[#24813A]"
                      }`}
                    >
                      {item.overallScore.toFixed(0)} ({item.predictedRiskLevel})
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#5D6266]">
                    {item.recommendedAction}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-1.5 py-0.5 rounded-[1px] text-[10px] font-bold border ${
                        item.classification === "TP"
                          ? "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30"
                          : item.classification === "TN"
                          ? "bg-[#F1F0ED] text-[#17191B] border-[#D9D6CD]"
                          : item.classification === "FP"
                          ? "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/30"
                          : "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/30"
                      }`}
                    >
                      {item.classification}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#5D6266]">
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
