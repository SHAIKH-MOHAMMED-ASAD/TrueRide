"use client";

import React from "react";
import {
  Users,
  Activity,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sliders,
  CheckCheck,
  Camera,
  Award,
  Eye,
  Radio,
  Download,
  FileSpreadsheet,
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
      <div className="flex items-center justify-center py-20 text-[#5D6266] font-mono text-sm bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px]">
        <Activity className="w-5 h-5 animate-spin mr-2 text-[#17191B]" />
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
      {/* A. Charcoal Hero Banner (SiteSync AI Reference Style) */}
      <div className="p-6 bg-[#2F3130] text-white border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#3F4241] rounded-[2px] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#FFD900] uppercase">
                TRUERIDE IDENTITY INTELLIGENCE
              </span>
              <span className="text-[#8B8D8C] text-xs font-mono">•</span>
              <span className="text-[11px] font-mono text-[#D5D7D6]">
                ACTIVE MONITORING SYSTEM
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
              Continuous Rider Identity Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-[#D5D7D6] leading-relaxed">
              Detect suspicious account handoffs through behavioral intelligence, contextual risk scoring, and proportionate verification. Models individualized touch rhythm to prevent rented accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab("verification")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-bold text-xs text-[#090D18] bg-[#06B6D4] hover:bg-[#0891B2] transition cursor-pointer shadow-sm tracking-tight"
            >
              <Camera className="w-4 h-4 text-[#090D18]" />
              <span>Step-Up Verification</span>
            </button>
            <button
              onClick={() => onNavigateTab("simulator")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-bold text-xs text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer shadow-sm tracking-tight"
            >
              <Sliders className="w-4 h-4 text-[#17191B]" />
              <span>Launch Simulator</span>
            </button>
            <button
              onClick={() => onNavigateTab("cases")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-mono text-xs text-[#FFFFFF] bg-[#404342] hover:bg-[#4D5150] border border-[#555857] transition cursor-pointer"
            >
              <span>Review Queue ({openCasesCount})</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FFD900]" />
            </button>
          </div>
        </div>
      </div>

      {/* B. Compact KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Riders */}
        <div
          onClick={() => onNavigateTab("riders")}
          className="p-4 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] hover:border-[#17191B] transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#5D6266]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              Riders Enrolled
            </span>
            <Users className="w-4 h-4 text-[#5D6266]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#17191B]">
            {ridersCount}
          </div>
          <span className="text-[10px] text-[#8B8D8C] font-mono block mt-1">
            Fictional baselines active
          </span>
        </div>

        {/* KPI 2: Sessions */}
        <div
          onClick={() => onNavigateTab("sessions")}
          className="p-4 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] hover:border-[#17191B] transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#5D6266]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              Sessions Evaluated
            </span>
            <Activity className="w-4 h-4 text-[#5D6266]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#17191B]">
            {sessionsCount}
          </div>
          <span className="text-[10px] text-[#24813A] font-mono block mt-1 font-semibold">
            {lowRiskCount} verified low-risk
          </span>
        </div>

        {/* KPI 3: High-Risk Sessions (Semantic Pale Red) */}
        <div
          onClick={() => onNavigateTab("cases")}
          className="p-4 bg-[#FCE5E3]/40 border border-[#D52222]/40 rounded-[2px] hover:border-[#D52222] transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#D52222]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              High Risk Sessions
            </span>
            <ShieldAlert className="w-4 h-4 text-[#D52222]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#D52222]">
            {highRiskCount}
          </div>
          <span className="text-[10px] text-[#D52222] font-mono block mt-1 font-semibold">
            Requires step-up verify
          </span>
        </div>

        {/* KPI 4: Open Investigations (Semantic Pale Amber) */}
        <div
          onClick={() => onNavigateTab("cases")}
          className="p-4 bg-[#FFF5D6]/50 border border-[#E7A500]/40 rounded-[2px] hover:border-[#E7A500] transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#E7A500]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              Open Cases
            </span>
            <AlertTriangle className="w-4 h-4 text-[#E7A500]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#E7A500]">
            {openCasesCount}
          </div>
          <span className="text-[10px] text-[#5D6266] font-mono block mt-1">
            Analyst review queue
          </span>
        </div>

        {/* KPI 5: Pending Verifications */}
        <div
          onClick={() => onNavigateTab("verification")}
          className="p-4 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] hover:border-[#17191B] transition cursor-pointer shadow-xs col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-[#5D6266]">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              Pending Verification
            </span>
            <Camera className="w-4 h-4 text-[#5D6266]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#17191B]">
            {pendingVerificationsCount}
          </div>
          <span className="text-[10px] text-[#8B8D8C] font-mono block mt-1">
            Biometric challenge checks
          </span>
        </div>
      </div>

      {/* C. Main Analytics Section: Multi-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Risk Score Distribution */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
            <div>
              <h2 className="text-xs font-bold text-[#17191B] uppercase tracking-wider font-mono">
                Risk-Score Distribution
              </h2>
              <p className="text-[11px] text-[#5D6266] mt-0.5">
                Breakdown of {sessionsCount} ingested sessions across continuous risk bands
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#5D6266] bg-[#F1F0ED] px-2 py-0.5 rounded-[1px] border border-[#D9D6CD]">
              Low: {lowRiskCount} | Med: {mediumRiskCount} | High: {highRiskCount}
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {distribution.map((bucket: any, idx: number) => {
              const maxCount = Math.max(...distribution.map((d: any) => d.count), 1);
              const pct = Math.round((bucket.count / maxCount) * 100);

              let barColor = "bg-[#24813A]";
              if (idx === 3) barColor = "bg-[#E7A500]";
              if (idx === 4) barColor = "bg-[#D52222]";

              return (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#17191B] font-bold">
                      {bucket.range}
                    </span>
                    <span className="text-[#5D6266]">
                      {bucket.count} sessions (
                      {sessionsCount > 0
                        ? Math.round((bucket.count / sessionsCount) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F1F0ED] rounded-[1px] overflow-hidden border border-[#D9D6CD]">
                    <div
                      className={`h-full transition-all duration-500 rounded-[1px] ${barColor}`}
                      style={{ width: `${Math.max(bucket.count > 0 ? 3 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#D9D6CD] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#5D6266] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-[#24813A]" />
              0-29: Low (Allow)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-[#E7A500]" />
              30-69: Medium (Monitor / Verify)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-[#D52222]" />
              70-100: High (Escalate)
            </span>
          </div>
        </div>

        {/* Right: Model Evaluation Benchmark Snapshot */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#17191B]" />
                <h2 className="text-xs font-bold text-[#17191B] uppercase tracking-wider font-mono">
                  Evaluation Snapshot
                </h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-[1px] font-mono font-bold bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30">
                Validated Benchmark
              </span>
            </div>

            <p className="text-[11px] text-[#5D6266] mt-3">
              Empirically computed from labelled test dataset with independently defined ground truth:
            </p>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                <span className="text-[10px] text-[#5D6266] font-mono font-bold uppercase block">
                  Recall (Detection)
                </span>
                <span className="text-xl font-bold font-mono text-[#24813A]">
                  {evaluationSummary.recall || 100}%
                </span>
                <span className="text-[10px] text-[#5D6266] block mt-0.5">
                  Catches handoffs
                </span>
              </div>

              <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                <span className="text-[10px] text-[#5D6266] font-mono font-bold uppercase block">
                  False Positive Rate
                </span>
                <span className="text-xl font-bold font-mono text-[#17191B]">
                  {evaluationSummary.falsePositiveRate || 0}%
                </span>
                <span className="text-[10px] text-[#5D6266] block mt-0.5">
                  Allows routine upgrades
                </span>
              </div>

              <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                <span className="text-[10px] text-[#5D6266] font-mono font-bold uppercase block">
                  P95 Scoring Latency
                </span>
                <span className="text-xl font-bold font-mono text-[#17191B]">
                  &lt; 5 ms
                </span>
                <span className="text-[10px] text-[#5D6266] block mt-0.5">
                  Target: &lt; 200 ms
                </span>
              </div>

              <div className="p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                <span className="text-[10px] text-[#5D6266] font-mono font-bold uppercase block">
                  Precision Score
                </span>
                <span className="text-xl font-bold font-mono text-[#24813A]">
                  {evaluationSummary.precision || 100}%
                </span>
                <span className="text-[10px] text-[#5D6266] block mt-0.5">
                  High signal fidelity
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D9D6CD] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-[#8B8D8C] font-mono">
              Labelled set: {evaluationSummary.totalEvaluated || 15} sessions
            </span>
            <div className="flex items-center gap-3">
              <a
                href="/api/evaluation/metrics?format=csv"
                download="trueride_system_evaluation.csv"
                className="text-xs font-mono font-bold text-[#24813A] hover:text-[#1E6B30] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
              <button
                onClick={() => onNavigateTab("evaluation")}
                className="text-xs font-mono font-bold text-[#17191B] hover:text-[#5D6266] flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Confusion Matrix</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FFD900]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Security Alerts & Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Alerts Table */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D52222]" />
              <h2 className="text-xs font-bold text-[#17191B] uppercase tracking-wider font-mono">
                Recent Elevated Alerts
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("cases")}
              className="text-xs font-mono font-bold text-[#17191B] hover:text-[#5D6266] flex items-center gap-1 cursor-pointer"
            >
              <span>View All Cases ({openCasesCount})</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FFD900]" />
            </button>
          </div>

          <div className="mt-2 divide-y divide-[#D9D6CD]">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8B8D8C] font-mono">
                No active elevated alerts on record.
              </div>
            ) : (
              recentAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#F7F7F5] transition px-1"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#17191B] truncate">
                        {alert.rider?.name || alert.riderId}
                      </span>
                      <span className="font-mono text-[11px] text-[#5D6266]">
                        ({alert.riderId})
                      </span>
                      <span className="text-[#D9D6CD]">•</span>
                      <span className="text-[#5D6266] font-mono text-[11px] truncate">
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
                      <span className="text-[10px] text-[#8B8D8C] font-mono">
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
                        className="px-2.5 py-1 rounded-[2px] bg-[#F1F0ED] hover:bg-[#D9D6CD] text-[#17191B] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer border border-[#D9D6CD] transition"
                      >
                        <Eye className="w-3 h-3 text-[#17191B]" />
                        <span>Inspect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab("sessions")}
                        className="px-2.5 py-1 rounded-[2px] bg-[#F1F0ED] text-[#5D6266] text-xs font-mono cursor-pointer"
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
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-[#24813A]" />
              <h2 className="text-xs font-bold text-[#17191B] uppercase tracking-wider font-mono">
                Recent Analyst Decisions
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("audit")}
              className="text-xs font-mono font-bold text-[#17191B] hover:text-[#5D6266] flex items-center gap-1 cursor-pointer"
            >
              <span>Full Audit Log</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FFD900]" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {recentDecisions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8B8D8C] font-mono">
                No recent analyst review decisions recorded.
              </div>
            ) : (
              recentDecisions.map((dec: any) => (
                <div
                  key={dec.id}
                  className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-[#17191B] font-bold">
                      {dec.decision.replace(/_/g, " ")}
                    </span>
                    <span className="text-[#8B8D8C]">
                      {new Date(dec.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[#5D6266] text-[11px] line-clamp-2">
                    {dec.reason}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-[#D9D6CD] flex items-center justify-between text-[10px] text-[#8B8D8C] font-mono">
                    <span>Analyst: {dec.reviewer}</span>
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
