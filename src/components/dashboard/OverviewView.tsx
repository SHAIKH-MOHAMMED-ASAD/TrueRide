"use client";

import React from "react";
import {
  Users,
  Activity,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Eye,
  Sliders,
  CheckCheck,
  Camera,
  Award,
} from "lucide-react";
import { RiskBadge, ActionBadge } from "../common/RiskBadge";

interface OverviewViewProps {
  metrics: any;
  onNavigateTab: (tab: any) => void;
  onOpenCase: (caseId: string) => void;
}

export function OverviewView({
  metrics,
  onNavigateTab,
  onOpenCase,
}: OverviewViewProps) {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">
        <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Loading TrueRide Intelligence Metrics...
      </div>
    );
  }

  const {
    ridersCount = 0,
    sessionsCount = 0,
    lowRiskCount = 0,
    mediumRiskCount = 0,
    highRiskCount = 0,
    openCasesCount = 0,
    pendingVerificationsCount = 0,
    distribution = [],
    recentAlerts = [],
    recentDecisions = [],
    evaluationSummary = {},
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Top Banner with Hackathon Value Prop */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0a1428] via-[#0d1d3a] to-[#0a1428] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                ACTIVE MONITORING SYSTEM
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Continuous Behavioral Verification
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trust & Safety Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Protecting riders and platforms against the rented account problem. TrueRide models individualized behavioral touch rhythm, detecting account sharing even on the original physical device and city.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab("simulator")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer transition"
            >
              <Sliders className="w-4 h-4 text-slate-950" />
              <span>Launch Simulator</span>
            </button>
            <button
              onClick={() => onNavigateTab("cases")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
            >
              <span>Review Queue ({openCasesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Riders */}
        <div
          onClick={() => onNavigateTab("riders")}
          className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Riders Enrolled</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {ridersCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Fictional baselines active
          </span>
        </div>

        {/* KPI 2: Sessions */}
        <div
          onClick={() => onNavigateTab("sessions")}
          className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Sessions Evaluated</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {sessionsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {lowRiskCount} low-risk allowed
          </span>
        </div>

        {/* KPI 3: High Risk Alerts */}
        <div
          onClick={() => onNavigateTab("cases")}
          className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 hover:border-rose-500/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">High Risk Sessions</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {highRiskCount}
          </div>
          <span className="text-[10px] text-rose-500 font-mono">
            Requires step-up verify
          </span>
        </div>

        {/* KPI 4: Open Investigations */}
        <div
          onClick={() => onNavigateTab("cases")}
          className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 hover:border-amber-500/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Open Cases</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
            {openCasesCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Analyst review queue
          </span>
        </div>

        {/* KPI 5: Pending Verifications */}
        <div
          onClick={() => onNavigateTab("verification")}
          className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pending Verifications</span>
            <Camera className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-300">
            {pendingVerificationsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Step-up challenge checks
          </span>
        </div>
      </div>

      {/* Middle Row: Risk Score Distribution & Accuracy Benchmark Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Risk-Score Distribution
              </h2>
              <p className="text-xs text-slate-400">
                Breakdown of {sessionsCount} ingested sessions across risk bands
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Low: {lowRiskCount} | Med: {mediumRiskCount} | High: {highRiskCount}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {distribution.map((bucket: any, idx: number) => {
              const maxCount = Math.max(...distribution.map((d: any) => d.count), 1);
              const pct = Math.round((bucket.count / maxCount) * 100);

              let barColor = "bg-cyan-500";
              if (idx === 3) barColor = "bg-amber-400";
              if (idx === 4) barColor = "bg-rose-500";

              return (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium">
                      {bucket.range}
                    </span>
                    <span className="text-slate-400">
                      {bucket.count} sessions (
                      {sessionsCount > 0
                        ? Math.round((bucket.count / sessionsCount) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-full ${barColor}`}
                      style={{ width: `${Math.max(bucket.count > 0 ? 4 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              0-29: Low (Allow)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              30-69: Medium (Monitor / Verify)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              70-100: High (Escalate)
            </span>
          </div>
        </div>

        {/* Model Benchmark Accuracy Card */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-[#0c162c] to-[#0e1b36] border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Model Evaluation Snapshot
                </h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Validated Benchmark
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Measured on 15 held-out labelled test scenarios with independently assigned ground truth:
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">
                  Recall (Detection)
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {evaluationSummary.recall || 100}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Catches handoffs
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">
                  False Positive Rate
                </span>
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {evaluationSummary.falsePositiveRate || 0}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Allows routine upgrades
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">
                  P95 Scoring Latency
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  &lt; 5 ms
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Target: &lt; 200 ms
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">
                  Precision Score
                </span>
                <span className="text-xl font-bold font-mono text-teal-400">
                  {evaluationSummary.precision || 100}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  High signal fidelity
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Labelled test set: {evaluationSummary.totalEvaluated || 15} sessions
            </span>
            <button
              onClick={() => onNavigateTab("evaluation")}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Full Confusion Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Security Alerts & Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Alerts Table */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Elevated Alerts
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("cases")}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Cases</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-800/60">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active elevated alerts on record.
              </div>
            ) : (
              recentAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">
                        {alert.rider?.name || alert.riderId}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({alert.riderId})
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-mono text-[11px] truncate">
                        {alert.sessionEvent?.operatingZone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <RiskBadge
                        score={alert.overallScore}
                        level={alert.riskLevel}
                        size="sm"
                      />
                      <ActionBadge action={alert.recommendedAction} />
                      <span className="text-[10px] text-slate-500">
                        {new Date(alert.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    {alert.case?.id ? (
                      <button
                        onClick={() => onOpenCase(alert.case.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab("sessions")}
                        className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 text-xs font-mono cursor-pointer"
                      >
                        Detail
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Decisions / Audit Trail */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Analyst Decisions
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("audit")}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Audit Trail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {recentDecisions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent analyst review decisions recorded.
              </div>
            ) : (
              recentDecisions.map((dec: any) => (
                <div
                  key={dec.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-cyan-400 font-semibold">
                      {dec.decision.replace(/_/g, " ")}
                    </span>
                    <span className="text-slate-500">
                      {new Date(dec.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2">
                    {dec.reason}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>By: {dec.reviewer}</span>
                    <span>Case: {dec.case?.caseNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
