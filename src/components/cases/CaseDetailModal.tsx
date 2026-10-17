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
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="p-6 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] text-[#17191B] font-mono text-sm shadow-xl">
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* Header: Graphite Background with Yellow Accents */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#3F4241] bg-[#2F3130] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#D52222] flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-white tracking-tight">
                  {caseData.caseNumber}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-[1px] font-mono font-bold bg-[#FFD900] text-[#17191B]">
                  STATUS: {caseData.status}
                </span>
              </div>
              <p className="text-xs text-[#D5D7D6] mt-0.5">
                Rider: {rider?.name} ({caseData.riderId}) • Session: {session?.sessionId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-[#D5D7D6] hover:text-white hover:bg-[#3F4241] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#F7F7F5]">
          {message && (
            <div
              className={`p-3 rounded-[2px] text-xs font-mono border ${
                message.type === "success"
                  ? "bg-[#E8F4E8] border-[#24813A]/40 text-[#24813A]"
                  : "bg-[#FCE5E3] border-[#D52222]/40 text-[#D52222]"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Assessment Summary Strip */}
          <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <RiskBadge
                score={assessment?.overallScore}
                level={assessment?.riskLevel}
                size="lg"
              />
              <ActionBadge action={assessment?.recommendedAction} />
            </div>

            <div className="flex items-center gap-4 text-[#5D6266] font-mono text-[11px]">
              <EvidenceQualityBadge quality={assessment?.evidenceQuality || "HIGH"} />
              <span>
                Confidence:{" "}
                <strong className="text-[#17191B]">
                  {assessment?.confidenceScore?.toFixed(0)}%
                </strong>
              </span>
              <span>
                Engine: <strong className="text-[#17191B]">{assessment?.scoringVersion}</strong>
              </span>
            </div>
          </div>

          {/* Grid: Session Telemetry vs Baseline Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Current Session Telemetry */}
            <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] space-y-2 shadow-xs">
              <h3 className="font-bold text-[#17191B] uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5 pb-2 border-b border-[#D9D6CD]">
                <Smartphone className="w-3.5 h-3.5 text-[#17191B]" /> Current Session Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Device ID:</span>
                  <span className="text-[#17191B] font-bold truncate block">{session?.deviceId}</span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Operating Zone:</span>
                  <span className="text-[#17191B]">{session?.operatingZone}, {session?.city}</span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Interaction Cadence:</span>
                  <span className="text-[#D52222] font-bold">
                    {session?.avgIntervalSec ? `${session.avgIntervalSec.toFixed(1)}s avg` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Acceptance Rate:</span>
                  <span className="text-[#17191B]">
                    {session?.acceptanceRate ? `${Math.round(session.acceptanceRate * 100)}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Session Pattern:</span>
                  <span className="text-[#17191B] font-semibold">{session?.interactionPattern || "NORMAL"}</span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Termination / Relogin:</span>
                  <span className="text-[#D52222] font-bold">{session?.sessionTerminationType || "NORMAL"}</span>
                </div>
              </div>
            </div>

            {/* Rider Historical Baseline */}
            <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] space-y-2 shadow-xs">
              <h3 className="font-bold text-[#17191B] uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5 pb-2 border-b border-[#D9D6CD]">
                <User className="w-3.5 h-3.5 text-[#17191B]" /> Individual Historical Baseline
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Known Device Registry:</span>
                  <span className="text-[#17191B] truncate block">
                    {baseline?.knownDevices || "Enrolled phone"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Primary Zones:</span>
                  <span className="text-[#17191B] truncate block">
                    {baseline?.primaryZones || "Assigned zone"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Characteristic Interval:</span>
                  <span className="text-[#24813A] font-bold">
                    {baseline?.avgInteractionInterval?.toFixed(1) || 14.5}s (±
                    {baseline?.stdInteractionInterval?.toFixed(1) || 3.0}s)
                  </span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Typical Acceptance:</span>
                  <span className="text-[#17191B]">
                    {baseline ? `${Math.round(baseline.typicalAcceptanceRate * 100)}%` : "90%"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Supporting Sessions:</span>
                  <span className="text-[#17191B]">{baseline?.supportingSessions || 40} sessions</span>
                </div>
                <div>
                  <span className="text-[#8B8D8C] block text-[10px]">Observation Window:</span>
                  <span className="text-[#17191B]">{baseline?.observationWindow || "Last 30 Days"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Core Signal Categories Breakdown */}
          {assessment && (
            <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
              <h3 className="font-bold text-[#17191B] uppercase tracking-wider text-[11px] font-mono mb-3">
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
            <h3 className="font-bold text-[#17191B] uppercase tracking-wider text-[11px] font-mono mb-2">
              Observable Signals & Scoring Explanations ({assessment?.signals?.length || 0})
            </h3>
            <div className="space-y-2">
              {assessment?.signals?.map((sig: any) => (
                <div
                  key={sig.id}
                  className="p-3 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] text-xs shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17191B]">{sig.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[1px] bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD]">
                          {sig.signalCode}
                        </span>
                      </div>
                      <p className="text-[#5D6266] text-[11px] mt-1">{sig.explanation}</p>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded-[1px] border ${
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

                  <div className="mt-2 pt-2 border-t border-[#D9D6CD] grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-[#8B8D8C] block text-[10px]">Observed Value:</span>
                      <span className="text-[#D52222] font-semibold">{sig.observedValue}</span>
                    </div>
                    <div>
                      <span className="text-[#8B8D8C] block text-[10px]">Expected Baseline:</span>
                      <span className="text-[#17191B]">{sig.expectedRange}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Review Decisions Timeline */}
          {caseData.decisions?.length > 0 && (
            <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
              <h3 className="font-bold text-[#17191B] uppercase tracking-wider text-[11px] font-mono mb-3">
                Audit Timeline of Analyst Decisions ({caseData.decisions.length})
              </h3>
              <div className="space-y-2">
                {caseData.decisions.map((dec: any) => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="font-bold text-[#17191B]">
                        {dec.decision.replace(/_/g, " ")}
                      </span>
                      <span className="text-[#8B8D8C]">
                        {new Date(dec.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[#5D6266] text-[11px]">{dec.reason}</p>
                    <div className="text-[10px] text-[#8B8D8C] font-mono mt-1 pt-1 border-t border-[#D9D6CD]">
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
            className="p-4 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD] shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-[#D9D6CD]">
              <CheckCircle2 className="w-4 h-4 text-[#17191B]" />
              <h3 className="font-bold text-[#17191B] text-xs uppercase tracking-wider font-mono">
                Record Trust & Safety Decision
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[#5D6266] block mb-1 font-mono text-[11px] font-bold">
                  Select Resolution Action:
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full p-2 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-[#17191B] font-mono text-xs focus:outline-none focus:border-[#17191B]"
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
                <label className="text-[#5D6266] block mb-1 font-mono text-[11px] font-bold">
                  Reviewer Persona / Role:
                </label>
                <input
                  type="text"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  className="w-full p-2 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-[#17191B] font-mono text-xs focus:outline-none focus:border-[#17191B]"
                />
              </div>
            </div>

            <div>
              <label className="text-[#5D6266] block mb-1 font-mono text-[11px] font-bold">
                Investigation Notes & Justification (Required for audit compliance):
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detail why this case is legitimate, false-positive weather glitch, or confirmed rental handoff..."
                className="w-full p-2 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-[#17191B] text-xs focus:outline-none focus:border-[#17191B] placeholder-[#8B8D8C]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[#8B8D8C] font-mono">
                Action permanently persists to SQLite & emits immutable AuditEvent
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[2px] font-bold text-xs text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-[#17191B]" />
                <span>{submitting ? "Persisting..." : "Save Case Decision"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
