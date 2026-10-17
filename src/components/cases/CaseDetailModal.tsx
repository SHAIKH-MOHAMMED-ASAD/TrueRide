"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Camera,
  XCircle,
  FileText,
  User,
  Clock,
  Send,
  Smartphone,
  MapPin,
  Sparkles,
} from "lucide-react";
import { RiskBadge, ActionBadge, EvidenceQualityBadge } from "../common/RiskBadge";
import { CategoryRadarBar } from "../common/CategoryRadarBar";

interface CaseDetailModalProps {
  caseId: string;
  onClose: () => void;
  onDecisionRecorded?: () => void;
}

export function CaseDetailModal({
  caseId,
  onClose,
  onDecisionRecorded,
}: CaseDetailModalProps) {
  const [caseData, setCaseData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState("DISMISSED_FALSE_POSITIVE");
  const [reason, setReason] = useState("");
  const [reviewer, setReviewer] = useState("T&S Analyst (Demo Role)");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setCaseData(data.case);
    } catch (err) {
      console.error("Failed to load case detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setMessage({ text: "Please provide a decision explanation / reason.", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      let newStatus = "UNDER_INVESTIGATION";
      if (decision === "DISMISSED_FALSE_POSITIVE") newStatus = "DISMISSED_ALERT";
      else if (decision === "VERIFIED_LEGITIMATE") newStatus = "VERIFIED_LEGITIMATE";
      else if (decision === "CONFIRMED_ACCOUNT_HANDOFF") newStatus = "CONFIRMED_ACCOUNT_HANDOFF";
      else if (decision === "REQUESTED_VERIFICATION") newStatus = "VERIFICATION_REQUIRED";

      const res = await fetch(`/api/cases/${caseId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer,
          decision,
          reason,
          newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record decision");

      setMessage({ text: "Analyst decision recorded and persisted successfully.", type: "success" });
      await fetchDetails();
      if (onDecisionRecorded) onDecisionRecorded();
    } catch (err: any) {
      console.error("Error submitting decision:", err);
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!caseData && loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="p-6 rounded-2xl bg-[#0c162c] text-slate-300 font-mono text-sm">
          Loading investigation evidence dossier...
        </div>
      </div>
    );
  }

  if (!caseData) return null;

  const assessment = caseData.assessment;
  const session = assessment?.sessionEvent;
  const rider = caseData.rider;
  const baseline = rider?.baselines?.[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0c162c] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-950 border border-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  {caseData.caseNumber}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                  Status: {caseData.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rider: {rider?.name} ({caseData.riderId}) • Session: {session?.sessionId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-mono border ${
                message.type === "success"
                  ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/70 border-rose-800 text-rose-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Assessment Summary Strip */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <RiskBadge
                score={assessment?.overallScore}
                level={assessment?.riskLevel}
                size="lg"
              />
              <ActionBadge action={assessment?.recommendedAction} />
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <EvidenceQualityBadge quality={assessment?.evidenceQuality || "HIGH"} />
              <span>
                Confidence:{" "}
                <strong className="text-white">
                  {assessment?.confidenceScore?.toFixed(0)}%
                </strong>
              </span>
              <span>
                Engine: <strong className="text-white">{assessment?.scoringVersion}</strong>
              </span>
            </div>
          </div>

          {/* Grid: Session Telemetry vs Baseline Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Current Session Telemetry */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Current Session Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Device ID:</span>
                  <span className="text-white truncate block">{session?.deviceId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Operating Zone:</span>
                  <span className="text-white">{session?.operatingZone}, {session?.city}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Interaction Cadence:</span>
                  <span className="text-amber-300 font-bold">
                    {session?.avgIntervalSec ? `${session.avgIntervalSec.toFixed(1)}s avg` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Acceptance Rate:</span>
                  <span className="text-white">
                    {session?.acceptanceRate ? `${Math.round(session.acceptanceRate * 100)}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Session Pattern:</span>
                  <span className="text-cyan-300">{session?.interactionPattern || "NORMAL"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Termination / Relogin:</span>
                  <span className="text-rose-300 font-semibold">{session?.sessionTerminationType || "NORMAL"}</span>
                </div>
              </div>
            </div>

            {/* Rider Historical Baseline */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <User className="w-3.5 h-3.5 text-teal-400" /> Individual Historical Baseline
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Known Device Registry:</span>
                  <span className="text-white truncate block">
                    {baseline?.knownDevices || "Enrolled phone"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Primary Zones:</span>
                  <span className="text-white truncate block">
                    {baseline?.primaryZones || "Assigned zone"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Characteristic Interval:</span>
                  <span className="text-emerald-400 font-bold">
                    {baseline?.avgInteractionInterval?.toFixed(1) || 14.5}s (±
                    {baseline?.stdInteractionInterval?.toFixed(1) || 3.0}s)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Typical Acceptance:</span>
                  <span className="text-white">
                    {baseline ? `${Math.round(baseline.typicalAcceptanceRate * 100)}%` : "90%"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Supporting Sessions:</span>
                  <span className="text-teal-300">{baseline?.supportingSessions || 40} sessions</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Observation Window:</span>
                  <span className="text-slate-300">{baseline?.observationWindow || "Last 30 Days"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Core Signal Categories Breakdown */}
          {assessment && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-3">
                Five Core Category Subscores & Weighted Contributions
              </h3>
              <CategoryRadarBar
                scores={{
                  behavioral: assessment.behavioralScore,
                  device: assessment.deviceScore,
                  location: assessment.locationScore,
                  sessionAccount: assessment.sessionAccountScore,
                  historical: assessment.historicalScore,
                }}
              />
            </div>
          )}

          {/* Triggered Signals List */}
          <div>
            <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Observable Signals & Scoring Explanations ({assessment?.signals?.length || 0})
            </h3>
            <div className="space-y-2">
              {assessment?.signals?.map((sig: any) => (
                <div
                  key={sig.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{sig.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {sig.signalCode}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{sig.explanation}</p>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs shrink-0 ${
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

                  <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Observed Value:</span>
                      <span className="text-amber-200">{sig.observedValue}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Expected Baseline:</span>
                      <span className="text-slate-300">{sig.expectedRange}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Review Decisions Timeline */}
          {caseData.decisions?.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-3">
                Audit Timeline of Analyst Decisions ({caseData.decisions.length})
              </h3>
              <div className="space-y-2">
                {caseData.decisions.map((dec: any) => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="font-bold text-cyan-300">
                        {dec.decision.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-500">
                        {new Date(dec.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{dec.reason}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Reviewer: {dec.reviewer} • Status transitioned to {dec.newStatus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Review Action Panel */}
          <form
            onSubmit={handleSubmitDecision}
            className="p-4 rounded-xl bg-[#091224] border border-cyan-500/30 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Record Trust & Safety Decision
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  Select Resolution Action:
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="DISMISSED_FALSE_POSITIVE">
                    Dismiss False Positive (Protects baseline from penalty)
                  </option>
                  <option value="VERIFIED_LEGITIMATE">
                    Verified Legitimate (Identity authenticated)
                  </option>
                  <option value="CONFIRMED_ACCOUNT_HANDOFF">
                    Confirm Account Handoff (Unauthorized rental finding)
                  </option>
                  <option value="REQUESTED_VERIFICATION">
                    Request Step-Up Biometric Check
                  </option>
                  <option value="ESCALATE_INVESTIGATION">
                    Escalate to Senior Fraud Team
                  </option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  Reviewer Persona / Role:
                </label>
                <input
                  type="text"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                Investigation Notes & Justification (Required for audit compliance):
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detail why this case is legitimate, false-positive weather glitch, or confirmed rental handoff..."
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Action permanently persists to SQLite & emits immutable AuditEvent
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-slate-950" />
                <span>{submitting ? "Persisting..." : "Save Case Decision"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
