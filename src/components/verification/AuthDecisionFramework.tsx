"use client";

import React, { useState } from "react";
import {
  User,
  Key,
  ShieldCheck,
  Camera,
  Cpu,
  Activity,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Mic,
  Radio,
} from "lucide-react";

export interface AuthMethod {
  method: string;
  howItWorks: string;
  purpose: string;
  role: string;
  band: string;
}

export const AUTHENTICATION_METHODS: AuthMethod[] = [
  {
    method: "Email and password",
    howItWorks: "User enters login credentials",
    purpose: "Basic authentication",
    role: "Initial platform onboarding & account enrollment gate",
    band: "Stage 01 Entry",
  },
  {
    method: "OTP verification",
    howItWorks: "User enters a one-time code",
    purpose: "Additional identity verification",
    role: "Cryptographic SIM-bound 6-digit challenge factor",
    band: "Step-Up Factor 1",
  },
  {
    method: "Multi-Factor Authentication (MFA)",
    howItWorks: "Uses two or more independent verification factors",
    purpose: "Stronger account security",
    role: "Possession (Hardware SIM) + Inherence (Live Facial & Voice)",
    band: "High-Risk L2/L3",
  },
  {
    method: "Biometric authentication",
    howItWorks: "Uses fingerprint or facial recognition",
    purpose: "Verify the user",
    role: "512-dim vector cosine similarity match against reference portrait",
    band: "Step-Up Factor 2",
  },
  {
    method: "Voice biometric challenge",
    howItWorks: "User speaks a dynamic randomized security passphrase",
    purpose: "Verify acoustic voiceprint & prevent deepfakes",
    role: "Acoustic pitch/timbre F0 vector match + anti-replay dynamic phrase liveness",
    band: "Step-Up Factor 3",
  },
  {
    method: "Device authentication",
    howItWorks: "Checks a registered or trusted device",
    purpose: "Identify unfamiliar devices",
    role: "IMEI, IMSI & hardware fingerprint anomaly scoring",
    band: "Category B Engine",
  },
  {
    method: "Behavioral analysis",
    howItWorks: "Analyzes typing, navigation, or transaction patterns",
    purpose: "Detect unusual behavior",
    role: "Touch cadence motor drift & delivery acceptance pace tracking",
    band: "Category A Engine",
  },
  {
    method: "Risk-based authentication",
    howItWorks: "Requests additional verification when risk is high",
    purpose: "Balance security and convenience",
    role: "Proportionate L0-L3 router: Never routine login friction",
    band: "Stage 03 Core",
  },
];

type SimulationPath =
  | "all"
  | "low-risk"
  | "high-risk-verified"
  | "high-risk-blocked"
  | "credential-deny";

/**
 * 7 Authentication Methods Matrix Table
 */
export function AuthMethodsTable() {
  const getIcon = (method: string) => {
    switch (method) {
      case "Email and password":
        return <Key className="w-3.5 h-3.5 text-[#06B6D4]" />;
      case "OTP verification":
        return <Smartphone className="w-3.5 h-3.5 text-[#06B6D4]" />;
      case "Multi-Factor Authentication (MFA)":
        return <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />;
      case "Biometric authentication":
        return <Camera className="w-3.5 h-3.5 text-[#FFD900]" />;
      case "Voice biometric challenge":
        return <Mic className="w-3.5 h-3.5 text-[#FFD900]" />;
      case "Device authentication":
        return <Cpu className="w-3.5 h-3.5 text-[#06B6D4]" />;
      case "Behavioral analysis":
        return <Activity className="w-3.5 h-3.5 text-[#FFD900]" />;
      case "Risk-based authentication":
        return <ShieldAlert className="w-3.5 h-3.5 text-[#FFD900]" />;
      default:
        return <Key className="w-3.5 h-3.5 text-[#06B6D4]" />;
    }
  };

  return (
    <div className="overflow-x-auto bg-[#0D1117] border border-[#30363D] rounded-[2px] shadow-sm">
      <table className="w-full text-left font-mono text-xs">
        <thead>
          <tr className="border-b border-[#21262D] text-[10px] text-[#8B949E] uppercase bg-[#161B22]">
            <th className="py-3 px-4">Method</th>
            <th className="py-3 px-4">How it works</th>
            <th className="py-3 px-4">Purpose</th>
            <th className="py-3 px-4 text-[#FFD900]">TrueRide Engine Role</th>
            <th className="py-3 px-4">Invocation Layer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F242C] text-[#C9D1D9]">
          {AUTHENTICATION_METHODS.map((row, idx) => (
            <tr
              key={idx}
              className={`hover:bg-[#161B22]/70 transition ${
                row.method === "Risk-based authentication" ? "bg-[#FFD900]/5" : ""
              }`}
            >
              <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                {getIcon(row.method)}
                <span>{row.method}</span>
              </td>
              <td className="py-3 px-4 text-[#94A3B8]">{row.howItWorks}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-0.5 rounded-[1px] text-[11px] ${
                    row.method === "Risk-based authentication"
                      ? "bg-[#FFD900] text-[#070C18] font-bold"
                      : row.method === "Multi-Factor Authentication (MFA)"
                      ? "bg-[#22C55E]/10 text-[#22C55E]"
                      : row.method === "Behavioral analysis"
                      ? "bg-[#FFD900]/10 text-[#FFD900]"
                      : "bg-[#1E293B] text-slate-300"
                  }`}
                >
                  {row.purpose}
                </span>
              </td>
              <td className="py-3 px-4 text-[#38BDF8]">{row.role}</td>
              <td className="py-3 px-4">
                <span className="px-1.5 py-0.5 rounded-[1px] bg-[#161B22] border border-[#30363D] text-[#94A3B8] text-[10px]">
                  {row.band}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Interactive Decision Flowchart with Live Path Simulator
 */
export function AuthDecisionFlowchart() {
  const [activeSimulation, setActiveSimulation] = useState<SimulationPath>("all");

  const isHighlighted = (nodeKey: string): boolean => {
    if (activeSimulation === "all") return true;

    switch (activeSimulation) {
      case "low-risk":
        return [
          "user",
          "login",
          "auth-system",
          "verified-gate",
          "gate-yes",
          "tx-details",
          "fraud-model",
          "risk-score",
          "low-risk-branch",
          "approve-low",
        ].includes(nodeKey);
      case "high-risk-verified":
        return [
          "user",
          "login",
          "auth-system",
          "verified-gate",
          "gate-yes",
          "tx-details",
          "fraud-model",
          "risk-score",
          "high-risk-branch",
          "add-verify",
          "verified-branch",
          "approve-high",
        ].includes(nodeKey);
      case "high-risk-blocked":
        return [
          "user",
          "login",
          "auth-system",
          "verified-gate",
          "gate-yes",
          "tx-details",
          "fraud-model",
          "risk-score",
          "high-risk-branch",
          "add-verify",
          "failed-branch",
          "hold-block",
        ].includes(nodeKey);
      case "credential-deny":
        return [
          "user",
          "login",
          "auth-system",
          "verified-gate",
          "gate-no",
          "deny-gate",
        ].includes(nodeKey);
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controller Toolbar */}
      <div className="p-3 bg-[#0D1117] border border-[#1E293B] rounded-[2px] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#FFD900] flex items-center gap-1 font-mono">
            <Play className="w-3 h-3 text-[#FFD900]" />
            <span>Simulate Flow:</span>
          </span>
          <div className="flex flex-wrap gap-1.5 font-mono">
            <button
              onClick={() => setActiveSimulation("all")}
              className={`px-2 py-1 rounded-[1px] text-[10px] font-bold transition cursor-pointer ${
                activeSimulation === "all"
                  ? "bg-[#334155] text-white"
                  : "bg-[#161B22] text-[#94A3B8] hover:text-white border border-[#30363D]"
              }`}
            >
              All Routes
            </button>
            <button
              onClick={() => setActiveSimulation("low-risk")}
              className={`px-2 py-1 rounded-[1px] text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                activeSimulation === "low-risk"
                  ? "bg-[#10B981] text-[#070C18]"
                  : "bg-[#062D1F] text-[#34D399] border border-[#10B981]/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Low Risk (Approve)</span>
            </button>
            <button
              onClick={() => setActiveSimulation("high-risk-verified")}
              className={`px-2 py-1 rounded-[1px] text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                activeSimulation === "high-risk-verified"
                  ? "bg-[#FFD900] text-[#070C18]"
                  : "bg-[#382606] text-[#FCD34D] border border-[#FFD900]/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>High Risk &rarr; Verified</span>
            </button>
            <button
              onClick={() => setActiveSimulation("high-risk-blocked")}
              className={`px-2 py-1 rounded-[1px] text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                activeSimulation === "high-risk-blocked"
                  ? "bg-[#EF4444] text-white"
                  : "bg-[#3F0E0E] text-[#FCA5A5] border border-[#EF4444]/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>High Risk &rarr; Hold / Block</span>
            </button>
            <button
              onClick={() => setActiveSimulation("credential-deny")}
              className={`px-2 py-1 rounded-[1px] text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                activeSimulation === "credential-deny"
                  ? "bg-[#991B1B] text-white"
                  : "bg-[#1F1315] text-[#F87171] border border-[#991B1B]/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Credential Deny</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setActiveSimulation("all")}
          className="text-[10px] text-[#64748B] hover:text-[#94A3B8] flex items-center gap-1 transition cursor-pointer font-mono"
          title="Reset path highlight"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Visual Node Diagram */}
      <div className="relative max-w-3xl mx-auto space-y-4 font-mono text-xs">
        {/* Step 1: User */}
        <div className="flex flex-col items-center">
          <div
            className={`px-6 py-2.5 rounded-[2px] border transition-all flex items-center gap-2 ${
              isHighlighted("user")
                ? "bg-[#161B22] border-[#FFD900] text-white shadow-md"
                : "opacity-30 bg-[#0D1117] border-[#30363D] text-[#64748B]"
            }`}
          >
            <User className="w-4 h-4 text-[#FFD900]" />
            <span className="font-bold uppercase tracking-wider">User</span>
          </div>
          <div
            className={`w-0.5 h-4 transition-all ${
              isHighlighted("user") && isHighlighted("login")
                ? "bg-[#06B6D4]"
                : "bg-[#1E293B]"
            }`}
          />

          {/* Step 2: Login / Registration */}
          <div
            className={`px-6 py-2 rounded-[2px] border transition-all flex items-center gap-2 ${
              isHighlighted("login")
                ? "bg-[#070C18] border-[#06B6D4] text-[#06B6D4] shadow-md"
                : "opacity-30 bg-[#0D1117] border-[#30363D] text-[#64748B]"
            }`}
          >
            <Key className="w-4 h-4 text-[#06B6D4]" />
            <span className="font-bold">Login / Registration</span>
          </div>
          <div
            className={`w-0.5 h-4 transition-all ${
              isHighlighted("login") && isHighlighted("auth-system")
                ? "bg-[#06B6D4]"
                : "bg-[#1E293B]"
            }`}
          />

          {/* Step 3: Authentication System */}
          <div
            className={`px-6 py-2 rounded-[2px] border transition-all flex items-center gap-2 ${
              isHighlighted("auth-system")
                ? "bg-[#161B22] border-[#38BDF8] text-white shadow-md"
                : "opacity-30 bg-[#0D1117] border-[#30363D] text-[#64748B]"
            }`}
          >
            <Cpu className="w-4 h-4 text-[#38BDF8]" />
            <span className="font-bold">Authentication System</span>
          </div>
          <div
            className={`w-0.5 h-4 transition-all ${
              isHighlighted("auth-system") && isHighlighted("verified-gate")
                ? "bg-[#FFD900]"
                : "bg-[#1E293B]"
            }`}
          />

          {/* Step 4: Decision Diamond 1: User Verified? */}
          <div
            className={`px-5 py-2.5 rounded-[2px] border-2 transition-all flex items-center gap-2 ${
              isHighlighted("verified-gate")
                ? "bg-[#1E293B] border-[#FFD900] text-white shadow-lg"
                : "opacity-30 bg-[#0D1117] border-[#30363D] text-[#64748B]"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#FFD900]" />
            <span className="font-bold uppercase tracking-wider text-xs">
              User Verified?
            </span>
          </div>
        </div>

        {/* Split from User Verified?: Left (No -> Deny) vs Right (Yes -> Transaction Details) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Branch Left: [No] -> Deny */}
          <div
            className={`p-3 rounded-[2px] border transition-all flex flex-col items-center ${
              isHighlighted("gate-no")
                ? "bg-[#3F0E0E]/40 border-[#EF4444]"
                : "opacity-25 bg-[#0D1117] border-[#1E293B]"
            }`}
          >
            <span className="text-[11px] font-bold text-[#EF4444] mb-2">[ No ]</span>
            <div
              className={`px-5 py-2 rounded-[2px] border font-bold flex items-center gap-2 ${
                isHighlighted("deny-gate")
                  ? "bg-[#3F0E0E] border-[#EF4444] text-[#FCA5A5]"
                  : "bg-[#161B22] border-[#30363D] text-[#64748B]"
              }`}
            >
              <XCircle className="w-4 h-4 text-[#EF4444]" />
              <span>Deny</span>
            </div>
            <span className="text-[10px] text-[#64748B] mt-2">
              Access blocked at gateway
            </span>
          </div>

          {/* Branch Right: [Yes] -> Transaction Details */}
          <div
            className={`p-3 rounded-[2px] border transition-all flex flex-col items-center ${
              isHighlighted("gate-yes")
                ? "bg-[#062D1F]/40 border-[#10B981]"
                : "opacity-25 bg-[#0D1117] border-[#1E293B]"
            }`}
          >
            <span className="text-[11px] font-bold text-[#10B981] mb-2">[ Yes ]</span>
            <div
              className={`px-5 py-2 rounded-[2px] border font-bold flex items-center gap-2 ${
                isHighlighted("tx-details")
                  ? "bg-[#062D1F] border-[#10B981] text-[#A7F3D0]"
                  : "bg-[#161B22] border-[#30363D] text-[#64748B]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Transaction Details</span>
            </div>
            <span className="text-[10px] text-[#64748B] mt-2">
              Delivery micro-cadence &amp; telemetry stream
            </span>
          </div>
        </div>

        {/* Pipeline continues under Transaction Details */}
        <div className="flex flex-col items-center pt-2">
          <div
            className={`w-0.5 h-4 transition-all ${
              isHighlighted("tx-details") && isHighlighted("fraud-model")
                ? "bg-[#06B6D4]"
                : "bg-[#1E293B]"
            }`}
          />

          {/* Fraud Detection Model */}
          <div
            className={`p-4 rounded-[2px] border-2 max-w-md w-full text-center transition-all ${
              isHighlighted("fraud-model")
                ? "bg-[#070C18] border-[#06B6D4] text-white shadow-lg"
                : "opacity-25 bg-[#0D1117] border-[#30363D] text-[#64748B]"
            }`}
          >
            <div className="flex items-center justify-center gap-2 font-bold text-sm text-[#06B6D4]">
              <Activity className="w-4 h-4" />
              <span>Fraud Detection Model</span>
            </div>
            <div className="text-[11px] text-[#94A3B8] font-sans mt-1">
              Continuous comparison of touch intervals, device ID &amp; corridor consistency
            </div>
          </div>

          <div
            className={`w-0.5 h-4 transition-all ${
              isHighlighted("fraud-model") && isHighlighted("risk-score")
                ? "bg-[#FFD900]"
                : "bg-[#1E293B]"
            }`}
          />

          {/* Risk Score */}
          <div
            className={`px-5 py-2 rounded-[2px] border transition-all flex items-center gap-2 font-bold ${
              isHighlighted("risk-score")
                ? "bg-[#1F242C] border-[#FFD900] text-white shadow-md"
                : "opacity-25 bg-[#0D1117] border-[#30363D] text-[#64748B]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FFD900]" />
            <span>Risk Score</span>
          </div>
        </div>

        {/* Split: Low Risk vs High Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Branch 1: Low Risk -> Approve */}
          <div
            className={`p-4 rounded-[2px] border flex flex-col justify-between space-y-3 transition-all ${
              isHighlighted("low-risk-branch")
                ? "bg-[#062D1F]/50 border-[#10B981]"
                : "opacity-25 bg-[#0D1117] border-[#1E293B]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#10B981]/20">
                <span className="font-bold text-[#10B981]">Low Risk</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#10B981]/20 text-[#A7F3D0]">
                  Score &lt; 50 (L0 / L1)
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-sans mt-2">
                Behavioral touch cadence matches enrolled baseline. No security flags.
              </p>
            </div>

            <div className="pt-2">
              <div
                className={`p-3 rounded-[2px] border font-bold text-center flex items-center justify-center gap-2 ${
                  isHighlighted("approve-low")
                    ? "bg-[#062D1F] border-[#10B981] text-[#A7F3D0]"
                    : "bg-[#161B22] border-[#30363D] text-[#64748B]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Approve</span>
              </div>
              <span className="text-[10px] text-[#64748B] block text-center mt-1 font-sans">
                Silent execution • Zero routine friction
              </span>
            </div>
          </div>

          {/* Branch 2: High Risk -> Additional Verification */}
          <div
            className={`p-4 rounded-[2px] border flex flex-col justify-between space-y-3 transition-all ${
              isHighlighted("high-risk-branch")
                ? "bg-[#382606]/50 border-[#FFD900]"
                : "opacity-25 bg-[#0D1117] border-[#1E293B]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#FFD900]/20">
                <span className="font-bold text-[#FFD900]">High Risk</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#FFD900]/20 text-[#FDE68A]">
                  Score &ge; 50 (L2 / L3)
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-sans mt-2">
                Motor cadence collapse, SIM swap, or uncorroborated route leap detected.
              </p>
            </div>

            {/* Additional Verification Box */}
            <div
              className={`p-3 rounded-[2px] border space-y-2 transition-all ${
                isHighlighted("add-verify")
                  ? "bg-[#070C18] border-[#FFD900]"
                  : "bg-[#0D1117] border-[#30363D]"
              }`}
            >
              <div className="text-[11px] font-bold text-[#FFD900] flex items-center justify-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Additional Verification</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] text-center font-sans">
                Factor 1 (SIM OTP) + Factor 2 (Live Face Match)
              </div>

              {/* Split from Additional Verification: Verified vs Failed / Suspicious */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E293B]">
                {/* Verified -> Approve */}
                <div
                  className={`p-2.5 rounded-[1px] border text-center transition-all ${
                    isHighlighted("verified-branch")
                      ? "bg-[#062D1F] border-[#10B981] text-[#A7F3D0]"
                      : "opacity-25 bg-[#0D1117] border-[#30363D] text-[#64748B]"
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#10B981]">[ Verified ]</div>
                  <div className="text-xs font-bold text-white mt-1">Approve</div>
                  <span className="text-[9px] text-[#A7F3D0] block mt-0.5 font-sans">
                    Clearance Token
                  </span>
                </div>

                {/* Failed / Suspicious -> Hold or Block */}
                <div
                  className={`p-2.5 rounded-[1px] border text-center transition-all ${
                    isHighlighted("failed-branch")
                      ? "bg-[#3F0E0E] border-[#EF4444] text-[#FCA5A5]"
                      : "opacity-25 bg-[#0D1117] border-[#30363D] text-[#64748B]"
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#EF4444]">
                    [ Failed / Suspicious ]
                  </div>
                  <div className="text-xs font-bold text-white mt-1">Hold or Block</div>
                  <span className="text-[9px] text-[#FCA5A5] block mt-0.5 font-sans">
                    Supervisor Triage
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthDecisionFramework({
  title = "Authentication Methods & Decision Flow Architecture",
  subtitle = "Layered multi-factor security combined with real-time behavioral risk scoring.",
  compact = false,
  viewMode = "tabs",
}: {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  viewMode?: "tabs" | "stacked";
}) {
  const [activeTab, setActiveTab] = useState<"flowchart" | "matrix">("flowchart");

  return (
    <div className="bg-[#070C18] border border-[#1E293B] rounded-[2px] shadow-xl overflow-hidden font-mono text-xs">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-[#0D1117] border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-[#FFD900] uppercase">
              SPECIFICATION ARCHITECTURE
            </span>
            <span className="text-[#475569]">•</span>
            <span className="text-[10px] text-[#94A3B8] uppercase">
              7 Methods Matrix &amp; Real-Time Decision Tree
            </span>
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-tight font-sans">
            {title}
          </h3>
          <p className="text-[11px] text-[#94A3B8] font-sans mt-0.5 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Tab Selector (only when in tabs mode) */}
        {viewMode === "tabs" && (
          <div className="flex items-center gap-1.5 p-1 bg-[#161B22] border border-[#30363D] rounded-[2px] shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveTab("flowchart")}
              className={`px-3 py-1.5 rounded-[1px] font-bold transition text-xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === "flowchart"
                  ? "bg-[#06B6D4] text-[#070C18]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Decision Flowchart</span>
            </button>
            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-3 py-1.5 rounded-[1px] font-bold transition text-xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === "matrix"
                  ? "bg-[#06B6D4] text-[#070C18]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>7 Authentication Methods</span>
            </button>
          </div>
        )}
      </div>

      {/* Render Content Based on viewMode */}
      {viewMode === "stacked" ? (
        <div className="space-y-6">
          {/* Stacked Section A: The 7 Authentication Methods Table */}
          <div className="p-4 sm:p-6 border-b border-[#1E293B]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FFD900]" />
                <span>Authentication &amp; Security Layer Matrix</span>
              </span>
              <span className="text-[11px] font-mono text-[#8B949E]">
                7 Defense Layers • Proportional Invocation
              </span>
            </div>
            <AuthMethodsTable />
          </div>

          {/* Stacked Section B: Interactive Decision Flowchart */}
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B] gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#06B6D4] uppercase">
                  DECISION TREE SPECIFICATION
                </span>
                <h4 className="text-sm font-bold text-white uppercase font-mono mt-0.5">
                  End-to-End Fraud Detection &amp; Verification Decision Flow
                </h4>
              </div>
              <span className="text-xs font-mono text-[#8B949E] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span>Synchronous Execution (&lt;0.05ms)</span>
              </span>
            </div>
            <AuthDecisionFlowchart />
          </div>
        </div>
      ) : (
        /* Tabs Mode */
        <div className="p-4 sm:p-6">
          {activeTab === "flowchart" ? (
            <AuthDecisionFlowchart />
          ) : (
            <AuthMethodsTable />
          )}
        </div>
      )}
    </div>
  );
}
